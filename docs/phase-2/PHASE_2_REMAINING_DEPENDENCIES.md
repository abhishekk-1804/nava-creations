# NAVA CREATIONS — PHASE 2 REMAINING DEPENDENCIES
## Pre-Cutover Critical Path & Post-Launch Phase 3 Enhancement Roadmap

**Repository:** `D:\NAVA`  
**Milestone:** Phase 2 Master Commerce Foundation  
**Governance Framework:** Google Elephant-Goldfish Model (EGM)  
**Date of Audit:** 2026-11-12  

---

## 1. Executive Summary & Dependency Topology

Phase 2 commerce foundation engineering is **100% complete in code, schema, and tests**. No further software development or architectural modifications are required for Phase 2.

All remaining activities are categorized into:
- **Tier 1 (Immediate Pre-Flight Prerequisites):** Non-code operational configurations required to cut over from staging to live production.
- **Tier 2 (Post-Launch Phase 3 Enhancements):** Optional commercial automation integrations scheduled after initial sales traction.

```mermaid
graph TD
    subgraph Tier 1: Pre-Flight Production Prerequisites (Immediate)
        D1["User Authorizes Neon PG16 Cloud DB"] --> GO["Production Go-Live"]
        D2["Store Owner Provides BharatPe VPA & WhatsApp"] --> GO
        D3["Deploy Migrations & Configure Vercel Secrets"] --> GO
    end
    
    subgraph Tier 2: Post-Launch Phase 3 Enhancements (Post-Go-Live)
        E1["Shiprocket / Delhivery API for Automated AWB"]
        E2["Meta WhatsApp Cloud API Automated Notifications"]
        E3["Upstash Redis Cloud Cluster for Edge Rate Limits"]
        E4["Resend DNS Verification (SPF, DKIM, DMARC)"]
        E5["Cloudinary Media Asset Pipeline"]
    end
    
    GO -.-> Tier 2
```

---

## 2. Tier 1: Immediate Pre-Flight Prerequisites (Launch Blockers)

These dependencies must be satisfied by the user and store owner before opening the storefront to live public traffic:

| # | Prerequisite Item | Owner / Responsible Party | Action Required | Estimated Duration | Impact if Deferred |
|---|---|---|---|---|---|
| **DEP-01** | **Neon PostgreSQL 16 Provisioning** | Technical Lead / User | Create free or standard tier Neon project; obtain pooled connection string. | ~5 minutes | Platform operates in in-memory session mode. |
| **DEP-02** | **Execute Database Migrations** | Technical Lead | Run `pnpm --filter @nava/db prisma migrate deploy` against live Neon socket. | ~2 minutes | Cannot persist live database orders. |
| **DEP-03** | **Production Secret Configuration** | Store Owner & DevSecOps | Generate 64-char hex strings for `ADMIN_AUTH_SECRET` and `SESSION_SECRET` in Vercel. | ~5 minutes | Admin authentication blocked. |
| **DEP-04** | **Sovereign Merchant Details** | Store Owner | Supply verified BharatPe UPI VPA and set `MERCHANT_ONBOARDING_APPROVED=true`. | ~5 minutes | Checkout operates in staging test mode. |
| **DEP-05** | **Custom Domain DNS Mapping** | DevSecOps Lead | Point `navacreations.in` / `nava-creations.com` A/CNAME records to Vercel edge network. | ~15 minutes | Site accessible via `*.vercel.app` only. |

---

## 3. Tier 2: Post-Launch Phase 3 Enhancements Roadmap

These integrations represent non-blocking post-launch scale enhancements for Phase 3:

### A. Automated Logistics Partner Integration (Shiprocket / Delhivery API)
- **Current State (Phase 2):** Store manager manually books parcel on Delhivery / BlueDart portal, copies the AWB tracking code, and pastes it into the NAVA admin order dashboard.
- **Phase 3 Evolution:** Direct REST API integration to generate shipping labels, manifest pickups, and automatically synchronize real-time tracking updates directly to the customer tracking page.

### B. Meta WhatsApp Cloud API Automated Notifications
- **Current State (Phase 2):** Concierge click-to-chat links with pre-filled order messages.
- **Phase 3 Evolution:** Automated outbound HSM WhatsApp templates sent to the customer upon:
  - Bank UTR Verification (`"Your NAVA order #NAV-2026-XXXX is confirmed!"`)
  - Courier Handover (`"Your bangles have shipped via Delhivery! Track: DELHIVERY-BLR-..."`)

### C. Distributed Edge Rate Limiting (Upstash Redis)
- **Current State (Phase 2):** Process-memory rate limiting (`MemoryRateLimiter`) with fail-safe degradation.
- **Phase 3 Evolution:** Provisioning an Upstash Redis REST database to synchronize rate-limiting token buckets across all global Vercel serverless edge nodes.

### D. Verified Transactional Email Domain (Resend)
- **Current State (Phase 2):** Zero email dependency; order receipts delivered on-screen and via WhatsApp concierge.
- **Phase 3 Evolution:** Configuration of SPF, DKIM, and DMARC DNS records for `atelier@navacreations.in` to send formal PDF invoices.

### E. Cloudinary Automated Media Optimization Pipeline
- **Current State (Phase 2):** High-resolution artisanal photography hosted via Unsplash CDN with Next.js dynamic resizing.
- **Phase 3 Evolution:** Direct Cloudinary media pipeline allowing the store owner to drag-and-drop new bangle designs from a smartphone directly into the product catalog.

---

## 4. Conclusion & Handover Verdict

Phase 2 engineering deliverables are fully satisfied. The codebase is clean, tested, documented, and standing by for cloud activation.
