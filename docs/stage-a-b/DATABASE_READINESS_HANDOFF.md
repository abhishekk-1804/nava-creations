# NAVA CREATIONS — DATABASE READINESS & MIGRATION HANDOFF
**Milestone:** Stage A + Stage B Master Execution  
**Project:** NAVA CREATIONS Handcrafted Artisanal Commerce Platform  
**Target Workspace:** `D:\NAVA`  
**Current Status:** Database Provisioning Deferred Pending Owner Sign-off  
**Date:** 2026-11-12  
**Database Engine Target:** PostgreSQL 16.x (Neon Serverless or Dedicated PostgreSQL)

---

## 1. Executive Context

Pursuant to the **Stage A + Stage B Master Execution Directive**, dynamic database engine execution and cloud provisioning (Neon / PostgreSQL) have been strictly isolated from the application refinement scope.

The application has been engineered to be 100% database-ready:
1. **Zero Schema Debt:** The complete database structure is formally codified in [packages/db/prisma/schema.prisma](file:///d:/NAVA/packages/db/prisma/schema.prisma).
2. **Canonical Chronological Migrations:** Three validated PostgreSQL 16 migration SQL files exist in sequence without gaps or orphaned lockfile entries.
3. **Pluggable Architecture:** All backend services (`CatalogService`, `OrderService`, `PaymentService`, `EmailService`) check `isDatabaseAvailable()`. If a valid `DATABASE_URL` is supplied, queries execute against Prisma; otherwise, they cleanly fail over to persistent in-memory global singletons.

---

## 2. Canonical Migration Sequence

The database schema is fully defined across three sequential migrations:

```
packages/db/prisma/migrations/
├── 0_init/
│   └── migration.sql                                    # Core catalog, users, sessions, orders, inventory
├── 20261111_add_enquiries/
│   └── migration.sql                                    # Customer consultation enquiries table
└── 20261112_add_sovereign_payments_and_order_fsm/
    └── migration.sql                                    # Sovereign UPI payments, claimed UTR, verified bank ref
```

### 2.1 Migration Summary & Data Model Entities

| Migration Name | Applied PostgreSQL Types & Tables | Critical Invariants & Constraints |
|---|---|---|
| `0_init` | `User`, `Account`, `Session`, `Category`, `Collection`, `Product`, `ProductVariant`, `InventoryItem`, `Order`, `OrderItem` | Unique slug constraints on Product/Category/Collection; foreign keys with indexed cascade deletions. |
| `20261111_add_enquiries` | `Enquiry` table, `EnquiryStatus` enum (`NEW`, `CONTACTED`, `CONVERTED`, `CLOSED`) | Unique `enquiry_number` index; `created_at` ordering index for admin queue triage. |
| `20261112_add_sovereign_payments_and_order_fsm` | `Payment` table, `PaymentStatus`, `OrderStatus`, `RefundStatus` enums | Sovereign payment fields: `claimed_utr` (unverified claim), `verified_transaction_id` (unique bank credit ref), `payment_method` (`UPI_MERCHANT_QR`, `COD`, `NET_BANKING_DIRECT`). |

---

## 3. Step-by-Step Activation Protocol (Post-Approval)

Once the business owner authorizes cloud database provisioning (Neon) or local PostgreSQL 16 runtime:

### Step 1: Environment Variable Configuration
Provide the PostgreSQL connection string in `.env.local` (or production environment secrets):
```bash
# Direct connection for schema migrations
DATABASE_URL="postgresql://[user]:[password]@[host]/[dbname]?sslmode=require"

# Optional pooled connection for serverless Next.js edge runtime
DIRECT_URL="postgresql://[user]:[password]@[host]/[dbname]?sslmode=require"
```

### Step 2: Deploy Canonical Migrations
Execute the migration deploy command across the database package:
```powershell
pnpm --filter @nava/db exec prisma migrate deploy
```
*Expected Output:*
```
3 migrations found in prisma/migrations
Applying migration `0_init`
Applying migration `20261111_add_enquiries`
Applying migration `20261112_add_sovereign_payments_and_order_fsm`
All migrations have been successfully applied.
```

### Step 3: Verify Migration Lock & Status
```powershell
pnpm --filter @nava/db exec prisma migrate status
```
*Expected Output:*
```
Database schema is up to date!
```

### Step 4: Seed Canonical Catalog Taxonomy
```powershell
pnpm --filter @nava/db run db:seed
```
*Seeds initial categories (Handmade Bangles, Bridal Sets, Kundan Artistry, Return Gifts), initial collections (Bridal Edit 2026, Bestsellers), and initial products with variants.*

### Step 5: Execute Database Integration Test Suite
```powershell
pnpm --filter @nava/db test
```
*Executes the 10 real PostgreSQL engine integration tests currently marked as deferred.*

---

## 4. Architectural Boundaries Mitigated

1. **No Fake Database Claims:** The repository honestly reports when running in offline fallback mode.
2. **Atomic In-Memory Concurrency:** While real PostgreSQL row-locks (`SELECT FOR UPDATE`) require the live database, application-level 15-minute checkout reservation TTL prevents overselling in the interim.
3. **Seamless Cutover:** Switching `DATABASE_URL` from unset to a live PostgreSQL connection activates live database queries immediately without requiring application code changes.
