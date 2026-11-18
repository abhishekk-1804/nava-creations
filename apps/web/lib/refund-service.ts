import { prisma } from '@nava/db';
import { Money, RefundStateMachine, RefundStatus } from '@nava/domain';
import { ValidationError, NotFoundError, ConflictError } from '@nava/shared';
import { isDatabaseAvailable } from './catalog-service';
import { OrderService } from './order-service';

export interface RequestRefundInput {
  orderNumber: string;
  amountPaise: number;
  reason: string;
  initiatedByUserId: string;
  idempotencyKey?: string;
  bankTransactionRef?: string;
  notes?: string;
}

export interface RecordManualRefundInput {
  refundId: string;
  bankTransactionRef: string;
  processedByUserId: string;
  notes?: string;
}

export interface RefundDto {
  id: string;
  orderId: string;
  orderNumber: string;
  paymentId: string;
  amountPaise: number;
  amountRupees: string;
  status: RefundStatus;
  reason?: string | null;
  idempotencyKey: string;
  gatewayRefundId?: string | null;
  failureReason?: string | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Global in-memory storage for test isolation & offline environments
const globalForRefunds = globalThis as unknown as {
  __nava_memory_refunds__?: Map<string, RefundDto>;
};

if (!globalForRefunds.__nava_memory_refunds__) {
  globalForRefunds.__nava_memory_refunds__ = new Map<string, RefundDto>();
}

const memoryRefunds = globalForRefunds.__nava_memory_refunds__;

export class RefundService {
  /**
   * Initiates a validated refund request for an order with confirmed payment.
   * Enforces financial bounds, idempotency, and audit logging.
   */
  static async requestRefund(input: RequestRefundInput): Promise<RefundDto> {
    if (!input.amountPaise || input.amountPaise <= 0) {
      throw new ValidationError('Refund amount must be a positive integer in paise.');
    }
    if (!input.reason || input.reason.trim() === '') {
      throw new ValidationError('Refund reason is required.');
    }
    if (!input.initiatedByUserId || input.initiatedByUserId.trim() === '') {
      throw new ValidationError('Authorized user ID required for refund initiation.');
    }

    const order = await OrderService.getOrder(input.orderNumber);
    if (!order) {
      throw new NotFoundError(`Order ${input.orderNumber} not found.`);
    }

    // Eligibility Guard: Only orders with verified/captured payments can be refunded
    if (order.status === 'PENDING_PAYMENT' || order.status === 'AWAITING_PAYMENT_VERIFICATION') {
      throw new ValidationError(
        `Cannot refund order in status '${order.status}': Payment has not been verified.`
      );
    }

    if (isDatabaseAvailable()) {
      return await prisma.$transaction(async (tx) => {
        // Find the captured/verified payment for this order
        const payment = await tx.payment.findFirst({
          where: {
            orderId: order.id,
            status: { in: ['VERIFIED', 'COLLECTED', 'PARTIALLY_REFUNDED'] },
          },
        });

        if (!payment) {
          throw new ValidationError(
            `No verified or collected payment found for order ${order.orderNumber} eligible for refund.`
          );
        }

        // Fetch existing refunds to prevent over-refunding
        const existingRefunds = await tx.refund.findMany({
          where: {
            orderId: order.id,
            status: { in: ['PENDING', 'PROCESSING', 'PROCESSED'] },
          },
        });

        // Calculate previously refunded total
        const previouslyRefundedPaise = existingRefunds.reduce(
          (sum: number, r: { amountPaise: number }) => sum + r.amountPaise,
          0
        );

        const capturedMoney = Money.fromPaise(payment.amountPaise);
        const previouslyRefundedMoney = Money.fromPaise(previouslyRefundedPaise);
        const requestedMoney = Money.fromPaise(input.amountPaise);

        // Domain validation
        const amountValidation = RefundStateMachine.validateRefundAmount(
          capturedMoney,
          previouslyRefundedMoney,
          requestedMoney
        );

        if (amountValidation.isFailure) {
          throw new ValidationError(amountValidation.error.message);
        }

        const nextAttempt = existingRefunds.length + 1;
        const idempotencyKey =
          input.idempotencyKey ||
          RefundStateMachine.generateIdempotencyKey(order.id, payment.id, nextAttempt);

        // Check idempotency duplicate
        const duplicate = await tx.refund.findUnique({
          where: { idempotencyKey },
        });

        if (duplicate) {
          throw new ConflictError(
            `A refund request with idempotency key "${idempotencyKey}" already exists.`
          );
        }

        const isDirectSettlement = Boolean(input.bankTransactionRef && input.bankTransactionRef.trim() !== '');
        const initialStatus: RefundStatus = isDirectSettlement ? 'PROCESSED' : 'PENDING';

        const created = await tx.refund.create({
          data: {
            orderId: order.id,
            paymentId: payment.id,
            amountPaise: input.amountPaise,
            status: initialStatus,
            reason: input.reason,
            idempotencyKey,
            gatewayRefundId: input.bankTransactionRef || null,
          },
        });

        // Update payment status
        const totalRefundedPaise = previouslyRefundedPaise + input.amountPaise;
        const isFullyRefunded = totalRefundedPaise >= payment.amountPaise;
        const newPaymentStatus = isFullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

        await tx.payment.update({
          where: { id: payment.id },
          data: { status: newPaymentStatus },
        });

        // Audit log
        await tx.auditLog.create({
          data: {
            userId: input.initiatedByUserId,
            action: isDirectSettlement ? 'REFUND_PROCESSED' : 'REFUND_REQUESTED',
            entity: 'Refund',
            entityId: created.id,
            newValues: {
              orderNumber: order.orderNumber,
              amountPaise: input.amountPaise,
              status: initialStatus,
              reason: input.reason,
              bankTransactionRef: input.bankTransactionRef || null,
              idempotencyKey,
            },
          },
        });

        return {
          id: created.id,
          orderId: created.orderId,
          orderNumber: order.orderNumber,
          paymentId: created.paymentId,
          amountPaise: created.amountPaise,
          amountRupees: `₹${(created.amountPaise / 100).toFixed(2)}`,
          status: created.status as RefundStatus,
          reason: created.reason,
          idempotencyKey: created.idempotencyKey,
          gatewayRefundId: created.gatewayRefundId,
          failureReason: created.failureReason,
          retryCount: created.retryCount,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        };
      });
    }

    // In-memory fallback for test harnesses
    const paymentAmount = order.totalPaise;
    const existingList = Array.from(memoryRefunds.values()).filter(r => r.orderNumber === order.orderNumber);
    const previouslyRefundedPaise = existingList.reduce((sum, r) => sum + r.amountPaise, 0);

    const capturedMoney = Money.fromPaise(paymentAmount);
    const previouslyRefundedMoney = Money.fromPaise(previouslyRefundedPaise);
    const requestedMoney = Money.fromPaise(input.amountPaise);

    const amountValidation = RefundStateMachine.validateRefundAmount(
      capturedMoney,
      previouslyRefundedMoney,
      requestedMoney
    );

    if (amountValidation.isFailure) {
      throw new ValidationError(amountValidation.error.message);
    }

    const idempotencyKey =
      input.idempotencyKey ||
      RefundStateMachine.generateIdempotencyKey(order.id, 'mem-pay-1', existingList.length + 1);

    for (const ref of memoryRefunds.values()) {
      if (ref.idempotencyKey === idempotencyKey) {
        throw new ConflictError(`A refund request with idempotency key "${idempotencyKey}" already exists.`);
      }
    }

    const isDirectSettlement = Boolean(input.bankTransactionRef && input.bankTransactionRef.trim() !== '');
    const refundDto: RefundDto = {
      id: `rfnd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentId: 'mem-pay-1',
      amountPaise: input.amountPaise,
      amountRupees: `₹${(input.amountPaise / 100).toFixed(2)}`,
      status: isDirectSettlement ? 'PROCESSED' : 'PENDING',
      reason: input.reason,
      idempotencyKey,
      gatewayRefundId: input.bankTransactionRef || null,
      retryCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    memoryRefunds.set(refundDto.id, refundDto);
    return refundDto;
  }

  /**
   * Confirms a manual bank IMPS/NEFT refund settlement for a pending refund.
   */
  static async recordManualRefund(input: RecordManualRefundInput): Promise<RefundDto> {
    if (!input.bankTransactionRef || input.bankTransactionRef.trim() === '') {
      throw new ValidationError('Bank transaction reference is required to record a manual refund.');
    }
    if (!input.processedByUserId || input.processedByUserId.trim() === '') {
      throw new ValidationError('Authorized processor user ID is required.');
    }

    if (isDatabaseAvailable()) {
      return await prisma.$transaction(async (tx) => {
        const refund = await tx.refund.findUnique({
          where: { id: input.refundId },
          include: { order: true },
        });

        if (!refund) {
          throw new NotFoundError(`Refund record ${input.refundId} not found.`);
        }

        const transition = RefundStateMachine.transition(
          refund.status as RefundStatus,
          'PROCESSED',
          { gatewayRefundId: input.bankTransactionRef, reason: input.notes }
        );

        if (transition.isFailure) {
          throw new ValidationError(transition.error.message);
        }

        const updated = await tx.refund.update({
          where: { id: refund.id },
          data: {
            status: 'PROCESSED',
            gatewayRefundId: input.bankTransactionRef.trim().toUpperCase(),
          },
        });

        await tx.auditLog.create({
          data: {
            userId: input.processedByUserId,
            action: 'REFUND_PROCESSED',
            entity: 'Refund',
            entityId: refund.id,
            newValues: {
              status: 'PROCESSED',
              bankTransactionRef: input.bankTransactionRef,
              notes: input.notes,
            },
          },
        });

        return {
          id: updated.id,
          orderId: updated.orderId,
          orderNumber: refund.order.orderNumber,
          paymentId: updated.paymentId,
          amountPaise: updated.amountPaise,
          amountRupees: `₹${(updated.amountPaise / 100).toFixed(2)}`,
          status: updated.status as RefundStatus,
          reason: updated.reason,
          idempotencyKey: updated.idempotencyKey,
          gatewayRefundId: updated.gatewayRefundId,
          failureReason: updated.failureReason,
          retryCount: updated.retryCount,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        };
      });
    }

    const ref = memoryRefunds.get(input.refundId);
    if (!ref) {
      throw new NotFoundError(`Refund record ${input.refundId} not found in memory.`);
    }

    const transition = RefundStateMachine.transition(ref.status, 'PROCESSED', {
      gatewayRefundId: input.bankTransactionRef,
      reason: input.notes,
    });

    if (transition.isFailure) {
      throw new ValidationError(transition.error.message);
    }

    ref.status = 'PROCESSED';
    ref.gatewayRefundId = input.bankTransactionRef.trim().toUpperCase();
    ref.updatedAt = new Date();
    return ref;
  }

  /**
   * Retrieves all refunds associated with an order.
   */
  static async getRefundsForOrder(orderNumberOrId: string): Promise<RefundDto[]> {
    if (isDatabaseAvailable()) {
      const refunds = await prisma.refund.findMany({
        where: {
          OR: [
            { orderId: orderNumberOrId },
            { order: { orderNumber: orderNumberOrId } },
          ],
        },
        include: { order: true },
        orderBy: { createdAt: 'desc' },
      });

      return refunds.map((r: any) => ({
        id: r.id,
        orderId: r.orderId,
        orderNumber: r.order.orderNumber,
        paymentId: r.paymentId,
        amountPaise: r.amountPaise,
        amountRupees: `₹${(r.amountPaise / 100).toFixed(2)}`,
        status: r.status as RefundStatus,
        reason: r.reason,
        idempotencyKey: r.idempotencyKey,
        gatewayRefundId: r.gatewayRefundId,
        failureReason: r.failureReason,
        retryCount: r.retryCount,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    }

    return Array.from(memoryRefunds.values()).filter(
      r => r.orderId === orderNumberOrId || r.orderNumber === orderNumberOrId
    );
  }
}
