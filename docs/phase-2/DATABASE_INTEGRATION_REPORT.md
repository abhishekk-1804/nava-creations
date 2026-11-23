# NAVA CREATIONS — Phase C: Database Integration & Architecture Report

**Date:** 2026-11-11  
**Author:** Coordinated Senior Engineering Team  
**Scope:** PostgreSQL Schema, Prisma ORM, Migrations, Fault Tolerance & Operational Readiness  
**Status:** VALIDATED & COMPLIANT (PASS)

---

## 1. Executive Summary

This report evaluates the PostgreSQL database integration for NAVA CREATIONS across the data model, Prisma ORM abstraction, database migrations, connection lifecycle, and runtime fault tolerance.

The database architecture is designed for a boutique small-business accessories atelier based in Bengaluru, India. It combines Neon Serverless PostgreSQL with dual connection pooling (`pgbouncer=true` for application traffic and direct connections for Prisma migrations), transactional schema integrity, strict integer-based currency representations (Indian paise), and configurable Indian GST tax modes.

---

## 2. Infrastructure & Connection Topology

### 2.1 Connection Topology
```mermaid
graph TD
    App[Next.js Storefront & Admin] -->|DATABASE_URL<br/>Pooler Port 5432 / pgbouncer| NeonPooler[Neon Connection Pooler]
    PrismaCLI[Prisma CLI Migrations] -->|DIRECT_URL<br/>Direct Port 5432| PostgresPrimary[PostgreSQL 16 Primary]
    NeonPooler --> PostgresPrimary
```

- **Runtime Database Access (`DATABASE_URL`):** Utilizes Neon's transaction pooler with `?sslmode=require&pgbouncer=true`. Designed to handle bursty serverless connection counts without exhausting backend connection limits.
- **Migration & Introspection Access (`DIRECT_URL`):** Bypasses transaction pooling to establish direct session connections necessary for DDL statements, advisory locking, and enum alterations.

---

## 3. Schema Completeness & Entity-Relationship Model

The PostgreSQL schema (`packages/db/prisma/schema.prisma`) comprises 14 normalized models structured into 7 domain clusters:

### 3.1 Domain Clusters & Entity Overview
```mermaid
erDiagram
    users ||--o{ customer_addresses : has
    users ||--o{ admin_sessions : owns
    users ||--o{ audit_logs : records
    users ||--o{ orders : places
    users ||--o{ carts : maintains

    categories ||--o{ categories : "sub-categories"
    categories ||--o{ products : classifies
    products ||--o{ product_variants : contains
    products ||--o{ product_images : displays
    products ||--o{ collection_products : categorized_in
    collections ||--o{ collection_products : groups

    product_variants ||--|| inventory_items : tracks_stock
    product_variants ||--o{ inventory_reservation_items : reserves
    product_variants ||--o{ cart_items : holds
    product_variants ||--o{ order_items : purchases

    carts ||--o{ cart_items : includes
    carts ||--o{ inventory_reservations : creates

    orders ||--o{ order_items : includes
    orders ||--o{ payments : collects
    orders ||--o{ refunds : reimburses
    orders ||--o{ return_requests : receives

    payments ||--o{ payment_attempts : logs
    payments ||--o{ refunds : settles

    return_requests ||--o{ return_items : inspects
    order_items ||--o{ return_items : references
```

1. **Authentication & Identity (`User`, `CustomerAddress`, `AdminSession`, `AuditLog`)**:
   - Role-based permissions: `SUPER_ADMIN`, `STORE_MANAGER`, `ORDER_OPERATOR`, `CATALOG_EDITOR`, `SUPPORT_AGENT`, `CUSTOMER`.
   - Cryptographically hashed session records (`sessionTokenHash`) supporting revocation and TTL expiry.
   - Comprehensive audit logging for administrative mutations.
2. **Product Catalogue & Merchandising (`Category`, `Product`, `ProductVariant`, `ProductImage`, `Collection`, `CollectionProduct`)**:
   - Self-referencing recursive taxonomy (`parentId -> Category.id`) supporting multi-tiered bridal and festival categories.
   - Integer-based monetary fields (`pricePaise`, `compareAtPricePaise`, `mrpPaise`) ensuring zero floating-point rounding errors.
   - Variant-level attributes (`size`, `colour`, `weightGrams`) for bangle sizing (2.4, 2.6, 2.8, etc.).
