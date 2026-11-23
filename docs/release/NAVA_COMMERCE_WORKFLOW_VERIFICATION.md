# NAVA CREATIONS — COMMERCE WORKFLOW VERIFICATION
**Document Identifier:** `NAVA-COMMERCE-VERIFY-01`  
**Execution Timestamp:** 2026-11-14T08:54:30+05:30  
**Target Architecture:** Free-First Sovereign Commerce  
**Verification Status:** **100% VERIFIED**  

---

## 1. EXECUTIVE COMMERCE SUMMARY

The end-to-end commerce transaction lifecycle for NAVA CREATIONS was verified against physical PostgreSQL 16 database transactions and automated Playwright user journeys. The implementation strictly adheres to:
1. **Server-Authoritative Pricing:** Zero client-side price tampering or floating-point calculations (all currency in integer paise).
2. **Anti-Overselling Concurrency Guard:** Conditional atomic updates combined with a database-level CHECK constraint (`available_qty >= 0`).
3. **Sovereign India-First Payments:** Direct BharatPe Merchant UPI QR intent generation (zero intermediary gateway MDR fees) with authoritative bank ledger matching.
4. **Fraud & Collision Defense:** Partial unique index preventing duplicate bank credit verification while capturing duplicate pending claims for audit.
5. **Customer Privacy:** Dual-path order tracking requiring either an authentic admin session or an HMAC SHA-256 guest access token.

---

## 2. DETAILED WORKFLOW VERIFICATION

### 2.1 Customer Checkout & Address Validation
- **Indian Logistics Support:** Validates 10-digit mobile numbers (`^[6-9]\d{9}$`), 6-digit postal PIN codes, and Indian state codes (defaulting to Karnataka `29`).
- **Server-Side Total Recalculation:** Subtotal, discount, tax (inclusive GST mode), and shipping are calculated exclusively by `@nava/domain` Money and Tax classes.
- **Duplicate Checkout Defense:** Order placement executes within a single interactive database transaction (`prisma.$transaction`) with deterministic variant sorting to prevent deadlocks.

### 2.2 Inventory Reservation & Expiry Lifecycle
- **Atomic Reservation:**
  ```ts
  const updateResult = await tx.inventoryItem.updateMany({
    where: { variantId, availableQty: { gte: quantity } },
    data: { availableQty: { decrement: quantity }, reservedQty: { increment: quantity } }
  });
  if (updateResult.count === 0) throw new InsufficientStockError(...);
  ```
- **15-Minute TTL:** Pending checkouts hold stock for 15 minutes.
- **Scheduled Expiry Endpoint:** `/api/cron/release-reservations` (protected by `CRON_SECRET`) releases expired pending holds while strictly protecting orders in `AWAITING_PAYMENT_VERIFICATION`.
- **Database CHECK Constraint:** Physical constraint `inventory_items_non_negative_stock` prevents stock integers from ever dropping below zero.

### 2.3 Coupons & Promotion Engine
- **PostgreSQL Persistence:** Dedicated `coupons` table with code uniqueness, active date windows, min order amount, and usage limits.
- **Atomic Usage Increment:**
  ```sql
  UPDATE "coupons"
  SET "usage_count" = "usage_count" + 1, "updated_at" = NOW()
  WHERE "code" = $1 AND "is_active" = true
    AND ("valid_from" IS NULL OR "valid_from" <= NOW())
    AND ("valid_until" IS NULL OR "valid_until" >= NOW())
    AND ("usage_limit" IS NULL OR "usage_count" < "usage_limit");
  ```
- **Concurrency Test Evidence:** In a 5-way concurrent redemption test for a coupon with `usage_limit: 2`, exactly 2 redemptions succeeded and 3 were cleanly rejected with transaction rollback.

### 2.4 Sovereign BharatPe UPI QR & UTR Verification
- **NPCI Intent Format:** Generates dynamic intent string `upi://pay?pa=...&pn=...&am=...&tr=...&cu=INR` with order-unique transaction reference tag.
- **Customer Claim Submission:** Customers enter their 12-digit bank UTR upon payment. The status transitions to `AWAITING_PAYMENT_VERIFICATION` (internal) and `PAYMENT_UNDER_VERIFICATION` (customer-facing).
- **Duplicate Claim Handling:** If multiple customers claim the same UTR, the system permits the claim in pending status, flags it with `isDuplicateClaim: true`, and surfaces an audit notice.
- **Authoritative Bank Reconciliation:**
  - Store manager verifies incoming credit on the bank current account statement.
  - Partial unique index `payments_claimed_utr_verified_unique` on PostgreSQL ensures only ONE order can ever be marked `VERIFIED` with that UTR.
  - Verification collisions trigger Prisma `P2002` conflict and map to HTTP 409 Conflict with clear error feedback.

### 2.5 Cash on Delivery (COD) Workflow
- **Safety Ceiling:** Configurable ceiling (provisional ₹5,000 / 500,000 paise).
- **Policy Verification:** Enforces phone validation and studio confirmation prior to generating packing slips.
- **Status Progression:** `PENDING` -> `CONFIRMED` -> `SHIPPED` -> `DELIVERED` (collection recorded).

---

## 3. COMMERCE INTEGRITY VERIFICATION LEDGER

| Component | Test File / Script | Scenarios | Result |
| :--- | :--- | :---: | :---: |
| High-Concurrency Anti-Overselling | `scripts/test-phase3-commerce-integrity.js` | 1 | **PASS** |
| UTR Duplicate Claim Registration | `scripts/test-phase3-commerce-integrity.js` | 1 | **PASS** |
| Concurrent Bank Verification Conflict | `scripts/test-phase3-commerce-integrity.js` | 1 | **PASS** |
| Atomic Rollback on Non-existent Payment | `scripts/test-phase3-commerce-integrity.js` | 1 | **PASS** |
| Stateless HMAC Guest Order Token | `scripts/test-stretch1-integrations.js` | 1 | **PASS** |
| Persistent Coupon Atomic Increment | `scripts/test-stretch1-integrations.js` | 1 | **PASS** |
| Database Non-Negative CHECK Constraint | `scripts/test-stretch1-integrations.js` | 1 | **PASS** |
| Reservation Expiry Verification Guard | `scripts/test-stretch1-integrations.js` | 1 | **PASS** |
| Customer Checkout & QR Flow | `apps/web/e2e/orders-checkout.spec.ts` | 12 | **PASS** |
| Payment Integration & UTR Locking | `apps/web/e2e/payment-integration.spec.ts` | 17 | **PASS** |
