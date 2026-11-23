# NAVA CREATIONS — SPRINT 2J: IMPLEMENTATION PLAN
## Real Commerce Foundation, Database Integration & India-First Payment Preparation

**Date:** November 11, 2026  
**Auditing Authority:** Principal Software Architect, Application Security Engineer & E-Commerce Systems Lead  
**Repository:** `abhishekk-1804/nava-creations`  
**Execution Working Directory:** `D:\NAVA`  

---

## 1. Executive Direction & Business Mandates

Sprint 2J establishes a reliable, sovereign, database-backed commerce foundation for NAVA CREATIONS following the strict release gate verdict of Sprint 2I.3.

### Explicit Business Directives
1. **Razorpay Removal:** Razorpay is not approved and must be completely removed from future implementation plans, payment services, and tests.
2. **Zero Platform Fees / Zero MDR Policy:** No payment gateway charging percentage-based MDR or platform commission will be assumed or integrated.
3. **BharatPe Merchant QR as Primary UPI Candidate:** BharatPe merchant QR is selected as the initial candidate for zero-fee UPI collections, subject to business-owner account onboarding, fee eligibility confirmation, and verification that web-initiated customer collections comply with BharatPe terms.
4. **Manual Owner Payment Verification:** Payment verification in the initial phase will be manual and store-owner verified. The system must never trust client-reported success states or screenshot uploads. Orders remain in `AWAITING_PAYMENT_VERIFICATION` until verified by an authenticated store manager against bank settlement/UTR records.
5. **Cash on Delivery (COD) Support:** COD must be supported with separate delivery and collection tracking, reconciliation capability, and configurable delivery fees.
6. **Net Banking Deferred:** Net banking is deferred until a genuinely acceptable zero-fee direct Indian bank acquiring API is evaluated and confirmed.
7. **Free Infrastructure Only:** Strictly zero paid infrastructure plans, unapproved cloud subscriptions, or card-mandated services.

---

## 2. Workstreams Breakdown

```
SPRINT 2J WORKSTREAMS
├── WS-1: Managed PostgreSQL Evaluation & Environment Validation
├── WS-2: Commerce Data Foundation & Schema Refinement
├── WS-3: Pure Domain Order & Payment State Machines
├── WS-4: India-First Payment Service (Merchant UPI QR & COD)
├── WS-5: Admin Payment Verification Workflow & Audit Trails
├── WS-6: Automated Testing & Verification Gates
└── WS-7: Sprint Documentation & Release Readiness
```

---

## 3. Workstream Details

### Workstream 1: Managed PostgreSQL Evaluation & Validation
- **Objective:** Independently evaluate top free managed PostgreSQL options (Neon, Supabase, Render, Aiven) against 11 mandatory dimensions (ownership, legal entity, residency, storage, compute, inactivity/suspension, backups, pooling, connection limits, SSL, credit card requirements).
- **Environment Validation:** Harden environment validation for `DATABASE_URL` (pooled port 6543) and `DIRECT_URL` (direct port 5432).
- **Migration Deployment Strategy:** Prepare safe `prisma migrate deploy` scripts without resetting databases or destroying data.

### Workstream 2: Commerce Data Foundation & Schema Refinement
- **Objective:** Refine Prisma schema in `packages/db/prisma/schema.prisma` to support India-first commerce:
  - Add `AWAITING_PAYMENT_VERIFICATION` to `OrderStatus`.
  - Introduce `PaymentMethod` enum: `UPI_MERCHANT_QR`, `COD`, `NET_BANKING_DIRECT`.
  - Refactor `PaymentStatus` enum: `INITIATED`, `AWAITING_VERIFICATION`, `VERIFIED`, `PENDING_COLLECTION`, `COLLECTED`, `FAILED`, `REJECTED`, `REFUNDED`.
  - Add fields for manual UPI verification audit: `upiTransactionRef` (UTR), `verifiedByUserId`, `verifiedAt`, `verificationNotes`, `bankReference`.
  - Add fields for COD collection: `collectedAt`, `collectedBy`, `courierAwb`, `settlementBatchId`.
  - Strictly preserve integer paise representation across all models (`pricePaise`, `subtotalPaise`, `totalPaise`, `taxPaise`, `shippingPaise`, `discountPaise`). Zero floating-point arithmetic.

