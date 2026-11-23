# NAVA CREATIONS — Master Project Transformation Baseline
## System Architecture, Inventory & State Discovery Report

- **Date:** 2026-11-11
- **Workspace:** `D:\NAVA`
- **Current Git Branch:** `main`
- **Active Roles:** Principal Architect, AppSec, Backend, UI/UX, QA, DevOps
- **Milestone:** Master Transformation — Phase A (Baseline Discovery)

---

## 1. Executive Summary

This baseline document records the verified, pre-transformation technical state of the NAVA CREATIONS monorepo. Every finding is verified by direct inspection of package manifests, Prisma schema, Next.js route handlers, and unit/E2E test files.

NAVA CREATIONS is an artisanal small-business e-commerce application for handmade bangles, Kundan jewellery, and bridal accessories based in Bengaluru, India. It operates under strict brand governance: `assets/branding/approved/` remains empty under governance lock pending business owner sign-off.

---

## 2. Actual Project Structure & Package Ecosystem

### Monorepo Topology
```text
D:\NAVA/
├── apps/
│   └── web/                     # Next.js 15 App Router storefront & admin portal
├── packages/
│   ├── config/                  # Shared TypeScript/ESLint development configuration
│   ├── db/                      # Prisma ORM 6.1.0 client & PostgreSQL schema
│   ├── domain/                  # Framework-agnostic commerce domain logic (money, tax, states)
│   └── shared/                  # Common utilities & Result<T, E> error types
├── docs/                        # Architecture, design specifications, and audit reports
├── assets/                      # Brand design directions (Concept A, B, C; approved/ is locked)
├── package.json                 # Monorepo root manifest (pnpm 12.18.0, Turborepo 2.11.10)
├── pnpm-workspace.yaml          # Workspace definitions & package overrides
├── turbo.json                   # Pipeline caching definitions
└── .env.example                 # Environment template (no production secrets)
```

### Verified Runtime & Dependency Versions
- **Node.js:** `v26.13.0`
- **pnpm:** `12.18.0`
- **Turborepo:** `2.11.10`
- **Next.js:** `15.5.29` (Next.js 15 App Router)
- **React & React DOM:** `19.0.0`
- **TypeScript:** `5.7.2`
- **Prisma:** `6.1.0` (`@prisma/client` & `prisma` CLI)
- **Tailwind CSS:** `3.4.16` (with `autoprefixer` & `postcss 8.4.49`)
- **Vitest:** `3.2.7`
- **Playwright:** `1.49.1`
- **ESLint:** `8.57.1` with `eslint-config-next 15.1.0`

---

## 3. Inventory of Existing Routes

### Customer Storefront Routes (`apps/web/app/`)
| Route | Type | Description |
| :--- | :--- | :--- |
| `/` | Static (○) | Flagship homepage with hero, categories, bridal spotlight |
| `/shop` | Dynamic (ƒ) | Full catalogue with search, category/collection filters, pagination |
| `/categories/[slug]` | Dynamic (ƒ) | Category showcase with product grid |
| `/collections/[slug]` | Dynamic (ƒ) | Curated merchandising edit with banner |
| `/products/[slug]` | Dynamic (ƒ) | Product detail page with Indian bangle size selector |
| `/cart` | Static (○) | Shopping bag review with WhatsApp order launcher |
| `/contact` | Static (○) | Studio location, consultation hours, bridal enquiry form |

### Private Owner-Admin Routes (`apps/web/app/admin/`)
| Route | Type | Description |
| :--- | :--- | :--- |
| `/admin` | Static (○) | Dashboard overview with operational metrics |
| `/admin/login` | Static (○) | Secret key authentication gate |
| `/admin/products` | Static (○) | Product inventory catalogue table |
| `/admin/products/new` | Static (○) | Add product form with variant builder |
| `/admin/products/[id]` | Dynamic (ƒ) | Edit product details and pricing |
| `/admin/categories` | Static (○) | Taxonomy table with HSN statutory codes |
| `/admin/collections` | Static (○) | Merchandising collection cards |
| `/admin/inventory` | Static (○) | Variant-level stock adjustments |
| `/admin/orders` | Static (○) | Order fulfilment and reverse logistics (RTO) table |
| `/admin/system` | Static (○) | Diagnostics, health checks, governance status |

