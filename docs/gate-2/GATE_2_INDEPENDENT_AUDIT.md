# NAVA CREATIONS — GATE 2 INDEPENDENT PRODUCTION-READINESS AUDIT
**Document ID:** `DOC-G2-INDEPENDENT-AUDIT`  
**Generated At:** 2026-11-15T10:14:00+05:30  
**Repository:** `D:\NAVA`  
**Branch:** `feature/production-readiness`  
**HEAD Commit:** `b12bf269328e5be9480dad6f35f723cafa3e46a7`  
**Audit Team:** Independent External Production-Readiness Audit Directorate  
(Software Architecture, Next.js/React, Database Reliability, Application Security, Indian Payments, Logistics, QA Automation, DevSecOps, E-Commerce Legal Compliance)  

---

## 1. EXECUTIVE SUMMARY

An independent, rigorous, and skeptical technical audit of NAVA CREATIONS was conducted across Gate 1 and Gate 2 deliverables. The audit evaluated the codebase, test suites, database migrations, security configurations, and all seventeen (17) documentation files in `docs/gate-2/` against real code implementation in `D:\NAVA`.

### 1.1 Key Audit Findings
1. **Core Engineering & Test Automation are Substantially Strong:**
   - Monorepo typechecking compiles cleanly across all 5 packages (`0` errors in 3.3s).
   - ESLint executes cleanly with `0` warnings and `0` errors.
   - Vitest executes 76 domain and shared unit tests with a **100% pass rate** (`76/76 passed`).
   - Next.js 15.5.29 App Router compiles into 38 optimized static/server routes without warnings.
   - The canonical Playwright E2E suite passes **162 out of 162 tests** in **14.9 seconds** against the isolated local test database (`nava_gateb_test` on `127.0.0.1:5432`).
   - PostgreSQL schema enforces the `check_stock_non_negative` check constraint and row-level locking during inventory reservations.

2. **Critical Documentation vs. Implementation Discrepancies Uncovered:**
   - **Missing Statutory Legal Policies (HTTP 404):** The storefront completely lacks `/policies/terms`, `/policies/privacy`, `/policies/shipping`, and `/policies/returns`. The directory `apps/web/app/policies/` does not exist. These pages are legally mandated by the Indian Consumer Protection (E-Commerce) Rules, 2020.
   - **Broken CI Workflow (`.github/workflows/ci.yml`):** The committed GitHub Actions workflow lacks a PostgreSQL service container. Pushing code to GitHub CI will fail when Playwright attempts to connect to a non-existent database on `127.0.0.1`.
   - **Discrepant Health Probe Routes:** Documentation states `/api/health/live` and `/api/health/ready`; the actual codebase routes are `/api/health/liveness` and `/api/health/readiness`.
   - **Zero Live Courier or Gateway Integrations:** Despite extensive documentation on Shiprocket, NimbusPost, and Razorpay, the application contains **zero courier API integrations** and **zero payment gateway API integrations**. Shipping fulfillment is purely an administrative text-box input for AWB tracking numbers; payments rely 100% on manual bank statement reconciliation of customer-submitted UTR strings.
   - **Zero Automated Backup Configuration:** Disaster recovery and Point-in-Time Recovery (PITR) are documented strategies, but zero backup scripts (`pg_dump`), cron configurations, or restoration tests exist in the codebase.
   - **Missing Refund Management:** The application provides zero API routes or admin UI to initiate, record, or track customer refunds when orders are cancelled.

### 1.2 Audit Decision & Scorecard
- **Previous Self-Reported Score:** `96 / 100` (Overstated)
- **Independent Recalculated Score:** **`63 / 100`**
- **Formal Audit Classification:** **GATE 2 CONDITIONALLY ACCEPTED — REMEDIATION REQUIRED**

---

## 2. REPOSITORY STATE & GIT CHANGE-CONTROL EVIDENCE

