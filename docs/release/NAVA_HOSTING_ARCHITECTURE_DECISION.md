# NAVA CREATIONS — HOSTING ARCHITECTURE DECISION (CORRECTED)
**Document Identifier:** `NAVA-HOSTING-DECISION-02`  
**Execution Timestamp:** 2026-11-14T09:10:00+05:30  
**Budget Mandate:** Strict Free-First Strategy (₹0 recurring preferred; transparent budget alternatives)  
**Status:** **CORRECTED — READY FOR OWNER DECISION**  

---

## 1. CRITICAL CORRECTIONS TO PREVIOUS ASSUMPTIONS

### 1.1 Vercel Hobby Terms & Cron Frequency Incompatibility
- **Commercial Usage Prohibition:** Section 1 of the Vercel Terms of Service explicitly restricts Hobby accounts to **personal, non-commercial use** (personal blogs, portfolios, open-source projects). Commercial e-commerce stores accepting customer orders and payments are strictly prohibited on Hobby. A commercial deployment requires **Vercel Pro** ($20/month per user, ~₹1,700/mo).
- **Cron Frequency Restriction:** On Vercel Hobby, cron jobs are restricted to **once per day** (`0 0 * * *`). The NAVA inventory reservation cleanup requires execution **every 10–15 minutes** (`*/10 * * * *` or `*/15 * * * *`) to release abandoned cart holds. Vercel Hobby **cannot execute our reservation release schedule**.
- **Conclusion:** Vercel Hobby cannot be recommended for production. It is suitable only for temporary, pre-commercial staging testing if acceptable under personal development terms, or must be replaced by standard Node.js hosting.

### 1.2 Oracle Cloud Always Free Limitations & Reclamation Risk
- **Specifications:** 
  - Up to 4 OCPUs of Arm-based Ampere A1 Compute and 24 GB RAM (usable as 1 VM or split).
  - 2 AMD-based Compute VMs (1/8 OCPU, 1 GB RAM each) — underpowered for Next.js 15 SSR.
  - Up to 200 GB total Block Volume storage.
  - 10 TB/month outbound data transfer; 1 public IPv4 per VM.
- **Critical Operational Risks (Why it is NOT "Guaranteed Permanent ₹0"):**
  1. **Regional Capacity Exhaustion:** In key regions (e.g. Mumbai, Hyderabad), provisioning Ampere A1 shapes frequently fails with `Out of host capacity` errors for free accounts.
  2. **7-Day Idle Reclamation Policy:** Oracle automatically terminates or reclaims compute instances that fall below 20% CPU utilization (95th percentile), 20% memory, and 20% network for 7 consecutive days. Low-traffic storefronts risk automated instance shutdown unless artificial workload is generated or the account is upgraded to **Pay As You Go (PAYG)** with a verified credit card (PAYG retains the free tier allowance while exempting instances from idle reclamation).
  3. **High Operational Complexity:** Requires complete self-management: Linux OS patching, systemd process management (PM2/Docker), firewall configuration, Nginx reverse proxy, Certbot SSL rotation, and automated database backups.

### 1.3 Neon Serverless Postgres Free-Tier Limits & Suspension
- **Compute & Storage:** 1 shared vCPU, up to 0.5 GB RAM, and **0.5 GB storage**.
- **Active Hours Allowance:** Neon allocates **100 compute hours/month** on the Free tier.
- **Scale-to-Zero Inactivity Behavior:** After **5 minutes** of inactivity, the compute instance suspends. The next incoming query incurs a cold start of **500ms to 2.5 seconds**.
- **Keep-Alive Exhaustion Warning:** A scheduled ping running every 10 minutes to keep the database awake consumes 24 hours/day * 30 days = 720 compute hours/month, which will **exhaust Neon's 100 free compute hours within ~4 days**, forcing compute suspension.
- **Conclusion:** Neon Free is viable for staging and low-frequency development, but cannot support 24/7 un-suspended production without upgrading to Neon Launch ($19/month, ~₹1,600/mo).

---

## 2. HOSTING COMPARISON MATRIX

| Evaluation Factor | Option 1: True Free-First (OCI PAYG / Self-Hosted VPS) | Option 2: Low-Cost Dedicated VPS (Hetzner / Hostinger) | Option 3: Commercial Serverless PaaS (Vercel Pro + Neon) | Option 4: Local / Tunnel Staging |
| :--- | :--- | :--- | :--- | :--- |
| **Initial Cost** | **₹0** (temporary refundable card hold) | **₹350 – ₹500** | **₹3,300 – ₹3,800 / month** | **₹0** |
| **Monthly Cost** | **₹0 / month** (within Always Free limits) | **~₹350 – ₹450 / month** (~€3.79/mo) | **$39 – $45 / month** (~₹3,500/mo) | **₹0 / month** |
| **Commercial Terms** | Full commercial use permitted | Full commercial use permitted | Compliant with commercial terms | Development / Staging only |
| **Next.js 15 Support** | Native Node.js / Docker standalone | Native Node.js / Docker standalone | Native Edge + Serverless | Native local runtime |
| **Database Compute** | Full PostgreSQL 16 on local NVMe | Full PostgreSQL 16 on local NVMe | Managed Neon (0.5 GB free or $19 paid) | Local PostgreSQL 16 (`nava_gateb_test`) |
| **Database Suspension** | **Never sleeps (24/7 continuous)** | **Never sleeps (24/7 continuous)** | Suspends after 5 min idle (Free tier) | Never sleeps |
| **Cron Scheduling** | Linux systemd timer / crontab (any interval) | Linux systemd timer / crontab (any interval) | 1-min interval (Pro only; Hobby: 1/day) | OS cron / Node runner |
| **Operational Effort** | High (Linux administration) | Moderate (Standard Ubuntu VPS) | Very Low (Managed Git deployment) | Zero (Local test environment) |
| **Suitability** | **Recommended for Zero-Budget Production** | **Recommended for Reliable Production** | Expensive for early-stage boutique | **Recommended for Staging Validation** |

