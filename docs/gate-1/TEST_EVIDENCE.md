# NAVA CREATIONS — GATE 1 TEST EVIDENCE & EXECUTION REPORT
**Document Identifier:** `NAVA-TEST-GATE1-01`  
**Execution Timestamp:** November 15, 2026  
**Test Target Database:** `nava_gateb_test` on `127.0.0.1:5432` (PostgreSQL 16.16)  
**Execution Environment:** Windows 11 / Node.js v22.23.5 / pnpm 12.18.0 / Next.js 15.5.29  

---

## 1. Summary of Execution Results

All 243 automated tests across domain unit suites, commerce integrity runners, integration harnesses, and Playwright end-to-end specifications passed with a 100% success rate:

```
========================================================================================
TEST SUITE CATEGORY                               TOTAL   PASSED  FAILED  SKIPPED  STATUS
========================================================================================
1. Domain Core State Machine & Business Rules       73      73       0       0     PASS
2. Phase 3 Commerce Concurrency & Integrity          4       4       0       0     PASS
3. Stretch 1 Integration Tests                       4       4       0       0     PASS
4. Playwright End-to-End Suite (14 Specs)          162     162       0       0     PASS
----------------------------------------------------------------------------------------
TOTAL AUTOMATED TESTS                              243     243       0       0     PASS
========================================================================================
Monorepo Typecheck (`pnpm typecheck`)              7/7 packages clean (exit code: 0)
ESLint (`pnpm lint`)                               Clean, 0 warnings/errors (exit code: 0)
Next.js Production Build (`next build`)            38/38 routes compiled (exit code: 0)
Prisma Schema Validation (`prisma validate`)       Schema is valid 🚀 (exit code: 0)
Git Diff Whitespace Check (`git diff --check`)     Clean, 0 errors (exit code: 0)
========================================================================================
```

---

## 2. Playwright E2E Specification Breakdown

All specs ran against the optimized production Next.js build using `scripts/run-e2e-suite.js`:

| Specification File | Tests | Passed | Failed | Skipped | Duration | Focus Area |
|---|---|---|---|---|---|---|
| `e2e/security-remediation.spec.ts` | 24 | 24 | 0 | 0 | 1.8s | Cron auth, guest order cookies, APP_ENV bypass elimination, env validator, fail-closed guards, invalid variant rejection, stale price override. |
| `e2e/orders-checkout.spec.ts` | 12 | 12 | 0 | 0 | 2.4s | Checkout flow, BharatPe UPI instructions, UTR claim, duplicate UTR alerts, COD order placement, HttpOnly order cookies, admin fulfillment. |
| `e2e/smoke.spec.ts` | 4 | 4 | 0 | 0 | 5.7s | Platform liveness, readiness, aggregate health, and storefront homepage rendering. |
| `e2e/promotions-and-settings.spec.ts` | 10 | 10 | 0 | 0 | 3.2s | Coupon validation, minimum thresholds, categories/collections CRUD, printable packing slips, admin settings. |
| `e2e/admin-authorization.spec.ts` | 13 | 13 | 0 | 0 | 5.3s | Admin route protection, session cookie enforcement, expired/tampered token rejection, full lifecycle. |
| `e2e/e2e-user-journeys.spec.ts` | 2 | 2 | 0 | 0 | 6.9s | Complete customer discovery-to-cart journey and admin overview-to-inventory management. |
| `e2e/enquiries-integration.spec.ts` | 11 | 11 | 0 | 0 | 4.6s | WhatsApp consultation form, bot honeypot, burst rate limiting, input sanitization, admin enquiry dashboard. |
| `e2e/storefront-ui.spec.ts` | 9 | 9 | 0 | 0 | 5.7s | Visual layout, homepage, shop grid, product detail, cart drawer, contact form, admin login, mobile drawer. |
| `e2e/cart-validation.spec.ts` | 9 | 9 | 0 | 0 | 1.7s | Server-authoritative cart recalculation, price tampering override, non-existent variant rejection, sold-out removal. |
| `e2e/catalog-api.spec.ts` | 9 | 9 | 0 | 0 | 1.7s | Public catalog read endpoints and admin catalog write security boundaries. |
| `e2e/commerce-foundation.spec.ts` | 11 | 11 | 0 | 0 | 1.6s | Monetary math, order state transitions, cancellation guards, UPI QR intent generation, COD limits. |
| `e2e/inventory-concurrency.spec.ts` | 6 | 6 | 0 | 0 | 2.0s | Race conditions for final unit, expired reservation release, pre- vs post-dispatch cancellation restock. |
| `e2e/payment-integration.spec.ts` | 17 | 17 | 0 | 0 | 1.6s | Sovereign UPI payment verification, duplicate bank credit rejection, atomic rollbacks, memory rate limiting. |
| `e2e/responsive-screenshots.spec.ts` | 25 | 25 | 0 | 0 | 13.5s | Visual rendering across 5 standard viewport breakpoints (375px, 390px, 768px, 1024px, 1440px). |
| **TOTAL** | **162** | **162** | **0** | **0** | **57.7s** | |

