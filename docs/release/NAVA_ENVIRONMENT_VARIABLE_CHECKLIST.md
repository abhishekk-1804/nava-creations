# NAVA CREATIONS — ENVIRONMENT VARIABLE CHECKLIST
**Document Identifier:** `NAVA-ENV-CHECKLIST-01`  
**Revision:** 1.0.0-rc1  
**Scope:** Staging & Production Deployment  

---

## 1. MASTER ENVIRONMENT VARIABLE SPECIFICATION

> [!CAUTION]
> Never commit real secrets, connection strings with production passwords, or merchant private keys to Git. Use host environment variable managers (Vercel Project Settings, Docker secrets, or server `.env.local` with `chmod 600`).

| Variable Name | Required | Scope | Default / Example Value (Sanitized) | Purpose & Validation Rules |
| :--- | :---: | :---: | :--- | :--- |
| `DATABASE_URL` | **YES** | Server | `postgresql://nava_app:<PASSWORD>@<HOST>:5432/<DB>?schema=public&sslmode=require` | Runtime pooled database connection for application operations. Must use least-privilege `nava_app` role. |
| `DIRECT_URL` | **YES** | Server | `postgresql://nava_migrator:<PASSWORD>@<HOST>:5432/<DB>?schema=public&sslmode=require` | Direct database connection for Prisma migrations and schema DDL. Must use `nava_migrator` role. |
| `ADMIN_AUTH_SECRET` | **YES** | Server | `<RANDOM_64_CHAR_HEX_STRING>` | High-entropy secret for signing admin sessions and generating customer HMAC guest order tokens. Minimum 32 characters. |
| `CRON_SECRET` | **YES** | Server | `<RANDOM_32_CHAR_HEX_STRING>` | Bearer token required to trigger scheduled reservation cleanup on `/api/cron/release-reservations`. |
| `NEXT_PUBLIC_APP_URL` | **YES** | Client & Server | `https://navacreations.in` (Prod) / `https://staging.navacreations.in` (Staging) | Base public URL of storefront. Used for metadata, canonical URLs, and WhatsApp consultation links. |
| `MERCHANT_UPI_VPA` | **YES** | Server | `bharatpe.9886000000@fbpe` (or ICICI/HDFC VPA) | Sovereign BharatPe UPI Virtual Payment Address for customer QR intent generation. Zero gateway fees. |
| `MERCHANT_DISPLAY_NAME` | **YES** | Server | `NAVA CREATIONS` | Merchant brand name encoded in NPCI UPI QR string. |
| `MERCHANT_ONBOARDING_APPROVED` | **YES** | Server | `true` | Feature flag to activate live BharatPe UPI QR modal during customer checkout. |
| `COD_ENABLED` | **YES** | Server | `true` | Enables Cash on Delivery payment option at checkout. |
| `COD_POLICY_APPROVED` | **YES** | Server | `true` | Enforces studio COD logistics policy (max ₹5,000 threshold, phone verification). |
| `TRUST_PROXY` | **YES** | Server | `true` | Set to `true` when deployed behind Vercel, Cloudflare, or AWS ALB for client IP rate limiting. |
| `NODE_ENV` | **YES** | Server | `production` | Enables production optimizations, secure cookies, and stripped debug stacks. |
| `UPSTASH_REDIS_REST_URL` | *Optional* | Server | `https://<cluster>.upstash.io` | Distributed Redis REST endpoint for multi-instance rate limiting and session failover. |
| `UPSTASH_REDIS_REST_TOKEN` | *Optional* | Server | `<REST_TOKEN>` | Authentication token for Upstash Redis cluster. |

---

## 2. STAGING VS PRODUCTION CONFIGURATION MATRIX

```
========================================================================================
VARIABLE                          TEST / LOCAL          STAGING              PRODUCTION
========================================================================================
NODE_ENV                          production            production           production
APP_ENV                           test                  staging              production
DATABASE_URL                      127.0.0.1 (local)     Cloud Postgres Pool  Cloud Postgres Pool
DIRECT_URL                        127.0.0.1 (local)     Cloud Postgres DirectCloud Postgres Direct
TRUST_PROXY                       true                  true                 true
NEXT_PUBLIC_APP_URL               http://127.0.0.1:3000 https://stage...     https://navacreations.in
ADMIN_AUTH_SECRET                 <test-secret>         <staging-secret>     <prod-vault-secret>
CRON_SECRET                       <test-cron-sec>       <staging-cron-sec>   <prod-cron-secret>
MERCHANT_UPI_VPA                  bharatpe.test@fbpe    bharatpe.test@fbpe   <OWNER_LIVE_VPA>
MERCHANT_DISPLAY_NAME             NAVA CREATIONS        NAVA CREATIONS       NAVA CREATIONS
MERCHANT_ONBOARDING_APPROVED      true                  true                 true
COD_ENABLED                       true                  true                 true
COD_POLICY_APPROVED               true                  true                 true
UPSTASH_REDIS_REST_URL            (unconfigured)        (optional)           (recommended)
========================================================================================
```

---

## 3. SECURITY VALIDATION RULES & CHECKS

1. **Entropy Check:** `ADMIN_AUTH_SECRET` and `CRON_SECRET` must be generated using cryptographically strong pseudo-random bytes:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. **URL Encoding:** Special characters in PostgreSQL passwords (e.g. `@`, `#`, `/`, `:`) must be percent-encoded (`encodeURIComponent`) in both `DATABASE_URL` and `DIRECT_URL`.
3. **Dual Role Separation:** Verify that `DATABASE_URL` connects as `nava_app` and `DIRECT_URL` connects as `nava_migrator`.

---

## 4. CHECKLIST SIGN-OFF MATRIX

| Item | Classification | Notes |
| :--- | :---: | :--- |
| `.env.example` Template Created | **VERIFIED** | Present in repository root |
| Local Test Env Guard Validation | **VERIFIED** | `scripts/test-db-guard.js` prevents accidental prod writes |
| Missing Env Graceful Build Handling | **VERIFIED** | Next.js build succeeds with offline defaults |
| Staging Cloud Secrets Generation | **NOT VERIFIED** | Awaiting hosting account setup |
| Production Merchant VPA Approval | **REQUIRES OWNER APPROVAL** | Owner must confirm banking VPA |
| Production Domain Name Approval | **REQUIRES OWNER APPROVAL** | Owner must confirm primary apex domain |
