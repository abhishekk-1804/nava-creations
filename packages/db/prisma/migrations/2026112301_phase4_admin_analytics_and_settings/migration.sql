-- =============================================================================
-- NAVA CREATIONS — Phase 4 Admin Analytics & Store Settings Migration
-- Target: PostgreSQL 16
-- Idempotent, Additive, Zero-MDR
-- =============================================================================

-- 1. Create store_configurations table for dynamic admin settings
CREATE TABLE IF NOT EXISTS "store_configurations" (
    "id" TEXT NOT NULL,
    "support_phone" TEXT NOT NULL DEFAULT '+91 72046 28513',
    "upi_vpa" TEXT NOT NULL DEFAULT 'nava.creations@bharatpe',
    "merchant_name" TEXT NOT NULL DEFAULT 'NAVA Creations',
    "cod_enabled" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "store_configurations_pkey" PRIMARY KEY ("id")
);

-- 2. Ensure inventory_items allocated_sold_qty column is present (idempotent)
ALTER TABLE "inventory_items" ADD COLUMN IF NOT EXISTS "allocated_sold_qty" INTEGER NOT NULL DEFAULT 0;
