import { ValidationError, Result, ok, err } from '@nava/shared';
import { Money } from '../money.js';

export interface ValidatedProductPricing {
  price: Money;
  compareAtPrice: Money | null;
  discountPercent: number;
}

export class PricingEngine {
  /**
   * Validates server-authoritative product prices in integer paise.
   * Rejects fractional paise, negative amounts, NaN, and inverted MRP discounts.
   */
  static validatePrice(pricePaise: unknown): Result<Money, ValidationError> {
    if (typeof pricePaise !== 'number' || !Number.isInteger(pricePaise) || !Number.isFinite(pricePaise)) {
      return err(
        new ValidationError(`Selling price must be an exact integer representing paise, received: ${String(pricePaise)}`)
      );
    }

    if (pricePaise < 0) {
      return err(
        new ValidationError(`Selling price cannot be negative, received: ${pricePaise} paise`)
      );
    }

    try {
      return ok(Money.fromPaise(pricePaise));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return err(new ValidationError(`Invalid money value: ${message}`));
    }
  }

  /**
   * Validates full pricing pair (Selling Price and optional MRP/Compare-at Price).
   */
  static validatePricingPair(
    pricePaise: unknown,
    compareAtPricePaise?: unknown
  ): Result<ValidatedProductPricing, ValidationError> {
    const priceResult = this.validatePrice(pricePaise);
    if (priceResult.isFailure) {
      return err(priceResult.error);
    }
    const price = priceResult.value;

    let compareAtPrice: Money | null = null;
    let discountPercent = 0;

    if (compareAtPricePaise !== undefined && compareAtPricePaise !== null) {
      const compareResult = this.validatePrice(compareAtPricePaise);
      if (compareResult.isFailure) {
        return err(
          new ValidationError(
            `Comparison price (MRP) is invalid: ${compareResult.error.message}`
          )
        );
      }
      compareAtPrice = compareResult.value;

      // In Indian retail, MRP / compareAtPrice must be >= selling price
      if (compareAtPrice.paise < price.paise) {
        return err(
          new ValidationError(
            `Comparison price (MRP: ₹${compareAtPrice.toRupees()}) cannot be less than selling price (₹${price.toRupees()})`
          )
        );
      }

      if (compareAtPrice.paise > 0) {
        const diff = compareAtPrice.paise - price.paise;
        discountPercent = Math.round((diff / compareAtPrice.paise) * 100);
      }
    }

    return ok({
      price,
      compareAtPrice,
      discountPercent,
    });
  }

  /**
   * Resolves the server-authoritative price for an item or checkout line.
   * Variant price takes precedence over base product price if present and > 0.
   * Client-supplied price arguments are NEVER accepted.
   */
  static resolveAuthoritativePrice(
    product: { pricePaise: number },
    variant?: { pricePaise: number } | null
  ): Money {
    if (variant && typeof variant.pricePaise === 'number' && variant.pricePaise > 0) {
      return Money.fromPaise(variant.pricePaise);
    }
    return Money.fromPaise(product.pricePaise);
  }
}
