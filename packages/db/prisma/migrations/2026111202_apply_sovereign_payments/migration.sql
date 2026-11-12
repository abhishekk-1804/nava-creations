-- AlterTable: Add payment_method to orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "payment_method" "PaymentMethod" NOT NULL DEFAULT 'UPI_MERCHANT_QR';

-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_payment_method_idx" ON "orders"("payment_method");

-- AlterTable: Add sovereign payment fields to payments table
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payment_method" "PaymentMethod" NOT NULL DEFAULT 'UPI_MERCHANT_QR';
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "payment_reference" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "claimed_utr" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "verified_transaction_id" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "upi_transaction_ref" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "is_duplicate_claim" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "verified_by_user_id" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "verified_at" TIMESTAMP(3);
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "verification_notes" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "bank_reference" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "courier_awb" TEXT;
ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "collected_at" TIMESTAMP(3);

-- Preserve true provenance for legacy records: retain original gateway name if present
UPDATE "payments" SET "provider" = COALESCE("gateway", 'BHARATPE_QR') WHERE "provider" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "provider" SET NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "provider" SET DEFAULT 'BHARATPE_QR';

-- Safely migrate legacy captured payments with verifiable audit provenance
UPDATE "payments"
SET "status" = 'VERIFIED',
    "verification_notes" = COALESCE("verification_notes", 'Migrated from legacy captured payment record'),
    "verified_at" = COALESCE("verified_at", "created_at")
WHERE "status"::text = 'CAPTURED';

-- Backfill payment_reference for existing records before enforcing NOT NULL
UPDATE "payments" SET "payment_reference" = CONCAT('PAY-', "id") WHERE "payment_reference" IS NULL;
ALTER TABLE "payments" ALTER COLUMN "payment_reference" SET NOT NULL;

-- Relax legacy gateway columns so sovereign inserts without gateway/gateway_order_id succeed
ALTER TABLE "payments" ALTER COLUMN "gateway" DROP NOT NULL;
ALTER TABLE "payments" ALTER COLUMN "gateway_order_id" DROP NOT NULL;

-- Create Unique Constraints and Performance Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "payments_payment_reference_key" ON "payments"("payment_reference");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_verified_transaction_id_key" ON "payments"("verified_transaction_id");
CREATE INDEX IF NOT EXISTS "payments_claimed_utr_idx" ON "payments"("claimed_utr");
-- Note: Redundant non-unique index "payments_verified_transaction_id_idx" omitted (resolved NIT-01)

-- AlterTable: Update webhook events default
ALTER TABLE "webhook_events" ALTER COLUMN "gateway" SET DEFAULT 'DIRECT_BANK';
