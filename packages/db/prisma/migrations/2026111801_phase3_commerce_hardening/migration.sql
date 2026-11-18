-- =============================================================================
-- NAVA CREATIONS â€” Phase 3 Commerce Hardening Migration
-- Target: PostgreSQL 16
-- Idempotent, Additive, Zero-MDR & Concurrency Invariants
-- =============================================================================

-- 1. Enums
ALTER TYPE "ReservationStatus" ADD VALUE IF NOT EXISTS 'HELD_STOCK_UNAVAILABLE';

-- 2. Additive Columns
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "allocated_sold_qty" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "coupon_id" TEXT;
ALTER TABLE "orders" DROP CONSTRAINT IF EXISTS "orders_coupon_id_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "orders_coupon_id_idx" ON "orders"("coupon_id");

-- 3. Tighten Foreign Keys to ON DELETE RESTRICT (prevent accidental deletion of financial & ledger records)
-- DROP CONSTRAINT IF EXISTS before re-adding as RESTRICT
ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "inventory_items_variant_id_fkey";
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_items" DROP CONSTRAINT IF EXISTS "order_items_order_id_fkey";
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_order_id_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_payment_id_fkey";
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_order_id_fkey";
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "return_requests" DROP CONSTRAINT IF EXISTS "return_requests_order_id_fkey";
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Non-Negative Check Constraints
ALTER TABLE "inventory_items" DROP CONSTRAINT IF EXISTS "inventory_items_non_negative_stock";
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_non_negative_stock" CHECK ("available_qty" >= 0 AND "reserved_qty" >= 0 AND "allocated_sold_qty" >= 0);

ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "coupons_usage_non_negative";
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_usage_non_negative" CHECK ("usage_count" >= 0 AND ("usage_limit" IS NULL OR "usage_count" <= "usage_limit"));

-- 5. UTR Canonical Format Check & Partial Unique Index (payments_claimed_utr_active_unique)
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_claimed_utr_format_check";
ALTER TABLE "payments" ADD CONSTRAINT "payments_claimed_utr_format_check" CHECK ("claimed_utr" IS NULL OR "claimed_utr" ~ '^[A-Z0-9]{12,22}$');

DROP INDEX IF EXISTS "payments_claimed_utr_active_unique";
CREATE UNIQUE INDEX "payments_claimed_utr_active_unique" ON "payments" ("claimed_utr")
WHERE "claimed_utr" IS NOT NULL AND "status" NOT IN ('REJECTED'::"PaymentStatus", 'FAILED'::"PaymentStatus");