### API Route Handlers (`apps/web/app/api/`)
| Route | Methods | Auth Required | Description |
| :--- | :--- | :---: | :--- |
| `/api/health` | `GET` | No | Aggregate system health probe |
| `/api/health/liveness` | `GET` | No | Node.js process liveness probe |
| `/api/health/readiness` | `GET` | No | PostgreSQL connectivity ping |
| `/api/catalog/products` | `GET` | No | Public product search & pagination |
| `/api/catalog/products/[slug]` | `GET` | No | Public product detail query |
| `/api/catalog/categories` | `GET` | No | Public category hierarchy |
| `/api/catalog/collections` | `GET` | No | Public merchandising collections |
| `/api/catalog/collections/[slug]/products` | `GET` | No | Products within a collection |
| `/api/admin/auth` | `POST`, `DELETE` | No | Admin login & logout |
| `/api/admin/catalog/products` | `POST` | **Yes** | Create product (Prisma transaction) |
| `/api/admin/catalog/products/[id]` | `PUT`, `DELETE` | **Yes** | Update / Archive product |
| `/api/admin/inventory/[variantId]` | `POST` | **Yes** | Stock level adjustments |

---

## 4. Current Verification Baseline

- **Monorepo Build (`pnpm run build`):** **PASSED** (all 24 static and dynamic routes compiled in 17.8s).
- **TypeScript Typecheck (`pnpm run typecheck`):** **PASSED** (0 errors across 5 workspace packages).
- **ESLint Code Quality (`pnpm run lint`):** **PASSED** (0 errors, 0 warnings).
- **Prisma Schema Validation (`pnpm --filter @nava/db validate`):** **PASSED** (`The schema at prisma\schema.prisma is valid`).
- **Domain & Shared Unit Tests (`pnpm run test`):** **PASSED** (60/60 tests passing in Vitest).
- **Playwright End-to-End Suite:** 22/22 tests passing in Chromium (previously reported).

---

## 5. Critical Technical Debt & Baseline Blockers

### A. Critical Security & Architectural Disconnects
1. **Admin Session Disconnect (SEC-01):** `POST /api/admin/auth` sets a cookie with the raw token, but never creates a record in `prisma.adminSession`. `verifyAdminSession` hashes the cookie token and queries `adminSession`. The record is never found, causing all admin write operations to fail with HTTP 401 Unauthorized.
2. **Hardcoded Dev Backdoor (SEC-02):** `POST /api/admin/auth` allows `'nava_admin_dev_token_2026'` to authenticate as `STORE_MANAGER`.
3. **Unprotected Admin UI Routes (SEC-03):** No Next.js middleware or server layout checks protect `/admin/*`. Unauthenticated users can view private dashboards and inventory.
4. **Faked Form Success (BUG-01):** Admin edit product (`/admin/products/[id]`) and inventory stock adjustment (`/admin/inventory`) swallow API 401/503 errors and display green success toasts while updating only temporary in-memory state.
5. **Discarded Customer Enquiries (BUG-02):** The `/contact` bridal enquiry form has an empty submit handler that discards user submissions into void state.
6. **Hardcoded WhatsApp Number (BUG-03):** The dummy number `+91 98860 00000` is hardcoded across 6 separate files.

### B. Infrastructure Availability & Boundaries
1. **Database Infrastructure:** Neither Docker nor a local PostgreSQL instance is running in the current local Windows environment. Production connection string `DATABASE_URL` in `.env.example` points to an unconfigured Neon template (`ep-sample-pooler...`).
2. **Data Mock Masquerading (DAT-01):** When the database is unconfigured, `CatalogService` silently serves `SAMPLE_PRODUCTS` as live data.
3. **Cart Integrity (CART-01):** Cart pricing and stock limits reside strictly in client `localStorage` with zero server-side price resolution.

---

## 6. Execution Roadmap for Master Transformation

- **Phase B:** P0 Security & Functional Remediation (Fix SEC-01, SEC-02, SEC-03, BUG-01, BUG-02, BUG-03, CART-01).
- **Phase C:** Database Integration (Schema validation, migration verification, robust fallback handling).
- **Phase D:** Design & Component Resource Evaluation (Lucide icons, Radix/shadcn primitives, Marketing skills).
- **Phase E:** Storefront & Admin UI/UX Refinement (High aesthetic polish, real error feedback, accessible styling).
- **Phase F:** Accessibility, Performance & SEO (Form labels, alt text, meta tags, sitemap, robots.txt).
- **Phase G:** Verification & Final Evidence (Expanded Playwright suite, responsive screenshots, final report).
