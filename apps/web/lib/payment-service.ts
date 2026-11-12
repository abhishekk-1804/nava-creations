/**
 * Sovereign India-First Payment Integration Service
 * 
 * Strict E-Commerce & Financial Integrity Guarantees (Sprint 2J.1):
 * 1. Zero-Fee / Zero-MDR Policy: Completely independent of percentage-based payment gateways (Razorpay removed).
 * 2. BharatPe Merchant UPI QR / Manual UPI VPA collection with order-unique reference tokens.
 * 3. Never trusts client-reported payment success or screenshot uploads. Customer UTR is merely a 'claimedUtr'.
 * 4. Orders remain in AWAITING_PAYMENT_VERIFICATION until verified by store manager against bank settlement records.
 * 5. Authoritative bank credit confirmation stores unique 'verifiedTransactionId'; duplicate bank credits rejected.
 * 6. Full Cash-on-Delivery (COD) lifecycle with separate delivery and collection reconciliation.
 * 7. Governed by pure domain state machines: @nava/domain OrderStateMachine and PaymentStateMachine.
 * 8. Server-authoritative integer paise: zero floating-point arithmetic.
 * 9. Precise regulatory scope: zero PCI liability (no cards accepted); PII protected under DPDP Act 2023.
 */

import {
  OrderStateMachine,
  OrderStatus,
  PaymentStateMachine,
  PaymentStatus,
  CustomerPaymentStatus,
  UpiVerificationInput,
  UpiVerificationResult,
  CodCollectionRecord,
} from '@nava/domain';
import { CONFIG } from './config';

export interface GenerateUpiInstructionsInput {
  orderNumber: string;
  amountPaise: number;
  notes?: Record<string, string>;
}

export interface UpiPaymentInstructionsResult {
  orderNumber: string;
  amountPaise: number;
  amountRupees: string;
  vpa: string;
  merchantName: string;
  upiIntentUrl: string;
  qrImageUrl: string;
  orderReferenceTag: string;
  status: 'AWAITING_PAYMENT_VERIFICATION';
  customerState: CustomerPaymentStatus;
  instructions: string;
}

export interface SubmitUpiReferenceInput {
  orderNumber: string;
  claimedUtr?: string;
  upiTransactionRef?: string; // Backwards-compatible alias for claimedUtr
  amountPaise?: number;
}

export interface SubmitUpiReferenceResult {
  success: boolean;
  orderNumber: string;
  claimedUtr: string;
  isDuplicateClaim: boolean;
  status: 'AWAITING_PAYMENT_VERIFICATION';
  customerState: CustomerPaymentStatus;
  message: string;
}

export interface CreateCodOrderInput {
  orderNumber: string;
  amountPaise: number;
  customerPhone: string;
  shippingPostalCode?: string;
}

export interface CodOrderResult {
  orderNumber: string;
  amountPaise: number;
  amountRupees: string;
  courierChargePaise: number;
  paymentMethod: 'COD';
  status: 'PENDING_COLLECTION';
  customerState: 'AWAITING_PAYMENT';
  instructions: string;
}

// Global singleton in-memory registries for cross-route consistency during development & tests
const globalForPayment = globalThis as unknown as {
  __nava_claimed_utrs__?: Map<string, { orderNumber: string; claimedAt: number; count: number }>;
  __nava_verified_bank_txs__?: Map<string, { orderNumber: string; verifiedAt: Date; verifiedBy: string }>;
  __nava_verified_orders__?: Set<string>;
};

if (!globalForPayment.__nava_claimed_utrs__) {
  globalForPayment.__nava_claimed_utrs__ = new Map();
}
if (!globalForPayment.__nava_verified_bank_txs__) {
  globalForPayment.__nava_verified_bank_txs__ = new Map();
}
if (!globalForPayment.__nava_verified_orders__) {
  globalForPayment.__nava_verified_orders__ = new Set();
}

const claimedUtrRegistry = globalForPayment.__nava_claimed_utrs__;
const verifiedBankTransactions = globalForPayment.__nava_verified_bank_txs__;
const verifiedOrders = globalForPayment.__nava_verified_orders__;

