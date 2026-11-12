import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/order-service';
import { MemoryRateLimiter } from '@/lib/rate-limiter';
import { resolveClientIp } from '@/lib/proxy-trust';
import { ValidationError, NotFoundError } from '@nava/shared';

const utrRateLimiter = new MemoryRateLimiter();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
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

    const order = await OrderService.submitCustomerUtr(orderNumber, claimedUtr);

    return NextResponse.json(
      {
        success: true,
        order,
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
    const message = err instanceof Error ? err.message : 'Failed to submit UPI reference';
    return NextResponse.json(
      { error: 'Submission failed', message },
      { status: 400 }
    );
  }
}
