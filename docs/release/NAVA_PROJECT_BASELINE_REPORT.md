# NAVA CREATIONS — PROJECT BASELINE REPORT
**Document Identifier:** `NAVA-BASELINE-2026-01`  
**Execution Timestamp:** 2026-11-14T08:53:00+05:30  
**Working Branch:** `phase-3-integrated-commerce`  
**Baseline Git HEAD:** `b12bf269328e5be9480dad6f35f723cafa3e46a7`  
**Release Target:** NAVA CREATIONS v1.0.0-rc1  
**Current Classification:** **AMBER — IN PROGRESS** (Local engineering 100% verified; awaiting owner approvals for staging/production cutover)

---

## 1. EXECUTIVE BASELINE SUMMARY

An independent technical and architectural baseline audit was conducted on the NAVA CREATIONS e-commerce platform across all workspace packages and operational configurations. 

The software platform is in a **genuinely reproducible, production-grade state**:
- **Zero Mocks in Production Code:** Real database-backed transactions for stock reservations, coupons, and orders.
- **Zero Overselling:** Enforced via conditional decrements (`availableQty: { gte: quantity }`) and database-level non-negative CHECK constraints.
- **Zero Payment Gateway Fees (₹0 MDR):** Sovereign direct BharatPe UPI QR intent generation with authoritative bank ledger matching.
- **100% Test Pass Rate:** **234 out of 234 automated tests passing** across Playwright E2E (153), Domain Unit (73), and Commerce Integrity (8).
- **Clean Compilation:** Next.js 15.1.0 compiles 38 static and dynamic routes with zero TypeScript errors.

---

## 2. REPOSITORY & INVENTORY STATE

### 2.1 Git Verification
- **Branch:** `phase-3-integrated-commerce`
- **HEAD Commit:** `b12bf269328e5be9480dad6f35f723cafa3e46a7`
- **Working Tree Delta:** 23 modified tracked files; 84 untracked files (documentation, screenshots, migration 5, and utility scripts).

### 2.2 Critical Release Inventory (Untracked Files)
To ensure a clean remote build in staging or production, the following untracked files are essential and must be staged:
1. `apps/web/app/api/cron/release-reservations/route.ts`: Scheduled 15-minute reservation cleanup handler.
2. `packages/db/prisma/migrations/2026111301_add_coupons_and_stock_constraints/`: Fifth database migration defining `coupons` table and non-negative stock constraint.
3. `.env.example`: Safe environment configuration template.
4. `scripts/`: Operational tools (`init-test-db.js`, `test-db-guard.js`, `seed-test-database.js`, `run-e2e-suite.js`, `test-phase3-commerce-integrity.js`, `test-stretch1-integrations.js`).
5. `docs/release/`: Master release documentation suite.

---

## 3. INDEPENDENT TEST & COMPILATION EVIDENCE

```
========================================================================================
                               VERIFIED EVIDENCE MATRIX
========================================================================================
Test Suite                Runner           Target / Database           Tests   Result
----------------------------------------------------------------------------------------
Playwright E2E            Chromium (v1.49) Isolated Next.js + DB       153/153 100% PASS
@nava/domain Core         Vitest (v3.2.7)  In-memory TypeScript         73/73  100% PASS
Phase 3 Concurrency       Node.js runner   PostgreSQL (nava_gateb_test)   4/4  100% PASS
Stretch 1 Integrations    Node.js runner   PostgreSQL (nava_gateb_test)   4/4  100% PASS
Monorepo Typecheck        Turbo + tsc      5 workspace packages           7/7  100% PASS
Next.js Production Build  next build       apps/web (38 routes)          38/38 100% PASS
----------------------------------------------------------------------------------------
TOTAL AUTOMATED TESTS                      All Verification Gates        234   100% PASS
========================================================================================
```

### Detailed Highlights
- **Playwright Suite (14 Specs):** Executed with clean seed resets between specs. 153 passed, 0 failed, 0 skipped. Process exit code: `0`.
- **Domain Suite (11 Files):** Money integer arithmetic, state machines, tax calculations, and Indian phone/address validators. Process exit code: `0`.
- **Commerce Concurrency:** 5 simultaneous orders for 2 items yielded exactly 2 successes, 3 clean rejections, and zero overselling. Exit code: `0`.
- **Database Migrations:** 5 migrations applied chronologically to `nava_gateb_test`; verified via direct query on `_prisma_migrations`.

---

## 4. RESOLUTION OF TECHNICAL DISCREPANCIES

### 4.1 Scheduled Reservation Cleanup Endpoint
- **Discrepancy:** Earlier documentation referred interchangeably to `/api/cron/release-expired-reservations` and `/api/cron/release-reservations`.
- **Source of Truth:** The implementation exists at `apps/web/app/api/cron/release-reservations/route.ts`.
- **Resolution:** The route `/api/cron/release-reservations` is authoritative. It supports `GET` and `POST`, validates `Authorization: Bearer <CRON_SECRET>` with constant-time equality (`crypto.timingSafeEqual`), and automatically returns held stock to `available_qty` for uncompleted checkouts after 15 minutes.

### 4.2 Database Role Least-Privilege
- Direct live SQL tests confirm:
  - `nava_migrator` owns the public schema and holds DDL privileges for running migrations.
  - `nava_app` holds DML permissions (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on application tables.
  - `nava_app` is physically **DENIED** `CREATE TABLE`, `TRUNCATE`, and access to `_prisma_migrations`.

---

## 5. UNRESOLVED GAPS & OPERATIONAL REQUIREMENTS

While the software engineering is complete and verified locally, the following operational gaps must be resolved before public launch:

1. **Owner Approvals Required:**
   - **Git Staging & Commit:** Approval to stage untracked release files into `phase-3-integrated-commerce`.
   - **Merchant UPI VPA:** Confirmation of the live commercial BharatPe VPA (e.g., `navacreations@icici`).
   - **Hosting Provider Selection:** Staging on Vercel + Neon vs. Production on Linux VPS.
   - **Customer Policy Terms:** Formal owner sign-off on returns, refunds, COD thresholds, and shipping policies.
2. **Cloud Infrastructure Provisioning:**
   - Creation of staging PostgreSQL database and application hosting instance.
   - DNS record configuration for apex domain `navacreations.in`.
3. **Simulated & Real Payment Verification:**
   - Testing end-to-end payment flow in staging.
   - Performing a single owner-supervised ₹1 live UPI test on production prior to public traffic.

---

## 6. RECOMMENDATION & ROADMAP

The platform is ready to transition from local engineering verification to **Phase 1 (Release Scope Approval)** and **Phase 7/8/9 (Staging Deployment)**. All work must follow the gated execution plan in `docs/release/NAVA_MASTER_EXECUTION_TRACKER.md`.
