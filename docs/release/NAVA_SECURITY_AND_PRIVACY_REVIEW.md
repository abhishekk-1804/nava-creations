# NAVA CREATIONS — SECURITY & PRIVACY REVIEW
**Document Identifier:** `NAVA-SEC-REVIEW-01`  
**Execution Timestamp:** 2026-11-14T08:55:00+05:30  
**Scope:** Comprehensive Application & Infrastructure Security  
**Review Status:** **VERIFIED**  

---

## 1. AUTHENTICATION & SESSION SECURITY

### 1.1 Admin Authentication & Session Management
- **Constant-Time Verification:** Input credentials are converted to buffers and compared with `crypto.timingSafeEqual`, preventing side-channel timing attacks.
- **Brute-Force Rate Limiting:**
  - Enforces a strict threshold of 10 failed attempts per 15 minutes.
  - Tracked per IP and per account identifier.
  - Multi-backend architecture: Uses Upstash Redis when configured, with automatic, transparent failover to process memory.
  - Successful authentication immediately resets failure counters.
- **Session Issuance & Invalidation:**
  - High-entropy cryptographic session tokens (64 hex characters).
  - Stored in PostgreSQL `admin_sessions` as a SHA-256 hash.
  - Validated on every administrative request.
  - Revocation (`DELETE /api/admin/auth`) updates `isRevoked: true` on the database record and wipes the client-side cookie with `maxAge: 0`.
- **Cookie Security Attributes:**
  - `httpOnly: true` (prevents XSS access)
  - `secure: true` in production (enforces HTTPS)
  - `sameSite: 'lax'` (CSRF mitigation)
  - `path: '/'`

---

## 2. API DEFENSES & DATA VALIDATION

### 2.1 Request Validation & Injection Defenses
- **SQL Injection Prevention:** All database operations execute through Prisma ORM with parameterized queries or tagged templates (`client.$executeRaw`). Raw string interpolation is strictly avoided.
- **Cross-Site Scripting (XSS):** React 19 / Next.js automatic output escaping sanitizes rendered content. Form inputs (e.g. customer notes, bridal enquiries) are stripped of executable script tags.
- **Uniform Error Handling:** Unhandled exceptions catch stack traces and return generic error messages in production, preventing internal schema or environment leakage.

### 2.2 Client IP Resolution & Proxy Trust
- **Configuration:** Managed via `TRUST_PROXY` environment variable.
- **Security Invariant:** When `TRUST_PROXY=true`, client IP is extracted from the leftmost address in `x-forwarded-for` or `cf-connecting-ip`. When deployed directly without a reverse proxy, it defaults to direct socket address, preventing IP spoofing attacks.

---

## 3. DATABASE PRIVILEGE ISOLATION (LEAST PRIVILEGE)

Verified via authenticated SQL inspection on PostgreSQL 16:
- **Migration Role (`nava_migrator`):**
  - Schema owner for `public`.
  - Holds `CREATE`, `ALTER`, `DROP` permissions.
  - Used exclusively during `prisma migrate deploy`.
- **Application Role (`nava_app`):**
  - Granted `SELECT`, `INSERT`, `UPDATE`, `DELETE` on application tables.
  - Explicitly denied `CREATE`, `DROP`, `ALTER`, and `TRUNCATE`.
  - Access to `_prisma_migrations` is strictly **DENIED**.
- **Superuser (`postgres`):** Never used in application runtime, test suites, or migration scripts.

---

## 4. GUEST ORDER PRIVACY & DPDP ACT 2023 COMPLIANCE

### 4.1 Order Tracking Access Control
- **Dual-Path Authorization:** Endpoint `/api/orders/[orderNumber]` requires:
  - *Path 1:* Authentic Store Manager / Admin session cookie.
  - *Path 2:* Valid HMAC SHA-256 guest access token matching the order number and timestamp.
- **Constant-Time Token Comparison:** Tokens are evaluated using `crypto.timingSafeEqual` after strict 64-character hex length validation.
- **IDOR & Enumeration Defense:** Unauthenticated or unauthorized requests return a uniform `404 Not Found` (never 401 or distinctive error messages), preventing attackers from enumerating valid order numbers or harvesting customer personal information.

### 4.2 Customer Personal Identifiable Information (PII) Audit
- **Data Collected:** Customer Name, Phone Number, Shipping Address, Postal PIN Code.
- **Purpose:** Exclusively required for Indian logistics dispatch and payment reconciliation.
- **Storage:** Persisted in PostgreSQL tables `orders` and `customer_addresses`.
- **Access:** Strictly restricted to authenticated studio administrators.
- **Third-Party Exposure:** Zero customer data is sold or shared. No third-party analytics or tracker scripts are embedded in checkout or order tracking pages.

---

## 5. SECURITY FINDINGS CLASSIFICATION MATRIX

| Finding / Area | Severity | Classification | Mitigation / Verification Status |
| :--- | :---: | :---: | :--- |
| Timing attack on admin login | Low | **VERIFIED** | Mitigated via `crypto.timingSafeEqual` |
| Brute force against admin panel | Medium | **VERIFIED** | Mitigated via 10 attempts/15 min rate limiter |
| IDOR order harvesting | High | **VERIFIED** | Mitigated via HMAC guest tokens and uniform 404 |
| Database DDL injection from app | High | **VERIFIED** | Mitigated via `nava_app` least-privilege role |
| Database-level overselling race | Critical | **VERIFIED** | Mitigated via CHECK constraint & conditional updates |
| Secret rotation invalidating guest tokens | Low | **INFORMATIONAL** | Documented in `NAVA_KNOWN_RISKS_AND_LIMITATIONS.md` |
| In-memory rate limiter on serverless | Low | **INFORMATIONAL** | Upstash Redis configuration provided in runbook |
| Production merchant VPA activation | High | **REQUIRES OWNER APPROVAL** | Owner must confirm live BharatPe VPA |
