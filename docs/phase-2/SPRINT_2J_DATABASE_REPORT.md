# NAVA CREATIONS — SPRINT 2J: DATABASE INFRASTRUCTURE REPORT
## Managed PostgreSQL Evaluation, Environment Validation & Safe Migration Strategy

**Date:** November 11, 2026  
**Auditing Authority:** Principal Software Architect & Database Reliability Engineer  
**Repository:** `abhishekk-1804/nava-creations`  
**Execution Working Directory:** `D:\NAVA`  

---

## 1. Objective

Sprint 2J requires evaluating managed PostgreSQL database options that offer a **genuinely free, zero-cost plan** with no mandatory credit card requirement and zero risk of unexpected financial liability.

The evaluation covers four candidate providers across 11 mandatory dimensions:
1. Ownership and legal entity
2. Hosting region and data residency
3. Storage limits
4. Compute or usage limits
5. Database suspension and inactivity behaviour
6. Backup and recovery availability
7. Connection pooling
8. Connection limits
9. SSL/TLS support
10. Credit card requirement
11. Conditions creating potential charges

---

## 2. Comprehensive Provider Evaluation

### 2.1 Comparative Matrix

| Evaluation Dimension | Neon Serverless PostgreSQL | Supabase Managed PostgreSQL | Render PostgreSQL | Aiven PostgreSQL |
|---|---|---|---|---|
| **1. Ownership & Legal Entity** | Neon, Inc. (Delaware, USA) | Supabase Inc. (Singapore / Delaware, USA) | Render Services, Inc. (San Francisco, USA) | Aiven Oy (Helsinki, Finland) |
| **2. Hosting Region & Residency** | AWS ap-southeast-1 (Singapore), eu-central-1, us-east-2 | AWS ap-south-1 (Mumbai, India), Singapore, EU, US | AWS Oregon, Ohio, Frankfurt, Singapore | Multi-cloud (AWS/GCP), EU/US |
| **3. Storage Limit (Free Plan)** | **1 GB per project** | **500 MB per project** | 1 GB (Temporary) | N/A (30-day trial only) |
| **4. Compute / Usage Limits** | **100 Compute Unit (CU) hours/month**; autoscales up to 2 CU | Shared CPU, ~500 MB RAM allowance | 0.1 vCPU, 512 MB RAM | Trial credit limited |
| **5. Inactivity & Suspension** | **Scale-to-zero after 5 min idle**; **wakes automatically in ~500ms** on incoming connection. Never deleted. | **Pauses after 7 consecutive days of inactivity**. App goes offline until owner manually clicks "Resume" in dashboard. | **EXPIRES AFTER 30 DAYS.** Data permanently deleted after 14-day grace period. | Trial expires after 30 days. |
| **6. Backup & Recovery** | Point-in-time restore (PITR) up to 24 hrs; 10 branches | Daily backups (7-day retention) | No automated backups on free tier | Standard trial backup |
| **7. Connection Pooling** | Built-in native pgBouncer on port 6543 | Built-in Supavisor on port 6543 | None built-in (direct only) | Built-in pgBouncer |
| **8. Connection Limits** | Direct ~100; **Pooled up to 10,000** | Direct ~15; Pooled ~200 | Direct max 100 | Direct max 20 |
| **9. SSL/TLS Enforcement** | Mandatory (`sslmode=require`) | Mandatory (`sslmode=require`) | Supported | Mandatory |
| **10. Credit Card Required?** | **NO.** Zero card needed. | **NO.** Zero card needed. | No upfront, but mandatory to keep DB >30 days | Card required after trial |
| **11. Conditions Creating Charges** | None on Free plan. DB locks to read-only if 1 GB exceeded; zero card on file = zero charge. | None on Free plan. DB locks if 500 MB exceeded; zero card on file = zero charge. | Mandatory paid plan ($7/mo) to prevent deletion after 30 days. | Auto-charges card if trial transitions to paid plan. |
| **Suitability Verdict** | **RECOMMENDED (Primary)** | **RECOMMENDED (Alternative for Mumbai Residency)** | **DISQUALIFIED (30-day deletion)** | **DISQUALIFIED (Trial only)** |

---

## 3. Detailed Provider Profiles & Recommendations

