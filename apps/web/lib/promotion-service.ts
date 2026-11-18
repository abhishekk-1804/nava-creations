import { prisma, Prisma } from '@nava/db';
import { CouponDto, DiscountCalculationResult, PromotionEngine, PromotionType } from '@nava/domain';
import { NotFoundError, ValidationError } from '@nava/shared';
import { isDatabaseAvailable } from './catalog-service';

// Global singleton registry for in-memory promotion management (fallback for unit tests / offline)
const globalForPromotions = globalThis as unknown as {
  __nava_coupons__?: Map<string, CouponDto>;
};

if (!globalForPromotions.__nava_coupons__) {
  globalForPromotions.__nava_coupons__ = new Map<string, CouponDto>();
}

const couponsRegistry = globalForPromotions.__nava_coupons__;

// Initialize test/dev promotional registry with legitimate zero usage counts
function initializeCoupons() {
  // Strict security: Never auto-seed promotional coupons in production
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (couponsRegistry.size === 0) {
    const c1: CouponDto = {
      id: 'coup-bridal-10',
      code: 'BRIDAL10',
      description: '10% off handcrafted bridal edit sets (Min ₹2,000)',
      type: 'PERCENTAGE',
      value: 10,
      minOrderPaise: 200000, // ₹2,000
      maxDiscountPaise: 50000, // ₹500 cap
      isActive: true,
      usageCount: 0,
      usageLimit: 200,
    };

    const c2: CouponDto = {
      id: 'coup-nava-200',
      code: 'NAVA200',
      description: 'Flat ₹200 off on handcrafted bangle purchases above ₹1,500',
      type: 'FLAT_AMOUNT',
      value: 20000, // ₹200 (20,000 paise)
      minOrderPaise: 150000, // ₹1,500
      isActive: true,
      usageCount: 0,
    };

    const c3: CouponDto = {
      id: 'coup-festive-15',
      code: 'FESTIVE15',
      description: '15% festive wedding discount (Min ₹3,000, Max ₹750)',
      type: 'PERCENTAGE',
      value: 15,
      minOrderPaise: 300000, // ₹3,000
      maxDiscountPaise: 75000, // ₹750
      isActive: true,
      usageCount: 0,
      usageLimit: 100,
    };

    couponsRegistry.set(c1.code, c1);
    couponsRegistry.set(c2.code, c2);
    couponsRegistry.set(c3.code, c3);
  }
}

// Auto-seed coupons for local/test fallback only
initializeCoupons();

export interface CreateCouponInput {
  code: string;
  description: string;
  type: PromotionType;
  value: number;
  minOrderPaise: number;
  maxDiscountPaise?: number | null;
  usageLimit?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

export class PromotionService {
  /**
   * Resets registry for clean automated testing.
   */
  static resetForTesting(): void {
    couponsRegistry.clear();
    initializeCoupons();
  }

  /**
   * Lists all coupons for store manager administration.
   */
  static async listCoupons(): Promise<CouponDto[]> {
    if (isDatabaseAvailable()) {
      try {
        const dbCoupons = await prisma.coupon.findMany({
          orderBy: { createdAt: 'desc' },
        });
        if (dbCoupons && dbCoupons.length > 0) {
          return dbCoupons.map((c) => ({
            id: c.id,
            code: c.code,
            description: c.description,
            type: c.type as PromotionType,
            value: c.value,
            minOrderPaise: c.minOrderPaise,
            maxDiscountPaise: c.maxDiscountPaise,
            usageLimit: c.usageLimit,
            usageCount: c.usageCount,
            isActive: c.isActive,
            validFrom: c.validFrom ? c.validFrom.toISOString() : null,
            validUntil: c.validUntil ? c.validUntil.toISOString() : null,
          }));
        }
      } catch (_e) {
        // Fallback to memory
      }
    }

    initializeCoupons();
    return Array.from(couponsRegistry.values());
  }

