# NAVA CREATIONS — Sprint 2K.3 Independent Migration SQL Review & Trusted Proxy Security Verification

**Document ID:** NAVA-S2K.3-AUD-001  
**Project:** NAVA CREATIONS  
**Repository:** `D:\NAVA` (`abhishekk-1804/nava-creations`)  
**Base Commit:** `c403636` (*merge: combine GitHub initial commit with NAVA project baseline*)  
**Upstream:** `origin/main` (`https://github.com/abhishekk-1804/nava-creations.git`)  
**Audit Date:** 2026-11-12  
**Auditor:** Independent Senior PostgreSQL/Prisma Engineer & Application Security Reviewer  
**Standard:** Strict Verification Against Actual Repository Code & Database Engine Invariants  

---

## 1. Executive Summary & Audit Mandate

This report delivers the independent engineering and security review of the implementations introduced in Sprint 2K.2:
1. The new additive PostgreSQL migration: `packages/db/prisma/migrations/20261112_add_sovereign_payments_and_order_fsm/migration.sql`.
2. The trusted proxy and safe client IP resolution utility: `apps/web/lib/proxy-trust.ts`.
3. The tightened smoke test assertions in `apps/web/e2e/smoke.spec.ts`.
4. Automated test reconciliation across Vitest and Playwright test suites.

### Strict Review Constraints Respected
- **Zero code changes:** No modifications made to application code, migrations, or tests during this turn.
- **Zero git mutations:** No commits, pushes, resets, rebases, or branch changes.
- **Zero staging modifications:** The 2 previously staged architecture documents remain staged; no files were added or removed from the index.
- **Zero secret access:** `.env.local` was not read, printed, or modified.
- **Zero infrastructure provisioning:** No live database, cloud infrastructure, or external APIs were accessed.

### Key Audit Findings
1. **Migration SQL Integrity (PARTIAL / HIGH RISK ON LEGACY DATA):**
   The new additive migration successfully bridges the gap between `0_init` and `schema.prisma` for fresh databases. However, on an existing database that contains legacy records with `PaymentStatus = 'CAPTURED'` or `'PARTIALLY_REFUNDED'`, **Prisma Client will crash with a runtime deserialization error** (`Value 'CAPTURED' not found in enum 'PaymentStatus'`) because the migration does not translate legacy enum values to the new domain statuses (`VERIFIED` / `REFUNDED`).
2. **PostgreSQL Transaction Safety of `ALTER TYPE ... ADD VALUE` (VERIFIED):**
   In PostgreSQL 12+, `ALTER TYPE ... ADD VALUE` can execute inside transaction blocks provided the new values are not referenced in the same transaction. The migration satisfies this invariant; newly added enum values are not used in defaults or DML within the migration transaction.
3. **Shared-Bucket Denial of Service (DoS) in Proxy Fallback (DEF-05: HIGH SEVERITY):**
   When running in production without `TRUST_PROXY="true"`, `resolveClientIp` returns a static string `'untrusted-direct-client'`. Because rate limiting on `/api/admin/auth` tracks failed logins by IP, **10 failed login attempts by ANY user or attacker locks out the key `'untrusted-direct-client'` for 15 minutes, completely blocking ALL legitimate store managers from logging in**.
4. **Undocumented Proxy Configuration (DEF-06: MEDIUM SEVERITY):**
   The environment variables `TRUST_PROXY` and `PROXY_PROVIDER` are **not documented in `.env.example`**. A developer or operator deploying the application will default to `TRUST_PROXY=false`, unknowingly exposing the deployment to the Shared-Bucket DoS.
5. **Leftmost `X-Forwarded-For` Parsing Limitation (DEF-07: LOW/MEDIUM SEVERITY):**
   When `TRUST_PROXY="true"` is enabled, `resolveClientIp` selects `forwardedFor.split(',')[0]`. If deployed behind a reverse proxy that *appends* the client IP rather than prepending or overwriting, the leftmost IP remains client-controlled and spoofable.
