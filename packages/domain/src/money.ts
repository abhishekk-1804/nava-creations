import { ValidationError } from '@nava/shared';

/**
 * Money Value Object
 * Handles all monetary values as integer paise (1 INR = 100 paise).
 * Strictly non-negative: standard prices, fees, and payable totals cannot be negative.
 * Implements Banker's Rounding (Round Half to Even) to avoid statistical bias.
 */
export class Money {
  readonly paise: number;

  private constructor(paise: number) {
    if (!Number.isInteger(paise)) {
      throw new ValidationError(`Money paise must be an exact integer, received: ${paise}`);
    }
    if (paise < 0) {
      throw new ValidationError(
        `Money amount cannot be negative: ${paise} paise. Use SignedMoney for ledger adjustments.`
      );
    }
    this.paise = paise;
  }

  static fromPaise(paise: number): Money {
    return new Money(paise);
  }

  static fromRupees(rupees: number): Money {
    if (!Number.isFinite(rupees)) {
      throw new ValidationError(`Rupees must be a finite number, received: ${rupees}`);
    }
    if (rupees < 0) {
      throw new ValidationError(`Rupees cannot be negative: ${rupees}`);
    }
    const paise = Money.roundHalfEven(rupees * 100);
    return new Money(paise);
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return new Money(this.paise + other.paise);
  }

  subtract(other: Money): Money {
    const diff = this.paise - other.paise;
    if (diff < 0) {
      throw new ValidationError(`Resulting money cannot be negative: ${diff} paise`);
    }
    return new Money(diff);
  }

  multiply(factor: number): Money {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new ValidationError(`Multiplier factor must be a finite non-negative number: ${factor}`);
    }
    const resultPaise = Money.roundHalfEven(this.paise * factor);
    return new Money(resultPaise);
  }

  /**
   * Banker's rounding (round half to even)
   * Example: 2.5 -> 2, 3.5 -> 4, 4.5 -> 4
   */
  static roundHalfEven(value: number): number {
    if (!Number.isFinite(value)) {
      throw new ValidationError(`Cannot round non-finite value: ${value}`);
    }
    const floor = Math.floor(value);
    const diff = value - floor;
    const epsilon = 1e-9;

    if (Math.abs(diff - 0.5) < epsilon) {
      // Exactly half: round to nearest even integer
      return floor % 2 === 0 ? floor : floor + 1;
    }
    return Math.round(value);
  }

  toRupees(): number {
    return this.paise / 100;
  }

  formatINR(): string {
    const rupees = this.toRupees();
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(rupees);
  }

  equals(other: Money): boolean {
    return this.paise === other.paise;
  }

  isGreaterThan(other: Money): boolean {
    return this.paise > other.paise;
  }

  isLessThan(other: Money): boolean {
    return this.paise < other.paise;
  }

  toSigned(direction: 'DEBIT' | 'CREDIT' = 'CREDIT'): SignedMoney {
    const sign = direction === 'DEBIT' ? -1 : 1;
    return SignedMoney.fromPaise(this.paise * sign);
  }
}

/**
 * SignedMoney Value Object
 * Explicitly used for financial ledger adjustments, debits, credits, and balance offsets.
 * Permits signed integers.
 */
export class SignedMoney {
  readonly paise: number;

  private constructor(paise: number) {
    if (!Number.isInteger(paise)) {
      throw new ValidationError(`SignedMoney paise must be an exact integer, received: ${paise}`);
    }
    this.paise = paise;
  }

  static fromPaise(paise: number): SignedMoney {
    return new SignedMoney(paise);
  }

  static zero(): SignedMoney {
    return new SignedMoney(0);
  }

  add(other: SignedMoney): SignedMoney {
    return new SignedMoney(this.paise + other.paise);
  }

  subtract(other: SignedMoney): SignedMoney {
    return new SignedMoney(this.paise - other.paise);
  }

  isNegative(): boolean {
    return this.paise < 0;
  }

  toAbsMoney(): Money {
    return Money.fromPaise(Math.abs(this.paise));
  }
}
