import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@nava/db';
import { verifyCustomerSession } from '@/lib/customer-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await verifyCustomerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const addresses = await prisma.customerAddress.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch addresses';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifyCustomerSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const addressLine1 = (body.addressLine1 || body.streetLine1 || '').trim();
    const addressLine2 = (body.addressLine2 || body.streetLine2 || '').trim() || null;
    const landmark = (body.landmark || '').trim() || null;
    const city = (body.city || '').trim();
    const stateName = (body.stateName || body.state || '').trim();
    const stateCode = (body.stateCode || '').trim() || '29';
    const postalCode = (body.postalCode || '').trim();
    const isDefault = Boolean(body.isDefault);

    if (!addressLine1 || !city || !stateName || !postalCode) {
      return NextResponse.json({ error: 'Address line, city, state, and postal code are required' }, { status: 400 });
    }

    if (isDefault) {
      // Unset previous defaults
      await prisma.customerAddress.updateMany({
        where: { userId: session.userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const newAddress = await prisma.customerAddress.create({
      data: {
        userId: session.userId,
        addressLine1,
        addressLine2,
        landmark,
        city,
        stateName,
        stateCode,
        postalCode,
        isDefault,
      },
    });

    return NextResponse.json({ success: true, address: newAddress }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save address';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
