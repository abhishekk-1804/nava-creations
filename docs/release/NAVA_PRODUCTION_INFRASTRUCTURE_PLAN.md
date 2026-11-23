# NAVA CREATIONS — PRODUCTION INFRASTRUCTURE PLAN (CORRECTED)
**Document Identifier:** `NAVA-INFRA-PROD-02`  
**Execution Timestamp:** 2026-11-14T09:12:00+05:30  
**Scope:** Apex Domain, Production Cloud Topology, and Security Safeguards  
**Status:** **CORRECTED — AWAITING OWNER HOSTING & DOMAIN DECISIONS**  

---

## 1. DOMAIN & DNS SPECIFICATION

### 1.1 Apex Domain Topology
- **Primary Public Storefront:** `https://navacreations.in`
- **Secondary Subdomain:** `https://www.navacreations.in` (Permanent 301 redirect to apex)
- **Staging Preview:** `https://staging-preview.navacreations.in` (Isolated from production data)

### 1.2 Authoritative DNS Record Configuration (via Cloudflare DNS)
| Record Type | Name / Host | Target / IP Address | TTL | Purpose |
| :---: | :---: | :--- | :---: | :--- |
| **A** | `@` (apex) | `<PRODUCTION_SERVER_STATIC_IP>` | Auto / 300 | Routes apex web traffic to production server |
| **CNAME** | `www` | `navacreations.in` | Auto / 300 | Redirects `www` subdomain to apex |
| **CNAME** | `staging` | `<CLOUDFLARE_TUNNEL_OR_STAGING_HOST>` | Auto / 300 | Routes staging traffic to isolated staging host |
| **TXT** | `@` | `v=spf1 include:... ~all` | 3600 | SPF record for transactional studio email |

---

## 2. PRODUCTION INFRASTRUCTURE TOPOLOGY

```
========================================================================================
                      PRODUCTION INFRASTRUCTURE TOPOLOGY
========================================================================================
[Internet / Customer Browser] 
           │
           ▼ (HTTPS / Port 443)
[Cloudflare Edge / Reverse Proxy] (TLS Termination, WAF, DDoS Mitigation, Free DNS)
           │
           ▼ (Encrypted Origin Tunnel or Port 443)
[Production Server Instance] (Oracle Always Free PAYG or Low-Cost VPS ~₹350/mo)
  │
  ├─ [Nginx Reverse Proxy] (Port 80/443, SSL via Certbot, Gzip/Brotli compression)
  │      │
  │      ▼ (HTTP / Port 3000)
  ├─ [Next.js 15 Standalone Node Runtime] (PM2 or Docker managed process)
  │      │
  │      ├─ [Local Cron Timer (systemd)] ──> curl localhost:3000/api/cron/release-reservations
  │      │                                  (Every 10 min, Bearer: CRON_SECRET)
  │      ▼ (TCP / Port 5432, Unix Socket)
  └─ [PostgreSQL 16 Engine] (Dedicated local cluster, NVMe storage)
         │
         ├─ [Role: nava_app] ────> DML only (SELECT, INSERT, UPDATE, DELETE)
         ├─ [Role: nava_migrator] > DDL owner (prisma migrate deploy only)
         │
         └─ [Daily Backup Routine (pg_dump)] ──> /var/backups/nava/ (Gzipped)
                                             ──> Synced to Cloudflare R2 (₹0 storage)
========================================================================================
```

---

## 3. TECHNICAL PRIVACY SAFEGUARDS (DATA PROTECTION)

> [!NOTE]
> The following items describe **technical security controls** implemented within the software architecture. They support privacy best practices but do **NOT** constitute certified or full legal compliance under the Digital Personal Data Protection (DPDP) Act, 2023. Formal legal compliance requires business-level governance, legal policy review, and statutory grievance mechanisms.

1. **IDOR Enumeration Defense:** `/api/orders/[orderNumber]` requires an authentic administrative session or an HMAC SHA-256 guest access token. Unauthenticated requests strictly return HTTP 404 (never 401 or distinctive error codes) to prevent automated order number enumeration.
2. **Stateless HMAC Guest Tokens:** Derived from `ADMIN_AUTH_SECRET` over `${orderNumber}:${createdAt.getTime()}` and verified using `crypto.timingSafeEqual` to prevent side-channel timing attacks.
3. **Database Privilege Boundaries:** Application runtime role `nava_app` cannot access migration tables, alter schemas, or execute destructive DDL.
4. **Credential Sanitation:** Database connection strings, passwords, and signing secrets are excluded from logs, error responses, and repository tracking.
5. **Session Invalidation:** Administrative logout sets `isRevoked: true` on the hashed token in `admin_sessions` and clears the browser cookie with `maxAge: 0`.

---

## 4. SCHEDULED RESERVATION CLEANUP ARCHITECTURE

- **Authoritative Route:** `/api/cron/release-reservations` (resolves all earlier references to `/api/cron/release-expired-reservations`).
- **Execution Interval:** Every **10 minutes**.
- **Execution Mechanism (Self-Hosted / VPS):** Local systemd timer or crontab:
  ```bash
  # /etc/cron.d/nava-reservation-cleanup
  */10 * * * * root curl -s -f -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/release-reservations > /dev/null 2>&1
  ```
- **Execution Mechanism (External Pinger):** Free scheduled cron pinger (e.g. cron-job.org or GitHub Actions workflow) sending an authenticated HTTP GET request with `Authorization: Bearer <CRON_SECRET>`.
- **Fail-Safe Behavior:** Only releases holds for orders in `PENDING` status older than 15 minutes. Orders where a customer submitted a UPI UTR (`AWAITING_PAYMENT_VERIFICATION`) are strictly shielded from inventory cancellation.

---

## 5. DATABASE BACKUP & RESTORATION PROCEDURES

### 5.1 Automated Daily Backup Routine (`backup-db.sh`)
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/backups/nava"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/nava_prod_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

# Execute custom format dump
pg_dump -U nava_migrator -d nava_prod --format=custom --no-owner --no-acl | gzip > "$FILENAME"

# Retain 14 days locally
find "$BACKUP_DIR" -type f -name "nava_prod_*.sql.gz" -mtime +14 -delete

# Optional: Sync to free Cloudflare R2 bucket using rclone / aws-cli
# rclone copy "$FILENAME" r2:nava-backups/
```

### 5.2 Restoration Protocol
1. Stop the web application service (`systemctl stop nava-web`).
2. Restore database to a clean target:
   ```bash
   gunzip -c /var/backups/nava/nava_prod_<TIMESTAMP>.sql.gz | pg_restore -U postgres -d nava_prod --clean --if-exists
   ```
3. Restart web application service (`systemctl start nava-web`).
4. Validate readiness probe (`curl http://127.0.0.1:3000/api/health/readiness`).
