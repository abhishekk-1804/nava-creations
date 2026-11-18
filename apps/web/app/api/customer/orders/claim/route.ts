import { NextRequest, NextResponse } from 'next/server';
import { verifyCustomerSession, claimGuestOrder } from '@/lib/customer-auth';
import { ValidationError, ConflictError, NotFoundError } from '@nava/shared';

export async function POST(request: NextRequest) {
  try {
    const session = await verifyCustomerSession(request);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'You must be logged in to claim an order.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const orderNumber = (body.orderNumber || '').trim();
    const guestAccessToken = (body.guestAccessToken || body.guestToken || '').trim() || null;

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Validation error', message: 'Order number is required.' },
        { status: 422 }
      );
    }

    const result = await claimGuestOrder({
      orderNumber,
      claimantUserId: session.userId,
      claimantEmail: session.email,
      claimantPhone: session.phone,
      guestAccessToken,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation failed', message: err.message }, { status: 422 });
    }
    if (err instanceof ConflictError) {
      return NextResponse.json({ error: 'Conflict', message: err.message }, { status: 409 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: 'Not Found', message: err.message }, { status: 404 });
    }
    const message = err instanceof Error ? err.message : 'Failed to claim order';
    return NextResponse.json({ error: 'Claim failed', message }, { status: 400 });
  }
}