  /**
   * Finds coupon by its alphanumeric code with optional transaction client support.
   */
  static async getCouponByCode(
    code: string,
    tx?: Prisma.TransactionClient
  ): Promise<CouponDto | null> {
    const cleanCode = PromotionEngine.normalizeCode(code);
    if (!cleanCode) return null;

    if (isDatabaseAvailable()) {
      try {
        const client = tx || prisma;
        const dbCoupon = await client.coupon.findUnique({
          where: { code: cleanCode },
        });
        if (dbCoupon) {
          return {
            id: dbCoupon.id,
            code: dbCoupon.code,
            description: dbCoupon.description,
            type: dbCoupon.type as PromotionType,
            value: dbCoupon.value,
            minOrderPaise: dbCoupon.minOrderPaise,
            maxDiscountPaise: dbCoupon.maxDiscountPaise,
            usageLimit: dbCoupon.usageLimit,
            usageCount: dbCoupon.usageCount,
            isActive: dbCoupon.isActive,
            validFrom: dbCoupon.validFrom ? dbCoupon.validFrom.toISOString() : null,
            validUntil: dbCoupon.validUntil ? dbCoupon.validUntil.toISOString() : null,
          };
        }
      } catch (_e) {
        // Fallback to memory
      }
    }

    initializeCoupons();
    return couponsRegistry.get(cleanCode) || null;
  }

  /**
   * Validates and applies a coupon code against a customer order subtotal.
   */
  static async validateAndApply(
    code: string,
    subtotalPaise: number,
    tx?: Prisma.TransactionClient
  ): Promise<DiscountCalculationResult> {
    const cleanCode = PromotionEngine.normalizeCode(code);
    if (!cleanCode) {
      throw new ValidationError('Please enter a coupon code.');
    }

    const coupon = await this.getCouponByCode(cleanCode, tx);
    if (!coupon) {
      return {
        isValid: false,
        couponCode: cleanCode,
        discountPaise: 0,
        discountRupees: '0.00',
        originalSubtotalPaise: subtotalPaise,
        discountedSubtotalPaise: subtotalPaise,
        rejectionReason: `Coupon code '${cleanCode}' does not exist or has expired.`,
      };
    }

    return PromotionEngine.calculateDiscount(coupon, subtotalPaise);
  }

  /**
   * Increments usage count when an order is confirmed or created.
   * Atomically validates that usage limit has not been breached using native tagged SQL.
   */
  static async incrementUsage(
    code: string,
    tx?: Prisma.TransactionClient
  ): Promise<void> {
    const cleanCode = PromotionEngine.normalizeCode(code);
    if (!cleanCode) return;

    if (isDatabaseAvailable()) {
      const client = tx || prisma;
      // Atomic increment with usage limit guard using raw tagged template (ARCH-01 Fix)
      const affectedCount = await client.$executeRaw`
        UPDATE "coupons"
        SET "usage_count" = "usage_count" + 1, "updated_at" = NOW()
        WHERE "code" = ${cleanCode}
          AND "is_active" = true
          AND ("valid_from" IS NULL OR "valid_from" <= NOW())
          AND ("valid_until" IS NULL OR "valid_until" >= NOW())
          AND ("usage_limit" IS NULL OR "usage_count" < "usage_limit");
      `;

      if (affectedCount === 0) {
        const existing = await client.coupon.findUnique({ where: { code: cleanCode } });
        if (!existing || !existing.isActive) {
          throw new ValidationError(`Coupon '${cleanCode}' does not exist or is inactive.`);
        }
        if (existing.usageLimit !== null && existing.usageCount >= existing.usageLimit) {
          throw new ValidationError(`Coupon '${cleanCode}' has reached its maximum redemption limit.`);
        }
        if (existing.validFrom && existing.validFrom > new Date()) {
          throw new ValidationError(`Coupon '${cleanCode}' is not yet active.`);
        }
        if (existing.validUntil && existing.validUntil < new Date()) {
          throw new ValidationError(`Coupon '${cleanCode}' has expired.`);
        }
        throw new ValidationError(`Unable to apply coupon '${cleanCode}'.`);
      }

      // Sync in-memory cache if present
      const cached = couponsRegistry.get(cleanCode);
      if (cached) {
        cached.usageCount += 1;
      }
      return;
    }

    // In-memory fallback
    const coupon = await this.getCouponByCode(cleanCode);
    if (coupon) {
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new ValidationError(`Coupon '${coupon.code}' has reached its maximum redemption limit.`);
      }
      coupon.usageCount += 1;
      couponsRegistry.set(coupon.code, coupon);
    }
  }

