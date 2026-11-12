import { describe, it, expect } from 'vitest';
import { PricingEngine } from '../src/catalog/pricing.js';

describe('PricingEngine (Server-Authoritative Pricing)', () => {
  it('validates correct non-negative integer paise', () => {
    const result = PricingEngine.validatePrice(149900); // ₹1,499.00
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.paise).toBe(149900);
      expect(result.value.toRupees()).toBe(1499);
      expect(result.value.formatINR()).toContain('1,499.00');
    }
  });

  it('rejects negative prices', () => {
    const result = PricingEngine.validatePrice(-500);
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('cannot be negative');
    }
  });

  it('rejects fractional paise', () => {
    const result = PricingEngine.validatePrice(1499.5);
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('exact integer');
    }
  });

  it('rejects NaN, Infinity, and non-numeric price inputs', () => {
    expect(PricingEngine.validatePrice(NaN).isFailure).toBe(true);
    expect(PricingEngine.validatePrice(Infinity).isFailure).toBe(true);
    expect(PricingEngine.validatePrice('1500').isFailure).toBe(true);
    expect(PricingEngine.validatePrice(null).isFailure).toBe(true);
    expect(PricingEngine.validatePrice(undefined).isFailure).toBe(true);
  });

  it('validates pricing pair with MRP and calculates discount percentage', () => {
    // Selling: ₹1,200.00 (120000 paise), MRP: ₹1,500.00 (150000 paise) -> 20% discount
    const result = PricingEngine.validatePricingPair(120000, 150000);
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.price.paise).toBe(120000);
      expect(result.value.compareAtPrice?.paise).toBe(150000);
      expect(result.value.discountPercent).toBe(20);
    }
  });

  it('rejects comparison price (MRP) that is less than selling price', () => {
    // Selling ₹1,500 with MRP ₹1,200 is illegal/inverted
    const result = PricingEngine.validatePricingPair(150000, 120000);
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('cannot be less than selling price');
    }
  });

  it('resolves authoritative price prioritizing variant price when specified', () => {
    const baseProduct = { pricePaise: 150000 };
    const variantWithSize = { pricePaise: 180000 };
    const resolved = PricingEngine.resolveAuthoritativePrice(baseProduct, variantWithSize);
    expect(resolved.paise).toBe(180000);

    const fallbackResolved = PricingEngine.resolveAuthoritativePrice(baseProduct, null);
    expect(fallbackResolved.paise).toBe(150000);
  });
});
