# NAVA CREATIONS — ENVIRONMENT VARIABLES SPECIFICATION & CHECKLIST

**Document Identifier:** `NAVA-ENV-01`  
**Revision:** 1.0.0-rc1  
**Scope:** Local, Staging, and Production Environments  

---

## 1. Master Environment Variables Matrix

| Variable Name | Required | Scope | Security Level | Purpose & Constraints |
| :--- | :---: | :---: | :---: | :--- |
| `DATABASE_URL` | **YES** | Server | **CRITICAL SECRET** | Runtime PostgreSQL connection string. Must use least-privilege `nava_app` role with DML permissions only. Never use superuser or migrator role. |
| `DIRECT_URL` | **YES** | Server | **CRITICAL SECRET** | Direct PostgreSQL connection string for Prisma migrations and schema deployment. Must use `nava_migrator` role. |
| `ADMIN_AUTH_SECRET` | **YES** | Server | **CRITICAL SECRET** | Cryptographic 64-character hex secret ($\ge 32$ characters required, fail-closed in production) for HMAC-SHA256 admin session signing and guest order token generation. Placeholders and weak dictionary values are strictly rejected. |
| `CRON_SECRET` | **YES** | Server | **CRITICAL SECRET** | High-entropy Bearer token ($\ge 16$ characters required, fail-closed in production) required for triggering `/api/cron/release-reservations`. Query-string authentication is disallowed. |
| `NEXT_PUBLIC_APP_URL` | **YES** | Client & Server | Public | Canonical public storefront URL (e.g. `https://navacreations.in` or `https://staging.navacreations.in`). Used for OpenGraph tags, sitemaps, and WhatsApp links. In production, must use `https://` and cannot point to loopback. |
| `MERCHANT_UPI_VPA` | **YES** | Server | Sensitive | BharatPe / Bank UPI Virtual Payment Address (e.g. `bharatpe.9886000000@fbpe`) for generating merchant UPI QR codes. Zero gateway fees. |
| `MERCHANT_DISPLAY_NAME` | **YES** | Server | Public | Business brand name displayed in UPI apps during customer transfer (defaults to `NAVA CREATIONS`). |
| `MERCHANT_ONBOARDING_APPROVED` | **YES** | Server | Internal Flag | Set to `true` to activate live BharatPe UPI QR modal at checkout. |
| `COD_ENABLED` | **YES** | Server | Internal Flag | Set to `true` to enable Cash on Delivery payment option at checkout. |
| `COD_POLICY_APPROVED` | **YES** | Server | Internal Flag | Set to `true` to enforce maximum ₹5,000 order limit and mandatory customer phone verification for COD orders. |
| `TRUST_PROXY` | **YES** | Server | Config | Set to `true` when deployed behind reverse proxy (Nginx, Cloudflare, Vercel) for client IP rate limiting. |
| `NODE_ENV` | **YES** | System | Config | Set to `production` in production and staging deployments. |
| `UPSTASH_REDIS_REST_URL` | Optional | Server | Sensitive | Upstash Redis REST URL for multi-instance distributed rate limiting. |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Server | **SECRET** | Upstash Redis authentication token. |

---

## 2. Environment Comparison Matrix

| Configuration | Local Development | Staging Environment | Production Environment |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `development` | `production` | `production` |
| `APP_ENV` | `local` | `staging` | `production` |
| `DATABASE_URL` | Local Postgres (port 5433 / 5432) | Cloud Postgres (Pooled) | Cloud Postgres (Pooled, `nava_app`) |
| `DIRECT_URL` | Local Postgres (port 5433 / 5432) | Cloud Postgres (Direct) | Cloud Postgres (Direct, `nava_migrator`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://staging.navacreations.in` | `https://navacreations.in` |
| `ADMIN_AUTH_SECRET` | Local dev random string | Staging vault secret (64-hex) | Production vault secret (64-hex) |
| `CRON_SECRET` | Local dev cron secret | Staging cron secret (32-hex) | Production cron secret (32-hex) |
| `MERCHANT_UPI_VPA` | Sandbox / test VPA | Test VPA | Verified Live Merchant VPA |
| `TRUST_PROXY` | `false` | `true` | `true` |

---

## 3. Secret Generation Utility

Generate high-entropy secrets using Node.js crypto module:

```bash
# Generate 64-character hex secret for ADMIN_AUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate 32-character hex secret for CRON_SECRET
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## 4. Security Rules & Compliance

1. **Zero Secret Leaks:** Never commit `.env`, `.env.local`, or `.env.production` to Git.
2. **Password URL Encoding:** If database passwords contain special characters (`@`, `#`, `$`, `%`, `&`, `+`), they must be URL-encoded (`encodeURIComponent`).
3. **Least-Privilege Principle:**
   - Application connections (`DATABASE_URL`) must NEVER possess `CREATEDB`, `SUPERUSER`, or DDL privileges.
   - Migrations (`DIRECT_URL`) must only be executed during deployment windows.