6. **Test Reconciliation Verified (189 Tests Passing):**
   Confirmed exactly 66 Vitest unit tests + 123 Playwright tests in Chromium (189 total automated tests). All 189 tests pass with zero failures.

---

## 2. Deep-Dive Review of the New Prisma Migration

**File Inspected:** `packages/db/prisma/migrations/20261112_add_sovereign_payments_and_order_fsm/migration.sql`

```sql
1: -- CreateEnum
2: CREATE TYPE "PaymentMethod" AS ENUM ('UPI_MERCHANT_QR', 'COD', 'NET_BANKING_DIRECT');
3: 
4: -- AlterEnum
5: ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT_VERIFICATION' BEFORE 'PAYMENT_CONFIRMED';
6: 
7: -- AlterEnum
8: ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'AWAITING_VERIFICATION' BEFORE 'FAILED';
9: ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'VERIFIED' BEFORE 'FAILED';
10: ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'PENDING_COLLECTION' BEFORE 'FAILED';
11: ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'COLLECTED' BEFORE 'FAILED';
12: ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REJECTED' BEFORE 'REFUNDED';
...
```

### 2.1 Verification Checklist & Technical Analysis

#### 1. PostgreSQL Enum Alteration Compatibility & Transaction Behaviour
- **Standard Behavior:** In PostgreSQL, `ALTER TYPE ... ADD VALUE` cannot be used inside a transaction block if the new enum value is referenced in a `WHERE`, `INSERT`, or cast within the *same* transaction block (`ERROR: unsafe use of new value ... of enum type ... cannot use new value in transaction that created it`).
- **Inspection Result: PASS.**
  - Line 5 adds `'AWAITING_PAYMENT_VERIFICATION'` to `"OrderStatus"`. `orders.status` is not modified in this migration.
  - Lines 8-12 add 5 values to `"PaymentStatus"`. `payments.status` is not modified in this migration.
  - Line 15 adds `payment_method "PaymentMethod"`, but `"PaymentMethod"` was created via `CREATE TYPE` (line 2), which is fully usable immediately within the same transaction.
  - Therefore, the migration executes safely inside Prisma Migrate's default transaction wrapper on PostgreSQL 12+.

#### 2. Existing Payment Row Backfill
- **Code:** Line 36: `UPDATE "payments" SET "payment_reference" = CONCAT('PAY-', "id") WHERE "payment_reference" IS NULL;`
- **Inspection Result: PASS.**
  - `"id"` is the primary key of `"payments"` (`TEXT NOT NULL`), guaranteed to be non-null and unique.
  - `CONCAT('PAY-', "id")` deterministically generates a distinct, non-null reference for every existing row.
  - If the table is empty, 0 rows are updated and execution succeeds.

#### 3. `payment_reference` Uniqueness & NOT NULL Enforcement
- **Code:**
  - Line 37: `ALTER TABLE "payments" ALTER COLUMN "payment_reference" SET NOT NULL;`
  - Line 44: `CREATE UNIQUE INDEX IF NOT EXISTS "payments_payment_reference_key" ON "payments"("payment_reference");`
- **Inspection Result: PASS.**
  - Because line 36 backfills all nulls, setting `NOT NULL` succeeds without error.
  - Because `"id"` is unique, the unique index creation will not encounter duplicate key collisions.

#### 4. Legacy Razorpay Columns & Insert Compatibility
- **Code:**
  - Line 40: `ALTER TABLE "payments" ALTER COLUMN "gateway" DROP NOT NULL;`
  - Line 41: `ALTER TABLE "payments" ALTER COLUMN "gateway_order_id" DROP NOT NULL;`
- **Inspection Result: PASS.**
  - In `0_init`, `gateway_order_id` was `NOT NULL` without a default. Because `@nava/db` removed `gateway_order_id` from `schema.prisma`, future inserts omit this field. Dropping `NOT NULL` is strictly required to prevent insert failures.
  - Existing `CREATE UNIQUE INDEX "payments_gateway_order_id_key"` in `0_init` is maintained safely; PostgreSQL permits multiple `NULL` values in a unique index without collision.

