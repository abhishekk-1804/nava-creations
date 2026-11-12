import { test, expect } from '@playwright/test';
import { InventoryReservationService } from '../lib/inventory-reservation-service';
import { InsufficientStockError, ConflictError } from '@nava/shared';

test.describe('Sprint 2J.1: Workstream 6 — Inventory Concurrency & Reservation Integrity', () => {
  const TEST_VARIANT = 'var_bangle_chuda_kundan_01';

  test.beforeEach(() => {
    // Reset stock to known state for test variant: 1 piece available
    InventoryReservationService.seedStock(TEST_VARIANT, 1, 0);
  });

  // 1. Concurrent reservation conflict (Two users contesting the last available piece)
  test('IC.1: Two users trying to reserve the final item concurrently results in exactly 1 winner and 1 rejection', async () => {
    // User A and User B concurrently attempt to reserve the final 1 item
    const attemptA = InventoryReservationService.reserveStock({
      variantId: TEST_VARIANT,
      quantity: 1,
      orderId: 'ORD-USER-A',
      ttlMinutes: 15,
    });

    const attemptB = InventoryReservationService.reserveStock({
      variantId: TEST_VARIANT,
      quantity: 1,
      orderId: 'ORD-USER-B',
      ttlMinutes: 15,
    });

    const results = await Promise.allSettled([attemptA, attemptB]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    // Exactly one reservation must succeed
    expect(fulfilled.length).toBe(1);
    // Exactly one must fail with InsufficientStockError
    expect(rejected.length).toBe(1);

    const firstRejected = rejected[0] as PromiseRejectedResult;
    expect(firstRejected).toBeDefined();
    expect(firstRejected.reason).toBeInstanceOf(InsufficientStockError);
    expect(firstRejected.reason.message).toContain('Insufficient stock');

    // Available quantity must be 0, reserved quantity must be 1
    const stock = await InventoryReservationService.getStock(TEST_VARIANT);
    expect(stock.availableQty).toBe(0);
    expect(stock.reservedQty).toBe(1);
  });

  // 2. Automated expired reservation release
  test('IC.2: Expired reservations release held stock back to available pool', async () => {
    // Reserve with negative TTL (already expired)
    await InventoryReservationService.reserveStock({
      variantId: TEST_VARIANT,
      quantity: 1,
      orderId: 'ORD-EXPIRED-TEST',
      ttlMinutes: -1, // Expired 1 minute ago
    });

    let stock = await InventoryReservationService.getStock(TEST_VARIANT);
    expect(stock.availableQty).toBe(0);
    expect(stock.reservedQty).toBe(1);

    // Run expiration cleanup
    const releasedCount = await InventoryReservationService.releaseExpiredReservations();
    expect(releasedCount).toBeGreaterThanOrEqual(1);

    // Stock must be restored to available pool
    stock = await InventoryReservationService.getStock(TEST_VARIANT);
    expect(stock.availableQty).toBe(1);
    expect(stock.reservedQty).toBe(0);
  });

  // 3. Duplicate release prevention (Idempotency and anti-phantom restock)
  test('IC.3: Duplicate release prevention stops phantom double-restocking', async () => {
    const res = await InventoryReservationService.reserveStock({
      variantId: TEST_VARIANT,
      quantity: 1,
      orderId: 'ORD-DOUBLE-RELEASE',
      ttlMinutes: 15,
    });

    // First release succeeds
    await InventoryReservationService.releaseReservation(res.id, 'User removed from cart');

    const stockAfterFirstRelease = await InventoryReservationService.getStock(TEST_VARIANT);
    expect(stockAfterFirstRelease.availableQty).toBe(1);

    // Second release attempt on same reservation ID must fail
    await expect(
      InventoryReservationService.releaseReservation(res.id, 'Duplicate release call')
    ).rejects.toThrow(ConflictError);

    // Available stock must NOT have incremented again to 2
    const finalStock = await InventoryReservationService.getStock(TEST_VARIANT);
    expect(finalStock.availableQty).toBe(1);
    expect(finalStock.reservedQty).toBe(0);
  });

  // 4. Pre-dispatch cancellation vs post-dispatch block
  test('IC.4: Pre-dispatch order cancellation restocks inventory, while post-dispatch cancellation is strictly blocked', async () => {
    const res = await InventoryReservationService.reserveStock({
      variantId: TEST_VARIANT,
      quantity: 1,
      orderId: 'ORD-PRE-DISPATCH',
      ttlMinutes: 15,
    });

    // Pre-dispatch cancellation from PROCESSING succeeds and restocks
    await InventoryReservationService.cancelPreDispatchOrder(
      'ORD-PRE-DISPATCH',
      'PROCESSING',
      res.id,
      'Customer cancelled prior to dispatch'
    );

    const stock = await InventoryReservationService.getStock(TEST_VARIANT);
    expect(stock.availableQty).toBe(1);
    expect(stock.reservedQty).toBe(0);

    // Attempting to cancel an order already in SHIPPED must throw ConflictError
    await expect(
      InventoryReservationService.cancelPreDispatchOrder(
        'ORD-SHIPPED-001',
        'SHIPPED',
        undefined,
        'Customer tried to cancel after courier pickup'
      )
    ).rejects.toThrow(ConflictError);
  });

  // 5. Reservation confirmation lock and expiry during checkout
  test('IC.5: Confirming reservation locks it permanently; confirmed reservations cannot be released', async () => {
    const res = await InventoryReservationService.reserveStock({
      variantId: TEST_VARIANT,
      quantity: 1,
      orderId: 'ORD-LOCK-TEST',
      ttlMinutes: 15,
    });

    // Payment succeeds -> confirm reservation
    await InventoryReservationService.confirmReservation(res.id);

    // Stock allocated: available 0, reserved 0 (allocated to order)
    const stock = await InventoryReservationService.getStock(TEST_VARIANT);
    expect(stock.availableQty).toBe(0);
    expect(stock.reservedQty).toBe(0);

    // Attempting to release a confirmed reservation directly throws ConflictError
    await expect(
      InventoryReservationService.releaseReservation(res.id, 'Illegal release attempt')
    ).rejects.toThrow(ConflictError);
  });

  // 6. Database failure during reservation simulation and rollback
  test('IC.6: Simulated database failure rolls back inventory mutation without state corruption', async () => {
    const initialStock = await InventoryReservationService.getStock(TEST_VARIANT);
    expect(initialStock.availableQty).toBe(1);
    expect(initialStock.reservedQty).toBe(0);

    // Attempt reservation that fails midway due to simulated DB disconnection
    await expect(
      InventoryReservationService.simulateFailingReservation({
        variantId: TEST_VARIANT,
        quantity: 1,
        orderId: 'ORD-FAIL-TX',
      })
    ).rejects.toThrow('DATABASE_CONNECTION_RESET');

    // Stock must remain completely uncorrupted (available: 1, reserved: 0)
    const postFailureStock = await InventoryReservationService.getStock(TEST_VARIANT);
    expect(postFailureStock.availableQty).toBe(1);
    expect(postFailureStock.reservedQty).toBe(0);
  });
});
