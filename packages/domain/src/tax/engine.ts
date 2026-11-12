import {
  TaxCalculationInput,
  TaxCalculationResult,
  TaxMode,
  TaxStrategy,
} from './types.js';
import {
  UnregisteredTaxStrategy,
  CompositionTaxStrategy,
  RegularGstTaxStrategy,
} from './strategies.js';

export class TaxEngine {
  private readonly strategies: Map<TaxMode, TaxStrategy>;

  constructor() {
    this.strategies = new Map<TaxMode, TaxStrategy>([
      ['UNREGISTERED', new UnregisteredTaxStrategy()],
      ['COMPOSITION_SCHEME', new CompositionTaxStrategy()],
      ['REGULAR_GST_REGISTERED', new RegularGstTaxStrategy()],
    ]);
  }

  calculateTax(input: TaxCalculationInput): TaxCalculationResult {
    const strategy = this.strategies.get(input.storeTaxMode);
    if (!strategy) {
      // Default safely to UNREGISTERED to avoid unverified tax collection
      return this.strategies.get('UNREGISTERED')!.calculate(input);
    }
    return strategy.calculate(input);
  }
}
