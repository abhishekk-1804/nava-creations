import { describe, it, expect } from 'vitest';
import { PaymentStateMachine } from '../src/payment/state-machine.js';

describe('Payment State Machine (India-First Commerce)', () => {
  it('permits UPI manual verification flow: INITIATED -> AWAITING_VERIFICATION -> VERIFIED -> REFUNDED', () => {
    const t1 = PaymentStateMachine.transition('INITIATED', 'AWAITING_VERIFICATION', {
      reason: 'Customer submitted UPI 12-digit UTR reference',
    });
    expect(t1.isSuccess).toBe(true);

    const t2 = PaymentStateMachine.transition('AWAITING_VERIFICATION', 'VERIFIED', {
      reason: 'Store manager matched UTR against BharatPe statement',
      performedByUserId: 'usr_store_manager_01',
    });
    expect(t2.isSuccess).toBe(true);

    const t3 = PaymentStateMachine.transition('VERIFIED', 'REFUNDED', {
      reason: 'Bespoke item cancelled prior to production',
    });
    expect(t3.isSuccess).toBe(true);
  });

  it('permits rejection of fraudulent or unverified UPI transactions', () => {
    const t1 = PaymentStateMachine.transition('INITIATED', 'AWAITING_VERIFICATION');
    expect(t1.isSuccess).toBe(true);

    const t2 = PaymentStateMachine.transition('AWAITING_VERIFICATION', 'REJECTED', {
      reason: 'UTR reference not found in bank ledger after 24 hours',
      performedByUserId: 'usr_store_manager_01',
    });
    expect(t2.isSuccess).toBe(true);

    // Terminal state cannot transition
    const t3 = PaymentStateMachine.transition('REJECTED', 'VERIFIED');
    expect(t3.isFailure).toBe(true);
  });

  it('permits COD flow: INITIATED -> PENDING_COLLECTION -> COLLECTED', () => {
    const t1 = PaymentStateMachine.transition('INITIATED', 'PENDING_COLLECTION', {
      reason: 'Cash on delivery order confirmed for fulfillment',
    });
    expect(t1.isSuccess).toBe(true);

    const t2 = PaymentStateMachine.transition('PENDING_COLLECTION', 'COLLECTED', {
      reason: 'Courier collected cash upon doorstep delivery',
    });
    expect(t2.isSuccess).toBe(true);
  });

  it('rejects illegal transition skips', () => {
    // Cannot skip verification straight to verified from initiated without reference submission
    const skipToCollected = PaymentStateMachine.transition('INITIATED', 'COLLECTED');
    expect(skipToCollected.isFailure).toBe(true);

    const skipToVerified = PaymentStateMachine.transition('INITIATED', 'VERIFIED');
    expect(skipToVerified.isFailure).toBe(true);
  });

  it('permits partial refund progression: VERIFIED -> PARTIALLY_REFUNDED -> REFUNDED', () => {
    // 1. Partial refund issued
    const t1 = PaymentStateMachine.transition('VERIFIED', 'PARTIALLY_REFUNDED', {
      reason: 'Partial return of 1 out of 2 bangles processed',
    });
    expect(t1.isSuccess).toBe(true);

    // 2. Second partial refund issued
    const t2 = PaymentStateMachine.transition('PARTIALLY_REFUNDED', 'PARTIALLY_REFUNDED', {
      reason: 'Additional accessory adjustment refunded',
    });
    expect(t2.isSuccess).toBe(true);

    // 3. Final refund completes total order value
    const t3 = PaymentStateMachine.transition('PARTIALLY_REFUNDED', 'REFUNDED', {
      reason: 'Remaining order balance fully refunded',
    });
    expect(t3.isSuccess).toBe(true);

    // 4. Terminal state REFUNDED cannot transition further
    const t4 = PaymentStateMachine.transition('REFUNDED', 'VERIFIED');
    expect(t4.isFailure).toBe(true);
  });

  it('permits compensatory transition from PARTIALLY_REFUNDED back to VERIFIED on refund cancellation', () => {
    // If a proposed partial refund is voided or reversed by bank
    const t1 = PaymentStateMachine.transition('PARTIALLY_REFUNDED', 'VERIFIED', {
      reason: 'Partial refund request cancelled prior to bank debit or reversed',
    });
    expect(t1.isSuccess).toBe(true);
    if (t1.isSuccess) {
      expect(t1.value.to).toBe('VERIFIED');
    }
  });
});
