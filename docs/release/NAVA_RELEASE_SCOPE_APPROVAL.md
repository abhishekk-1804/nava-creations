# NAVA CREATIONS — RELEASE SCOPE & INVENTORY APPROVAL
**Document Identifier:** `NAVA-SCOPE-APPROVAL-01`  
**Execution Timestamp:** 2026-11-14T08:54:00+05:30  
**Target Branch:** `phase-3-integrated-commerce`  
**Commit HEAD:** `b12bf269328e5be9480dad6f35f723cafa3e46a7`  
**Approval Gate:** Phase 1 Release Scope Sign-off  

---

## 1. RELEASE SCOPE INVENTORY & CATEGORIZATION

> [!CAUTION]
> This document details the proposed file set for release. In compliance with the Master Operating Rules, **no files have been staged, committed, or pushed to remote repositories**.

### 1.1 Modified Tracked Source Files (23 Files)
These files represent core domain logic, UI stabilization, and schema definitions that have been validated by 234/234 automated tests:

1. `apps/web/app/api/admin/auth/route.ts`: Admin session issuance, constant-time credentials verification, rate limiting.
2. `apps/web/app/api/admin/orders/[id]/verify-payment/route.ts`: Financial ledger verification endpoint, duplicate reference locking.
3. `apps/web/app/api/orders/[orderNumber]/route.ts`: Dual-path authorization (Admin session or HMAC SHA-256 guest token), uniform 404 IDOR mitigation.
4. `apps/web/app/cart/page.tsx`: Cart mount-time server re-validation without recursive dependency loops.
5. `apps/web/app/checkout/page.tsx`: UPI QR modal rendering, live order creation, Indian logistics validation.
6. `apps/web/app/orders/[orderNumber]/page.tsx`: Guest order status tracking, claimed UTR submission.
7. `apps/web/lib/cart-context.tsx`: Stabilized `validateCartWithServer` using `itemsRef` to prevent race conditions during item removal.
8. `apps/web/lib/proxy-trust.ts`: Trusted proxy headers IP resolution for rate limiting.
9. `apps/web/lib/inventory-reservation-service.ts`: Atomic conditional decrement (`availableQty: { gte: quantity }`), 15-minute reservation TTL.
10. `apps/web/lib/order-service.ts`: Integer paise financial calculations, guest access token HMAC generation and timing-safe verification, transactional order creation.
11. `apps/web/lib/payment-service.ts`: Sovereign BharatPe UPI QR intent generation, customer claimed UTR capture, authoritative bank ledger reconciliation.
12. `apps/web/lib/promotion-service.ts`: PostgreSQL-backed atomic coupon redemption (`$executeRaw` with `usage_count < usage_limit`), fail-closed rollback.
13. `apps/web/e2e/e2e-user-journeys.spec.ts`: Full customer shopping and admin fulfillment E2E specs.
14. `apps/web/e2e/enquiries-integration.spec.ts`: Strict null-safety checks on RegExp matches.
15. `apps/web/e2e/orders-checkout.spec.ts`: Unique claimed UTR per test run, guest HMAC token validation.
16. `apps/web/e2e/promotions-and-settings.spec.ts`: Cleaned unused imports, verified admin promotion controls.
17. `apps/web/e2e/smoke.spec.ts`: Liveness, readiness, and storefront layout probes.
18. `apps/web/next-env.d.ts`: Next.js 15 type definitions.
19. `.gitignore`: Preserves local credentials (`.env.test`, `.env.local`) and test screenshots.
20. `packages/db/prisma/schema.prisma`: Added `coupons` model, `payments` indexes, `PromotionType` enum.
21. `packages/db/prisma/migrations/0_init/migration.sql`: Canonical baseline schema migration.
22. `docs/phase-2/PHASE_2_1_ARCHITECTURE_DECISIONS.md`: Architectural decisions log.
23. `docs/phase-2/PHASE_2_ARCHITECTURE_AUDIT.md`: Architecture audit register.

### 1.2 Required Untracked Files for Release
The following files must be included in the release commit to ensure that a clean Git clone compiles and deploys correctly in staging and production:

1. **`apps/web/app/api/cron/release-reservations/route.ts`**:
   - Authoritative cron endpoint for releasing expired 15-minute inventory holds.
   - Protected by `CRON_SECRET` bearer token with constant-time equality check.
2. **`packages/db/prisma/migrations/2026111301_add_coupons_and_stock_constraints/`**:
   - Fifth database migration defining `coupons` table and non-negative stock constraint.
3. **`.env.example`**:
   - Fully sanitized environment configuration template with zero real secrets.
