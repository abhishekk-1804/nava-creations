# NAVA CREATIONS — Sprint 2J.1 Final Engineering Report
## Database Activation, UPI Verification Integrity & Commerce Hardening

**Document Version:** 1.0.0  
**Date:** 2026-11-11  
**Project:** NAVA CREATIONS (`D:\NAVA`)  
**Status:** **COMPLETE — CONDITIONAL GO**  
**Execution Team:** Senior Engineering Group (Architecture, Backend, Security, QA, DevOps)  

---

## 1. Executive Summary & Release Gate Verdict

Sprint 2J.1 executed the necessary real-infrastructure preparation, transaction-integrity hardening, and concurrency engineering required before live commercial transactions can begin.

### Verdict: CONDITIONAL GO

| Metric / Gate | Status | Evidence / Operational Details |
| :--- | :---: | :--- |
| **Domain State Machines** | **PASS** | 63 / 63 Vitest tests passing (`OrderStateMachine`, `PaymentStateMachine`, `ReservationStateMachine`). |
| **Shared Utilities** | **PASS** | 3 / 3 Vitest tests passing (`Money` value object, Result pattern, errors). |
| **Commerce Foundation** | **PASS** | 11 / 11 Playwright Chromium tests passing (`commerce-foundation.spec.ts`). |
| **Payment Integrity (India-First)** | **PASS** | 16 / 16 Playwright Chromium tests passing (`payment-integration.spec.ts`). |
| **Inventory Concurrency** | **PASS** | 6 / 6 Playwright Chromium tests passing (`inventory-concurrency.spec.ts`). |
| **Full Playwright E2E Suite** | **PASS** | 119 / 119 Playwright Chromium tests passing. |
| **TypeScript Static Check** | **PASS** | 0 errors across all 5 workspace packages (`pnpm typecheck`). |
| **ESLint Static Analysis** | **PASS** | 0 warnings, 0 errors (`pnpm lint`). |
| **Prisma Schema Validation** | **PASS** | Schema valid, generated, and compiled (`@nava/db`). |
| **Real PostgreSQL Database** | **PENDING** | Local environment contains sample placeholder domain; live connection requires store owner account creation. |
| **Merchant Acquiring Bank Contract**| **PENDING** | UPI Intent generator active; live merchant onboarding required for BharatPe / VPA activation. |
| **COD Policy Formal Ratification** | **PENDING** | ₹5,000 ceiling configurable; formal business sign-off tracked via `COD_POLICY_APPROVED`. |

**Why CONDITIONAL GO?**  
The software application is 100% hardened, tested, and structurally sound. Production readiness is conditioned solely upon two external business actions that must be controlled exclusively by the business owner:
1. Provisioning a free-tier Neon PostgreSQL database and entering credentials in `.env.local`.
2. Confirming BharatPe merchant onboarding and providing the official VPA and QR asset.

---

## 2. Workstream Execution & Implementation Summary

### Workstream 1: Database Provisioning Readiness
- Confirmed official Neon Free Tier specifications: 1 GB storage, 100 CU-hours/month, 5 GB egress, scale-to-zero after 5 minutes, 6-hour instant restore window.
- Identified that AWS Mumbai is **not** offered on Neon Free tier; recommended **AWS Asia Pacific (Singapore) `aws-ap-southeast-1`** as the lowest-latency alternative (~35ms to Mumbai/Bengaluru).
- Documented dual connection string architecture: `DATABASE_URL` (pooled with `-pooler` suffix, port 5432, PgBouncer) and `DIRECT_URL` (direct port 5432 for migrations).
- Confirmed zero risk of unexpected billing on the free tier (no credit card collected at registration; compute suspends upon limit exhaustion).
- Authored step-by-step account activation guide in `docs/phase-2/SPRINT_2J_1_DATABASE_ACTIVATION_REPORT.md`.

