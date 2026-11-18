import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { OrderService } from '@/lib/order-service';
import { OrderStatus } from '@nava/domain';

export async function GET(request: NextRequest) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') as OrderStatus) || undefined;
    const paymentMethod = searchParams.get('paymentMethod') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await OrderService.listOrders({
      status,
      paymentMethod,
      search,
      page,
      limit,
    });

    return NextResponse.json({
      success: true,
      orders: result.items.map((item) => OrderService.sanitizeOrder(item)),
      total: result.total,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve orders';
    console.error('[API:AdminOrders] Database failure while retrieving orders:', message);
    return NextResponse.json(
      { error: 'Database failure', message: 'Failed to retrieve orders due to a database failure' },
      { status: 500 }
    );
  }
}
