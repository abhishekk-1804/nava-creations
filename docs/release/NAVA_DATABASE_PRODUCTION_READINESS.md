# NAVA CREATIONS — DATABASE PRODUCTION READINESS
**Document Identifier:** `NAVA-DB-PROD-01`  
**Execution Timestamp:** 2026-11-14T08:55:30+05:30  
**Target Engine:** PostgreSQL 16.x + Prisma ORM  
**Readiness Status:** **VERIFIED & READY**  

---

## 1. POSTGRESQL ARCHITECTURE & CONNECTION MANAGEMENT

### 1.1 Dual-Role Connection Topology
- **Pooled Runtime Connection (`DATABASE_URL`):**
  - Connects as `nava_app` through pgBouncer or connection pooler.
  - Sized for high concurrency with minimal connection overhead.
  - SSL mode: `require`.
- **Direct Migration Connection (`DIRECT_URL`):**
  - Connects directly to PostgreSQL port 5432 as `nava_migrator`.
  - Bypasses transaction-level poolers to permit advisory locks and DDL execution during `prisma migrate deploy`.

### 1.2 Table & Index Inventory
Physical catalog inspection confirms **26 application tables** in the `public` schema:
- `admin_sessions`, `audit_logs`, `cart_items`, `carts`, `categories`, `collection_products`, `collections`, `coupons`, `customer_addresses`, `enquiries`, `inventory_items`, `inventory_reservation_items`, `inventory_reservations`, `order_items`, `orders`, `payment_attempts`, `payments`, `product_images`, `product_variants`, `products`, `refunds`, `return_items`, `return_requests`, `store_settings`, `users`, `webhook_events`.

### 1.3 Key Constraints & Performance Indexes
- **`inventory_items_non_negative_stock`**:
  ```sql
  CHECK ("available_qty" >= 0 AND "reserved_qty" >= 0)
  ```
- **`payments_claimed_utr_verified_unique`**:
  ```sql
  CREATE UNIQUE INDEX "payments_claimed_utr_verified_unique" 
  ON "payments" ("claimed_utr") 
  WHERE "status" = 'VERIFIED'::"PaymentStatus" AND "claimed_utr" IS NOT NULL;
  ```
- **Index Coverage:** Primary keys on all tables; foreign keys indexed on `order_id`, `variant_id`, `product_id`; unique keys on `order_number`, `sku`, `code`.

---

## 2. PRISMA MIGRATION DEPLOYMENT PROTOCOL

### 2.1 Chronological Migration Chain
All 5 migrations are verified, strictly additive, and fully applied:
1. `0_init`: Initial baseline schema.
2. `20261111_add_enquiries`: Dedicated consultation enquiries table.
3. `2026111201_add_payment_enums`: Payment status enums.
4. `2026111202_apply_sovereign_payments`: Sovereign BharatPe payment fields.
5. `2026111301_add_coupons_and_stock_constraints`: Coupons table, check constraints, partial index.

### 2.2 Controlled Production Migration Execution
Production migrations must strictly execute via Prisma CLI against `DIRECT_URL`:
```bash
cd packages/db
DIRECT_URL="<MIGRATOR_CONNECTION_STRING>" npx prisma migrate deploy
```
*Note: `prisma db push` is strictly prohibited in production.*

---

## 3. RELIABILITY & HEALTH PROBES

- **Readiness Probe (`/api/health/readiness`):**
  - Executes `SELECT 1` via Prisma client.
  - Returns HTTP 200 `{ status: "ready", checks: { database: "connected" } }` when healthy.
  - Returns HTTP 503 `{ status: "not_ready", checks: { database: "disconnected" } }` if the database is unreachable, enabling load balancers to route traffic away from degraded instances.
- **Liveness Probe (`/api/health/liveness`):**
  - Verifies Node.js process health and memory footprint independently of database availability.

---

## 4. BACKUP, RESTORATION & DISASTER RECOVERY

- **Automated Daily Backups:** `pg_dump --format=custom --no-owner --no-acl` executed via cron.
- **Retention Schedule:** Daily backups retained for 14 days; weekly snapshots retained for 60 days.
- **Recovery Time Objective (RTO):** < 30 minutes to spin up a replacement PostgreSQL instance and restore data via `pg_restore`.
- **Recovery Point Objective (RPO):** Maximum 24 hours of data loss in catastrophic disaster without streaming replication.