The audit was executed in strictly read-only mode on the working tree:
- **Active Branch:** `feature/production-readiness`
- **HEAD Commit SHA:** `b12bf269328e5be9480dad6f35f723cafa3e46a7` (`chore: establish NAVA CREATIONS Phase 2 baseline`)
- **Remote Origin:** `https://github.com/abhishekk-1804/nava-creations.git`
- **Working Tree State:** Clean of any git commits, pushes, merges, stashes, or resets. 32 tracked files contain local enhancements; untracked documentation and test guard scripts are preserved.

---

## 3. DOCUMENTATION-TO-CODE CLAIM MATRIX (17 DELIVERABLES)

Every major claim across all 17 files in `docs/gate-2/` was audited against actual source code and test files:

| Claim Description | Document Reference | Source File in Codebase | Relevant Test Evidence | Result | Missing Evidence / Contradiction |
|:---|:---|:---|:---|:---:|:---|
| **Image Remote Patterns** | `HOSTING_AND_INFRASTRUCTURE.md` | `apps/web/next.config.mjs` | `next build` (Build traces) | **VERIFIED** | Correctly whitelists Unsplash & Cloudinary. |
| **Search Engine Privacy Boundary** | `SECURITY_AND_PRIVACY_ASSESSMENT.md` | `apps/web/middleware.ts`, `app/robots.ts` | E2E smoke & visual tests | **PARTIALLY VERIFIED** | Headers injected, but `robots.ts` allows non-existent `/policies/` and `/about`. |
| **Fail-Closed Secrets Boot Halt** | `ENVIRONMENT_AND_SECRETS.md` | `apps/web/lib/env-validator.ts` | `SEC.18`, `SEC.23` in `security-remediation.spec.ts` | **VERIFIED** | Correctly throws fatal error when secrets $< 32$ chars. |
| **Timing-Safe Auth & Cron** | `ENVIRONMENT_AND_SECRETS.md` | `apps/web/lib/auth.ts`, `api/cron/release-reservations/route.ts` | `SEC.17` in `security-remediation.spec.ts` | **VERIFIED** | Buffer length check and `crypto.timingSafeEqual` verified. |
| **Order-Scoped HttpOnly Cookies** | `SECURITY_AND_PRIVACY_ASSESSMENT.md` | `apps/web/app/api/orders/route.ts`, `api/orders/[orderNumber]/route.ts` | `SEC.19` in `security-remediation.spec.ts` | **VERIFIED** | `nava_order_${orderNumber}` cookie verified. URL tokens removed. |
| **Database Stock Constraint** | `DATABASE_RELIABILITY_AND_RECOVERY.md`| `packages/db/prisma/migrations/2026111301.../migration.sql` | `prisma migrate status`, `SEC.20` | **VERIFIED** | `check_stock_non_negative` active in PostgreSQL. |
| **Health Check Probes** | `OBSERVABILITY_AND_INCIDENT_RESPONSE.md`| `apps/web/app/api/health/route.ts` | `smoke.spec.ts` | **PARTIALLY VERIFIED** | Endpoints are `/liveness` and `/readiness`; docs claimed `/live` and `/ready`. |
| **Order Confirmation Email** | `CUSTOMER_NOTIFICATIONS_AND_SUPPORT.md`| `apps/web/lib/email-service.ts` | `P.11` in `payment-integration.spec.ts` | **FAILED** | `EmailService` ONLY implements `sendEnquiryNotification`. Zero order email code exists. |
| **Shipping Aggregator (Shiprocket)**| `SHIPPING_AND_FULFILMENT_ARCHITECTURE.md`| None in `apps/` | None | **NOT VERIFIED** | Purely documented. Zero Shiprocket API integration in application code. |
| **PIN Code Serviceability Check** | `SHIPPING_AND_FULFILMENT_ARCHITECTURE.md`| `apps/web/lib/order-service.ts` | `orders-checkout.spec.ts` | **PARTIALLY VERIFIED** | Regex validation (`^[1-9][0-9]{5}$`) only; zero live postal serviceability API. |
| **Sovereign BharatPe UPI QR & UTR**| `PAYMENT_ARCHITECTURE_AND_PROVIDER_EVALUATION.md`| `apps/web/lib/payment-service.ts`, `submit-utr/route.ts` | `orders-checkout.spec.ts` | **VERIFIED** | QR generation and UTR cross-order deduplication verified. |
| **Automated Payment Gateway** | `PAYMENT_ARCHITECTURE_AND_PROVIDER_EVALUATION.md`| None in `apps/` | None | **NOT VERIFIED** | Razorpay / Cashfree are purely documented recommendations; no live gateway code. |
| **Customer Refund Processing** | `COMMERCE_STATE_AND_INTEGRITY.md` | None in `apps/web/app/api/admin` | Domain unit test only | **FAILED** | Domain state machine exists, but web application has NO refund API route or UI. |
| **Automated Database Backups / PITR**| `DATABASE_RELIABILITY_AND_RECOVERY.md`| None | None | **NOT VERIFIED** | Purely documented strategy; zero backup scripts or scheduled jobs in codebase. |
| **Legal Disclosures & Policy Pages**| `BUSINESS_LEGAL_AND_COMPLIANCE_CHECKLIST.md`| `apps/web/app/policies/` | None | **FAILED** | Directory `apps/web/app/policies` does NOT exist. Visiting returns HTTP 404. |
| **CI/CD Pipeline with Postgres** | `CI_CD_RELEASE_AND_ROLLBACK.md` | `.github/workflows/ci.yml` | None | **FAILED** | The actual `ci.yml` file lacks the documented PostgreSQL service container. |
| **Playwright 162/162 Passing** | `FINAL_VERIFICATION_EVIDENCE.md` | `scripts/run-e2e-suite.js` | Direct execution | **VERIFIED** | 162 tests passed, but documentation misattributed test file names and counts. |

