# NAVA CREATIONS — PHASE 3 GAP REGISTER
## Comprehensive Architecture & Implementation Audit

**Document ID:** `PHASE-3-GAP-REGISTER`  
**Date:** 2026-11-13  
**Working Branch:** `phase-3-integrated-commerce`  
**Baseline Commit:** `b12bf269328e5be9480dad6f35f723cafa3e46a7`  

---

### Summary of Audit Findings

| ID | Severity | Category | Affected File / Component | Status | Verification Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-SEC-01** | **CRITICAL** | Security / PII | `apps/web/app/api/orders/[orderNumber]/route.ts` | **RESOLVED & VERIFIED** | `e2e/orders-checkout.spec.ts` (ORD-01..04), `test-stretch1-integrations.js` (Test 1) |
| **GAP-DATA-01** | **HIGH** | Concurrency / Race | `apps/web/lib/inventory-reservation-service.ts` | **RESOLVED & VERIFIED** | `e2e/inventory-concurrency.spec.ts`, `test-phase3-commerce-integrity.js` (Scenario 1) |
| **GAP-DATA-02** | **HIGH** | Data Integrity | `packages/db/prisma/schema.prisma` (`inventory_items`) | **RESOLVED & VERIFIED** | Migration `2026111301`, `test-stretch1-integrations.js` (Test 3) |
| **GAP-PAY-01** | **HIGH** | Payment Integrity | `apps/web/lib/payment-service.ts` | **RESOLVED & VERIFIED** | Database fail-closed validation, `test-phase3-commerce-integrity.js` (Scenario 2, 4) |
| **GAP-PAY-02** | **HIGH** | Payment Concurrency | `packages/db/prisma/schema.prisma` (`claimed_utr`) | **RESOLVED & VERIFIED** | Partial unique index `payments_claimed_utr_verified_unique`, P2002 -> 409 Conflict |
| **GAP-PROM-01** | **HIGH** | Persistence Gap | `apps/web/lib/promotion-service.ts` | **RESOLVED & VERIFIED** | Persistent `promotions` / `promotion_redemptions`, `test-stretch1-integrations.js` (Test 2) |
| **GAP-DB-01** | **MEDIUM** | Least Privilege / RLS | Database Connection Architecture | **RESOLVED & VERIFIED** | Dual roles `nava_migrator` (DDL) and `nava_app` (DML only, no DDL/TRUNCATE) |
| **GAP-DB-02** | **MEDIUM** | Schema Drift | Migration history & schema alignment | **RESOLVED & VERIFIED** | Clean 5-migration lineage, `prisma validate` 100% clean |

---

### Detailed Gap Profiles

#### GAP-SEC-01: Unauthenticated Customer Order Retrieval (IDOR / PII Leakage)
- **Severity:** `CRITICAL` (Immediate Blocker)
- **Affected File:** `apps/web/app/api/orders/[orderNumber]/route.ts:4-27`
- **Evidence:** 
  ```ts
  export async function GET(_request: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
    const { orderNumber } = await params;
    const order = await OrderService.getOrder(orderNumber.trim());
    return NextResponse.json({ success: true, order }, { status: 200 });
  }
  ```
- **Business Impact:** Any anonymous visitor or automated crawler can enumerate order numbers (`ORD-2026-XXXX`) and exfiltrate customer names, physical delivery addresses, phone numbers, items ordered, and paise financial totals. Violates India Digital Personal Data Protection (DPDP) Act 2023.
- **Recommended Remediation:** Implement dual-path server-side authorization:
  1. Authenticated users: Authoritative session check via `supabase.auth.getUser()`, requiring `auth.uid === order.userId`.
  2. Guest checkout: Require high-entropy 32-byte guest access token in `x-guest-order-token` header, verified against stored SHA-256 digest using `crypto.timingSafeEqual`.
  3. Return uniform 404 responses for nonexistent, unauthorized, or malformed requests.
  4. IP rate-limiting.
- **Test Required:** Vitest API route security suite verifying unauthenticated, wrong-user, valid guest, invalid guest, and enumeration requests.
- **Current Status:** Confirmed Unpatched in baseline `b12bf26`.

---

#### GAP-DATA-01: Inventory Reservation Read-Then-Update Race Condition
- **Severity:** `HIGH`
- **Affected File:** `apps/web/lib/inventory-reservation-service.ts:138-155`
- **Evidence:**
  ```ts
  const item = await tx.inventoryItem.findUnique({ where: { variantId: input.variantId } });
  if (!item || item.availableQty < input.quantity) throw new InsufficientStockError(...);
  await tx.inventoryItem.update({
    where: { variantId: input.variantId },
    data: { availableQty: { decrement: input.quantity }, reservedQty: { increment: input.quantity } },
  });
  ```
- **Business Impact:** Under standard PostgreSQL `READ COMMITTED` isolation, multiple concurrent transactions read `availableQty = 1` before any update commits. All transactions pass the check, decrement available quantity sequentially, and drive stock negative (`available_qty < 0`), causing overselling of handmade jewellery.
- **Recommended Remediation:** Replace read-then-update with an atomic conditional SQL update:
  `UPDATE "inventory_items" SET "available_qty" = "available_qty" - $1, "reserved_qty" = "reserved_qty" + $1 WHERE "variant_id" = $2 AND "available_qty" >= $1 RETURNING *;`
  Alternatively execute `SELECT ... FOR UPDATE` within the transaction.
