# NAVA CREATIONS — ROUTE AND COMPONENT INVENTORY
**Milestone:** Stage A + Stage B Master Execution  
**Project:** NAVA CREATIONS Handcrafted Artisanal Commerce Platform  
**Target Workspace:** `D:\NAVA`  
**Application Root:** `apps/web` (`@nava/web`)  
**Date:** 2026-11-12  
**Framework:** Next.js 15.5.29 App Router

---

## 1. Storefront Customer Routes Inventory

All public customer-facing routes inherit the global root layout ([apps/web/app/layout.tsx](file:///d:/NAVA/apps/web/app/layout.tsx)) and provide full responsive layouts across mobile (375px), tablet (768px), and widescreen desktop (1440px).

| Route URL | App Router File Path | Mode | Auth Gate | Primary Components Used | Functional Responsibility |
|---|---|---|---|---|---|
| `/` | `apps/web/app/page.tsx` | Static (○) | Public | `AnnouncementBar`, `Header`, `ProductCard`, `Footer` | Atelier brand showcase, featured bridal collections, bestsellers carousel, craftsmanship pillars. |
| `/shop` | `apps/web/app/shop/page.tsx` | Dynamic (ƒ) | Public | `Header`, `ProductCard`, `Footer`, Search/Filter bar | Complete product catalog browsing with real-time text search, price filter, and category pills. |
| `/categories/[slug]` | `apps/web/app/categories/[slug]/page.tsx` | Dynamic (ƒ) | Public | `Header`, `ProductCard`, `Footer` | Taxonomy collection view (Handmade Bangles, Bridal Sets, Kundan Artistry, Return Gifts). |
| `/collections/[slug]` | `apps/web/app/collections/[slug]/page.tsx` | Dynamic (ƒ) | Public | `Header`, `ProductCard`, `Footer` | Curated editorial edits (Bridal Edit 2026, Bengaluru Bestsellers, Festive Return Gifts). |
| `/products/[slug]` | `apps/web/app/products/[slug]/page.tsx` | Dynamic (ƒ) | Public | `Header`, `ProductDetailView`, `BangleSizeGuide`, `Footer` | Product detail view: multi-image gallery, bangle size selector (2.4, 2.6, 2.8), real-time stock pill, add-to-bag CTA, and craftsmanship specifications. |
| `/cart` | `apps/web/app/cart/page.tsx` | Static (○) | Public | `Header`, `Footer`, `CartDrawer` | Full-page shopping bag: line-item quantity adjusters, clear bag button, subtotal/shipping breakdown, "Proceed to Secure Checkout", and WhatsApp concierge link. |
| `/checkout` | `apps/web/app/checkout/page.tsx` | Static (○) | Public | `Header`, `Footer` | Comprehensive checkout: Indian shipping address form (18 states dropdown, 6-digit PIN validation), interactive coupon code validator, UPI vs COD selector, order placement. |
| `/orders/[orderNumber]` | `apps/web/app/orders/[orderNumber]/page.tsx` | Dynamic (ƒ) | Public | `Header`, `Footer` | Live order confirmation and tracking: status timeline, BharatPe QR details, manual customer UTR submission form, carrier AWB tracking link. |
| `/contact` | `apps/web/app/contact/page.tsx` | Static (○) | Public | `Header`, `Footer` | Contact & Studio page: bridal consultation enquiry form, Bangalore workshop address, map placeholder, direct WhatsApp concierge button. |
| `/sitemap.xml` | `apps/web/app/sitemap.ts` | Static (○) | Public | XML Generator | Dynamic XML sitemap indexing all active categories, collections, and catalog products. |
| `/robots.txt` | `apps/web/app/robots.ts` | Static (○) | Public | Text Generator | Search engine crawl directives allowing public storefront paths and blocking `/admin/` and `/api/admin/`. |

---

## 2. Administrative Suite Routes Inventory

All administrative routes inherit the admin shell layout ([apps/web/app/admin/layout.tsx](file:///d:/NAVA/apps/web/app/admin/layout.tsx)), which validates active store manager credentials. Unauthenticated requests are immediately redirected to `/admin/login`.

| Route URL | App Router File Path | Mode | Auth Gate | Primary UI Elements | Operational Responsibility |
|---|---|---|---|---|---|
| `/admin/login` | `apps/web/app/admin/login/page.tsx` | Static (○) | Public Gate | Login card, secret password field, error banners | Cryptographic store manager authentication gate. Sets HTTP-only HMAC session cookie `nava_admin_session`. |
| `/admin` | `apps/web/app/admin/page.tsx` | Dynamic (ƒ) | Admin Cookie | KPI cards, quick links, recent order table | Studio overview dashboard displaying gross sales, pending payment confirmations, stock alerts, and quick actions. |
| `/admin/products` | `apps/web/app/admin/products/page.tsx` | Dynamic (ƒ) | Admin Cookie | Catalog table, status badges, search filter | Inventory catalog table listing all products, SKU codes, compare-at pricing, stock status, and edit links. |
| `/admin/products/new` | `apps/web/app/admin/products/new/page.tsx` | Static (○) | Admin Cookie | Product creation form, variant generator | Product creation wizard with pricing validation, HSN assignment, category dropdown, and multi-variant setup. |
| `/admin/products/[id]` | `apps/web/app/admin/products/[id]/page.tsx` | Dynamic (ƒ) | Admin Cookie | Product edit form, archive button | Product editing portal for updating pricing, compare-at discounts, descriptions, and soft-retirement archiving. |
| `/admin/categories` | `apps/web/app/admin/categories/page.tsx` | Static (○) | Admin Cookie | Category hierarchy table, "Add Category" modal | Taxonomy management: parent-child hierarchies, statutory HSN code `7117` assignment, active/disabled toggling. |
| `/admin/collections` | `apps/web/app/admin/collections/page.tsx` | Static (○) | Admin Cookie | Collections grid, "New Collection" modal | Merchandising curation: display order sorting, cover image CDN assignment, publish/draft visibility toggle. |
| `/admin/inventory` | `apps/web/app/admin/inventory/page.tsx` | Static (○) | Admin Cookie | Stock table, increment/decrement controls | Stock level monitoring, safety stock thresholds, and immediate stock adjustment controls. |
| `/admin/orders` | `apps/web/app/admin/orders/page.tsx` | Static (○) | Admin Cookie | Order queue, filter tabs, "Verify Bank Credit" modal, AWB modal | Complete order queue: status filtering, customer destination, payment method, bank credit reconciliation modal, AWB dispatch. |
| `/admin/orders/[id]/packing-slip` | `apps/web/app/admin/orders/[id]/packing-slip/page.tsx` | Dynamic (ƒ) | Admin Cookie | Printable A4/thermal sheet, bangle sizing checklist | High-contrast atelier packing slip for physical parcel packaging: bangle gauge verification, velvet box inclusion, claimed UTR, verified bank transaction ref. |
| `/admin/promotions` | `apps/web/app/admin/promotions/page.tsx` | Static (○) | Admin Cookie | Campaign table, "New Coupon" modal, status toggles | Promotional campaign manager: code generation, percentage/flat discounts, min order value, max discount cap, active toggle. |
| `/admin/settings` | `apps/web/app/admin/settings/page.tsx` | Static (○) | Admin Cookie | Tabbed configuration forms, toggle switches | Studio configuration portal: UPI VPA, Merchant Name, static QR URL, owner merchant confirmation flag, WhatsApp number, COD rules. |
| `/admin/enquiries` | `apps/web/app/admin/enquiries/page.tsx` | Static (○) | Admin Cookie | Consultation table, filter tabs, status updater | Customer consultation triage: bridal trousseau details, event date, bangle size request, and direct customer WhatsApp reply link. |
| `/admin/system` | `apps/web/app/admin/system/page.tsx` | Dynamic (ƒ) | Admin Cookie | Diagnostics cards, probe indicators | System diagnostics overview: database connectivity, rate limiter status, runtime environment indicators. |

---

## 3. Public Storefront & Admin API Endpoints

| Endpoint URL | HTTP Method | Auth Required | Service Handler | Primary Request / Response Responsibility |
|---|---|---|---|---|
| `/api/catalog/products` | `GET` | Public | `CatalogService` | Lists published products with pagination and category/collection filtering. |
| `/api/catalog/products/[slug]` | `GET` | Public | `CatalogService` | Retrieves detailed product information by unique slug. |
| `/api/catalog/categories` | `GET` | Public | `CatalogService` | Lists active categories in hierarchical structure. |
| `/api/catalog/collections` | `GET` | Public | `CatalogService` | Lists published merchandising collections. |
| `/api/catalog/collections/[slug]/products` | `GET` | Public | `CatalogService` | Retrieves paginated products assigned to a specific collection. |
| `/api/cart/validate` | `POST` | Public | `PricingEngine` | Server-authoritative cart validation: recomputes pricing in integer paise and verifies stock availability. |
| `/api/orders` | `POST` | Public (Rate-Limited) | `OrderService` | Creates order with server price recomputation, stock reservation, coupon application, and Indian address validation. |
| `/api/orders/[orderNumber]` | `GET` | Public | `OrderService` | Customer order lookup for live confirmation and tracking. |
| `/api/orders/[orderNumber]/submit-utr` | `POST` | Public (Rate-Limited) | `OrderService` | Records 12-digit customer claimed UTR into unverified payment claim state. |
| `/api/promotions/validate` | `POST` | Public (Rate-Limited) | `PromotionService` | Validates coupon code against cart subtotal, returning discount calculation or honest HTTP 422/404 error. |
| `/api/enquiries` | `POST` | Public (Rate-Limited) | `EmailService` & DB/Memory | Submits customer bridal consultation enquiry with bot honeypot, dwell-time verification, and deduplication. |
| `/api/health` | `GET` | Public | Health Probe | Returns aggregate system health and service readiness. |
| `/api/health/liveness` | `GET` | Public | Health Probe | Kubernetes/container liveness check (HTTP 200). |
| `/api/health/readiness` | `GET` | Public | Health Probe | Database connectivity probe (HTTP 200 if connected, HTTP 503 if unconfigured). |
| `/api/admin/auth` | `POST` | Public (Rate-Limited) | `verifyAdminCredentials` | Authenticates store manager against cryptographically verified admin secret; issues session cookie. |
| `/api/admin/auth` | `DELETE` | Admin Cookie | Session Management | Terminates administrative session and clears session cookie. |
| `/api/admin/catalog/products` | `POST` | Admin Cookie | `CatalogService` | Creates new catalog product with server price validation and inventory initialization. |
| `/api/admin/catalog/products/[id]` | `PUT / PATCH` | Admin Cookie | `CatalogService` | Updates existing product details and pricing. |
| `/api/admin/catalog/products/[id]` | `DELETE` | Admin Cookie | `CatalogService` | Archives product (soft retirement). |
| `/api/admin/catalog/categories` | `GET / POST` | Admin Cookie | `CatalogService` | Lists flat categories and creates new categories with HSN codes. |
| `/api/admin/catalog/categories/[id]` | `PATCH` | Admin Cookie | `CatalogService` | Updates category metadata or toggles active status. |
| `/api/admin/catalog/collections` | `GET / POST` | Admin Cookie | `CatalogService` | Lists all collections and creates new merchandising edits. |
| `/api/admin/catalog/collections/[id]` | `PATCH` | Admin Cookie | `CatalogService` | Updates collection details or toggles publish status. |
| `/api/admin/inventory/[variantId]` | `POST` | Admin Cookie | `CatalogService` | Updates stock and safety stock levels with boundary validation. |
| `/api/admin/orders` | `GET` | Admin Cookie | `OrderService` | Lists customer orders with optional status filtering. |
| `/api/admin/orders/[id]` | `GET / PATCH` | Admin Cookie | `OrderService` | Retrieves order details, updates status (e.g. PROCESSING, CANCELLED), or records carrier AWB. |
| `/api/admin/orders/[id]/verify-payment` | `POST` | Admin Cookie | `OrderService` | Records store manager verified bank credit ID, transitions payment to `VERIFIED` and order to `PAYMENT_CONFIRMED`. |
| `/api/admin/promotions` | `GET / POST` | Admin Cookie | `PromotionService` | Lists promotional campaigns and creates new promo codes. |
| `/api/admin/promotions/[id]` | `PATCH` | Admin Cookie | `PromotionService` | Toggles coupon active status. |
| `/api/admin/settings` | `GET / PATCH` | Admin Cookie | `SettingsService` | Retrieves and updates studio configuration, UPI details, WhatsApp numbers, and COD limits. |
| `/api/admin/enquiries` | `GET` | Admin Cookie | In-Memory / DB | Lists customer consultation submissions. |
| `/api/admin/enquiries/[id]` | `PATCH` | Admin Cookie | In-Memory / DB | Updates customer consultation status (NEW, CONTACTED, CONVERTED, CLOSED). |

---

## 4. Reusable Component Library Inventory

Located in `apps/web/components/`:

| Component File | Primary Exports | Purpose & Visual Role |
|---|---|---|
| `header.tsx` | `Header` | Sticky responsive navigation bar: brand wordmark, category links, quick search overlay, mobile hamburger drawer, live cart badge. |
| `footer.tsx` | `Footer` | Atelier footer: 3 trust pillars, brand narrative, category links, policies, copyright, social icons with dynamic WhatsApp link generator. |
| `announcement-bar.tsx` | `AnnouncementBar` | Top banner with promotional announcements (free shipping threshold, WhatsApp concierge). |
| `product-card.tsx` | `ProductCard` | Storefront product display card: responsive image, title, price, compare-at strikethrough, discount pill, stock status badge. |
| `product-detail-view.tsx` | `ProductDetailView` | Interactive PDP: thumbnail selector, zoom view, bangle size selector, quantity picker, sticky add-to-bag CTA, reviews/FAQ accordion. |
| `bangle-size-guide.tsx` | `BangleSizeGuideModal` | Accessible modal with Indian bangle sizing chart (2.2, 2.4, 2.6, 2.8) and measurement guidance (hand circumference in inches/mm). |
| `cart-drawer.tsx` | `CartDrawer` | Slide-over cart drawer: thumbnail list, quantity increment/decrement, subtotal summary, "Checkout" button, empty cart state. |
| `storefront-shell.tsx` | `StorefrontShell` | Layout container wrapping public pages with header, announcement bar, cart drawer, and footer. |
| `icons.tsx` | SVG Icon library | Storefront icons: ShoppingBag, Search, WhatsApp, Instagram, Star, ShieldCheck, Truck, RefreshCw, ChevronRight, Menu, Close, Lock, AlertCircle. |
| `admin-icons.tsx` | SVG Icon library | Admin icons: Package, Layers, Tag, RefreshCw, ShoppingBag, ShieldCheck, LogOut, ExternalLink, Plus, AlertCircle. |
