import { describe, it, expect } from 'vitest';
import { InventoryValidator } from '../src/catalog/inventory.js';

describe('InventoryValidator (Stock Calculations & Oversell Prevention)', () => {
  it('correctly calculates available sellable stock deducting reservations and safety stock', () => {
    // 50 in stock, 10 reserved in active carts, 5 safety stock buffer = 35 available
    const stock = InventoryValidator.calculateAvailableStock({
      availableQty: 50,
      reservedQty: 10,
      safetyStock: 5,
    });
    expect(stock).toBe(35);
  });

  it('clamps available stock to 0 when reservations exceed total stock', () => {
    const stock = InventoryValidator.calculateAvailableStock({
      availableQty: 10,
      reservedQty: 12,
      safetyStock: 2,
    });
    expect(stock).toBe(0);
  });

  it('validates stock availability successfully when sufficient inventory exists', () => {
    const item = { availableQty: 20, reservedQty: 2, safetyStock: 3 }; // 15 available
    const result = InventoryValidator.validateStockAvailability(item, 5);
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.isAvailable).toBe(true);
      expect(result.value.availableStock).toBe(15);
      expect(result.value.requestedQty).toBe(5);
    }
  });

  it('reports unavailability when requested quantity exceeds available stock', () => {
    const item = { availableQty: 10, reservedQty: 5, safetyStock: 2 }; // 3 available
    const result = InventoryValidator.validateStockAvailability(item, 4);
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.isAvailable).toBe(false);
      expect(result.value.availableStock).toBe(3);
    }
  });

  it('rejects invalid or non-positive requested quantities', () => {
    const item = { availableQty: 10, reservedQty: 0, safetyStock: 0 };
    expect(InventoryValidator.validateStockAvailability(item, 0).isFailure).toBe(true);
    expect(InventoryValidator.validateStockAvailability(item, -1).isFailure).toBe(true);
    expect(InventoryValidator.validateStockAvailability(item, 2.5).isFailure).toBe(true);
    expect(InventoryValidator.validateStockAvailability(item, NaN).isFailure).toBe(true);
  });

  it('deducts stock correctly when valid', () => {
    const item = { availableQty: 25, reservedQty: 0, safetyStock: 5 }; // 20 available
    const result = InventoryValidator.deductStock(item, 10);
    expect(result.isSuccess).toBe(true);
    if (result.isSuccess) {
      expect(result.value.newAvailableQty).toBe(15);
    }
  });

  it('fails with ConflictError on attempt to oversell', () => {
    const item = { availableQty: 5, reservedQty: 2, safetyStock: 1 }; // 2 available
    const result = InventoryValidator.deductStock(item, 3);
    expect(result.isFailure).toBe(true);
    if (result.isFailure) {
      expect(result.error.code).toBe('CONFLICT_ERROR');
      expect(result.error.message).toContain('exceeds available stock');
    }
  });

  it('validates manual inventory update payloads', () => {
    const valid = InventoryValidator.validateStockUpdate(100, 10);
    expect(valid.isSuccess).toBe(true);
    if (valid.isSuccess) {
      expect(valid.value.availableQty).toBe(100);
      expect(valid.value.safetyStock).toBe(10);
    }

    expect(InventoryValidator.validateStockUpdate(-5).isFailure).toBe(true);
    expect(InventoryValidator.validateStockUpdate(10, -2).isFailure).toBe(true);
    expect(InventoryValidator.validateStockUpdate('50').isFailure).toBe(true);
  });
});
