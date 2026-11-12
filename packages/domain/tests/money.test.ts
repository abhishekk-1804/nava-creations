import { describe, it, expect } from 'vitest';
import { Money, SignedMoney } from '../src/money.js';

describe('Money Value Object', () => {
  it('creates money from paise integer', () => {
    const m = Money.fromPaise(125050);
    expect(m.paise).toBe(125050);
    expect(m.toRupees()).toBe(1250.5);
  });

  it('rejects negative paise in Money constructor', () => {
    expect(() => Money.fromPaise(-100)).toThrowError(/cannot be negative/);
    expect(() => Money.fromRupees(-1)).toThrowError(/cannot be negative/);
  });

  it('rejects non-finite values in fromRupees', () => {
    expect(() => Money.fromRupees(NaN)).toThrowError(/finite number/);
    expect(() => Money.fromRupees(Infinity)).toThrowError(/finite number/);
  });

  it('formats to Indian Rupee standard', () => {
    const m = Money.fromPaise(125000);
    const formatted = m.formatINR();
    expect(formatted).toContain('1,250.00');
  });

  it('performs Banker\'s Rounding (Round Half to Even)', () => {
    expect(Money.roundHalfEven(2.5)).toBe(2);
    expect(Money.roundHalfEven(3.5)).toBe(4);
    expect(Money.roundHalfEven(4.5)).toBe(4);
    expect(Money.roundHalfEven(5.5)).toBe(6);
    expect(Money.roundHalfEven(2.4)).toBe(2);
    expect(Money.roundHalfEven(2.6)).toBe(3);
  });

  it('adds and subtracts money accurately', () => {
    const a = Money.fromPaise(50000);
    const b = Money.fromPaise(25000);
    const sum = a.add(b);
    expect(sum.paise).toBe(75000);

    const diff = a.subtract(b);
    expect(diff.paise).toBe(25000);
  });

  it('prevents negative money subtraction', () => {
    const a = Money.fromPaise(1000);
    const b = Money.fromPaise(2000);
    expect(() => a.subtract(b)).toThrowError(/cannot be negative/);
  });

  it('multiplies with banker rounding on fraction', () => {
    const price = Money.fromPaise(1000);
    const taxRate = 0.025;
    const tax = price.multiply(taxRate);
    expect(tax.paise).toBe(25);
  });

  it('converts to SignedMoney for ledger adjustments', () => {
    const m = Money.fromPaise(5000);
    const credit = m.toSigned('CREDIT');
    expect(credit.paise).toBe(5000);
    expect(credit.isNegative()).toBe(false);

    const debit = m.toSigned('DEBIT');
    expect(debit.paise).toBe(-5000);
    expect(debit.isNegative()).toBe(true);
    expect(debit.toAbsMoney().paise).toBe(5000);
  });
});

describe('SignedMoney Value Object', () => {
  it('allows negative values for ledger adjustments', () => {
    const debit = SignedMoney.fromPaise(-15000);
    const credit = SignedMoney.fromPaise(20000);
    const net = credit.add(debit);
    expect(net.paise).toBe(5000);
  });
});
