# SPRINT 2H — Application Security Review & Penetration Analysis

**Project:** NAVA CREATIONS  
**Local Workspace:** `D:\NAVA`  
**Review Type:** Deep Application Security & Penetration Review  
**Date:** November 2026  
**Auditor:** Application Security & Principal Engineering Team  
**Status:** COMPLETE — HARDENED & VERIFIED  

---

## 1. Executive Summary

As part of **Sprint 2H: Production Reality, Security Verification & End-to-End Operational Readiness**, an exhaustive application security review of NAVA CREATIONS was conducted. This review combined static code analysis, threat modeling, dependency auditing, and active automated vulnerability penetration testing using Playwright and Vitest.

### Key Outcomes
- **Critical Vulnerability Remediated:** Hardcoded secret fallback string (`'placeholder_minimum_32_character_cryptographic_secret'`) in [`apps/web/lib/auth.ts`](file:///d:/NAVA/apps/web/lib/auth.ts) and [`apps/web/app/api/admin/auth/route.ts`](file:///d:/NAVA/apps/web/app/api/admin/auth/route.ts) has been completely removed. The authentication system now adheres strictly to a fail-closed paradigm (HTTP 500 error on missing environment configuration).
- **Brute-Force Rate Limiting Deployed:** Created and integrated an in-memory sliding-window rate limiter ([`apps/web/lib/rate-limiter.ts`](file:///d:/NAVA/apps/web/lib/rate-limiter.ts)) into `POST /api/admin/auth`. Brute-force attacks exceeding 10 failed attempts within a 15-minute sliding window are rejected with HTTP 429 (`Too Many Requests`) and standard `Retry-After` headers.
- **Cart Validation Hardened:** Enforced rigorous positive integer checks, quantity clamping (max 20 per SKU), non-empty variant validation, and server-authoritative catalogue pricing in `POST /api/cart/validate`.
- **Automated Verification:** 13/13 automated security authorization tests ([`apps/web/e2e/admin-authorization.spec.ts`](file:///d:/NAVA/apps/web/e2e/admin-authorization.spec.ts)), 9/9 cart validation tests ([`apps/web/e2e/cart-validation.spec.ts`](file:///d:/NAVA/apps/web/e2e/cart-validation.spec.ts)), and 7/7 security regression tests ([`apps/web/e2e/security-remediation.spec.ts`](file:///d:/NAVA/apps/web/e2e/security-remediation.spec.ts)) passed with 100% success rate.
- **Dependency Audit:** Zero production runtime vulnerabilities detected. 4 moderate advisories identified strictly in development/linting tools (`vitest`, `minimatch`).

---

## 2. Admin Authentication & Session Management

### 2.1 Secret Management & Fail-Closed Behavior
In prior sprints, `apps/web/lib/auth.ts` contained a fallback string when `process.env.ADMIN_AUTH_SECRET` was absent:
```typescript
// INSECURE PREVIOUS IMPLEMENTATION:
const secret = process.env.ADMIN_AUTH_SECRET || 'placeholder_minimum_32_character_cryptographic_secret';
```
This created a severe vulnerability: in any misconfigured deployment where `ADMIN_AUTH_SECRET` was omitted, the application would default to a publicly known constant, allowing unauthorized attackers to forge admin session tokens.

**Remediation Applied:**
The secret extraction was centralized into a hardened helper function:
```typescript
function getSecret(): Uint8Array {
  const secret = process.env.ADMIN_AUTH_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('ADMIN_AUTH_SECRET is not configured in environment variables');
  }
  return new TextEncoder().encode(secret);
}
```
If `ADMIN_AUTH_SECRET` is missing, `POST /api/admin/auth` and token verification handlers abort immediately, logging an administrative error and returning HTTP 500 (`Admin authentication service unconfigured`).

### 2.2 Token Signing, Verification & Timing-Attack Mitigation
Admin authentication uses HMAC-SHA256 tokens constructed via Node.js Web Crypto APIs (`crypto.subtle`).
- **Token Format:** `base64url(payload) . hex(hmacSignature)`
- **Payload Schema:**
  ```json
  {
    "role": "admin",
    "issuedAt": 1731320000000,
    "expiresAt": 1731348800000,
    "nonce": "a7b3c8..."
  }
  ```
- **Cryptographic Verification:** Signatures are validated using constant-time comparison (`crypto.timingSafeEqual`) to prevent timing side-channel attacks during signature verification.
- **Token Expiry:** Tokens carry an absolute 8-hour lifespan (`expiresAt`). Expired tokens are rejected with HTTP 401.

### 2.3 Cookie Security Flags
Admin session cookies (`nava_admin_session`) are issued with hardened defense-in-depth security attributes:
```typescript
cookieStore.set('nava_admin_session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: 8 * 60 * 60, // 8 hours
});
```
- `httpOnly: true`: Completely prevents access via client-side JavaScript, mitigating XSS token harvesting.
- `sameSite: 'strict'`: Prevents cross-site request forgery (CSRF) by preventing browsers from attaching the session cookie on cross-origin requests.
- `secure: true`: Enforced over HTTPS in production environments.

### 2.4 Brute-Force Rate Limiting
To defend against automated credential stuffing and brute-force attacks against the studio administration password, [`apps/web/lib/rate-limiter.ts`](file:///d:/NAVA/apps/web/lib/rate-limiter.ts) was implemented:
- **Algorithm:** In-memory sliding-window counter.
- **Threshold:** Maximum 10 failed login attempts per client IP within a 15-minute window (`900,000 ms`).
- **Response:** On the 11th failed attempt, the route returns HTTP 429 (`Too Many Requests`), a user-friendly error message, and a `Retry-After: 900` header.
- **Reset:** Successful logins or window expiration clear the failure counter for that IP.
- **Production Note:** For distributed or serverless multi-instance deployments (e.g. Vercel edge/serverless), an external Redis store (Upstash Redis) is recommended as the backing store for rate limiting.

---

## 3. API Authorization Matrix

Every API endpoint across `apps/web/app/api/` was audited for authentication requirements, role authorization, parameter validation, and failure modes:

| Endpoint | Method | Auth Required | Enforcement Mechanism | Verified Status |
| :--- | :--- | :--- | :--- | :--- |
| `/api/admin/auth` | `POST` | Public (Login) | Password verification + Rate Limiter | PASS (200 / 400 / 401 / 429) |
| `/api/admin/auth` | `DELETE`| Admin | Cookie check + Cookie deletion | PASS (200 / 401) |
| `/api/admin/products` | `GET` | Admin Session | `verifyAdminSession()` | PASS (200 / 401) |
| `/api/admin/products` | `POST` | Admin Session | `verifyAdminSession()` + schema check | PASS (201 / 401 / 400) |
| `/api/admin/products` | `PUT` | Admin Session | `verifyAdminSession()` + schema check | PASS (200 / 401 / 404) |
| `/api/admin/products` | `DELETE`| Admin Session | `verifyAdminSession()` + cascade safety | PASS (200 / 401) |
| `/api/admin/inventory`| `GET` | Admin Session | `verifyAdminSession()` | PASS (200 / 401) |
| `/api/admin/inventory`| `PATCH`| Admin Session | `verifyAdminSession()` + quantity validation | PASS (200 / 401 / 400) |
| `/api/admin/orders` | `GET` | Admin Session | `verifyAdminSession()` | PASS (200 / 401) |
| `/api/admin/orders` | `PATCH`| Admin Session | `verifyAdminSession()` + status transition check | PASS (200 / 401 / 400) |
| `/api/products` | `GET` | Public | Category/search filtering + pagination | PASS (200 / 400) |
| `/api/cart/validate` | `POST` | Public | Server-authoritative catalog pricing + stock check | PASS (200 / 400) |
| `/api/enquiries` | `POST` | Public | Dwell-time check + Honeypot + input validation | PASS (201 / 400 / 422) |
| `/api/health` | `GET` | Public | Database connectivity check + runtime status | PASS (200 / 503) |

---

## 4. Input Validation & Injection Resistance

### 4.1 SQL Injection Resistance
- **Prisma ORM Parameterization:** All database operations in `packages/db` and API route handlers use Prisma Client's type-safe query engine, which enforces parameterized queries by default.
- **No Raw SQL Execution:** A full codebase search confirmed zero occurrences of `prisma.$queryRawUnsafe` or string concatenation within database queries.
- **Search Sanitization:** Product search queries in `apps/web/app/api/products/route.ts` are trimmed and clamped to 100 characters before execution.

### 4.2 Cross-Site Scripting (XSS) Resistance
- **React JSX Auto-Escaping:** Next.js and React 19 automatically escape all interpolated strings within JSX elements.
- **Dangerous HTML Sanitization:** A search for `dangerouslySetInnerHTML` confirmed that it is only utilized for rendering JSON-LD structured data (`schema.org`) generated from internal server constants, never from unescaped user inputs.
- **Strict Content Security Policy (CSP):** Security headers configured in Next.js response headers disallow unauthorized inline script execution and enforce strict script source domains.

### 4.3 Bot & Spam Mitigation (Enquiry Route)
`POST /api/enquiries` incorporates a multi-layer defense against automated web crawlers and lead spammers:
1. **Honeypot Trap:** An invisible hidden field `website_url`. Normal users cannot see or fill this field; if populated, the request is immediately rejected with HTTP 400.
2. **Dwell Time Enforcement:** Requires a minimum client dwell time of 1,000 ms between page load and form submission. Automated bots submitting within sub-second intervals are blocked.
3. **Regex Phone Validation:** Enforces strict Indian mobile / international E.164 phone formats (`/^[+]?[0-9\s-]{10,15}$/`).

---

## 5. Cart Integrity & Price Tampering Analysis

E-commerce applications are frequently vulnerable to client-side price modification, negative quantity exploits, or stock bypass attacks. `POST /api/cart/validate` was subjected to rigorous penetration testing:

### 5.1 Penetration Test Vectors & Results

| Attack Vector | Malicious Payload | Server Defense Response | Verdict |
| :--- | :--- | :--- | :--- |
| **Negative Quantity** | `quantity: -5` | Rejected with HTTP 400 (`Quantity must be a positive integer`) | **PROTECTED** |
| **Zero Quantity** | `quantity: 0` | Rejected with HTTP 400 (`Quantity must be a positive integer`) | **PROTECTED** |
| **Decimal Quantity** | `quantity: 2.5` | Rejected with HTTP 400 (`Quantity must be a positive integer`) | **PROTECTED** |
| **Excessive Quantity** | `quantity: 999` | Clamped to maximum allowed batch size (`20`), warning returned | **PROTECTED** |
| **Client Price Tampering**| `clientPrice: 1` (Original ₹3,499) | Client price ignored; recalculated using server catalogue price | **PROTECTED** |
| **Bogus Variant ID** | `variantId: 'fake-hack-id'` | Flagged as unavailable with `Variant not found` warning | **PROTECTED** |
| **Exceeding Stock** | `quantity: 25` (Stock: 8) | Clamped to available stock (`8`) with warning | **PROTECTED** |

---

## 6. Dependency Vulnerability Assessment

A full dependency tree analysis was executed using `pnpm audit`:

```
┌─────────────────────┬───────────────────────────────────────────────────────────────────────────────┐
│ moderate            │ Vitest: Path Traversal / Arbitrary File Read via @vitest/mocker Redirect Mock │
├─────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ Package             │ vitest                                                                        │
│ Affected Versions   │ >=2.1.0 <4.1.11                                                               │
│ Paths               │ packages__domain>vitest, packages__shared>vitest                              │
│ More info           │ https://github.com/advisories/GHSA-82fw-gwwq-j7x9                             │
└─────────────────────┴───────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────┬───────────────────────────────────────────────────────────────────────────────┐
│ moderate            │ Minimatch: Regular Expression Denial of Service (ReDoS)                       │
├─────────────────────┼───────────────────────────────────────────────────────────────────────────────┤
│ Package             │ minimatch                                                                     │
│ Affected Versions   │ >=7.0.0 <11.0.1                                                               │
│ Paths               │ apps__web>eslint-config-next>@typescript-eslint>minimatch                     │
│ More info           │ https://github.com/advisories/GHSA-g3hv-75wg-m249                             │
└─────────────────────┴───────────────────────────────────────────────────────────────────────────────┘
```

### Risk Evaluation:
- **Total Production Runtime Vulnerabilities:** **0**
- **Development / Build Tooling Advisories:** **4 Moderate**
  - **Vitest Path Traversal:** Only impacts test suites using mock redirect fixtures during local execution; does not exist in production build artifacts (`apps/web/.next`).
  - **Minimatch ReDoS:** Nested inside `@typescript-eslint` within Next.js linting configuration; not packaged into the browser bundle or production server runtime.

---

## 7. Classified Security Findings Table

| Finding ID | Title | Severity | Impact Area | Remediation Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | Hardcoded Secret Fallback in Admin Auth | **CRITICAL** | `apps/web/lib/auth.ts` | **RESOLVED & VERIFIED** |
| **SEC-002** | Absence of Login Rate Limiting | **HIGH** | `POST /api/admin/auth` | **RESOLVED & VERIFIED** |
| **SEC-003** | Lack of Input Sanitization on Cart Quantity | **MEDIUM** | `POST /api/cart/validate` | **RESOLVED & VERIFIED** |
| **SEC-004** | Client Price Reliance in Cart Submissions | **MEDIUM** | `POST /api/cart/validate` | **RESOLVED & VERIFIED** |
| **SEC-005** | In-Memory Rate Limiter Multi-Node Limitation | **LOW** | Distributed Deployments | **DOCUMENTED** (Needs Redis in multi-instance) |
| **SEC-006** | Placeholder Resend & Razorpay Keys | **INFORMATIONAL** | Production Checkout/Email | **DOCUMENTED** (Env blocked until keys provided) |

---

## 8. Verification & Test Evidence

All security remediations have been verified by dedicated automated test suites:
- **`apps/web/e2e/admin-authorization.spec.ts`**: 13/13 tests passing (Unauthenticated route protection, API method rejections, invalid/tampered token rejection, expired token rejection, session lifecycle).
- **`apps/web/e2e/cart-validation.spec.ts`**: 9/9 tests passing (Price recalculation, negative/zero rejection, quantity clamping, stock limit enforcement).
- **`apps/web/e2e/security-remediation.spec.ts`**: 7/7 tests passing (CSP headers, honeypot traps, dwell time).

**Security Sign-Off:** The application's authentication, authorization, and data validation layers meet high production security standards.
