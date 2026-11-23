# NAVA CREATIONS — HOSTING AND INFRASTRUCTURE ARCHITECTURE
**Document ID:** `DOC-G2-PHASE1-INFRA`  
**Generated At:** 2026-11-15T09:51:30+05:30  
**Repository:** `D:\NAVA`  
**Branch:** `feature/production-readiness`  
**Role:** Cloud Infrastructure Architect & Production Operations Engineer  

---

## 1. EXECUTIVE SUMMARY & ARCHITECTURAL OBJECTIVES

NAVA CREATIONS is an Indian artisanal luxury e-commerce platform specialising in bespoke bridal chudas, lac bangles, and heirloom jewellery. The platform's computational and infrastructural design must satisfy four core operational realities:
1. **Low Latency Across India:** Fast First Contentful Paint (FCP) and Time to Interactive (TTI) on 4G/5G mobile networks across Tier-1, Tier-2, and Tier-3 Indian cities (e.g., Mumbai, Bengaluru, Delhi NCR, Jaipur, Hyderabad, Lucknow).
2. **Database Concurrency & Inventory Integrity:** Strict row-level isolation and atomic transactional safety during burst traffic events (such as festive wedding season drops and bridal trunk shows) without exhausting database connection pools.
3. **Sovereign India-First Payments & Cron Workflows:** Guaranteed 15-minute reservation expiration cycles without reliance on unviable or throttled free-tier cron schedulers.
4. **Cost-Predictable Evolution:** Zero upfront infrastructure lock-in during pre-revenue soft launch, transitioning seamlessly into a resilient, high-availability architecture as monthly order volumes scale.

---

## 2. HOSTING PLATFORM & DATABASE EVALUATION (14 CRITERIA)

To establish an authoritative hosting strategy, six candidate infrastructure combinations were evaluated against fourteen objective architectural criteria:

| Evaluation Criterion | Vercel (Pro) + Neon Postgres | Supabase Managed + Vercel | Cloudflare Pages + Workers | AWS Lightsail / EC2 + RDS | Oracle Always Free (OCI) | Railway / Render + Managed PG |
|:---|:---|:---|:---|:---|:---|:---|
| **1. Cold Start Performance** | ~150–250ms (V8 Edge / Node 20 Serverless) | ~200–300ms | < 50ms (V8 Isolates) | 0ms (Persistent Node container) | 0ms (Persistent VM) | ~300ms (Auto-sleep if paused) |
| **2. Edge Middleware Compatibility** | Native Next.js App Router & Edge Middleware support | Native via Vercel Edge | Requires `@cloudflare/next-on-pages` adapter | Manual reverse proxy (Nginx / CloudFront) | Manual reverse proxy (Nginx / Caddy) | Limited Edge runtime support |
| **3. Prisma ORM & Pooling** | Native PgBouncer / Neon Pooling (`DIRECT_URL` + `DATABASE_URL`) | Supabase Connection Pooler (Supavisor / port 6543) | Hyperdrive required; Prisma driver limitations | AWS RDS Proxy or self-hosted PgBouncer | Self-hosted PgBouncer required | Managed PgBouncer add-on |
| **4. Cron Capabilities** | Sub-minute crons on Pro; 1/day on Hobby | pg_cron extension built-in | Cloudflare Cron Triggers (1-min frequency) | Native Linux systemd / crontab | Native Linux systemd / crontab | Native Cron Jobs service |
| **5. Egress / Bandwidth Pricing** | 1 TB included; $0.15/GB overage | 250 GB included; $0.09/GB overage | Free unlimited bandwidth (Workers Paid) | 1–3 TB included in bundle | 10 TB/month free outbound | $0.10/GB overage |
| **6. Indian Edge CDN Latency** | Anycast CDN with PoPs in BOM, DEL, HYD, BLR, MAA | Cloudflare Anycast CDN (via Vercel frontend) | 300+ PoPs globally; 12+ PoPs in India | CloudFront PoPs across India | OCI Mumbai & Hyderabad regions | Cloudflare frontend recommended |
| **7. SSL & Domain Management** | Automatic Let's Encrypt Wildcard SSL & Apex ALIAS | Automatic via frontend provider | Universal SSL, automated edge certificates | AWS Certificate Manager (ACM) + Route 53 | Manual Certbot / Let's Encrypt renewal | Automated Let's Encrypt |
| **8. Secrets Encryption at Rest** | AES-256 encrypted environment variables | Vault / pgcrypto at rest | Encrypted secrets store | AWS Secrets Manager / Parameter Store | OCI Vault | Encrypted environment variables |
| **9. Team RBAC & Audit Logs** | Granular team roles, deployment protection | Project-level RBAC & audit logs | Zero Trust access policies & IAM | AWS IAM with comprehensive CloudTrail | OCI Identity & Access Management | Team permissions |
| **10. Disaster Recovery & Snapshots** | Git-backed instant rollbacks; Neon branching | Daily automatic backups + WAL PITR | D1 point-in-time recovery | Automated EBS & RDS snapshots | Manual block storage backups | Automated daily snapshots |
| **11. SLA & Enterprise Reliability** | 99.99% Enterprise; 99.9% Pro | 99.9% compute & database | 99.99% Edge network | 99.95% to 99.99% | No formal SLA on Always Free | 99.9% uptime |
| **12. Cost Predictability (INR)** | Highly predictable ($20/seat/mo ≈ ₹1,700) | Highly predictable ($25/project/mo ≈ ₹2,100) | $5/month base (≈ ₹425) | Predictable flat bundle ($10–$40/mo) | ₹0 (Strictly dependent on account standing) | Predictable usage-based tiers |
| **13. Ease of Rollback** | 1-Click instant deployment alias shift | Frontend instant; database via snapshot | Instant rollback to previous deployment | Blue/Green deployment pipeline required | Manual git checkout & restart | 1-Click deployment rollback |
| **14. Vendor Lock-In Risk** | Low (Next.js is open source, runs on Node) | Low (Postgres is standard ANSI SQL) | Moderate (Workers runtime API lock-in) | Low (Standard Linux + PostgreSQL) | Low (Standard Linux VM) | Low (Standard Docker / Node.js) |