### Workstream 3: Pure Domain Order & Payment State Machines
- **Location:** `packages/domain/src/order/` and `packages/domain/src/payment/`
- **Order Lifecycle Progression:**
  - `PENDING_PAYMENT` → `AWAITING_PAYMENT_VERIFICATION` (Customer submits UTR)
  - `AWAITING_PAYMENT_VERIFICATION` → `PAYMENT_CONFIRMED` (Owner verifies UTR)
  - `PENDING_PAYMENT` (COD) → `PROCESSING` (Order confirmed for dispatch)
  - `PROCESSING` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`
  - Cancellation rules: Permitted only before shipping (`PENDING_PAYMENT`, `AWAITING_PAYMENT_VERIFICATION`, `PAYMENT_CONFIRMED`, `PROCESSING`).
- **Payment Lifecycle Progression:**
  - Enforce linear progression and audit tracking.

### Workstream 4: India-First Payment Service
- **Location:** `apps/web/lib/payment-service.ts`
- **Replacement:** Replace `RazorpayService` with provider-independent `PaymentService`.
- **UPI QR Payload Generator:**
  - Generates standard NPCI UPI Intent / static QR string:
    `upi://pay?pa=${vpa}&pn=${merchantName}&tr=${orderRef}&tn=NAVA-${orderRef}&am=${amountInRupees}&cu=INR`
  - Validates minimum 12-character Indian bank UTR / transaction reference.
  - Implements duplicate UTR prevention to defeat replay attacks.
- **COD Service:**
  - Validates order threshold limits and calculates delivery fees.
  - Handles pending collection states.

### Workstream 5: Admin Payment Verification Workflow & Security
- **Objective:** Provide secure back-office verification endpoints and audit trails for store managers to verify incoming UPI transactions against bank settlement sheets.
- **Security Constraints:**
  - Require valid store manager session (`verifyAdminSession`).
  - Reject duplicate UTRs across orders.
  - Capture verifying user ID, timestamp, and optional bank reference.
  - Emits structured audit log entries without leaking PII.

### Workstream 6: Comprehensive Automated Tests
- **Coverage:**
  - Pure domain unit tests for `OrderStateMachine` and `PaymentStateMachine`.
  - Product persistence and variant stock calculation tests.
  - Inventory reservation and release tests.
  - UPI QR creation and UTR submission tests.
  - Manual verification success and fraud rejection tests.
  - COD order creation and collection settlement tests.
  - Price tampering and role-based authorization tests.
- **Classification:** Strictly distinguish unit, in-memory, local server, and live database tests.

### Workstream 7: Documentation Suite
- `docs/phase-2/SPRINT_2J_IMPLEMENTATION_PLAN.md`
- `docs/phase-2/SPRINT_2J_DATABASE_REPORT.md`
- `docs/phase-2/SPRINT_2J_COMMERCE_REPORT.md`
- `docs/phase-2/SPRINT_2J_SECURITY_REPORT.md`
- `docs/phase-2/SPRINT_2J_PAYMENT_ARCHITECTURE.md`
- `docs/phase-2/SPRINT_2J_FINAL_REPORT.md`

---

## 4. Phase Schedule & Release Gates

| Step | Phase Description | Gate Condition |
|---|---|---|
| **Phase 1** | Initial repository check & evaluation | Clean diff, verified Git branch |
| **Phase 2** | Managed PostgreSQL evaluation & report | Document all 11 provider criteria |
| **Phase 3** | Domain state machines & types | Vitest 100% pass |
| **Phase 4** | Prisma schema refinement & migration diff | `prisma validate` clean |
| **Phase 5** | India-first payment service & replacement | Zero Razorpay imports |
| **Phase 6** | Test suite updates & execution | 100% test pass rate |
| **Phase 7** | Full verification & final reports | Clean build, lint, typecheck |
