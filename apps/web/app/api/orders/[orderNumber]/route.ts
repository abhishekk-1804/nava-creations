import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/order-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    if (!orderNumber || orderNumber.trim() === '') {
      return NextResponse.json({ error: 'Order number is required' }, { status: 400 });
    }

    const order = await OrderService.getOrder(orderNumber.trim());
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found', message: `Order ${orderNumber} does not exist.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, order }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve order';
    return NextResponse.json({ error: 'Failed to retrieve order', message }, { status: 500 });
  }
}
