import { Money } from '../money.js';

export type TaxMode = 'UNREGISTERED' | 'COMPOSITION_SCHEME' | 'REGULAR_GST_REGISTERED';

export type PriceTaxInclusivity = 'INCLUSIVE' | 'EXCLUSIVE';

export interface TaxRateRule {
  readonly hsnCode: string;
  readonly ratePercent: number; // e.g., 3, 5, 12, 18, 28
  readonly description?: string;
}

export interface TaxCalculationItem {
  readonly skuId: string;
  readonly hsnCode: string;
  readonly unitPrice: Money;
  readonly quantity: number;
}

export interface TaxCalculationInput {
  readonly storeTaxMode: TaxMode;
  readonly originStateCode: string; // e.g., "29" for Karnataka
  readonly destinationStateCode: string; // Destination shipping state code
  readonly items: readonly TaxCalculationItem[];
  readonly shippingFee: Money;
  readonly priceTaxInclusivity?: PriceTaxInclusivity; // Defaults to 'INCLUSIVE' (Indian retail B2C standard)
  readonly shippingFeeTaxRatePercent?: number; // Configurable GST rate on shipping (Section 8 Composite Supply)
  readonly dynamicRates?: ReadonlyMap<string, TaxRateRule>; // Configurable rate rules by HSN code
}

export interface TaxComponentBreakdown {
  readonly cgst: Money;
  readonly sgst: Money;
  readonly igst: Money;
  readonly totalTax: Money;
}

export interface ItemTaxDetail {
  readonly skuId: string;
  readonly hsnCode: string;
  readonly grossLineTotal: Money; // Total paid by customer for this line
  readonly taxableAmount: Money;   // Net base before tax
  readonly taxRatePercent: number;
  readonly breakdown: TaxComponentBreakdown;
}

export interface TaxCalculationResult {
  readonly taxMode: TaxMode;
  readonly priceTaxInclusivity: PriceTaxInclusivity;
  readonly isInterState: boolean;
  readonly taxableSubtotal: Money;
  readonly totalTax: Money;
  readonly shippingTaxBreakdown: TaxComponentBreakdown;
  readonly totalAmountWithTax: Money;
  readonly overallBreakdown: TaxComponentBreakdown;
  readonly itemBreakdowns: readonly ItemTaxDetail[];
  readonly isTaxInvoiceApplicable: boolean;
  readonly invoiceTitle: string; // e.g. "Tax Invoice" vs "Bill of Supply"
}

export interface TaxStrategy {
  calculate(input: TaxCalculationInput): TaxCalculationResult;
}
