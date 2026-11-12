-- =============================================================================
-- NAVA CREATIONS — PostgreSQL 16 Migration Verification Script
-- Target Database: PostgreSQL 16
-- Purpose: Reproduce and prove BLK-01 (Error 55P04) and verify split recovery
-- =============================================================================

-- TEST 1: REPRODUCE BLK-01 (Error 55P04 in a single transaction block)
-- Under PostgreSQL 12-16, adding an enum value and using it in the same transaction
-- fails with ERROR 55P04.
DO $$
BEGIN
  RAISE NOTICE '=== Running Test 1: Simulating Single-Transaction Migration (Defect BLK-01) ===';
END $$;

BEGIN;
  -- Create sample test enum and table
  CREATE TYPE "TestPaymentStatus" AS ENUM ('INITIATED', 'CAPTURED', 'FAILED');
  CREATE TABLE "test_payments" (
    id TEXT PRIMARY KEY,
    status "TestPaymentStatus" NOT NULL
  );
  INSERT INTO "test_payments" VALUES ('p1', 'CAPTURED');

  -- Step A: Add enum value inside the transaction
  ALTER TYPE "TestPaymentStatus" ADD VALUE 'VERIFIED' BEFORE 'FAILED';

  -- Step B: Attempt to use the new enum value in the same transaction
  -- EXPECTED RESULT: ERROR 55P04: unsafe use of new value "VERIFIED" of enum type "TestPaymentStatus"
  -- HINT: The new enum value must be committed before it can be used.
  BEGIN
    UPDATE "test_payments" SET "status" = 'VERIFIED' WHERE "status"::text = 'CAPTURED';
    RAISE EXCEPTION 'UNEXPECTED: PostgreSQL permitted unsafe enum usage inside same transaction!';
  EXCEPTION
    WHEN SQLSTATE '55P04' THEN
      RAISE NOTICE 'SUCCESSFULLY REPRODUCED BLK-01: Caught PostgreSQL Error 55P04 (unsafe use of new enum value)';
  END;
ROLLBACK;

-- TEST 2: VERIFY SPLIT MIGRATION PATTERN (Clean 2-Step Transaction Execution)
DO $$
BEGIN
  RAISE NOTICE '=== Running Test 2: Simulating Split Migration (Remediation) ===';
END $$;

-- Transaction 1 (Corresponds to migration 2026111201_add_payment_enums)
BEGIN;
  CREATE TYPE "VerifiedPaymentStatus" AS ENUM ('INITIATED', 'CAPTURED', 'FAILED');
  CREATE TABLE "verified_payments" (
    id TEXT PRIMARY KEY,
    status "VerifiedPaymentStatus" NOT NULL,
    provider TEXT DEFAULT 'RAZORPAY',
    created_at TIMESTAMP DEFAULT NOW(),
    verified_at TIMESTAMP,
    verification_notes TEXT
  );
  INSERT INTO "verified_payments" (id, status, provider) VALUES ('p1', 'CAPTURED', 'RAZORPAY');

  -- Add enum value in Migration 1
  ALTER TYPE "VerifiedPaymentStatus" ADD VALUE 'VERIFIED' BEFORE 'FAILED';
COMMIT; -- Committed into PostgreSQL catalog!

-- Transaction 2 (Corresponds to migration 2026111202_apply_sovereign_payments)
BEGIN;
  -- Now 'VERIFIED' is committed and fully usable in queries and updates
  UPDATE "verified_payments"
  SET "status" = 'VERIFIED',
      "verification_notes" = 'Migrated from legacy captured payment record',
      "verified_at" = created_at
  WHERE "status"::text = 'CAPTURED';

  -- Verify row status and provenance
  DO $$
  DECLARE
    v_status "VerifiedPaymentStatus";
    v_provider TEXT;
    v_notes TEXT;
  BEGIN
    SELECT status, provider, verification_notes INTO v_status, v_provider, v_notes FROM "verified_payments" WHERE id = 'p1';
    IF v_status::text != 'VERIFIED' THEN
      RAISE EXCEPTION 'Migration failed: expected status VERIFIED, got %', v_status;
    END IF;
    IF v_provider != 'RAZORPAY' THEN
      RAISE EXCEPTION 'Provenance failure: historical provider was overwritten!';
    END IF;
    RAISE NOTICE 'SUCCESS: Split migration executed cleanly. Status: %, Provider: %, Notes: %', v_status, v_provider, v_notes;
  END $$;
COMMIT;

-- Clean up test artifacts
DROP TABLE "verified_payments";
DROP TYPE "VerifiedPaymentStatus";
DROP TABLE IF EXISTS "test_payments";
DROP TYPE IF EXISTS "TestPaymentStatus";

DO $$
BEGIN
  RAISE NOTICE '=== PostgreSQL 16 Migration Verification Completed Successfully ===';
END $$;
