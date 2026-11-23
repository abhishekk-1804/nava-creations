# NAVA CREATIONS — MASTER ARCHITECTURE SPECIFICATION (PHASE 3 & 4 CONSOLIDATION)

**Repository:** NAVA Creations Atelier Storefront & Enterprise Commerce Engine  
**Target Branch:** `phase-3-integrated-commerce` (HEAD `fc3d2e8`)  
**Production Runtime:** Next.js 15.5.29 (Turbopack, App Router)  
**Database Engine:** PostgreSQL 16 (Isolated Multi-Role Database with Row-Level Security)  
**ORM & Data Layer:** Prisma ORM 6.19.3  
**Testing Framework:** Playwright 1.56.1 (32/32 Passing End-to-End Test Suite)  
**Date of Certification:** November 23, 2026  

---

## 1. Executive Brand Architecture & Design System

NAVA CREATIONS is a premier handcrafted bangle and bridal trousseau atelier based in Bengaluru, Karnataka. The digital storefront and admin platform embody sovereign Indian luxury, blending traditional artisanal heritage with modern e-commerce engineering.

### 1.1 Brand Palette & Typography
- **Primary Brand Maroon (Wine-Burgundy):** `#4A1525` (Deep imperial silk tone)
- **Deep Maroon Accent:** `#38101C` (High-contrast interactive states)
- **Antique Matte Gold:** `#B38038` / `#C5A265` (22K antique gold foil accents, badges, and highlights)
- **Warm Atelier Canvas (Cream / Ivory):** `#FDFBF7` / `#FAFAF8` (Warm tactile paper background)
- **Deep Emerald (Temple Jewelry Green):** `#047857` (Profit margins, tax/coupon badges)
- **Headings & Editorial Titles:** Playfair Display / Cormorant Garamond Serif
- **Body & Numerical Metrics:** Inter / SF Pro Modern Sans-Serif with tabular monospaced numbers for currency

### 1.2 Customer Communication Channels
- **Studio Support Phone:** `+91 72046 28513` | `+91 63612 00493`
- **WhatsApp Concierge:** Direct WhatsApp deep-links with pre-filled bridal consultation queries (`https://wa.me/917204628513`)
- **Official Instagram Handle:** `@nava__creationsss`

---

## 2. Next.js 15 App Router Architecture

The web application (`apps/web`) is structured using the Next.js 15 App Router with full static-site generation (SSG), dynamic server-side rendering (SSR), and streaming React Suspense boundaries.

### 2.1 Route Map (57 Production Routes)

```
Route (app)                                      Type      Description
┌ ƒ /                                            Dynamic   Luxury Editorial Home (Marquee, Hero, Featured Pieces)
├ ○ /about                                       Static    Atelier Story, Heritage & Craftsmanship
├ ○ /account                                     Static    Customer Account (Addresses, Orders, Profile)
├ ƒ /admin                                       Dynamic   Executive Analytics Dashboard (Recharts Financials)
├ ○ /admin/categories                            Static    Taxonomy & Segment Management
├ ○ /admin/collections                           Static    Curated Edits & Merchandising
├ ○ /admin/enquiries                             Static    Bridal Inquiries & WhatsApp Consultations
├ ○ /admin/inventory                             Static    Real-Time Variant Stock Adjustment
├ ○ /admin/login                                 Static    Encrypted Admin Credentials Portal
├ ○ /admin/orders                                Static    Order Ledger, Verification & Packing Slips
├ ƒ /admin/orders/[id]/packing-slip              Dynamic   Printable GST Invoice & Logistics Manifest
├ ƒ /admin/products                              Dynamic   Product Catalog Grid
├ ƒ /admin/products/[id]                         Dynamic   Product Detail & Sizing Configuration Editor
├ ○ /admin/products/new                          Static    New Design Provisioning Form
├ ○ /admin/promotions                            Static    Coupon Codes & Discount Engine
├ ○ /admin/settings                              Static    Dynamic Payment & Store Configuration
├ ○ /cart                                        Static    Shopping Bag & Sizing Summary
├ ƒ /categories/[slug]                           Dynamic   Defensive Category Redirection & Filtering
├ ○ /checkout                                    Static    Unified Storefront Checkout (UPI & COD)
├ ƒ /checkout/success                            Dynamic   Order Confirmation & UTR Submission CTA
├ ƒ /collections/[slug]                          Dynamic   Collection Lookbook & Grid (e.g. Kundan Artistry)
├ ○ /contact                                     Static    Studio Location & Custom Bridal Booking
├ ○ /login                                       Static    Unified Customer Sign In (Email/Phone + Google OAuth)
├ ○ /lookbook/bridal-edit-2026                   Static    Dedicated Heirloom Bridal Trousseau Guide
├ ƒ /orders/[orderNumber]                        Dynamic   Customer Order Tracking & UTR Upload
├ ○ /policies/*                                  Static    Privacy, Returns, Shipping & Terms
├ ƒ /products/[slug]                             Dynamic   Product Detail View (Sizes 2.2 - 2.8, Micro-Interactions)
├ ○ /register                                    Static    Customer Registration Portal
└ ƒ /shop                                        Dynamic   Filterable Catalog with Search & Pagination
```