---

## 3. ARCHITECTURE SEPARATION: STAGING VS PRODUCTION

### 3.1 Free-First Staging Stack (Pre-Launch & Verification)
Designed to run local verification, PR branch previews, and pre-production staging at **₹0 operational expenditure**:

```
+-------------------------------------------------------------------------+
|                       STAGING INFRASTRUCTURE (₹0)                       |
+-------------------------------------------------------------------------+
|                                                                         |
|  [ GitHub Pull Request / Push ]                                         |
|                 |                                                       |
|                 v                                                       |
|  [ GitHub Actions CI Runner ] ---------------------------------------+  |
|         - pnpm typecheck, lint, build                                |  |
|         - Isolated PostgreSQL Service Container (Test Database)       |  |
|         - Playwright 162/162 E2E Suite Execution                     |  |
|                 |                                                    |  |
|                 v (On Merge to Staging Branch)                       |  |
|  [ Vercel Preview / Staging Deployment ]                             |  |
|         - Edge Middleware (Basic Auth for Staging Protection)        |  |
|         - Node.js 20 Serverless Runtime                              |  |
|                 |                                                    |  |
|                 +---------> [ Neon Free Postgres / Supabase Free ]   |  |
|                                    - Shared Compute (0.25 vCPU)      |  |
|                                    - 0.5 GB Storage                  |  |
|                                    - PgBouncer Pooled Connection     |  |
|                                                                         |
+-------------------------------------------------------------------------+
```

> [!WARNING]
> **Vercel Hobby Tier Cron Constraint:**
> Vercel's Hobby tier restricts cron triggers to **at most once per calendar day**. NAVA's inventory engine requires `release-reservations` to run every **15 minutes** to return expired temporary carts back to available stock. In Staging, this is driven via a **GitHub Actions Scheduled Workflow (`.github/workflows/reservation-cleanup-cron.yml`)** running on a `*/15 * * * *` cron schedule, authenticating via `x-cron-secret`.

---

### 3.2 Production Architecture (Launch & Scaling)
Designed for 99.95% availability, strict transactional integrity, and compliance with the Indian Digital Personal Data Protection (DPDP) Act 2023:

