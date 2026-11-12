import { Money } from '../money.js';
import {
  TaxCalculationInput,
  TaxCalculationResult,
  TaxComponentBreakdown,
  ItemTaxDetail,
  TaxStrategy,
  PriceTaxInclusivity,
} from './types.js';

/**
 * Strategy 1: UNREGISTERED Merchant
 * Used when the store has not reached the mandatory GST threshold and has not registered.
 * Rule: Zero tax charged to customer. Tax invoice disallowed (Bill of Supply / Retail Receipt issued).
 */
export class UnregisteredTaxStrategy implements TaxStrategy {
  calculate(input: TaxCalculationInput): TaxCalculationResult {
    const inclusivity: PriceTaxInclusivity = input.priceTaxInclusivity ?? 'INCLUSIVE';
    let subtotalPaise = 0;
    const itemBreakdowns: ItemTaxDetail[] = [];

    for (const item of input.items) {
      const lineTotal = item.unitPrice.multiply(item.quantity);
      subtotalPaise += lineTotal.paise;

      itemBreakdowns.push({
        skuId: item.skuId,
        hsnCode: item.hsnCode,
        grossLineTotal: lineTotal,
        taxableAmount: lineTotal,
        taxRatePercent: 0,
        breakdown: {
          cgst: Money.zero(),
          sgst: Money.zero(),
          igst: Money.zero(),
          totalTax: Money.zero(),
        },
      });
    }

    const taxableSubtotal = Money.fromPaise(subtotalPaise);
    const totalAmount = taxableSubtotal.add(input.shippingFee);

    const zeroBreakdown: TaxComponentBreakdown = {
      cgst: Money.zero(),
      sgst: Money.zero(),
      igst: Money.zero(),
      totalTax: Money.zero(),
    };

    return {
      taxMode: 'UNREGISTERED',
      priceTaxInclusivity: inclusivity,
      isInterState: input.originStateCode !== input.destinationStateCode,
      taxableSubtotal,
      totalTax: Money.zero(),
      shippingTaxBreakdown: zeroBreakdown,
      totalAmountWithTax: totalAmount,
      overallBreakdown: zeroBreakdown,
      itemBreakdowns,
      isTaxInvoiceApplicable: false,
      invoiceTitle: 'Retail Receipt / Order Summary',
    };
  }
}

/**
 * Strategy 2: COMPOSITION SCHEME Merchant
 * Used when merchant pays a flat turnover tax to the government.
 * Rule: Cannot collect GST from customer. Issues "Bill of Supply".
 */
export class CompositionTaxStrategy implements TaxStrategy {
  calculate(input: TaxCalculationInput): TaxCalculationResult {
    const inclusivity: PriceTaxInclusivity = input.priceTaxInclusivity ?? 'INCLUSIVE';
    let subtotalPaise = 0;
    const itemBreakdowns: ItemTaxDetail[] = [];

    for (const item of input.items) {
      const lineTotal = item.unitPrice.multiply(item.quantity);
      subtotalPaise += lineTotal.paise;

      itemBreakdowns.push({
        skuId: item.skuId,
        hsnCode: item.hsnCode,
        grossLineTotal: lineTotal,
        taxableAmount: lineTotal,
        taxRatePercent: 0,
        breakdown: {
          cgst: Money.zero(),
          sgst: Money.zero(),
          igst: Money.zero(),
          totalTax: Money.zero(),
        },
      });
    }

    const taxableSubtotal = Money.fromPaise(subtotalPaise);
    const totalAmount = taxableSubtotal.add(input.shippingFee);

    const zeroBreakdown: TaxComponentBreakdown = {
      cgst: Money.zero(),
      sgst: Money.zero(),
      igst: Money.zero(),
      totalTax: Money.zero(),
    };

    return {
      taxMode: 'COMPOSITION_SCHEME',
      priceTaxInclusivity: inclusivity,
      isInterState: input.originStateCode !== input.destinationStateCode,
      taxableSubtotal,
      totalTax: Money.zero(),
      shippingTaxBreakdown: zeroBreakdown,
      totalAmountWithTax: totalAmount,
      overallBreakdown: zeroBreakdown,
      itemBreakdowns,
      isTaxInvoiceApplicable: false,
      invoiceTitle: 'Bill of Supply (Composition Scheme)',
    };
  }
}

/**
 * Strategy 3: REGULAR GST REGISTERED Merchant
 * Used when merchant is registered under regular GST.
 * Supports both TAX-INCLUSIVE (Indian retail MRP) and TAX-EXCLUSIVE modes.
 * Eliminates 1-paise intra/inter-state rounding drift by calculating total tax first,
 * then allocating 50% to CGST and remainder to SGST.
 * Configurably calculates GST on shipping charges under composite supply rules.
 */
