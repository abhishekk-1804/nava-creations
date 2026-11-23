# NAVA CREATIONS — ENVIRONMENT VARIABLES AND SECRETS MANAGEMENT
**Document ID:** `DOC-G2-PHASE2-ENV`  
**Generated At:** 2026-11-15T09:53:00+05:30  
**Repository:** `D:\NAVA`  
**Branch:** `feature/production-readiness`  
**Role:** Application Security Engineer & DevSecOps Lead  

---

## 1. COMPREHENSIVE ENVIRONMENT VARIABLE INVENTORY

NAVA CREATIONS enforces strict configuration isolation across environments. The following authoritative register catalogs every configuration key, validation rule, classification tier, and fallback behavior across the monorepo:

| Variable Name | Type & Validation Constraints | Required Environments | Sensitivity Level | Code Consumers | Safe Example Value | Fallback Behavior if Unset |
|:---|:---|:---|:---:|:---|:---|:---|
| `DATABASE_URL` | URI string (`postgresql://...`), connection pooler port (e.g., 6543) | Dev, Test, Staging, Prod | **HIGH_SECRET** | `packages/db`, Prisma Client runtime queries | `postgresql://nava_user:secret@db.host.com:6543/nava_prod?pgbouncer=true` | In test/dev: halts if missing. In prod: `assertProductionSecrets()` throws fatal error. |
| `DIRECT_URL` | URI string (`postgresql://...`), direct session port (5432) | Dev, Staging, Prod (Optional in test) | **HIGH_SECRET** | `packages/db`, Prisma CLI, DDL migrations | `postgresql://nava_migrator:secret@db.host.com:5432/nava_prod` | Falls back to `DATABASE_URL` if omitted. |
| `ADMIN_AUTH_SECRET` | String, $\ge 32$ chars, high entropy ($\ge 256$-bit) | Dev, Test, Staging, Prod | **HIGH_SECRET** | `apps/web/lib/auth.ts`, `apps/web/middleware.ts` | `a8f3b2c1d0e9...` (64 hex characters) | Dev/Test: falls back to test harness secret. Prod: `assertProductionSecrets()` halts application boot. |
| `CRON_SECRET` | String, $\ge 32$ chars, alphanumeric/hex | Staging, Prod (Optional in dev/test) | **HIGH_SECRET** | `apps/web/app/api/cron/release-reservations/route.ts` | `c94e0b17d8...` (64 hex characters) | Dev/Test: falls back to test secret. Prod: fails closed with HTTP 500 / 401 if unset or invalid. |
| `NEXT_PUBLIC_APP_URL` | Valid HTTPS URL (HTTP allowed in dev) | Dev, Test, Staging, Prod | **PUBLIC** | `apps/web/app/sitemap.ts`, `robots.ts`, OpenGraph metadata | `https://navacreations.com` | Defaults to `http://localhost:3000` if omitted. |
| `NODE_ENV` | Enum: `development`, `test`, `production` | All | **INTERNAL** | Next.js engine, middleware, route handlers | `production` | Defaults to `development`. |
| `APP_ENV` | Enum: `development`, `test`, `staging`, `production` | All | **INTERNAL** | `apps/web/lib/env-validator.ts`, middleware security checks | `production` | Defaults to `development`. Cannot be spoofed to bypass prod checks. |
| `RESEND_API_KEY` | String, prefix `re_`, $\ge 30$ chars | Staging, Prod (Optional in dev) | **SECRET** | `apps/web/lib/email-service.ts` | `re_1234567890abcdef12345678` | In dev/test: defaults to `SIMULATED` email dispatch mode. In prod: logs alert and suppresses live dispatch if missing. |
| `UPI_MERCHANT_VPA` | Valid Indian VPA format (`<name>@<handle>`) | Dev, Test, Staging, Prod | **INTERNAL** | `apps/web/lib/payment-service.ts`, checkout UI | `navacreations@icici` (or merchant VPA) | Falls back to default store VPA. |
| `UPI_MERCHANT_NAME` | String, 1–50 chars | Dev, Test, Staging, Prod | **INTERNAL** | `apps/web/lib/payment-service.ts`, BharatPe QR generator | `NAVA CREATIONS` | Defaults to `NAVA CREATIONS`. |
| `COD_ENABLED` | Boolean string (`true` / `false`) | Dev, Staging, Prod | **INTERNAL** | `apps/web/lib/order-service.ts`, checkout UI | `true` | Defaults to `true`. |
| `COD_MAX_PAISE` | Integer (paise), e.g., 500000 = ₹5,000 | Dev, Staging, Prod | **INTERNAL** | `apps/web/lib/order-service.ts` | `500000` | Defaults to `500000` (₹5,000 maximum order for COD). |

---

## 2. PRODUCTION FAIL-CLOSED VALIDATION ENGINE

NAVA CREATIONS guarantees that misconfigured or insecure instances cannot boot or accept traffic in production. This invariant is enforced by `apps/web/lib/env-validator.ts` and verified by automated E2E test `SEC.18` and `SEC.23`.

