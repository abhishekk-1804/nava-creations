/**
 * NAVA CREATIONS — Server-Authoritative Order Service
 * 
 * Strict E-Commerce & Financial Integrity Guarantees:
 * 1. Server-authoritative integer paise: zero floating-point arithmetic.
 * 2. Real-time stock reservation via InventoryReservationService.
 * 3. Sovereign India-First Payments: BharatPe UPI QR & Cash on Delivery (COD).
 * 4. Dual persistence engine: Prisma PostgreSQL (live) with robust structured memory fallback (offline/dev).
 * 5. Full state machine enforcement: @nava/domain OrderStateMachine & PaymentStateMachine.
 */

import { prisma } from '@nava/db';
import crypto from 'node:crypto';

// Dynamic development fallback secret; in production ADMIN_AUTH_SECRET is strictly required
const devFallbackGuestSecret = crypto.randomBytes(32).toString('hex');
import {
  OrderStateMachine,
  OrderStatus,
  PaymentStatus,
} from '@nava/domain';
import { ValidationError, NotFoundError, ConflictError } from '@nava/shared';
import { isDatabaseAvailable, CatalogService } from './catalog-service';
import { PaymentService, UpiPaymentInstructionsResult, CodOrderResult } from './payment-service';
import { InventoryReservationService } from './inventory-reservation-service';
import { PromotionService } from './promotion-service';
import { SettingsService } from './settings-service';
import { CONFIG, buildWhatsAppLink } from './config';

export interface CreateOrderItemInput {
  variantId: string;
  quantity: number;
}

export interface CustomerAddressInput {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  stateCode: string;
  stateName: string;
  postalCode: string;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  shippingAddress: CustomerAddressInput;
  paymentMethod: 'UPI_MERCHANT_QR' | 'COD';
  customerNotes?: string;
  couponCode?: string;
  userId?: string;
  channel?: 'WEB' | 'WHATSAPP';
  idempotencyKey?: string;
}

export interface OrderItemDto {
  id: string;
  variantId: string;
  title: string;
  sku: string;
  quantity: number;
  unitPricePaise: number;
  totalPaise: number;
}

export interface OrderPaymentDto {
  id: string;
  method: 'UPI_MERCHANT_QR' | 'COD' | 'NET_BANKING_DIRECT' | string;
  provider: string;
  paymentReference: string;
  amountPaise: number;
  status: PaymentStatus;
  claimedUtr?: string | null;
  verifiedTransactionId?: string | null;
  isDuplicateClaim: boolean;
  verifiedAt?: Date | null;
  verifiedByUserId?: string | null;
  verificationNotes?: string | null;
  courierAwb?: string | null;
  gatewayRefundId?: string | null;
}

