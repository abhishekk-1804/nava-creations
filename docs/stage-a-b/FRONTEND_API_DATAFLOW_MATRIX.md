# NAVA CREATIONS — FRONTEND TO API DATAFLOW MATRIX
**Milestone:** Stage A + Stage B Master Execution  
**Project:** NAVA CREATIONS Handcrafted Artisanal Commerce Platform  
**Target Workspace:** `D:\NAVA`  
**Date:** 2026-11-12  
**Purpose:** End-to-End Traceability of Every User Action to Backend Service & Data Adapter

---

## 1. Master Dataflow Matrix

| Operation # | Triggering UI Element | HTTP Endpoint & Method | Service Handler | Persistence Adapter | Validation Applied | Auth Gate | Response & Status | Verification Test |
|---|---|---|---|---|---|---|---|---|
| **DF-01** | Storefront Catalog Browse (`/shop`, `/`) | `GET /api/catalog/products` | `CatalogService.getPublishedProducts` | Dual (Prisma / `SAMPLE_PRODUCTS`) | Query options normalization (page, limit, category) | Public | HTTP 200 `{ products, pagination }` | `catalog-api.spec.ts` |
| **DF-02** | Product Detail View (`/products/[slug]`) | `GET /api/catalog/products/[slug]` | `CatalogService.getProductBySlug` | Dual (Prisma / Sample data) | Clean slug parameter normalization | Public | HTTP 200 `{ product }` or HTTP 404 | `catalog-api.spec.ts` |
| **DF-03** | Cart Recalculation (Checkout page load) | `POST /api/cart/validate` | `PricingEngine.validateCart` | In-Memory Product Lookup | Reject client price; recompute integer paise subtotal | Public | HTTP 200 `{ valid, items, subtotalPaise }` | `cart-validation.spec.ts` |
| **DF-04** | Apply Coupon (`/checkout` coupon box) | `POST /api/promotions/validate` | `PromotionService.validateAndApply` | Memory Singleton `couponsRegistry` | Code normalization, min order value check, expiry | Rate-Limited | HTTP 200 `{ valid: true, discountPaise }` or 422 | `promotions-and-settings.spec.ts` |
| **DF-05** | Place Order (`/checkout` submit button) | `POST /api/orders` | `OrderService.createOrder` | Dual (Prisma / `__nava_memory_orders__`) | Indian phone regex, 6-digit PIN, variant stock check | Rate-Limited | HTTP 201 `{ success: true, order }` | `orders-checkout.spec.ts` |
| **DF-06** | Submit Customer UTR (`/orders/[id]`) | `POST /api/orders/[id]/submit-utr` | `OrderService.submitUtr` | Dual (Prisma / `__nava_memory_orders__`) | 12-digit numeric regex, duplicate submission check | Rate-Limited | HTTP 200 `{ success: true, message }` | `orders-checkout.spec.ts` |
| **DF-07** | Bridal Consultation Form (`/contact`) | `POST /api/enquiries` | `EmailService` & DB/Memory | Dual (Prisma / `memoryEnquiries`) | Honeypot trap, 1s minimum dwell time, sanitized text | Rate-Limited | HTTP 200 `{ outcome: 'RECORDED' }` | `enquiries-integration.spec.ts` |
| **DF-08** | Store Manager Login (`/admin/login`) | `POST /api/admin/auth` | `verifyAdminCredentials` | Cryptographic HMAC Cookie | Secret length validation, timing-safe equality | Rate-Limited | HTTP 200 (Sets `nava_admin_session`) | `admin-authorization.spec.ts` |
| **DF-09** | End Admin Session (`/admin` logout button) | `DELETE /api/admin/auth` | Session Invalidation | Cookie Deletion (`Max-Age=0`) | Session verification | Admin Cookie | HTTP 200 `{ message: 'Session terminated' }` | `admin-authorization.spec.ts` |
| **DF-10** | Verify Bank Credit (`/admin/orders` modal) | `POST /api/admin/orders/[id]/verify-payment` | `OrderService.verifyPayment` | Dual (Prisma / `__nava_memory_orders__`) | Unique bank transaction ID (min 8 chars) | Admin Cookie | HTTP 200 `{ order, payment }` | `orders-checkout.spec.ts` |
| **DF-11** | Update Order / AWB (`/admin/orders`) | `PATCH /api/admin/orders/[id]` | `OrderService.updateStatus` | Dual (Prisma / `__nava_memory_orders__`) | Linear state transition validation | Admin Cookie | HTTP 200 `{ success: true, order }` | `orders-checkout.spec.ts` |
| **DF-12** | Print Packing Slip (`/admin/orders/[id]/packing-slip`)| `GET /api/admin/orders/[id]` | `OrderService.getOrder` | Dual (Prisma / `__nava_memory_orders__`) | Order existence check | Admin Cookie | HTTP 200 `{ success: true, order }` | `promotions-and-settings.spec.ts` |
| **DF-13** | Save Studio Settings (`/admin/settings`) | `PATCH /api/admin/settings` | `SettingsService.updateSettings` | Memory Singleton `__nava_studio_settings__` | UPI VPA format, WhatsApp digits, non-negative numbers| Admin Cookie | HTTP 200 `{ success: true, settings }` | `promotions-and-settings.spec.ts` |
| **DF-14** | Create Category (`/admin/categories` modal)| `POST /api/admin/catalog/categories` | `CatalogService.createCategory` | Dual (Prisma / `__nava_memory_categories__`)| Name required, unique slug generation, HSN code | Admin Cookie | HTTP 201 `{ success: true, category }` | `promotions-and-settings.spec.ts` |
| **DF-15** | Toggle Category Status (`/admin/categories`) | `PATCH /api/admin/catalog/categories/[id]` | `CatalogService.updateCategory` | Dual (Prisma / `__nava_memory_categories__`)| Category ID lookup, boolean active toggle | Admin Cookie | HTTP 200 `{ success: true, category }` | `promotions-and-settings.spec.ts` |
| **DF-16** | Create Collection (`/admin/collections` modal)| `POST /api/admin/catalog/collections` | `CatalogService.createCollection` | Dual (Prisma / `__nava_memory_collections__`)| Title required, unique slug generation, order number| Admin Cookie | HTTP 201 `{ success: true, collection }` | `promotions-and-settings.spec.ts` |
| **DF-17** | Toggle Collection Status (`/admin/collections`)| `PATCH /api/admin/catalog/collections/[id]`| `CatalogService.updateCollection` | Dual (Prisma / `__nava_memory_collections__`)| Collection ID lookup, status validation | Admin Cookie | HTTP 200 `{ success: true, collection }` | `promotions-and-settings.spec.ts` |
| **DF-18** | Create Coupon (`/admin/promotions` modal) | `POST /api/admin/promotions` | `PromotionService.createCoupon` | Memory Singleton `couponsRegistry` | Min 3-char code, positive discount value | Admin Cookie | HTTP 201 `{ success: true, coupon }` | `promotions-and-settings.spec.ts` |
| **DF-19** | Toggle Coupon Status (`/admin/promotions`) | `PATCH /api/admin/promotions/[id]` | `PromotionService.toggleCouponStatus` | Memory Singleton `couponsRegistry` | Code lookup, boolean active toggle | Admin Cookie | HTTP 200 `{ success: true, coupon }` | `promotions-and-settings.spec.ts` |
| **DF-20** | Triage Enquiry (`/admin/enquiries` status) | `PATCH /api/admin/enquiries/[id]` | Direct DB / Memory update | Dual (Prisma / `memoryEnquiries`) | Status enum (NEW, CONTACTED, CONVERTED, CLOSED) | Admin Cookie | HTTP 200 `{ success: true, enquiry }` | `enquiries-integration.spec.ts` |
| **DF-21** | Adjust Stock (`/admin/inventory`) | `POST /api/admin/inventory/[variantId]` | `CatalogService.updateInventory` | Dual (Prisma / In-Memory item) | Non-negative available quantity, safety stock | Admin Cookie | HTTP 200 `{ success: true }` | `admin-authorization.spec.ts` |

---

## 2. Integrity Assurances

1. **Zero Client-Authoritative Pricing:** No frontend price input is ever trusted. Subtotals and discounts are recomputed server-side in integer paise.
2. **Zero Insecure Direct Object References (IDOR):** Customer order tracking requires exact order number matches. Administrative mutations require cryptographically signed session tokens.
3. **Graceful Offline Fallback:** When a live database is unconfigured, all services cleanly route reads and writes to structured global singletons, guaranteeing state persistence across disparate Next.js server chunks and browser reloads during local execution.