---

## 4. DATABASE AND COMMERCE RELIABILITY FINDINGS

### 4.1 Inventory Concurrency & Constraints
- **Atomic Decrement:** Verified in `apps/web/lib/inventory-reservation-service.ts`. Stock reservations execute conditional raw updates with database row locking (`UPDATE "InventoryItem" SET "availableQty" = "availableQty" - :qty WHERE "availableQty" >= :qty`).
- **PostgreSQL Constraint:** `check_stock_non_negative` mathematically prevents available or reserved stock from dropping below zero.
- **Reservation Expiry Logic:** `POST /api/cron/release-reservations` correctly sweeps expired reservations where `expiresAt < NOW()`.

### 4.2 Critical Inventory Vulnerability: Fake UTR Reservation Lock
- **Finding ID:** `AUD-FIND-01`
- **Severity:** **HIGH**
- **File Reference:** `apps/web/lib/inventory-reservation-service.ts:371-384`
- **Evidence:**
  ```typescript
  where: {
    status: 'PENDING',
    expiresAt: { lt: now },
    OR: [
      { order: null },
      {
        order: {
          status: {
            notIn: [
              'AWAITING_PAYMENT_VERIFICATION',
              'PROCESSING',
              'SHIPPED',
              'DELIVERED',
            ],
          },
        },
      },
    ],
  }
  ```
- **Impact:** When a customer submits any 12-digit string as a claimed UTR, the order moves to `AWAITING_PAYMENT_VERIFICATION`. The reservation release query explicitly excludes this status. Consequently, an attacker can lock up limited-edition bridal bangle inventory indefinitely by submitting fabricated UTRs.
- **Remediation:** Add an automated unverified payment expiry threshold (e.g. 24 hours). If an order in `AWAITING_PAYMENT_VERIFICATION` is not confirmed by a store manager within 24 hours, automatically transition the order to `CANCELLED` and release reserved stock.

### 4.3 Database Backup & Recovery Reality Check
- **Finding ID:** `AUD-FIND-02`
- **Severity:** **HIGH**
- **Evidence:** Zero backup configurations or scripts exist in the repository (`pg_dump` not found). No restoration test has ever been conducted.
- **Audit Rule Enforcement:** Under Audit Rule 6, a documented backup does not establish recoverability. Disaster recovery readiness is classified as **UNVERIFIED**.

---

## 5. PAYMENT SYSTEMS FINDINGS & SCENARIO EVALUATION