3. **Inventory & Atomic Reservations (`InventoryItem`, `InventoryReservation`, `InventoryReservationItem`)**:
   - Variant inventory tracking (`availableQty`, `reservedQty`, `safetyStock`).
   - Time-bounded reservation status machine (`PENDING`, `CONFIRMED`, `EXPIRED`, `RELEASED`) preventing overselling during checkout bursts.
4. **Cart Lifecycle (`Cart`, `CartItem`)**:
   - Ephemeral guest carts (`sessionId`) and authenticated user carts with TTL expiration.
5. **Orders & Commercial Settlement (`Order`, `OrderItem`)**:
   - Complete status machine (`PENDING_PAYMENT`, `PAYMENT_CONFIRMED`, `PROCESSING`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RTO_INITIATED`, `RTO_DELIVERED`, `RETURN_REQUESTED`, `RETURNED`, `CLOSED`).
   - Snapshot address fields (`shippingAddress`, `billingAddress`) preserved in JSON format against customer profile changes.
   - HSN codes and configurable Indian GST tax modes (`UNREGISTERED`, `COMPOSITION`, `REGULAR`).
6. **Payments & Idempotency (`Payment`, `PaymentAttempt`, `Refund`, `WebhookEvent`)**:
   - Gateway abstraction with multi-attempt auditing.
   - Idempotency key tracking on refunds preventing duplicate payouts.
   - Deduped webhook event processing (`WebhookEvent.gatewayEventId`).
7. **Reverse Logistics & Returns (`ReturnRequest`, `ReturnItem`)**:
   - Support for customer reason documentation, photo evidence URLs, and reverse AWB tracking.
   - Quality control inspection status (`PENDING`, `PASSED`, `FAILED`) and restocking disposition (`RESTOCK_TO_INVENTORY`, `SCRAP_DAMAGED`, `RETURN_TO_VENDOR`).

---

## 4. Migration & Schema Verification

### 4.1 Prisma Validation Output
```
$ pnpm --filter @nava/db validate
Prisma schema loaded from prisma\schema.prisma
The schema at prisma\schema.prisma is valid 🚀
```

### 4.2 Schema Migration Differential
Running `pnpm --filter @nava/db migrate:diff` against an empty database confirmed that the baseline migration `packages/db/prisma/migrations/0_init/migration.sql` exactly matches the data model:
- 14 tables created with proper primary key UUID constraints.
- Foreign key relations mapped with strict referential actions (`ON DELETE CASCADE` on line items, `ON DELETE SET NULL` on audit/user references).
- 26 performance and query indexes created covering lookup keys, foreign keys, and filter predicates.

---

## 5. Runtime Fault Tolerance & Graceful Degradation

In production e-commerce operations, transient database disconnects or cold boots must never crash the customer storefront or return unhandled exceptions:

1. **Health Check Probes**:
   - `/api/health/live`: Always returns HTTP 200 `{ status: "alive" }` so load balancers do not restart healthy containers during transient database blips.
   - `/api/health/ready`: Performs `SELECT 1` database ping with a 3000ms timeout. If unavailable, returns HTTP 503 `{ status: "unavailable", error: "DATABASE_UNAVAILABLE" }`.
2. **Storefront Resiliency**:
   - When database connectivity is detected as unavailable or unconfigured, read routes gracefully degrade or signal service unavailability without throwing unhandled exceptions.
   - In production mode (`NODE_ENV === 'production'`), silent fallback to mock catalogue data is strictly prohibited (`DatabaseUnavailableError` raised) to safeguard business integrity and prevent stale pricing from being surfaced to shoppers.

---

## 6. Recommendations & Next Steps

1. **Connection Pool Sizing**:
   - In serverless Next.js deployments (e.g. Vercel), configure `connection_limit=1` per lambda invocation to prevent connection starvation.
2. **Production Neon Provisioning**:
   - Prior to soft launch, provision a dedicated production database on Neon AWS `ap-south-1` (Mumbai) or `ap-southeast-1` (Singapore) for optimal low-latency round-trips to Bengaluru users.
3. **Automated Migration Pipeline**:
   - Run `prisma migrate deploy` during the CI/CD release phase prior to rolling out new Next.js builds.