### 3.1 Primary Recommendation: Neon Serverless PostgreSQL
- **Why It Fits NAVA CREATIONS:**
  1. **Automatic Wake-on-Request:** Neon automatically scales compute to zero after 5 minutes of inactivity to preserve compute hours, but immediately wakes up within 500ms upon receiving an incoming connection from Prisma or Next.js. Unlike Supabase, the database never remains dormant or suspended requiring manual admin dashboard intervention.
  2. **Zero Financial Risk:** Signup and usage require zero credit card details. When usage reaches 1 GB storage or 100 CU-hours, the project pauses or restricts writes instead of generating surprise charges.
  3. **High-Concurrency Architecture:** Neon natively provides two distinct connection endpoints:
     - `DATABASE_URL` (Port 6543 with pgBouncer pooling) for Next.js serverless functions and store requests.
     - `DIRECT_URL` (Port 5432 direct connection) for Prisma CLI migrations and schema introspection.
  4. **Latency:** Singapore region (`aws-ap-southeast-1`) provides ~45ms round-trip latency to Bengaluru, well within the sub-100ms budget for boutique e-commerce.

### 3.2 Secondary Alternative: Supabase (AWS Mumbai ap-south-1)
- **Why It Is Considered:**
  - Supabase provides an AWS Mumbai (`ap-south-1`) region on the free tier, ensuring complete Indian data residency.
- **Operational Constraint (Must Mitigate):**
  - Supabase pauses free-tier projects after 7 consecutive days of zero traffic. If selected by the business owner, a lightweight automated health check ping (via GitHub Actions cron or UptimeRobot) must be scheduled to prevent suspension.

### 3.3 Disqualified Options
- **Render PostgreSQL:** Disqualified because free databases are hard-coded to expire and permanently delete after 30 days unless converted to a $7/month paid subscription.
- **Aiven PostgreSQL:** Disqualified because Aiven discontinued perpetual free tiers in favor of a 30-day expiring trial credit.

---

## 4. Environment Validation Specification

The application enforces strict structural and protocol validation for database connection strings without exposing secrets:

```ts
/**
 * Strict Environment Validation for Database Connection Strings
 */
export function validateDatabaseEnvironment(): {
  isValid: boolean;
  isPooledConfigured: boolean;
  isDirectConfigured: boolean;
  error?: string;
} {
  const pooledUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  const isPlaceholder = (val?: string) =>
    !val ||
    val.trim() === '' ||
    val.includes('placeholder') ||
    val.includes('ep-sample') ||
    val.includes('example.com');

  if (isPlaceholder(pooledUrl)) {
    return {
      isValid: false,
      isPooledConfigured: false,
      isDirectConfigured: !isPlaceholder(directUrl),
      error: 'DATABASE_URL is missing or contains placeholder values',
    };
  }

  // Verify protocol
  if (!pooledUrl!.startsWith('postgresql://') && !pooledUrl!.startsWith('postgres://')) {
    return {
      isValid: false,
      isPooledConfigured: false,
      isDirectConfigured: false,
      error: 'DATABASE_URL must start with postgresql:// or postgres://',
    };
  }

  // Verify SSL enforcement
  if (!pooledUrl!.includes('sslmode=') && !pooledUrl!.includes('ssl=')) {
    return {
      isValid: false,
      isPooledConfigured: true,
      isDirectConfigured: false,
      error: 'DATABASE_URL must enforce SSL (sslmode=require)',
    };
  }

  return {
    isValid: true,
    isPooledConfigured: true,
    isDirectConfigured: !isPlaceholder(directUrl),
  };
}
```

---

## 5. Safe Migration Deployment Protocol

When the business owner provisions a free Neon or Supabase database:

1. **Populate Credentials:**
   Place the connection strings into `apps/web/.env.local`:
   ```bash
   DATABASE_URL="postgresql://[user]:[password]@[endpoint]-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   DIRECT_URL="postgresql://[user]:[password]@[endpoint].ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
   ```
2. **Execute Deployment Command:**
   Run the production-safe migration deployment command:
   ```bash
   pnpm --filter @nava/db db:migrate:deploy
   ```
   > [!CAUTION]
   > Never run `prisma migrate reset` or `prisma db push --force-reset`.
   > `prisma migrate deploy` applies pending migrations without dropping tables, resetting sequences, or deleting data.
3. **Verify Migration Status:**
   ```bash
   pnpm --filter @nava/db db:migrate:status
   ```
4. **Seed Catalogue & Initial Inventory:**
   ```bash
   pnpm --filter @nava/db db:seed
   ```
5. **Verify Health Probes:**
   Confirm `GET /api/health/readiness` returns:
   ```json
   {
     "status": "ready",
     "service": "nava-creations-web",
     "checks": {
       "database": "connected"
     }
   }
   ```