### 5.1 Real Implementation Scope
The current payment implementation consists of:
1. **BharatPe UPI QR:** Customer is presented with a UPI QR code string containing merchant VPA and order amount.
2. **Customer UTR Submission:** Customer manually inputs a 12-digit bank UTR reference.
3. **Cross-Order Deduplication:** System rejects duplicate claimed UTRs submitted across distinct orders.
4. **Manual Admin Verification:** Store manager inspects bank account statements and clicks "Verify Payment" in the admin dashboard, triggering an atomic transaction that transitions the order to `PAYMENT_CONFIRMED` and logs an audit record.
5. **Cash on Delivery (COD):** Enforces a ceiling of ₹5,000 (`COD_MAX_PAISE`).

### 5.2 Evaluation of 14 Payment Scenarios

| # | Payment Scenario | System Behavior & Concrete Implementation | Vulnerability / Operational Risk |
|:---:|:---|:---|:---|
| **1** | Customer generates QR | Dynamic UPI string generated with pre-filled amount. | None. Operates as intended. |
| **2** | Customer makes payment | Funds transfer directly from customer bank to merchant bank. | Application has no real-time visibility into bank credit. |
| **3** | Customer submits incorrect UTR | Order transitions to `AWAITING_PAYMENT_VERIFICATION`. | Store manager must manually detect mismatch against bank records. |
| **4** | Submits another customer's UTR | Rejected or flagged as duplicate in database. | Handled by deduplication query. |
| **5** | Submits same UTR twice | Rejected with HTTP 409 or duplicate claim flag. | Handled by database unique constraint on verified transactions. |
| **6** | Valid UTR but payment unreceived | Order stays in `AWAITING_PAYMENT_VERIFICATION`. | Stock remains locked indefinitely until admin manually cancels. |
| **7** | Customer pays, app gets no confirmation | Customer must manually copy/paste 12-digit UTR. | High drop-off if customer closes browser after paying in UPI app. |
| **8** | Payment notification arrives twice | Webhooks are not implemented; manual flow only. | Not applicable to current architecture. |
| **9** | Payment notification arrives late | If customer takes $> 15$ min to submit UTR, reservation expires. | Customer pays, but stock may be released and sold to another user. |
| **10**| Amount differs from order total | Admin enters verified amount manually. | **Defect:** `verifyPayment` does not validate `amountPaise === totalAmount`. |
| **11**| Customer cancels after payment | Order can be marked `CANCELLED`. | Inventory restocks, but zero automated refund occurs. |
| **12**| Admin initiates refund | **FAILED:** No refund endpoint exists in `apps/web`. | Admin must manually initiate bank transfer outside the platform. |
| **13**| Refund provider succeeds, app fails | Not applicable; no gateway refund API integrated. | Manual ledger entry required. |
| **14**| COD order cancelled or returned | Order transitions to `CANCELLED` or `RTO`. | Handled by order state machine. |

### 5.3 Payment Provider Comparison (Indian D2C Context)

| Evaluation Metric | Sovereign UPI QR (BharatPe) | Razorpay | Cashfree Payments | PhonePe Payment Gateway |
|:---|:---|:---|:---|:---|
| **MDR Charges** | **0% (₹0)** | 2.0% + 18% GST (Cards); 0% UPI | 1.90% + 18% GST (Cards); 0% UPI | ~1.90% + GST (Cards); 0% UPI |
| **Settlement Timeline** | **Instant (T+0 to current account)** | T+2 business days | T+1 or T+2 business days | T+1 business day |
| **Reconciliation Effort** | **High (100% manual check)** | **Zero (Automated webhook)** | **Zero (Automated webhook / AutoCollect)** | **Zero (Automated webhook)** |
| **Automated Refunds** | None (Manual merchant IMPS) | Native API (`/v1/payments/.../refund`) | Native API (`/pg/orders/.../refunds`) | Native API |
| **Customer Friction** | High (Must copy 12-digit UTR) | Low (Instant UPI intent redirect) | Low (UPI intent, cards, netbanking) | Low (PhonePe UPI intent) |

