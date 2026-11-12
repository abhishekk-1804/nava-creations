export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'AWAITING_PAYMENT_VERIFICATION'
  | 'PAYMENT_CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RTO_INITIATED'
  | 'RTO_DELIVERED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'CLOSED';

export interface OrderStateTransition {
  readonly from: OrderStatus;
  readonly to: OrderStatus;
  readonly reason?: string;
  readonly performedByUserId?: string;
  readonly timestamp: Date;
}