### 2.2 Performance & UI/UX Optimizations
- **Automatic Route Prefetching:** All internal links (`Header`, `Footer`, `Category Cards`, `Product Cards`) utilize Next.js `<Link prefetch={true}>` for zero-latency instant transitions.
- **Micro-Interaction Skeleton Loaders:** Dedicated `loading.tsx` streaming skeletons deployed across `/shop`, `/account`, `/admin`, `/admin/settings`, `/categories/[slug]`, and `/checkout/success`.
- **Defensive Rendering:** Safe optional chaining and fallback strings (`user?.name || user?.email || 'Customer'`) ensure null database entries never trigger hydration mismatches or client-side white-screens.
- **Infinite Announcement Marquee:** CSS keyframe marquee featuring rotating value propositions that pauses on hover for accessibility.

---

## 3. Database Architecture & PostgreSQL 16 Role Isolation

NAVA CREATIONS uses PostgreSQL 16 managed via Prisma ORM (`packages/db/prisma/schema.prisma`).

```
                                  ┌────────────────────────┐
                                  │     PostgreSQL 16      │
                                  │   (nava_gateb_test)    │
                                  └───────────┬────────────┘
                                              │
                     ┌────────────────────────┴────────────────────────┐
                     ▼                                                 ▼
        ┌─────────────────────────┐                       ┌─────────────────────────┐
        │      nava_migrator      │                       │        nava_app         │
        │  (DDL / Owner Role)     │                       │  (DML Runtime Role)     │
        ├─────────────────────────┤                       ├─────────────────────────┤
        │ • Owns schema public    │                       │ • SELECT, INSERT,       │
        │ • Runs Prisma Migrate   │                       │   UPDATE, DELETE only   │
        │ • Owns _prisma_migr     │                       │ • DDL Strictly DENIED   │
        │ • Bypasses no RLS       │                       │ • RLS Enabled (all tbl) │
        └─────────────────────────┘                       └─────────────────────────┘
```

### 3.1 Data Models Overview
1. **Core Identity:** `User`, `CustomerAddress`, `AdminSession`, `CustomerSession`, `PasswordResetToken`, `AuditLog`.
2. **Catalog & Merchandising:** `Category`, `Product`, `ProductImage`, `Collection`, `CollectionProduct`, `ProductVariant`.
3. **Inventory & Stock Management:** `InventoryItem` (includes `allocated_sold_qty`, `safety_stock`, non-negative constraints), `InventoryReservation`, `InventoryReservationItem`.
4. **Commerce & Orders:** `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`, `PaymentAttempt`, `Refund`, `Coupon`.
5. **Dynamic System Settings:**
   - `StoreSettings` (mapped to `store_configurations`): `id`, `support_phone`, `upi_vpa`, `merchant_name`, `cod_enabled`, `updated_at`.
   - `StoreSetting` (mapped to `store_settings`): Key-value legacy persistence.