```
                                  [ CUSTOMER (Mobile / Desktop) ]
                                                |
                                                | HTTPS (TLS 1.3)
                                                v
                              +-----------------------------------+
                              |   CLOUDFLARE ENTERPRISE CDN/DNS   |
                              |   - navacreations.com (Apex)      |
                              |   - Indian PoPs (BOM, DEL, BLR)   |
                              |   - WAF & DDoS Layer 7 Shield     |
                              |   - Auto Brotli / WebP / AVIF     |
                              +-----------------------------------+
                                                |
                                                | Secure Anycast Tunnel
                                                v
                              +-----------------------------------+
                              |       VERCEL PRODUCTION PRO       |
                              |   - Edge Middleware (Auth & Guard)|
                              |   - Next.js 15 App Router         |
                              |   - Native Vercel Cron (*/15 min) |
                              |   - Zero-Downtime Deployment Shift|
                              +-----------------------------------+
                                        |                   |
               Internal Microservice    |                   | Direct HTTPS
               Calls (Encrypted)        |                   v
                                        |         +-----------------------+
                                        |         | RESEND TRANSACTIONAL  |
                                        |         | - Order Confirmation  |
                                        |         | - Shipping Tracking   |
                                        |         +-----------------------+
                                        v
                    +---------------------------------------+
                    |    MANAGED POSTGRESQL (Aiven / Neon)  |
                    |    - AWS Mumbai (ap-south-1)          |
                    |    - PgBouncer Transaction Pooler     |
                    |    - Auto Storage Scaling & Snapshots |
                    |    - Standby High-Availability Replica|
                    +---------------------------------------+
```

---

## 4. DATABASE CONNECTION POOLING ARCHITECTURE

Next.js App Router executes serverless functions statelessly. Under sudden spikes in traffic (e.g. promotional influencer campaigns), hundreds of ephemeral serverless instances may spawn simultaneously. Direct connections to PostgreSQL will trigger connection exhaustion (`FATAL: remaining connection slots are reserved for non-replication superuser connections`).

To permanently eliminate this vulnerability, the platform employs a dual-URL architecture supported by Prisma ORM:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL") // Transaction-mode pooled connection (PgBouncer port 6543)
  directUrl = env("DIRECT_URL")   // Session-mode direct connection (Postgres port 5432)
}
```

### 4.1 Parameterized Connection Configurations
1. **Runtime Application Queries (`DATABASE_URL`):**
   - Configured with `pgbouncer=true&connection_limit=15&pool_timeout=10`.
   - Utilises PgBouncer transaction-level pooling. Each transaction borrows a connection only for the duration of the query block, allowing 100 concurrent serverless functions to share 10–15 underlying database connections.
2. **Prisma Migrations & CLI (`DIRECT_URL`):**
   - Direct connection to PostgreSQL port 5432.
   - Bypasses PgBouncer because transactional pooling does not support advisory locking (`pg_advisory_lock`), prepared statements, or table-level `ALTER TABLE` DDL operations required during schema migrations.

---

## 5. CRON TRIGGER MECHANICS: INVENTORY RESERVATION CLEANUP

NAVA implements a high-integrity inventory reservation model. When a customer adds items to their bag or initiates checkout, stock is atomically reserved for **15 minutes**. If the order is abandoned or payment is not completed within that window, the stock must be released.

### 5.1 Route Security Specifications
- **Endpoint:** `POST /api/cron/release-reservations`
- **Method Restriction:** Strictly rejects `GET`, `PUT`, `DELETE`, `PATCH` with `405 Method Not Allowed` and `Allow: POST` header.
- **Authentication:** Enforces constant-time cryptographic verification (`crypto.timingSafeEqual`) against `CRON_SECRET`.
- **Accepted Headers:**
  - `Authorization: Bearer <CRON_SECRET>`
  - `x-cron-secret: <CRON_SECRET>`

### 5.2 Vercel Production Cron Configuration (`vercel.json`)
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/release-reservations",
      "schedule": "*/15 * * * *"
    }
  ]
}
```
*Note: Vercel automatically passes `Authorization: Bearer <CRON_SECRET>` on registered cron jobs when `CRON_SECRET` is defined in Vercel Environment Variables.*

---

## 6. DOMAIN, DNS & SSL ARCHITECTURE FOR INDIAN CONSUMERS