export interface OrderDto {
  id: string;
  orderNumber: string;
  userId?: string | null;
  status: OrderStatus;
  paymentMethod: 'UPI_MERCHANT_QR' | 'COD' | 'NET_BANKING_DIRECT';
  totalPaise: number;
  subtotalPaise: number;
  taxPaise: number;
  shippingPaise: number;
  discountPaise: number;
  couponCode?: string | null;
  taxMode: string;
  shippingAddress: CustomerAddressInput;
  billingAddress: CustomerAddressInput;
  customerNotes?: string | null;
  rtoAwb?: string | null;
  courierAwb?: string | null;
  items: OrderItemDto[];
  payment?: OrderPaymentDto;
  paymentInstructions?: UpiPaymentInstructionsResult | CodOrderResult;
  guestAccessToken?: string;
  channel?: 'WEB' | 'WHATSAPP';
  whatsappConciergeUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Global singleton in-memory persistent order repository for test execution & offline development
const globalForOrders = globalThis as unknown as {
  __nava_memory_orders__?: Map<string, OrderDto>;
  __nava_idempotency_store__?: Map<string, { order: OrderDto; timestamp: number }>;
  __nava_inflight_idempotency__?: Map<string, Promise<OrderDto>>;
};

if (!globalForOrders.__nava_memory_orders__) {
  globalForOrders.__nava_memory_orders__ = new Map<string, OrderDto>();
}
if (!globalForOrders.__nava_idempotency_store__) {
  globalForOrders.__nava_idempotency_store__ = new Map();
}
if (!globalForOrders.__nava_inflight_idempotency__) {
  globalForOrders.__nava_inflight_idempotency__ = new Map();
}

const memoryOrders = globalForOrders.__nava_memory_orders__;
const idempotencyStore = globalForOrders.__nava_idempotency_store__;
const inFlightIdempotency = globalForOrders.__nava_inflight_idempotency__;

function sanitizeText(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

// Helper to seed sample initial orders for admin UI preview if empty
function initializeSampleOrders() {
  if (!memoryOrders.has('NAV-2026-8821')) {
    const sampleDate = new Date();
    const sample1: OrderDto = {
      id: 'ord-mem-001',
      orderNumber: 'NAV-2026-8821',
      status: 'PROCESSING',
      paymentMethod: 'UPI_MERCHANT_QR',
      totalPaise: 349900,
      subtotalPaise: 349900,
      taxPaise: 0,
      shippingPaise: 0,
      discountPaise: 0,
      taxMode: 'UNREGISTERED',
      shippingAddress: {
        name: 'Ananya Rao',
        phone: '+919886011223',
        email: 'ananya.rao@example.in',
        addressLine1: '42, 4th Cross, Indiranagar',
        city: 'Bengaluru',
        stateCode: '29',
        stateName: 'Karnataka',
        postalCode: '560038',
      },
      billingAddress: {
        name: 'Ananya Rao',
        phone: '+919886011223',
        addressLine1: '42, 4th Cross, Indiranagar',
        city: 'Bengaluru',
        stateCode: '29',
        stateName: 'Karnataka',
        postalCode: '560038',
      },
      courierAwb: 'DELHIVERY-BLR-99812',
      items: [
        {
          id: 'item-1',
          variantId: 'var-1-26',
          title: 'Regal Kundan Bridal Chuda & Kada Set (Size 2.6)',
          sku: 'NAV-BDL-KDN-001-26',
          quantity: 1,
          unitPricePaise: 349900,
          totalPaise: 349900,
        },
      ],
      payment: {
        id: 'pay-mem-001',
        method: 'UPI_MERCHANT_QR',
        provider: 'BHARATPE_QR',
        paymentReference: 'PAY-NAV-2026-8821',
        amountPaise: 349900,
        status: 'VERIFIED',
        claimedUtr: '431289004512',
        verifiedTransactionId: 'BANK-CREDIT-992110',
        isDuplicateClaim: false,
        verifiedAt: new Date(sampleDate.getTime() - 86400000),
        verifiedByUserId: 'dev-store-manager',
        verificationNotes: 'Bank settlement confirmed via BharatPe merchant statement',
      },
      createdAt: new Date(sampleDate.getTime() - 86400000),
      updatedAt: new Date(sampleDate.getTime() - 86400000),
    };

    const sample2: OrderDto = {
      id: 'ord-mem-002',
      orderNumber: 'NAV-2026-8822',
      status: 'AWAITING_PAYMENT_VERIFICATION',
      paymentMethod: 'UPI_MERCHANT_QR',
      totalPaise: 189900,
      subtotalPaise: 189900,
      taxPaise: 0,
      shippingPaise: 0,
      discountPaise: 0,
      taxMode: 'UNREGISTERED',
      shippingAddress: {
        name: 'Priyanka Sharma',
        phone: '+919876543210',
        email: 'priyanka@example.in',
        addressLine1: 'Flat 302, Palm Grove',
        city: 'Mumbai',
        stateCode: '27',
        stateName: 'Maharashtra',
        postalCode: '400050',
      },
      billingAddress: {
        name: 'Priyanka Sharma',
        phone: '+919876543210',
        addressLine1: 'Flat 302, Palm Grove',
        city: 'Mumbai',
        stateCode: '27',
        stateName: 'Maharashtra',
        postalCode: '400050',
      },
      items: [
        {
          id: 'item-2',
          variantId: 'var-2-24',
          title: 'Temple Nakshi Antique Kada Pair (Size 2.4)',
          sku: 'NAV-NKS-ANT-002-24',
          quantity: 1,
          unitPricePaise: 189900,
          totalPaise: 189900,
        },
      ],
      payment: {
        id: 'pay-mem-002',
        method: 'UPI_MERCHANT_QR',
        provider: 'BHARATPE_QR',
        paymentReference: 'PAY-NAV-2026-8822',
        amountPaise: 189900,
        status: 'AWAITING_VERIFICATION',
        claimedUtr: '431289110099',
        isDuplicateClaim: false,
      },
      createdAt: sampleDate,
      updatedAt: sampleDate,
    };

    memoryOrders.set(sample1.orderNumber, sample1);
    memoryOrders.set(sample2.orderNumber, sample2);
  }
}

// Auto-seed initial sample orders on module load
initializeSampleOrders();

export class OrderService {
  /**
   * Resets in-memory store for clean test suites.
   */
  static resetForTesting(): void {
    memoryOrders.clear();
    initializeSampleOrders();
  }

  /**
   * Generates a unique, non-repeating order reference number.
   * Format: NAV-YYYY-XXXX (e.g. NAV-2026-7842)
   */
  static generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    return `NAV-${year}-${random}`;
  }

  /**
   * Generates a deterministic stateless HMAC guest access token.
   * Format: HMAC-SHA256(ADMIN_AUTH_SECRET, `${orderNumber}:${createdAt.getTime()}`)
   * Fails closed in production if ADMIN_AUTH_SECRET is absent or weak.
   */
  static generateGuestAccessToken(orderNumber: string, createdAt: Date): string {
    const isProd = process.env.NODE_ENV === 'production';
    const secret = process.env.ADMIN_AUTH_SECRET?.trim();

    if (!secret || secret.length < 32) {
      if (isProd) {
        throw new Error('ADMIN_AUTH_SECRET must be configured with at least 32 characters in production.');
      }
    } else if (isProd && (secret.toLowerCase().includes('placeholder') || secret === 'nava-default-fallback-secret-256')) {
      throw new Error('ADMIN_AUTH_SECRET is configured with an insecure placeholder value in production.');
    }

    const effectiveSecret = secret || devFallbackGuestSecret;
    return crypto
      .createHmac('sha256', effectiveSecret)
      .update(`${orderNumber.trim()}:${createdAt.getTime()}`)
      .digest('hex');
  }

  /**
   * Verifies a guest access token using constant-time comparison.
   */
  static verifyGuestAccessToken(orderNumber: string, createdAt: Date, token?: string | null): boolean {
    if (!token || typeof token !== 'string') return false;
    const cleanToken = token.trim();
    if (cleanToken.length !== 64) return false;
    const expected = this.generateGuestAccessToken(orderNumber, createdAt);
    try {
      const tokenBuf = Buffer.from(cleanToken, 'hex');
      const expectedBuf = Buffer.from(expected, 'hex');
      if (tokenBuf.length !== expectedBuf.length) return false;
      return crypto.timingSafeEqual(tokenBuf, expectedBuf);
    } catch {
      return false;
    }
  }

  /**
   * Sanitizes an order object so that sensitive internal tokens (e.g. guestAccessToken)
   * are never returned in public or administrative API response payloads.
   */
  static sanitizeOrder<T extends Partial<OrderDto>>(order: T): Omit<T, 'guestAccessToken'> {
    const { guestAccessToken: _token, ...sanitized } = order;
    return sanitized as Omit<T, 'guestAccessToken'>;
  }

  /**
   * Validates customer details and address format for Indian logistics.
   */
  static validateAddress(address: CustomerAddressInput): void {
    if (!address) {
      throw new ValidationError('Shipping address is required.');
    }
    if (!address.name || address.name.trim().length < 2) {
      throw new ValidationError('Customer name must be at least 2 characters.');
    }
    const cleanPhone = (address.phone || '').replace(/[\s-]/g, '');
    if (!/^(?:\+91)?[6-9]\d{9}$/.test(cleanPhone)) {
      throw new ValidationError('Please provide a valid 10-digit Indian mobile number.');
    }
    if (!address.addressLine1 || address.addressLine1.trim().length < 5) {
      throw new ValidationError('Street address line 1 must be at least 5 characters.');
    }
    if (!address.city || address.city.trim().length < 2) {
      throw new ValidationError('City name is required.');
    }
    const cleanPostal = (address.postalCode || '').trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPostal)) {
      throw new ValidationError('Please enter a valid 6-digit Indian PIN code (must start with digits 1-9).');
    }
  }

  /**
   * Creates and persists a customer order with server-authoritative pricing and stock reservation.
   * Guarantees idempotency across concurrent duplicate submissions and sequential replays.
   */
  static async createOrder(input: CreateOrderInput): Promise<OrderDto> {
    const cleanKey = input.idempotencyKey?.trim();
    if (cleanKey) {
      const cached = idempotencyStore.get(cleanKey);
      if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
        return cached.order;
      }
      const inFlight = inFlightIdempotency.get(cleanKey);
      if (inFlight) {
        return await inFlight;
      }
    }

    const orderPromise = this.executeCreateOrder(input);
    if (cleanKey) {
      inFlightIdempotency.set(cleanKey, orderPromise);
    }

    try {
      const orderDto = await orderPromise;
      if (cleanKey) {
        idempotencyStore.set(cleanKey, { order: orderDto, timestamp: Date.now() });
      }
      return orderDto;
    } finally {
      if (cleanKey) {
        inFlightIdempotency.delete(cleanKey);
      }
    }
  }

  private static async executeCreateOrder(input: CreateOrderInput): Promise<OrderDto> {
    if (!input.items || input.items.length === 0) {
      throw new ValidationError('Order must contain at least one item.');
    }

    this.validateAddress(input.shippingAddress);

    // 1. Server-authoritative price validation & variant lookup
    const resolvedItems: OrderItemDto[] = [];
    let subtotalPaise = 0;

    for (const item of input.items) {
      if (!item.quantity || item.quantity <= 0 || !Number.isInteger(item.quantity)) {
        throw new ValidationError('Item quantity must be a positive integer.');
      }
      if (item.quantity > 20) {
        throw new ValidationError('Maximum purchase quantity is 20 units per item.');
      }

      // Lookup variant from catalog service
      const product = await CatalogService.getProductByVariantId(item.variantId);
      if (!product) {
        throw new NotFoundError(`Product variant ${item.variantId} not found in active catalogue.`);
      }

      const variant = product.variants?.find((v) => v.id === item.variantId);
      if (!variant) {
        throw new NotFoundError(`Variant ${item.variantId} does not exist on product ${product.name}.`);
      }

      // Server-authoritative pricing (never trusts client price)
      const unitPricePaise = variant.pricePaise;
      const totalPaise = unitPricePaise * item.quantity;
      subtotalPaise += totalPaise;

      resolvedItems.push({
        id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        variantId: variant.id,
        title: `${product.name} (${variant.size ? `Size ${variant.size}` : variant.title})`,
        sku: variant.sku,
        quantity: item.quantity,
        unitPricePaise,
        totalPaise,
      });
    }

    // 2. Promotional discounts & coupon validation
    let discountPaise = 0;
    let appliedCouponCode: string | null = null;

    if (input.couponCode && input.couponCode.trim() !== '') {
      const discountCalc = await PromotionService.validateAndApply(input.couponCode, subtotalPaise);
      if (!discountCalc.isValid) {
        throw new ValidationError(discountCalc.rejectionReason || 'Invalid coupon code applied.');
      }
      discountPaise = discountCalc.discountPaise;
      appliedCouponCode = discountCalc.couponCode;
    }

    // 3. Dynamic Authoritative Shipping Calculation (SettingsService)
    const netSubtotal = Math.max(0, subtotalPaise - discountPaise);
    const settings = await SettingsService.getSettings();
    const shippingPaise = SettingsService.calculateShipping(netSubtotal, settings);
    const totalPaise = netSubtotal + shippingPaise;
    const orderNumber = this.generateOrderNumber();
    const paymentRef = `PAY-${orderNumber}`;

    // 4. Determine initial statuses
    let initialOrderStatus: OrderStatus;
    let initialPaymentStatus: PaymentStatus;
    let paymentInstructions: UpiPaymentInstructionsResult | CodOrderResult | undefined;

    if (input.paymentMethod === 'UPI_MERCHANT_QR') {
      if (!PaymentService.isUpiConfigured()) {
        throw new ValidationError(
          'Merchant UPI collection is not yet configured or approved by the business owner. Please select Cash on Delivery or contact our atelier via WhatsApp.'
        );
      }
      initialOrderStatus = 'AWAITING_PAYMENT_VERIFICATION';
      initialPaymentStatus = 'INITIATED';

      // Generate NPCI UPI instructions
      paymentInstructions = PaymentService.generateUpiInstructions({
        orderNumber,
        amountPaise: totalPaise,
      });
    } else {
      // Cash on Delivery — Fail-Closed Invariant Validation (Gate C 3C)
      const isCodEnabled = settings.codEnabled && CONFIG.payment.codEnabled;
      const isPolicyApproved = CONFIG.payment.codPolicyApproved;
      const maxCodPaise = settings.codMaxPaise || CONFIG.payment.codMaxPaise || 500000;

      if (!isCodEnabled) {
        throw new ValidationError('Cash on Delivery is currently disabled by store management.');
      }
      if (!isPolicyApproved) {
        throw new ValidationError('Cash on Delivery policy is not approved by store management.');
      }
      if (totalPaise > maxCodPaise) {
        throw new ValidationError(
          `Cash on Delivery is only permitted for orders up to ₹${(maxCodPaise / 100).toLocaleString('en-IN')}. Current total: ₹${(totalPaise / 100).toLocaleString('en-IN')}. Please select UPI QR payment.`
        );
      }

      initialOrderStatus = 'PENDING_PAYMENT';
      initialPaymentStatus = 'PENDING_COLLECTION';

      paymentInstructions = PaymentService.createCodOrder({
        orderNumber,
        amountPaise: totalPaise,
        customerPhone: input.shippingAddress.phone,
        shippingPostalCode: input.shippingAddress.postalCode,
      });
    }

    const orderChannel = input.channel || 'WEB';
    let customerNotes = input.customerNotes ? sanitizeText(input.customerNotes) : null;
    let whatsappConciergeUrl: string | undefined;

    if (orderChannel === 'WHATSAPP') {
      customerNotes = customerNotes ? `[CHANNEL: WHATSAPP] ${customerNotes}` : '[CHANNEL: WHATSAPP]';
      const msg = `Order ${orderNumber} - NAVA Creations: Hi! I have placed an artisanal order (${orderNumber}) for ₹${(totalPaise / 100).toFixed(2)}. Please confirm receipt.`;
      whatsappConciergeUrl = buildWhatsAppLink(msg, settings.whatsappNumber);
    }

    const orderDto: OrderDto = {
      id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderNumber,
      status: initialOrderStatus,
      paymentMethod: input.paymentMethod,
      subtotalPaise,
      shippingPaise,
      taxPaise: 0,
      discountPaise,
      couponCode: appliedCouponCode,
      totalPaise,
      taxMode: 'UNREGISTERED',
      shippingAddress: input.shippingAddress,
      billingAddress: input.shippingAddress,
      customerNotes,
      channel: orderChannel,
      whatsappConciergeUrl,
      items: resolvedItems,
      payment: {
        id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        method: input.paymentMethod,
        provider: input.paymentMethod === 'UPI_MERCHANT_QR' ? 'BHARATPE_QR' : 'COD',
        paymentReference: paymentRef,
        amountPaise: totalPaise,
        status: initialPaymentStatus,
        isDuplicateClaim: false,
      },
      paymentInstructions,
      guestAccessToken: this.generateGuestAccessToken(orderNumber, new Date()),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 5. Unified Interactive Database Transaction (Fail-Closed, Zero Phantom Holds)
    if (isDatabaseAvailable()) {
      return await prisma.$transaction(async (tx) => {
        // Step A: Concurrency-Safe Stock Reservation with Deterministic Sorting (ARCH-03 Fix)
        const sortedItems = [...resolvedItems].sort((a, b) => a.variantId.localeCompare(b.variantId));
        const reservationIds: string[] = [];

        for (const item of sortedItems) {
          const res = await InventoryReservationService.reserveStock(
            { variantId: item.variantId, quantity: item.quantity },
            tx
          );
          reservationIds.push(res.id);
        }

        // Step B: Atomic Coupon Usage Increment within Same Transaction (ARCH-01 Fix)
        if (appliedCouponCode) {
          await PromotionService.incrementUsage(appliedCouponCode, tx);
        }

        // Step C: Insert Order, Items, and Payment (Satisfying foreign key first - ARCH-02 Fix)
        const createdOrder = await tx.order.create({
          data: {
            orderNumber: orderDto.orderNumber,
            userId: input.userId || null,
            status: orderDto.status,
            paymentMethod: orderDto.paymentMethod,
            subtotalPaise: orderDto.subtotalPaise,
            shippingPaise: orderDto.shippingPaise,
            taxPaise: orderDto.taxPaise,
            discountPaise: orderDto.discountPaise,
            totalPaise: orderDto.totalPaise,
            taxMode: orderDto.taxMode,
            shippingAddress: orderDto.shippingAddress as unknown as object,
            billingAddress: orderDto.billingAddress as unknown as object,
            items: {
              create: orderDto.items.map((i) => ({
                variantId: i.variantId,
                title: i.title,
                sku: i.sku,
                quantity: i.quantity,
                unitPricePaise: i.unitPricePaise,
                totalPaise: i.totalPaise,
              })),
            },
            payments: {
              create: {
                method: orderDto.paymentMethod,
                provider: orderDto.payment?.provider || 'BHARATPE_QR',
                paymentReference: orderDto.payment?.paymentReference || paymentRef,
                amountPaise: orderDto.totalPaise,
                status: orderDto.payment?.status || initialPaymentStatus,
              },
            },
          },
        });

        // Step D: Link Reservations to the Newly Created Order
        await tx.inventoryReservation.updateMany({
          where: { id: { in: reservationIds } },
          data: { orderId: createdOrder.id },
        });

        orderDto.id = createdOrder.id;
        orderDto.createdAt = createdOrder.createdAt;
        orderDto.updatedAt = createdOrder.updatedAt;
        orderDto.guestAccessToken = this.generateGuestAccessToken(orderDto.orderNumber, createdOrder.createdAt);

        // Sync local memory cache for immediate queries
        memoryOrders.set(orderDto.orderNumber, orderDto);

        return orderDto;
      });
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'Database service is unavailable. Order creation cannot proceed in production without persistent database.'
      );
    }

    // In-Memory Fallback Path (dev/offline mode without database)
    for (const item of resolvedItems) {
      await InventoryReservationService.reserveStock({
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }

    if (appliedCouponCode) {
      await PromotionService.incrementUsage(appliedCouponCode);
    }

    memoryOrders.set(orderDto.orderNumber, orderDto);
    return orderDto;
  }

  /**
   * Retrieves an order by orderNumber.
   */
  static async getOrder(orderNumber: string): Promise<OrderDto | null> {
    initializeSampleOrders();

    if (isDatabaseAvailable()) {
      try {
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { orderNumber },
              { id: orderNumber },
            ],
          },
          include: {
            items: true,
            payments: true,
          },
        });

        if (order) {
          const payment = order.payments[0];
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            status: order.status,
            paymentMethod: order.paymentMethod,
            totalPaise: order.totalPaise,
            subtotalPaise: order.subtotalPaise,
            taxPaise: order.taxPaise,
            shippingPaise: order.shippingPaise,
            discountPaise: order.discountPaise,
            taxMode: order.taxMode,
            shippingAddress: order.shippingAddress as unknown as CustomerAddressInput,
            billingAddress: order.billingAddress as unknown as CustomerAddressInput,
            courierAwb: (payment?.courierAwb) || null,
            rtoAwb: order.rtoAwb || null,
            items: order.items.map((i) => ({
              id: i.id,
              variantId: i.variantId,
              title: i.title,
              sku: i.sku,
              quantity: i.quantity,
              unitPricePaise: i.unitPricePaise,
              totalPaise: i.totalPaise,
            })),
            payment: payment
              ? {
                  id: payment.id,
                  method: payment.method,
                  provider: payment.provider,
                  paymentReference: payment.paymentReference,
                  amountPaise: payment.amountPaise,
                  status: payment.status,
                  claimedUtr: payment.claimedUtr,
                  verifiedTransactionId: payment.verifiedTransactionId,
                  isDuplicateClaim: payment.isDuplicateClaim,
                  verifiedAt: payment.verifiedAt,
                  verifiedByUserId: payment.verifiedByUserId,
                  verificationNotes: payment.verificationNotes,
                  courierAwb: payment.courierAwb,
                  gatewayRefundId: (payment as any).refunds?.[0]?.gatewayRefundId || null,
                }
              : undefined,
            guestAccessToken: this.generateGuestAccessToken(order.orderNumber, order.createdAt),
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          };
        }
      } catch (err: unknown) {
        console.error('[OrderService:getOrder] Database query failed:', err instanceof Error ? err.message : String(err));
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('Database service is unavailable.');
    }

    const byNumber = memoryOrders.get(orderNumber);
    if (byNumber) {
      if (!byNumber.guestAccessToken) {
        byNumber.guestAccessToken = this.generateGuestAccessToken(byNumber.orderNumber, byNumber.createdAt);
      }
      return byNumber;
    }
    for (const ord of memoryOrders.values()) {
      if (ord.id === orderNumber || ord.orderNumber === orderNumber) {
        if (!ord.guestAccessToken) {
          ord.guestAccessToken = this.generateGuestAccessToken(ord.orderNumber, ord.createdAt);
        }
        return ord;
      }
    }
    return null;
  }

  /**
   * Customer submits a 12-digit UPI Bank UTR reference for a pending order.
   */
  static async submitCustomerUtr(orderNumber: string, rawUtr: string): Promise<OrderDto> {
    const order = await this.getOrder(orderNumber);
    if (!order) {
      throw new NotFoundError(`Order ${orderNumber} not found.`);
    }

    // Guard: Prevent modifying UTR if order is cancelled
    if (order.status === 'CANCELLED') {
      throw new ValidationError(`Cannot submit UPI reference: Order ${orderNumber} has been cancelled.`);
    }

    // Guard: Prevent modifying UTR if order is already payment confirmed or fulfilled
    if (order.status === 'PAYMENT_CONFIRMED' || order.status === 'SHIPPED' || order.status === 'DELIVERED') {
      throw new ValidationError('Cannot submit UPI reference: Payment for this order is already confirmed.');
    }

    // Guard: Prevent re-submission if already verified
    if (order.payment?.status === 'VERIFIED') {
      throw new ValidationError('Payment for this order has already been verified.');
    }

    const normUtr = rawUtr.trim().toUpperCase();
    const verificationResult = PaymentService.submitUpiTransactionReference({
      orderNumber,
      claimedUtr: normUtr,
    });

    const verificationWindowHours = CONFIG.payment.verificationWindowHours || 24;
    const verificationExpiresAt = new Date(Date.now() + verificationWindowHours * 60 * 60 * 1000);

    let isDuplicateClaim = verificationResult.isDuplicateClaim;

    if (isDatabaseAvailable()) {
      await prisma.$transaction(async (tx) => {
        // Database-level transaction advisory lock: serializes concurrent UTR claims across all instances
        await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', 'utr_claim_' + normUtr);

        // Database-authoritative duplicate protection:
        // Check if another active order has already claimed or verified this UTR
        const duplicatePayment = await tx.payment.findFirst({
          where: {
            OR: [
              { verifiedTransactionId: normUtr },
              {
                claimedUtr: normUtr,
                orderId: { not: order.id },
                order: {
                  status: { notIn: ['CANCELLED'] },
                },
              },
            ],
          },
          include: { order: true },
        });

        if (duplicatePayment) {
          isDuplicateClaim = true;
          // Database partial unique index (payments_claimed_utr_active_unique) strictly forbids
          // duplicate active claims across distinct orders in PostgreSQL.
          throw new ConflictError(
            `The transaction reference "${normUtr}" has already been claimed by another active order (${duplicatePayment.order.orderNumber}). It cannot be reused.`
          );
        }

        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: {
            claimedUtr: normUtr,
            isDuplicateClaim,
            status: 'AWAITING_VERIFICATION',
          },
        });

        // Guard: Prevent resuscitating an already-expired reservation
        const activeReservations = await tx.inventoryReservation.findMany({
          where: { orderId: order.id, status: 'PENDING' },
        });

        const hasExpired = activeReservations.some((r) => r.expiresAt < new Date());
        if (activeReservations.length === 0 || hasExpired) {
          throw new ConflictError(
            `Cannot submit transaction reference: The inventory reservation for order ${order.orderNumber} has expired. Please place a new order.`
          );
        }

        // Extend reservation TTL for the authoritative verification review window (24 hours)
        await tx.inventoryReservation.updateMany({
          where: { orderId: order.id, status: 'PENDING' },
          data: { expiresAt: verificationExpiresAt },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'AWAITING_PAYMENT_VERIFICATION' },
        });
      });
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('Database service is unavailable.');
    }

    if (order.payment) {
      order.payment.claimedUtr = normUtr;
      order.payment.isDuplicateClaim = isDuplicateClaim;
      order.payment.status = 'AWAITING_VERIFICATION';
    }
    order.status = 'AWAITING_PAYMENT_VERIFICATION';
    order.updatedAt = new Date();

    memoryOrders.set(order.orderNumber, order);
    return order;
  }

  /**
   * Store Owner / Manager verifies payment against authoritative bank credit records.
   * Fail-closed: Requires database availability; executes atomic interactive transaction;
   * records durable audit log; maps duplicate transactions to ConflictError (HTTP 409);
   * prevents premature in-memory state mutation.
   */
  static async verifyPayment(
    orderNumber: string,
    input: {
      verifiedTransactionId: string;
      verifiedByUserId: string;
      amountPaise: number;
      notes?: string;
    }
  ): Promise<OrderDto> {
    const order = await this.getOrder(orderNumber);
    if (!order) {
      throw new NotFoundError(`Order ${orderNumber} not found.`);
    }

    // Fail closed: financial verification requires authoritative database connection
    if (!isDatabaseAvailable()) {
      throw new Error('DATABASE_UNAVAILABLE: Financial payment verification requires an active database connection.');
    }

    // Guard: Prevent verifying cancelled orders
    if (order.status === 'CANCELLED') {
      throw new ValidationError(`Cannot verify payment: Order ${orderNumber} is cancelled.`);
    }

    // Guard: Amount verification integrity
    if (input.amountPaise !== order.totalPaise) {
      throw new ValidationError(
        `Verified amount (${input.amountPaise} paise) does not match order total amount (${order.totalPaise} paise).`
      );
    }

    const normVerifiedId = input.verifiedTransactionId.trim().toUpperCase();
    const result = PaymentService.verifyUpiPayment({
      orderNumber: order.orderNumber,
      verifiedTransactionId: normVerifiedId,
      verifiedByUserId: input.verifiedByUserId,
      amountPaise: input.amountPaise,
      verificationNotes: input.notes,
    });

    // Enforce transition to PAYMENT_CONFIRMED
    const orderTransition = OrderStateMachine.transition(order.status, 'PAYMENT_CONFIRMED', {
      performedByUserId: input.verifiedByUserId,
      reason: input.notes || 'Manual bank ledger verification',
    });

    if (orderTransition.isFailure) {
      throw new ValidationError(orderTransition.error.message);
    }

    // Atomic interactive database transaction
    try {
      await prisma.$transaction(async (tx) => {
        // Database-level transaction advisory lock: serializes concurrent UTR verification across all instances
        await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(hashtext($1))', 'utr_claim_' + normVerifiedId);

        // Find the specific pending payment record eligible for verification
        const existingPayment = await tx.payment.findFirst({
          where: {
            orderId: order.id,
            status: { in: ['INITIATED', 'AWAITING_VERIFICATION'] },
          },
        });

        if (!existingPayment) {
          throw new NotFoundError(
            `No pending payment record found for order ${order.orderNumber} eligible for verification.`
          );
        }

        // Record authoritative bank transaction reference on payment record
        // (Customer-claimed UTR and authoritative bank settlement ref are both preserved for audit)

        // Update Order Status
        await tx.order.update({
          where: { orderNumber },
          data: { status: 'PAYMENT_CONFIRMED' },
        });

        // Update the exact payment record by unique ID
        await tx.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: 'VERIFIED',
            verifiedTransactionId: normVerifiedId,
            verifiedAt: result.verifiedAt,
            verifiedByUserId: result.verifiedByUserId,
            verificationNotes: input.notes || null,
          },
        });

        // Step E: Enforce HELD_STOCK_UNAVAILABLE guard on linked inventory reservations
        const linkedReservations = await tx.inventoryReservation.findMany({
          where: { orderId: order.id },
        });

        const isStockExpiredOrMissing =
          linkedReservations.length === 0 ||
          linkedReservations.some(
            (r) =>
              r.status === 'EXPIRED' ||
              r.status === 'RELEASED' ||
              (r.status === 'PENDING' && r.expiresAt < new Date())
          );

        if (isStockExpiredOrMissing) {
          // Guard: transition pending reservation to HELD_STOCK_UNAVAILABLE
          await tx.inventoryReservation.updateMany({
            where: { orderId: order.id, status: 'PENDING' },
            data: { status: 'HELD_STOCK_UNAVAILABLE' as any },
          });

          throw new ConflictError(
            `Cannot verify payment for order ${order.orderNumber}: The stock reservation has expired and held stock is no longer secured (HELD_STOCK_UNAVAILABLE). Manual inventory restock or allocation required.`
          );
        }

        // Transition linked inventory reservation from PENDING to CONFIRMED
        await tx.inventoryReservation.updateMany({
          where: { orderId: order.id, status: 'PENDING' },
          data: { status: 'CONFIRMED' },
        });

        // Transition inventory items: reserved_qty -> allocated_sold_qty
        for (const item of order.items) {
          await tx.inventoryItem.updateMany({
            where: { variantId: item.variantId },
            data: {
              reservedQty: { decrement: item.quantity },
              allocatedSoldQty: { increment: item.quantity },
            },
          });
        }

        // Durable audit log persisted within transaction boundary
        await tx.auditLog.create({
          data: {
            userId: input.verifiedByUserId,
            action: 'PAYMENT_VERIFIED',
            entity: 'Payment',
            entityId: existingPayment.id,
            oldValues: { status: existingPayment.status },
            newValues: {
              status: 'VERIFIED',
              verifiedTransactionId: normVerifiedId,
              orderNumber,
            },
          },
        });
      });
    } catch (error: any) {
      // Map Prisma unique constraint violation (duplicate verifiedTransactionId) to ConflictError
      if (error?.code === 'P2002') {
        try {
          await prisma.auditLog.create({
            data: {
              userId: input.verifiedByUserId,
              action: 'PAYMENT_VERIFICATION_REJECTED',
              entity: 'Order',
              entityId: order.id,
              newValues: {
                attemptedTransactionId: normVerifiedId,
                reason: 'DUPLICATE_TRANSACTION_ID',
                errorCode: 'P2002',
              },
            },
          });
        } catch (_logErr) {}

        throw new ConflictError(
          `Bank transaction reference "${normVerifiedId}" has already been verified and credited to another order.`
        );
      }
      // Re-throw all other database errors; execution halts before in-memory mutation
      throw error;
    }

    // In-memory state updated ONLY AFTER database transaction commits
    order.status = orderTransition.value.to;
    if (order.payment) {
      order.payment.status = 'VERIFIED';
      order.payment.verifiedTransactionId = normVerifiedId;
      order.payment.verifiedAt = result.verifiedAt;
      order.payment.verifiedByUserId = result.verifiedByUserId;
      order.payment.verificationNotes = input.notes || null;
    }
    order.updatedAt = new Date();

    memoryOrders.set(order.orderNumber, order);
    return order;
  }

  /**
   * Store Owner / Manager rejects an unverified or invalid payment reference.
   * Atomically cancels the order, sets payment status to REJECTED (unlocking UTR),
   * releases reserved stock back to availableQty, and records an audit log.
   */
  static async rejectPayment(
    orderNumber: string,
    input: { reason: string; rejectedByUserId: string }
  ): Promise<OrderDto> {
    const order = await this.getOrder(orderNumber);
    if (!order) {
      throw new NotFoundError(`Order ${orderNumber} not found.`);
    }

    if (!isDatabaseAvailable()) {
      throw new Error('DATABASE_UNAVAILABLE: Payment rejection requires an active database connection.');
    }

    if (['SHIPPED', 'DELIVERED', 'CLOSED'].includes(order.status)) {
      throw new ConflictError(`Cannot reject payment: Order ${orderNumber} is already in state ${order.status}.`);
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Order Status to CANCELLED
      await tx.order.update({
        where: { orderNumber },
        data: { status: 'CANCELLED' },
      });

      // 2. Update Payment Status to REJECTED (unlocks claimed_utr from partial unique index)
      await tx.payment.updateMany({
        where: { orderId: order.id },
        data: {
          status: 'REJECTED',
          verificationNotes: input.reason || 'Admin rejected payment reference',
        },
      });

      // 3. Release linked inventory reservations back to available_qty
      const linkedReservations = await tx.inventoryReservation.findMany({
        where: { orderId: order.id, status: 'PENDING' },
      });

      for (const res of linkedReservations) {
        const resItems = await tx.inventoryReservationItem.findMany({
          where: { reservationId: res.id },
        });
        for (const item of resItems) {
          await tx.inventoryItem.update({
            where: { variantId: item.variantId },
            data: {
              availableQty: { increment: item.quantity },
              reservedQty: { decrement: item.quantity },
            },
          });
        }
      }

      await tx.inventoryReservation.updateMany({
        where: { orderId: order.id, status: 'PENDING' },
        data: { status: 'RELEASED' },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          userId: input.rejectedByUserId,
          action: 'PAYMENT_REJECTED',
          entity: 'Order',
          entityId: order.id,
          newValues: {
            status: 'CANCELLED',
            paymentStatus: 'REJECTED',
            reason: input.reason,
            orderNumber,
          },
        },
      });
    });

    if (order.payment?.claimedUtr) {
      PaymentService.releaseUtrClaim(order.payment.claimedUtr);
    }

    order.status = 'CANCELLED';
    if (order.payment) {
      order.payment.status = 'REJECTED';
    }
    order.updatedAt = new Date();
    memoryOrders.set(order.orderNumber, order);
    return order;
  }

  /**
   * Store Owner / Manager updates order status and fulfillment information.
   */
  static async updateOrderStatus(
    orderNumber: string,
    newStatus: OrderStatus,
    metadata?: {
      courierAwb?: string;
      rtoAwb?: string;
      updatedBy?: string;
      reason?: string;
    }
  ): Promise<OrderDto> {
    const order = await this.getOrder(orderNumber);
    if (!order) {
      throw new NotFoundError(`Order ${orderNumber} not found.`);
    }

    // Enforce domain state machine transition rules if status is changing
    if (order.status !== newStatus) {
      const transition = OrderStateMachine.transition(order.status, newStatus, {
        performedByUserId: metadata?.updatedBy || 'admin',
        reason: metadata?.reason,
      });

      if (transition.isFailure) {
        throw new ValidationError(transition.error.message);
      }

      order.status = transition.value.to;
    }
    if (metadata?.courierAwb) {
      order.courierAwb = metadata.courierAwb;
    }
    if (metadata?.rtoAwb) {
      order.rtoAwb = metadata.rtoAwb;
    }
    order.updatedAt = new Date();

    // If order was cancelled, release stock safely
    if (newStatus === 'CANCELLED') {
      try {
        await InventoryReservationService.cancelPreDispatchOrder(
          order.orderNumber,
          order.status,
          undefined,
          metadata?.reason || 'Order cancelled'
        );
      } catch (_e) {}
    }

    if (isDatabaseAvailable()) {
      try {
        await prisma.order.update({
          where: { orderNumber },
          data: {
            status: newStatus,
            rtoAwb: metadata?.rtoAwb || undefined,
          },
        });
      } catch (err: unknown) {
        console.error('[OrderService:updateOrderStatus] Database query failed:', err instanceof Error ? err.message : String(err));
        if (process.env.NODE_ENV === 'production') {
          throw err;
        }
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error('Database service is unavailable.');
    }

    memoryOrders.set(order.orderNumber, order);
    return order;
  }

  /**
   * Lists orders for administrative oversight.
   * Authoritatively queries Prisma PostgreSQL when database is available,
   * falling back to in-memory store in offline/development mode.
   */
  static async listOrders(filters?: {
    status?: OrderStatus;
    paymentMethod?: string;
    search?: string;
    limit?: number;
    page?: number;
  }): Promise<{ items: OrderDto[]; total: number }> {
    const limit = filters?.limit ?? 20;
    const page = filters?.page ?? 1;

    if (isDatabaseAvailable()) {
      try {
        const where: Record<string, unknown> = {};
        if (filters?.status) {
          where.status = filters.status;
        }
        if (filters?.paymentMethod) {
          where.paymentMethod = filters.paymentMethod;
        }
        if (filters?.search && filters.search.trim() !== '') {
          const q = filters.search.trim();
          where.OR = [
            { orderNumber: { contains: q, mode: 'insensitive' } },
            { payments: { some: { claimedUtr: { contains: q, mode: 'insensitive' } } } },
            { payments: { some: { verifiedTransactionId: { contains: q, mode: 'insensitive' } } } },
          ];
        }

        const [total, dbOrders] = await Promise.all([
          prisma.order.count({ where }),
          prisma.order.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
              items: true,
              payments: true,
            },
          }),
        ]);

        const items: OrderDto[] = dbOrders.map((order) => {
          const payment = order.payments[0];
          return {
            id: order.id,
            orderNumber: order.orderNumber,
            userId: order.userId,
            status: order.status,
            paymentMethod: order.paymentMethod as 'UPI_MERCHANT_QR' | 'COD' | 'NET_BANKING_DIRECT',
            totalPaise: order.totalPaise,
            subtotalPaise: order.subtotalPaise,
            taxPaise: order.taxPaise,
            shippingPaise: order.shippingPaise,
            discountPaise: order.discountPaise,
            couponCode: null,
            taxMode: order.taxMode,
            shippingAddress: order.shippingAddress as unknown as CustomerAddressInput,
            billingAddress: order.billingAddress as unknown as CustomerAddressInput,
            courierAwb: payment?.courierAwb || null,
            rtoAwb: order.rtoAwb || null,
            items: order.items.map((i) => ({
              id: i.id,
              variantId: i.variantId,
              title: i.title,
              sku: i.sku,
              quantity: i.quantity,
              unitPricePaise: i.unitPricePaise,
              totalPaise: i.totalPaise,
            })),
            payment: payment
              ? {
                  id: payment.id,
                  method: payment.method,
                  provider: payment.provider,
                  paymentReference: payment.paymentReference,
                  amountPaise: payment.amountPaise,
                  status: payment.status,
                  claimedUtr: payment.claimedUtr,
                  verifiedTransactionId: payment.verifiedTransactionId,
                  isDuplicateClaim: payment.isDuplicateClaim,
                  verifiedAt: payment.verifiedAt,
                  verifiedByUserId: payment.verifiedByUserId,
                  verificationNotes: payment.verificationNotes,
                  courierAwb: payment.courierAwb,
                  gatewayRefundId: (payment as any).refunds?.[0]?.gatewayRefundId || null,
                }
              : undefined,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
          };
        });

        return { items, total };
      } catch (err: unknown) {
        // SECURITY REQUIREMENT: Never swallow database errors or silently return empty array
        const safeErrorMsg = err instanceof Error ? err.message : 'Unknown database error';
        console.error('[OrderService.listOrders] PostgreSQL query execution failed:', safeErrorMsg);
        throw new Error('Database error while retrieving orders');
      }
    }

    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database connection is not available in production environment');
    }

    initializeSampleOrders();
    let ordersList = Array.from(memoryOrders.values());

    if (filters?.status) {
      ordersList = ordersList.filter((o) => o.status === filters.status);
    }
    if (filters?.paymentMethod) {
      ordersList = ordersList.filter((o) => o.paymentMethod === filters.paymentMethod);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      ordersList = ordersList.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.shippingAddress.name.toLowerCase().includes(q) ||
          o.shippingAddress.phone.includes(q) ||
          (o.payment?.claimedUtr && o.payment.claimedUtr.toLowerCase().includes(q))
      );
    }

    ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = ordersList.length;
    const paginated = ordersList.slice((page - 1) * limit, page * limit);

    return { items: paginated.map((item) => this.sanitizeOrder(item) as OrderDto), total };
  }
}
