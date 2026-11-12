import { ValidationError, ConflictError, Result, ok, err } from '@nava/shared';

export interface InventoryItemState {
  availableQty: number;
  reservedQty: number;
  safetyStock: number;
}

export interface StockAvailabilityResult {
  isAvailable: boolean;
  availableStock: number;
  requestedQty: number;
}

export class InventoryValidator {
  /**
   * Computes sellable stock after accounting for active reservations and safety buffer.
   */
  static calculateAvailableStock(item: InventoryItemState): number {
    const rawSellable = item.availableQty - item.reservedQty - item.safetyStock;
    return Math.max(0, rawSellable);
  }

  /**
   * Validates whether requested quantity can be fulfilled from existing stock.
   */
  static validateStockAvailability(
    item: InventoryItemState,
    requestedQty: unknown
  ): Result<StockAvailabilityResult, ValidationError> {
    if (typeof requestedQty !== 'number' || !Number.isInteger(requestedQty) || !Number.isFinite(requestedQty)) {
      return err(
        new ValidationError(
          `Requested quantity must be an exact positive integer, received: ${String(requestedQty)}`
        )
      );
    }

    if (requestedQty <= 0) {
      return err(
        new ValidationError(`Requested quantity must be at least 1, received: ${requestedQty}`)
      );
    }

    const availableStock = this.calculateAvailableStock(item);
    const isAvailable = availableStock >= requestedQty;

    return ok({
      isAvailable,
      availableStock,
      requestedQty,
    });
  }

  /**
   * Validates and computes inventory deduction, strictly preventing overselling.
   */
  static deductStock(
    item: InventoryItemState,
    requestedQty: number
  ): Result<{ newAvailableQty: number }, ConflictError | ValidationError> {
    const validation = this.validateStockAvailability(item, requestedQty);
    if (validation.isFailure) {
      return err(validation.error);
    }

    if (!validation.value.isAvailable) {
      return err(
        new ConflictError(
          `Cannot fulfill request: required quantity (${requestedQty}) exceeds available stock (${validation.value.availableStock})`
        )
      );
    }

    const newAvailableQty = item.availableQty - requestedQty;
    return ok({ newAvailableQty });
  }

  /**
   * Validates manual inventory adjustment values for store operators.
   */
  static validateStockUpdate(
    availableQty: unknown,
    safetyStock?: unknown
  ): Result<{ availableQty: number; safetyStock: number }, ValidationError> {
    if (typeof availableQty !== 'number' || !Number.isInteger(availableQty) || availableQty < 0) {
      return err(
        new ValidationError(`availableQty must be a non-negative integer, received: ${String(availableQty)}`)
      );
    }

    let resolvedSafetyStock = 0;
    if (safetyStock !== undefined && safetyStock !== null) {
      if (typeof safetyStock !== 'number' || !Number.isInteger(safetyStock) || safetyStock < 0) {
        return err(
          new ValidationError(`safetyStock must be a non-negative integer, received: ${String(safetyStock)}`)
        );
      }
      resolvedSafetyStock = safetyStock;
    }

    return ok({
      availableQty,
      safetyStock: resolvedSafetyStock,
    });
  }
}