4. **`scripts/`**:
   - `test-db-guard.js`: Prevents test scripts from ever targeting a non-test database.
   - `init-test-db.js`: Safe isolated test database bootstrap.
   - `seed-test-database.js`: Idempotent catalog and fixture seeder.
   - `run-e2e-suite.js`: Playwright test runner with automated fixture resets.
   - `test-phase3-commerce-integrity.js`: 4-scenario concurrency suite.
   - `test-stretch1-integrations.js`: 4-scenario security and constraint suite.
5. **`docs/release/`**:
   - `NAVA_MASTER_EXECUTION_TRACKER.md`
   - `NAVA_PROJECT_BASELINE_REPORT.md`
   - `NAVA_RELEASE_READINESS_REPORT.md`
   - `NAVA_DEPLOYMENT_RUNBOOK.md`
   - `NAVA_ENVIRONMENT_VARIABLE_CHECKLIST.md`
   - `NAVA_GO_LIVE_CHECKLIST.md`
   - `NAVA_KNOWN_RISKS_AND_LIMITATIONS.md`
   - `NAVA_RELEASE_SCOPE_APPROVAL.md`

---

## 2. DATABASE MIGRATION INTEGRITY & ORDERING

Review of all 5 migrations in chronological sequence confirms:
1. `0_init`: Core e-commerce tables (users, products, variants, orders, order_items, payments, audit_logs).
2. `20261111_add_enquiries`: Dedicated `enquiries` table for bespoke bridal consultations.
3. `2026111201_add_payment_enums`: Enums for sovereign payment states.
4. `2026111202_apply_sovereign_payments`: BharatPe payment columns, UTR reference tracking.
5. `2026111301_add_coupons_and_stock_constraints`: Dedicated `coupons` table, non-negative stock CHECK constraint on `inventory_items`, and partial unique index `payments_claimed_utr_verified_unique`.

### Migration Characteristics
- **Strictly Additive:** No destructive column drops or data-loss risks.
- **Data Preservation:** Compatible with existing seed fixtures and historical order records.
- **Rollback Safeguard:** In the event of an operational anomaly, rollbacks must be performed via forward-compensating migrations, never by deleting records in `_prisma_migrations`.

---

## 3. SECURITY & SAFETY VERIFICATION

### 3.1 Environment Secret Protection
- `.env.example` contains only safe placeholder strings (e.g. `placeholder_minimum_32_character_cryptographic_secret`).
- `.env.test` and `.env.local` are explicitly excluded by `.gitignore`.
- Zero credentials, passwords, or customer personal information appear in Git status or diffs.

### 3.2 Accidental Production Connection Defense
- `scripts/test-db-guard.js` verifies that every test script enforces:
  - `NAVA_GATE_B_TEST_DB === 'true'`
  - Target host MUST be `127.0.0.1` or `localhost`
  - Target database MUST be `nava_gateb_test`
  - Role MUST be `nava_app` (runtime) and `nava_migrator` (DDL)
  - Any deviation throws `SAFETY HALT` and halts execution immediately.

---

## 4. RESOLUTION OF CRON ENDPOINT DISCREPANCY

- **Discrepancy:** Previous documentation alternately referred to `/api/cron/release-expired-reservations` and `/api/cron/release-reservations`.
- **Authoritative Endpoint:** `/api/cron/release-reservations`
- **Method:** `GET` and `POST`
- **Authorization:** `Authorization: Bearer <CRON_SECRET>` or header `x-cron-secret`
- **Action:** Releases pending inventory holds older than 15 minutes while shielding orders in `AWAITING_PAYMENT_VERIFICATION`.

---

## 5. PROPOSED GIT COMMIT STRUCTURE

When approved by the owner, the proposed release commit will be structured as:

```bash
git add apps/web/app/api/admin/auth/route.ts \
        apps/web/app/api/admin/orders/[id]/verify-payment/route.ts \
        apps/web/app/api/orders/[orderNumber]/route.ts \
        apps/web/app/cart/page.tsx \
        apps/web/app/checkout/page.tsx \
        apps/web/app/orders/[orderNumber]/page.tsx \
        apps/web/lib/cart-context.tsx \
        apps/web/lib/proxy-trust.ts \
        apps/web/lib/inventory-reservation-service.ts \
        apps/web/lib/order-service.ts \
        apps/web/lib/payment-service.ts \
        apps/web/lib/promotion-service.ts \
        apps/web/e2e/ \
        apps/web/next-env.d.ts \
        packages/db/prisma/schema.prisma \
        packages/db/prisma/migrations/ \
        .gitignore \
        .env.example \
        apps/web/app/api/cron/release-reservations/route.ts \
        scripts/ \
        docs/release/

# Commit Message Proposal:
# "feat(release): NAVA Creations v1.0.0-rc1 release baseline (Stretches 1 & 2 verified)"
```

### Sign-off Status
- **Engineering Status:** Ready for staging.
- **Owner Approval Status:** **PENDING EXPLICIT APPROVAL**. Zero commits or branch modifications have been performed.