export class RegularGstTaxStrategy implements TaxStrategy {
  calculate(input: TaxCalculationInput): TaxCalculationResult {
    const isInterState = input.originStateCode !== input.destinationStateCode;
    const inclusivity: PriceTaxInclusivity = input.priceTaxInclusivity ?? 'INCLUSIVE';

    let totalTaxableBasePaise = 0;
    let totalGrossPaise = 0;
    let totalCgstPaise = 0;
    let totalSgstPaise = 0;
    let totalIgstPaise = 0;
    const itemBreakdowns: ItemTaxDetail[] = [];

    for (const item of input.items) {
      const lineTotal = item.unitPrice.multiply(item.quantity);
      const rateRule = input.dynamicRates?.get(item.hsnCode);
      const ratePercent = rateRule ? rateRule.ratePercent : 0;

      let taxableBase: Money;
      let lineTotalTax: Money;

      if (ratePercent > 0) {
        if (inclusivity === 'INCLUSIVE') {
          // Indian Retail B2C Standard: Price displayed to customer is inclusive of tax
          // Taxable Base = RoundHalfEven(LineTotal / (1 + Rate / 100))
          const factor = 1 + ratePercent / 100;
          const exactBasePaise = Money.roundHalfEven(lineTotal.paise / factor);
          taxableBase = Money.fromPaise(exactBasePaise);
          // Total tax is the exact difference between gross and net base
          lineTotalTax = lineTotal.subtract(taxableBase);
        } else {
          // Tax-Exclusive: Tax is added on top of base unit price
          taxableBase = lineTotal;
          lineTotalTax = lineTotal.multiply(ratePercent / 100);
        }
      } else {
        taxableBase = lineTotal;
        lineTotalTax = Money.zero();
      }

      // Split tax between CGST + SGST (intra-state) or IGST (inter-state)
      // Eliminates rounding drift by deriving SGST as difference
      let itemCgst = Money.zero();
      let itemSgst = Money.zero();
      let itemIgst = Money.zero();

      if (lineTotalTax.paise > 0) {
        if (isInterState) {
          itemIgst = lineTotalTax;
          totalIgstPaise += itemIgst.paise;
        } else {
          const halfPaise = Money.roundHalfEven(lineTotalTax.paise / 2);
          itemCgst = Money.fromPaise(halfPaise);
          itemSgst = Money.fromPaise(lineTotalTax.paise - halfPaise);
          totalCgstPaise += itemCgst.paise;
          totalSgstPaise += itemSgst.paise;
        }
      }

      const grossLineTotal = inclusivity === 'INCLUSIVE' ? lineTotal : lineTotal.add(lineTotalTax);

      totalTaxableBasePaise += taxableBase.paise;
      totalGrossPaise += grossLineTotal.paise;

      itemBreakdowns.push({
        skuId: item.skuId,
        hsnCode: item.hsnCode,
        grossLineTotal,
        taxableAmount: taxableBase,
        taxRatePercent: ratePercent,
        breakdown: {
          cgst: itemCgst,
          sgst: itemSgst,
          igst: itemIgst,
          totalTax: lineTotalTax,
        },
      });
    }

    // Configurable Shipping Fee Tax (Section 8 Composite Supply)
    let shippingCgst = Money.zero();
    let shippingSgst = Money.zero();
    let shippingIgst = Money.zero();
    let shippingTotalTax = Money.zero();

    const shippingRate = input.shippingFeeTaxRatePercent ?? 0;
    if (shippingRate > 0 && input.shippingFee.paise > 0) {
      shippingTotalTax = input.shippingFee.multiply(shippingRate / 100);
      if (isInterState) {
        shippingIgst = shippingTotalTax;
        totalIgstPaise += shippingIgst.paise;
      } else {
        const halfPaise = Money.roundHalfEven(shippingTotalTax.paise / 2);
        shippingCgst = Money.fromPaise(halfPaise);
        shippingSgst = Money.fromPaise(shippingTotalTax.paise - halfPaise);
        totalCgstPaise += shippingCgst.paise;
        totalSgstPaise += shippingSgst.paise;
      }
    }

    const shippingTaxBreakdown: TaxComponentBreakdown = {
      cgst: shippingCgst,
      sgst: shippingSgst,
      igst: shippingIgst,
      totalTax: shippingTotalTax,
    };

    const overallBreakdown: TaxComponentBreakdown = {
      cgst: Money.fromPaise(totalCgstPaise),
      sgst: Money.fromPaise(totalSgstPaise),
      igst: Money.fromPaise(totalIgstPaise),
      totalTax: Money.fromPaise(totalCgstPaise + totalSgstPaise + totalIgstPaise),
    };

    const totalAmount = Money.fromPaise(totalGrossPaise)
      .add(input.shippingFee)
      .add(shippingTotalTax);

    return {
      taxMode: 'REGULAR_GST_REGISTERED',
      priceTaxInclusivity: inclusivity,
      isInterState,
      taxableSubtotal: Money.fromPaise(totalTaxableBasePaise),
      totalTax: overallBreakdown.totalTax,
      shippingTaxBreakdown,
      totalAmountWithTax: totalAmount,
      overallBreakdown,
      itemBreakdowns,
      isTaxInvoiceApplicable: true,
      invoiceTitle: 'Tax Invoice',
    };
  }
}
