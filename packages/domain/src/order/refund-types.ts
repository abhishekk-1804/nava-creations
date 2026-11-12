import { Money } from '../money.js';

export type RefundStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PROCESSED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED';

export type RefundType = 'FULL' | 'PARTIAL';

export interface RefundTransition {
  readonly from: RefundStatus;
  readonly to: RefundStatus;
  readonly reason?: string;
  readonly gatewayRefundId?: string;
  readonly timestamp: Date;
}

export interface RefundRecord {
  readonly id: string;
  readonly orderId: string;
  readonly paymentId: string;
  readonly amount: Money;
  readonly refundType: RefundType;
  readonly status: RefundStatus;
  readonly idempotencyKey: string;
  readonly retryCount: number;
  readonly failureReason?: string;
  readonly gatewayRefundId?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
