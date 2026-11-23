# NAVA CREATIONS — DEPLOYMENT RUNBOOK
**Document Identifier:** `NAVA-OPS-RUNBOOK-01`  
**Target Environment:** Staging & Production Deployment  
**Revision:** 1.0.0-rc1  

---

## 1. ARCHITECTURE & FREE-FIRST HOSTING STRATEGY

NAVA CREATIONS is engineered with a **Strict Free-First Strategy (₹0 recurring platform cost)** without sacrificing operational durability or security.

### 1.1 Web Application Hosting

| Platform Option | Cost Tier | Capabilities | Free-Tier Limits & Risks | Suitability |
| :--- | :---: | :--- | :--- | :--- |
| **Option A: Vercel** *(Recommended for Staging)* | Hobby (Free) | Native Next.js 15, edge CDN, automated TLS, 1 free Cron job. | Commercial terms restriction on Hobby; 10s serverless timeout; cold starts reset in-memory state. | **Excellent for Staging / Pre-launch Validation** |
| **Option B: Oracle Cloud Always Free** *(Recommended for Prod)* | Always Free | 4 Ampere ARM cores, 24GB RAM, 200GB block volume, static public IP. | Requires Linux sysadmin knowledge; zero recurring cost forever; persistent Node.js process (zero cold starts). | **Highest Durability for Production (₹0/mo)** |
| **Option C: Render / Railway** | Free / Trial | Containerized deployment. | Render spins down after 15 min idle (50s cold start). Railway offers temporary trial credits. | Sub-optimal for production storefront |

### 1.2 Managed PostgreSQL Hosting

| Platform Option | Cost Tier | Capabilities | Free-Tier Limits & Risks | Suitability |
| :--- | :---: | :--- | :--- | :--- |
| **Option A: Neon Serverless Postgres** | Free Tier | PostgreSQL 16, pgBouncer connection pooling, 0.5GB storage. | Scales to zero after 5 min of inactivity (first cold request ~800ms). | **Ideal for Staging & Low-Traffic Prod** |
| **Option B: Supabase Postgres** | Free Tier | 500MB DB, connection pooler, 50k monthly active users. | Pauses project after 7 days of zero activity without API requests. | **Suitable with Keep-Alive Ping** |
| **Option C: Dedicated VPS PostgreSQL** | ₹0 (on Oracle/VPS) | Full PostgreSQL 16 cluster, custom roles, automated local `pg_dump`. | Requires manual OS patching and disk management. | **Full Control, Zero Pauses** |

---

## 2. STEP-BY-STEP DEPLOYMENT PROCEDURE

### 2.1 Pre-Flight Repository Preparation
1. Ensure git working tree has all required release files staged:
   ```bash
   git add apps/web/app/api/cron/release-reservations/route.ts
   git add packages/db/prisma/migrations/2026111301_add_coupons_and_stock_constraints/
   git add .env.example
   git add scripts/
   ```
2. Verify local builds and typechecks pass:
   ```bash
   pnpm typecheck
   pnpm --filter @nava/web build
   ```

### 2.2 Database Initialization & Migration Deployment
> [!IMPORTANT]
> Never run application traffic under the migration role. Schema changes must use `nava_migrator` (or direct connection), while runtime queries must use `nava_app` (or pooled connection).

1. Provision the database instance on the target host (e.g. Neon or Supabase).
2. Execute initial schema deployment using `DIRECT_URL`:
   ```bash
   cd packages/db
   DIRECT_URL="<MIGRATOR_CONNECTION_STRING>" npx prisma migrate deploy
   ```
3. Verify that all 5 migrations are applied:
   ```bash
   DIRECT_URL="<MIGRATOR_CONNECTION_STRING>" npx prisma migrate status
   ```
4. Confirm presence of constraints and partial unique index:
   ```sql
   -- Check constraint
   SELECT conname, pg_get_constraintdef(oid) 
   FROM pg_constraint 
   WHERE conname = 'inventory_items_non_negative_stock';

   -- Partial unique index
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE indexname = 'payments_claimed_utr_verified_unique';
   ```

