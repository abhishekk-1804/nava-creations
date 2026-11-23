# NAVA CREATIONS — OBSERVABILITY, MONITORING & INCIDENT RESPONSE
**Document ID:** `DOC-G2-PHASE11-OPS`  
**Generated At:** 2026-11-15T09:57:15+05:30  
**Repository:** `D:\NAVA`  
**Branch:** `feature/production-readiness`  
**Role:** Production Operations Engineer & DevSecOps Lead  

---

## 1. OBSERVABILITY ARCHITECTURE & TELEMETRY

NAVA CREATIONS enforces structured observability across three pillars: Structured Logging, Health Probes, and Proactive Alerting.

```
                           [ INCOMING REQUEST ]
                                    |
                                    v
                     +------------------------------+
                     |       EDGE MIDDLEWARE        |
                     | Injects: x-request-id        |
                     +------------------------------+
                                    |
                                    v
                     +------------------------------+
                     |    STRUCTURED JSON LOGGER    |
                     | - Timestamp (ISO 8601)       |
                     | - Correlation Request ID     |
                     | - HTTP Method & Route        |
                     | - Execution Duration (ms)    |
                     | - PII-Redacted Context       |
                     +------------------------------+
                                    |
                     +--------------+--------------+
                     |                             |
                     v                             v
           [ Realtime Console ]          [ Error APM: Sentry ]
           (Vercel / Datadog)            (Unhandled Exceptions)
```

---

## 2. PRODUCTION HEALTH CHECK PROBES

The application exposes standardized health probes in `apps/web/app/api/health/*` (validated by smoke tests):
1. **Liveness Probe (`GET /api/health/live`):**
   - Returns `HTTP 200 { status: "alive", timestamp: "..." }`.
   - Confirms that the Next.js Node.js serverless engine is executing.
2. **Readiness Probe (`GET /api/health/ready`):**
   - Executes an active heartbeat query (`SELECT 1`) against the PostgreSQL database.
   - Returns `HTTP 200 { status: "ready", database: "connected", latencyMs: 4 }`.
   - Returns `HTTP 503 { status: "unready", error: "Database unreachable" }` if database connectivity fails.
3. **Aggregate System Health (`GET /api/health`):**
   - Evaluates overall platform readiness including database, memory, and environment configuration.

---

## 3. SEVERITY TIERS & ALERTING THRESHOLDS

| Tier | Severity | Trigger Conditions | Alert Channel | Response SLA |
|:---:|:---|:---|:---|:---:|
| **P1** | **CRITICAL** | Site unreachable (HTTP 5xx $> 2\%$), Database connection pool exhausted, Cron reservation failure $> 1\text{ hour}$ | PagerDuty / Urgent Phone Call | **$< 15$ minutes** |
| **P2** | **HIGH** | UTR submission failure spike, Checkout error rate $> 5\%$, Admin login lockout storm | Slack `#nava-ops-alerts` + SMS | **$< 45$ minutes** |
| **P3** | **MEDIUM** | p95 API response time $> 1500\text{ ms}$, Variant inventory hits 0 (Sold out) | Slack `#nava-inventory` | **$< 4$ hours** |
| **P4** | **LOW** | Minor non-blocking UI warning, Simulated email delivery log | Daily Digest Email | **$< 24$ hours** |

---

## 4. TEN (10) PRODUCTION INCIDENT RUNBOOKS

### Runbook 1: Database Connection Pool Exhaustion
- **Symptom:** API logs show `FATAL: remaining connection slots are reserved for non-replication superuser connections` or Prisma pool timeout.
- **Immediate Action:**
  1. Confirm `DATABASE_URL` contains `pgbouncer=true&connection_limit=15`.
  2. In database console (Neon / AWS RDS), inspect active sessions: `SELECT count(*), state FROM pg_stat_activity GROUP BY state;`.
  3. Terminate idle zombie connections: `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < current_timestamp - INTERVAL '5' MINUTE;`.
  4. Scale PgBouncer pool ceiling if legitimate burst traffic warrants.

