import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/order-service';
import { verifyAdminSession } from '@/lib/auth';
import { verifyCustomerSession } from '@/lib/customer-auth';
import { MemoryRateLimiter } from '@/lib/rate-limiter';
import { resolveClientIp } from '@/lib/proxy-trust';
import { ValidationError, NotFoundError, ConflictError } from '@nava/shared';

const utrRateLimiter = new MemoryRateLimiter();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const cleanOrderNumber = (orderNumber || '').trim();

    const clientIp = resolveClientIp(request).clientIp;
    const rateCheck = utrRateLimiter.check(`utr-submit:${clientIp}`, 5, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many reference submissions. Please wait before submitting again.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.resetInSeconds) },
        }
      );
    }

    const body = await request.json();
    const claimedUtr = (body.claimedUtr || body.upiTransactionRef || '').trim();

    if (!claimedUtr) {
      return NextResponse.json(
        { error: 'Validation failed', message: '12-digit UPI UTR reference is required.' },
        { status: 422 }
      );
    }

    const existingOrder = await OrderService.getOrder(cleanOrderNumber);
    if (!existingOrder) {
      return NextResponse.json(
        { error: 'Order not found', message: `Order ${cleanOrderNumber} does not exist.` },
        { status: 404 }
      );
    }

    // SECURITY (DPDP Act 2023 & Order Modification Defense):
    // Ensure unauthorized callers cannot submit fraudulent UTR references or tamper with orders
    const adminSession = await verifyAdminSession(request);
    let isAuthorized = Boolean(adminSession);

    if (!isAuthorized) {
      const customerSession = await verifyCustomerSession(request);
      if (customerSession && existingOrder.userId && existingOrder.userId === customerSession.userId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      const cookieToken = request.cookies.get(`nava_order_${cleanOrderNumber}`)?.value;
      const headerToken = request.headers.get('x-order-access-token');
      const candidateToken = cookieToken || headerToken;
      isAuthorized = OrderService.verifyGuestAccessToken(existingOrder.orderNumber, existingOrder.createdAt, candidateToken);
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Order not found', message: `Order ${cleanOrderNumber} does not exist.` },
        { status: 404 }
      );
    }

    const order = await OrderService.submitCustomerUtr(cleanOrderNumber, claimedUtr);
    const { guestAccessToken: _token, ...sanitizedOrder } = order;

    return NextResponse.json(
      {
        success: true,
        order: sanitizedOrder,
        message: 'Your UPI UTR reference has been recorded and submitted for store verification.',
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return NextResponse.json(
        { error: 'Validation failed', message: err.message },
        { status: 422 }
      );
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: 'Order not found', message: err.message },
        { status: 404 }
      );
    }
    if (err instanceof ConflictError) {
      return NextResponse.json(
        { error: 'Conflict', message: err.message },
        { status: 409 }
      );
    }
    const message = err instanceof Error ? err.message : 'Failed to submit UPI reference';
    return NextResponse.json(
      { error: 'Submission failed', message },
      { status: 400 }
    );
  }
}
