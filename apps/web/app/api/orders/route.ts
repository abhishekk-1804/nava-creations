import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/order-service';
import { MemoryRateLimiter } from '@/lib/rate-limiter';
import { resolveClientIp } from '@/lib/proxy-trust';
import { ValidationError, NotFoundError } from '@nava/shared';

const orderRateLimiter = new MemoryRateLimiter();

export async function POST(request: NextRequest) {
  try {
    const clientIp = resolveClientIp(request).clientIp;
    const rateCheck = orderRateLimiter.check(`order-create:${clientIp}`, 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many order attempts. Please wait a few minutes before trying again.',
        },
        {
          status: 429,
          headers: { 'Retry-After': String(rateCheck.resetInSeconds) },
        }
      );
    }

    const body = await request.json();
    const order = await OrderService.createOrder({
      items: body.items,
      customer: body.customer,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod || 'UPI_MERCHANT_QR',
      customerNotes: body.customerNotes,
      couponCode: body.couponCode,
    });

    return NextResponse.json(
      {
        success: true,
        order,
        message: 'Order created successfully.',
      },
      { status: 201 }
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
        { error: 'Item not found', message: err.message },
        { status: 404 }
      );
    }
    const message = err instanceof Error ? err.message : 'Failed to process order';
    return NextResponse.json(
      { error: 'Order processing failed', message },
      { status: 400 }
    );
  }
}
