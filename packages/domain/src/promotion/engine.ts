import { CouponDto, DiscountCalculationResult } from './types.js';

export class PromotionEngine {
  /**
   * Normalizes coupon code to uppercase alphanumeric string.
   */
  static normalizeCode(code: string): string {
    return code.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  }

  /**
   * Validates and calculates discount on order subtotal according to coupon rules.
   */
  static calculateDiscount(
    coupon: CouponDto,
    subtotalPaise: number,
    currentDate: Date = new Date()
  ): DiscountCalculationResult {
    const code = this.normalizeCode(coupon.code);

    if (!coupon.isActive) {
      return {
        isValid: false,
        couponCode: code,
        discountPaise: 0,
        discountRupees: '0.00',
        originalSubtotalPaise: subtotalPaise,
        discountedSubtotalPaise: subtotalPaise,
        rejectionReason: `Coupon code '${code}' is currently inactive or disabled.`,
      };
    }

    if (coupon.validFrom && new Date(coupon.validFrom).getTime() > currentDate.getTime()) {
      return {
        isValid: false,
        couponCode: code,
        discountPaise: 0,
        discountRupees: '0.00',
        originalSubtotalPaise: subtotalPaise,
        discountedSubtotalPaise: subtotalPaise,
        rejectionReason: `Coupon code '${code}' is not yet active.`,
      };
    }

    if (coupon.validUntil && new Date(coupon.validUntil).getTime() < currentDate.getTime()) {
      return {
        isValid: false,
        couponCode: code,
        discountPaise: 0,
        discountRupees: '0.00',
        originalSubtotalPaise: subtotalPaise,
        discountedSubtotalPaise: subtotalPaise,
        rejectionReason: `Coupon code '${code}' has expired.`,
      };
    }

    if (coupon.usageLimit !== undefined && coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return {
        isValid: false,
        couponCode: code,
        discountPaise: 0,
        discountRupees: '0.00',
        originalSubtotalPaise: subtotalPaise,
        discountedSubtotalPaise: subtotalPaise,
        rejectionReason: `Coupon code '${code}' has reached its maximum redemption limit.`,
      };
    }

    if (subtotalPaise < coupon.minOrderPaise) {
      const minRupees = (coupon.minOrderPaise / 100).toLocaleString('en-IN');
      return {
        isValid: false,
        couponCode: code,
        discountPaise: 0,
        discountRupees: '0.00',
        originalSubtotalPaise: subtotalPaise,
        discountedSubtotalPaise: subtotalPaise,
        rejectionReason: `Minimum order value of ₹${minRupees} required to use coupon '${code}'.`,
      };
    }

    let calculatedDiscountPaise = 0;

    if (coupon.type === 'PERCENTAGE') {
      const rawPaise = Math.round((subtotalPaise * coupon.value) / 100);
      calculatedDiscountPaise = rawPaise;
      if (coupon.maxDiscountPaise && coupon.maxDiscountPaise > 0) {
        calculatedDiscountPaise = Math.min(calculatedDiscountPaise, coupon.maxDiscountPaise);
      }
    } else {
      // FLAT_AMOUNT
      calculatedDiscountPaise = coupon.value;
    }

    // Safety guard: discount cannot exceed order subtotal
    calculatedDiscountPaise = Math.max(0, Math.min(calculatedDiscountPaise, subtotalPaise));
    const discountedSubtotalPaise = subtotalPaise - calculatedDiscountPaise;

    return {
      isValid: true,
      couponCode: code,
      discountPaise: calculatedDiscountPaise,
      discountRupees: (calculatedDiscountPaise / 100).toFixed(2),
      originalSubtotalPaise: subtotalPaise,
      discountedSubtotalPaise,
    };
  }
}
