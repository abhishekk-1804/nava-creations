import { CouponDto, DiscountCalculationResult, PromotionEngine, PromotionType } from '@nava/domain';
import { NotFoundError, ValidationError } from '@nava/shared';

// Global singleton registry for in-memory promotion management
const globalForPromotions = globalThis as unknown as {
  __nava_coupons__?: Map<string, CouponDto>;
};

if (!globalForPromotions.__nava_coupons__) {
  globalForPromotions.__nava_coupons__ = new Map<string, CouponDto>();
}

const couponsRegistry = globalForPromotions.__nava_coupons__;

// Seed standard studio promotional campaigns if empty
function initializeCoupons() {
  if (couponsRegistry.size === 0) {
    const c1: CouponDto = {
      id: 'coup-bridal-10',
      code: 'BRIDAL10',
      description: '10% off handcrafted bridal edit sets (Min ₹2,000)',
      type: 'PERCENTAGE',
      value: 10,
      minOrderPaise: 200000, // ₹2,000
      maxDiscountPaise: 50000, // ₹500 cap
      isActive: true,
      usageCount: 14,
      usageLimit: 200,
    };

    const c2: CouponDto = {
      id: 'coup-nava-200',
      code: 'NAVA200',
      description: 'Flat ₹200 off on handcrafted bangle purchases above ₹1,500',
      type: 'FLAT_AMOUNT',
      value: 20000, // ₹200 (20,000 paise)
      minOrderPaise: 150000, // ₹1,500
      isActive: true,
      usageCount: 28,
    };

    const c3: CouponDto = {
      id: 'coup-festive-15',
      code: 'FESTIVE15',
      description: '15% festive wedding discount (Min ₹3,000, Max ₹750)',
      type: 'PERCENTAGE',
      value: 15,
      minOrderPaise: 300000, // ₹3,000
      maxDiscountPaise: 75000, // ₹750
      isActive: true,
      usageCount: 6,
      usageLimit: 100,
    };

    couponsRegistry.set(c1.code, c1);
    couponsRegistry.set(c2.code, c2);
    couponsRegistry.set(c3.code, c3);
  }
}

// Auto-seed coupons
initializeCoupons();

export interface CreateCouponInput {
  code: string;
  description: string;
  type: PromotionType;
  value: number;
  minOrderPaise: number;
  maxDiscountPaise?: number | null;
  usageLimit?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
}

export class PromotionService {
  /**
   * Resets registry for clean automated testing.
   */
  static resetForTesting(): void {
    couponsRegistry.clear();
    initializeCoupons();
  }

  /**
   * Lists all coupons for store manager administration.
   */
  static async listCoupons(): Promise<CouponDto[]> {
    initializeCoupons();
    return Array.from(couponsRegistry.values());
  }

  /**
   * Finds coupon by its alphanumeric code.
   */
  static async getCouponByCode(code: string): Promise<CouponDto | null> {
    initializeCoupons();
    const cleanCode = PromotionEngine.normalizeCode(code);
    return couponsRegistry.get(cleanCode) || null;
  }

  /**
   * Validates and applies a coupon code against a customer order subtotal.
   */
  static async validateAndApply(
    code: string,
    subtotalPaise: number
  ): Promise<DiscountCalculationResult> {
    const cleanCode = PromotionEngine.normalizeCode(code);
    if (!cleanCode) {
      throw new ValidationError('Please enter a coupon code.');
    }

    const coupon = await this.getCouponByCode(cleanCode);
    if (!coupon) {
      return {
        isValid: false,
        couponCode: cleanCode,
        discountPaise: 0,
        discountRupees: '0.00',
        originalSubtotalPaise: subtotalPaise,
        discountedSubtotalPaise: subtotalPaise,
        rejectionReason: `Coupon code '${cleanCode}' does not exist or has expired.`,
      };
    }

    return PromotionEngine.calculateDiscount(coupon, subtotalPaise);
  }

  /**
   * Increments usage count when an order is successfully confirmed.
   */
  static async incrementUsage(code: string): Promise<void> {
    const coupon = await this.getCouponByCode(code);
    if (coupon) {
      coupon.usageCount += 1;
      couponsRegistry.set(coupon.code, coupon);
    }
  }

  /**
   * Store manager creates a new coupon.
   */
  static async createCoupon(input: CreateCouponInput): Promise<CouponDto> {
    const code = PromotionEngine.normalizeCode(input.code);
    if (!code || code.length < 3) {
      throw new ValidationError('Coupon code must be at least 3 characters.');
    }

    if (couponsRegistry.has(code)) {
      throw new ValidationError(`Coupon with code '${code}' already exists.`);
    }

    if (input.type === 'PERCENTAGE' && (input.value <= 0 || input.value > 100)) {
      throw new ValidationError('Percentage discount value must be between 1% and 100%.');
    }

    if (input.type === 'FLAT_AMOUNT' && input.value <= 0) {
      throw new ValidationError('Flat discount amount must be greater than zero.');
    }

    const newCoupon: CouponDto = {
      id: `coup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code,
      description: input.description.trim(),
      type: input.type,
      value: input.value,
      minOrderPaise: input.minOrderPaise || 0,
      maxDiscountPaise: input.maxDiscountPaise || null,
      isActive: true,
      usageCount: 0,
      usageLimit: input.usageLimit || null,
      validFrom: input.validFrom || null,
      validUntil: input.validUntil || null,
    };

    couponsRegistry.set(code, newCoupon);
    return newCoupon;
  }

  /**
   * Store manager toggles or updates coupon active status.
   */
  static async updateCoupon(
    id: string,
    updates: Partial<CouponDto>
  ): Promise<CouponDto> {
    initializeCoupons();
    let foundCoupon: CouponDto | null = null;

    for (const c of couponsRegistry.values()) {
      if (c.id === id || c.code === id) {
        foundCoupon = c;
        break;
      }
    }

    if (!foundCoupon) {
      throw new NotFoundError(`Coupon '${id}' not found.`);
    }

    if (updates.isActive !== undefined) {
      foundCoupon.isActive = updates.isActive;
    }
    if (updates.description) {
      foundCoupon.description = updates.description.trim();
    }
    if (updates.minOrderPaise !== undefined) {
      foundCoupon.minOrderPaise = updates.minOrderPaise;
    }
    if (updates.maxDiscountPaise !== undefined) {
      foundCoupon.maxDiscountPaise = updates.maxDiscountPaise;
    }

    couponsRegistry.set(foundCoupon.code, foundCoupon);
    return foundCoupon;
  }
}
