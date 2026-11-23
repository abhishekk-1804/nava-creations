# NAVA CREATIONS — PRODUCTION GO-LIVE CHECKLIST

**Document Identifier:** `NAVA-CHECKLIST-01`  
**Revision:** 1.0.0-rc1  
**Target Cutover:** Production Launch  

---

## Pre-Launch Verification Phases

### Phase 1: Repository & Code Integrity (T-48 Hours)

- [x] **Branch Isolation:** Changes isolated on feature branch `feature/production-readiness`.
- [x] **Clean Monorepo Typecheck:** `pnpm typecheck` passed across all 7 packages (0 errors).
- [x] **Domain State Machine Tests:** `pnpm --filter @nava/domain test` passed (73/73 tests).
- [x] **Commerce Integrity Scenarios:** All 8 commerce integrity scenarios verified.
- [x] **Zero Fallback Leaks:** Strict fail-closed cart validation enforced (no sample products in production).
- [x] **Variant Sizing Safety:** Explicit variant existence validation; silent substitution eliminated.
- [x] **Admin Database Connectivity:** Admin orders query connected directly to PostgreSQL `prisma.order.findMany`.
- [x] **Cron Fail-Closed Security:** Hardcoded secret fallback eliminated; Bearer/header auth enforced with constant-time equality; query-string secrets rejected.
- [x] **Guest Order Authorization:** Predictable fallback secret eliminated; HttpOnly SameSite=Lax order-scoped cookie issued; URL query token and JSON payload token disclosure eliminated.
- [x] **Production Authentication Guard:** `APP_ENV=test` bypass eliminated from production auth and proxy-trust logic; centralized environment validator active.
- [x] **Coupon Migration & Concurrency:** Fabricated usage counts and unapproved promotional seeds removed; PostgreSQL non-negative usage limit CHECK constraint deployed.

---

### Phase 2: Database Foundation & Migrations (T-24 Hours)

- [ ] **Cloud Database Provisioning:** PostgreSQL 16 provisioned on host (Neon or VPS).
- [ ] **Dual Least-Privilege Roles:**
  - `nava_migrator` configured as schema owner.
  - `nava_app` configured with `SELECT, INSERT, UPDATE, DELETE` only.
- [ ] **Migrations Applied:** All 5 migrations deployed:
  - `0_init`
  - `20261111_add_enquiries`
  - `2026111201_add_payment_enums`
  - `2026111202_apply_sovereign_payments`
  - `2026111301_add_coupons_and_stock_constraints`
- [ ] **Schema Constraints Verified:**
  - Partial unique index on active coupon codes (`coupons_code_active_unique`).
  - Stock non-negative `CHECK` constraint on `product_variants`.
  - Atomicity of reservation release triggers.

---

### Phase 3: Infrastructure, Domain & Security (T-12 Hours)

- [ ] **Domain DNS Configuration:**
  - Apex `A` record (`navacreations.in`) pointing to production IP.
  - Subdomain `CNAME` (`www.navacreations.in`) configured.
- [ ] **SSL / TLS Certificate:** Valid automated HTTPS certificate provisioned via Let's Encrypt / Certbot.
- [ ] **Reverse Proxy Hardening:** Nginx configured with `X-Forwarded-For`, gzip compression, and security headers.
- [ ] **Environment Secrets Loaded:**
  - `ADMIN_AUTH_SECRET` generated (64 hex characters).
  - `CRON_SECRET` generated (32 hex characters).
  - `DATABASE_URL` and `DIRECT_URL` configured.
  - `TRUST_PROXY=true` set.

---

### Phase 4: Commerce & Financial Verification (T-2 Hours)

- [ ] **Merchant UPI VPA Configured:** Store owner's verified BharatPe VPA set in `MERCHANT_UPI_VPA`.
- [ ] **Merchant Display Name:** `NAVA CREATIONS` confirmed.
- [ ] **COD Policy Enforced:** Maximum threshold capped at ₹5,000; phone verification requirement active.
- [ ] **Reservation Sweeper Active:** Cron job configured to ping `/api/cron/release-reservations` every 10–15 minutes.

---

### Phase 5: Live Smoke Test & Owner Sign-Off (T-Zero)

- [ ] **Health Readiness Check:** `GET /api/health/readiness` returns HTTP 200 with database status `connected`.
- [ ] **Storefront Live Navigation:** Homepage, Shop catalogue, categories, collections load without errors.
- [ ] **Test Guest Checkout:** Real-money test order (₹1 or ₹10) placed using BharatPe UPI QR.
- [ ] **Bank Statement Match:** Verify credit appears in merchant current account app.
- [ ] **Admin Payment Verification:** Admin locates order in `/admin/orders`, enters bank UTR, confirms payment.
- [ ] **Fulfillment Packing Slip:** Admin generates printable packing slip at `/admin/orders/[id]/packing-slip`.
- [ ] **Courier Dispatch:** AWB number assigned; customer order moves to `SHIPPED`.
- [ ] **Final Sign-Off:** Business owner confirms go-live.
