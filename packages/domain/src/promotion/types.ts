export type PromotionType = 'PERCENTAGE' | 'FLAT_AMOUNT';

export interface CouponDto {
  id: string;
  code: string;
  description: string;
  type: PromotionType;
  value: number; // e.g. 10 for 10% (0-100), or integer paise for FLAT_AMOUNT (e.g. 20000 for ₹200)
  minOrderPaise: number; // minimum order subtotal in paise to qualify
  maxDiscountPaise?: number | null; // optional cap for percentage discounts
  isActive: boolean;
  validFrom?: string | null;
  validUntil?: string | null;
  usageCount: number;
  usageLimit?: number | null;
}

export interface DiscountCalculationResult {
  isValid: boolean;
  couponCode: string;
  discountPaise: number;
  discountRupees: string;
  originalSubtotalPaise: number;
  discountedSubtotalPaise: number;
  rejectionReason?: string;
}
