# NAVA CREATIONS — Sprint 2J Security Review
## Application Security, Zero-Trust Commerce & Sovereign India-First Threat Modeling

**Document Version:** 1.0.0  
**Date:** 2026-11-11  
**Project:** NAVA CREATIONS (`D:\NAVA`)  
**Scope:** OWASP Top 10, Commerce Threat Modeling, Zero PCI Liability, Authentication/RBAC, and Secret Hygiene  

---

## 1. Security Architecture Overview

NAVA CREATIONS operates under a strict **Zero-Trust Commerce** security model. In Sprint 2J, the removal of third-party payment gateways (Razorpay) significantly reduced the application's attack surface and completely eliminated external webhook spoofing risks and third-party script vulnerabilities.

```mermaid
flowchart TD
    subgraph UntrustedZone["Untrusted Client Zone"]
        CustomerBrowser["Customer Browser / Mobile"]
        MaliciousActor["Adversary / Tampering Script"]
    end

    subgraph EdgePerimeter["Edge Perimeter & Middleware"]
        RateLimiter["Sliding-Window Rate Limiter"]
        SecurityHeaders["Security Headers (CSP, HSTS, X-Frame)"]
        AuthMiddleware["Admin Auth & Session Verification"]
    end

    subgraph ApplicationBoundary["Server Application Boundary"]
        InputValidator["Zod Schema & Regex Validator"]
        PriceAuthority["Server-Authoritative Price Calculator"]
        DomainFSM["Pure Domain State Machines"]
        PaymentService["Sovereign India Payment Service"]
    end

    subgraph SecurePersistence["Data & Audit Storage"]
        PrismaORM["Prisma Parameterized ORM"]
        PostgresDB[("PostgreSQL Database")]
        AuditLedger["Immutable Status & Audit Log"]
    end

    CustomerBrowser -->|HTTPS POST| EdgePerimeter
    MaliciousActor -.->|Tampered Price / Fake UTR| EdgePerimeter
    EdgePerimeter -->|Sanitized Request| ApplicationBoundary
    ApplicationBoundary -->|Parameterized Query| SecurePersistence
```

---

## 2. Threat Modeling & Vulnerability Remediation Matrix

| Threat Category | Specific Threat | Mitigation Mechanism in NAVA CREATIONS | Verification Test Evidence |
| :--- | :--- | :--- | :--- |
| **Tampering** | Client manipulates price in cart payload to purchase high-value jewelry for ₹1 | Server-authoritative calculation: unit prices read strictly from database/catalog by SKU; client-submitted totals discarded. | `commerce-foundation.spec.ts` (CF.1, CF.2) |
| **Replay Attack** | Adversary re-submits a previously verified 12-digit UTR to claim a second order for free | In-memory and database uniqueness constraint on `upiTransactionRef`. Duplicate submission across orders rejected with 400. | `commerce-foundation.spec.ts` (CF.6) |
| **Privilege Escalation** | Unauthenticated user accesses `/api/admin/products`, `/api/admin/inventory`, or `/api/admin/orders` | Cryptographic JWT session validation via `iron-session`/JWT with `HttpOnly`, `SameSite=Lax`, `Secure` cookies. Missing session rejected with 401/403. | `commerce-foundation.spec.ts` (CF.11) |
| **Denial of Service** | Bot floods enquiry or order submission endpoints | Sliding-window IP rate limiting (5 req/min on public form endpoints). Distributed fallback enabled. | `enquiry-workflow.spec.ts` (EW.5) |
| **Data Leakage** | Database credentials or secret keys logged to stdout or exposed via health endpoints | Redaction engine masks passwords, API keys, and database connection strings; health endpoints show boolean flags only (`configured: true`). | `SPRINT_2J_DATABASE_REPORT.md` |
| **PCI-DSS Scope** | Storing customer credit card numbers, CVVs, or cardholder data | **Zero PCI Scope**: The application never touches, requests, or stores payment card data. All payments are out-of-band UPI QR or physical COD. | Zero PCI liability confirmed by architecture. |
| **SQL Injection** | Attacker crafts malicious strings in search, filters, or order forms | 100% parameterized queries via Prisma ORM. No raw SQL concatenation (`$queryRawUnsafe` strictly prohibited). | Monorepo AST grep: 0 unsafe raw queries. |
| **Cross-Site Scripting (XSS)** | Malicious HTML/JS injected into enquiry notes or customer addresses | React automatic JSX escaping; strict Content Security Policy (`default-src 'self'`); Zod string sanitization. | `admin-security.spec.ts` |
| **CSRF** | Cross-origin form submission initiating unauthorized state changes | `SameSite=Lax` cookies; JSON Content-Type requirement; custom header verification on mutation routes. | Monorepo API route audit. |
| **Inventory Overselling** | Concurrent checkout requests for the last handcrafted jewelry piece | Atomically managed reservations with 15-minute TTL; checkout checks active reservation count. | `commerce-foundation.spec.ts` (CF.4) |

