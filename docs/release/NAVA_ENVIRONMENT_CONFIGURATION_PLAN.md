# NAVA CREATIONS — ENVIRONMENT CONFIGURATION PLAN
**Document Identifier:** `NAVA-ENV-PLAN-01`  
**Execution Timestamp:** 2026-11-14T08:56:30+05:30  
**Scope:** Staging & Production Configuration Architecture  
**Status:** **SPECIFIED & READY FOR INJECTION**  

---

## 1. COMPLETE ENVIRONMENT VARIABLE SPECIFICATION

Derived directly from static analysis of application routes and services across `apps/web` and `packages/db`:

| Variable Name | Type | Scope | Staging Requirement | Production Requirement | Validation Rule / Secret Class |
| :--- | :---: | :---: | :--- | :--- | :--- |
| `DATABASE_URL` | String | Server | Staging Neon Pooled DB URL | Production Pooled DB URL | `postgresql://...`, role must be `nava_app` |
| `DIRECT_URL` | String | Server | Staging Neon Direct DB URL | Production Direct DB URL | `postgresql://...`, role must be `nava_migrator` |
| `ADMIN_AUTH_SECRET` | Secret | Server | Random 64-char Hex | Distinct Random 64-char Hex | Cryptographically secure (min 32 chars) |
| `CRON_SECRET` | Secret | Server | Random 32-char Hex | Distinct Random 32-char Hex | Cryptographically secure (min 32 chars) |
| `MERCHANT_UPI_VPA` | String | Server | `bharatpe.test@fbpe` | Live Owner Current Account VPA | Valid NPCI VPA format (`...@[bank]`) |
| `MERCHANT_DISPLAY_NAME`| String| Server | `NAVA CREATIONS` | `NAVA CREATIONS` | Legal brand display name |
| `MERCHANT_ONBOARDING_APPROVED`| Bool| Server| `true` | `true` | Explicit owner confirmation flag |
| `COD_ENABLED` | Bool | Server | `true` | `true` (subject to policy approval) | Cash on Delivery toggle |
| `COD_POLICY_APPROVED` | Bool | Server | `true` | `true` (subject to policy approval) | Explicit COD policy ratification flag |
| `TRUST_PROXY` | Bool | Server | `true` | `true` | Set `true` behind Vercel/Cloudflare |
| `NODE_ENV` | String | Server | `production` | `production` | Enforces production optimizations |
| `APP_ENV` | String | Server | `staging` | `production` | Environment discriminator |
| `NEXT_PUBLIC_APP_URL` | String | Client | `https://staging.navacreations.in` | `https://navacreations.in` | Canonical URL prefix |
| `UPSTASH_REDIS_REST_URL`| String| Server| *Optional* | Recommended for multi-region | Free Upstash REST cluster URL |
| `UPSTASH_REDIS_REST_TOKEN`| Secret| Server| *Optional* | Recommended for multi-region | Upstash authentication token |

---

## 2. CRYPTOGRAPHIC SECRET GENERATION PROCEDURE

Generate high-entropy secrets locally before injecting into hosting dashboards:

```bash
# Generate ADMIN_AUTH_SECRET (64 hex characters / 256 bits):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate CRON_SECRET (32 hex characters / 128 bits):
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

> [!IMPORTANT]
> Staging and production MUST use completely separate cryptographic keys. Rotating `ADMIN_AUTH_SECRET` invalidates active admin sessions and previous customer HMAC guest order tokens.

---

## 3. FAIL-SAFE BEHAVIOR ON MISSING CONFIGURATION

- **Missing `DATABASE_URL`:** Application routes fail-closed with structured JSON errors (`DATABASE_UNAVAILABLE`), preventing unrecorded phantom transactions.
- **Missing `ADMIN_AUTH_SECRET`:** Administrative login refuses all authentication attempts in production (`500: Server configuration error`).
- **Unapproved Merchant Onboarding (`MERCHANT_ONBOARDING_APPROVED=false`):** Storefront checkout refuses UPI QR generation, prompting the customer to select alternate payment or contact the studio atelier.
- **Unapproved COD (`COD_POLICY_APPROVED=false`):** Checkout suppresses COD option, protecting the business from unconfirmed logistics exposure.