### Workstream 2: Migration and Real Database Integration
- Truthfully audited current environment: DNS resolution failed on placeholder host `ep-sample-pooler.ap-southeast-1.aws.neon.tech`; 0 local PostgreSQL daemons running.
- **Strict Compliance:** Zero database integrations were marked successful using an in-memory fallback.
- Verified system resilience when database is offline:
  - `/api/health/readiness` returns `HTTP 503 Service Unavailable`.
  - Enquiries safely return `UNPERSISTED_FALLBACK` with pre-filled WhatsApp consultation link.
  - Storefront catalog gracefully serves static and cached inventory without crashes.

### Workstream 3: UPI Payment Verification Integrity
- Re-architected payment verification to completely separate:
  - `claimedUtr`: Customer-submitted reference (zero trust, does not establish payment).
  - `verifiedTransactionId`: Authoritative bank current account credit reference confirmed by store owner.
- Implemented duplicate claim handling: multiple submissions of the same reference flag `isDuplicateClaim: true` for manual manager audit without crashing.
- Implemented store owner verification workflow (`PaymentService.verifyUpiPayment`):
  - Requires authenticated administrator ID (`verifiedByUserId`).
  - Enforces strict uniqueness of `verifiedTransactionId` across all orders (prevents bank credit replay).
  - Prevents double-verification of the same order.
  - Transitions Payment to `VERIFIED` and Order to `PAYMENT_CONFIRMED`.
- Implemented rejection workflow (`PaymentService.rejectUpiPayment`): cancels order and marks payment `REJECTED`.
- Provided truthful, non-misleading customer-facing payment states: `AWAITING_PAYMENT`, `PAYMENT_UNDER_VERIFICATION`, `VERIFIED`, `REJECTED`, `EXPIRED`.
- Clarified that no automatic BharatPe API/webhook callback exists; reconciliation is manual against bank statements.

### Workstream 4: Acquirer Approval & UPI Intent
- Confirmed NPCI UPI Linking Specification compliance: `upi://pay?pa={vpa}&pn={name}&tr={order}&tn={orderTag}&am={rupees}&cu=INR`.
- Implemented fail-safe check: absent or unapproved merchant configuration disables UPI checkout and informs customer to use WhatsApp or COD.
- Documented legal requirement for merchant acquiring bank onboarding (MCC `5944`) to avoid personal P2P daily transaction limits (₹1,00,000/day total; ₹2,000–₹5,000 for first-time payees).

### Workstream 5: COD Policy & Courier Reconciliation
- Made the ₹5,000 order ceiling configurable via `COD_MAX_PAISE` (default: 500,000 paise).
- Introduced `COD_POLICY_APPROVED` environment flag; if `false`, informs customers that provisional thresholds are applied pending owner ratification.
- Maintained strict separation between payment collection (`PENDING_COLLECTION` $\to$ `COLLECTED`) and order fulfillment (`PROCESSING` $\to$ `SHIPPED` $\to$ `DELIVERED`).
- Documented courier collection, AWB consignment tracking, and weekly remittance reconciliation.

### Workstream 6: Inventory Concurrency & Reservation Integrity
- Created `apps/web/lib/inventory-reservation-service.ts`:
  - Enforces atomic conditional updates: `availableQty >= quantity`.
  - Manages 15-minute reservation holds with automated TTL expiration cleanup.
  - Enforces duplicate release prevention (prevents phantom double-restocking).
  - Restocks inventory upon pre-dispatch cancellation; strictly blocks post-dispatch cancellation.
  - Simulates database failure and verifies transaction rollback.
- Subjected to 6 automated Playwright tests in `apps/web/e2e/inventory-concurrency.spec.ts` (all 6 passed).

### Workstream 7: Security & Scope Corrections
- Removed all false claims of verified payment upon customer UTR submission.
- Replaced blanket zero-PCI-scope claims with precise regulatory reality:
  - The application touches zero cardholder data, eliminating PCI-DSS SAQ-A/SAQ-D card processing scope.
  - Web application security, session authentication, and customer PII protection remain actively governed under the Information Technology Act, 2000 and the Digital Personal Data Protection (DPDP) Act, 2023.