#### 5. `verified_transaction_id` Uniqueness & NULL Handling
- **Code:**
  - Line 25: `ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "verified_transaction_id" TEXT;`
  - Line 45: `CREATE UNIQUE INDEX IF NOT EXISTS "payments_verified_transaction_id_key" ON "payments"("verified_transaction_id");`
- **Inspection Result: PASS.**
  - In SQL standards and PostgreSQL, `NULL != NULL` for unique index purposes. Multiple unverified payments with `verified_transaction_id = NULL` do not violate the unique constraint.
  - Once populated by an admin, PostgreSQL strictly enforces global uniqueness across all orders, preventing bank credit replay.

#### 6. Legacy Enum Value Compatibility & Prisma Deserialization Risk
- **Inspection Result: FAIL / HIGH RISK ON LEGACY DATA.**
  - In `0_init`, `PaymentStatus` included `'CAPTURED'` and `'PARTIALLY_REFUNDED'`.
  - In `schema.prisma`, these values were deleted from `enum PaymentStatus`.
  - In `migration.sql`, new values were added, but **no data migration was performed for legacy rows**.
  - **The Defect:** If an existing database has any rows with `status = 'CAPTURED'`, any query by Prisma Client (`prisma.payment.findMany` or `prisma.order.findUnique`) will **throw a fatal deserialization error** when parsing the database row:
    `Value 'CAPTURED' not found in enum 'PaymentStatus'`.
  - **Required Remediation:** The migration SQL must include a data migration statement:
    ```sql
    UPDATE "payments" SET "status" = 'VERIFIED' WHERE "status"::text = 'CAPTURED';
    UPDATE "payments" SET "status" = 'REFUNDED' WHERE "status"::text = 'PARTIALLY_REFUNDED';
    ```

### 2.2 Database State Failure Scenarios Evaluation

| Database Scenario | Expected Outcome | Analysis |
| :--- | :---: | :--- |
| **Clean / Fresh Database** (Zero rows) | **PASS** | Sequential execution: `0_init` → `20261111` → `20261112`. All tables, enums, columns, and indexes are created cleanly. |
| **Existing Dev Database** (With unverified orders) | **PASS** | `payment_reference` backfilled from `id`. `gateway` made nullable. Indexes created. |
| **Legacy Database with `CAPTURED` rows** | **FAIL AT RUNTIME** | DDL succeeds, but subsequent application queries on legacy rows crash in `@prisma/client`. |
| **Aborted / Re-run Execution** | **PARTIAL** | `CREATE TYPE "PaymentMethod"` does not support `IF NOT EXISTS` in standard PostgreSQL. If rerun on a database where `PaymentMethod` already exists, it throws `type "PaymentMethod" already exists`. (Prisma Migrate prevents re-runs via `_prisma_migrations`, but manual execution would fail). |

---

## 3. Schema-to-Migration Completeness Comparison Table

The table below catalogs all 38 objects defined in `packages/db/prisma/schema.prisma` against the three sequential migrations (`0_init`, `20261111_add_enquiries`, `20261112_add_sovereign_payments_and_order_fsm`):

