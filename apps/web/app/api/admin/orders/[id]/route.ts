import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { OrderService, OrderDto } from '@/lib/order-service';
import { OrderStatus } from '@nava/domain';
import { ValidationError, NotFoundError } from '@nava/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const order = await OrderService.getOrder(id);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, order: OrderService.sanitizeOrder(order) });
}

export async function PATCH(
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

    if (!body.status && !body.courierAwb && !body.rtoAwb) {
      return NextResponse.json(
        { error: 'No update fields provided' },
        { status: 400 }
      );
    }

    const order = await OrderService.getOrder(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const targetStatus = (body.status as OrderStatus) || order.status;

    let updated: OrderDto;
    if (targetStatus === 'CANCELLED') {
      updated = await OrderService.rejectPayment(id, {
        reason: body.reason || 'Admin cancelled order',
        rejectedByUserId: session.userId,
      });
    } else {
      updated = await OrderService.updateOrderStatus(id, targetStatus, {
        courierAwb: body.courierAwb,
        rtoAwb: body.rtoAwb,
        updatedBy: session.userId,
        reason: body.reason,
      });
    }

    return NextResponse.json({
      success: true,
      order: OrderService.sanitizeOrder(updated),
      message: 'Order updated successfully',
    });
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation failed', message: err.message }, { status: 422 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: 'Order not found', message: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : 'Failed to update order';
    return NextResponse.json({ error: 'Failed to update order', message }, { status: 400 });
  }
}