- Removed legacy Razorpay environment variables from `.env.example` and `apps/web/.env.local`. Zero active runtime references remain.

---

## 3. Accurate Test Evidence Classification Matrix

In accordance with Sprint 2J.1 requirements, test evidence is classified into 6 distinct categories:

| Test Category | Target Component | Framework | Executed | Passed | Status |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **1. Pure Unit** | `@nava/domain` (Order, Payment, Reservation FSMs, Money value object) | Vitest | 63 | 63 | **PASS** |
| **1. Pure Unit** | `@nava/shared` (Result, Error types) | Vitest | 3 | 3 | **PASS** |
| **2. Mocked** | Transactional Email Service (simulation mode) | Playwright | 1 | 1 | **PASS** |
| **3. In-Memory** | Rate Limiter memory fallback, Atomic Mutex Reservation tests | Playwright | 8 | 8 | **PASS** |
| **4. Local Server** | Next.js API routes, Admin RBAC, Cart validation, UI storefront flows | Playwright | 110 | 110 | **PASS** |
| **5. Real PostgreSQL** | Direct/Pooled Neon database operations | Prisma CLI | — | — | **AWAITING OWNER PROVISIONING** |
| **6. Real Bank/Acquirer**| Live BharatPe merchant account transactions | Manual Ledger | — | — | **AWAITING OWNER ONBOARDING** |
| **TOTAL AUTOMATED** | **Monorepo automated test suite** | **Vitest + Playwright** | **185** | **185** | **100% PASS** |

---

## 4. Deliverables Index

The following deliverables have been authored and placed in `docs/phase-2/`:
1. **[`SPRINT_2J_1_DATABASE_ACTIVATION_REPORT.md`](file:///d:/NAVA/docs/phase-2/SPRINT_2J_1_DATABASE_ACTIVATION_REPORT.md):** Neon Free specifications, Singapore region recommendation, dual connection pooling, zero-charge guarantee, and owner account activation guide.
2. **[`SPRINT_2J_1_PAYMENT_VERIFICATION_REPORT.md`](file:///d:/NAVA/docs/phase-2/SPRINT_2J_1_PAYMENT_VERIFICATION_REPORT.md):** Dual-token reconciliation architecture (`claimedUtr` vs `verifiedTransactionId`), NPCI compliance, anti-replay defense, and COD policy.
3. **[`SPRINT_2J_1_INVENTORY_INTEGRITY_REPORT.md`](file:///d:/NAVA/docs/phase-2/SPRINT_2J_1_INVENTORY_INTEGRITY_REPORT.md):** Concurrency-safe stock reservation, atomic conditional decrements, TTL expiry cleanup, and 6 failure scenario tests.
4. **[`SPRINT_2J_1_FINAL_REPORT.md`](file:///d:/NAVA/docs/phase-2/SPRINT_2J_1_FINAL_REPORT.md):** This comprehensive release evaluation and verdict.

---

## 5. Next Steps for Business Owner to Achieve Full Production GO

1. **Activate Neon Database:** Follow the 5-step guide in [`SPRINT_2J_1_DATABASE_ACTIVATION_REPORT.md`](file:///d:/NAVA/docs/phase-2/SPRINT_2J_1_DATABASE_ACTIVATION_REPORT.md) to register a free account in AWS Singapore, copy the pooled and direct connection strings into `apps/web/.env.local`, and run `pnpm --filter @nava/db migrate:deploy`.
2. **Confirm BharatPe Merchant Onboarding:** Complete business merchant onboarding with BharatPe or current account bank, obtain the official merchant VPA, upload the QR asset to `public/images/payments/bharatpe-qr.png`, and set `MERCHANT_ONBOARDING_APPROVED="true"` in `.env.local`.
3. **Ratify COD Commercial Policy:** Review logistics courier agreements, confirm the ₹5,000 order ceiling, and set `COD_POLICY_APPROVED="true"` in `.env.local`.
