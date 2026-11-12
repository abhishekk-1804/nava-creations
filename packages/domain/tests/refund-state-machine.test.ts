import { describe, it, expect } from 'vitest';
import { RefundStateMachine } from '../src/order/refund-state-machine.js';
import { Money } from '../src/money.js';

describe('Refund State Machine', () => {
  it('permits linear progression from PENDING to PROCESSED', () => {
    const t1 = RefundStateMachine.transition('PENDING', 'PROCESSING');
    expect(t1.isSuccess).toBe(true);

    const t2 = RefundStateMachine.transition('PROCESSING', 'PROCESSED', {
      gatewayRefundId: 'rfnd_razorpay_123456',
    });
    expect(t2.isSuccess).toBe(true);
    if (t2.isSuccess) {
      expect(t2.value.gatewayRefundId).toBe('rfnd_razorpay_123456');
    }
  });

  it('permits retry lifecycle on gateway failure', () => {
    const t1 = RefundStateMachine.transition('PENDING', 'PROCESSING');
    expect(t1.isSuccess).toBe(true);

    const t2 = RefundStateMachine.transition('PROCESSING', 'FAILED', {
      reason: 'Bank network timeout',
    });
    expect(t2.isSuccess).toBe(true);

    const t3 = RefundStateMachine.transition('FAILED', 'RETRYING');
    expect(t3.isSuccess).toBe(true);

    const t4 = RefundStateMachine.transition('RETRYING', 'PROCESSING');
    expect(t4.isSuccess).toBe(true);

    const t5 = RefundStateMachine.transition('PROCESSING', 'PROCESSED');
    expect(t5.isSuccess).toBe(true);
  });

  it('blocks transitions from terminal PROCESSED state', () => {
    const t = RefundStateMachine.transition('PROCESSED', 'FAILED');
    expect(t.isFailure).toBe(true);
    if (t.isFailure) {
      expect(t.error.code).toBe('INVALID_STATE_TRANSITION');
    }
  });

  it('generates unique deterministic idempotency keys', () => {
    const key1 = RefundStateMachine.generateIdempotencyKey('ord-101', 'pay-202', 1);
    const key2 = RefundStateMachine.generateIdempotencyKey('ord-101', 'pay-202', 2);
    expect(key1).toBe('rfnd_ord101_pay202_att1');
    expect(key2).toBe('rfnd_ord101_pay202_att2');
    expect(key1).not.toBe(key2);
  });

  it('validates full refund amount', () => {
    const payment = Money.fromPaise(250000); // ₹2,500
    const previouslyRefunded = Money.zero();
    const requested = Money.fromPaise(250000);

    const validation = RefundStateMachine.validateRefundAmount(payment, previouslyRefunded, requested);
    expect(validation.isSuccess).toBe(true);
    if (validation.isSuccess) {
      expect(validation.value.refundType).toBe('FULL');
      expect(validation.value.remainingBalance.paise).toBe(0);
    }
  });

  it('validates partial refund amount and calculates remaining balance', () => {
    const payment = Money.fromPaise(300000); // ₹3,000
    const previouslyRefunded = Money.fromPaise(100000); // ₹1,000 previously refunded
    const requested = Money.fromPaise(100000); // ₹1,000 requested now

    const validation = RefundStateMachine.validateRefundAmount(payment, previouslyRefunded, requested);
    expect(validation.isSuccess).toBe(true);
    if (validation.isSuccess) {
      expect(validation.value.refundType).toBe('PARTIAL');
      expect(validation.value.remainingBalance.paise).toBe(100000); // ₹1,000 remaining
    }
  });

  it('rejects refund exceeding available refundable balance', () => {
    const payment = Money.fromPaise(100000);
    const previouslyRefunded = Money.fromPaise(80000);
    const requested = Money.fromPaise(30000); // 80k + 30k = 110k > 100k

    const validation = RefundStateMachine.validateRefundAmount(payment, previouslyRefunded, requested);
    expect(validation.isFailure).toBe(true);
    if (validation.isFailure) {
      expect(validation.error.message).toContain('exceeds available refundable balance');
    }
  });
});
