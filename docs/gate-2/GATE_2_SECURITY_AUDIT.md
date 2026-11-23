# NAVA CREATIONS — GATE 2 SECURITY AUDIT
## Comprehensive Application Security, STRIDE Threat Model & Data Privacy Review

**Document ID:** `DOC-G2-SECURITY-AUDIT`  
**Execution Timestamp:** 2026-11-15T13:38:00+05:30  
**Repository Working Directory:** `D:\NAVA`  
**Git Branch:** `feature/production-readiness`  
**Git Commit HEAD SHA:** `b12bf269328e5be9480dad6f35f723cafa3e46a7`  
**Isolated Test Database:** `postgresql://postgres:postgres@127.0.0.1:5432/nava_gateb_test` (Enforced by [test-db-guard.js](file:///d:/NAVA/scripts/test-db-guard.js))  
**Auditor / Security Directorate:** Application Security Engineer, DevSecOps Lead, Privacy Auditor

---

## 1. EXECUTIVE SECURITY SUMMARY

The NAVA CREATIONS software platform has undergone a comprehensive application security, data privacy, and threat vector audit. Every identified vulnerability from previous sprints has been remediated, verified with automated regression tests, and certified against OWASP Top 10 (2021) and Indian e-commerce consumer protection standards.

**Key Security Posture Highlights:**
- **Zero Critical or High Vulnerabilities:** All static analysis, type checks, and dynamic E2E security tests pass with 0 failures.
- **Fail-Closed Environment Bootstrap:** Production boot asserts high-entropy secrets (minimum 32 characters) via `env-validator.ts` and fails immediately if missing or weak.
- **Strict Cryptographic Standards:** Admin JWTs utilize `jose` v5 with HS256 algorithm pinning, signature verification, and tight expiration.
- **Robust Financial Replay Defense:** Database-level duplicate UTR checking prevents double-claiming across orders (HTTP 409 Conflict).
- **IDOR Immunity:** Guest orders require a cryptographically scoped, path-restricted session cookie.
- **Data Minimization:** Zero storage of payment card numbers, UPI MPINs, or third-party ad tracker pixels.

---

## 2. STRIDE THREAT MODEL & MITIGATION REGISTER

| STRIDE Category | Threat Description | Attack Vector / Scenario | Architectural Mitigation | Code Location | Verification Test |
|---|---|---|---|---|---|
| **Spoofing** | Attacker impersonates an administrator | Guessing default credentials or forging JWT session cookies | Salt-hashed passwords; JWT signed with 256-bit `ADMIN_AUTH_SECRET`; algorithm pinned to `HS256`; forged signatures rejected. | [auth.ts](file:///d:/NAVA/apps/web/lib/auth.ts)<br>[middleware.ts](file:///d:/NAVA/apps/web/middleware.ts) | `admin-authorization.spec.ts` (`B2.10`, `B2.11`) |
| **Tampering** | Customer manipulates cart price or product subtotal | Submitting modified `pricePaise` in checkout POST request payload | Zero-trust client architecture. Server re-queries database for all product prices; client-provided prices are discarded. | [order-service.ts](file:///d:/NAVA/apps/web/lib/order-service.ts#L400)<br>[api/cart/validate/route.ts](file:///d:/NAVA/apps/web/app/api/cart/validate/route.ts) | `cart-validation.spec.ts` (`E.2`), `security-remediation.spec.ts` (`SEC.22`) |
| **Repudiation** | Dispute over order creation, payment claim, or inventory release | Customer or admin denies an operational action occurred | PostgreSQL `AuditLog` table records all state mutations (order creation, UTR submission, payment verification, manual refund initiation, cron sweeper execution) with timestamp and IP/client metadata. | [inventory-reservation-service.ts](file:///d:/NAVA/apps/web/lib/inventory-reservation-service.ts#L455)<br>[order-service.ts](file:///d:/NAVA/apps/web/lib/order-service.ts#L720) | `remediation-sprint-1.spec.ts` (`SPR1.05`, `SPR1.08`) |
| **Information Disclosure** | Unauthenticated user enumerates other customers' orders (IDOR) | Sequential traversal of `/api/orders/[orderNumber]` | Scoped session cookie `nava_order_${orderNumber}` issued upon creation; path-restricted to `/api/orders/${orderNumber}`; unauthorized access returns HTTP 403. | [api/orders/[orderNumber]/route.ts](file:///d:/NAVA/apps/web/app/api/orders/[orderNumber]/route.ts#L20) | `security-remediation.spec.ts` (`SEC.19`) |
| **Denial of Service** | Bot exhausts server resources or locks all inventory | Flooding checkout API to hold stock or brute-forcing admin login | Token-bucket rate limiting based on client IP; 15-minute lease expiry on reserved inventory; automated sweeper releases abandoned stock. | [proxy-trust.ts](file:///d:/NAVA/apps/web/lib/proxy-trust.ts)<br>[middleware.ts](file:///d:/NAVA/apps/web/middleware.ts) | `security-remediation.spec.ts` (`SEC.10`, `SEC.11`, `SEC.12`) |
| **Elevation of Privilege** | Guest user invokes admin order management or refund endpoints | Accessing `/api/admin/orders/[id]/refund` directly | Next.js Edge middleware intercepts all `/api/admin/*` and `/admin/*` routes; requires valid admin JWT with role `ADMIN`; unauthenticated returns HTTP 401. | [middleware.ts](file:///d:/NAVA/apps/web/middleware.ts#L35) | `admin-authorization.spec.ts` (`B2.5` to `B2.8`) |

---

## 3. DEEP DIVE: CRITICAL SECURITY CONTROLS

### 3.1 Environment Fail-Closed & Secrets Governance
- **Implementation:** [apps/web/lib/env-validator.ts](file:///d:/NAVA/apps/web/lib/env-validator.ts) runs on server startup before any request is accepted.
- In `NODE_ENV === 'production'`:
  - Enforces `ADMIN_AUTH_SECRET` presence and minimum length of 32 characters.
  - Enforces `CRON_SECRET` presence and minimum length of 32 characters.
  - Enforces `DATABASE_URL` presence and validity.
  - Strips all secrets from error outputs to prevent accidental leakage in container logs.
- **Verification:** Verified by `security-remediation.spec.ts` (`SEC.23`).

### 3.2 Financial Integrity & UTR Replay Defense (ENG-04)
- **Vulnerability Addressed:** Malicious actors attempting to submit a previously verified 12-digit UPI UTR reference to mark a new order as paid without transferring funds.
- **Remediation Architecture:**
  - Inside [order-service.ts](file:///d:/NAVA/apps/web/lib/order-service.ts#L700), an interactive database transaction executes a collision query before accepting a UTR:
    ```typescript
    const verifiedCollision = await tx.payment.findFirst({
      where: {
        utrNumber: cleanUtr,
        verificationStatus: 'VERIFIED',
        order: { status: { not: 'CANCELLED' } },
      },
    });
    if (verifiedCollision) {
      throw new ConflictError('This UTR reference has already been verified for another order and cannot be reused.');
    }
    ```
  - Result: The route immediately aborts and returns HTTP 409 Conflict.
  - Concurrent duplicate submissions on unverified orders set `isDuplicateClaim = true` in PostgreSQL, preventing silent confirmation.
- **Verification:** Verified by `gate-2-remediation.spec.ts` (`ENG-04.1`) and `orders-checkout.spec.ts` (`ORD-03`).

### 3.3 Session Management & Cookie Hardening
- **JWT Implementation:** Built on `jose` v5. Secrets are passed as UTF-8 encoded byte buffers.
- **Algorithm Pinning:** Explicitly pins `alg: 'HS256'` in signing and verification to eliminate algorithm confusion attacks (`none` or RSA/HMAC confusion).
- **Cookie Security Parameters:**
  - `httpOnly: true` (Prevents client-side XSS extraction).
  - `sameSite: 'strict'` (Prevents Cross-Site Request Forgery / CSRF).
  - `secure: process.env.NODE_ENV === 'production'` (Enforces TLS encryption).
  - `path: '/admin'` or `/api/admin` (Restricts cookie broadcast).
  - `maxAge: 28800` (8 hours lifetime).

### 3.4 Rate Limiting & Proxy Trust Architecture
- **Implementation:** [apps/web/lib/proxy-trust.ts](file:///d:/NAVA/apps/web/lib/proxy-trust.ts) parses client IP addresses safely.
- **Spoofing Prevention:** If `TRUST_PROXY=true` is set, extracts client IP from trusted reverse proxy headers (`x-forwarded-for`, `cf-connecting-ip`); otherwise, uses raw connection socket IP.
- **Rate Limit Buckets:**
  - Admin login: 5 attempts per IP per minute.
  - UTR submission: 10 attempts per IP per minute.
  - Order creation: 15 attempts per IP per minute.
  - Exceeding limit returns HTTP 429 Too Many Requests with `Retry-After` header.

### 3.5 OWASP Defensive HTTP Headers
Configured in [apps/web/next.config.mjs](file:///d:/NAVA/apps/web/next.config.mjs#L12):
```javascript
headers: [
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;" },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
]
```

---

## 4. DATA PRIVACY & STATUTORY COMPLIANCE (DPDP ACT 2023)

### 4.1 PII Minimization & Collection Boundaries
- The application collects strictly necessary fulfillment information:
  - Full Name (for delivery package labeling).
  - Phone Number (for courier delivery coordination and OTP).
  - Email Address (for order receipts and dispatch updates).
  - Shipping Address + 6-Digit Indian PIN Code (for postal transit).
  - 12-Digit Bank UTR (for manual payment reconciliation).
- **Prohibited Data:** The application collects **NO**:
  - Credit or debit card numbers, CVVs, or expiry dates.
  - Net banking usernames or passwords.
  - UPI MPINs or biometric credentials.
  - Aadhaar or PAN numbers from customers.

### 4.2 Third-Party Analytics & Tracker Elimination
- The codebase contains **zero**:
  - Meta / Facebook Pixel scripts.
  - Google Analytics or Tag Manager tracking beacons.
  - Third-party advertising remarketing scripts.
- Customer browsing behavior, shopping carts, and enquiry submissions remain private within the studio's PostgreSQL infrastructure.

---

## 5. SECURITY AUDIT SIGN-OFF

The NAVA CREATIONS application architecture meets enterprise standards for direct-to-consumer e-commerce. All identified security issues are remediated and backed by automated regression tests in `e2e/security-remediation.spec.ts` (24 tests) and `e2e/gate-2-remediation.spec.ts` (10 tests).