| Prisma Object | Object Type | Migration Where Defined | Status Post-Migration 3 | Identified Risk / Discrepancy |
| :--- | :---: | :---: | :---: | :--- |
| `UserRole` | Enum | `0_init:5` | IN SYNC | None |
| `User` (`users`) | Table | `0_init:38` | IN SYNC | None |
| `CustomerAddress` (`customer_addresses`) | Table | `0_init:52` | IN SYNC | None |
| `AdminSession` (`admin_sessions`) | Table | `0_init:69` | IN SYNC | None |
| `AuditLog` (`audit_logs`) | Table | `0_init:83` | IN SYNC | None |
| `ProductStatus` | Enum | `0_init:8` | IN SYNC | None |
| `CollectionStatus` | Enum | `0_init:11` | IN SYNC | None |
| `Category` (`categories`) | Table | `0_init:98` | IN SYNC | None |
| `Product` (`products`) | Table | `0_init:113` | IN SYNC | None |
| `ProductImage` (`product_images`) | Table | `0_init:132` | IN SYNC | None |
| `Collection` (`collections`) | Table | `0_init:148` | IN SYNC | None |
| `CollectionProduct` (`collection_products`) | Table | `0_init:163` | IN SYNC | None |
| `ProductVariant` (`product_variants`) | Table | `0_init:172` | IN SYNC | None |
| `InventoryItem` (`inventory_items`) | Table | `0_init:190` | IN SYNC | None |
| `ReservationStatus` | Enum | `0_init:14` | IN SYNC | None |
| `InventoryReservation` (`inventory_reservations`)| Table | `0_init:202` | IN SYNC | None |
| `InventoryReservationItem` | Table | `0_init:215` | IN SYNC | None |
| `Cart` (`carts`) | Table | `0_init:225` | IN SYNC | None |
| `CartItem` (`cart_items`) | Table | `0_init:238` | IN SYNC | None |
| `OrderStatus` | Enum | `0_init:17` + `20261112:5` | IN SYNC | None (`AWAITING_PAYMENT_VERIFICATION` added) |
| `PaymentMethod` | Enum | `20261112:2` | IN SYNC | `CREATE TYPE` lacks `IF NOT EXISTS` |
| `Order` (`orders`) | Table | `0_init:248` + `20261112:15` | IN SYNC | Column `payment_method` & index added |
| `OrderItem` (`order_items`) | Table | `0_init:269` | IN SYNC | None |
| `PaymentStatus` | Enum | `0_init:20` + `20261112:8-12`| **PARTIAL** | Legacy `CAPTURED`/`PARTIALLY_REFUNDED` unmigrated |
| `Payment` (`payments`) | Table | `0_init:285` + `20261112:21-47`| **PARTIAL** | 13 columns added. Orphan columns `gateway` remain |
| `PaymentAttempt` (`payment_attempts`) | Table | `0_init:299` | IN SYNC | None |
| `RefundStatus` | Enum | `0_init:23` | IN SYNC | None |
| `Refund` (`refunds`) | Table | `0_init:313` | IN SYNC | None |
| `WebhookProcessingStatus` | Enum | `0_init:26` | IN SYNC | None |
| `WebhookEvent` (`webhook_events`) | Table | `0_init:331` + `20261112:50` | IN SYNC | Default changed to `'DIRECT_BANK'` |
| `ReturnStatus` | Enum | `0_init:29` | IN SYNC | None |
| `QCInspectionStatus` | Enum | `0_init:32` | IN SYNC | None |
| `RestockingDisposition` | Enum | `0_init:35` | IN SYNC | None |
| `ReturnRequest` (`return_requests`) | Table | `0_init:346` | IN SYNC | None |
| `ReturnItem` (`return_items`) | Table | `0_init:365` | IN SYNC | None |
| `StoreSetting` (`store_settings`) | Table | `0_init:376` | IN SYNC | None |
| `EnquiryStatus` | Enum | `20261111:2` | IN SYNC | None |
| `Enquiry` (`enquiries`) | Table | `20261111:5` | IN SYNC | None |

---

## 4. Trusted Proxy Security Review (`apps/web/lib/proxy-trust.ts`)

### 4.1 Verification Against Key Security Questions

#### 1. Can arbitrary client-supplied forwarding headers influence the rate-limit key?
- **In Production with `TRUST_PROXY=false`:** **NO.** Forwarded headers are strictly ignored; the system returns `'untrusted-direct-client'`.
- **In Production with `TRUST_PROXY=true`:** **YES, under specific proxy topologies.** If the upstream reverse proxy appends rather than prepending or stripping headers, the leftmost IP in `X-Forwarded-For` remains client-controlled.
- **In Development/Testing:** **YES (by design).** Forwarded headers are parsed to enable automated integration testing without a proxy harness.