---

## 3. Raw Execution Command Logs

### A. Domain Unit Tests
```
$ pnpm --filter @nava/domain test
 RUN  v3.2.7 D:/NAVA/packages/domain

 ✓ tests/catalog-image-storage.test.ts (4 tests)
 ✓ tests/catalog-inventory.test.ts (8 tests)
 ✓ tests/payment-state-machine.test.ts (6 tests)
 ✓ tests/order-state-machine.test.ts (8 tests)
 ✓ tests/tax-engine.test.ts (5 tests)
 ✓ tests/money.test.ts (10 tests)
 ✓ tests/reservation-state-machine.test.ts (4 tests)
 ✓ tests/catalog-pagination.test.ts (6 tests)
 ✓ tests/refund-state-machine.test.ts (7 tests)
 ✓ tests/catalog-pricing.test.ts (7 tests)
 ✓ tests/promotion-engine.test.ts (8 tests)

 Test Files  11 passed (11)
      Tests  73 passed (73)
   Duration  1.62s
```

### B. Phase 3 Commerce Integrity Tests
```
$ node scripts/test-phase3-commerce-integrity.js
[PASS] Environment Guard: Verified target DB "nava_gateb_test" on "127.0.0.1".
[PASS] Fixture created: Variant "var_test_mwgs7e99" with availableQty: 2.
[PASS] TEST 1 PASSED: Zero overselling confirmed under high-concurrency race condition.
[PASS] TEST 2 PASSED: Pending duplicate claims successfully captured and flagged for audit.
[EXPECTED ERROR] P2002 Unique constraint violation caught on duplicate verifiedTransactionId.
[PASS] TEST 3 PASSED: Duplicate verified transaction ID strictly rejected; rollback verified.
[PASS] TEST 4 PASSED: Missing payment record correctly triggered atomic rollback.
=============================================================
ALL PHASE 3 COMMERCE INTEGRITY TESTS PASSED (100%)
=============================================================
```

### C. Stretch 1 Integration Tests
```
$ node scripts/test-stretch1-integrations.js
[PASS] Environment Guard: Verified target DB "nava_gateb_test" on "127.0.0.1".
[PASS] TEST 1 PASSED: Stateless HMAC dual-path authorization verified with constant-time equality.
[PASS] TEST 2 PASSED: Persistent PostgreSQL coupon atomic increment enforces strict usage limit.
[EXPECTED ERROR] PostgreSQL check constraint violation caught: "inventory_items_non_negative_stock".
[PASS] TEST 3 PASSED: PostgreSQL CHECK constraint strictly prevents negative stock integers.
[PASS] TEST 4 PASSED: Expiry routine protects orders in AWAITING_PAYMENT_VERIFICATION from premature inventory release.
=============================================================
ALL STRETCH 1 INTEGRATION TESTS PASSED (100%)
=============================================================
```
