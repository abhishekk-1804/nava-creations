# NAVA CREATIONS — GATE 2 PRODUCTION READINESS
## Deployment Runbook, Hosting Architecture, Infrastructure Governance & Go-Live Checklist

**Document ID:** `DOC-G2-PROD-READINESS`  
**Execution Timestamp:** 2026-11-15T13:39:00+05:30  
**Repository Working Directory:** `D:\NAVA`  
**Git Branch:** `feature/production-readiness`  
**Git Commit HEAD SHA:** `b12bf269328e5be9480dad6f35f723cafa3e46a7`  
**Isolated Test Database:** `postgresql://postgres:postgres@127.0.0.1:5432/nava_gateb_test` (Enforced by [test-db-guard.js](file:///d:/NAVA/scripts/test-db-guard.js))  
**Auditor / Infrastructure Directorate:** Cloud Infrastructure Architect, Database Reliability Engineer, DevSecOps Lead

---

## 1. PRODUCTION HOSTING ARCHITECTURE

NAVA CREATIONS is designed to be hosted on high-availability, low-latency cloud infrastructure serving customers across India (primarily Mumbai, Bengaluru, Chennai, Delhi NCR, and Hyderabad).

```
 ┌─────────────────────────────────────────────────────────────┐
 │                 Cloudflare CDN / WAF / DNS                  │
 │   - Edge SSL/TLS Termination (Strict Full)                  │
 │   - DDoS Protection & Rate Limiting                         │
 │   - Static Asset Caching (Images, JS Chunks, Fonts)         │
 └──────────────────────────────┬──────────────────────────────┘
                                │ HTTPS (Port 443)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                Next.js Application Host                     │
 │   Options: Vercel (Production Edge) / AWS ECS / Railway     │
 │   - Next.js 15.5 App Router (Node.js 20 LTS Runtime)        │
 │   - Server-Authoritative Price & Inventory Validation       │
 │   - Edge Middleware for Admin RBAC & Scoped Cookies         │
 └──────────────────────────────┬──────────────────────────────┘
                                │ PostgreSQL Protocol (SSL Required)
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │               PostgreSQL Database Cluster                   │
 │   Options: Neon Serverless / Supabase / AWS RDS (ap-south-1)│
 │   - Port 6543: PgBouncer Transaction Pooler (DATABASE_URL)  │
 │   - Port 5432: Direct Session Mode for Migrations (DIRECT_URL)│
 │   - Automated Daily Backups + Point-In-Time Recovery (PITR) │
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. AUTHORITATIVE ENVIRONMENT VARIABLES CHECKLIST

Every environment variable required for production deployment is documented below, matching [env-validator.ts](file:///d:/NAVA/apps/web/lib/env-validator.ts) and [.env.example](file:///d:/NAVA/.env.example):

| Variable Name | Required in Prod? | Type / Format | Example Value (Obfuscated) | Purpose & Validation Rules |
|---|---|---|---|---|
| `NODE_ENV` | **YES** | String | `production` | Must be `production` for live builds. Activates strict security headers and disables debug logs. |
| `APP_ENV` | **YES** | String | `production` | Environment tier (`production`, `staging`, `test`). Must be `production` in live deployment. |
| `DATABASE_URL` | **YES** | URL string | `postgresql://user:pass@ep-pool.ap-south-1.neon.tech/nava_prod?sslmode=require&pgbouncer=true` | Primary PostgreSQL connection URL. Must point to PgBouncer transaction pooler in serverless environments. |
| `DIRECT_URL` | **YES** | URL string | `postgresql://user:pass@ep-direct.ap-south-1.neon.tech/nava_prod?sslmode=require` | Direct session-mode PostgreSQL URL required by Prisma CLI for running migrations and schema introspections. |
| `ADMIN_AUTH_SECRET` | **YES** | Hex / Base64 string | `c8f1e2... (64 hex chars)` | Cryptographic secret used to sign and verify admin JWT session tokens. **Enforces minimum 32 characters** at startup. |
| `CRON_SECRET` | **YES** | Hex / Base64 string | `d4e5f6... (64 hex chars)` | Bearer token required to invoke reservation cleanup cron (`/api/cron/release-reservations`). Enforces minimum 32 characters. |
| `NEXT_PUBLIC_APP_URL` | **YES** | URL string | `https://navacreations.com` | Authoritative public storefront URL. Used for absolute OpenGraph, sitemap.xml, robots.txt, and QR codes. |
| `MERCHANT_UPI_VPA` | **YES** (for UPI) | String | `navacreations@okhdfcbank` | Enterprise UPI Virtual Payment Address displayed on checkout QR code. Configured post-bank setup. |
| `MERCHANT_ONBOARDING_APPROVED` | **YES** (for UPI) | Boolean string | `true` | Explicit administrative flag enabling the UPI payment gateway on checkout. Defaults to `false`. |
| `MERCHANT_DISPLAY_NAME` | **YES** | String | `NAVA CREATIONS` | Payee display name encoded into UPI dynamic intent links and QR codes. |
| `COD_ENABLED` | Optional | Boolean string | `false` | Enables Cash on Delivery option. Defaults to `false` until owner logistics contract is signed. |
| `COD_POLICY_APPROVED` | Optional | Boolean string | `false` | Explicit sign-off flag required before COD can be activated. |
| `TRUST_PROXY` | **YES** (on CDN) | Boolean string | `true` | Must be `true` when deployed behind Cloudflare, Vercel, or AWS ALB for accurate client IP rate limiting. |
| `SUPPORT_EMAIL` | Optional | Email string | `support@navacreations.com` | Customer service contact email displayed across policies and order emails. |
| `SUPPORT_WHATSAPP` | Optional | Phone string | `+919886000000` | Customer support WhatsApp number formatted with international country code. |
| `PAYMENT_VERIFICATION_WINDOW_HOURS` | Optional | Integer string | `24` | Review window in hours before unverified UTR orders expire. Defaults to `24`. |

---

## 3. ZERO-DOWNTIME DATABASE MIGRATION RUNBOOK

### 3.1 Migration Verification
The repository contains 5 forward-only Prisma migrations in `packages/db/prisma/migrations/`:
1. `0_init`
2. `20261111_add_enquiries`
3. `2026111201_add_payment_enums`
4. `2026111202_apply_sovereign_payments`
5. `2026111301_add_coupons_and_stock_constraints`

### 3.2 Pre-Deployment Migration Execution Steps
1. **Direct Connection Check:** Ensure `DIRECT_URL` is configured pointing to the direct database port (e.g., port 5432 on Neon or Supabase) rather than the transaction pooler.
2. **Execute Forward Migrations:**
   ```bash
   pnpm --filter @nava/db exec dotenv -e .env.production -- prisma migrate deploy
   ```
3. **Validate Schema Status:**
   ```bash
   pnpm --filter @nava/db exec dotenv -e .env.production -- prisma migrate status
   ```
   *Expected Output: "Database schema is up to date!"*

---

## 4. BACKUP & DISASTER RECOVERY PROCEDURES

### 4.1 Daily Automated Backup Procedure (pg_dump)
For self-hosted or dedicated PostgreSQL instances, configure a daily cron job:
```bash
#!/bin/bash
# NAVA CREATIONS — PRODUCTION DATABASE BACKUP SCRIPT
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/nava"
BACKUP_FILE="${BACKUP_DIR}/nava_prod_${TIMESTAMP}.dump"

mkdir -p ${BACKUP_DIR}

# Execute custom-format compressed backup
pg_dump -Fc -v "${DIRECT_URL}" -f "${BACKUP_FILE}"

# Encrypt backup using GPG
gpg --symmetric --batch --passphrase-file /etc/nava/backup_passphrase "${BACKUP_FILE}"
rm -f "${BACKUP_FILE}"

# Sync encrypted backup to cold off-site storage (AWS S3)
aws s3 cp "${BACKUP_FILE}.gpg" s3://nava-backups-secure/daily/ --storage-class GLACIER_IR

# Retain local backups for 7 days
find ${BACKUP_DIR} -name "*.gpg" -mtime +7 -delete
```

### 4.2 Disaster Recovery & Point-In-Time Restore Procedure
In the event of database corruption or hardware disaster:
1. Provision target clean PostgreSQL instance.
2. Retrieve the latest encrypted snapshot from S3.
3. Decrypt snapshot:
   ```bash
   gpg --decrypt --passphrase-file /etc/nava/backup_passphrase nava_prod_YYYYMMDD.dump.gpg > restore.dump
   ```
4. Restore database with concurrency:
   ```bash
   pg_restore --clean --if-exists --no-owner --no-privileges -d "${DIRECT_URL}" -j 4 restore.dump
   ```
5. Run health probes and verify schema integrity:
   ```bash
   pnpm --filter @nava/db exec dotenv -e .env.production -- prisma migrate status
   ```

---

## 5. TELEMETRY, HEALTH CHECKS & OBSERVABILITY

The platform provides built-in HTTP health endpoints for container orchestrators (Kubernetes, AWS ECS, Docker Compose) and uptime monitors (Better Uptime, Pingdom):

| Endpoint | Method | Expected HTTP Status | Response Payload | Description |
|---|---|---|---|---|
| `/api/health` | GET | 200 OK | `{"status":"ok","timestamp":"..."}` | Aggregate platform status. |
| `/api/health/liveness` | GET | 200 OK | `{"status":"alive"}` | Validates Next.js HTTP listener is responsive. |
| `/api/health/readiness` | GET | 200 OK / 503 Service Unavailable | `{"status":"ready","database":"connected"}` | Executes `SELECT 1` on PostgreSQL. Fails if database connection drops. |

---

## 6. PRODUCTION GO-LIVE CHECKLIST & STEP-BY-STEP RUNBOOK

### Step 1: Pre-Deployment Verification (T-48 Hours)
- [ ] Confirm all owner business prerequisites are fulfilled (see [GATE_2_OWNER_ACTION_REGISTER.md](file:///d:/NAVA/docs/gate-2/GATE_2_OWNER_ACTION_REGISTER.md)).
- [ ] Verify production domain DNS points to Cloudflare nameservers.
- [ ] Generate high-entropy 64-character hex strings for `ADMIN_AUTH_SECRET` and `CRON_SECRET`.
- [ ] Provision production PostgreSQL 16 cluster with `sslmode=require`.

### Step 2: Deployment & Database Initialization (T-2 Hours)
- [ ] Run `prisma migrate deploy` against production `DIRECT_URL`.
- [ ] Verify zero pending migrations via `prisma migrate status`.
- [ ] Deploy production Next.js build (`pnpm build`).
- [ ] Verify container boots and `env-validator.ts` passes without error.

### Step 3: Admin Bootstrapping & Storefront Configuration (T-1 Hour)
- [ ] Log in to `/admin/login` using initial seeded admin account.
- [ ] Immediately change default admin password to a high-entropy passphrase.
- [ ] Visit `/admin/settings` to verify:
  - Free Shipping Threshold: ₹1,999 (or owner confirmed value).
  - Standard Shipping Fee: ₹150 (or owner confirmed value).
  - Production Studio City: Bengaluru.
  - Merchant UPI VPA: Active enterprise VPA.

### Step 4: End-to-End Live Smoke Test (T-30 Minutes)
- [ ] Place a live test order on storefront with ₹1 test variant.
- [ ] Scan UPI QR code using test bank account and transfer ₹1.
- [ ] Submit 12-digit UTR reference on customer order tracking page.
- [ ] Log into `/admin/orders`, locate the test order, and verify UTR.
- [ ] Confirm order state transitions to `PAYMENT_CONFIRMED`.
- [ ] Initiate test refund to verify refund ledger.

### Step 5: Public Cutover (T-Zero)
- [ ] Remove staging access restriction.
- [ ] Enable Cloudflare WAF protection rules.
- [ ] Open public storefront to customer traffic.

### Step 6: Emergency Rollback Procedure
If a critical production incident occurs post-launch:
1. **Immediate Maintenance Mode:** In Cloudflare or edge routing, route all storefront requests to a static maintenance page (`503 Service Temporarily Unavailable`).
2. **Revert Next.js Application:** Roll back Vercel / ECS container deployment to the previous immutable release artifact.
3. **Database Rollback:** If schema was altered, restore from pre-deployment snapshot using `pg_restore`.
4. **Post-Incident Review:** Record incident in PostgreSQL `AuditLog` table and conduct root-cause analysis before reopening traffic.