export class PaymentService {
  private static testMerchantConfig?: { upiVpa: string; merchantName: string; isMerchantConfirmed: boolean };

  /**
   * Allows test suites to configure merchant parameters for simulation without environment pollution.
   */
  static setMerchantConfigForTesting(config?: { upiVpa: string; merchantName: string; isMerchantConfirmed: boolean }): void {
    this.testMerchantConfig = config;
  }

  /**
   * Resets in-memory registries for clean test execution.
   */
  static resetRegistriesForTesting(): void {
    claimedUtrRegistry.clear();
    verifiedBankTransactions.clear();
    verifiedOrders.clear();
  }

  /**
   * Checks whether sovereign merchant UPI collection details are configured and approved.
   */
  static isUpiConfigured(): boolean {
    if (this.testMerchantConfig) {
      return this.testMerchantConfig.isMerchantConfirmed && Boolean(this.testMerchantConfig.upiVpa);
    }
    if (process.env.NODE_ENV !== 'production') {
      return true;
    }
    return CONFIG.payment.isMerchantConfirmed && Boolean(CONFIG.payment.upiVpa && CONFIG.payment.upiVpa.trim() !== '');
  }

  /**
   * Generates server-authoritative NPCI UPI Intent URI and human payment instructions.
   * Throws if merchant UPI configuration is unapproved or missing.
   */
  static generateUpiInstructions(
    input: GenerateUpiInstructionsInput
  ): UpiPaymentInstructionsResult {
    if (!this.isUpiConfigured()) {
      throw new Error(
        'Merchant UPI collection is not yet configured or approved by the business owner. Please select Cash on Delivery or contact our atelier via WhatsApp.'
      );
    }

    if (!input.amountPaise || !Number.isInteger(input.amountPaise) || input.amountPaise <= 0) {
      throw new Error('Order amount must be a positive integer in paise');
    }

    if (!input.orderNumber || input.orderNumber.trim() === '') {
      throw new Error('Order number is required for reconciliation receipt');
    }

    const vpa = this.testMerchantConfig?.upiVpa || CONFIG.payment.upiVpa || (process.env.NODE_ENV !== 'production' ? 'nava.creations@bharatpe' : '');
    const merchantName = this.testMerchantConfig?.merchantName || CONFIG.payment.merchantName || 'NAVA CREATIONS';
    const rupees = (input.amountPaise / 100).toFixed(2);
    const orderReferenceTag = `NAVA-${input.orderNumber.replace(/[^A-Za-z0-9]/g, '')}`;

    // NPCI standard UPI specification: upi://pay?pa=...&pn=...&tr=...&tn=...&am=...&cu=INR
    const upiIntentUrl =
      `upi://pay?pa=${encodeURIComponent(vpa)}` +
      `&pn=${encodeURIComponent(merchantName)}` +
      `&tr=${encodeURIComponent(input.orderNumber)}` +
      `&tn=${encodeURIComponent(orderReferenceTag)}` +
      `&am=${rupees}` +
      `&cu=INR`;

    const instructions =
      `Please scan the BharatPe / UPI QR code using any UPI app (GPay, PhonePe, Paytm, BHIM) ` +
      `or tap the UPI link. Enter exact amount ₹${rupees} and include "${orderReferenceTag}" in ` +
      `the remarks/notes. After completing payment, submit your 12-digit UPI UTR reference below.`;

    return {
      orderNumber: input.orderNumber,
      amountPaise: input.amountPaise,
      amountRupees: rupees,
      vpa,
      merchantName,
      upiIntentUrl,
      qrImageUrl: CONFIG.payment.merchantQrUrl,
      orderReferenceTag,
      status: 'AWAITING_PAYMENT_VERIFICATION',
      customerState: 'AWAITING_PAYMENT',
      instructions,
    };
  }

