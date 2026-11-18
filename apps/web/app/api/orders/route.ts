import { NextRequest, NextResponse } from 'next/server';
import { OrderService } from '@/lib/order-service';
import { MemoryRateLimiter } from '@/lib/rate-limiter';
import { resolveClientIp } from '@/lib/proxy-trust';
import { ValidationError, NotFoundError } from '@nava/shared';
import { assertProductionSecrets } from '@/lib/env-validator';
import { verifyCustomerSession } from '@/lib/customer-auth';

const orderRateLimiter = new MemoryRateLimiter();

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Ensure production environment secrets are strictly configured before order operations
    assertProductionSecrets();

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
    const customerSession = await verifyCustomerSession(request);

    const order = await OrderService.createOrder({
      items: body.items,
      customer: body.customer,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod || 'UPI_MERCHANT_QR',
      customerNotes: body.customerNotes,
      couponCode: body.couponCode,
      userId: customerSession?.userId,
      channel: body.channel || 'WEB',
    });

    const guestAccessToken = order.guestAccessToken || OrderService.generateGuestAccessToken(order.orderNumber, order.createdAt);

    // SECURITY (DPDP Act 2023 & Token Leakage Defense):
    // Never disclose the raw guest access token in response payload.
    // Instead, issue an order-scoped HttpOnly, SameSite=Lax cookie.
    const { guestAccessToken: _token, ...sanitizedOrder } = order;

    const response = NextResponse.json(
      {
        success: true,
        order: sanitizedOrder,
        message: 'Order created successfully.',
      },
      { status: 201 }
    );

    response.cookies.set({
      name: `nava_order_${order.orderNumber}`,
      value: guestAccessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: `/api/orders/${order.orderNumber}`,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
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
