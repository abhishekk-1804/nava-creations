import { InvalidStateTransitionError, Result, ok, err } from '@nava/shared';
import { OrderStatus, OrderStateTransition } from './types.js';

/**
 * Pure Domain State Machine for Order Lifecycle Management
 * Enforces strict linear progression, courier RTO handling, and terminal closure.
 * Note: Financial refunds and payment settlements are tracked via the dedicated RefundStateMachine.
 */
export class OrderStateMachine {
  private static readonly ALLOWED_TRANSITIONS: ReadonlyMap<OrderStatus, readonly OrderStatus[]> = new Map([
    ['PENDING_PAYMENT', ['AWAITING_PAYMENT_VERIFICATION', 'PAYMENT_CONFIRMED', 'PROCESSING', 'CANCELLED']],
    ['AWAITING_PAYMENT_VERIFICATION', ['PAYMENT_CONFIRMED', 'CANCELLED']],
    ['PAYMENT_CONFIRMED', ['PROCESSING', 'CANCELLED']],
    ['PROCESSING', ['SHIPPED', 'CANCELLED']],
    ['SHIPPED', ['OUT_FOR_DELIVERY', 'RTO_INITIATED']],
    ['OUT_FOR_DELIVERY', ['DELIVERED', 'RTO_INITIATED']],
    ['RTO_INITIATED', ['RTO_DELIVERED']],
    ['RTO_DELIVERED', ['CLOSED']],
    ['DELIVERED', ['RETURN_REQUESTED', 'CLOSED']],
    ['RETURN_REQUESTED', ['RETURNED', 'DELIVERED']], // Reverts to DELIVERED if QC inspection fails
    ['RETURNED', ['CLOSED']],
    ['CANCELLED', ['CLOSED']],
    ['CLOSED', []], // Terminal state
  ]);

  static canTransition(current: OrderStatus, next: OrderStatus): boolean {
    const allowed = this.ALLOWED_TRANSITIONS.get(current);
    return allowed ? allowed.includes(next) : false;
  }

  static transition(
    current: OrderStatus,
    next: OrderStatus,
    context?: { reason?: string; performedByUserId?: string }
  ): Result<OrderStateTransition, InvalidStateTransitionError> {
    if (!this.canTransition(current, next)) {
      return err(
        new InvalidStateTransitionError(
          `Cannot transition order from state '${current}' to '${next}'`,
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