### 6.1 Domain Topology
- **Primary Canonical Production Domain:** `https://navacreations.com`
- **Redirect Domain:** `https://www.navacreations.com` $\rightarrow$ Permanent 301 Redirect to Apex `https://navacreations.com`.
- **Staging / QA Domain:** `https://staging.navacreations.com` (Restricted via HTTP Basic Auth).

### 6.2 DNS Configuration Table (Cloudflare DNS Proxying)

| Type | Name | Target / Content | Proxy Status | TTL | Purpose |
|:---|:---|:---|:---:|:---:|:---|
| **A** | `@` (Apex) | `76.76.21.21` (Vercel Anycast) | DNS Only (Gray) / Proxied | Auto | Primary apex routing |
| **CNAME** | `www` | `cname.vercel-dns.com` | DNS Only (Gray) / Proxied | Auto | WWW subdomain alias |
| **CNAME** | `staging` | `cname.vercel-dns.com` | DNS Only | Auto | Pre-production preview |
| **TXT** | `@` | `v=spf1 include:_spf.resend.com ~all` | — | 3600 | SPF Email Authentication |
| **CNAME** | `resend._domainkey` | `dkim.resend.com` | DNS Only | Auto | DKIM Cryptographic Signature |
| **TXT** | `_dmarc` | `v=DMARC1; p=reject; rua=mailto:dmarc@navacreations.com` | — | 3600 | DMARC Phishing Shield |

---

## 7. MONTHLY OPERATIONAL COST PROJECTIONS (INR & USD)

Financial models are calculated for three operational milestones to guarantee budget predictability:

### Scenario A: Soft Launch (0 to 500 Orders / Month)
*Target: Minimal operational overhead, high reliability.*
- **Frontend / Compute:** Vercel Hobby (with GitHub Actions cron) or Vercel Pro ($20/mo) = **₹1,700**
- **Database:** Neon Serverless Postgres (Free tier: 0.5 GB storage, shared compute) = **₹0**
- **Transactional Email:** Resend Free Tier (3,000 emails/mo, 100/day limit) = **₹0**
- **DNS & CDN:** Cloudflare Free Plan (DDoS protection, Global Anycast) = **₹0**
- **Total Estimated Monthly Expenditure:** **₹1,700 ($20 USD)**

### Scenario B: Growth Stage (500 to 2,500 Orders / Month)
*Target: Automated scaling, dedicated database compute, transactional SLAs.*
- **Frontend / Compute:** Vercel Pro (Single team seat, unlimited deployments, native crons) = **₹1,700** ($20)
- **Database:** Neon Scale / Aiven PostgreSQL (AWS Mumbai ap-south-1, 1 vCPU, 4GB RAM, 25GB SSD) = **₹2,975** ($35)
- **Transactional Email:** Resend Pro (50,000 emails/mo, dedicated IP option) = **₹1,700** ($20)
- **Logistics Integration:** Shiprocket Free/Silver Tier = **₹0** (pay per dispatched shipment)
- **Total Estimated Monthly Expenditure:** **₹6,375 ($75 USD)**

### Scenario C: High Season / Festive & Bridal Rush (2,500 to 10,000+ Orders / Month)
*Target: High-concurrency database replication, burst traffic resilience, 24/7 logging.*
- **Frontend / Compute:** Vercel Pro (2 Team Seats + Bandwidth Expansion) = **₹4,250** ($50)
- **Database:** Managed Multi-AZ PostgreSQL (AWS Mumbai ap-south-1, 2 vCPU, 8GB RAM, High-IOPS NVMe) = **₹8,500** ($100)
- **Transactional Email:** Resend Pro (100,000 emails/mo, custom DKIM) = **₹3,400** ($40)
- **Error Tracking & APM:** Sentry Team Tier / Better Stack Logging = **₹2,465** ($29)
- **Total Estimated Monthly Expenditure:** **₹18,615 ($219 USD)**

---

## 8. INFRASTRUCTURE READINESS SIGN-OFF

The architectural recommendations outlined above provide a clear, deterministic roadmap for NAVA CREATIONS. Staging can be maintained indefinitely at zero cost, while production can be launched immediately on standard Pro tiers with full Indian data sovereignty and sub-second edge latency.