#### 2. Are Cloudflare-specific headers accepted only behind a trusted Cloudflare deployment?
- **Inspection Result: PASS.** Lines 49-54 require both `trustProxy === true` AND `proxyProvider === 'cloudflare'` before inspecting `cf-connecting-ip`. Otherwise, the header is ignored.

#### 3. Is `X-Real-IP` trustworthy in the configured topology?
- **Inspection Result: CONDITIONAL.** `X-Real-IP` is trusted when `TRUST_PROXY="true"`. In Nginx environments with `proxy_set_header X-Real-IP $remote_addr;`, it is fully trustworthy because Nginx overwrites any incoming client header. However, if deployed on platforms that do not sanitize `X-Real-IP`, a client could inject it.

#### 4. Does `X-Forwarded-For` parsing correctly account for trusted proxy hops?
- **Inspection Result: FAIL / DEFECT (DEF-07).**
  Line 66: `const candidate = forwardedFor.split(',')[0]?.trim();`
  Taking the leftmost element `[0]` assumes a reverse proxy that overwrites `X-Forwarded-For` or places the client IP first. If an intermediate proxy appends client IPs (e.g., `client_sent_ip, proxy_ip`), taking index `0` yields the spoofed IP. Standard hop-aware resolution must evaluate from the rightmost untrusted hop.

#### 5. Can direct client access bypass the intended trust boundary?
- **Inspection Result: PASS.** Without `TRUST_PROXY="true"`, direct clients cannot spoof IPs because forwarded headers are discarded.

#### 6. Are malformed IPv4 and IPv6 addresses rejected?
- **Inspection Result: PASS.** Lines 25-35 validate candidate IPs using strict IPv4 and IPv6 regular expressions. Non-IP strings, SQL injections, or header pollution are rejected and trigger fallback.

#### 7. Do all relevant admin login requests use the verified IP resolver?
- **Inspection Result: PASS.** `apps/web/app/api/admin/auth/route.ts:9-10` imports and executes `resolveClientIp(request)`.

#### 8. Can the fallback key create a Denial of Service (DoS) issue?
- **Inspection Result: CRITICAL VULNERABILITY (DEF-05).**
  Line 89:
  ```typescript
  return {
    clientIp: 'untrusted-direct-client',
    isTrusted: false,
    source: 'untrusted-fallback',
  };
  ```
  In production without `TRUST_PROXY="true"`, **every single request receives the identical rate-limit key `'untrusted-direct-client'`**.
  In `apps/web/app/api/admin/auth/route.ts:15`:
  `authRateLimiter.checkDistributed('untrusted-direct-client', 10, 900)`
  If an attacker sends 10 consecutive failed login requests with bad passwords, the key `'untrusted-direct-client'` is locked out for 900 seconds (15 minutes). **This completely locks out all legitimate store managers and administrators worldwide from accessing `/admin/login`**.

