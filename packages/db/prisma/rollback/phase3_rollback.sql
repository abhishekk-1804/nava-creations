-- =============================================================================
-- NAVA CREATIONS â€” Phase 3 Companion Rollback Script
-- Target: PostgreSQL 16
-- Cleanly reverts Phase 3 hardening without damaging baseline Phase 2 tables
-- =============================================================================

BEGIN;

-- 1. Revert UTR partial unique index and format check
DROP INDEX IF EXISTS "payments_claimed_utr_active_unique";
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_claimed_utr_format_check";

-- 2. Revert inventory check constraint and column
ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "inventory_items_non_negative_stock";
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_non_negative_stock" CHECK ("available_qty" >= 0 AND "reserved_qty" >= 0);
ALTER TABLE "inventory_items" DROP COLUMN IF EXISTS "allocated_sold_qty";

-- Revert orders coupon_id
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_coupon_id_fkey";
DROP INDEX IF EXISTS "orders_coupon_id_idx";
ALTER TABLE "orders" DROP COLUMN IF EXISTS "coupon_id";

-- 3. Revert foreign keys to CASCADE
ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "inventory_items_variant_id_fkey";
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_order_id_fkey";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_order_id_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_payment_id_fkey";
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_order_id_fkey";
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "return_requests" DROP CONSTRAINT IF EXISTS "return_requests_order_id_fkey";
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Clean up _prisma_migrations record
DELETE FROM "_prisma_migrations" WHERE "migration_name" = '2026111801_phase3_commerce_hardening';

COMMIT;