### Runbook 2: Cron Job Failure / Unreleased Inventory Accumulation
- **Symptom:** Customers report popular bangle sizes are "Sold Out", but no orders are completed; cron logs show 401 or 500 errors.
- **Immediate Action:**
  1. Inspect `/api/cron/release-reservations` endpoint logs.
  2. Verify Vercel Cron or GitHub Actions bearer token matches `CRON_SECRET`.
  3. Execute manual emergency cleanup via authorized curl:
     `curl -X POST -H "Authorization: Bearer <CRON_SECRET>" https://navacreations.com/api/cron/release-reservations`.
  4. Confirm stock is returned to `availableQty`.

### Runbook 3: Fraudulent UTR Flood / Duplicate UTR Submissions
- **Symptom:** Admin dashboard shows multiple orders under `AWAITING_PAYMENT_VERIFICATION` with suspicious or repeated UTR references.
- **Immediate Action:**
  1. System deduplication automatically rejects identical UTRs with HTTP 409.
  2. For non-identical fake numbers, store admin inspects bank statement.
  3. Click "Reject Payment" in admin portal $\rightarrow$ transitions order to `CANCELLED` and automatically releases reserved stock.
  4. If IP continues spamming, block IP in Cloudflare WAF.

### Runbook 4: High-Traffic Inventory Contention & Race Conditions
- **Symptom:** Concurrency spikes during bridal promotional drops; customer reports cart validation errors.
- **Immediate Action:**
  1. PostgreSQL row-level locks protect stock from going negative.
  2. Verify no SQL deadlocks in database metrics.
  3. Review `/api/cart/validate` logs; if items are legitimately sold out, UI clearly indicates "Sold Out" status without overselling.

### Runbook 5: Third-Party Email Delivery Outage (Resend Outage)
- **Symptom:** Customers do not receive order confirmation emails; logs show Resend API HTTP 5xx.
- **Immediate Action:**
  1. Email dispatch in NAVA is non-blocking (`try/catch` in `OrderService`). Order creation is **not** aborted if email fails.
  2. Failed emails are flagged with error details in audit log.
  3. When Resend recovers, trigger admin replay script to re-send pending receipts.

### Runbook 6: Accidental Production Secret Disclosure
- **Symptom:** Secret accidentally committed or displayed in build logs.
- **Immediate Action:**
  1. Immediately follow **Phase 2 Secret Rotation Runbook**:
     - Generate new 64-character secret.
     - Update Vercel environment variables.
     - Trigger immediate redeploy.
  2. Audit database query logs for unauthorized administrative operations during exposure window.

### Runbook 7: Order Cancellation / Refund Dispute
- **Symptom:** Customer requests cancellation before dispatch.
- **Immediate Action:**
  1. In admin portal, open order and verify status is `PROCESSING` (not `SHIPPED`).
  2. Click "Cancel Order". System executes atomic transaction:
     - Order status transitions to `CANCELLED`.
     - Inventory is automatically restored to `availableQty`.
  3. Initiate bank IMPS / UPI refund from merchant bank account to customer VPA.
  4. Enter refund reference in admin order notes.

### Runbook 8: Edge Middleware Crash / HTTP 502 Bad Gateway
- **Symptom:** Entire site returns 502; edge middleware fails to execute.
- **Immediate Action:**
  1. Check Vercel Function logs for `assertProductionSecrets()` exception.
  2. Confirm `ADMIN_AUTH_SECRET`, `CRON_SECRET`, and `DATABASE_URL` are properly set in the current deployment environment.
  3. Roll back to previous deployment via Vercel 1-click rollback if code defect is present.

### Runbook 9: Courier AWB Generation Failure / Logistics API Timeout
- **Symptom:** Store manager attempts to ship order, but carrier API times out.
- **Immediate Action:**
  1. Fall back to manual carrier booking on Shiprocket / Blue Dart portal.
  2. Manually paste generated AWB tracking number into NAVA admin portal fulfillment modal.
  3. System updates order to `SHIPPED` and dispatches tracking email with customer carrier link.

### Runbook 10: Domain DNS Hijack / SSL Expiration Warning
- **Symptom:** Browser displays SSL security warning or DNS resolution fails.
- **Immediate Action:**
  1. Verify Cloudflare Universal SSL certificate status.
  2. Confirm DNS records point to Vercel Anycast IP `76.76.21.21`.
  3. Force certificate renewal in Vercel / Cloudflare dashboard.
