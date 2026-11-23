# NAVA CREATIONS — PHASE 2 MASTER IMPLEMENTATION PLAN
**Project:** NAVA CREATIONS  
**Milestone:** Phase 2 Master Commerce Completion  
**Execution Authority:** Master Engineering Lead (Full-Stack, Database & Security)  
**Target Repository:** `D:\NAVA`  

---

## 1. Executive Strategy & Architectural Guardrails

The goal of this implementation plan is to complete **the entire Phase 2 commerce foundation**, bridging the architectural gaps identified in Sprint 2L, 2M, and 2N:

1. **Modular Monolith Architecture:** Build all services and routes directly within the clean Turborepo monorepo structure.
2. **PostgreSQL Relational Schema as Source of Truth:** Rely on the ratified Prisma models (`Order`, `OrderItem`, `Payment`, `Enquiry`, `InventoryItem`).
3. **Graceful Offline / Local Fallback:** Support both live Prisma database execution and robust structured in-memory repositories so the application functions flawlessly across local dev, CI, and live database environments without throwing unhandled exceptions.
4. **Sovereign Zero-MDR Payment Standards:** Enforce NPCI standard UPI QR/Intent collection (BharatPe candidate), manual bank credit reconciliation (`claimedUtr` vs `verifiedTransactionId`), and owner-governed Cash on Delivery (COD).
5. **Server-Authoritative Pricing & Concurrency:** Cart totals and stock reservation are strictly calculated and decremented server-side.

---

## 2. Dependency-Ordered Work Packages

### Work Package 1: Persistent Customer Order & Checkout System (Resolves DEF-PH2-03)
- **WP 1.1: Order Domain Service (`apps/web/lib/order-service.ts`)**
  - Order entity management with server-authoritative price validation.
  - Concurrency-safe inventory reservation via `InventoryReservationService`.
  - Order number generation (`NAV-YYYY-XXXX`).
  - Dual persistence engine: Prisma Postgres Client (live mode) and Structured Memory Store (local dev/offline mode).
- **WP 1.2: Customer Orders API Routes**
  - `POST /api/orders`: Validates cart, customer details, reserves stock, creates order and payment records, returns payment instructions.
  - `GET /api/orders/[orderNumber]`: Public tracking endpoint for order details, payment status, courier tracking.
  - `POST /api/orders/[orderNumber]/submit-utr`: Customer submits 12-digit Indian Bank UTR.
- **WP 1.3: Customer Checkout Page (`apps/web/app/checkout/page.tsx`)**
  - Dedicated multi-step responsive checkout form:
    - Step 1: Customer details (Name, 10-digit Indian mobile, optional email).
    - Step 2: Delivery address (Address lines, City, Indian State dropdown, PIN code).
    - Step 3: Payment method selection (BharatPe UPI QR / Intent, or Cash on Delivery).
    - Step 4: Server-authoritative order summary with clear delivery charges and tax notices.
- **WP 1.4: Order Confirmation & Live Tracking Page (`apps/web/app/orders/[orderNumber]/page.tsx`)**
  - Displays persistent order confirmation and receipt.
  - For UPI orders: Renders merchant QR code, UPI intent link, payable amount, and interactive UTR submission form with instant feedback.
  - For COD orders: Displays cash collection instructions and dispatch notice.
- **WP 1.5: Cart Integration Enhancement (`apps/web/app/cart/page.tsx`)**
  - Retains "Order on WhatsApp" with pre-persistence of order reference.
  - Adds primary "Proceed to Secure Checkout" button leading directly to `/checkout`.

---

### Work Package 2: Store Owner & Manager Administration Operations (Resolves DEF-PH2-02 & DEF-PH2-04)
- **WP 2.1: Admin Orders API (`apps/web/app/api/admin/orders/route.ts` & `[id]/route.ts`)**
  - Protected by `verifyAdminSession`.
  - `GET`: Lists orders with status, date, and customer filters.
  - `PATCH`: Updates order status (enforcing `OrderStateMachine`), records courier AWB / RTO tracking, triggers restock on cancellation.
- **WP 2.2: Admin Payment Verification API (`apps/web/app/api/admin/orders/[id]/verify-payment/route.ts`)**
  - Protected by `verifyAdminSession`.
  - Accepts `verifiedTransactionId` (bank ledger reference), validates amount, calls `PaymentService.verifyUpiPayment`.
  - Transitions Payment to `VERIFIED` and Order to `PAYMENT_CONFIRMED`.
- **WP 2.3: Admin Enquiries API (`apps/web/app/api/admin/enquiries/route.ts` & `[id]/route.ts`)**
  - Protected by `verifyAdminSession`.
  - `GET`: Lists customer enquiries from `/api/enquiries`.
  - `PATCH`: Updates enquiry status (`NEW` $\to$ `CONTACTED` $\to$ `CONVERTED` $\to$ `CLOSED`).
- **WP 2.4: Admin Orders Interactive UI (`apps/web/app/admin/orders/page.tsx`)**
  - Replaces static sample array with live API data fetching.
  - Interactive "Verify Bank Credit" modal for store managers to enter the bank transaction ID and reconcile UPI payments in one click.
  - Courier AWB assignment and status progression actions.
- **WP 2.5: Admin Customer Enquiries UI (`apps/web/app/admin/enquiries/page.tsx`)**
  - Dedicated admin interface to manage customer inquiries.
  - Displays customer name, phone, email, event date, bangle sizes, notes, and status tags.
  - One-click status updates and WhatsApp contact link for studio managers.
- **WP 2.6: Admin Navigation Layout Update (`apps/web/app/admin/layout.tsx`)**
  - Adds "Enquiries" to admin sidebar/header navigation with badge indicator.

---

### Work Package 3: Automated Quality & Regression Testing
- Author Playwright test suite `apps/web/e2e/orders-checkout.spec.ts`:
  1. Full customer web checkout journey with UPI QR instruction generation.
  2. Customer UTR claim submission and duplicate detection.
  3. Cash on Delivery (COD) checkout and order creation.
  4. Server-authoritative cart price tampering rejection during checkout.
  5. Stock depletion rejection during checkout.
  6. Admin orders list retrieval with valid session.
  7. Admin bank credit payment verification (`AWAITING_PAYMENT_VERIFICATION` $\to$ `PAYMENT_CONFIRMED`).
  8. Admin order status progression and courier AWB assignment.
  9. Admin enquiry list retrieval and status modification.
  10. Unauthorized access rejection on all new admin endpoints.

---

### Work Package 4: Master Certification & Documentation Suite
- Deliver all 12 required certification reports under `docs/phase-2/`.
- Run complete monorepo test suite (Unit, Playwright, Typecheck, Lint, Build).
- Conclude with final GO / CONDITIONAL GO / NO-GO evaluation.