---

## 3. SEPARATION OF STAGING VS PRODUCTION RECOMMENDATIONS

### 3.1 Recommended Staging Architecture
**Goal:** Complete, legal, zero-cost verification of the customer and admin experience with zero external dependencies.

- **Approach A (Local/WSL Automated Staging):**
  - Web Server: Next.js production build (`next start -p 3000`) on local host.
  - Database: Local PostgreSQL 16 with isolated test database `nava_gateb_test`.
  - Verification: 234/234 automated Playwright, domain, and concurrency tests (already verified).
  - Cost: **₹0**.
- **Approach B (Remote Staging for Owner Mobile Review):**
  - Host the production build locally or on a free temporary VM and expose via **Cloudflare Tunnel (`cloudflared`)** to a private staging URL (e.g., `https://staging-preview.navacreations.in`).
  - Completely free, requires zero paid accounts, exposes no ports, and does not violate any hosting terms of service.
  - Cost: **₹0**.

### 3.2 Recommended Production Architecture

#### Path A: Strictly Free-First (Owner willing to handle/upgrade OCI PAYG)
- **Host:** Oracle Cloud Always Free Ampere A1 (with PAYG account upgrade to avoid 7-day idle reclamation).
- **Web App:** Next.js 15 standalone server managed by PM2 or Docker.
- **Database:** Dedicated PostgreSQL 16 instance installed on the same VM with automated local daily `pg_dump` snapshots.
- **Scheduled Cron:** Linux systemd timer triggering `/api/cron/release-reservations` every 10 minutes locally via curl.
- **Reverse Proxy & SSL:** Nginx + Certbot (Let's Encrypt) or Cloudflare Edge SSL.
- **Estimated Monthly Cost:** **₹0 / month**.
- **Prerequisite:** Successful OCI account registration and Ampere A1 instance availability in regional pool.

#### Path B: High-Reliability Low-Cost VPS (Recommended if OCI capacity is unavailable)
- **Host:** Hetzner Cloud CX22 (2 vCPU, 4GB RAM, 40GB NVMe) or Hostinger KVM 1.
- **Web App + DB:** Single persistent server hosting Next.js 15 + PostgreSQL 16 + daily backups.
- **Estimated Monthly Cost:** **~₹350 – ₹450 / month** (~₹4,200 – ₹5,400 / year).
- **Benefits:** Zero cold starts, zero capacity queues, 100% predictable performance, and total ownership of database data.

---

## 4. REALISTIC COST PROJECTION LEDGER (YEAR 1)

| Cost Category | Item Description | Strictly Free (Path A) | Budget VPS (Path B) | Commercial PaaS (Path C) |
| :--- | :--- | :---: | :---: | :---: |
| **Domain Registration** | `navacreations.in` (1st Year) | ₹499 – ₹699 | ₹499 – ₹699 | ₹499 – ₹699 |
| **Domain Renewal** | `navacreations.in` (Year 2+) | ~₹799 – ₹999/yr | ~₹799 – ₹999/yr | ~₹799 – ₹999/yr |
| **DNS, CDN & TLS** | Cloudflare Free Plan | ₹0 | ₹0 | ₹0 |
| **Web Hosting** | Server instance | ₹0 (OCI Free) | ~₹4,200 – ₹5,400/yr | ~₹20,400/yr ($20/mo) |
| **Database Hosting** | PostgreSQL engine | ₹0 (Co-located) | ₹0 (Co-located) | ~₹19,200/yr ($19/mo) |
| **Off-Site Backups** | Cloudflare R2 (10 GB free) | ₹0 | ₹0 | ₹0 |
| **Cron Scheduling** | Systemd / Local Timer | ₹0 | ₹0 | Included in Vercel Pro |
| **Payment Gateway MDR**| BharatPe UPI QR Direct | ₹0 (0% MDR) | ₹0 (0% MDR) | ₹0 (0% MDR) |
| **TOTAL YEAR 1 COST** | | **₹499 – ₹699** | **~₹4,700 – ₹6,100** | **~₹40,100 – ₹42,000** |

---

## 5. REQUIRED OWNER DECISIONS

1. **Staging Review Method:** Approve either **Approach A (Local/WSL automated test review)** or **Approach B (Cloudflare Tunnel to mobile preview)**.
2. **Production Hosting Path:** Choose between:
   - **Path A (Strictly Free ₹0/mo):** Requires owner to register for Oracle Cloud Infrastructure and upgrade to PAYG with a credit card to avoid instance reclamation.
   - **Path B (Budget Dedicated VPS ~₹350–₹450/mo):** Recommended for zero headache, instant provisioning, and zero capacity lottery.
3. **Domain Ownership:** Confirm owner purchase of `navacreations.in` via registrar (e.g. Cloudflare / Namecheap / GoDaddy).