---

## 3. Deep Dive: Zero PCI-DSS Compliance Profile

Many e-commerce merchants struggle with PCI-DSS compliance audits, SAQ-A questionnaires, and third-party script vulnerabilities (e.g. Magecart attacks targeting hosted iframe inputs).

### NAVA CREATIONS Zero PCI Architecture:
1. **No Card Data:** The application does not contain a single input field, form, model, or database column for Card Number, Expiration Date, CVV/CVC, or Cardholder Name.
2. **No UPI PINs:** The customer completes payment inside their trusted Indian banking application (GPay, PhonePe, Paytm, BHIM) on their personal mobile device. The website only receives the transaction reference (UTR).
3. **No Third-Party Hosted Iframes:** Because Razorpay was completely removed, no external JavaScript SDK (`checkout.razorpay.com`) is injected into the customer's browser DOM, eliminating external supply chain injection vectors.
4. **Audit Scope:** The merchant qualifies for the lowest possible audit footprint, requiring zero PCI-DSS attestation.

---

## 4. Role-Based Access Control (RBAC) & Administrative Boundaries

Administrative operations are strictly segmented:

```
[Public Storefront]
       │
       ▼
   /api/orders (POST)          --> Public (Rate Limited)
   /api/enquiries (POST)       --> Public (Rate Limited)
   /api/health/liveness        --> Public (Status Only)
       │
       ├─── [Authentication Boundary (Session Cookie required)] ───┐
       │                                                           ▼
       │                                              /api/admin/login (POST)
       ▼
[Admin Backoffice]
   /api/admin/orders           --> Requires Role: OWNER | MANAGER
   /api/admin/orders/:id/verify--> Requires Role: OWNER | MANAGER
   /api/admin/products         --> Requires Role: OWNER | MANAGER
   /api/admin/inventory        --> Requires Role: OWNER | MANAGER
```

### Verification Test:
In `apps/web/e2e/commerce-foundation.spec.ts`:
- Unauthenticated requests to `/api/admin/products` receive HTTP 401 Unauthorized.
- Unauthenticated requests to `/api/admin/inventory` receive HTTP 401 Unauthorized.
- Unauthenticated verification attempts receive HTTP 401 Unauthorized.

---

## 5. Audit Logging & State Transition Accountability

All financial and inventory state transitions record complete immutable provenance:
1. `performedByUserId`: Identity of the administrator who verified or rejected the payment.
2. `timestamp`: High-precision UTC timestamp.
3. `reason`: Mandatory justification note (e.g., `"Verified against HDFC Bank Current Account statement"`).
4. `sourceIp`: Masked client IP address.

Once written to `OrderStatusHistory`, records are immutable. No `UPDATE` or `DELETE` API endpoints exist for audit tables.

---

## 6. Secret Hygiene & Environment Validation

1. `.env.local` is strictly excluded in `.gitignore`.
2. No live secret keys, passwords, or tokens are committed to source control.
3. Validation in `packages/config/src/env.ts` uses Zod schemas:
   - Throws clear errors on missing required keys.
   - Masks sensitive values (`postgresql://user:****@host:5432/db`) in any diagnostic output.
4. Zero third-party telemetry or unapproved tracking scripts are bundled.

---

## 7. Security Review Verdict: PASS

The security architecture of NAVA CREATIONS Sprint 2J meets all requirements for a sovereign, secure, small-business Indian e-commerce application. All automated security regression tests pass without failure.