### 2.1 Validation Logic & Architecture
```typescript
// Architectural extract from apps/web/lib/env-validator.ts
export function assertProductionSecrets(): void {
  const isProd = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';
  if (!isProd) return;

  const errors: string[] = [];

  // Rule 1: ADMIN_AUTH_SECRET must be present and >= 32 characters
  const adminSecret = process.env.ADMIN_AUTH_SECRET;
  if (!adminSecret) {
    errors.push('ADMIN_AUTH_SECRET is required in production.');
  } else if (adminSecret.length < 32) {
    errors.push('ADMIN_AUTH_SECRET must be at least 32 characters long in production.');
  }

  // Rule 2: DATABASE_URL must be present
  if (!process.env.DATABASE_URL) {
    errors.push('DATABASE_URL is required in production.');
  }

  // Rule 3: CRON_SECRET must be present and >= 32 characters
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    errors.push('CRON_SECRET is required in production.');
  } else if (cronSecret.length < 32) {
    errors.push('CRON_SECRET must be at least 32 characters long in production.');
  }

  if (errors.length > 0) {
    // SECURITY INVARIANT: Format errors clearly without printing actual secret values
    console.error('[SECURITY FATAL] Production environment validation failed:\n' + 
      errors.map(e => ` - ${e}`).join('\n')
    );
    throw new Error('Production environment validation failed. Check server logs.');
  }
}
```

### 2.2 Security Invariant Proofs
1. **Zero Secret Leakage in Error Stacks:** The error reporting mechanism never logs or echoes secret values or partial substrings. Only validation constraint descriptions are returned.
2. **Environment Variable Spoofing Resistance:** Even if an attacker passes `APP_ENV=test`, if `NODE_ENV === 'production'`, production validation immediately activates and halts invalid boots.

---

## 3. CRYPTOGRAPHIC SECRET GENERATION & ROTATION RUNBOOK

### 3.1 Generating Cryptographically Secure Secrets
Production secrets must be generated using an entropy source certified by the OS kernel (CSPRNG):

```bash
# Generate 64-character hexadecimal secret (256 bits of entropy)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Alternative using OpenSSL
openssl rand -hex 32
```

### 3.2 Zero-Downtime Secret Rotation Procedures

#### Procedure A: Rotating `CRON_SECRET`
1. **Step 1:** Generate new 64-character secret $S_{new}$.
2. **Step 2:** Update cloud hosting configuration (e.g. Vercel Project Settings) with `CRON_SECRET = S_{new}`.
3. **Step 3:** Trigger deployment or await environment variable synchronization.
4. **Step 4:** Update the external scheduler (Vercel Cron / GitHub Actions) with $S_{new}$.
5. **Step 5:** Manually trigger a test request via `curl -X POST -H "Authorization: Bearer <S_new>" https://navacreations.com/api/cron/release-reservations` to verify HTTP 200.

#### Procedure B: Rotating `ADMIN_AUTH_SECRET`
*Impact:* Invalidates all active admin sessions and guest order cookie signatures.
1. **Step 1:** Announce a 5-minute scheduled maintenance window or select low-traffic hours (e.g., 03:00 AM IST).
2. **Step 2:** Generate $S_{new}$.
3. **Step 3:** Update `ADMIN_AUTH_SECRET = S_{new}` in Vercel Production Environment Variables.
4. **Step 4:** Redeploy production instance.
5. **Step 5:** Admin users re-authenticate at `/admin/login`. Any in-flight guest checkout sessions will seamlessly establish new order cookies on their next API interaction.

#### Procedure C: Rotating `DATABASE_URL` (Database Credentials)
1. **Step 1:** In the managed database console (Neon / Aiven / AWS RDS), create a secondary user `nava_app_v2` with identical least-privilege permissions.
2. **Step 2:** Update `DATABASE_URL` in Vercel to point to `nava_app_v2`.
3. **Step 3:** Deploy and monitor error logs for 15 minutes.
4. **Step 4:** Once confirmed active, revoke permissions and drop the legacy user `nava_app_v1`.

---

## 4. LEAK PREVENTION & REPOSITORY HYGIENE

1. **Git Exclusions (`.gitignore`):**
   - `.env`, `.env.local`, `.env.production`, `.env.*.local` are explicitly excluded from version control.
   - Verified clean via `git status --ignored` and `git diff --check`.
2. **Sample Configuration Template (`.env.example`):**
   - Maintained in the repository root containing placeholder documentation without real secrets:
     ```bash
     DATABASE_URL="postgresql://user:password@localhost:5432/nava_dev"
     DIRECT_URL="postgresql://user:password@localhost:5432/nava_dev"
     ADMIN_AUTH_SECRET="replace-with-at-least-32-chars-hex-string-for-production"
     CRON_SECRET="replace-with-at-least-32-chars-hex-string-for-production"
     NEXT_PUBLIC_APP_URL="http://localhost:3000"
     NODE_ENV="development"
     APP_ENV="development"
     ```
3. **Audit Verification:**
   - Monorepo scans confirm zero occurrences of hardcoded production credentials, production private keys, or merchant credentials in source code.
