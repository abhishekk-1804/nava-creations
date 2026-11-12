import { describe, it, expect } from 'vitest';
import { TaxEngine } from '../src/tax/engine.js';
import { TaxRateRule } from '../src/tax/types.js';
import { Money } from '../src/money.js';

describe('Tax Engine & GST Strategy Pattern', () => {
  const engine = new TaxEngine();

  const sampleItems = [
    {
      skuId: 'SKU-KUNDAN-01',
      hsnCode: '71179090', // Imitation Jewellery HSN
      unitPrice: Money.fromPaise(150000), // ₹1,500.00
      quantity: 2, // Total ₹3,000.00 = 300000 paise
    },
  ];

  it('calculates zero tax for UNREGISTERED store mode', () => {
    const result = engine.calculateTax({
      storeTaxMode: 'UNREGISTERED',
      originStateCode: '29', // Karnataka
      destinationStateCode: '29', // Intra-state
      items: sampleItems,
      shippingFee: Money.fromPaise(10000), // ₹100.00
    });

    expect(result.taxMode).toBe('UNREGISTERED');
    expect(result.totalTax.paise).toBe(0);
    expect(result.taxableSubtotal.paise).toBe(300000);
    expect(result.totalAmountWithTax.paise).toBe(310000); // 300000 + 10000 shipping
    expect(result.isTaxInvoiceApplicable).toBe(false);
    expect(result.invoiceTitle).toContain('Retail Receipt');
  });

  it('calculates zero tax for COMPOSITION_SCHEME store mode', () => {
    const result = engine.calculateTax({
      storeTaxMode: 'COMPOSITION_SCHEME',
      originStateCode: '29',
      destinationStateCode: '27', // Maharashtra
      items: sampleItems,
      shippingFee: Money.zero(),
    });

    expect(result.taxMode).toBe('COMPOSITION_SCHEME');
    expect(result.totalTax.paise).toBe(0);
    expect(result.isTaxInvoiceApplicable).toBe(false);
    expect(result.invoiceTitle).toContain('Bill of Supply');
  });

  it('supports TAX-INCLUSIVE pricing (Indian B2C MRP Standard)', () => {
    // Customer sees ₹1,545.00 MRP for a Kundan bangle (includes 3% GST)
    const inclusiveItems = [
      {
        skuId: 'SKU-KUNDAN-INCL',
        hsnCode: '71179090',
        unitPrice: Money.fromPaise(154500), // ₹1,545.00
        quantity: 1,
      },
    ];

    const dynamicRates = new Map<string, TaxRateRule>([
      ['71179090', { hsnCode: '71179090', ratePercent: 3 }],
    ]);

    const result = engine.calculateTax({
      storeTaxMode: 'REGULAR_GST_REGISTERED',
      originStateCode: '29',
      destinationStateCode: '29',
      items: inclusiveItems,
      shippingFee: Money.zero(),
      priceTaxInclusivity: 'INCLUSIVE',
      dynamicRates,
    });

    // 154500 / 1.03 = 150000 base paise (₹1,500.00)
    expect(result.taxableSubtotal.paise).toBe(150000);
    // Total Tax = 154500 - 150000 = 4500 paise (₹45.00)
    expect(result.totalTax.paise).toBe(4500);
    // Total customer pays is exact MRP: ₹1,545.00
    expect(result.totalAmountWithTax.paise).toBe(154500);
    // Intra-state split: 50% CGST (2250 paise) + 50% SGST (2250 paise)
    expect(result.overallBreakdown.cgst.paise).toBe(2250);
    expect(result.overallBreakdown.sgst.paise).toBe(2250);
    expect(result.overallBreakdown.igst.paise).toBe(0);
  });

  it('guarantees zero rounding drift between intra-state and inter-state calculations', () => {
    const dynamicRates = new Map<string, TaxRateRule>([
      ['71179090', { hsnCode: '71179090', ratePercent: 5 }], // 5% GST
    ]);

    // Odd base amount testing half-rate splitting
    const oddItems = [
      {
        skuId: 'SKU-ODD',
        hsnCode: '71179090',
        unitPrice: Money.fromPaise(105), // ₹1.05
        quantity: 1,
      },
    ];

    const intraState = engine.calculateTax({
      storeTaxMode: 'REGULAR_GST_REGISTERED',
      originStateCode: '29',
      destinationStateCode: '29',
      items: oddItems,
      shippingFee: Money.zero(),
      priceTaxInclusivity: 'INCLUSIVE',
      dynamicRates,
    });

    const interState = engine.calculateTax({
      storeTaxMode: 'REGULAR_GST_REGISTERED',
      originStateCode: '29',
      destinationStateCode: '33', // Tamil Nadu
      items: oddItems,
      shippingFee: Money.zero(),
      priceTaxInclusivity: 'INCLUSIVE',
      dynamicRates,
    });

    // Both must calculate identical total tax down to the exact single paise
    expect(intraState.totalTax.paise).toBe(interState.totalTax.paise);
    expect(intraState.totalAmountWithTax.paise).toBe(interState.totalAmountWithTax.paise);
  });

  it('calculates configurable GST on shipping fee under composite supply rules', () => {
    const dynamicRates = new Map<string, TaxRateRule>([
      ['71179090', { hsnCode: '71179090', ratePercent: 3 }],
    ]);

    const result = engine.calculateTax({
      storeTaxMode: 'REGULAR_GST_REGISTERED',
      originStateCode: '29',
      destinationStateCode: '29',
      items: sampleItems, // 300,000 paise (Tax exclusive mode)
      shippingFee: Money.fromPaise(10000), // ₹100.00
      shippingFeeTaxRatePercent: 18, // 18% GST on courier freight
      priceTaxInclusivity: 'EXCLUSIVE',
      dynamicRates,
    });

    // Items tax: 3% of 300,000 = 9,000 paise
    // Shipping tax: 18% of 10,000 = 1,800 paise
    // Total Tax: 9,000 + 1,800 = 10,800 paise (₹108.00)
    expect(result.shippingTaxBreakdown.totalTax.paise).toBe(1800);
    expect(result.totalTax.paise).toBe(10800);
    expect(result.totalAmountWithTax.paise).toBe(320800); // 300,000 + 10,000 + 10,800
  });
});
