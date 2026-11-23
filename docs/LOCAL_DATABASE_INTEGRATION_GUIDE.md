# NAVA CREATIONS — LOCAL DATABASE INTEGRATION & READINESS GUIDE

## 1. Executive Summary

This guide documents the local website-to-database integration for **NAVA CREATIONS**. The Next.js frontend is fully integrated with a native PostgreSQL 16.16 instance running in WSL Ubuntu on port 5433, targeting the isolated development database `nava_local`.

The integration guarantees:
1. **Zero Exposure / Modification of Production Credentials**: The Neon production configuration in `apps/web/.env.local` remains strictly preserved and unmodified.
2. **Next.js Precedence-Based Isolation**: Development mode (`next dev`) automatically loads `apps/web/.env.development.local` with higher priority, overriding database connections to target `127.0.0.1:5433/nava_local`.
3. **Verified Live Database Connectivity**: Live SQL queries and Prisma Client queries (`SELECT 1`) execute successfully through the application routes and health probes (`/api/health/readiness`, `/api/health`, `/api/catalog/products`, `/api/catalog/categories`).

---

## 2. Infrastructure Architecture & Dual-Database Port Mapping

| Component | Host / Runtime | Port | Target Database | Role | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Test Database** | Windows / WSL | `5432` | `nava_gateb_test` | `nava_migrator`, `nava_app` | Isolated automated test runner & Playwright E2E suite |
| **Local Dev Database** | WSL Ubuntu native | `5433` | `nava_local` | `nava_local` | Local interactive development & storefront preview |
| **Staging / Prod** | Neon Serverless | `5432` (pooler) | `neondb` | (Restricted) | Staging and Production deployment targets |

---

## 3. Database Schema & Migration Status

The `nava_local` database contains 27 application tables and all 5 baseline schema migrations:

1. `0_init`: Core e-commerce entities (categories, collections, products, product variants, inventory, users, addresses, orders, order items).
2. `20261111_add_enquiries`: Custom bridal bangle bespoke enquiry system (`enquiries` table).
3. `2026111201_add_payment_enums`: Enums for Indian payment infrastructure (UPI, QR, Card, NetBanking).
4. `2026111202_apply_sovereign_payments`: Sovereign QR payment transactions, UTR submission, and offline verification workflows.
5. `2026111301_add_coupons_and_stock_constraints`: Promotions engine, coupon usage counters, and inventory quantity check constraints.

---

## 4. Environment Precedence Strategy

In Next.js, environment variables follow strict precedence:
1. `process.env` (system environment)
2. `.env.development.local` (loaded **only** during `next dev`, highest local priority)
3. `.env.local` (loaded in all environments except `test`)
4. `.env.development`
5. `.env`

By placing local development connection details in `apps/web/.env.development.local`:
- `pnpm --filter @nava/web dev` connects cleanly to `127.0.0.1:5433/nava_local`.
- `apps/web/.env.local` (Neon configuration) is never touched, committed, or exposed.
- `.env.development.local` is gitignored by `.gitignore` rules (`.env*.local`, `.env.*`).

---

## 5. Local Database Seeding

A dedicated, safe seeder script is provided at `scripts/seed-local-database.js`.

### Safeguards:
- Strict guard checking that `DATABASE_URL` targets `127.0.0.1` / `localhost`, port `5433`, and database `/nava_local`.
- Refuses execution if pointed to any other database, preventing accidental modification of test or remote databases.

### Seed Data Created:
- **5 Categories**: Handmade Bangles, Bridal Jewellery & Sets, Kundan Artistry, Hair Accessories & Matha Patti, Return Gifts & Favours.
- **3 Collections**: Bridal Edit 2026, Bengaluru Bestsellers, Festive Return Gifts.
- **5 Featured Products**: Complete with variants, SKU codes, images, and inventory items.
- **Store Manager Account**: `owner@nava-creations.internal` with `STORE_MANAGER` role.
- **Sample Order**: Order `NAV-2026-8821` in `PROCESSING` status with verified payment and Indiranagar shipping address.
- **Sample Enquiry**: Bridal consultation enquiry `ENQ-2026-1001`.

### Execution:
```bash
wsl -d Ubuntu node scripts/seed-local-database.js
```

---

## 6. Verification Results

### Health & Readiness Probes
| Endpoint | HTTP Status | Response / Check Result |
| :--- | :--- | :--- |
| `GET /api/health/liveness` | `200 OK` | `{"status": "alive", "service": "nava-creations-web"}` |
| `GET /api/health/readiness` | `200 OK` | `{"status": "ready", "checks": {"database": "connected"}}` (executed `SELECT 1` on port 5433) |
| `GET /api/health` | `200 OK` | `{"status": "healthy", "checks": {"process": "alive", "domainModule": "ready", "database": "connected"}}` |

### Application Catalog Routes
| Endpoint | HTTP Status | Verification Output |
| :--- | :--- | :--- |
| `GET /api/catalog/products` | `200 OK` | Returns 5 products (`total: 5`, `items: 5`) with images and variants |
| `GET /api/catalog/categories` | `200 OK` | Returns 5 active bangle & jewellery categories |
| `GET /api/catalog/collections` | `200 OK` | Returns 3 published curated collections |

### Automated Codebase Quality
- **Monorepo TypeScript**: `turbo run typecheck --force` -> 7/7 packages passed (0 errors).
- **Web App ESLint**: `pnpm --filter @nava/web lint` -> `✔ No ESLint warnings or errors`.
- **Production Next.js Build**: `pnpm --filter @nava/web build` -> 38/38 static/dynamic routes compiled cleanly (0 errors).
- **Domain Business Unit Tests**: `pnpm --filter @nava/domain test` -> 11/11 files, 73/73 tests passed.

---

## 7. Developer Quick Start

To launch and develop against the local database:

1. **Verify PostgreSQL 16 is running in WSL**:
   ```bash
   wsl -d Ubuntu sudo service postgresql status
   # If stopped:
   wsl -d Ubuntu sudo service postgresql start
   ```

2. **(Optional) Seed / Re-seed Local Database**:
   ```bash
   wsl -d Ubuntu node scripts/seed-local-database.js
   ```

3. **Start Next.js Development Server**:
   ```bash
   wsl -d Ubuntu bash -lc "cd /mnt/d/NAVA && pnpm --filter @nava/web dev"
   ```

4. **Access the Storefront**:
   - Storefront UI: `http://localhost:3000`
   - Readiness Check: `http://localhost:3000/api/health/readiness`
   - Health Status: `http://localhost:3000/api/health`