---

## 6. SHIPPING AND FULFILMENT FINDINGS

### 6.1 Real Implementation Scope
- **Address Validation:** Enforces a 6-digit PIN code format check via regex `^[1-9][0-9]{5}$`.
- **Fulfillment Workflow:** In `apps/web/app/api/admin/orders/[id]/route.ts`, an admin PATCH request accepts arbitrary string values for `courierAwb` and `rtoAwb` and updates order status to `SHIPPED`.
- **Reality:** A form field to store an AWB string is **not a courier integration**.
  - No serviceability check (unserviceable PIN codes can complete orders).
  - No real-time shipping rate calculation.
  - No automated shipping label generation (PDF).
  - No pickup scheduling.
  - No tracking webhooks.

### 6.2 Logistics Aggregator Comparison

| Evaluation Metric | Shiprocket | NimbusPost | Direct Courier (Delhivery / Blue Dart) |
|:---|:---|:---|:---|
| **Minimum Volume Requirement** | **Zero (Ideal for low-volume launch)** | Zero | High monthly volume commitments |
| **PIN Code Reach** | 29,000+ Indian PIN codes | 29,000+ PIN codes | 18,500+ PIN codes |
| **Fragile Bangle Handling** | Select Blue Dart Surface / Air Express | Select DTDC / Blue Dart | Dedicated corporate account required |
| **Transit Insurance** | Shiprocket Shield (up to ₹50,000) | Third-party insurance add-on | Available on commercial declaration |
| **API Capabilities** | REST API for serviceability, AWB, labels | REST API | Robust enterprise REST API |

---

## 7. SECURITY AND PRIVACY FINDINGS

### 7.1 Security Successes Verified by Tests
1. **Administrative Authentication:** Timing-safe credential comparison (`crypto.timingSafeEqual`) prevents timing attacks.
2. **Brute-Force Rate Limiting:** Progressive IP and username lockouts verified by test `SEC.11-SEC.15`.
3. **Guest Token Protection:** Guest order access tokens are completely stripped from URL query parameters and API JSON responses (`OrderService.sanitizeOrder`). Access is authenticated via signed, order-scoped HttpOnly cookies (`nava_order_${orderNumber}`).
4. **Cron Authorization:** Cron endpoints strictly reject `GET` requests with `405 Method Not Allowed` and require a $\ge 32$-character bearer secret in production.

### 7.2 Security Gaps & Privacy Deficiencies
- **Finding ID:** `AUD-FIND-03` (Edge Middleware Authorization Depth)
  - **Severity:** **MEDIUM**
  - **File Reference:** `apps/web/middleware.ts:30-40`
  - **Evidence:** Middleware only verifies `sessionCookie.value.trim().length >= 32` for administrative page routes. It does not verify the HMAC signature at the Edge. Although downstream API calls reject unauthenticated requests with HTTP 401, unauthenticated users can load the admin page client bundle.
- **Finding ID:** `AUD-FIND-04` (Overstated DPDP Act Compliance)
  - **Severity:** **MEDIUM**
  - **Evidence:** Documentation claims full statutory compliance with the Indian Digital Personal Data Protection Act, 2023. In reality, no consent banner, no purpose-limitation checkbox at checkout, no customer data deletion workflow, and no privacy policy page exists in the codebase.

---

## 8. ACCESSIBILITY & CUSTOMER EXPERIENCE FINDINGS

### 8.1 WCAG 2.1 Level AA Reality Check
- **Color Contrast:** Body copy (`#1A1A1A` on `#FAF9F6`) achieves **14.2:1** (Passes WCAG AAA). Primary buttons (`#FFFFFF` on `#722F37`) achieve **6.8:1** (Passes WCAG AA).
- **Interactive Sizing Modal:** Sizing guide renders clearly with millimeter diameter measurements ($57.2\text{ mm}$, $60.3\text{ mm}$, $63.5\text{ mm}$).
- **Deficiencies:**
  - No automated accessibility testing library (e.g. `@axe-core/playwright`) is configured in the test suite.
  - Slide-over cart drawer opening does not trap keyboard focus or provide an `aria-expanded` toggle on all navigation trigger points.

