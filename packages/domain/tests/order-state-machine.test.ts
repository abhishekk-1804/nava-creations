import { describe, it, expect } from 'vitest';
import { OrderStateMachine } from '../src/order/state-machine.js';

describe('Order State Machine', () => {
  it('permits valid linear progression from PENDING_PAYMENT to DELIVERED to CLOSED', () => {
    const t1 = OrderStateMachine.transition('PENDING_PAYMENT', 'PAYMENT_CONFIRMED');
    expect(t1.isSuccess).toBe(true);

    const t2 = OrderStateMachine.transition('PAYMENT_CONFIRMED', 'PROCESSING');
    expect(t2.isSuccess).toBe(true);

    const t3 = OrderStateMachine.transition('PROCESSING', 'SHIPPED');
    expect(t3.isSuccess).toBe(true);

    const t4 = OrderStateMachine.transition('SHIPPED', 'OUT_FOR_DELIVERY');
    expect(t4.isSuccess).toBe(true);

    const t5 = OrderStateMachine.transition('OUT_FOR_DELIVERY', 'DELIVERED');
    expect(t5.isSuccess).toBe(true);

    const t6 = OrderStateMachine.transition('DELIVERED', 'CLOSED');
    expect(t6.isSuccess).toBe(true);
  });

  it('permits India-first Merchant UPI QR progression: PENDING_PAYMENT -> AWAITING_PAYMENT_VERIFICATION -> PAYMENT_CONFIRMED', () => {
    const t1 = OrderStateMachine.transition('PENDING_PAYMENT', 'AWAITING_PAYMENT_VERIFICATION', {
      reason: 'Customer submitted UPI UTR reference',
    });
    expect(t1.isSuccess).toBe(true);

    const t2 = OrderStateMachine.transition('AWAITING_PAYMENT_VERIFICATION', 'PAYMENT_CONFIRMED', {
      reason: 'Store owner verified UPI receipt in bank statement',
      performedByUserId: 'usr_admin_owner',
    });
    expect(t2.isSuccess).toBe(true);

    const t3 = OrderStateMachine.transition('PAYMENT_CONFIRMED', 'PROCESSING');
    expect(t3.isSuccess).toBe(true);
  });

  it('permits India-first COD order progression: PENDING_PAYMENT -> PROCESSING without prior online payment', () => {
    const t1 = OrderStateMachine.transition('PENDING_PAYMENT', 'PROCESSING', {
      reason: 'Cash on delivery order confirmed for dispatch',
    });
    expect(t1.isSuccess).toBe(true);

    const t2 = OrderStateMachine.transition('PROCESSING', 'SHIPPED');
    expect(t2.isSuccess).toBe(true);
  });

  it('permits pre-shipment order cancellation and closure', () => {
    const t1 = OrderStateMachine.transition('PENDING_PAYMENT', 'PAYMENT_CONFIRMED');
    expect(t1.isSuccess).toBe(true);

    const t2 = OrderStateMachine.transition('PAYMENT_CONFIRMED', 'CANCELLED', {
      reason: 'Customer requested cancellation prior to packing',
    });
    expect(t2.isSuccess).toBe(true);

    const t3 = OrderStateMachine.transition('CANCELLED', 'CLOSED', {
      reason: 'Order cancelled and settlement complete',
    });
    expect(t3.isSuccess).toBe(true);
  });

  it('permits courier RTO (Return to Origin) lifecycle on delivery failure', () => {
    const t1 = OrderStateMachine.transition('SHIPPED', 'OUT_FOR_DELIVERY');
    expect(t1.isSuccess).toBe(true);

    const t2 = OrderStateMachine.transition('OUT_FOR_DELIVERY', 'RTO_INITIATED', {
      reason: 'Customer unavailable after 3 attempts; courier initiated RTO',
    });
    expect(t2.isSuccess).toBe(true);

    const t3 = OrderStateMachine.transition('RTO_INITIATED', 'RTO_DELIVERED', {
      reason: 'Parcel returned to Bengaluru warehouse',
    });
    expect(t3.isSuccess).toBe(true);

    const t4 = OrderStateMachine.transition('RTO_DELIVERED', 'CLOSED', {
      reason: 'Restocked to inventory and closed',
    });
    expect(t4.isSuccess).toBe(true);
  });

  it('permits valid return cycle with QC verification', () => {
    const t1 = OrderStateMachine.transition('DELIVERED', 'RETURN_REQUESTED');
    expect(t1.isSuccess).toBe(true);

    const t2 = OrderStateMachine.transition('RETURN_REQUESTED', 'RETURNED');
    expect(t2.isSuccess).toBe(true);

    const t3 = OrderStateMachine.transition('RETURNED', 'CLOSED');
    expect(t3.isSuccess).toBe(true);
  });

  it('rejects invalid or skipped state transitions', () => {
    const directToDelivered = OrderStateMachine.transition('PENDING_PAYMENT', 'DELIVERED');
    expect(directToDelivered.isFailure).toBe(true);
    if (directToDelivered.isFailure) {
      expect(directToDelivered.error.code).toBe('INVALID_STATE_TRANSITION');
    }

    const shippedToPaid = OrderStateMachine.transition('SHIPPED', 'PAYMENT_CONFIRMED');
    expect(shippedToPaid.isFailure).toBe(true);
  });

  it('blocks transitions from terminal CLOSED state', () => {
    const fromClosed = OrderStateMachine.transition('CLOSED', 'PAYMENT_CONFIRMED');
    expect(fromClosed.isFailure).toBe(true);
  });
});
