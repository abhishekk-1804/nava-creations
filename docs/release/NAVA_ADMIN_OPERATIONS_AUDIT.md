# NAVA CREATIONS — STUDIO ADMIN OPERATIONS AUDIT
**Document Identifier:** `NAVA-ADMIN-AUDIT-01`  
**Target Environment:** Studio Administration Portal (`/admin`)  
**Audit Status:** **VERIFIED**  

---

## 1. ADMINISTRATIVE DASHBOARD ARCHITECTURE

The NAVA CREATIONS Studio Admin Portal provides a comprehensive, responsive management interface designed for the store owner and atelier team to operate the business without direct database manipulation.

### Authentication & Authorization Boundaries
- **Endpoint:** `/admin/login` and `/api/admin/auth`
- **Security:** Brute-force rate limiting (10 attempts per 15 minutes), constant-time credential comparison (`crypto.timingSafeEqual`), and cryptographically signed session tokens.
- **Persistence:** Authenticated sessions are hashed using SHA-256 and recorded in `admin_sessions`. Expired or revoked sessions return HTTP 401.
- **RBAC:** Routes under `/admin/*` and `/api/admin/*` are strictly guarded against unauthenticated visits, redirecting to `/admin/login` or returning HTTP 401.

---

## 2. OPERATIONAL MODULES AUDIT

### 2.1 Product & Merchandising Management (`/admin/products`)
- **Product Operations:** Create, update, archive products with title, slug, description, categories, collections, and care instructions.
- **Variant Management:** Multi-variant support with bangle sizes (2.4, 2.6, 2.8), custom SKUs, and individual prices in paise.
- **Active/Inactive Toggle:** Instant toggling of product visibility without deleting historical records.
- **Test Evidence:** Verified by `apps/web/e2e/catalog-api.spec.ts` (9/9 pass) and `apps/web/e2e/admin-authorization.spec.ts` (13/13 pass).

### 2.2 Order Processing & Fulfillment (`/admin/orders`)
- **Order Inspection:** View complete order records, customer shipping details, items snapshot, payment method, and coupon applied.
- **Fulfillment Progression:** Transitions order statuses through `CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`.
- **Printable Atelier Packing Slip (`/admin/orders/[id]/packing-slip`):**
  - Renders clean, high-contrast, printable packing slip formatted for Bangalore studio fulfillment.
  - Contains order number, recipient address, customer phone, ordered bangle sizes, and dispatch checklist.
- **Cancellation & Restock:** Pre-dispatch cancellation atomically returns reserved stock to available inventory.
- **Test Evidence:** Verified by `apps/web/e2e/promotions-and-settings.spec.ts` (WP-FULFILL 4.2).

### 2.3 Financial Reconciliation & Payment Verification (`/admin/orders/[id]`)
- **Manual Bank Ledger Match:**
  - UI displays customer-claimed 12-digit UTR, payment method, and exact order total in Rupees.
  - Manager enters authoritative bank transaction reference and notes.
  - On verification, creates an immutable record in `audit_logs` and advances order to `PAYMENT_CONFIRMED`.
- **Conflict Handling:** Duplicate verified bank references are rejected with an explicit conflict message.
- **Test Evidence:** Verified by `apps/web/e2e/orders-checkout.spec.ts` (ORD-08) and `scripts/test-phase3-commerce-integrity.js`.

### 2.4 Inventory Controls & Manual Adjustments (`/admin/inventory`)
- **Real-Time Visibility:** Displays available stock, reserved stock, and low-stock alerts across all variants.
- **Manual Stock Adjustments:** Manager can increment or decrement stock to reflect physical Bangalore studio sales or new artisan production batches.
- **Database Safety:** All adjustments are validated against the `inventory_items_non_negative_stock` constraint.
- **Test Evidence:** Verified by `apps/web/e2e/inventory-concurrency.spec.ts` (6/6 pass).

### 2.5 Promotional Campaigns & Coupons (`/admin/promotions`)
- **Campaign Creation:** Define coupon code, percentage vs flat discount, minimum order amount, maximum discount cap, and total usage limits.
- **Usage Tracking:** Real-time visibility into coupon redemption count.
- **Test Evidence:** Verified by `apps/web/e2e/promotions-and-settings.spec.ts` (10/10 pass).

### 2.6 Customer Enquiries & Consultations (`/admin/enquiries`)
- **Bridal Enquiry Management:** View customer consultation requests submitted via `/contact`.
- **Direct WhatsApp Connection:** One-click WhatsApp link pre-filled with customer phone and enquiry reference.
- **Spam & Abuse Protection:** Rate limiting and minimum dwell time (>1000ms) prevent automated form abuse.
- **Test Evidence:** Verified by `apps/web/e2e/enquiries-integration.spec.ts` (11/11 pass).