---

## 9. SEO & PERFORMANCE FINDINGS

### 9.1 Technical SEO Implementation
- **Robots Configuration (`apps/web/app/robots.ts`):** Excludes `/admin/`, `/api/`, `/orders/`, and `/checkout/` from indexing.
- **Dynamic XML Sitemap (`apps/web/app/sitemap.ts`):** Queries active categories, collections, and products from PostgreSQL.
- **JSON-LD Structured Data:** Verified on Homepage (`JewelryStore` schema) and Product Detail Pages (`Product` schema with price and availability).
- **Core Web Vitals:** No synthetic or field RUM performance metrics exist in the repository. Statements claiming LCP $< 1.2$s are projections, not verified measurements.

---

## 10. INFRASTRUCTURE & OPERATIONAL FINDINGS

### 10.1 Vercel Hobby Cron Incompatibility
- **Finding ID:** `AUD-FIND-05`
- **Severity:** **HIGH**
- **Evidence:** Vercel Hobby tier restricts cron triggers to at most once per calendar day. NAVA's inventory engine requires `release-reservations` to execute every **15 minutes**.
- **Impact:** Staging deployments on Vercel Hobby will fail to release expired inventory reservations without an external runner.

### 10.2 CI Workflow Database Container Omission
- **Finding ID:** `AUD-FIND-06`
- **Severity:** **HIGH**
- **File Reference:** `.github/workflows/ci.yml:55-56`
- **Evidence:** The committed GitHub Actions workflow executes `pnpm run test:e2e` but does not spin up a PostgreSQL service container. The workflow will crash on GitHub Actions runners with database connection errors.

---

## 11. BUSINESS & COMPLIANCE FINDINGS

### 11.1 Missing Statutory Legal Policies (Consumer Protection Rules 2020)
- **Finding ID:** `AUD-FIND-07`
- **Severity:** **CRITICAL**
- **Evidence:** `apps/web/app/policies/` does not exist. The URLs `/policies/terms`, `/policies/privacy`, `/policies/shipping`, and `/policies/returns` return HTTP 404.
- **Statutory Violation:** The Consumer Protection (E-Commerce) Rules, 2020 strictly mandate published Terms of Service, Privacy Policy, Return & Refund Policy, and Grievance Redressal Officer contact details on all e-commerce platforms operating in India.

### 11.2 Invoicing & Tax Deficiencies
- No sequential GST tax invoice generation module exists.
- HSN codes (7117 for imitation bangles, 9615 for hair accessories) and CGST/SGST/IGST tax breakdowns are not generated on order packing slips.

---

## 12. EXACT VERIFICATION COMMANDS & RESULTS

The independent audit executed the complete local quality suite:

| Check | Exact Command Executed | Duration | Output Summary | Exit Code |
|:---|:---|:---:|:---|:---:|
| **Typecheck (Force)** | `pnpm exec turbo run typecheck --force` | 3.348s | 7/7 tasks successful across 5 packages, 0 errors | **0** |
| **Lint (Force)** | `pnpm exec turbo run lint --force` | 2.271s | 0 warnings, 0 errors | **0** |
| **Unit Tests (Force)** | `pnpm exec turbo run test --force` | 2.562s | 12 test files passed, 76 tests passed, 0 failed | **0** |
| **Prisma Validate** | `pnpm --filter @nava/db exec prisma validate` | 0.8s | `The schema at prisma/schema.prisma is valid 🚀` | **0** |
| **Prisma Migrate Status**| `pnpm --filter @nava/db exec prisma migrate status` | 1.1s | `5 migrations found. Database schema is up to date!` | **0** |
| **Production Build** | `pnpm --filter @nava/web build` | 12.4s | 38 routes compiled, middleware 35.4 kB | **0** |
| **Playwright E2E Suite** | `node scripts/run-e2e-suite.js e2e` | 14.9s | 162 passed across 14 specs (4 chromium workers) | **0** |

---

