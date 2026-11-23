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
                  select: {
                    name: true,
                    slug: true,
                    images: {
                      select: { url: true, isPrimary: true },
                      orderBy: { displayOrder: 'asc' },
                      take: 1,
                    },
                  },
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

    const serializedOrders = orders.map((order) => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((item) => {
        const primaryImg = item.variant?.product?.images?.[0]?.url || null;
        return {
          id: item.id,
          title: item.title,
          variantTitle: item.variant?.title || null,
          sku: item.sku,
          quantity: item.quantity,
          unitPricePaise: item.unitPricePaise,
          totalPricePaise: item.totalPaise,
          imageUrl: primaryImg,
        };
      }),
      payments: order.payments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        verifiedAt: p.verifiedAt ? p.verifiedAt.toISOString() : null,
        collectedAt: p.collectedAt ? p.collectedAt.toISOString() : null,
      })),
      refunds: order.refunds.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    }));

    return NextResponse.json({ orders: serializedOrders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve orders';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
