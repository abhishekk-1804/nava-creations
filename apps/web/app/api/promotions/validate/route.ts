import { NextRequest, NextResponse } from 'next/server';
import { PromotionService } from '@/lib/promotion-service';
import { MemoryRateLimiter } from '@/lib/rate-limiter';
import { resolveClientIp } from '@/lib/proxy-trust';
import { ValidationError } from '@nava/shared';

const promoRateLimiter = new MemoryRateLimiter();

export async function POST(request: NextRequest) {
  try {
    const clientIp = resolveClientIp(request).clientIp;
    const rateCheck = promoRateLimiter.check(`promo-check:${clientIp}`, 15, 5 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', message: 'Too many coupon attempts. Please wait.' },
        { status: 429, headers: { 'Retry-After': String(rateCheck.resetInSeconds) } }
      );
    }

    const body = await request.json();
    const code = (body.code || '').trim();
    const subtotalPaise = parseInt(body.subtotalPaise, 10);

    if (!code) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Coupon code is required.' },
        { status: 422 }
      );
    }

    if (isNaN(subtotalPaise) || subtotalPaise <= 0) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'Valid order subtotal is required.' },
        { status: 422 }
      );
    }

    const result = await PromotionService.validateAndApply(code, subtotalPaise);

    if (!result.isValid) {
      const isNotFound = result.rejectionReason?.includes('does not exist');
      return NextResponse.json(
        {
          success: false,
          valid: false,
          message: result.rejectionReason || 'Invalid coupon',
          error: result.rejectionReason,
          result,
        },
        { status: isNotFound ? 404 : 422 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        valid: true,
        coupon: {
          code: result.couponCode,
        },
        discountPaise: result.discountPaise,
        discountRupees: result.discountRupees,
        newTotalPaise: result.discountedSubtotalPaise,
        result,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation failed', message: err.message }, { status: 422 });
    }
    const message = err instanceof Error ? err.message : 'Failed to validate coupon';
    return NextResponse.json({ error: 'Coupon check failed', message }, { status: 400 });
  }
}