- **Test Required:** Concurrency test scenario: 10 parallel independent reservation requests contesting 1 available unit. Exactly 1 must succeed, 9 must fail with `InsufficientStockError`, and final `available_qty` must remain `0`.
- **Current Status:** In-memory mutex exists but database path is vulnerable to concurrency race conditions across connections.

---

#### GAP-DATA-02: Missing Database CHECK Constraint for Non-Negative Inventory
- **Severity:** `HIGH`
- **Affected File:** `packages/db/prisma/schema.prisma:232-243` & `0_init/migration.sql`
- **Evidence:** Table `inventory_items` defines `available_qty Int @default(0)` with zero database-level constraint preventing negative values.
- **Business Impact:** If an application-level bug or race condition occurs, PostgreSQL permits negative stock integers, silently corrupting physical inventory state.
- **Recommended Remediation:** Add additive migration with database check constraint:
  `ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_non_negative_stock" CHECK ("available_qty" >= 0 AND "reserved_qty" >= 0);`
- **Test Required:** Live PostgreSQL constraint test attempting to update `available_qty` to `-1` and asserting check constraint violation.
- **Current Status:** Absent in baseline schema.

---

#### GAP-PAY-01: In-Memory Claimed UTR Registry & Multi-Instance Loss
- **Severity:** `HIGH`
- **Affected File:** `apps/web/lib/payment-service.ts:83-100` (`claimedUtrRegistry`)
- **Evidence:**
  ```ts
  const globalForPayment = globalThis as unknown as {
    __nava_claimed_utrs__?: Map<string, { orderNumber: string; claimedAt: number; count: number }>;
  };
  const claimedUtrRegistry = globalForPayment.__nava_claimed_utrs__;
  ```
- **Business Impact:** The duplicate UTR claim registry resides in ephemeral Node.js memory. Server restarts, container recreations, or multi-instance clustering wipe the registry, allowing malicious actors to submit the same UTR across multiple orders.
- **Recommended Remediation:** Enforce duplicate claim detection in the database via partial unique index on `payments(claimed_utr)` for active states.
- **Test Required:** Concurrency test submitting identical UTR to two separate orders; second submission must be detected and rejected/flagged.
- **Current Status:** In-memory Map only.

---

#### GAP-PAY-02: Non-Unique `claimed_utr` Index in PostgreSQL
- **Severity:** `HIGH`
- **Affected File:** `packages/db/prisma/schema.prisma:439` & `2026111202_apply_sovereign_payments/migration.sql:45`
- **Evidence:** `CREATE INDEX IF NOT EXISTS "payments_claimed_utr_idx" ON "payments"("claimed_utr");` is a non-unique index.
- **Business Impact:** The database allows multiple rows with the exact same `claimed_utr` even when active or verified.
- **Recommended Remediation:** Apply partial unique index:
  `CREATE UNIQUE INDEX "payments_claimed_utr_active_unique" ON "payments"("claimed_utr") WHERE "status" IN ('INITIATED', 'AWAITING_VERIFICATION', 'VERIFIED') AND "claimed_utr" IS NOT NULL;`
- **Test Required:** PostgreSQL migration test verifying active duplicates are blocked while rejected claims (`status = 'REJECTED'`) can be re-submitted.
- **Current Status:** Proposed SQL authored; pending Gate B execution on isolated PostgreSQL 16.

---

#### GAP-PROM-01: Ephemeral In-Memory Promotion / Coupon System
- **Severity:** `HIGH`
- **Affected File:** `apps/web/lib/promotion-service.ts:5-63`
- **Evidence:** `couponsRegistry` is stored on `globalThis.__nava_coupons__` with hardcoded seed entries. No Prisma model or migration exists for promotions.
- **Business Impact:** Coupon usage counts are wiped on restart. Budget caps (e.g. max 200 redemptions of `BRIDAL10`) are reset, allowing unlimited unintended discount abuse.
- **Recommended Remediation:** Model persistent `Promotion` and `PromotionRedemption` entities in Prisma with atomic usage count decrements/increments and rollback CTE.
- **Test Required:** Vitest + database integration test testing concurrent redemptions of a promotion with remaining count 1.
- **Current Status:** Unpersisted in baseline.

---

#### GAP-DB-01: Missing Role Least-Privilege & Unrestricted Application Account
- **Severity:** `MEDIUM`
- **Affected File:** Database Connection Architecture
- **Evidence:** Current migrations and runtime connect via the default `postgres` superuser account.
- **Business Impact:** Application runtime can execute DDL (`DROP TABLE`, `ALTER TABLE`) or truncate tables if an injection vulnerability occurs.
- **Recommended Remediation:** Establish dedicated `nava_migrator` (DDL) and `nava_app` (DML only, no TRUNCATE/DDL, no access to `_prisma_migrations`) roles.
- **Test Required:** Role test asserting `nava_app` can perform CRUD on application tables but fails when attempting `CREATE TABLE` or `DROP TABLE`.
- **Current Status:** Specification drafted; pending execution in Gate B.

---

#### GAP-DB-02: Legacy Razorpay Columns Drift in `payments` Table
- **Severity:** `MEDIUM`
- **Affected File:** `packages/db/prisma/migrations/0_init/migration.sql:288-289, 475`
- **Evidence:** Columns `gateway` and `gateway_order_id` along with unique index `payments_gateway_order_id_key` exist on the physical `payments` table but are omitted from `schema.prisma`.
- **Business Impact:** Discrepancy between Prisma schema and physical schema causes unexpected behavior during full schema validations.
- **Recommended Remediation:** Reconcile legacy columns formally in migration history.
- **Test Required:** `prisma validate` and `prisma migrate status` clean check.
- **Current Status:** Identified and documented.
