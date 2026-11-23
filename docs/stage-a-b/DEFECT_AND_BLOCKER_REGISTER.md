# NAVA CREATIONS — DEFECT AND BLOCKER REGISTER
**Milestone:** Stage A + Stage B Master Execution  
**Project:** NAVA CREATIONS Handcrafted Artisanal Commerce Platform  
**Target Workspace:** `D:\NAVA`  
**Date:** 2026-11-12  
**Tracking Standard:** Continuous Defect Classification & Remediation Log

---

## 1. Resolved Technical Defects Register

| Defect ID | Severity | Category | Description | Root Cause | Remediation & Code Fix | Verification Evidence |
|---|---|---|---|---|---|---|
| **DEF-01** | High | Database / Migrations | Historical migration reference inconsistency in Prisma migration log. | An unapplied migration was previously referenced without lockfile consistency. | Restored canonical migration chain (`0_init`, `20261111_add_enquiries`, `20261112_add_sovereign_payments_and_order_fsm`). | Migration SQL audit & Prisma validation passed. |
| **DEF-02** | High | Security / Auth | Rate limiter global lockout affected all network IPs on single-account lockout. | In-memory limiter keyed solely on account name without IP partitioning. | Implemented IP-partitioned layered rate limiter in `apps/web/lib/rate-limiter.ts`. | 15 Security remediation tests passed (`security-remediation.spec.ts`). |
| **DEF-03** | Medium | State Desync | Multi-bundle route chunks lost in-memory state during development reloads. | Independent Next.js route chunks instantiated separate local variables. | Migrated orders, stock, promotions, settings, and enquiries to `globalThis` singletons. | State persists across `/api/orders`, `/api/orders/[id]/submit-utr`, and `/admin/orders`. |
| **DEF-04** | Low | E2E Testing | Playwright strict mode violation in packing slip verification. | Locator `text=Order #NAV-2026-8821` matched both document header and footer help text. | Switched locator to exact match: `page.getByText('Order #NAV-2026-8821', { exact: true })`. | Test `WP-FULFILL 4.2` passed cleanly. |
| **DEF-05** | Low | E2E Testing | Next.js client hydration click timing in shopping cart. | Quantity button on `/cart` clicked before React 19 hydration attached listeners. | Added `await page.waitForLoadState('networkidle')` prior to interaction. | Test `Customer Journey` passed cleanly in `e2e-user-journeys.spec.ts`. |
| **DEF-06** | Medium | Dataflow | Customer enquiry submitted on `/contact` did not appear in admin queue when offline. | Endpoint only attempted Prisma write without mirroring to in-memory enquiry registry. | Added dual persistence writing to `globalThis.memoryEnquiries`. | Test `E.11` in `enquiries-integration.spec.ts` passed cleanly. |
| **DEF-07** | Low | UI / Integration | Admin enquiry reply button opened generic studio WhatsApp instead of customer's phone. | Static fallback URL was populated instead of customer's phone parameter. | Updated `whatsappUrl` to target customer's phone (`https://wa.me/{cleanPhone}`). | Admin enquiry table links to customer's contact number. |
| **DEF-08** | Low | UI / Consistency | Mobile header menu drawer used hardcoded WhatsApp URL. | Static link bypassed centralized configuration. | Imported and bound `buildWhatsAppLink` in `apps/web/components/header.tsx`. | Single source of truth in `CONFIG.whatsapp`. |

---

## 2. Infrastructure Deferred Blockers (Database Stage)

The following items cannot be fully verified without a running PostgreSQL 16 engine and are explicitly deferred for the database provisioning milestone:

| Blocker ID | Title | Impact | Technical Prerequisite | Mitigation in Current Environment |
|---|---|---|---|---|
| **BLK-DB-01** | Dynamic PostgreSQL 16 Real-Engine Execution | In-memory fallback is active when database URL is unset. Dynamic database queries require live database. | Provisioned Neon database or local Docker PostgreSQL 16 runtime on Windows host. | Dual persistence pattern: fully formed Prisma schema and migrations ready; in-memory fallback preserves data during local tests. |
| **BLK-DB-02** | Database Row-Level Concurrency Locks | High-volume concurrent stock decrements rely on application-level locks rather than PostgreSQL `SELECT FOR UPDATE`. | Live PostgreSQL 16 transaction engine with active database connection. | `InventoryReservationService` provides atomic in-memory reservation with 15-minute TTL auto-expiry. |
| **BLK-DB-03** | Upstash Redis Distributed Rate Limiting | Rate limiter operates in process-memory fallback mode rather than multi-instance shared Redis cache. | Valid `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. | `HybridRateLimiter` gracefully fails over to process memory, logging structured diagnostics without crashing. |

---

## 3. Owner Commercial Approval Register (Pending Sign-offs)

The following items represent business commitments and commercial decisions that require explicit owner sign-off prior to public production deployment:

| Decision ID | Item Name | Current Technical Value | Action Required from Business Owner |
|---|---|---|---|
| **OWN-01** | Live Merchant UPI VPA | `nava.creations@bharatpe` (Placeholder) | Provide verified merchant UPI VPA from current account bank onboarding. |
| **OWN-02** | Static Merchant QR Asset | `/branding/merchant-upi-qr.png` | Provide high-resolution vector or PNG scan of official BharatPe QR sticker. |
| **OWN-03** | Official WhatsApp Concierge | `+91 98860 00000` (Placeholder) | Confirm registered WhatsApp Business mobile number. |
| **OWN-04** | Shipping Policy & Thresholds | Free shipping above ₹1,999; ₹150 standard courier | Confirm courier agreement rates and free shipping threshold. |
| **OWN-05** | Cash on Delivery (COD) Policy | Enabled up to ₹5,000 with ₹0 surcharge | Confirm whether COD should be offered and specify courier handling fee. |
| **OWN-06** | Promotional Coupon Terms | `BRIDAL10` (10% > ₹2,000), `NAVA200` (₹200 > ₹1,500)| Confirm active festive promotional codes, discount caps, and expiry dates. |
| **OWN-07** | High-Resolution Photography | Sample unsplash jewellery imagery | Provide production photography of Bangalore atelier bangle sets. |
