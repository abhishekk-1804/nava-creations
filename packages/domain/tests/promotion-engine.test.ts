import { describe, it, expect } from 'vitest';
import { PromotionEngine, CouponDto } from '../src/index.js';

describe('PromotionEngine Domain Unit Tests', () => {
  const samplePercentageCoupon: CouponDto = {
    id: 'coup-1',
    code: 'BRIDAL10',
    description: '10% off bridal edits',
    type: 'PERCENTAGE',
    value: 10,
    minOrderPaise: 200000, // ₹2,000
    maxDiscountPaise: 50000, // ₹500 cap
    isActive: true,
    usageCount: 5,
    usageLimit: 100,
  };

  const sampleFlatCoupon: CouponDto = {
    id: 'coup-2',
    code: 'NAVA200',
    description: 'Flat ₹200 off',
    type: 'FLAT_AMOUNT',
    value: 20000, // ₹200
    minOrderPaise: 150000, // ₹1,500
    isActive: true,
    usageCount: 0,
  };

  it('calculates 10% percentage discount on qualifying subtotal', () => {
    // ₹3,000 order (300000 paise) -> 10% = ₹300 (30000 paise)
    const res = PromotionEngine.calculateDiscount(samplePercentageCoupon, 300000);
    expect(res.isValid).toBe(true);
    expect(res.couponCode).toBe('BRIDAL10');
    expect(res.discountPaise).toBe(30000);
    expect(res.discountRupees).toBe('300.00');
    expect(res.discountedSubtotalPaise).toBe(270000);
  });

  it('enforces maximum discount ceiling on percentage coupons', () => {
    // ₹10,000 order (1000000 paise) -> 10% = ₹1,000, but cap is ₹500 (50000 paise)
    const res = PromotionEngine.calculateDiscount(samplePercentageCoupon, 1000000);
    expect(res.isValid).toBe(true);
    expect(res.discountPaise).toBe(50000);
    expect(res.discountRupees).toBe('500.00');
    expect(res.discountedSubtotalPaise).toBe(950000);
  });

  it('rejects coupon if order subtotal is below minimum order threshold', () => {
    // ₹1,800 order (180000 paise) is below ₹2,000 minimum
    const res = PromotionEngine.calculateDiscount(samplePercentageCoupon, 180000);
    expect(res.isValid).toBe(false);
    expect(res.discountPaise).toBe(0);
    expect(res.rejectionReason).toContain('Minimum order value of ₹2,000');
  });

  it('calculates flat amount discount accurately', () => {
    // ₹2,500 order - ₹200 flat = ₹2,300 (230000 paise)
    const res = PromotionEngine.calculateDiscount(sampleFlatCoupon, 250000);
    expect(res.isValid).toBe(true);
    expect(res.discountPaise).toBe(20000);
    expect(res.discountRupees).toBe('200.00');
    expect(res.discountedSubtotalPaise).toBe(230000);
  });

  it('rejects inactive or disabled coupons', () => {
    const inactive: CouponDto = { ...samplePercentageCoupon, isActive: false };
    const res = PromotionEngine.calculateDiscount(inactive, 300000);
    expect(res.isValid).toBe(false);
    expect(res.rejectionReason).toContain('inactive or disabled');
  });

  it('rejects coupons that have reached their redemption limit', () => {
    const exhausted: CouponDto = { ...samplePercentageCoupon, usageCount: 50, usageLimit: 50 };
    const res = PromotionEngine.calculateDiscount(exhausted, 300000);
    expect(res.isValid).toBe(false);
    expect(res.rejectionReason).toContain('maximum redemption limit');
  });

  it('rejects expired coupons based on validUntil timestamp', () => {
    const expired: CouponDto = {
      ...samplePercentageCoupon,
      validUntil: '2025-01-01T00:00:00.000Z',
    };
    const res = PromotionEngine.calculateDiscount(expired, 300000, new Date('2026-11-12T00:00:00.000Z'));
    expect(res.isValid).toBe(false);
    expect(res.rejectionReason).toContain('has expired');
  });

  it('normalizes coupon code format (case and spacing)', () => {
    expect(PromotionEngine.normalizeCode(' bridal-10 ')).toBe('BRIDAL-10');
    expect(PromotionEngine.normalizeCode('nava_festive ')).toBe('NAVA_FESTIVE');
  });
});
