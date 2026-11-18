import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { OrderService } from '@/lib/order-service';
import { verifyAdminSession } from '@/lib/auth';
import { verifyCustomerSession } from '@/lib/customer-auth';
import { authRateLimiter } from '@/lib/rate-limiter';
import { resolveClientIp } from '@/lib/proxy-trust';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  try {
    const { orderNumber } = await params;
    const cleanOrderNumber = (orderNumber || '').trim();
    if (!cleanOrderNumber) {
      return NextResponse.json(
        { error: 'Order not found', message: 'Order not found' },
        { status: 404 }
      );
    }

    // Shared-Store Rate Limiting: 30 requests per 10 minutes per client IP to prevent automated IDOR enumeration
    const clientIp = resolveClientIp(request).clientIp;
    const rateKey = `order-track:${clientIp}`;
    const rateCheck = await authRateLimiter.checkDistributed(rateKey, 30, 600);
    if (!rateCheck.allowed) {
      const rateLimitRes = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many order tracking attempts. Please wait a few minutes.',
        },
        {
          status: 429,
        }
      );
      rateLimitRes.headers.set('Retry-After', String(rateCheck.resetInSeconds));
      rateLimitRes.headers.set('X-RateLimit-Backend', rateCheck.backend);
      if (rateCheck.simulationTag) {
        rateLimitRes.headers.set('X-RateLimit-Simulation', rateCheck.simulationTag);
      }
      return rateLimitRes;
    }

    const order = await OrderService.getOrder(cleanOrderNumber);
    if (!order) {
      await authRateLimiter.recordFailure(rateKey, 600);
      return NextResponse.json(
        { error: 'Order not found', message: 'Order not found' },
        { status: 404 }
      );
    }

    let isAuthorized = false;

    // 1. Store Manager / Super Admin session check
    const adminSession = await verifyAdminSession(request);
    if (adminSession) {
      isAuthorized = true;
    }

    // 2. Authenticated Owner (order.userId !== null)
    if (!isAuthorized && order.userId) {
      // Primary: NAVA customer session verification
      const customerSession = await verifyCustomerSession(request);
      if (customerSession && customerSession.userId === order.userId) {
        isAuthorized = true;
      }

      // Supplementary: Server-side Supabase verification if configured (supabase.auth.getUser)
      if (!isAuthorized) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7).trim();
          if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
            try {
              const dynamicImport = new Function('specifier', 'return import(specifier)');
              const { createClient } = await dynamicImport('@supabase/supabase-js');
              const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                { auth: { persistSession: false } }
              );
              const { data: { user } } = await supabase.auth.getUser(token);
              if (user && user.id === order.userId) {
                isAuthorized = true;
              }
            } catch {
              // Ignore failure if Supabase client unconfigured or not installed
            }
          }
        }
      }
    }

    // 3. Guest Order (order.userId === null)
    // Supports x-guest-order-token (preferred), x-order-access-token, cookie, and query parameter fallback
    if (!isAuthorized && !order.userId) {
      const headerToken =
        request.headers.get('x-guest-order-token') ||
        request.headers.get('x-order-access-token');
      const cookieToken = request.cookies.get(`nava_order_${cleanOrderNumber}`)?.value;
      const url = new URL(request.url);
      const queryToken = url.searchParams.get('token');

      const candidateToken = (headerToken || cookieToken || queryToken || '').trim();

      if (candidateToken && candidateToken.length === 64) {
        const expectedToken = OrderService.generateGuestAccessToken(order.orderNumber, order.createdAt);
        try {
          const candidateBuf = Buffer.from(candidateToken, 'hex');
          const expectedBuf = Buffer.from(expectedToken, 'hex');

          if (
            candidateBuf.length === 32 &&
            expectedBuf.length === 32 &&
            crypto.timingSafeEqual(candidateBuf, expectedBuf)
          ) {
            isAuthorized = true;
          }
        } catch {
          isAuthorized = false;
        }
      }
    }

    // Security (DPDP Act 2023 & IDOR Defense):
    // Return uniform 404 for unauthorized, nonexistent, wrong-user, or malformed requests to prevent order enumeration
    if (!isAuthorized) {
      await authRateLimiter.recordFailure(rateKey, 600);
      return NextResponse.json(
        { error: 'Order not found', message: 'Order not found' },
        { status: 404 }
      );
    }

    // Sanitize order payload to prevent disclosing raw authorization tokens
    const { guestAccessToken: _token, ...sanitizedOrder } = order;

    const response = NextResponse.json(
      {
        success: true,
        order: sanitizedOrder,
      },
      {
        status: 200,
      }
    );

    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');

    if (rateCheck.simulationTag) {
      response.headers.set('X-RateLimit-Simulation', rateCheck.simulationTag);
    }

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve order';
    return NextResponse.json({ error: 'Failed to retrieve order', message }, { status: 500 });
  }
}