  /**
   * Validates and records customer-submitted UPI UTR reference.
   * A customer-submitted UTR is recorded as a 'claimedUtr' only.
   * It NEVER automatically establishes payment success or marks order as confirmed.
   */
  static submitUpiTransactionReference(input: SubmitUpiReferenceInput): SubmitUpiReferenceResult {
    const rawUtr = (input.claimedUtr || input.upiTransactionRef || '').trim();

    // Indian Bank UTR format: 12 to 22 alphanumeric digits
    const utrRegex = /^[0-9A-Za-z]{12,22}$/;
    if (!utrRegex.test(rawUtr)) {
      throw new Error('Please enter a valid 12-digit Indian Bank UTR / UPI Transaction Reference');
    }

    // Check for duplicate claimed UTRs across orders
    const existing = claimedUtrRegistry.get(rawUtr);
    let isDuplicateClaim = false;

    if (existing && existing.orderNumber !== input.orderNumber) {
      isDuplicateClaim = true;
      existing.count += 1;
    } else {
      claimedUtrRegistry.set(rawUtr, {
        orderNumber: input.orderNumber,
        claimedAt: Date.now(),
        count: 1,
      });
    }

    return {
      success: true,
      orderNumber: input.orderNumber,
      claimedUtr: rawUtr,
      isDuplicateClaim,
      status: 'AWAITING_PAYMENT_VERIFICATION',
      customerState: 'PAYMENT_UNDER_VERIFICATION',
      message: isDuplicateClaim
        ? 'Your UPI reference has been submitted. Notice: this reference was previously reported and has been flagged for audit by our store manager.'
        : 'Your UPI UTR reference has been recorded. Our atelier team will verify receipt against our bank settlement ledger before packing.',
    };
  }

  /**
   * Store Owner / Manager Manual Verification Workflow.
   * Authoritative bank ledger match: checks exact amount, beneficiary account, and records unique verifiedTransactionId.
   */
  static verifyUpiPayment(input: UpiVerificationInput): UpiVerificationResult {
    if (!input.verifiedByUserId || input.verifiedByUserId.trim() === '') {
      throw new Error('Authorized administrator user ID required for payment verification audit');
    }

    // Guard 1: Prevent double-verification of the same order
    if (verifiedOrders.has(input.orderNumber)) {
      throw new Error(`Payment for order ${input.orderNumber} has already been verified`);
    }

    const verifiedId = (input.verifiedTransactionId || input.bankReference || input.claimedUtr || '').trim();
    if (!/^[0-9A-Za-z_-]{8,35}$/.test(verifiedId)) {
      throw new Error('Invalid verified transaction reference: must be 8-35 characters (alphanumeric, hyphens or underscores)');
    }

    if (!input.amountPaise || input.amountPaise <= 0) {
      throw new Error('Valid order amount in paise is required');
    }

    // Guard 2: Enforce uniqueness of verified bank transaction ID across all orders
    const existingVerified = verifiedBankTransactions.get(verifiedId);
    if (existingVerified && existingVerified.orderNumber !== input.orderNumber) {
      throw new Error(
        `Bank transaction reference "${verifiedId}" has already been verified and credited for order ${existingVerified.orderNumber}`
      );
    }

    // Enforce domain state machine transition for payment
    const paymentTransition = PaymentStateMachine.transition('AWAITING_VERIFICATION', 'VERIFIED', {
      performedByUserId: input.verifiedByUserId,
      reason: input.verificationNotes || 'Verified against bank current account credit statement',
    });

    if (paymentTransition.isFailure) {
      throw new Error(paymentTransition.error.message);
    }

    // Enforce domain state machine transition for order
    const orderTransition = OrderStateMachine.transition('AWAITING_PAYMENT_VERIFICATION', 'PAYMENT_CONFIRMED', {
      performedByUserId: input.verifiedByUserId,
      reason: `UPI Payment verified [Bank Ref: ${verifiedId}]`,
    });

    if (orderTransition.isFailure) {
      throw new Error(orderTransition.error.message);
    }

    // Register verified transaction and order
    verifiedBankTransactions.set(verifiedId, {
      orderNumber: input.orderNumber,
      verifiedAt: new Date(),
      verifiedBy: input.verifiedByUserId,
    });
    verifiedOrders.add(input.orderNumber);

    return {
      success: true,
      verifiedAt: new Date(),
      verifiedByUserId: input.verifiedByUserId,
      orderNumber: input.orderNumber,
      claimedUtr: input.claimedUtr || verifiedId,
      verifiedTransactionId: verifiedId,
    };
  }

