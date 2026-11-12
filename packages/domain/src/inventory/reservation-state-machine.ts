import { InvalidStateTransitionError, Result, ok, err } from '@nava/shared';
import { ReservationStatus, ReservationTransition } from './types.js';

/**
 * Pure Domain State Machine for Inventory Reservation Lifecycle
 */
export class ReservationStateMachine {
  private static readonly ALLOWED_TRANSITIONS: ReadonlyMap<ReservationStatus, readonly ReservationStatus[]> = new Map([
    ['PENDING', ['CONFIRMED', 'EXPIRED', 'RELEASED']],
    ['CONFIRMED', []], // Terminal state: converted to permanent order allocation
    ['EXPIRED', []],   // Terminal state: released back to available_qty
    ['RELEASED', []],  // Terminal state: manually cancelled or abandoned cart recovered
  ]);

  static canTransition(current: ReservationStatus, next: ReservationStatus): boolean {
    const allowed = this.ALLOWED_TRANSITIONS.get(current);
    return allowed ? allowed.includes(next) : false;
  }

  static transition(
    current: ReservationStatus,
    next: ReservationStatus,
    context?: { reason?: string }
  ): Result<ReservationTransition, InvalidStateTransitionError> {
    if (!this.canTransition(current, next)) {
      return err(
        new InvalidStateTransitionError(
          `Cannot transition inventory reservation from state '${current}' to '${next}'`,
          { current, next }
        )
      );
    }

    return ok({
      from: current,
      to: next,
      reason: context?.reason,
      timestamp: new Date(),
    });
  }
}