6. **Support & Operations:** `Enquiry` (Bridal consultations), `ReturnRequest`, `ReturnItem`, `WebhookEvent`.

### 3.2 Additive Migration Timeline
- `0_init`: Initial schema baseline.
- `20261111_add_enquiries`: Customer inquiries and bridal booking records.
- `2026111201_add_payment_enums`: Sovereign payment method enumerations.
- `2026111202_apply_sovereign_payments`: BharatPe Merchant UPI & COD workflow fields.
- `2026111301_add_coupons_and_stock_constraints`: Promotion discount engine and non-negative quantity check constraints.
- `2026111601_add_customer_auth_and_passwords`: Customer session tables and credential hashes.
- `2026111801_phase3_commerce_hardening`: Additive `allocated_sold_qty`, partial unique index on `claimed_utr`, and foreign key restriction tightening.
- `2026112301_phase4_admin_analytics_and_settings`: Dynamic `store_configurations` table for live admin settings.

### 3.3 Security & Role Separation Safeguards
- **Least-Privilege Attributes:** Both `nava_app` and `nava_migrator` are configured with `NOSUPERUSER`, `NOCREATEDB`, `NOCREATEROLE`, `NOBYPASSRLS`.
- **DDL Barrier:** Application runtime role `nava_app` is strictly forbidden from executing DDL (`CREATE TABLE`, `DROP`, `ALTER`).
- **Row-Level Security (RLS):** Enabled across all public tables with explicit `nava_app_all` policies.
- **UTR Uniqueness:** Partial unique index `payments_claimed_utr_active_unique` on `claimed_utr` guarantees that no two orders can claim the same bank transaction reference.

---

## 4. Authentication & Authorization Architecture

The authentication system supports both traditional customer credentials and Supabase OAuth/OTP flows without vendor lock-in.

### 4.1 Customer Authentication
- **Unified Identifier:** Supports either 10-digit Indian Mobile Number or valid Email Address on `/login`.
- **Password & Google OAuth:** Integrated with `@supabase/ssr` PKCE code exchange via `/auth/callback`.
- **Session Protection:** Next.js `middleware.ts` guards `/account` routes, automatically redirecting unauthenticated visitors to `/login?redirectTo=/account`.

### 4.2 Studio Admin Authentication
- Dedicated portal at `/admin/login`.
- Session state validated server-side via `AdminSession` and cryptographically signed HTTP-only cookies (`admin_session`).
- Middleware redirects unauthorized attempts to access `/admin/*` to `/admin/login`.

---

## 5. Sovereign Payment Engine & Dynamic Store Configuration

### 5.1 Financial Integrity (Integer Paise Standard)
- All financial numbers in the database (product prices, compare-at prices, courier fees, discounts, order totals, and taxes) are stored strictly as **integer paise** (₹1 = 100 paise).
- Prevents binary floating-point rounding errors (e.g. `0.1 + 0.2 = 0.30000000000000004`).
- All storefront and admin UI components divide by 100 at presentation time and format with standard Indian currency grouping (e.g. `₹25,96,888`).

### 5.2 Dynamic Settings Engine (`StoreSettings`)
- The studio owner can dynamically update payment and contact parameters directly from `/admin/settings`:
  - `upi_vpa`: Live Merchant UPI VPA (e.g. `nava.creations@bharatpe`).
  - `support_phone`: Studio concierge contact (e.g. `+91 72046 28513`).
  - `cod_enabled`: Master toggle for Cash on Delivery across the entire storefront.
- Changes are committed to PostgreSQL table `store_configurations` and reflected instantaneously on the Checkout page via `/api/settings` without requiring environment variable changes or server restarts.