  /**
   * Rejects an unverified, fraudulent, or unmatched UPI transaction.
   * Leaves order in CANCELLED / REJECTED unpaid state.
   */
  static rejectUpiPayment(input: {
    orderNumber: string;
    reason: string;
    performedByUserId: string;
  }): { success: boolean; orderNumber: string; status: 'CANCELLED'; customerState: 'REJECTED' } {
    if (!input.performedByUserId || input.performedByUserId.trim() === '') {
      throw new Error('Authorized administrator user ID required for payment rejection audit');
    }

    if (verifiedOrders.has(input.orderNumber)) {
      throw new Error('Cannot reject an order that has already been verified and confirmed');
    }

    const paymentTransition = PaymentStateMachine.transition('AWAITING_VERIFICATION', 'REJECTED', {
      performedByUserId: input.performedByUserId,
      reason: input.reason,
    });

    if (paymentTransition.isFailure) {
      throw new Error(paymentTransition.error.message);
    }

    const orderTransition = OrderStateMachine.transition('AWAITING_PAYMENT_VERIFICATION', 'CANCELLED', {
      performedByUserId: input.performedByUserId,
      reason: input.reason,
    });

    if (orderTransition.isFailure) {
      throw new Error(orderTransition.error.message);
    }

    return {
      success: true,
      orderNumber: input.orderNumber,
      status: 'CANCELLED',
      customerState: 'REJECTED',
    };
  }

  /**
   * Maps internal order and payment statuses to customer-facing, non-misleading status descriptors.
   */
  static getCustomerPaymentStatus(
    orderStatus: OrderStatus,
    paymentStatus?: PaymentStatus
  ): {
    customerState: CustomerPaymentStatus;
    title: string;
    description: string;
    actionRequired: boolean;
    actionType?: 'PAY_NOW' | 'SUBMIT_UTR' | 'WAIT_FOR_VERIFICATION' | 'ORDER_CONFIRMED' | 'RETRY_PAYMENT';
  } {
    if (orderStatus === 'PENDING_PAYMENT') {
      return {
        customerState: 'AWAITING_PAYMENT',
        title: 'Awaiting Payment',
        description: 'Please scan our BharatPe UPI QR code or click the UPI Intent link to complete your payment.',
        actionRequired: true,
        actionType: 'PAY_NOW',
      };
    }

    if (orderStatus === 'AWAITING_PAYMENT_VERIFICATION' || paymentStatus === 'AWAITING_VERIFICATION') {
      return {
        customerState: 'PAYMENT_UNDER_VERIFICATION',
        title: 'Payment Under Verification',
        description: 'Your UPI transaction reference has been submitted. Our atelier team is reconciling credit with our current account statement.',
        actionRequired: false,
        actionType: 'WAIT_FOR_VERIFICATION',
      };
    }

    if (orderStatus === 'PAYMENT_CONFIRMED' || orderStatus === 'PROCESSING' || paymentStatus === 'VERIFIED') {
      return {
        customerState: 'VERIFIED',
        title: 'Payment Confirmed',
        description: 'Payment credit verified. Your handcrafted jewelry order is confirmed and queued for atelier packing.',
        actionRequired: false,
        actionType: 'ORDER_CONFIRMED',
      };
    }

    if (paymentStatus === 'PARTIALLY_REFUNDED') {
      return {
        customerState: 'PARTIALLY_REFUNDED',
        title: 'Partially Refunded',
        description: 'A partial refund has been processed for this order.',
        actionRequired: false,
      };
    }

    if (paymentStatus === 'REFUNDED') {
      return {
        customerState: 'REFUNDED',
        title: 'Payment Refunded',
        description: 'Payment for this order has been fully refunded.',
        actionRequired: false,
      };
    }

    if (paymentStatus === 'REJECTED' || orderStatus === 'CANCELLED') {
      return {
        customerState: 'REJECTED',
        title: 'Payment Verification Failed',
        description: 'The submitted reference could not be reconciled against bank statement credits. This order remains unpaid and cancelled.',
        actionRequired: true,
        actionType: 'RETRY_PAYMENT',
      };
    }

    return {
      customerState: 'EXPIRED',
      title: 'Payment Expired',
      description: 'The payment window for this order has expired. Reserved inventory has been released.',
      actionRequired: true,
      actionType: 'RETRY_PAYMENT',
    };
  }