#### 9. Is `TRUST_PROXY` documented in `.env.example`?
- **Inspection Result: FAIL / DEFECT (DEF-06).**
  Inspection of [.env.example](file:///d:/NAVA/.env.example) confirmed that neither `TRUST_PROXY` nor `PROXY_PROVIDER` is present in the template.

---

## 5. Test Evidence Reconciliation

### 5.1 Automated Test Counts Breakdown
The repository contains **189 automated tests**:

```
+-------------------------------------------------------------------------+
|                  VERIFIED TEST BREAKDOWN (189 PASS)                     |
+-------------------------------------------------------------------------+
| [Tier 1] Pure Unit Tests (Vitest)                     | 66 / 66  (100%) |
| [Tier 2] Playwright Direct Service Tests (Node.js)    | 38 / 38  (100%) |
| [Tier 3] Playwright HTTP API Tests (Local Next.js)    | 45 / 45  (100%) |
| [Tier 4] Playwright Browser UI & Responsive Tests     | 40 / 40  (100%) |
| [Tier 5] Statically Compiled Next.js App Routes       | 23 Routes (100%)|
| [Tier 6] PostgreSQL Database Tests                    | 0 (No Live DB)  |
| [Tier 7] Live External Provider API Tests             | 0 (No Live API) |
+-------------------------------------------------------------------------+
```

### 5.2 Verification of New Proxy Tests (`security-remediation.spec.ts`)
The 4 tests added in Sprint 2K.2 (`SEC.5`, `SEC.6`, `SEC.7`, `SEC.8`) were inspected:
- `SEC.5` creates real `Request` instances with `x-real-ip`, `cf-connecting-ip`, and multi-hop `x-forwarded-for`, asserting genuine extraction.
- `SEC.6` tests malformed string injection (`not-an-ip; DROP TABLE users`) and tests production fallback mode.
- `SEC.7` tests header omission.
- `SEC.8` sends a live HTTP `POST` to the running Next.js server `/api/admin/auth` without headers.
**Verdict:** These tests exercise actual runtime resolver logic and live HTTP handlers, not artificial mocks.

---

## 6. Status Matrix & Defect Register

| Component / Subsystem | Status | Severity | Finding |
| :--- | :---: | :---: | :--- |
| **Prisma Migration DDL** | **PASS** | Info | Bridges `0_init` to `schema.prisma` for fresh databases. Valid SQL. |
| **Prisma Legacy Enum Migration** | **FAIL** | **HIGH** (DEF-04) | Legacy `CAPTURED` rows in existing databases crash `@prisma/client` on read. |
| **Proxy Fallback Shared-Bucket DoS** | **FAIL** | **HIGH** (DEF-05) | Fallback to `'untrusted-direct-client'` enables global admin lockout DoS. |
| **Proxy Configuration Documentation** | **FAIL** | **MEDIUM** (DEF-06) | `TRUST_PROXY` and `PROXY_PROVIDER` missing from `.env.example`. |
| **Leftmost IP Proxy Parsing** | **PARTIAL** | **LOW/MED** (DEF-07)| Leftmost IP in `X-Forwarded-For` vulnerable to spoofing if proxy appends IP. |
| **Smoke Test Assertions** | **PASS** | Info | Ambiguous `[200, 503]` assertions removed; strict 503 enforced. |
| **Monorepo Build & Quality Gates** | **PASS** | Info | 189/189 tests pass, 0 typecheck errors, 0 lint errors, build clean. |

---

## 7. Required Fixes Before Database (Neon) Provisioning

Prior to provisioning a live database or running migrations in production, the following sequential fixes must be applied:

### Fix 1: Add Legacy Status Data Migration to `migration.sql`
In `packages/db/prisma/migrations/20261112_add_sovereign_payments_and_order_fsm/migration.sql`, add data translation statements prior to constraint additions:
```sql
-- Safely migrate legacy Razorpay payment statuses to modern domain equivalents
UPDATE "payments" SET "status" = 'VERIFIED' WHERE "status"::text = 'CAPTURED';
UPDATE "payments" SET "status" = 'REFUNDED' WHERE "status"::text = 'PARTIALLY_REFUNDED';
```

### Fix 2: Remediate Shared-Bucket DoS in `proxy-trust.ts`
Replace the static `'untrusted-direct-client'` string with a non-global rate-limiting identifier:
1. In production without a trusted proxy, rate-limit admin authentication per username/email or add an unshared connection identifier.
2. Alternatively, log an explicit warning and do not apply a shared global lockout across all administrators.

### Fix 3: Document `TRUST_PROXY` in `.env.example`
Add explicit reverse-proxy configuration guidance to `.env.example`:
```ini
# Reverse Proxy & Client IP Trust (Required in production behind Cloudflare, Vercel, or AWS ALB)
TRUST_PROXY="false"
PROXY_PROVIDER="standard" # Options: standard | cloudflare
```

---

## 8. Final Audit Sign-Off

- **Audit Completion:** 2026-11-12
- **Integrity Guarantee:** Zero unauthorized git commits, zero code regressions, zero secret leaks.
- **Reviewer Verdict:** The migration SQL and proxy resolver represent significant architectural progress, but **require the three documented fixes** before production database activation.