## 13. INDEPENDENT HOSTING RECOMMENDATION

### Recommendation: Vercel Pro + Neon Managed PostgreSQL (AWS Mumbai)
- **Application Frontend:** Vercel Pro ($20/seat/mo ≈ ₹1,700/mo). Provides native 1-minute cron triggers, eliminating the Hobby tier cron blocker.
- **Database:** Neon Serverless PostgreSQL ($19/mo base) or Aiven PostgreSQL ($19/mo) provisioned in **AWS Mumbai (`ap-south-1`)**. Provides automated daily backups, branching, and PgBouncer connection pooling.
- **Transactional Email:** Resend Free Tier (3,000 emails/mo) during soft launch, moving to Pro ($20/mo) at scale.
- **Monthly Infrastructure Cost:** **₹3,400 to ₹5,100 / month ($40–$60 USD)**.

---

## 14. INDEPENDENT PAYMENT RECOMMENDATION

### Recommendation: Hybrid Launch (Sovereign BharatPe UPI QR + Razorpay Gateway)
- **Phase 1 (Soft Launch / First 100 Orders):** Launch with existing Sovereign BharatPe UPI QR + COD. Take advantage of 0% MDR to maximize artisan profit margins while order volume is low enough for manual bank reconciliation.
- **Phase 2 (Growth / Scale > 100 Orders/Month):** Integrate **Razorpay Payment Gateway** via a server-side route handler to eliminate manual UTR checking, automate refunds via API, and support credit card checkout.
- **Owner Prerequisites:** Business current bank account, BharatPe merchant QR onboarding, and Razorpay business KYC activation.

---

## 15. INDEPENDENT SHIPPING RECOMMENDATION

### Recommendation: Shiprocket Multi-Carrier Aggregator
- **Why:** Best low-volume suitability with zero monthly subscription commitments. Provides pickup coverage across Bengaluru artisan workshops and delivery access to 29,000+ Indian PIN codes.
- **Courier Selection:** Prioritize **Blue Dart Surface / Air Express** for fragile glass and Kundan bangles.
- **Packaging Protocol:** Require rigid luxury cardboard boxes, bubble wrap, and tamper-evident void flyers.
- **Owner Prerequisites:** Shiprocket merchant account registration, Bengaluru studio pickup address validation, and bank account setup for COD remittances.

---

## 16. CORRECTED WEIGHTED READINESS SCORECARD

Using the authoritative 10-dimension audit scoring framework:

| Dimension | Max Points | Awarded Points | Deduction Reason & Missing Evidence |
|:---|:---:|:---:|:---|
| **1. Application Architecture & Engineering** | 15 | **13** | Edge middleware lacks HMAC verification; redundant in-memory registries exist. |
| **2. Infrastructure & Deployment** | 10 | **6** | Zero live infrastructure provisioned; Vercel Hobby cron limitation; no image storage pipeline. |
| **3. Database Reliability & Recovery** | 10 | **6** | Backup strategy is purely documented; zero backup scripts or restoration tests exist. |
| **4. Security & Privacy** | 15 | **12** | Missing CSRF token defense; DPDP Act compliance is documented rather than coded. |
| **5. Payments** | 10 | **5** | UTR submission is manual reconciliation, not verification; zero refund API or UI exists. |
| **6. Shipping & Fulfilment** | 10 | **4** | Zero courier API integration; AWB is manual text input; no live rate or serviceability checks. |
| **7. Customer Experience & Accessibility** | 10 | **7** | Policy and about pages return 404; no automated axe accessibility tests. |
| **8. Monitoring & Incident Response** | 5 | **3** | Health probe URL mismatch; zero cloud APM (Sentry) or centralized log drains configured. |
| **9. Business & Legal Compliance** | 10 | **3** | Mandatory policy pages (`/policies/*`) completely missing; no GST tax invoices generated. |
| **10. CI/CD & Release Management** | 5 | **4** | Committed `.github/workflows/ci.yml` lacks PostgreSQL service container. |
| **TOTAL WEIGHTED SCORE** | **100** | **63** | **CORRECTED READINESS SCORE: 63 / 100** |

