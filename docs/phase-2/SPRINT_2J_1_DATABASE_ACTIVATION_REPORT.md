# NAVA CREATIONS — Sprint 2J.1 Database Activation Report
## PostgreSQL Integration Readiness, Neon Free Specifications & Failure Recovery

**Document Version:** 1.0.0  
**Date:** 2026-11-11  
**Project:** NAVA CREATIONS (`D:\NAVA`)  
**Scope:** PostgreSQL Provisioning Readiness, Free Tier Constraints, Prisma Schema Verification, and Graceful Offline Degradation  

---

## 1. Executive Summary

Sprint 2J.1 audited the database infrastructure readiness for NAVA CREATIONS. 

**Key Findings:**
1. **Live Infrastructure Status:** Real managed PostgreSQL credentials have **not yet been provisioned** by the business owner. The local environment contains placeholder connection strings pointing to an unresolvable domain (`ep-sample-pooler.ap-southeast-1.aws.neon.tech`). No local PostgreSQL daemon is running.
2. **Honesty Guarantee:** In strict adherence to the sprint instructions, **no database integration is marked successful using an in-memory fallback**. The application correctly identifies the database as offline and gracefully handles downtime.
3. **Neon Free Tier Confirmed:** Verified the current official Neon Free tier specifications, resource boundaries, region availability, and charge prevention rules.
4. **Resilience Verification:** Confirmed that the application's health readiness probe (`/api/health/readiness`) returns HTTP 503 (`database: unavailable`), catalog browsing gracefully falls back to cached data, and customer enquiries/orders trigger structured offline consultation via WhatsApp.

---

## 2. Official Neon Free Tier Verification & Technical Limits

The official Neon (`neon.tech`) documentation was audited to confirm limits for the Free Tier ($0/month, no credit card required):

| Dimension | Neon Free Tier Specification | NAVA CREATIONS Impact / Architectural Strategy |
| :--- | :--- | :--- |
| **Monetary Cost** | **$0.00 / month** (Strictly free) | No credit card required at registration. Zero risk of unexpected charges. |
| **PostgreSQL Storage** | **1 GB** per project (20 GB account cap across projects) | Highly sufficient for NAVA CREATIONS. Accommodates ~50,000 product variants, 100,000 customer orders, and audit history. |
| **Compute Allowance** | **100 Compute Unit (CU) hours** per project per month | 1 CU $\approx$ 1 vCPU + 4 GB RAM. Adequate for development, staging, and boutique traffic. |
| **Autoscaling & Suspension** | **Scale-to-Zero after 5 minutes of inactivity** | Neon automatically pauses compute endpoints when idle. Resumes automatically on incoming queries in ~500ms. |
| **Network Egress** | **5 GB** public egress per project per month | Sufficient for text-based JSON API payloads. All product imagery is offloaded to CDN/external storage. |
| **Point-in-Time Recovery (PITR)**| **Up to 6 hours** (capped at 1 GB data change delta) | Free tier instant rollback window is 6 hours. Long-term backups require automated daily `pg_dump` logical exports. |
| **Monitoring History** | **1 day** metrics retention | Basic latency and active connection monitoring. |
| **Available AWS Regions** | • `aws-us-east-1` (N. Virginia)<br>• `aws-us-east-2` (Ohio)<br>• `aws-us-west-2` (Oregon)<br>• `aws-eu-central-1` (Frankfurt)<br>• `aws-eu-west-2` (London)<br>• `aws-ap-southeast-1` (Singapore)<br>• `aws-ap-southeast-2` (Sydney)<br>• `aws-sa-east-1` (São Paulo) | **Critical Finding:** AWS Mumbai (`ap-south-1`) is **NOT** available on Neon Free tier. **`aws-ap-southeast-1` (Singapore)** is the closest available region to India (~30–40ms latency to Mumbai/Bengaluru). |
| **Unexpected Charges** | **Impossible on Free Tier** | Neon does not collect billing information for free accounts. When 100 CU-hours or 1 GB storage is reached, compute endpoints suspend; no billing occurs. |

---

## 3. Dual Connection String Architecture (Prisma & PgBouncer)

Because Next.js deployed on Vercel or Node.js serverless functions creates dynamic transient connections, direct database connections quickly exhaust PostgreSQL's connection pool.

