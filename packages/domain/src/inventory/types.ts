export type ReservationStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'EXPIRED'
  | 'RELEASED';

export interface ReservationTransition {
  readonly from: ReservationStatus;
  readonly to: ReservationStatus;
  readonly reason?: string;
  readonly timestamp: Date;
}