### 2.3 Web Application Deployment (Vercel / Node.js)
1. Link repository to Vercel or target container registry.
2. Configure environment variables in the project settings (see `NAVA_ENVIRONMENT_VARIABLE_CHECKLIST.md`).
3. Set Build Command: `pnpm --filter @nava/web build`
4. Set Output Directory: `.next`
5. Deploy and verify HTTP 200 response on `/api/health/readiness`.

---

## 3. SCHEDULED CRON SETUP (INVENTORY RESERVATION RELEASE)

Uncompleted checkouts hold inventory for 15 minutes. To release expired holds without manual intervention:

### Option A: Vercel Cron (Configured in `vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/cron/release-reservations",
      "schedule": "*/15 * * * *"
    }
  ]
}
```
*Note: Vercel automatically supplies an internal authorization header for configured cron paths.*

### Option B: External Free Cron Service (cron-job.org / GitHub Actions)
Schedule a recurring HTTP GET request every 10 minutes:
- **URL:** `https://<DOMAIN>/api/cron/release-reservations`
- **Header:** `Authorization: Bearer <CRON_SECRET>`

---

## 4. DATABASE BACKUP & DISASTER RECOVERY PROTOCOL

### 4.1 Daily Automated Backup Script (`backup-db.sh`)
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/nava-postgres"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/nava_prod_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

# Dump database using pg_dump
PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h "$DB_HOST" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --format=custom \
  --no-owner \
  --no-acl \
  | gzip > "$FILENAME"

# Retain backups for 14 days, delete older
find "$BACKUP_DIR" -type f -name "nava_prod_*.sql.gz" -mtime +14 -delete
echo "[SUCCESS] Backup saved: $FILENAME"
```

### 4.2 Restoration Procedure
In the event of database corruption or hardware failure:
```bash
# 1. Create fresh database
psql -h "$DB_HOST" -U postgres -c "CREATE DATABASE nava_recovery;"

# 2. Restore schema and data
gunzip -c /var/backups/nava-postgres/nava_prod_<TIMESTAMP>.sql.gz | \
  pg_restore -h "$DB_HOST" -U postgres -d nava_recovery --no-owner --role=nava_migrator

# 3. Update application connection string in environment variables
# 4. Restart web service
```

---

## 5. APPLICATION ROLLBACK STRATEGY

### 5.1 Web Application Rollback
- **Vercel:** Instantly promote the prior successful deployment in the Vercel Deployments dashboard (< 30 seconds, zero downtime).
- **Container / VPS:** Revert git tag and restart service:
  ```bash
  git checkout <PREVIOUS_STABLE_TAG>
  pnpm build
  pm2 reload nava-web
  ```

### 5.2 Database Migration Safeguards
- All 5 existing migrations are strictly additive (adding tables, enums, check constraints, and partial unique indexes).
- Rollbacks do NOT require destructive column drops.
- If a migration must be reverted, author a forward-compensating migration rather than running `prisma migrate resolve --rolled-back`.

---

## 6. CLASSIFICATION OF OPERATIONAL ITEMS

| Item | Classification | Verification / Action Required |
| :--- | :---: | :--- |
| Next.js 15 Production Build | **VERIFIED** | 38/38 routes compiled with exit code 0 |
| Least-Privilege Database Roles | **VERIFIED** | Live SQL checks confirm `nava_app` cannot alter or drop |
| Concurrency & Payment Guards | **VERIFIED** | 8/8 commerce integrity scenarios passed |
| Managed Cloud Postgres Provisioning | **NOT VERIFIED** | Requires creating Neon/Supabase project |
| Cloud Cron Service Ping | **NOT VERIFIED** | Requires configuring external cron or `vercel.json` |
| Off-site S3 Backup Bucket | **NOT VERIFIED** | Requires owner Cloudflare R2 / AWS S3 account |
| Domain DNS Records & TLS | **REQUIRES OWNER APPROVAL** | Owner must point domain A/CNAME records |
| Production Merchant VPA Activation | **REQUIRES OWNER APPROVAL** | Owner must confirm live BharatPe VPA |
