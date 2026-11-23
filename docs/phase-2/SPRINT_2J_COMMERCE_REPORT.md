# NAVA CREATIONS — Sprint 2J Commerce Foundation Report
## Data Models, Integer Paise Accounting & Sovereign Commerce Architecture

**Document Version:** 1.0.0  
**Date:** 2026-11-11  
**Project:** NAVA CREATIONS (`D:\NAVA`)  
**Scope:** E-Commerce Domain Entities, Monetary Mathematics, Prisma Persistence, and Lifecycle State Machines  

---

## 1. Executive Summary

In Sprint 2J, NAVA CREATIONS transitioned from a generic prototype payment architecture to a production-grade, database-backed commerce data foundation. Following strict business directives, all unapproved third-party payment gateways carrying percentage MDR (Merchant Discount Rate) or platform fees (specifically Razorpay) were eliminated.

In their place, NAVA CREATIONS established an India-first commerce foundation built upon:
1. **Integer Paise Monetary Accounting:** Exact zero-drift monetary representation through the `@nava/domain` `Money` value object.
2. **Immutable Server-Authoritative Pricing:** Client-provided prices are completely untrusted; prices and variant availability are resolved server-side from catalog persistence.
3. **Pure Domain State Machines:** Formal deterministic state progression for Orders, Payments, and Inventory Reservations.
4. **Dual Sovereign Payment Methods:**
   - **BharatPe Merchant UPI QR (Zero-MDR):** Standard NPCI UPI Intent URI generation with customer UTR submission and store-owner manual ledger verification.
   - **Cash on Delivery (COD):** Server-enforced order ceiling (₹5,000 max), distinct collection lifecycle, and courier reconciliation tracking.
5. **Decoupled Database Persistence:** Zero hard runtime dependency on active PostgreSQL connections for storefront browsing; graceful degradation with structured fallback for offline customer consultation.

---

## 2. Entity Architecture & Prisma Schema Mapping

The commerce domain is anchored in `packages/db/prisma/schema.prisma` and mirrored by pure domain models in `packages/domain/src/`.

### 2.1 Entity Relationship Diagram

```mermaid
erDiagram
    Product ||--|{ ProductVariant : "has variants"
    ProductVariant ||--|{ InventoryReservation : "reserves stock"
    Customer ||--|{ Order : "places"
    Customer ||--|{ Address : "owns"
    Order ||--|{ OrderItem : "contains"
    Order ||--|{ Payment : "settled via"
    Order ||--|{ OrderStatusHistory : "tracked by"
    ProductVariant ||--|{ OrderItem : "referenced in"

    Product {
        string id PK
        string title
        string slug UK
        string status
        int basePrice
    }

    ProductVariant {
        string id PK
        string productId FK
        string sku UK
        string title
        int price
        int stockQuantity
    }

    Order {
        string id PK
        string orderNumber UK
        string customerId FK
        string status
        string paymentMethod
        int subtotalPaise
        int shippingPaise
        int totalPaise
        string currency
    }

    OrderItem {
        string id PK
        string orderId FK
        string variantId FK
        int quantity
        int unitPricePaise
        int totalPricePaise
    }

    Payment {
        string id PK
        string orderId FK
        string method
        string status
        int amountPaise
        string upiTransactionRef
        string verifiedByUserId
        datetime verifiedAt
        string courierAwb
        datetime collectedAt
    }
```

### 2.2 Traceability Matrix: Domain Models to Prisma Schema

