# NAVA CREATIONS — PRODUCTION & STAGING DEPLOYMENT RUNBOOK

**Target Application:** NAVA CREATIONS E-Commerce Platform  
**Architecture:** Next.js 15 App Router, TypeScript, Tailwind CSS, PostgreSQL 16, Prisma ORM  
**Hosting Strategy:** Strict Free-First Strategy (₹0 recurring platform cost)  
**Document Revision:** 1.0.0-rc1  

---

## 1. Hosting Architecture & Free-First Strategy

### 1.1 Web Application Hosting

| Platform Option | Tier | Cost | Suitability & Operational Notes |
| :--- | :--- | :--- | :--- |
| **Oracle Cloud Always Free VPS** | Compute VM (Ampere A1) | ₹0/month | **Recommended for Production.** 4 OCPU cores, 24 GB RAM, 200 GB block storage, static IPv4. Runs persistent Node.js/PM2 or Docker with zero cold starts. **Important:** Requires minimum resource utilization (or Pay-As-You-Go upgrade with ₹0 usage) to prevent Oracle idle-instance reclamation. |
| **Vercel** | Hobby | ₹0/month | **Recommended for Staging / Pre-launch Only.** Vercel Hobby is restricted to non-commercial use by Vercel Terms of Service. Cron frequency on Hobby is limited to once daily (production reservation cleanup requires 10–15 min intervals). Use only for temporary validation, not commercial production. |
| **Render / Railway** | Free / Trial | ₹0 / Limited | Render spins down after 15 minutes of inactivity (50s cold start). Railway offers trial credits. Not recommended for live bridal e-commerce storefront. |

### 1.2 Database Hosting (PostgreSQL 16)

| Provider | Plan | Cost | Operational Notes |
| :--- | :--- | :--- | :--- |
| **Neon Serverless Postgres** | Free Tier | ₹0/month | 0.5 GB storage, compute auto-suspends after 5 min of inactivity (first cold connection ~800ms). Perfect for Staging and initial production ramp-up. pgBouncer connection pooling supported. |
| **Self-Hosted PostgreSQL on Oracle VPS** | Always Free | ₹0/month | Full PostgreSQL 16 cluster, zero auto-suspension, automated local `pg_dump` backups to block volume. Requires sysadmin maintenance. |

---

## 2. Prerequisites & Environment Setup

1. **System Requirements:**
   - Node.js `v22.x` or `v20.x` LTS
   - `pnpm` (v9 or v10)
   - PostgreSQL 16 with SSL enabled
2. **Access & Credentials Required:**
   - Git repository access (`D:\NAVA`)
   - Production PostgreSQL connection strings:
     - `DATABASE_URL`: Runtime connection using least-privilege `nava_app` role
     - `DIRECT_URL`: Migration connection using `nava_migrator` role
   - Sovereign BharatPe UPI Merchant VPA (`MERCHANT_UPI_VPA`)
   - Cryptographically random 64-character hex secrets for `ADMIN_AUTH_SECRET` and `CRON_SECRET`

---

## 3. Step-by-Step Deployment Guide

### Step 3.1: Build & Verification

```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Generate Prisma Client
pnpm --filter @nava/db generate

# 3. Build database package
pnpm --filter @nava/db build

# 4. Monorepo typecheck
pnpm typecheck

# 5. Build Next.js web application
pnpm --filter @nava/web build
```

### Step 3.2: Database Migration Deployment

```bash
# Apply reviewed migrations using direct migrator connection
cd packages/db
DIRECT_URL="<MIGRATOR_CONNECTION_STRING>" npx prisma migrate deploy

# Verify migration status
DIRECT_URL="<MIGRATOR_CONNECTION_STRING>" npx prisma migrate status
```

All 5 migrations must report deployed:
1. `0_init`
2. `20261111_add_enquiries`
3. `2026111201_add_payment_enums`
4. `2026111202_apply_sovereign_payments`
5. `2026111301_add_coupons_and_stock_constraints`

### Step 3.3: Seed Initial Production Data

```bash
# Seed standard categories, collections, and catalog items
node scripts/seed-local-database.js
```

### Step 3.4: Production Process Management (PM2 on Linux VPS)

```bash
# Install PM2 globally
npm install -g pm2

# Start Next.js standalone server
cd apps/web
pm2 start npm --name "nava-storefront" -- start -- -p 3000

# Save PM2 process list for auto-restart on boot
pm2 save
pm2 startup
```

### Step 3.5: Nginx Reverse Proxy & SSL Configuration

```nginx
server {
    server_name navacreations.in www.navacreations.in;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Obtain free Let's Encrypt SSL certificate
sudo certbot --nginx -d navacreations.in -d www.navacreations.in
```

### Step 3.6: Scheduled Reservation Cleanup (Cron)

Set up a Linux system cron job to purge expired 15-minute inventory reservations.
**Security Notice:** The endpoint enforces fail-closed authentication and requires a strong `CRON_SECRET` ($\ge 16$ characters). Query-string secrets (`?secret=...`) are strictly rejected to prevent secret leakage in access logs and proxies. Only `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret` headers are accepted with constant-time verification.

```bash
# Open crontab
crontab -e

# Run every 10 minutes
*/10 * * * * curl -s -X POST https://navacreations.in/api/cron/release-reservations -H "Authorization: Bearer <CRON_SECRET>" > /dev/null 2>&1
```

---

## 4. Rollback & Disaster Recovery Procedures

1. **Application Rollback:**
   ```bash
   git checkout <PREVIOUS_STABLE_COMMIT>
   pnpm install --frozen-lockfile
   pnpm --filter @nava/web build
   pm2 restart nava-storefront
   ```
2. **Database Backup & Recovery:**
   ```bash
   # Automated backup command
   pg_dump -Fc -U nava_migrator -d nava_production > /backups/nava_$(date +%Y%m%d_%H%M%S).dump

   # Restore command
   pg_restore -U nava_migrator -d nava_production --clean --if-exists /backups/nava_<TIMESTAMP>.dump
   ```

---

## 5. Verification Probes

- **Liveness & DB Readiness:** `GET https://navacreations.in/api/health/readiness` (Must return HTTP 200 with `{ "status": "connected" }`)
- **Storefront Home:** `GET https://navacreations.in/` (HTTP 200)
- **Catalogue:** `GET https://navacreations.in/shop` (HTTP 200)
- **Robots & Sitemap:** `GET https://navacreations.in/robots.txt` & `GET https://navacreations.in/sitemap.xml`
