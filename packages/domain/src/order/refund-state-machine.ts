import { InvalidStateTransitionError, Result, ValidationError, ok, err } from '@nava/shared';
import { Money } from '../money.js';
import { RefundStatus, RefundTransition, RefundType } from './refund-types.js';

/**
 * Pure Domain State Machine for Refund Lifecycle Management
 * Governs full refunds, partial refunds, gateway submission, failure handling, and retries.
 */
export class RefundStateMachine {
  private static readonly ALLOWED_TRANSITIONS: ReadonlyMap<RefundStatus, readonly RefundStatus[]> = new Map([
    ['PENDING', ['PROCESSING', 'FAILED', 'CANCELLED']],
    ['PROCESSING', ['PROCESSED', 'FAILED']],
    ['FAILED', ['RETRYING', 'CANCELLED']],
    ['RETRYING', ['PROCESSING', 'FAILED', 'CANCELLED']],
    ['PROCESSED', []], // Terminal state: settlement complete
    ['CANCELLED', []], // Terminal state: refund request revoked before processing
  ]);

  static canTransition(current: RefundStatus, next: RefundStatus): boolean {
    const allowed = this.ALLOWED_TRANSITIONS.get(current);
    return allowed ? allowed.includes(next) : false;
  }

  static transition(
    current: RefundStatus,
    next: RefundStatus,
    context?: { reason?: string; gatewayRefundId?: string }
  ): Result<RefundTransition, InvalidStateTransitionError> {
    if (!this.canTransition(current, next)) {
      return err(
        new InvalidStateTransitionError(
          `Cannot transition refund from state '${current}' to '${next}'`,
          { current, next }
        )
      );
    }

    return ok({
      from: current,
      to: next,
      reason: context?.reason,
      gatewayRefundId: context?.gatewayRefundId,
      timestamp: new Date(),
    });
  }

  /**
   * Generates a deterministic, unique idempotency key for gateway refund requests.
   * Format: rfnd_<orderId>_<paymentId>_<attemptIndex>
   */
  static generateIdempotencyKey(orderId: string, paymentId: string, attemptIndex: number): string {
    if (!orderId || !paymentId) {
      throw new ValidationError('orderId and paymentId are required to generate an idempotency key');
    }
    return `rfnd_${orderId.replace(/[^a-zA-Z0-9]/g, '')}_${paymentId.replace(/[^a-zA-Z0-9]/g, '')}_att${attemptIndex}`;
  }

  /**
   * Validates refund amount against original payment amount
   */
  static validateRefundAmount(
    capturedPaymentAmount: Money,
    previouslyRefundedAmount: Money,
    requestedRefundAmount: Money
  ): Result<{ refundType: RefundType; remainingBalance: Money }, ValidationError> {
    if (requestedRefundAmount.paise <= 0) {
      return err(new ValidationError('Requested refund amount must be greater than zero'));
    }

    const availableToRefund = capturedPaymentAmount.subtract(previouslyRefundedAmount);

    if (requestedRefundAmount.isGreaterThan(availableToRefund)) {
      return err(
        new ValidationError(
          `Requested refund amount (${requestedRefundAmount.formatINR()}) exceeds available refundable balance (${availableToRefund.formatINR()})`
        )
      );
    }

    const remainingBalance = availableToRefund.subtract(requestedRefundAmount);
    const isFullRefund = remainingBalance.paise === 0 && previouslyRefundedAmount.paise === 0;

    return ok({
      refundType: isFullRefund ? 'FULL' : 'PARTIAL',
      remainingBalance,
    });
  }
}
