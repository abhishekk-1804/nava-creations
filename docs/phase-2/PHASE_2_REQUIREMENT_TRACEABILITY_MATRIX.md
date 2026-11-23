# NAVA CREATIONS — PHASE 2 REQUIREMENT TRACEABILITY MATRIX (RTM)
**Project:** NAVA CREATIONS  
**Milestone:** Phase 2 Master Commerce Completion  
**Auditor:** Principal Enterprise Architect & Master Engineering Lead  
**Evaluation Standard:** Zero Unverified Claims | Code-Level Traceability  
**Repository:** `D:\NAVA`  

---

## 1. Traceability Matrix Structure

Every business, technical, and operational requirement for NAVA CREATIONS Phase 2 is tracked with its requirement ID, specification source, implementing component, verification method, and current status.

Status Classifications:
- **COMPLETE AND VERIFIED:** Implemented with passing automated tests.
- **IMPLEMENTED, NOT FULLY VERIFIED:** Implemented in code, awaiting dynamic or live engine execution.
- **PARTIALLY IMPLEMENTED:** Functioning core exists, complementary UI/API workflow in active development.
- **BLOCKED:** Awaiting local runtime or external service credentials.

---

## 2. Master Requirement Traceability Matrix

| Req ID | Requirement Area & Scope | Implementation Path | Verification Method | Status | Notes |
|---|---|---|---|:---:|---|
| **REQ-DB-01** | PostgreSQL 16 Relational Schema | `packages/db/prisma/schema.prisma` | `prisma validate`, AST audit | **COMPLETE AND VERIFIED** | 38 models, enums, relations valid. |
| **REQ-DB-02** | Sequential, Idempotent Migrations | `packages/db/prisma/migrations/` | Static DDL & transaction check | **COMPLETE AND VERIFIED** | Error 55P04 resolved by migration split. |
| **REQ-DB-03** | Provider Lockfile Standard | `packages/db/prisma/migrations/migration_lock.toml` | Prisma CLI compatibility check | **COMPLETE AND VERIFIED** | `provider = "postgresql"` configured. |
| **REQ-DB-04** | Real-Engine Database Execution | `packages/db/tests/integration/postgres-real.integration.ts` | Dynamic PostgreSQL 16 run | **BLOCKED** | Blocked on local Docker/PostgreSQL approval. |
| **REQ-CAT-01** | Integer-Paise Pricing Engine | `packages/domain/src/catalog/pricing.ts` | Vitest `catalog-pricing.test.ts` | **COMPLETE AND VERIFIED** | Zero floating-point arithmetic. |
| **REQ-CAT-02** | Variant & Stock Validation | `packages/domain/src/catalog/inventory.ts` | Vitest `catalog-inventory.test.ts` | **COMPLETE AND VERIFIED** | Handles bangle sizes (2.4, 2.6, 2.8). |
| **REQ-CAT-03** | Image Storage Abstraction | `packages/domain/src/catalog/image-storage.ts` | Vitest `catalog-image-storage.test.ts` | **COMPLETE AND VERIFIED** | Validates dimensions, MIME, size. |
| **REQ-ST-01** | Storefront Navigation & Catalogue | `apps/web/app/shop/page.tsx`, `page.tsx` | Playwright `storefront-ui.spec.ts` | **COMPLETE AND VERIFIED** | Responsive luxury Indian aesthetic. |
| **REQ-ST-02** | Server-Authoritative Cart Validation | `apps/web/app/api/cart/validate/route.ts` | Playwright `cart-validation.spec.ts` | **COMPLETE AND VERIFIED** | Client price manipulation rejected. |
| **REQ-ORD-01** | WhatsApp Concierge Ordering | `apps/web/app/cart/page.tsx`, `buildWhatsAppLink` | Playwright `commerce-foundation.spec.ts` | **COMPLETE AND VERIFIED** | Pre-fills item details and variant specs. |
| **REQ-ORD-02** | Persistent Web Checkout Workflow | `apps/web/app/checkout/page.tsx`, `/api/orders` | Integration & E2E Checkout Suite | **PARTIALLY IMPLEMENTED** | In active Phase 2 implementation. |
| **REQ-ORD-03** | Order State Machine Invariants | `packages/domain/src/order/state-machine.ts` | Vitest `order-state-machine.test.ts` | **COMPLETE AND VERIFIED** | 13 order states strictly enforced. |
| **REQ-PAY-01** | BharatPe UPI QR & Intent Generation | `apps/web/lib/payment-service.ts` | Playwright `payment-integration.spec.ts` | **COMPLETE AND VERIFIED** | Generates NPCI standard UPI URLs. |
| **REQ-PAY-02** | Customer UTR Reference Submission | `apps/web/lib/payment-service.ts` | Playwright `payment-integration.spec.ts` | **COMPLETE AND VERIFIED** | Formats UTR as claimed, non-confirmed. |
| **REQ-PAY-03** | Store Manager Payment Verification | `apps/web/lib/payment-service.ts` | Playwright `payment-integration.spec.ts` | **COMPLETE AND VERIFIED** | Matches bank credit, stores unique txn ID. |
| **REQ-PAY-04** | Cash on Delivery (COD) Rules | `apps/web/lib/payment-service.ts` | Playwright `payment-integration.spec.ts` | **COMPLETE AND VERIFIED** | Governed by owner policy flags. |
| **REQ-PAY-05** | Refund Semantics & Rollback | `packages/domain/src/payment/state-machine.ts` | Vitest `payment-state-machine.test.ts` | **COMPLETE AND VERIFIED** | Compensatory rollback transition active. |
| **REQ-INV-01** | Concurrency-Safe Stock Reservation | `apps/web/lib/inventory-reservation-service.ts` | Playwright `inventory-concurrency.spec.ts` | **COMPLETE AND VERIFIED** | Prevents overselling of final unit. |
| **REQ-INV-02** | Automated Reservation TTL Expiry | `apps/web/lib/inventory-reservation-service.ts` | Playwright `inventory-concurrency.spec.ts` | **COMPLETE AND VERIFIED** | 15-minute expiration release. |
| **REQ-ADM-01** | Single-Secret Admin HMAC Sessions | `apps/web/lib/auth.ts` | Playwright `admin-authorization.spec.ts` | **COMPLETE AND VERIFIED** | Timing-safe verification, cookie storage. |
| **REQ-ADM-02** | IP-Partitioned Rate Limiting | `apps/web/lib/rate-limiter.ts`, `auth/route.ts` | Playwright `security-remediation.spec.ts` | **COMPLETE AND VERIFIED** | BLK-02 resolved; no shared bucket lockout. |
| **REQ-ADM-03** | Admin Orders & Fulfillment UI | `apps/web/app/admin/orders/page.tsx` | Playwright Admin Orders Suite | **PARTIALLY IMPLEMENTED** | In active Phase 2 implementation. |
| **REQ-ADM-04** | Admin Customer Enquiries UI | `apps/web/app/admin/enquiries/page.tsx` | Playwright Admin Enquiries Suite | **PARTIALLY IMPLEMENTED** | In active Phase 2 implementation. |
| **REQ-ENQ-01** | Customer Enquiry Submission API | `apps/web/app/api/enquiries/route.ts` | Playwright `enquiries-integration.spec.ts` | **COMPLETE AND VERIFIED** | Honest persistence status & rate limiting. |
| **REQ-SEC-01** | Proxy Trust & Client IP Sanitization | `apps/web/lib/proxy-trust.ts` | Playwright `security-remediation.spec.ts` | **COMPLETE AND VERIFIED** | Spoofed proxy headers discarded. |
| **REQ-SEC-02** | XSS & Input Sanitization | Monorepo API routes | Playwright `enquiries-integration.spec.ts` | **COMPLETE AND VERIFIED** | Strips malicious script payloads. |
| **REQ-INF-01** | Health, Liveness & Readiness Probes | `apps/web/app/api/health/*` | Playwright `smoke.spec.ts` | **COMPLETE AND VERIFIED** | 200 alive, 503 on unconfigured DB. |
| **REQ-INF-02** | CI Quality Pipeline Gates | `.github/workflows/ci.yml` | GitHub Actions / local turbo run | **COMPLETE AND VERIFIED** | Typecheck, lint, build, test validation. |
| **REQ-REL-01** | Brand & Policy Governance | `docs/phase-2/` | Owner Approval Checklist | **IMPLEMENTED, NOT FULLY VERIFIED** | Policies drafted, pending owner signoff. |