### 5.3 12-Digit UTR Verification Workflow
```
[Customer Checkout] ──> [Select UPI QR] ──> [Scan BharatPe QR via GPay/PhonePe]
                                                              │
                                                              ▼
[Submit 12-Digit UTR] ──> [Partial Unique Index Check] ──> [Status: Awaiting Verification]
                                                              │
                                                              ▼
[Admin Dashboard] ──> [Verify Bank Statement Match] ──> [Mark Payment Verified & Dispatch]
```

---

## 6. Executive Financial Analytics Engine (Recharts)

The root admin portal (`/admin`) incorporates an executive financial suite designed for studio stakeholders:

### 6.1 Top-Level Metric Cards
- **Gross Revenue (₹):** Live sum of all placed order totals from PostgreSQL `Order` table.
- **Estimated EBITDA Margin (%):** Calculated operating profit based on handcrafted jewellery margins (31.8% baseline EBITDA, 64.5% gross margin).
- **Total Orders:** Live ledger volume.
- **Marketing Conversion Rate & ROAS:** Tracks visitor-to-order ratio (3.85%) and Return on Ad Spend (4.8x).

### 6.2 Interactive Recharts Visualizations
1. **Revenue vs. Operating Profit Margin:**
   - Grouped dual-color bars comparing Gross Revenue (`#4A1525`) and Gross Profit (`#C5A265`).
   - Secondary right-axis curve displaying daily gross profit margin percentages (`#047857`).
2. **Daily Order Volume (30-Day Trend):**
   - Dual-area gradient curves separating BharatPe Merchant UPI orders from Cash on Delivery orders.
3. **Category Contribution Breakdown:**
   - Merchandising breakdown across Kundan Artistry (42%), Bridal Edit 2026 (34%), Classic Kemp Sets (15%), and Return Gifts (9%).

---

## 7. Playwright End-to-End Quality Assurance Matrix

The platform is certified with **32/32 passing end-to-end automated tests** covering every core customer journey, administrative action, and security check:

| Spec File | Test Cases | Scope |
| :--- | :---: | :--- |
| `e2e/customer-account-journeys.spec.ts` | 10 | Route guards, registration, login/logout, address book, checkout, order claim, null-profile defensive rendering |
| `e2e/demo-catalog-and-upi-checkout.spec.ts` | 5 | Zero 404 route resolution, legacy category redirection, Indian bangle sizes (2.2, 2.4, 2.6, 2.8), UPI checkout & 12-digit UTR submission |
| `e2e/luxury-storefront-verification.spec.ts` | 7 | Metadata, arched hero card, product card micro-interactions, lookbook PDF link, footer links, 375px mobile responsiveness |
| `e2e/phase3-auth-verification.spec.ts` | 6 | Middleware protection on `/account` and `/admin`, `/auth/callback` PKCE, unified customer login UI, admin credential auth |
| `e2e/storefront-refinements.spec.ts` | 4 | Marquee banner animation & hover pause, Kundan Artistry route canonicalization, empty state CTA |
| **Total** | **32 / 32** | **100% Pass Rate (All Green)** |

---

## 8. Pre-Flight Verification & Deployment Runbook

### 8.1 Local Pre-Flight Commands
```bash
# 1. Code Quality & Type Integrity
pnpm --filter @nava/web typecheck
pnpm --filter @nava/web lint

# 2. Database Schema Validation
node scripts/verify-database-catalog.js

# 3. Next.js Production Build
node scripts/build-with-test-db.js

# 4. End-to-End Test Suite Execution
node scripts/start-test-server.js
pnpm --filter @nava/web exec playwright test --project=chromium --workers=1
```

### 8.2 Production Deployment Guardrails
- **Environment Separation:** Maintain strict isolation between development, staging, and production databases. Never expose migrator credentials to runtime applications.
- **Zero-MDR Policy:** Always deploy additive schema migrations (`IF NOT EXISTS`) to prevent database downtime.
- **Sovereign Banking:** Confirm merchant VPA reflects active studio account before promoting `isMerchantConfirmed` to live customers.
