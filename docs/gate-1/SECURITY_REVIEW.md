# NAVA CREATIONS — GATE 1 SECURITY REVIEW
**Document Identifier:** `NAVA-SEC-GATE1-01`  
**Date:** November 15, 2026  
**Status:** Certified Remediated (Test Environment)  
**Classification:** Internal Technical Architecture  

---

## 1. Security Architecture Overview

The NAVA CREATIONS e-commerce platform enforces a defense-in-depth security model across five architectural boundaries:
1. **Network & Edge Boundary:** Reverse proxy IP resolution, anti-spoofing header controls, distributed rate limiting, and HTTP response security headers.
2. **Administrative Access Boundary:** HttpOnly, SameSite=Strict session cookies, HMAC-SHA256 signature verification, account enumeration mitigation, and brute-force protection.
3. **Customer & Order Privacy Boundary:** Order-scoped HttpOnly cookies (`nava_order_${orderNumber}`) preventing URL history, proxy log, and JSON response token leakage.
4. **Commerce & Concurrency Boundary:** Interactive PostgreSQL transactions, deterministic deadlock-free lock acquisition, and database `CHECK` constraints preventing negative inventory or coupon over-redemption.
5. **Operational Cron Boundary:** Constant-time Bearer/header authentication failing closed on unconfigured or weak secrets, strictly rejecting query-string tokens.

---

## 2. Vulnerability Assessment & Remediation Matrix

### 2.1 Cron Secret Authentication & Method Enforcement (SEC-CRON-01)
- **Vulnerability:** The scheduled reservation sweeper endpoint (`/api/cron/release-reservations`) accepted a fallback hardcoded secret (`'nava-cron-secret-2026-safe'`) and parsed query parameters (`?secret=...`). It also allowed state changes over HTTP GET.
- **Risk:** High. An attacker could trigger reservation cancellations or leak secrets via server access logs, browser history, or CDN/WAF logs.
- **Remediation:**
  - Removed all hardcoded fallback secrets.
  - Required strong `CRON_SECRET` ($\ge 32$ characters) in production.
  - Eliminated query-string secret authentication.
  - Enforced POST-only for state-changing cleanup operations (GET returns HTTP 405 Method Not Allowed with `Allow: POST`).
  - Implemented constant-time verification (`crypto.timingSafeEqual`) on `Authorization: Bearer <token>` and `x-cron-secret` headers.
- **Verification:** Spec `e2e/security-remediation.spec.ts` test SEC.17. HTTP 405 returned on GET; HTTP 401 returned on unauthenticated, invalid, or query-string attempts; HTTP 200 returned only on valid POST Bearer header.

### 2.2 Guest Order Authorization, Scoped Cookies & Token Leakage Defense (SEC-AUTH-01 / SEC-AUTH-02)
- **Vulnerability:** Predictable fallback secret used for HMAC token generation; tokens transmitted in URL query strings (`/orders/NAV-XXXX?token=...`) and returned in API JSON response bodies. Furthermore, admin order endpoints previously included `guestAccessToken` in listing payloads.
- **Risk:** Critical. Shoulder surfing, shared links, browser history, referer headers, or admin payload leakage could expose order access tokens, exposing customer names, phone numbers, and delivery addresses (DPDP Act 2023 violation).
- **Remediation:**
  - Removed hardcoded fallback secret; enforced strong `ADMIN_AUTH_SECRET` ($\ge 32$ characters) in production.
  - Scoped guest order authorization to an `HttpOnly`, `SameSite=Lax`, order-specific path cookie: `path: /api/orders/${order.orderNumber}` with 30-day maxAge.
  - Verified path scoping per RFC 6265: seamlessly authorizes both `/api/orders/${orderNumber}` and nested `/api/orders/${orderNumber}/submit-utr` while strictly isolating all other order and site routes.
  - Stripped tokens from checkout redirects and client URL states.
  - Sanitized `guestAccessToken` out of all customer-facing and administrative API response payloads (`OrderService.sanitizeOrder` applied across `/api/orders`, `/api/admin/orders`, `/api/admin/orders/[id]`, and `/api/admin/orders/[id]/verify-payment`).
  - Gated the `/api/orders/[orderNumber]/submit-utr` endpoint with authorization checks.
- **Verification:** Specs `e2e/security-remediation.spec.ts` tests SEC.19, SEC.24 and `e2e/orders-checkout.spec.ts` test ORD-06.

