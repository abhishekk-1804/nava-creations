import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@nava/db';
import { verifyCustomerSession } from '@/lib/customer-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyCustomerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Please log in to view your orders' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            variant: {
              include: {
                product: {
                  select: { name: true, slug: true },
                },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        refunds: true,
      },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
