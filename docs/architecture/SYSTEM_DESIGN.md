# System Design — NAVA CREATIONS

> [!NOTE]
> This document describes the complete system design for the NAVA CREATIONS e-commerce platform. It covers the repository structure, application layers, key technical flows, infrastructure, environment configuration, and local development setup.

**Project:** NAVA CREATIONS — Indian Accessories E-Commerce  
**Phase:** 0 — Foundation & Planning  
**Last Updated:** 2026-11-11  
**Architecture:** Modular Monolith on Next.js App Router + PostgreSQL

---

## Table of Contents

1. [Repository Structure](#1-repository-structure)
2. [Application Layers](#2-application-layers)
3. [Key Technical Flows](#3-key-technical-flows)
4. [Infrastructure Diagram](#4-infrastructure-diagram)
5. [Environment Configuration](#5-environment-configuration)
6. [Development Setup](#6-development-setup)

---

## 1. Repository Structure

```
nava-creations/
├── apps/
│   └── web/                        # Next.js 14+ storefront + admin dashboard
│       ├── app/
│       │   ├── (storefront)/       # Route group: customer-facing pages
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx        # Homepage
│       │   │   ├── products/
│       │   │   ├── collections/
│       │   │   ├── cart/
│       │   │   ├── checkout/
│       │   │   ├── account/
│       │   │   └── search/
│       │   ├── (admin)/            # Route group: admin dashboard
│       │   │   ├── layout.tsx      # Admin auth check in layout
│       │   │   ├── dashboard/
│       │   │   ├── products/
│       │   │   ├── orders/
│       │   │   ├── customers/
│       │   │   ├── inventory/
│       │   │   ├── promotions/
│       │   │   └── settings/
│       │   ├── api/
│       │   │   ├── webhooks/
│       │   │   │   ├── razorpay/   # POST /api/webhooks/razorpay
│       │   │   │   └── shiprocket/ # POST /api/webhooks/shiprocket
│       │   │   └── health/         # GET /api/health
│       │   └── actions/            # Server Actions (grouped by domain)
│       │       ├── cart.actions.ts
│       │       ├── checkout.actions.ts
│       │       ├── product.actions.ts
│       │       └── auth.actions.ts
│       ├── components/             # App-specific components
│       │   ├── storefront/
│       │   └── admin/
│       ├── lib/
│       │   ├── auth.ts             # Auth configuration (next-auth)
│       │   ├── env.ts              # Validated env variables (t3-env)
│       │   └── middleware.ts
│       ├── middleware.ts           # Auth + rate limiting middleware
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       └── tsconfig.json
│
├── packages/
│   ├── ui/                         # Shared React component library
│   │   ├── src/
│   │   │   ├── components/         # Button, Input, Modal, Badge, etc.
│   │   │   ├── hooks/              # useCart, useWishlist, useToast
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── domain/                     # Business logic — PURE functions, no DB calls
│   │   ├── src/
│   │   │   ├── cart/
│   │   │   │   ├── cart.service.ts
│   │   │   │   ├── cart.types.ts
│   │   │   │   └── cart.validation.ts
│   │   │   ├── order/
│   │   │   │   ├── order.service.ts
│   │   │   │   ├── order.types.ts
│   │   │   │   └── order.validation.ts
│   │   │   ├── payment/
│   │   │   │   ├── payment.service.ts
│   │   │   │   ├── payment.types.ts
│   │   │   │   └── gateway/
│   │   │   │       ├── payment-gateway.interface.ts
│   │   │   │       ├── razorpay.gateway.ts
│   │   │   │       └── cashfree.gateway.ts
│   │   │   ├── inventory/
│   │   │   │   ├── inventory.service.ts
│   │   │   │   └── inventory.types.ts
│   │   │   ├── pricing/
│   │   │   │   ├── pricing.service.ts  # GST calculation, discount application
│   │   │   │   └── pricing.types.ts
│   │   │   └── shipping/
│   │   │       ├── shipping.service.ts
│   │   │       └── shiprocket.gateway.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── db/                         # Prisma schema, client, repositories
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Single source of truth for DB schema
│   │   │   ├── migrations/         # Auto-generated SQL migrations
│   │   │   └── seed.ts             # Development seed data
│   │   ├── src/
│   │   │   ├── client.ts           # Prisma client singleton
│   │   │   └── repositories/       # All DB access — one repo per domain entity
│   │   │       ├── product.repository.ts
│   │   │       ├── order.repository.ts
│   │   │       ├── inventory.repository.ts
│   │   │       ├── cart.repository.ts
│   │   │       └── user.repository.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── config/                     # Shared configuration
│       ├── eslint/
│       │   └── index.js            # Shared ESLint config
│       ├── typescript/
│       │   └── base.json           # Shared tsconfig base
│       └── env/
│           └── schema.ts           # Zod env validation schema (t3-env)
│
├── infrastructure/
│   ├── database/
│   │   ├── seed/
│   │   │   ├── categories.sql      # Initial category seed
│   │   │   └── store-settings.sql
│   │   └── scripts/
│   │       └── backup.sh
│   └── deployment/
│       ├── docker-compose.yml      # Local dev: PostgreSQL + mailhog
│       └── .env.example            # Template for all required env vars
│
├── docs/
│   ├── architecture/               # This directory
│   ├── business/
│   └── branding/
│
├── tests/
│   ├── unit/                       # Domain service unit tests (Vitest)
│   ├── integration/                # Repository + DB integration tests
│   └── e2e/                        # Playwright end-to-end tests
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint, type-check, unit tests on PR
│       ├── e2e.yml                 # Playwright tests on staging deployment
│       └── deploy.yml              # Production deployment on merge to main
│
├── package.json                    # Root — pnpm workspaces
├── pnpm-workspace.yaml
├── turbo.json                      # Turborepo build pipeline
└── .gitignore
```

### Structure Justification

| Directory | Rationale |
|-----------|-----------|
| `apps/web/` | Single Next.js app serves both storefront and admin — no separate deployment for admin |
| `packages/domain/` | Pure business logic, framework-agnostic, fully testable with Vitest — the most important package |
| `packages/db/` | All database access in one place; swapping ORM is a single-package change |
| `packages/ui/` | Shared components prevent duplication between storefront and admin |
| `packages/config/` | ESLint and TypeScript configs in one place; enforced consistently via Turborepo |
| `infrastructure/` | Docker Compose for local dev; deployment configs versioned alongside code |
| `tests/` | Separated by type for different CI stages and speed characteristics |

> [!IMPORTANT]
> **Monorepo tool: pnpm + Turborepo.** `pnpm` for fast installs and workspace management. `turbo` for caching build outputs and running tasks in dependency order. This combination is well-supported on Vercel.

---

## 2. Application Layers

The application follows a strict layered architecture within the Next.js monolith:

```
┌─────────────────────────────────────────────────────┐
│          Browser (React Client Components)           │
│          Form submit → Server Action call            │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (Server Action / Route Handler)
┌──────────────────────▼──────────────────────────────┐
│     Layer 1: Entry Points (Next.js App Router)       │
│     • Server Actions  (apps/web/app/actions/)        │
│     • Route Handlers  (apps/web/app/api/)            │
│     Responsibilities:                                │
│     - Parse and validate raw input (Zod)             │
│     - Authenticate and authorize (next-auth session) │
│     - Call Domain Service with validated data        │
│     - Return typed response or redirect              │
│     - NEVER: contain business logic or DB calls      │
└──────────────────────┬──────────────────────────────┘
                       │ Typed function call
┌──────────────────────▼──────────────────────────────┐
│     Layer 2: Domain Services (packages/domain/)      │
│     • cart.service.ts, order.service.ts, etc.        │
│     Responsibilities:                                │
│     - Implement business rules (pure functions)      │
│     - Calculate prices server-side (never trust UI)  │
│     - Apply and validate discounts / coupons         │
│     - Orchestrate multi-step operations              │
│     - Define what constitutes a valid business op    │
│     - NEVER: call Prisma directly                    │
│     - NEVER: call external APIs directly             │
└──────────────────────┬──────────────────────────────┘
                       │ Repository call (interface)
┌──────────────────────▼──────────────────────────────┐
│     Layer 3: Repository Layer (packages/db/src/      │
│               repositories/)                         │
│     • product.repository.ts, order.repository.ts    │
│     Responsibilities:                                │
│     - ALL Prisma / SQL calls live here               │
│     - Translate domain models ↔ database rows        │
│     - Implement soft-delete filters automatically    │
│     - Handle transactions ($transaction)             │
│     - Return domain types, not raw Prisma models     │
└──────────────────────┬──────────────────────────────┘
                       │ SQL over TLS
┌──────────────────────▼──────────────────────────────┐
│     Layer 4: PostgreSQL (Neon Serverless)            │
│     • Source of truth for all business state         │
│     • UUID primary keys, JSONB for snapshots         │
│     • Row-level locking for inventory                │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS / SDK calls
┌──────────────────────▼──────────────────────────────┐
│     Layer 5: External Services                       │
│     • Razorpay (payment gateway)                     │
│     • Shiprocket (shipping aggregator)               │
│     • Cloudinary (image storage + CDN)               │
│     • Resend (transactional email)                   │
│     • WhatsApp Business API (order notifications)   │
└──────────────────────────────────────────────────────┘
```

### Layer Responsibilities Summary

| Layer | Input | Output | Allowed dependencies |
|-------|-------|--------|---------------------|
| Entry (Actions/Routes) | Raw HTTP / form data | HTTP response / redirect | Layer 2 (Domain) |
| Domain Services | Validated domain types | Domain types / events | Nothing — pure functions |
| Repositories | Domain types | Domain types | Prisma client only |
| PostgreSQL | SQL | Rows | — |
| External Services | HTTPS | Responses | — (called by Domain via gateway interfaces) |

---

## 3. Key Technical Flows

### 3.1 Customer Checkout Flow

```mermaid
sequenceDiagram
    actor Customer
    participant Browser
    participant NextJS as Next.js (Server Action)
    participant Domain as Domain Service
    participant Repo as Repository
    participant DB as PostgreSQL
    participant Razorpay
    participant Email as Resend (Email)

    Customer->>Browser: Clicks "Proceed to Checkout"
    Browser->>NextJS: checkoutAction(cartId, addressId)
    NextJS->>NextJS: Validate session (must be logged in)
    NextJS->>Domain: initiateCheckout(userId, cartId, addressId)
    Domain->>Repo: getCartWithItems(cartId)
    Repo->>DB: SELECT cart + items + variants
    DB-->>Repo: Cart data
    Repo-->>Domain: Cart domain model
    Domain->>Domain: Recalculate prices server-side (NEVER trust client prices)
    Domain->>Domain: Apply GST (verify tax rate from store settings)
    Domain->>Domain: Apply coupon if present (verify server-side)
    Domain->>Repo: reserveStock(items[]) — atomic
    Repo->>DB: BEGIN TRANSACTION\nSELECT FOR UPDATE inventory_items\nINSERT stock_reservations\nUPDATE inventory_items.reserved_qty\nCOMMIT
    DB-->>Repo: Reservation IDs
    Domain->>Repo: createPendingOrder(orderData)
    Repo->>DB: INSERT orders (status=PENDING)\nINSERT order_items (with JSONB snapshot)
    DB-->>Repo: Order record
    Domain->>Razorpay: createOrder(amount, currency, receipt)
    Razorpay-->>Domain: Razorpay Order ID
    Domain->>Repo: savePendingPayment(orderId, razorpayOrderId)
    Domain-->>NextJS: { orderId, razorpayOrderId, amount, key }
    NextJS-->>Browser: Checkout session data
    Browser->>Browser: Open Razorpay Checkout modal
    Customer->>Browser: Completes payment (UPI / card / etc.)
    Browser->>Razorpay: Payment submitted
    Razorpay-->>Browser: payment.id (client-side success)
    Browser->>NextJS: verifyPaymentAction(razorpayPaymentId, razorpayOrderId, signature)
    Note over Browser,NextJS: Client reports success — but we don't trust it yet
    NextJS->>Domain: handleClientPaymentCallback(paymentData)
    Domain->>Domain: Verify HMAC signature (razorpay_order_id + "|" + razorpay_payment_id)
    Domain->>Repo: updatePaymentAttempt(status=AWAITING_WEBHOOK)
    Domain-->>NextJS: { status: "pending_confirmation" }
    NextJS-->>Browser: Show "Order placed, confirming payment…"

    Note over Razorpay,DB: Razorpay fires webhook asynchronously
    Razorpay->>NextJS: POST /api/webhooks/razorpay (payment.captured event)
    NextJS->>NextJS: Verify webhook HMAC signature
    NextJS->>NextJS: Check idempotency key (payment event ID already processed?)
    NextJS->>Domain: handlePaymentCapture(webhookEvent)
    Domain->>Repo: BEGIN TRANSACTION
    Domain->>Repo: updateOrderStatus(orderId, CONFIRMED)
    Domain->>Repo: updatePaymentEvent(captured)
    Domain->>Repo: commitStockReservations (convert reservations to actual decrements)
    Domain->>Repo: clearCart(cartId)
    Domain->>Repo: COMMIT
    Domain->>Email: sendOrderConfirmationEmail(order)
    Email-->>Customer: Order confirmation email
    Domain-->>NextJS: 200 OK
    NextJS-->>Razorpay: 200 OK (acknowledge webhook)
```

### 3.2 Admin Product Creation Flow

```mermaid
sequenceDiagram
    actor Admin
    participant Browser
    participant Cloudinary
    participant NextJS as Next.js (Server Action)
    participant Domain as Domain Service
    participant Repo as Repository
    participant DB as PostgreSQL

    Admin->>Browser: Fills product form (name, description, variants, images)
    Browser->>NextJS: GET /api/admin/upload-signature
    NextJS->>NextJS: Verify admin session + ADMIN permission
    NextJS->>Cloudinary: Generate signed upload URL (server-side)
    Cloudinary-->>NextJS: Signed upload parameters
    NextJS-->>Browser: { signature, timestamp, cloudName, apiKey }
    Browser->>Cloudinary: Upload images directly (signed)
    Cloudinary-->>Browser: { public_id, secure_url, width, height }
    Admin->>Browser: Submits product form
    Browser->>NextJS: createProductAction(productData, variantData, imagePublicIds)
    NextJS->>NextJS: Verify admin session and CREATE_PRODUCT permission
    NextJS->>NextJS: Validate input with Zod schema
    NextJS->>Domain: createProduct(validatedProductData)
    Domain->>Domain: Validate business rules (at least one variant, price > 0, etc.)
    Domain->>Domain: Generate SKUs if not provided
    Domain->>Domain: Calculate slug from name (unique check needed)
    Domain->>Repo: BEGIN TRANSACTION
    Domain->>Repo: createProduct(productData)
    Domain->>Repo: createProductVariants(variants)
    Domain->>Repo: createSkus(skus)
    Domain->>Repo: createInventoryItems(initialStock)
    Domain->>Repo: createProductImages(cloudinaryPublicIds)
    Domain->>Repo: COMMIT
    Repo->>DB: All inserts in single transaction
    DB-->>Repo: Created records
    Domain-->>NextJS: { product, variants, inventory }
    NextJS-->>Browser: Redirect to /admin/products/{productId}
    Browser->>Admin: Product created success view
```

### 3.3 Stock Reservation and Release Flow

```mermaid
sequenceDiagram
    participant Action as Server Action
    participant InventoryService
    participant Repo as Repository
    participant DB as PostgreSQL

    Note over Action,DB: RESERVE — happens at checkout initiation
    Action->>InventoryService: reserveStock([ {skuId, qty} ])
    InventoryService->>Repo: reserveStock(items)
    Repo->>DB: BEGIN TRANSACTION (SERIALIZABLE)
    Repo->>DB: SELECT id, available_qty, reserved_qty\n  FROM inventory_items\n  WHERE sku_id IN (...)\n  FOR UPDATE
    DB-->>Repo: Locked inventory rows
    Repo->>Repo: Validate: available_qty - reserved_qty >= requested_qty for each item
    alt Insufficient stock
        Repo-->>InventoryService: InsufficientStockError { skuId, available, requested }
        InventoryService-->>Action: throw InsufficientStockError
        Action-->>Browser: "Item out of stock" message
    else Stock available
        Repo->>DB: INSERT stock_reservations (skuId, qty, orderId, expiresAt = now+15min)
        Repo->>DB: UPDATE inventory_items SET reserved_qty = reserved_qty + qty
        Repo->>DB: COMMIT
        Repo-->>InventoryService: { reservationIds }
        InventoryService-->>Action: { reservationIds }
    end

    Note over Action,DB: COMMIT — happens on payment.captured webhook
    Action->>InventoryService: commitReservations(reservationIds)
    InventoryService->>Repo: commitReservations(ids)
    Repo->>DB: BEGIN TRANSACTION
    Repo->>DB: SELECT * FROM stock_reservations WHERE id IN (...) FOR UPDATE
    Repo->>DB: UPDATE inventory_items\n  SET available_qty = available_qty - qty,\n      reserved_qty = reserved_qty - qty\n  WHERE sku_id = ...
    Repo->>DB: INSERT inventory_movements (type=SALE, qty, orderId)
    Repo->>DB: DELETE FROM stock_reservations WHERE id IN (...)
    Repo->>DB: COMMIT

    Note over Action,DB: RELEASE — happens on payment failure or reservation expiry
    Action->>InventoryService: releaseReservations(reservationIds)
    InventoryService->>Repo: releaseReservations(ids)
    Repo->>DB: BEGIN TRANSACTION
    Repo->>DB: UPDATE inventory_items SET reserved_qty = reserved_qty - qty
    Repo->>DB: DELETE FROM stock_reservations WHERE id IN (...)
    Repo->>DB: COMMIT

    Note over DB: CRON JOB (Vercel Cron / pg cron): Release expired reservations
    DB->>DB: DELETE FROM stock_reservations WHERE expires_at < NOW()\n  RETURNING sku_id, qty
    DB->>DB: UPDATE inventory_items SET reserved_qty = reserved_qty - qty
```

> [!IMPORTANT]
> The stock reservation uses `SELECT ... FOR UPDATE` which acquires a row-level lock within a transaction. This prevents two concurrent checkouts from both seeing sufficient stock and both reserving the same units (the classic oversell bug). Reservations expire after 15 minutes to handle abandoned checkouts.

### 3.4 Webhook Processing — Idempotent Pattern

```mermaid
sequenceDiagram
    participant Razorpay
    participant Handler as /api/webhooks/razorpay
    participant DB as PostgreSQL
    participant Domain as Domain Service

    Razorpay->>Handler: POST webhook (event_id, event_type, payload)
    Handler->>Handler: 1. Verify HMAC-SHA256 signature\n   (X-Razorpay-Signature header)
    alt Signature invalid
        Handler-->>Razorpay: 400 Bad Request
    end
    Handler->>DB: SELECT id FROM payment_events\n  WHERE gateway_event_id = event_id
    alt Event already processed
        Handler-->>Razorpay: 200 OK (idempotent — already done)
    else New event
        Handler->>DB: INSERT payment_events\n  (gateway_event_id, status=PROCESSING, raw_payload)
        Handler->>Domain: processPaymentEvent(event)
        alt Processing success
            Domain->>DB: Business logic updates (order, inventory, etc.)
            Handler->>DB: UPDATE payment_events SET status=PROCESSED
            Handler-->>Razorpay: 200 OK
        else Processing error
            Handler->>DB: UPDATE payment_events\n  SET status=FAILED, error_message=...
            Handler-->>Razorpay: 500 (Razorpay will retry)
        end
    end
```

> [!NOTE]
> Razorpay retries webhook delivery up to 3 times over 24 hours. The idempotency check on `gateway_event_id` ensures that retries are safely ignored after the first successful processing. Never return 500 to a webhook unless you want it retried.

---

## 4. Infrastructure Diagram

```mermaid
flowchart TD
    subgraph Browsers["👥 Clients"]
        CB["Customer Browser\n(Mobile / Desktop)"]
        AB["Admin Browser\n(Desktop)"]
    end

    subgraph Vercel["☁️ Vercel (Edge + Serverless)"]
        CDN["Vercel Edge CDN\n(Static assets, ISR pages)"]
        NEXT["Next.js App\n(Server Components, Server Actions,\nRoute Handlers, Middleware)"]
    end

    subgraph Neon["🐘 Neon (Serverless PostgreSQL)"]
        POOL["PgBouncer\nConnection Pool"]
        PG["PostgreSQL\n(Primary DB)"]
    end

    subgraph External["🌐 External Services"]
        RZP["Razorpay\n(Payment Gateway)"]
        SHIP["Shiprocket\n(Shipping)"]
        CLY["Cloudinary\n(Images + CDN)"]
        RESEND["Resend\n(Transactional Email)"]
        WA["WhatsApp Business API\n(via Interakt)"]
    end

    subgraph Webhooks["📨 Incoming Webhooks"]
        RZPWH["Razorpay Webhooks\nPOST /api/webhooks/razorpay"]
        SHIPWH["Shiprocket Webhooks\nPOST /api/webhooks/shiprocket"]
    end

    CB -->|"HTTPS"| CDN
    CB -->|"HTTPS (dynamic)"| NEXT
    AB -->|"HTTPS"| NEXT
    CDN -->|"Cache miss"| NEXT
    NEXT -->|"Prisma over TLS"| POOL
    POOL --> PG
    NEXT -->|"Razorpay SDK"| RZP
    NEXT -->|"Shiprocket REST"| SHIP
    NEXT -->|"Cloudinary SDK"| CLY
    NEXT -->|"Resend SDK"| RESEND
    NEXT -->|"WhatsApp API"| WA
    RZP -->|"Signed webhook"| RZPWH
    SHIP -->|"Signed webhook"| SHIPWH
    RZPWH --> NEXT
    SHIPWH --> NEXT

    style Vercel fill:#000,color:#fff
    style Neon fill:#1a1a2e,color:#fff
    style External fill:#0d3b66,color:#fff
    style Browsers fill:#1b4332,color:#fff
    style Webhooks fill:#3d0000,color:#fff
```

### Key Infrastructure Points

| Component | Provider | Purpose | Failover |
|-----------|----------|---------|---------|
| App Runtime | Vercel Serverless | Next.js execution | Vercel handles auto-scaling |
| CDN | Vercel Edge Network | Static assets, cached pages | Automatic |
| Database | Neon (PostgreSQL) | All persistent data | Neon auto-replication |
| Images | Cloudinary | Product media, transformations | Cloudinary global CDN |
| Email | Resend | Transactional emails | Queue-based, retries |
| Payment | Razorpay | Payment processing | Cashfree as failover plan |
| Shipping | Shiprocket | Multi-carrier aggregation | Direct carrier as fallback |

---

## 5. Environment Configuration

> [!CAUTION]
> Never commit actual values for any of these variables. Use `.env.local` for local dev (git-ignored) and Vercel Environment Variables for production. Never put secrets in code, in `next.config.ts`, or in any committed file.

All environment variables are validated at startup using `t3-env` with Zod schemas. Undefined required variables cause the app to fail fast at startup, not at runtime.

### Complete Environment Variable Reference

```bash
# ============================================================
# DATABASE
# ============================================================

# Primary database connection (use pooled URL in production)
DATABASE_URL="postgresql://user:password@host:5432/nava_prod?sslmode=require"

# Direct connection for Prisma migrations (not pooled)
DATABASE_URL_UNPOOLED="postgresql://user:password@host:5432/nava_prod?sslmode=require"

# ============================================================
# AUTHENTICATION (next-auth)
# ============================================================

# Random 32+ char string — generate with: openssl rand -base64 32
AUTH_SECRET="..."

# OAuth providers (add as needed)
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# ============================================================
# PAYMENT GATEWAY — RAZORPAY
# ============================================================

# Public key — safe to expose in browser (used in Razorpay Checkout)
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_..."

# Secret key — SERVER ONLY — never expose to browser
RAZORPAY_KEY_SECRET="..."

# Webhook secret — from Razorpay dashboard webhook settings
RAZORPAY_WEBHOOK_SECRET="..."

# ============================================================
# PAYMENT GATEWAY — CASHFREE (backup / future)
# ============================================================

CASHFREE_APP_ID="..."
CASHFREE_SECRET_KEY="..."
CASHFREE_WEBHOOK_SECRET="..."

# ============================================================
# SHIPPING — SHIPROCKET
# ============================================================

SHIPROCKET_EMAIL="..."
SHIPROCKET_PASSWORD="..."
# Or API token if using token-based auth
SHIPROCKET_API_TOKEN="..."
SHIPROCKET_WEBHOOK_SECRET="..."

# ============================================================
# IMAGE STORAGE — CLOUDINARY
# ============================================================

# Cloud name is public (used in image URLs)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="nava-creations"

# API credentials — SERVER ONLY
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Upload preset for unsigned uploads (if using unsigned preset)
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET="nava_products"

# ============================================================
# EMAIL — RESEND
# ============================================================

RESEND_API_KEY="re_..."

# From address (must be verified domain)
RESEND_FROM_EMAIL="orders@navacreations.in"

# ============================================================
# WHATSAPP — INTERAKT (or 360dialog)
# ============================================================

INTERAKT_API_KEY="..."

# ============================================================
# APPLICATION URLS
# ============================================================

# Base URL — no trailing slash
NEXT_PUBLIC_APP_URL="https://navacreations.in"

# Admin-specific URL if different
NEXT_PUBLIC_ADMIN_URL="https://navacreations.in/admin"

# ============================================================
# ANALYTICS
# ============================================================

NEXT_PUBLIC_GA_MEASUREMENT_ID="G-..."

# PostHog (optional product analytics)
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"

# ============================================================
# INTERNAL CONFIGURATION
# ============================================================

# Node environment
NODE_ENV="production"

# Stock reservation TTL in minutes
STOCK_RESERVATION_TTL_MINUTES="15"

# Admin email(s) for system alerts
ADMIN_ALERT_EMAIL="admin@navacreations.in"
```

### Environment Variable Validation (t3-env schema)

```typescript
// packages/config/env/schema.ts
import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    DATABASE_URL_UNPOOLED: z.string().url(),
    AUTH_SECRET: z.string().min(32),
    RAZORPAY_KEY_SECRET: z.string().startsWith("rzp_"),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(16),
    CLOUDINARY_API_SECRET: z.string(),
    RESEND_API_KEY: z.string().startsWith("re_"),
    // ... all server-only vars
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().startsWith("rzp_"),
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string(),
    // ... all client-visible vars (NEXT_PUBLIC_ prefix)
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    // ... map each var
  },
})
```

---

## 6. Development Setup

### Prerequisites

Before starting, ensure you have installed:
- **Node.js** v20+ (use `nvm` or `fnm` for version management)
- **pnpm** v9+ (`npm install -g pnpm`)
- **Docker Desktop** (for local PostgreSQL)
- **Git**

### Step-by-Step Setup

#### Step 1: Clone the Repository

```bash
git clone https://github.com/nava-creations/nava-creations.git
cd nava-creations
```

#### Step 2: Install Dependencies

```bash
pnpm install
```

Turborepo will install dependencies across all workspace packages.

#### Step 3: Set Up Local Environment Variables

```bash
# Copy the example env file
cp infrastructure/deployment/.env.example apps/web/.env.local

# Edit with your local/test credentials
# Minimum required for local dev:
# - DATABASE_URL (local Docker PostgreSQL)
# - AUTH_SECRET (any 32+ char string)
# - NEXT_PUBLIC_RAZORPAY_KEY_ID (test key from Razorpay dashboard)
# - RAZORPAY_KEY_SECRET (test secret)
# - CLOUDINARY_* (free Cloudinary account)
```

#### Step 4: Start Local Database

```bash
# Start PostgreSQL (and mailhog for email preview) with Docker Compose
docker compose -f infrastructure/deployment/docker-compose.yml up -d

# Verify PostgreSQL is running
docker ps | grep postgres
```

The Docker Compose file starts:
- **PostgreSQL 16** on `localhost:5432` with database `nava_dev`
- **Mailhog** on `localhost:8025` for catching local emails (UI at http://localhost:8025)

#### Step 5: Run Database Migrations

```bash
# From the db package
cd packages/db

# Apply migrations to local database
pnpm prisma migrate dev

# Or from root with Turborepo
cd ../..
pnpm turbo db:migrate
```

#### Step 6: Seed Development Data

```bash
# Seed with sample categories, products, and test users
pnpm turbo db:seed

# This creates:
# - Admin user: admin@nava.test / Admin@12345 (dev only)
# - 5 sample product categories
# - 3 sample products with variants and inventory
# - Store settings with GST configuration
```

#### Step 7: Start Development Server

```bash
# Start the Next.js dev server (from root)
pnpm turbo dev

# Or just the web app
cd apps/web && pnpm dev
```

The app starts on http://localhost:3000  
Admin dashboard: http://localhost:3000/admin

#### Step 8: Configure Webhook Testing (Optional)

For testing Razorpay webhooks locally:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Copy the ngrok HTTPS URL and add to Razorpay test dashboard:
# Webhooks → Add Webhook → https://abc123.ngrok.io/api/webhooks/razorpay
```

#### Step 9: Verify Setup

```bash
# Run all checks
pnpm turbo typecheck lint test:unit

# Expected output:
# ✓ TypeScript: 0 errors
# ✓ ESLint: 0 warnings
# ✓ Unit tests: all passing
```

### Local Development Docker Compose Reference

```yaml
# infrastructure/deployment/docker-compose.yml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: nava_dev
      POSTGRES_USER: nava
      POSTGRES_PASSWORD: nava_local_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"   # SMTP
      - "8025:8025"   # Web UI

volumes:
  postgres_data:
```

### Useful Development Commands

| Command | Description |
|---------|-------------|
| `pnpm turbo dev` | Start all dev servers |
| `pnpm turbo build` | Build all packages |
| `pnpm turbo typecheck` | TypeScript check across all packages |
| `pnpm turbo lint` | ESLint across all packages |
| `pnpm turbo test:unit` | Vitest unit tests |
| `pnpm turbo test:e2e` | Playwright E2E tests |
| `pnpm turbo db:migrate` | Run pending migrations |
| `pnpm turbo db:seed` | Seed development data |
| `pnpm turbo db:studio` | Open Prisma Studio (DB GUI) |
| `pnpm turbo db:reset` | Reset and re-seed dev database |

> [!TIP]
> Run `pnpm turbo db:studio` to open Prisma Studio at http://localhost:5555 — a visual DB browser that is very useful during development for inspecting records.

---

*This document is part of NAVA CREATIONS Phase 0 Architecture documentation.*