| Domain Entity | Prisma Model | Key Invariants & Safeguards |
| :--- | :--- | :--- |
| `Money` Value Object | `Int` (columns ending in `Paise`) | Strictly integer paise; floating-point inputs throw `ValidationError`. No JavaScript `0.1 + 0.2` rounding errors. |
| `Product` & `ProductVariant` | `Product`, `ProductVariant` | SKU uniqueness constraint (`@@unique([sku])`); positive stock constraint; active status required for checkout. |
| `InventoryReservation` | `InventoryReservation` | 15-minute TTL; atomic decrement on reservation; released upon order expiry or cancellation. |
| `Customer` & `Address` | `Customer`, `Address` | Phone number normalization (+91 E.164); PIN code regex validation (6 digits Indian postal code). |
| `Order` | `Order` | Unique readable reference (`ORD-YYYYMMDD-XXXX`); immutable pricing snapshot; payment method binding. |
| `OrderItem` | `OrderItem` | Immutable unit price snapshot taken at moment of order creation. Future catalog price changes never mutate past orders. |
| `Payment` | `Payment` | Dual tracking for UPI UTR (`upiTransactionRef`) and COD (`courierAwb`, `collectedAt`). |
| `OrderStatusHistory` | `OrderStatusHistory` | Comprehensive audit trail: `fromStatus`, `toStatus`, `changedBy`, `reason`, `createdAt`. |

---

## 3. Server-Authoritative Pricing & Cart Integrity

### 3.1 The Vulnerability of Client-Side Price Trusts
In naive e-commerce implementations, client applications send cart item prices to the checkout API. Malicious actors intercept HTTP payloads, altering a ₹3,499.00 silver earring price to ₹1.00.

### 3.2 NAVA CREATIONS Server-Side Price Resolution
In NAVA CREATIONS (`apps/web/app/api/orders/route.ts` and `apps/web/lib/payment-service.ts`):
1. **Client sends only:** `variantId` (or `sku`) and `quantity`.
2. **Server fetches from Catalog:** The canonical database record or validated catalog entity is queried.
3. **Price Calculation:** `unitPricePaise` is read directly from server authority.
4. **Subtotal & Total Computations:**
   $$\text{itemTotal} = \text{unitPricePaise} \times \text{quantity}$$
   $$\text{subtotalPaise} = \sum \text{itemTotal}_i$$
   $$\text{shippingPaise} = \text{subtotalPaise} \ge \text{threshold} \ ? \ 0 : \text{flatShippingRate}$$
   $$\text{totalPaise} = \text{subtotalPaise} + \text{shippingPaise} + \text{codChargePaise}$$
5. **Integer Paise Invariant:** Every intermediate and final sum is stored in integer paise. The client-submitted total is ignored during server persistence.

---

## 4. Pure Domain State Machines

State transitions are strictly enforced in `@nava/domain` and executed before database persistence.

### 4.1 Order Lifecycle State Machine (`OrderStateMachine`)

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT : Order Created

    PENDING_PAYMENT --> AWAITING_PAYMENT_VERIFICATION : UPI UTR Submitted
    PENDING_PAYMENT --> PROCESSING : COD Confirmed
    PENDING_PAYMENT --> CANCELLED : Customer/TTL Expiry

    AWAITING_PAYMENT_VERIFICATION --> PAYMENT_CONFIRMED : Owner Verified (Bank Statement)
    AWAITING_PAYMENT_VERIFICATION --> CANCELLED : Invalid/Reused UTR Rejected

    PAYMENT_CONFIRMED --> PROCESSING : Order Queued for Atelier Dispatch

    PROCESSING --> SHIPPED : Dispatched with Courier AWB
    PROCESSING --> CANCELLED : Pre-Dispatch Owner Cancellation (Restock)

    SHIPPED --> OUT_FOR_DELIVERY : Courier Out For Delivery
    SHIPPED --> RETURNED_TO_ORIGIN : Delivery Failed

    OUT_FOR_DELIVERY --> DELIVERED : Customer Received Package
    OUT_FOR_DELIVERY --> RETURNED_TO_ORIGIN : Customer Rejected Delivery

    DELIVERED --> CLOSED : Return Window Expired (Final State)
    DELIVERED --> REFUNDED : Approved Post-Delivery Return

    RETURNED_TO_ORIGIN --> CLOSED : Restocked / Customer Re-contacted
    CANCELLED --> [*]
    CLOSED --> [*]
    REFUNDED --> [*]
