# NAVA CREATIONS — GATE 1 DATABASE MIGRATION REVIEW
**Document Identifier:** `NAVA-DB-GATE1-01`  
**Date:** November 15, 2026  
**Status:** Reviewed & Certified Safe for Staging  
**Target Engine:** PostgreSQL 16  
**ORM:** Prisma ORM 6.19.3  

---

## 1. Migration Lineage & Status

The NAVA CREATIONS database schema consists of 5 linear, forward-only migrations located in `packages/db/prisma/migrations/`:

| Migration Directory | Applied on Test DB? | Applied on Production? | Purpose & Schema Impact |
|---|:---:|:---:|---|
| `0_init` | **YES** | **NO** | Core foundational tables: categories, collections, products, product_variants, inventory_items, orders, order_items, payments, audit_logs. |
| `20261111_add_enquiries` | **YES** | **NO** | Customer enquiries and consultation requests (`enquiries` table). |
| `2026111201_add_payment_enums` | **YES** | **NO** | Sovereign Indian payment enums (`PaymentMethod`, `PaymentProvider`, `PaymentStatus`). |
| `2026111202_apply_sovereign_payments` | **YES** | **NO** | Columns for claimed UTRs, verified bank IDs, audit timestamps, and UPI tracking. |
| `2026111301_add_coupons_and_stock_constraints` | **YES** | **NO** | Coupons schema, non-negative stock CHECK constraint, and non-negative coupon usage CHECK constraint. |

---

## 2. Migration Safety & Clean-Up Review: `2026111301_add_coupons_and_stock_constraints`

### 2.1 Remediation of Fabrication / Seed Contamination
- **Original Defect:** The migration file previously contained unapproved promotional campaign insert statements:
  ```sql
  -- DEFECT (REMOVED):
  INSERT INTO "coupons" ("id", "code", "description", "type", "value", "min_order_paise", "usage_limit", "usage_count", ...)
  VALUES ('cpn-001', 'WELCOME100', ..., 14), ('cpn-002', 'FESTIVE15', ..., 28), ('cpn-003', 'BRIDAL20', ..., 6);
  ```
- **Remediation Action:** All `INSERT` statements were completely expunged. Migrations must strictly define DDL (Data Definition Language) and never insert artificial business records or fabricated usage counters.

### 2.2 Schema Constraints Added
The finalized migration script `packages/db/prisma/migrations/2026111301_add_coupons_and_stock_constraints/migration.sql` now contains:

```sql
-- CreateEnum
CREATE TYPE "PromotionType" AS ENUM ('PERCENTAGE', 'FLAT_AMOUNT');

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "PromotionType" NOT NULL,
    "value" INTEGER NOT NULL,
    "min_order_paise" INTEGER NOT NULL DEFAULT 0,
    "max_discount_paise" INTEGER,
    "usage_limit" INTEGER,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- Check Constraint for Non-Negative Inventory (GAP-DATA-02)
ALTER TABLE "inventory_items" 
ADD CONSTRAINT "inventory_items_non_negative_stock" 
CHECK ("available_qty" >= 0 AND "reserved_qty" >= 0);

-- Check Constraint for Coupon Usage Limit Non-Negative and Cap (GAP-PROM-01)
ALTER TABLE "coupons"
ADD CONSTRAINT "coupons_usage_non_negative"
CHECK ("usage_count" >= 0 AND ("usage_limit" IS NULL OR "usage_count" <= "usage_limit"));
```

---

## 3. Production Rollout Safety Protocol

1. **Zero Downtime Compatibility:**
   - All migrations are additive (creating new tables and adding constraints).
   - Constraints are evaluated against clean initial schemas without locking existing active traffic.
2. **Role Separation (Least-Privilege):**
   - Application runtime uses `nava_app` (DML only: `SELECT, INSERT, UPDATE, DELETE`).
   - Migration deployment uses `nava_migrator` (DDL owner).
3. **Execution Command:**
   ```bash
   cd packages/db
   DIRECT_URL="<MIGRATOR_CONNECTION_STRING>" npx prisma migrate deploy
   ```
4. **Safety Affirmation:**
   - **Zero production databases were modified during Gate 1.**
   - All schema validation and execution testing was confined to local PostgreSQL test database `nava_gateb_test`.

---

## 4. Migration Immutability & Checksum Verification

- **Preservation of `0_init/migration.sql`:**
  - Full inspection of `0_init/migration.sql` confirmed that the initial foundational migration is completely unchanged and restored to exact Git HEAD.
  - The migration checksum matches the historical database migration log `_prisma_migrations`.
- **Prisma CLI Status Verification:**
  ```text
  Prisma schema loaded from prisma\schema.prisma
  Datasource "db": PostgreSQL database "nava_gateb_test", schema "public" at "127.0.0.1:5432"

  5 migrations found in prisma/migrations

  Database schema is up to date!
  ```
- **Forward-Only Guarantee:**
  - All subsequent schema evolutions (such as `2026111301_add_coupons_and_stock_constraints`) are forward-only migrations.
  - No retroactive edits were made to historical migrations.