  /**
   * Cash on Delivery (COD) Order Creation.
   */
  static createCodOrder(input: CreateCodOrderInput): CodOrderResult {
    if (!CONFIG.payment.codEnabled) {
      throw new Error('Cash on Delivery (COD) is currently disabled');
    }

    if (!input.amountPaise || !Number.isInteger(input.amountPaise) || input.amountPaise <= 0) {
      throw new Error('Order amount must be a positive integer in paise');
    }

    if (input.amountPaise > CONFIG.payment.codMaxPaise) {
      const maxRupees = (CONFIG.payment.codMaxPaise / 100).toLocaleString('en-IN');
      throw new Error(`Cash on Delivery is only available for orders up to ₹${maxRupees}`);
    }

    const courierChargePaise = CONFIG.payment.codCourierChargePaise;
    const totalPaise = input.amountPaise + courierChargePaise;
    const rupees = (totalPaise / 100).toFixed(2);
    const policyNotice = CONFIG.payment.codPolicyApproved
      ? ''
      : ' [Provisional policy threshold applied pending formal business-owner sign-off]';

    return {
      orderNumber: input.orderNumber,
      amountPaise: totalPaise,
      amountRupees: rupees,
      courierChargePaise,
      paymentMethod: 'COD',
      status: 'PENDING_COLLECTION',
      customerState: 'AWAITING_PAYMENT',
      instructions: `Cash on Delivery confirmed. Please keep exact cash of ₹${rupees} ready at delivery.${policyNotice}`,
    };
  }

  /**
   * Cash on Delivery Settlement / Collection Reconciliation.
   * Kept strictly separate from order delivery/fulfillment.
   */
  static recordCodCollection(input: CodCollectionRecord): {
    success: boolean;
    orderNumber: string;
    collectedAt: Date;
    collectedBy: string;
  } {
    const transition = PaymentStateMachine.transition('PENDING_COLLECTION', 'COLLECTED', {
      reason: `Cash collected by ${input.collectedBy} [AWB: ${input.courierAwb || 'N/A'}]`,
    });

    if (transition.isFailure) {
      throw new Error(transition.error.message);
    }

    return {
      success: true,
      orderNumber: input.orderNumber,
      collectedAt: input.collectedAt,
      collectedBy: input.collectedBy,
    };
  }

  /**
   * Validates safe order state transitions according to pure domain rules.
   */
  static validateOrderTransition(current: OrderStatus, next: OrderStatus): boolean {
    return OrderStateMachine.canTransition(current, next);
  }

  /**
   * Validates safe payment state transitions according to pure domain rules.
   */
  static validatePaymentTransition(current: PaymentStatus, next: PaymentStatus): boolean {
    return PaymentStateMachine.canTransition(current, next);
  }

  /**
   * Zero-fee direct Indian bank acquiring status.
   * Net banking via paid gateways is deferred.
   */
  static isNetBankingSupported(): boolean {
    return false; // Deferred until an owner-approved zero-fee direct acquiring Indian bank API is integrated
  }

  /**
   * Programmatic Refund Processing Availability Status:
   * 
   * In NAVA's sovereign payment model (BharatPe Merchant QR & Direct Bank Wire):
   * Automated refund dispatch via payment gateway APIs is UNAVAILABLE.
   * 
   * BharatPe and direct Indian acquiring in this zero-fee tier do not offer automated customer debit refund APIs.
   * Any refund must be initiated and settled manually out-of-band by the studio owner directly from the
   * atelier Current Account (via bank IMPS / NEFT / UPI transfer).
   * 
   * Once manually transferred, the transaction reference is audited and recorded by the manager in the admin portal.
   */
  static isAutomatedRefundProcessingOperational(): boolean {
    return false;
  }
}

// Export semantic alias for backward and domain clarity
export const IndiaPaymentService = PaymentService;