```

### 4.2 Payment Lifecycle State Machine (`PaymentStateMachine`)

```mermaid
stateDiagram-v2
    [*] --> PENDING : Payment Record Created
    [*] --> PENDING_COLLECTION : COD Order Placed

    PENDING --> AWAITING_VERIFICATION : Customer Submitted UTR
    PENDING --> FAILED : Payment Abandoned
    PENDING --> EXPIRED : Payment Window Elapsed

    AWAITING_VERIFICATION --> VERIFIED : Admin Verified Against Bank Ledger
    AWAITING_VERIFICATION --> REJECTED : Fraudulent / Unmatched UTR

    PENDING_COLLECTION --> COLLECTED : Courier Remitted Cash
    PENDING_COLLECTION --> FAILED : Customer Refused Cash at Door

    VERIFIED --> SETTLED : Funds Cleared in Atelier Current Account
    VERIFIED --> REFUNDED : Manual Bank Reversal Issued

    COLLECTED --> SETTLED : Courier Reconciliation Cleared
```

### 4.3 Inventory Reservation State Machine (`ReservationStateMachine`)

To prevent overselling limited handcrafted jewelry pieces:
1. When an item is added to checkout, a temporary reservation is created: `PENDING`.
2. A 15-minute expiration timer is attached.
3. If payment is confirmed: `PENDING` $\to$ `CONFIRMED` (permanently decrements stock).
4. If payment times out or customer cancels: `PENDING` $\to$ `RELEASED` (stock released back to catalog).
5. Terminal lock: Once in `CONFIRMED`, reservation cannot transition to `RELEASED` directly; stock returns must proceed via structured Return/Restock workflows.

---

## 5. Sovereign Payment Methods

### 5.1 Method A: BharatPe Merchant UPI QR (Zero-MDR)
- **Specification:** Conforms to NPCI Universal UPI Linking Specifications.
- **Intent Format:** `upi://pay?pa={vpa}&pn={merchantName}&tr={orderNumber}&tn={orderTag}&am={rupees}&cu=INR`
- **Reconciliation Tag:** Unique order tag `NAVA-{orderNumber}` embedded into transaction note.
- **Replay Attack Defense:** In-memory and database uniqueness constraint on `upiTransactionRef`. Re-submitting an existing UTR for another order throws a 400 Bad Request error.
- **Owner Verification:** Requires administrative session; marks payment as `VERIFIED` with `verifiedByUserId` and timestamp.

### 5.2 Method B: Cash on Delivery (COD)
- **Order Limit:** Capped at ₹5,000.00 (`CONFIG.payment.codMaxPaise = 500000`). Prevents high-value inventory loss from bogus orders.
- **Courier Surcharge:** Configurable handling fee (default ₹0.00 or nominal ₹50.00).
- **Collection Reconciliation:** Tracks `courierAwb`, `collectedAt`, and `collectedBy` (e.g. Delhivery, BlueDart).

### 5.3 Method C: Direct Net Banking Extension Point
- **Status:** Deferred (`isNetBankingSupported() === false`).
- **Policy:** Will only be enabled if a direct bank acquiring arrangement with zero platform fees is established by the business owner.

---

## 6. Offline Fallback & Reliability Engineering

When PostgreSQL is temporarily unavailable or during initial infrastructure provisioning:
1. Storefront catalog gracefully reads from static build-time or cached inventory snapshots.
2. Orders and enquiries return structured fallback payloads: `UNPERSISTED_FALLBACK`.
3. The UI presents direct WhatsApp consultation options with pre-populated order summaries, ensuring no prospective customer order is silently lost.
4. Database health is transparently reported via `/api/health/readiness` (503 Service Unavailable when DB is down; 200 OK when connected).

---

## 7. Verification Evidence

- **Pure Domain State Tests:** 63 / 63 Passed (`packages/domain/tests/`).
- **Commerce Foundation End-to-End Tests:** 11 / 11 Passed (`apps/web/e2e/commerce-foundation.spec.ts`).
- **Payment Integration End-to-End Tests:** 13 / 13 Passed (`apps/web/e2e/payment-integration.spec.ts`).
- **Storefront & Admin User Journeys:** 85 / 85 Passed (`apps/web/e2e/`).
- **Total Monorepo Automated Tests:** **175 / 175 Passed**.
- **TypeScript Static Verification:** 0 errors across 5 workspace packages.
- **ESLint Verification:** 0 warnings or errors.
