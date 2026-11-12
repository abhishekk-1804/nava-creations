import { InvalidStateTransitionError, Result, ok, err } from '@nava/shared';
import { PaymentStatus, PaymentStateTransition } from './types.js';

/**
 * Pure Domain State Machine for Sovereign Indian Payment Lifecycles
 * Governs Merchant UPI QR manual verification and Cash-on-Delivery collections.
 * Enforces zero-fee, zero-MDR merchant compliance.
 */
export class PaymentStateMachine {
  private static readonly ALLOWED_TRANSITIONS: ReadonlyMap<PaymentStatus, readonly PaymentStatus[]> = new Map([
    // UPI Merchant QR flow
    ['INITIATED', ['AWAITING_VERIFICATION', 'PENDING_COLLECTION', 'FAILED']],
    ['AWAITING_VERIFICATION', ['VERIFIED', 'REJECTED', 'FAILED']],
    ['VERIFIED', ['PARTIALLY_REFUNDED', 'REFUNDED']],

    // Cash on Delivery (COD) flow
    ['PENDING_COLLECTION', ['COLLECTED', 'FAILED']],
    ['COLLECTED', ['PARTIALLY_REFUNDED', 'REFUNDED']],

    // Refund progression & compensatory recovery
    ['PARTIALLY_REFUNDED', ['PARTIALLY_REFUNDED', 'REFUNDED', 'VERIFIED']],

    // Terminal states
    ['REJECTED', []],
    ['FAILED', []],
    ['REFUNDED', []],
  ]);

  static canTransition(current: PaymentStatus, next: PaymentStatus): boolean {
    const allowed = this.ALLOWED_TRANSITIONS.get(current);
    return allowed ? allowed.includes(next) : false;
  }

  static transition(
    current: PaymentStatus,
    next: PaymentStatus,
    context?: { reason?: string; performedByUserId?: string }
  ): Result<PaymentStateTransition, InvalidStateTransitionError> {
    if (!this.canTransition(current, next)) {
      return err(
        new InvalidStateTransitionError(
          `Cannot transition payment status from '${current}' to '${next}'`,
          { current, next }
        )
      );
    }

    return ok({
      from: current,
      to: next,
      reason: context?.reason,
      performedByUserId: context?.performedByUserId,
      timestamp: new Date(),
    });
  }
}
