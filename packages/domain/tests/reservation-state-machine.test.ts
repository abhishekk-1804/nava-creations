import { describe, it, expect } from 'vitest';
import { ReservationStateMachine } from '../src/inventory/reservation-state-machine.js';

describe('Inventory Reservation State Machine', () => {
  it('allows PENDING to transition to CONFIRMED on successful checkout', () => {
    const res = ReservationStateMachine.transition('PENDING', 'CONFIRMED', {
      reason: 'Payment captured successfully',
    });
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.to).toBe('CONFIRMED');
    }
  });

  it('allows PENDING to transition to EXPIRED when 15-minute timer fires', () => {
    const res = ReservationStateMachine.transition('PENDING', 'EXPIRED', {
      reason: '15-minute lock expired',
    });
    expect(res.isSuccess).toBe(true);
    if (res.isSuccess) {
      expect(res.value.to).toBe('EXPIRED');
    }
  });

  it('allows PENDING to transition to RELEASED on explicit cancellation', () => {
    const res = ReservationStateMachine.transition('PENDING', 'RELEASED', {
      reason: 'User emptied cart',
    });
    expect(res.isSuccess).toBe(true);
  });

  it('rejects transitions from terminal states', () => {
    const fromExpired = ReservationStateMachine.transition('EXPIRED', 'CONFIRMED');
    expect(fromExpired.isFailure).toBe(true);

    const fromConfirmed = ReservationStateMachine.transition('CONFIRMED', 'RELEASED');
    expect(fromConfirmed.isFailure).toBe(true);
  });
});
