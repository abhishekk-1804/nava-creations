import { test, expect } from '@playwright/test';
import { PaymentService } from '../lib/payment-service';
import { EmailService } from '../lib/email-service';
import { authRateLimiter, MemoryRateLimiter } from '../lib/rate-limiter';

test.describe('Sprint 2J.1: Sovereign India-First Payment & Commerce Integration', () => {
  test.beforeEach(() => {
    PaymentService.resetRegistriesForTesting();
    PaymentService.setMerchantConfigForTesting({
      upiVpa: 'navacreations@icici',
      merchantName: 'NAVA CREATIONS',
      isMerchantConfirmed: true,
    });
  });

  test('P.0: Absent or unapproved merchant configuration disables UPI checkout', () => {
    PaymentService.setMerchantConfigForTesting({
      upiVpa: '',
      merchantName: 'NAVA CREATIONS',
      isMerchantConfirmed: false,
    });

    expect(() =>
      PaymentService.generateUpiInstructions({
        orderNumber: 'ORD-UNAPPROVED-01',
        amountPaise: 100000,
      })
    ).toThrow('Merchant UPI collection is not yet configured or approved');
  });

  test('P.1: PaymentService generates server-authoritative Merchant UPI QR payload with order reference', () => {
    const orderResult = PaymentService.generateUpiInstructions({
      orderNumber: 'ORD-2026-BLR01',
      amountPaise: 349900, // ₹3,499.00
    });

    expect(orderResult.amountPaise).toBe(349900);
    expect(orderResult.amountRupees).toBe('3499.00');
    expect(orderResult.orderReferenceTag).toBe('NAVA-ORD2026BLR01');
    expect(orderResult.upiIntentUrl).toContain('upi://pay?');
    expect(orderResult.upiIntentUrl).toContain('pa=');
    expect(orderResult.upiIntentUrl).toContain('am=3499.00');
    expect(orderResult.upiIntentUrl).toContain('cu=INR');
    expect(orderResult.status).toBe('AWAITING_PAYMENT_VERIFICATION');
    expect(orderResult.customerState).toBe('AWAITING_PAYMENT');
    expect(orderResult.instructions).toContain('NAVA-ORD2026BLR01');
  });

  test('P.2: Rejects non-positive or non-integer order amounts', () => {
    expect(() =>
      PaymentService.generateUpiInstructions({
        orderNumber: 'ORD-FAIL-01',
        amountPaise: -100,
      })
    ).toThrow('Order amount must be a positive integer in paise');

    expect(() =>
      PaymentService.generateUpiInstructions({
        orderNumber: 'ORD-FAIL-02',
        amountPaise: 0,
      })
    ).toThrow('Order amount must be a positive integer in paise');

    expect(() =>
      PaymentService.generateUpiInstructions({
        orderNumber: 'ORD-FAIL-03',
        amountPaise: 129.5,
      })
    ).toThrow('Order amount must be a positive integer in paise');
  });

  test('P.3: Customer submits UPI UTR reference and system sets AWAITING_PAYMENT_VERIFICATION', () => {
    const result = PaymentService.submitUpiTransactionReference({
      orderNumber: 'ORD-2026-BLR02',
      claimedUtr: '432109876543', // 12-digit Indian Bank UTR
      amountPaise: 299900,
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('AWAITING_PAYMENT_VERIFICATION');
    expect(result.customerState).toBe('PAYMENT_UNDER_VERIFICATION');
    expect(result.isDuplicateClaim).toBe(false);
    expect(result.message).toContain('Your UPI UTR reference has been recorded');
  });

  test('P.4: Detects duplicate claimed UTR references across orders and flags for manual audit without false verification', () => {
    const sharedUtr = '987654321012';

    // 1st order submission with UTR
    const res1 = PaymentService.submitUpiTransactionReference({
      orderNumber: 'ORD-2026-BLR03',
      claimedUtr: sharedUtr,
      amountPaise: 450000,
    });
    expect(res1.success).toBe(true);
    expect(res1.isDuplicateClaim).toBe(false);

    // 2nd different order attempting to reuse same UTR must be flagged as duplicate
    const res2 = PaymentService.submitUpiTransactionReference({
      orderNumber: 'ORD-2026-BLR04',
      claimedUtr: sharedUtr,
      amountPaise: 450000,
    });
    expect(res2.success).toBe(true);
    expect(res2.isDuplicateClaim).toBe(true);
    expect(res2.message).toContain('flagged for audit');
  });

  test('P.5: Store owner verifies valid UPI receipt against bank ledger and advances order to PAYMENT_CONFIRMED', () => {
    const verification = PaymentService.verifyUpiPayment({
      orderNumber: 'ORD-2026-BLR05',
      claimedUtr: '112233445566',
      verifiedTransactionId: 'BANK_HDFC_998811',
      amountPaise: 189900,
      verifiedByUserId: 'usr_admin_store_owner',
      bankReference: 'HDFC_STMT_REF_9988',
      verificationNotes: 'Matched in HDFC current account statement',
    });

    expect(verification.success).toBe(true);
    expect(verification.verifiedByUserId).toBe('usr_admin_store_owner');
    expect(verification.verifiedTransactionId).toBe('BANK_HDFC_998811');
    expect(verification.verifiedAt).toBeInstanceOf(Date);
  });

  test('P.5b: Bank transaction reference must be strictly unique across orders (prevents bank credit replay)', () => {
    const verifiedRef = 'HDFC_STMT_REF_UNIQUE';
    PaymentService.verifyUpiPayment({
      orderNumber: 'ORD-2026-BLR05B',
      verifiedTransactionId: verifiedRef,
      amountPaise: 189900,
      verifiedByUserId: 'usr_admin_store_owner',
    });

    // Attempting to verify a second order with the same bank transaction reference must throw
    expect(() =>
      PaymentService.verifyUpiPayment({
        orderNumber: 'ORD-2026-BLR05C',
        verifiedTransactionId: verifiedRef,
        amountPaise: 189900,
        verifiedByUserId: 'usr_admin_store_owner',
      })
    ).toThrow('has already been verified and credited');
  });

  test('P.5c: Verification cannot happen twice for the same order', () => {
    // First verification on order succeeds
    PaymentService.verifyUpiPayment({
      orderNumber: 'ORD-2026-BLR05_DOUBLE',
      verifiedTransactionId: 'HDFC_FIRST_CONFIRM',
      amountPaise: 189900,
      verifiedByUserId: 'usr_admin_store_owner',
    });

    // Second verification attempt on the same order must throw
    expect(() =>
      PaymentService.verifyUpiPayment({
        orderNumber: 'ORD-2026-BLR05_DOUBLE',
        verifiedTransactionId: 'HDFC_SECOND_CONFIRM',
        amountPaise: 189900,
        verifiedByUserId: 'usr_admin_store_owner',
      })
    ).toThrow('has already been verified');
  });

  test('P.6: Rejects unauthorized or missing admin verification credentials', () => {
    expect(() =>
      PaymentService.verifyUpiPayment({
        orderNumber: 'ORD-2026-BLR06',
        verifiedTransactionId: '112233445566',
        amountPaise: 189900,
        verifiedByUserId: '', // Missing admin ID
      })
    ).toThrow('Authorized administrator user ID required for payment verification audit');
  });

  test('P.7: Store owner can reject fraudulent or unverified UPI transactions with cancellation audit', () => {
    const rejection = PaymentService.rejectUpiPayment({
      orderNumber: 'ORD-2026-BLR07',
      reason: 'No settlement credit received in bank account within 24 hours',
      performedByUserId: 'usr_admin_store_owner',
    });

    expect(rejection.success).toBe(true);
    expect(rejection.status).toBe('CANCELLED');
    expect(rejection.customerState).toBe('REJECTED');
    expect(rejection.orderNumber).toBe('ORD-2026-BLR07');
  });

  test('P.8: Cash on Delivery (COD) order creation validates threshold limits and sets PENDING_COLLECTION', () => {
    // Valid COD order within ₹5,000 threshold
    const codOrder = PaymentService.createCodOrder({
      orderNumber: 'ORD-2026-COD01',
      amountPaise: 249900, // ₹2,499.00
      customerPhone: '+91 98860 11223',
    });

    expect(codOrder.paymentMethod).toBe('COD');
    expect(codOrder.status).toBe('PENDING_COLLECTION');
    expect(codOrder.amountRupees).toBe('2499.00');

    // COD order exceeding ₹5,000 threshold must be rejected
    expect(() =>
      PaymentService.createCodOrder({
        orderNumber: 'ORD-2026-COD-HIGH',
        amountPaise: 800000, // ₹8,000.00 (Exceeds ₹5,000 limit)
        customerPhone: '+91 98860 11223',
      })
    ).toThrow('Cash on Delivery is only available for orders up to ₹5,000');
  });

  test('P.9: Cash on Delivery (COD) collection reconciliation records settlement and advances to COLLECTED', () => {
    const collection = PaymentService.recordCodCollection({
      orderNumber: 'ORD-2026-COD02',
      amountPaise: 249900,
      collectedBy: 'BlueDart Logistics Agent #44',
      collectedAt: new Date(),
      courierAwb: 'BD-AWB-987654',
      settlementBatchId: 'BATCH_20261111_01',
    });

    expect(collection.success).toBe(true);
    expect(collection.collectedBy).toContain('BlueDart');
    expect(collection.collectedAt).toBeInstanceOf(Date);
  });

  test('P.10: Net banking direct acquiring is safely deferred without paid gateway integration', () => {
    expect(PaymentService.isNetBankingSupported()).toBe(false);
  });

  test('P.11: EmailService safely logs simulation with explicit SIMULATED status', async () => {
    expect(EmailService.isConfigured()).toBe(false); // Key is placeholder in test env

    const result = await EmailService.sendEnquiryNotification({
      enquiryNumber: 'ENQ-TEST-001',
      customerName: 'Ananya Sharma',
      customerPhone: '+91 98860 00000',
      eventType: 'Bridal Set',
      notes: 'Testing email simulation mode',
      receivedAt: new Date().toISOString(),
    });

    expect(result.success).toBe(true);
    expect(result.status).toBe('SIMULATED'); // Explicit delivery status
    expect(result.messageId).toContain('sim_ENQ-TEST-001');
  });

  test('P.12: RateLimiter falls back to in-memory gracefully when Upstash is unconfigured', async () => {
    const testIp = '192.168.10.99';
    await authRateLimiter.reset(testIp);

    const initial = await authRateLimiter.checkDistributed(testIp, 5, 60);
    expect(initial.allowed).toBe(true);
    expect(initial.backend).toBe('memory'); // Fell back to memory safely
  });

  test('P.13: MemoryRateLimiter enforces window without sliding reset on every attempt', () => {
    const limiter = new MemoryRateLimiter();
    const testKey = 'test_expiry_semantics';

    // 1st failure
    limiter.recordFailure(testKey, 1000); // 1-second window
    let check = limiter.check(testKey, 2, 1000);
    expect(check.remaining).toBe(1);

    // 2nd failure
    limiter.recordFailure(testKey, 1000);
    check = limiter.check(testKey, 2, 1000);
    expect(check.allowed).toBe(false);
    expect(check.remaining).toBe(0);
  });

  test('P.14: Maps truthful, non-misleading customer payment states', () => {
    const s1 = PaymentService.getCustomerPaymentStatus('PENDING_PAYMENT');
    expect(s1.customerState).toBe('AWAITING_PAYMENT');
    expect(s1.actionRequired).toBe(true);
    expect(s1.actionType).toBe('PAY_NOW');

    const s2 = PaymentService.getCustomerPaymentStatus('AWAITING_PAYMENT_VERIFICATION');
    expect(s2.customerState).toBe('PAYMENT_UNDER_VERIFICATION');
    expect(s2.actionRequired).toBe(false);
    expect(s2.actionType).toBe('WAIT_FOR_VERIFICATION');

    const s3 = PaymentService.getCustomerPaymentStatus('PAYMENT_CONFIRMED');
    expect(s3.customerState).toBe('VERIFIED');
    expect(s3.title).toContain('Payment Confirmed');

    const s4 = PaymentService.getCustomerPaymentStatus('CANCELLED', 'REJECTED');
    expect(s4.customerState).toBe('REJECTED');
    expect(s4.title).toContain('Payment Verification Failed');
  });
});