  /**
   * Store manager creates a new coupon.
   */
  static async createCoupon(input: CreateCouponInput): Promise<CouponDto> {
    const code = PromotionEngine.normalizeCode(input.code);
    if (!code || code.length < 3) {
      throw new ValidationError('Coupon code must be at least 3 characters.');
    }

    if (input.type === 'PERCENTAGE' && (input.value <= 0 || input.value > 100)) {
      throw new ValidationError('Percentage discount value must be between 1% and 100%.');
    }

    if (input.type === 'FLAT_AMOUNT' && input.value <= 0) {
      throw new ValidationError('Flat discount amount must be greater than zero.');
    }

    if (isDatabaseAvailable()) {
      const existing = await prisma.coupon.findUnique({ where: { code } });
      if (existing) {
        throw new ValidationError(`Coupon with code '${code}' already exists.`);
      }

      const created = await prisma.coupon.create({
        data: {
          code,
          description: input.description.trim(),
          type: input.type,
          value: input.value,
          minOrderPaise: input.minOrderPaise || 0,
          maxDiscountPaise: input.maxDiscountPaise || null,
          usageLimit: input.usageLimit || null,
          isActive: true,
          validFrom: input.validFrom ? new Date(input.validFrom) : null,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
        },
      });

      const dto: CouponDto = {
        id: created.id,
        code: created.code,
        description: created.description,
        type: created.type as PromotionType,
        value: created.value,
        minOrderPaise: created.minOrderPaise,
        maxDiscountPaise: created.maxDiscountPaise,
        usageLimit: created.usageLimit,
        usageCount: created.usageCount,
        isActive: created.isActive,
        validFrom: created.validFrom ? created.validFrom.toISOString() : null,
        validUntil: created.validUntil ? created.validUntil.toISOString() : null,
      };

      couponsRegistry.set(code, dto);
      return dto;
    }

    if (couponsRegistry.has(code)) {
      throw new ValidationError(`Coupon with code '${code}' already exists.`);
    }

    const newCoupon: CouponDto = {
      id: `coup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code,
      description: input.description.trim(),
      type: input.type,
      value: input.value,
      minOrderPaise: input.minOrderPaise || 0,
      maxDiscountPaise: input.maxDiscountPaise || null,
      isActive: true,
      usageCount: 0,
      usageLimit: input.usageLimit || null,
      validFrom: input.validFrom || null,
      validUntil: input.validUntil || null,
    };

    couponsRegistry.set(code, newCoupon);
    return newCoupon;
  }

  /**
   * Store manager toggles or updates coupon active status.
   */
  static async updateCoupon(
    id: string,
    updates: Partial<CouponDto>
  ): Promise<CouponDto> {
    initializeCoupons();

    if (isDatabaseAvailable()) {
      try {
        const existing = await prisma.coupon.findFirst({
          where: { OR: [{ id }, { code: id }] },
        });

        if (existing) {
          const updated = await prisma.coupon.update({
            where: { id: existing.id },
            data: {
              ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
              ...(updates.description ? { description: updates.description.trim() } : {}),
              ...(updates.minOrderPaise !== undefined ? { minOrderPaise: updates.minOrderPaise } : {}),
              ...(updates.maxDiscountPaise !== undefined ? { maxDiscountPaise: updates.maxDiscountPaise } : {}),
              ...(updates.usageLimit !== undefined ? { usageLimit: updates.usageLimit } : {}),
            },
          });

          const dto: CouponDto = {
            id: updated.id,
            code: updated.code,
            description: updated.description,
            type: updated.type as PromotionType,
            value: updated.value,
            minOrderPaise: updated.minOrderPaise,
            maxDiscountPaise: updated.maxDiscountPaise,
            usageLimit: updated.usageLimit,
            usageCount: updated.usageCount,
            isActive: updated.isActive,
            validFrom: updated.validFrom ? updated.validFrom.toISOString() : null,
            validUntil: updated.validUntil ? updated.validUntil.toISOString() : null,
          };

          couponsRegistry.set(updated.code, dto);
          return dto;
        }
      } catch (_e) {
        // Fallback to memory
      }
    }

    let foundCoupon: CouponDto | null = null;
    for (const c of couponsRegistry.values()) {
      if (c.id === id || c.code === id) {
        foundCoupon = c;
        break;
      }
    }

    if (!foundCoupon) {
      throw new NotFoundError(`Coupon '${id}' not found.`);
    }

    if (updates.isActive !== undefined) {
      foundCoupon.isActive = updates.isActive;
    }
    if (updates.description) {
      foundCoupon.description = updates.description.trim();
    }
    if (updates.minOrderPaise !== undefined) {
      foundCoupon.minOrderPaise = updates.minOrderPaise;
    }
    if (updates.maxDiscountPaise !== undefined) {
      foundCoupon.maxDiscountPaise = updates.maxDiscountPaise;
    }

    couponsRegistry.set(foundCoupon.code, foundCoupon);
    return foundCoupon;
  }
}