NAVA CREATIONS configures dual connection endpoints in `packages/db/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

### Connection Roles:
1. **`DATABASE_URL` (Connection-Pooled Runtime):**
   - **Host Suffix:** `-pooler` (e.g., `ep-quiet-grass-123456-pooler.ap-southeast-1.aws.neon.tech`)
   - **Port:** `5432`
   - **Parameters:** `?sslmode=require&pgbouncer=true`
   - **Purpose:** Used by Prisma Client inside Next.js API routes. Handles up to 10,000 pooled client connections efficiently via PgBouncer transaction pooling.
2. **`DIRECT_URL` (Direct Connection):**
   - **Host:** Direct endpoint without `-pooler` (e.g., `ep-quiet-grass-123456.ap-southeast-1.aws.neon.tech`)
   - **Port:** `5432`
   - **Parameters:** `?sslmode=require`
   - **Purpose:** Used exclusively by Prisma CLI for migrations (`pnpm prisma migrate deploy`) and schema introspection (`db pull`). PgBouncer transaction mode prohibits prepared statements and advisory locks needed by schema migrations; `DIRECT_URL` bypasses PgBouncer directly to the PostgreSQL engine.

---

## 4. Step-by-Step Database Account Activation Guide for Store Owner

To ensure sovereign business control and zero secret exposure in chat, the store owner must create and control the database account:

1. **Sign Up:** Navigate to [neon.tech](https://neon.tech) and sign up using the official NAVA CREATIONS business Google account or GitHub account.
2. **Create Project:**
   - **Project Name:** `nava-creations-dev`
   - **Postgres Version:** `16` (Default)
   - **Region:** Select **`Asia Pacific (Singapore) - aws-ap-southeast-1`** (lowest latency to India).
3. **Retrieve Connection Strings:**
   - On the Neon Dashboard, locate the **Connection Details** widget.
   - Select **Prisma** from the framework dropdown.
   - Copy the `DATABASE_URL` (pooled connection string).
   - Toggle to **Direct connection** and copy the `DIRECT_URL`.
4. **Configure Local Environment:**
   - Open `apps/web/.env.local` on your local development machine.
   - Paste the copied connection strings:
     ```bash
     DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
     DIRECT_URL="postgresql://[user]:[password]@[endpoint].ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
     ```
   - **Do not commit `.env.local` to Git.** (It is already protected in `.gitignore`).
5. **Deploy Migrations:**
   Run the migration deploy command from repository root:
   ```bash
   pnpm --filter @nava/db migrate:deploy
   ```

---

## 5. Offline Recovery & Degradation Verification

Actual connectivity was tested on the workspace environment:
- **DNS Resolution:** Host `ep-sample-pooler.ap-southeast-1.aws.neon.tech` failed resolution (unresolvable sample domain).
- **Local Port 5432:** TCP connection failed (no local daemon).

### Verified System Behavior Under Database Absence:
1. **Health Readiness Probe:**
   - Request: `GET /api/health/readiness`
   - Response: `HTTP 503 Service Unavailable`
   - Body: `{"status":"degraded","database":"unavailable","timestamp":"..."}`
2. **Customer Catalog Browsing:**
   - Gracefully serves build-time static catalog and cached products. Zero application crashes.
3. **Customer Enquiry Form:**
   - Request: `POST /api/enquiries`
   - Persistence fails gracefully; system returns `UNPERSISTED_FALLBACK` with pre-filled WhatsApp consultation link.
   - UI never reports false database success.
4. **Order Checkout:**
   - Recommends direct atelier WhatsApp ordering (`buildWhatsAppLink`) to ensure prospective customers are never turned away.

---

## 6. Migration History & Schema Integrity Audit

The Prisma migrations in `packages/db/prisma/migrations/` were audited:
- `0_init/migration.sql`: Core schema (Users, Products, Variants, Inventory, Orders, Payments).
- `20261111_add_enquiries/migration.sql`: Customer bespoke enquiry table.
- **Sprint 2J.1 Schema Refinements:**
  - Added `claimedUtr` and unique `verifiedTransactionId` to `Payment`.
  - Added `isDuplicateClaim` tracking flag.
  - Added `PaymentMethod` enum (`UPI_MERCHANT_QR`, `COD`, `NET_BANKING_DIRECT`).
  - Added `AWAITING_PAYMENT_VERIFICATION` to `OrderStatus`.
- Schema validated successfully: `prisma validate` exited code 0.
- Prisma Client compiled and synchronized: `@nava/db` built successfully.
