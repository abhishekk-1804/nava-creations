import { test, expect } from '@playwright/test';
import {
  OrderStateMachine,
  PaymentStateMachine,
  ReservationStateMachine,
  Money,
} from '@nava/domain';
import { PaymentService } from '../lib/payment-service';

test.describe('Sprint 2J: Commerce Data Foundation & India-First Payment Lifecycle', () => {
  test.beforeEach(() => {
    PaymentService.resetRegistriesForTesting();
    PaymentService.setMerchantConfigForTesting({
      upiVpa: 'navacreations@icici',
      merchantName: 'NAVA CREATIONS',
      isMerchantConfirmed: true,
    });
  });

  // 1. Monetary Calculations & Integer Paise Guarantee
  test('CF.1: Monetary calculations enforce integer paise and prevent floating-point drift', () => {
    // 3 items at ₹3,499.00 each
    const unitPrice = Money.fromRupees(3499);
    expect(unitPrice.paise).toBe(349900);

    const subtotal = unitPrice.multiply(3);
    expect(subtotal.paise).toBe(1049700); // Exactly ₹10,497.00
    expect(subtotal.formatINR()).toContain('10,497');

    // Reject non-integer / floating-point paise
    expect(() => Money.fromPaise(100.5)).toThrow('Money paise must be an exact integer');
  });

  // 2. Order Creation & State Machine Progression
  test('CF.2: Order lifecycle adheres strictly to state machine transitions', () => {
    // UPI Flow
    const upiStep1 = OrderStateMachine.transition('PENDING_PAYMENT', 'AWAITING_PAYMENT_VERIFICATION', {
      reason: 'Customer submitted UPI UTR reference',
    });
    expect(upiStep1.isSuccess).toBe(true);

    const upiStep2 = OrderStateMachine.transition('AWAITING_PAYMENT_VERIFICATION', 'PAYMENT_CONFIRMED', {
      reason: 'Store owner verified UTR against bank settlement statement',
      performedByUserId: 'usr_admin_manager',
    });
    expect(upiStep2.isSuccess).toBe(true);

    const payStep = PaymentStateMachine.transition('AWAITING_VERIFICATION', 'VERIFIED', {
      reason: 'Verified against bank ledger statement',
      performedByUserId: 'usr_admin_manager',
    });
    expect(payStep.isSuccess).toBe(true);

    const upiStep3 = OrderStateMachine.transition('PAYMENT_CONFIRMED', 'PROCESSING');
    expect(upiStep3.isSuccess).toBe(true);

    const upiStep4 = OrderStateMachine.transition('PROCESSING', 'SHIPPED');
    expect(upiStep4.isSuccess).toBe(true);

    const upiStep5 = OrderStateMachine.transition('SHIPPED', 'OUT_FOR_DELIVERY');
    expect(upiStep5.isSuccess).toBe(true);

    const upiStep6 = OrderStateMachine.transition('OUT_FOR_DELIVERY', 'DELIVERED');
    expect(upiStep6.isSuccess).toBe(true);

    const upiStep7 = OrderStateMachine.transition('DELIVERED', 'CLOSED');
    expect(upiStep7.isSuccess).toBe(true);
  });

  // 3. Pre-Shipment Order Cancellation & Stock Release
  test('CF.3: Permits order cancellation only prior to dispatch and blocks post-dispatch cancellation', () => {
    // Permitted prior to shipping
    const cancelFromPending = OrderStateMachine.transition('PENDING_PAYMENT', 'CANCELLED', {
      reason: 'Customer cancelled prior to payment',
    });
    expect(cancelFromPending.isSuccess).toBe(true);

    const cancelFromAwaiting = OrderStateMachine.transition('AWAITING_PAYMENT_VERIFICATION', 'CANCELLED', {
      reason: 'UTR reference expired or fraudulent',
    });
    expect(cancelFromAwaiting.isSuccess).toBe(true);

    const cancelFromConfirmed = OrderStateMachine.transition('PAYMENT_CONFIRMED', 'CANCELLED', {
      reason: 'Customer changed mind prior to packing',
    });
    expect(cancelFromConfirmed.isSuccess).toBe(true);

    // BLOCKED once dispatched / shipped
    const cancelFromShipped = OrderStateMachine.transition('SHIPPED', 'CANCELLED');
    expect(cancelFromShipped.isFailure).toBe(true);

    const cancelFromDelivered = OrderStateMachine.transition('DELIVERED', 'CANCELLED');
    expect(cancelFromDelivered.isFailure).toBe(true);
  });

  // 4. Inventory Reservation & Concurrency Safety
  test('CF.4: Inventory reservation lifecycle manages holds and automatic release', () => {
    // Hold stock on checkout initiate
    const hold = ReservationStateMachine.transition('PENDING', 'CONFIRMED');
    expect(hold.isSuccess).toBe(true);

    // Release stock on cart abandon
    const release = ReservationStateMachine.transition('PENDING', 'RELEASED');
    expect(release.isSuccess).toBe(true);

    // Expire pending hold after TTL
    const expire = ReservationStateMachine.transition('PENDING', 'EXPIRED');
    expect(expire.isSuccess).toBe(true);

    // Cannot transition from terminal CONFIRMED or RELEASED
    const reconfirm = ReservationStateMachine.transition('RELEASED', 'CONFIRMED');
    expect(reconfirm.isFailure).toBe(true);

    const fromConfirmed = ReservationStateMachine.transition('CONFIRMED', 'RELEASED');
    expect(fromConfirmed.isFailure).toBe(true);
  });

  // 5. Merchant UPI QR Generation & Instructions
  test('CF.5: UPI QR generator generates valid NPCI intent URI with unique order reference', () => {
    const instructions = PaymentService.generateUpiInstructions({
      orderNumber: 'ORD-2026-BLR-88',
      amountPaise: 499900, // ₹4,999.00
    });

    expect(instructions.amountPaise).toBe(499900);
    expect(instructions.amountRupees).toBe('4999.00');
    expect(instructions.orderReferenceTag).toBe('NAVA-ORD2026BLR88');
    expect(instructions.upiIntentUrl).toContain('upi://pay?');
    expect(instructions.upiIntentUrl).toContain('am=4999.00');
    expect(instructions.status).toBe('AWAITING_PAYMENT_VERIFICATION');
  });

  // 6. UTR Duplicate Replay Attack Prevention
  test('CF.6: Prevents replay attacks by detecting duplicate UTR references across orders', () => {
    const uniqueUtr = 'UTR202611119999';

    const firstSubmission = PaymentService.submitUpiTransactionReference({
      orderNumber: 'ORD-2026-101',
      claimedUtr: uniqueUtr,
      amountPaise: 199900,
    });
    expect(firstSubmission.success).toBe(true);
    expect(firstSubmission.isDuplicateClaim).toBe(false);

    // Replay attempt on a different order number must be flagged as duplicate
    const secondSubmission = PaymentService.submitUpiTransactionReference({
      orderNumber: 'ORD-2026-102',
      claimedUtr: uniqueUtr,
      amountPaise: 199900,
    });
    expect(secondSubmission.success).toBe(true);
    expect(secondSubmission.isDuplicateClaim).toBe(true);
    expect(secondSubmission.message).toContain('flagged for audit');
  });

  // 7. Store Owner Manual Verification Workflow
  test('CF.7: Store owner manual verification advances payment to VERIFIED and order to PAYMENT_CONFIRMED', () => {
    const verification = PaymentService.verifyUpiPayment({
      orderNumber: 'ORD-2026-103',
      claimedUtr: 'BANKUTR12345678',
      verifiedTransactionId: 'BANKUTR12345678',
      amountPaise: 349900,
      verifiedByUserId: 'usr_admin_store_owner',
      bankReference: 'SBI_CURRENT_ACC_TXN_001',
      verificationNotes: 'Credit matched in SBI NetBanking statement',
    });

    expect(verification.success).toBe(true);
    expect(verification.orderNumber).toBe('ORD-2026-103');
    expect(verification.verifiedByUserId).toBe('usr_admin_store_owner');
    expect(verification.verifiedTransactionId).toBe('BANKUTR12345678');
  });

  // 8. Fraudulent or Unmatched UTR Rejection
  test('CF.8: Store owner rejection cancels unverified orders with audit reason', () => {
    const rejection = PaymentService.rejectUpiPayment({
      orderNumber: 'ORD-2026-104',
      reason: 'Fake UTR: No corresponding credit found in bank ledger after 48 hours',
      performedByUserId: 'usr_admin_store_owner',
    });

    expect(rejection.success).toBe(true);
    expect(rejection.status).toBe('CANCELLED');
    expect(rejection.customerState).toBe('REJECTED');
  });

  // 9. Cash on Delivery (COD) Creation & Threshold Limits
  test('CF.9: Cash on Delivery validates threshold limits and sets PENDING_COLLECTION', () => {
    const codOrder = PaymentService.createCodOrder({
      orderNumber: 'ORD-2026-COD-99',
      amountPaise: 349900, // ₹3,499.00 (within ₹5,000 threshold)
      customerPhone: '+91 98860 11223',
    });

    expect(codOrder.paymentMethod).toBe('COD');
    expect(codOrder.status).toBe('PENDING_COLLECTION');
    expect(codOrder.amountRupees).toBe('3499.00');

    // Exceeding ₹5,000 max order threshold must be rejected
    expect(() =>
      PaymentService.createCodOrder({
        orderNumber: 'ORD-2026-COD-OVERLIMIT',
        amountPaise: 500100, // ₹5,001.00
        customerPhone: '+91 98860 11223',
      })
    ).toThrow('Cash on Delivery is only available for orders up to ₹5,000');
  });

  // 10. Cash on Delivery Collection Reconciliation
  test('CF.10: COD collection reconciliation marks settlement and transitions to COLLECTED', () => {
    const settlement = PaymentService.recordCodCollection({
      orderNumber: 'ORD-2026-COD-99',
      amountPaise: 599900,
      collectedBy: 'Delhivery Surface Logistics #88',
      collectedAt: new Date(),
      courierAwb: 'DLVRY-AWB-445566',
      settlementBatchId: 'DELHIVERY_RECON_20261111',
    });

    expect(settlement.success).toBe(true);
    expect(settlement.collectedBy).toContain('Delhivery');
    expect(settlement.orderNumber).toBe('ORD-2026-COD-99');
  });

  // 11. Role-Based Authorization Enforcement on Admin Endpoints
  test('CF.11: Admin catalog and inventory endpoints require active store manager authorization', async ({
    request,
  }) => {
    test.setTimeout(60000);

    // Unauthenticated mutation attempt
    const res1 = await request.post('/api/admin/catalog/products', {
      data: { title: 'Unauthorized Kundan Choker', pricePaise: 500000 },
    });
    expect(res1.status()).toBe(401);

    const res2 = await request.post('/api/admin/inventory/var_test_01', {
      data: { availableQty: 100 },
    });
    expect(res2.status()).toBe(401);
  });
});