### 2.3 Production Authentication Bypass Defense (SEC-BYPASS-01)
- **Vulnerability:** Logic in `admin/auth/route.ts` and `proxy-trust.ts` checked `APP_ENV !== 'test'`, allowing a misconfigured environment variable to bypass production rate limiting and proxy trust rules.
- **Risk:** High. Inadvertent deployment of `APP_ENV=test` would leave administrative authentication exposed to brute-force attacks and IP spoofing.
- **Remediation:** Removed all `APP_ENV !== 'test'` bypass branches. Production security posture is strictly governed by `NODE_ENV === 'production'`.
- **Verification:** Spec `e2e/security-remediation.spec.ts` test SEC.18.

### 2.4 Coupon Migration Integrity & Race Conditions (SEC-MIG-01 / SEC-DATA-01)
- **Vulnerability:** Promotional migration file contained unapproved campaign rows with fabricated usage counters (`14`, `28`, `6`). Concurrency race conditions could permit coupon redemptions beyond the configured `usage_limit`.
- **Risk:** Medium-High. Unauthorized discount abuse and database seed contamination.
- **Remediation:**
  - Removed all mock seed rows from `2026111301_add_coupons_and_stock_constraints/migration.sql`.
  - Added PostgreSQL constraint:
    `CHECK ("usage_count" >= 0 AND ("usage_limit" IS NULL OR "usage_count" <= "usage_limit"))`.
  - Implemented atomic conditional SQL increment: `UPDATE coupons SET usage_count = usage_count + 1 WHERE code = $1 AND (usage_limit IS NULL OR usage_count < usage_limit)`.
- **Verification:** Spec `e2e/security-remediation.spec.ts` test SEC.20 and `scripts/test-stretch1-integrations.js` test 2.

### 2.5 Admin Error Transparency & Silent Fallback Elimination (SEC-DATA-02)
- **Vulnerability:** Database query failures in admin order listing silently returned `{ items: [], total: 0 }`, and order creation fell back to in-memory persistence without a database connection.
- **Risk:** Medium. Admins could falsely assume zero orders existed when the database was offline; orders could be created in transient memory without persistent storage.
- **Remediation:**
  - Admin orders route catches database exceptions, logs errors safely without credentials, and returns HTTP 500 (`Database failure`).
  - OrderService explicitly throws `Database service is unavailable` in production if the database is disconnected.
- **Verification:** Spec `e2e/security-remediation.spec.ts` test SEC.24.

---

## 3. Centralized Environment Validator & Runtime Precondition Guards (`env-validator.ts`)

A dedicated environment validation layer is deployed at `apps/web/lib/env-validator.ts`:
- **Length Verification:** Enforces minimum 32 characters for `ADMIN_AUTH_SECRET` and 32 characters for `CRON_SECRET`.
- **Dictionary Check:** Rejects known weak and placeholder strings (`'placeholder'`, `'change-me'`, `'admin'`, `'password'`, `'nava-default-fallback-secret-256'`, `'nava-cron-secret-2026-safe'`).
- **URL Syntax:** Enforces `postgresql://` or `postgres://` connection strings and requires `https://` production application URLs.
- **Fail-Closed Execution:** `assertProductionSecrets()` throws a fatal error in production if any requirement fails.
- **Runtime Precondition Guards:**
  - Invoked in Edge middleware `apps/web/middleware.ts` guarding all `/api/*` and `/admin/*` routes.
  - Independently enforced in sensitive route handlers (`/api/admin/auth`, `/api/orders`, `/api/cron/release-reservations`) to ensure defense-in-depth even if middleware were decoupled.
- **Log Hygiene:** Validation errors describe rule violations without echoing secret values.

---

## 4. Residual Risks & Operational Controls

1. **Merchant UPI VPA Accuracy:** The system generates QR codes using `MERCHANT_UPI_VPA`. Entering an incorrect VPA in production would route customer payments to an unintended account.
   *Mitigation:* Pre-launch live ₹1 test payment verification required before announcing storefront.
2. **Reverse Proxy Configuration:** If `TRUST_PROXY=true` is set without an actual reverse proxy in front of the server, client IPs can be spoofed.
   *Mitigation:* Deployment runbook mandates reverse proxy (Nginx/Cloudflare) before setting `TRUST_PROXY=true`.
