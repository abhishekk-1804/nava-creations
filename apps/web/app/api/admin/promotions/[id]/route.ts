import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { PromotionService } from '@/lib/promotion-service';
import { ValidationError, NotFoundError } from '@nava/shared';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifyAdminSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    const updated = await PromotionService.updateCoupon(id, {
      isActive: body.isActive,
      description: body.description,
      minOrderPaise: body.minOrderPaise,
      maxDiscountPaise: body.maxDiscountPaise,
    });

    return NextResponse.json({
      success: true,
      coupon: updated,
      message: 'Coupon updated successfully',
    });
  } catch (err: unknown) {
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: 'Not found', message: err.message }, { status: 404 });
    }
    if (err instanceof ValidationError) {
      return NextResponse.json({ error: 'Validation failed', message: err.message }, { status: 422 });
    }
    const message = err instanceof Error ? err.message : 'Failed to update coupon';
    return NextResponse.json({ error: 'Failed to update coupon', message }, { status: 400 });
  }
}