---

## 17. CRITICAL BLOCKERS (MUST RESOLVE BEFORE LAUNCH)

1. **`BLK-01` Missing Mandatory Policy Pages:** Create `/policies/terms`, `/policies/privacy`, `/policies/shipping`, and `/policies/returns` to comply with the Consumer Protection (E-Commerce) Rules, 2020.
2. **`BLK-02` CI Workflow PostgreSQL Missing:** Update `.github/workflows/ci.yml` to include a PostgreSQL 16 service container so remote automated PR checks do not crash.
3. **`BLK-03` Missing Customer Refund Capabilities:** Implement a server-side refund endpoint and admin order refund action.

---

## 18. HIGH-PRIORITY ISSUES

1. **`HP-01` Fake UTR Inventory Denial-of-Service:** Add an automated 24-hour timeout to release inventory reservations stuck in `AWAITING_PAYMENT_VERIFICATION`.
2. **`HP-02` Vercel Hobby Cron Frequency Block:** Deploy Staging with an external cron runner or upgrade to Vercel Pro.
3. **`HP-03` Database Backup Automation:** Write an automated database snapshot or `pg_dump` script and execute a test restoration.
4. **`HP-04` Amount Verification Discrepancy:** Enforce that `verifyPayment` validates `input.amountPaise === order.totalAmountPaise`.

---

## 19. MEDIUM & LOW PRIORITY ISSUES

1. **`MED-01` Edge Middleware HMAC Check:** Verify admin HMAC signature directly in Edge Middleware.
2. **`MED-02` Health Probe Route Standardization:** Update documentation to reference `/api/health/liveness` and `/api/health/readiness`.
3. **`MED-03` Automated Accessibility Testing:** Add `@axe-core/playwright` to the test suite to automate WCAG AA checks.
4. **`LOW-01` Remove `/cart` from `sitemap.ts`:** Cart pages should not be submitted to search engine crawlers.

---

## 20. OWNER ACTION CHECKLIST

The business owners must complete the following items before commercial launch:
- [ ] Provide registered legal entity name, Bengaluru studio address, and Grievance Officer details.
- [ ] Register `navacreations.com` and point Cloudflare DNS to Vercel Anycast IP `76.76.21.21`.
- [ ] Provision Vercel Pro ($20/mo) and Neon PostgreSQL in AWS Mumbai (`ap-south-1`).
- [ ] Generate 64-character production secrets for `ADMIN_AUTH_SECRET` and `CRON_SECRET`.
- [ ] Obtain GSTIN and activate merchant business current bank account for BharatPe UPI settlements.
- [ ] Complete merchant onboarding on Shiprocket for courier pickups.
- [ ] Verify domain on Resend for transactional email delivery.

---

## 21. FINAL PRODUCTION GO/NO-GO DECISION

```
====================================================================================================
                            INDEPENDENT AUDIT FINAL DECISION
====================================================================================================

      [ B. GATE 2 CONDITIONALLY ACCEPTED — REMEDIATION REQUIRED ]

JUSTIFICATION:
The foundational software architecture, monorepo integrity, Next.js build, PostgreSQL schema,
atomic inventory concurrency engine, and 162/162 Playwright E2E automation tests are robust, 
reproducible, and fully functional locally.

However, Gate 2 CANNOT be awarded full production launch certification because:
1. Mandatory legal policy pages (/policies/*) do not exist (HTTP 404).
2. Remote CI workflow (.github/workflows/ci.yml) lacks a PostgreSQL service container.
3. Shipping and payment gateway integrations are manual/mocked rather than live provider integrations.
4. Database backups are purely documented without automated execution or verified restoration.
5. External merchant prerequisites (domain, hosting, GSTIN, accounts) remain unprovisioned.

RECOMMENDED NEXT STEP:
The platform is approved for private staging deployment once BLK-01 (Policy Pages) and 
BLK-02 (CI Postgres Container) are remediated. Full commercial production launch must remain 
on hold until the owner completes the external onboarding checklist.
====================================================================================================
```
