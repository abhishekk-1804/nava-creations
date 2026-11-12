import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { PromotionService } from '@/lib/promotion-service';
import { ValidationError } from '@nava/shared';

export async function GET(request: NextRequest) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const coupons = await PromotionService.listCoupons();
  return NextResponse.json({ success: true, coupons });
}

export async function POST(request: NextRequest) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const created = await PromotionService.createCoupon({
      code: body.code,
      description: body.description || '',
      type: body.type || 'PERCENTAGE',
      value: body.value,
      minOrderPaise: body.minOrderPaise || 0,
      maxDiscountPaise: body.maxDiscountPaise || null,
      usageLimit: body.usageLimit || null,
      validFrom: body.validFrom || null,
      validUntil: body.validUntil || null,
    });

    return NextResponse.json(
      { success: true, coupon: created, message: 'Coupon created successfully' },
      { status: 201 }
    );
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation failed', message: err.message }, { status: 422 });
    }
    const message = err instanceof Error ? err.message : 'Failed to create coupon';
    return NextResponse.json({ error: 'Failed to create coupon', message }, { status: 400 });
  }
}
