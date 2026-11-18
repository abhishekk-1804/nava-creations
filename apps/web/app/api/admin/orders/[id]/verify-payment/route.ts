import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { OrderService } from '@/lib/order-service';
import { ValidationError, NotFoundError, ConflictError } from '@nava/shared';

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
    const body = await request.json();

    if (!body.verifiedTransactionId || body.verifiedTransactionId.trim() === '') {
      return NextResponse.json(
        { error: 'Authoritative bank transaction reference ID is required' },
        { status: 422 }
      );
    }

    const order = await OrderService.getOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const verified = await OrderService.verifyPayment(id, {
      verifiedTransactionId: body.verifiedTransactionId.trim(),
      verifiedByUserId: session.userId,
      amountPaise: body.amountPaise || order.totalPaise,
      notes: body.notes || 'Reconciled via store manager statement match',
    });

    return NextResponse.json({
      success: true,
      order: OrderService.sanitizeOrder(verified),
      message: 'Payment verified successfully and credited to order.',
    });
  } catch (err: unknown) {
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: 'Conflict', message: err.message }, { status: 409 });
    }
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation failed', message: err.message }, { status: 422 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: 'Order not found', message: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : 'Failed to verify payment';
    return NextResponse.json({ error: 'Payment verification failed', message }, { status: 400 });
  }
}
