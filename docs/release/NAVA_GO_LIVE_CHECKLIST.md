# NAVA CREATIONS — GO-LIVE CHECKLIST
**Document Identifier:** `NAVA-GOLIVE-CHECKLIST-01`  
**Target Cutover:** Production Launch  
**Revision:** 1.0.0-rc1  

---

## 1. PRE-DEPLOYMENT PHASE (T-48 HOURS)

| # | Task Description | Target State | Classification | Sign-Off |
| :---: | :--- | :--- | :---: | :---: |
| 1.1 | **Repository Working Tree** | Stage and commit all required untracked files (`api/cron`, `migrations/2026111301...`, `.env.example`, `scripts/`). | **VERIFIED** *(Local)* | Awaiting commit approval |
| 1.2 | **Local Monorepo Build** | `pnpm typecheck` and `pnpm --filter @nava/web build` pass with exit code 0. | **VERIFIED** | Code 0 Confirmed |
| 1.3 | **Automated Test Run** | 153 Playwright E2E tests + 73 domain tests + 8 commerce integrity tests passing (100%). | **VERIFIED** | 234/234 Confirmed |
| 1.4 | **Merchant UPI VPA Registration** | Confirm active BharatPe / ICICI current account QR code for `NAVA CREATIONS`. | **REQUIRES OWNER APPROVAL** | Pending Owner VPA |
| 1.5 | **Production Database Provisioning** | Spin up cloud PostgreSQL 16 instance (Neon / Supabase / VPS). | **NOT VERIFIED** | Awaiting Cloud Setup |
| 1.6 | **Dual-Role Configuration** | Create `nava_migrator` (DDL owner) and `nava_app` (DML only) on production DB. | **NOT VERIFIED** | Awaiting Cloud Setup |

---

## 2. STAGING & ACCEPTANCE TESTING (T-24 HOURS)

| # | Task Description | Target State | Classification | Sign-Off |
| :---: | :--- | :--- | :---: | :---: |
| 2.1 | **Staging Environment Deploy** | Deploy Next.js web application to staging URL with test environment secrets. | **NOT VERIFIED** | Awaiting Staging Deploy |
| 2.2 | **Prisma Migration Execution** | Execute `prisma migrate deploy` on staging database; verify all 5 migrations. | **NOT VERIFIED** | Awaiting Staging DB |
| 2.3 | **End-to-End Customer Order** | Create live test order using UPI QR and COD; verify order in admin panel. | **NOT VERIFIED** | Awaiting Staging Run |
| 2.4 | **Manual Bank Ledger Reconciliation** | Test marking test payment `VERIFIED` and confirm duplicate UTR rejection. | **NOT VERIFIED** | Awaiting Staging Run |
| 2.5 | **Atelier Packing Slip Generation** | Verify `/admin/orders/[id]/packing-slip` printable view formatting. | **VERIFIED** *(Local)* | Awaiting Staging Run |

---

## 3. CUTOVER & DNS CONFIGURATION (T-2 HOURS)

| # | Task Description | Target State | Classification | Sign-Off |
| :---: | :--- | :--- | :---: | :---: |
| 3.1 | **Domain Name DNS Records** | Configure Apex (`navacreations.in`) and `www` CNAME pointing to host. | **REQUIRES OWNER APPROVAL** | Pending DNS Access |
| 3.2 | **Automated SSL/TLS Provisioning** | Verify Let's Encrypt / host edge TLS certificate is active and valid. | **NOT VERIFIED** | Awaiting DNS Cutover |
| 3.3 | **Production Environment Secrets** | Inject production `DATABASE_URL`, `ADMIN_AUTH_SECRET`, `MERCHANT_UPI_VPA`. | **REQUIRES OWNER APPROVAL** | Pending Secret Entry |
| 3.4 | **Production Database Migration** | Run `DIRECT_URL="<PROD_MIGRATOR>" npx prisma migrate deploy` once. | **NOT VERIFIED** | Awaiting Prod Deploy |
| 3.5 | **Initial Catalog & Admin Seeding** | Seed production categories, collections, bangle variants, and admin account. | **NOT VERIFIED** | Awaiting Prod Deploy |

---

## 4. LAUNCH EXECUTION (T-ZERO)

| # | Task Description | Target State | Classification | Sign-Off |
| :---: | :--- | :--- | :---: | :---: |
| 4.1 | **Health Probes Check** | `GET https://navacreations.in/api/health/readiness` returns HTTP 200 `connected`. | **NOT VERIFIED** | Post-Deploy Check |
| 4.2 | **Robots.txt & Sitemap** | Verify `/robots.txt` and `/sitemap.xml` are accessible to search crawlers. | **VERIFIED** *(Local)* | Post-Deploy Check |
| 4.3 | **Live Real-Money Smoke Test** | Store owner completes ₹1 or ₹10 real UPI payment test; verifies in bank app. | **REQUIRES OWNER APPROVAL** | Owner Live Verification |
| 4.4 | **Verify Payment in Admin** | Admin marks test payment `VERIFIED`; confirms order transitions to `CONFIRMED`. | **NOT VERIFIED** | Post-Deploy Check |
| 4.5 | **Scheduled Cron Activation** | Verify `/api/cron/release-reservations` triggers cleanly every 10–15 min. | **NOT VERIFIED** | Post-Deploy Check |

---

## 5. POST-LAUNCH MONITORING (T+1 TO T+24 HOURS)

| # | Task Description | Target State | Classification | Sign-Off |
| :---: | :--- | :--- | :---: | :---: |
| 5.1 | **Stock Level Audits** | Compare physical studio bangle inventory against `inventory_items` counts. | **NOT VERIFIED** | Daily Atelier Audit |
| 5.2 | **Bank Settlement Reconciliation** | Daily manual match of customer UTRs against ICICI/BharatPe credit advice. | **NOT VERIFIED** | Daily Owner Task |
| 5.3 | **Automated Daily DB Backup** | Confirm first automated `pg_dump` snapshot generated and stored safely. | **NOT VERIFIED** | Post-Launch Day 1 |
| 5.4 | **Error Rate & Performance** | Verify HTTP 500 error rate remains < 0.05% in server logs. | **NOT VERIFIED** | Ongoing Monitoring |
