# NAVA CREATIONS — Sprint 2J.1 Inventory Integrity Report
## Concurrency-Safe Stock Reservation, Race Condition Defense & Rollback Resilience

**Document Version:** 1.0.0  
**Date:** 2026-11-11  
**Project:** NAVA CREATIONS (`D:\NAVA`)  
**Scope:** Inventory Concurrency, Atomic Stock Allocation, TTL Expiry, and Dispatch Guardrails  

---

## 1. Executive Summary

In high-demand artisanal jewelry e-commerce, limited handcrafted pieces (often single unique editions) are vulnerable to race conditions: multiple shoppers clicking checkout simultaneously on the last available item.

Sprint 2J.1 audited and reinforced inventory management in NAVA CREATIONS:
1. **From Pure Domain to Real Database Concurrency:** Pure in-memory state machines (`ReservationStateMachine`) validate legal status transitions, but cannot prevent race conditions across parallel Node.js event loops.
2. **`InventoryReservationService`:** Created a dedicated service enforcing atomic database transactions and conditional decrement updates (`availableQty >= quantity`).
3. **Automated Expiry & Restock:** Implemented 15-minute Time-To-Live (TTL) reservation holds with automated release mechanisms.
4. **Anti-Phantom Restock:** Enforced duplicate release prevention, ensuring no cancelled or expired hold can be restored twice.
5. **Pre-Dispatch Guardrail:** Strictly permitted order cancellations before courier dispatch while blocking post-dispatch cancellations.

---

## 2. Concurrency Architecture & Conditional Updates

### 2.1 The Vulnerability: Read-Modify-Write Race Condition
In naive e-commerce backends:
1. User A reads stock: `availableQty = 1`.
2. User B reads stock: `availableQty = 1`.
3. User A updates stock: `availableQty = 0` (Succeeds).
4. User B updates stock: `availableQty = 0` (Succeeds).
*Result:* Both users are promised the item, creating a catastrophic backorder for a one-of-a-kind handmade bridal set.

### 2.2 NAVA CREATIONS Concurrency Guard: Atomic Conditional Decrement
In `apps/web/lib/inventory-reservation-service.ts`:

```sql
-- Atomic Check-and-Decrement (Executed via Prisma $transaction)
UPDATE "inventory_items"
SET "available_qty" = "available_qty" - 1,
    "reserved_qty"  = "reserved_qty" + 1
WHERE "variant_id"  = 'var_bangle_chuda_kundan_01'
  AND "available_qty" >= 1;
```

If two concurrent requests execute this statement simultaneously in PostgreSQL, row-level locks serialize the execution. The first transaction decrements `available_qty` to 0. The second transaction's `WHERE "available_qty" >= 1` predicate matches 0 rows, triggering an immediate `InsufficientStockError`.

---

## 3. Concurrency & Integrity Test Suite (`IC.1` through `IC.6`)

The service was subjected to rigorous concurrency and failure tests in `apps/web/e2e/inventory-concurrency.spec.ts`:

### Scenario 1: Two Users Contesting the Final Available Item (`IC.1`)
- **Setup:** Variant seeded with `availableQty = 1, reservedQty = 0`.
- **Action:** User A (`ORD-USER-A`) and User B (`ORD-USER-B`) execute `reserveStock` simultaneously via `Promise.allSettled`.
- **Result:**
  - Exactly 1 promise fulfilled (Reservation confirmed).
  - Exactly 1 promise rejected with `InsufficientStockError` ("Insufficient stock for variant...").
  - Final stock: `availableQty = 0, reservedQty = 1`. Zero overselling.

### Scenario 2: Automated Expired Reservation Release (`IC.2`)
- **Setup:** Reservation created with expired TTL (`ttlMinutes: -1`).
- **Action:** Background cleanup executes `releaseExpiredReservations()`.
- **Result:**
  - Expired hold identified and status set to `EXPIRED`.
  - Stock restored: `availableQty` restored from 0 to 1; `reservedQty` decremented from 1 to 0.

### Scenario 3: Duplicate Release Prevention (`IC.3`)
- **Setup:** Active reservation released once (`availableQty` restored).
- **Action:** An adversary or buggy webhook attempts to call `releaseReservation` a second time on the same reservation ID.
- **Result:**
  - Second call throws `ConflictError` ("Reservation has already been released").
  - `availableQty` remains 1; phantom double-incrementing is mathematically prevented.

### Scenario 4: Pre-Dispatch Cancellation vs Post-Dispatch Lock (`IC.4`)
- **Setup:** Customer requests order cancellation.
- **Action A (Pre-Dispatch):** Order is in `PROCESSING`. Cancellation succeeds, transitions order to `CANCELLED`, and automatically releases reserved inventory back to available stock.
- **Action B (Post-Dispatch):** Order is in `SHIPPED`. Customer attempts cancellation.
- **Result:** Throws `ConflictError` ("Order is already in state 'SHIPPED'. Pre-dispatch cancellation is strictly blocked"). Post-dispatch goods must be handled via return/RTO workflows.

### Scenario 5: Confirmation Lock & Post-Payment Immutability (`IC.5`)
- **Setup:** Customer completes payment; `confirmReservation(res.id)` is executed.
- **Action:** Reservation transitions to `CONFIRMED`. Temporary hold is cleared; item is permanently allocated to order.
- **Result:** Subsequent attempts to call `releaseReservation` throw `ConflictError` ("Cannot release confirmed reservation directly; requires return/restock").

### Scenario 6: Database Failure & Transaction Rollback (`IC.6`)
- **Setup:** Multi-table reservation transaction begins.
- **Action:** Simulated network disconnection / database crash midway through mutation (`simulateFailingReservation`).
- **Result:**
  - Transaction rolls back completely.
  - Inventory counts remain 100% uncorrupted (`availableQty = 1, reservedQty = 0`).

---

## 4. Verification Evidence Matrix

| Test ID | Test Scope | Framework | Execution Verdict |
| :--- | :--- | :--- | :---: |
| `IC.1` | Concurrent race condition on single item | Playwright (Chromium) | **PASS** |
| `IC.2` | Automated expired reservation release | Playwright (Chromium) | **PASS** |
| `IC.3` | Duplicate release / phantom restock prevention | Playwright (Chromium) | **PASS** |
| `IC.4` | Pre-dispatch cancellation vs post-dispatch block | Playwright (Chromium) | **PASS** |
| `IC.5` | Confirmation lock & terminal state protection | Playwright (Chromium) | **PASS** |
| `IC.6` | Database failure rollback resilience | Playwright (Chromium) | **PASS** |

---

## 5. Summary & Operational Guidelines

1. **State Machine Separation:** `ReservationStateMachine` in `@nava/domain` governs status legality (`PENDING` $\to$ `CONFIRMED` / `EXPIRED` / `RELEASED`). `InventoryReservationService` in `apps/web` governs the physical stock numbers (`availableQty`, `reservedQty`).
2. **Scheduled TTL Cleanup:** In production deployment, `releaseExpiredReservations()` should be scheduled via an Inngest cron job or periodic edge task every 5 minutes to continuously recover abandoned checkout carts.
