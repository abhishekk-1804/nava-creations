import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { RefundService } from '@/lib/refund-service';
import { OrderService } from '@/lib/order-service';
import { ValidationError, NotFoundError, ConflictError } from '@nava/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const order = await OrderService.getOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const refunds = await RefundService.getRefundsForOrder(order.orderNumber);
    return NextResponse.json({ success: true, refunds }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve refunds';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const order = await OrderService.getOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await request.json();

    // Check if this is confirming an existing manual refund settlement
    if (body.action === 'RECORD_SETTLEMENT' || body.refundId) {
      if (!body.refundId) {
        return NextResponse.json({ error: 'Refund ID is required for settlement recording.' }, { status: 422 });
      }
      const refund = await RefundService.recordManualRefund({
        refundId: body.refundId,
        bankTransactionRef: body.bankTransactionRef || '',
        processedByUserId: session.userId,
        notes: body.notes,
      });
      return NextResponse.json({
        success: true,
        refund,
        message: 'Refund settlement recorded successfully.',
      }, { status: 200 });
    }

    // Otherwise, initiate a new refund request
    const refund = await RefundService.requestRefund({
      orderNumber: order.orderNumber,
      amountPaise: body.amountPaise,
      reason: body.reason,
      initiatedByUserId: session.userId,
      bankTransactionRef: body.bankTransactionRef,
      notes: body.notes,
    });

    return NextResponse.json({
      success: true,
      refund,
      message: refund.status === 'PROCESSED'
        ? 'Refund processed and recorded successfully.'
        : 'Refund request initiated and awaiting bank settlement confirmation.',
    }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation failed', message: err.message }, { status: 422 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: 'Not found', message: err.message }, { status: 404 });
    }
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: 'Conflict', message: err.message }, { status: 409 });
    }
    const message = err instanceof Error ? err.message : 'Failed to process refund';
    return NextResponse.json({ error: 'Refund failed', message }, { status: 400 });
  }
}
