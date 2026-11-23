# NAVA CREATIONS — PHASE 2 MASTER DEFECT REGISTER
**Project:** NAVA CREATIONS  
**Milestone:** Phase 2 Master Commerce Completion  
**Auditor:** Master Engineering Audit Team (Principal Architect & AppSec Lead)  
**Target Repository:** `D:\NAVA`  

---

## 1. Defect Classification Scheme

Defects are categorized by severity:
- **BLOCKER (BLK):** Prevents safe deployment, corrupts database transactions, or causes immediate runtime crashes.
- **CRITICAL / MAJOR (MAJ):** Compromises financial integrity, security isolation, or core business operations.
- **MEDIUM / MINOR (MIN):** Workflow gaps, incomplete UI views, or non-fatal integration issues.
- **LOW / NITPICK (NIT):** Redundant indexing, stylistic inconsistencies, or non-blocking performance improvements.

---

## 2. Historical & Active Defect Inventory

| Defect ID | Severity | Component | Finding & Impact Description | Root Cause | Remediation & Status |
|---|---|---|---|---|:---:|
| **BLK-01** | **BLOCKER** | Prisma Migrations (`packages/db`) | Migration `20261112_add_sovereign_payments_and_order_fsm` contained `ALTER TYPE ... ADD VALUE` followed by `UPDATE ... SET status = 'VERIFIED'` in a single transaction. Running against PostgreSQL 12–16 aborts with `ERROR: 55P04`. | PostgreSQL transactional DDL prevents using new enum values within the creating transaction. | **RESOLVED (Sprint 2M)**: Split into `2026111201_add_payment_enums` and `2026111202_apply_sovereign_payments`. Tested clean. |
| **BLK-02** | **BLOCKER** | Admin Auth (`apps/web/app/api/admin/auth`) | When single-secret form login did not supply an account name, code defaulted to shared `fallbackAccount = 'admin'`. Attacker from IP A could lock out legitimate administrator on IP B. | Unsanitized account fallback bucket in rate limiter. | **RESOLVED (Sprint 2M)**: Removed shared account fallback. Partitioned rate limits strictly by verified client IP. 15/15 security tests pass. |
| **MAJ-01** | **MAJOR** | Database Migrations (`packages/db`) | Migration SQL blindly overwrote legacy provider column with `'BHARATPE_QR'`, falsifying historical gateway audit provenance. | Hardcoded default overwrite without checking existing gateway. | **RESOLVED (Sprint 2M)**: Applied `UPDATE "payments" SET "provider" = COALESCE("gateway", 'BHARATPE_QR') WHERE "provider" IS NULL;`. |
| **MAJ-02** | **MAJOR** | Domain State Machine (`packages/domain`) | `PaymentStateMachine` lacked compensatory rollback transition `PARTIALLY_REFUNDED -> VERIFIED` if a bank refund failed. | State machine transition table was strictly unidirectional. | **RESOLVED (Sprint 2M)**: Added bidirectional compensatory transition in `PaymentStateMachine`. |
| **MAJ-03** | **MAJOR** | Rate Limiter (`apps/web/lib/rate-limiter.ts`) | Next.js development hot-reloads re-instantiated module-level Map, clearing active rate limit locks. | Module state cleared on HMR. | **RESOLVED (Sprint 2M)**: Bound memory limiter cache and instance to `globalThis`. |
| **NIT-01** | **MINOR** | Database Schema (`packages/db`) | Redundant non-unique index `payments_verified_transaction_id_idx` existed alongside `@unique` constraint. | Duplicate index declaration. | **RESOLVED (Sprint 2M)**: Removed redundant index from `schema.prisma` and migration SQL. |
| **DEF-PH2-01** | **MINOR** | Playwright E2E (`apps/web/e2e`) | Navigation assertion `toHaveURL(/\/shop/)` in `e2e-user-journeys.spec.ts` timed out when Next.js dev server compiled route on-demand. | Default 5000ms Playwright expect timeout exceeded during JIT compilation. | **RESOLVED (Sprint 2N)**: Added explicit `{ timeout: 15000 }` and URL wait assertions. 130/130 Chromium tests pass. |
| **DEF-PH2-02** | **MAJOR** | Admin Orders (`apps/web/app/admin/orders`) | `/admin/orders` rendered static hardcoded sample data (`sampleOrders`). Store manager could not view live orders, update status, add AWB, or verify payments. | Order administration APIs and UI integration were previously unbuilt. | **RESOLVED**: Built `/api/admin/orders`, `/api/admin/orders/[id]`, `/api/admin/orders/[id]/verify-payment`, and live interactive admin UI with "Verify Bank Credit" modal. |
| **DEF-PH2-03** | **MAJOR** | Commerce Flow (`apps/web/app/cart`, `/checkout`) | Cart page only supported an unpersisted WhatsApp redirect. Lacked dedicated web checkout (`/checkout`), order creation API (`/api/orders`), and customer UTR submission UI. | Web checkout workflow was previously deferred in favor of WhatsApp concierge. | **RESOLVED**: Built customer web checkout (`/checkout`), order tracking & UTR submission (`/orders/[orderNumber]`), rate-limited APIs (`/api/orders`, `/api/orders/[orderNumber]/submit-utr`), and 12/12 Playwright tests passing. |
| **DEF-PH2-04** | **MEDIUM** | Admin Enquiries (`apps/web/app/admin/enquiries`) | Store manager lacked an administrative UI and API to inspect, manage, and update customer enquiries submitted via contact/consultation modal. | Enquiry management view was not built in admin layout. | **RESOLVED**: Built `/api/admin/enquiries`, `/api/admin/enquiries/[id]`, admin navigation link, and `/admin/enquiries` triage dashboard. |
| **DEF-PH2-05** | **BLOCKER** | Host Environment (`packages/db`) | Host workstation lacks Docker, Podman, native PostgreSQL 16, and WSL. Real-engine dynamic test execution is blocked. | Host environment limitation. | **BLOCKED (HONESTLY REPORTED)** — Awaiting explicit user approval for software installation or Neon cloud database provisioning. |
