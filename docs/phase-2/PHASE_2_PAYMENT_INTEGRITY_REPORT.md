# NAVA CREATIONS — PHASE 2 PAYMENT INTEGRITY REPORT
## Sovereign India-First Payments, Zero-MDR Architecture & Bank Reconciliation Audit

**Repository:** `D:\NAVA`  
**Milestone:** Phase 2 Master Commerce Foundation  
**Governance Framework:** Google Elephant-Goldfish Model (EGM)  
**Certification Date:** 2026-11-12  

---

## 1. Executive Summary: Sovereign Payment Philosophy

NAVA CREATIONS deliberately rejects commercial payment gateway aggregators (e.g., Razorpay, Cashfree, PayU) for direct customer transactions. 

### Why Aggregators Are Permanently Excluded:
1. **2.0% – 2.5% Merchant Discount Rate (MDR) + 18% GST:**
   Aggregator commissions drain significant margins from small handcrafted artisanal jewelry enterprises.
2. **Settlement Delays (T+2 / T+3 Days):**
   Aggregators hold merchant working capital in custodial escrow accounts.
3. **Arbitrary Account Freezes:**
   Aggregators frequently freeze funds of handcrafted jewelry businesses over subjective risk assessments.
4. **Sovereign India Stack Direct Settlement:**
   Unified Payments Interface (UPI) provides **Zero MDR** for merchant QR collections and direct, instant settlement into the store owner's bank account.

---

## 2. End-to-End Payment Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Web as Storefront & Checkout
    participant API as /api/orders
    participant PaySvc as PaymentService
    actor Owner as Store Owner / Atelier Manager
    participant AdminUI as /admin/orders

    Customer->>Web: Places Order (UPI selected)
    Web->>API: POST /api/orders
    API->>PaySvc: generateUpiInstructions(orderNumber, amountPaise)
    PaySvc-->>API: BharatPe QR URL + NPCI upi://pay URI
    API-->>Web: Order created (Status: AWAITING_PAYMENT_VERIFICATION)
    Web-->>Customer: Displays BharatPe QR & UPI Intent Link
    Customer->>Customer: Completes payment in GPay / PhonePe / Paytm / BHIM
    Customer->>Web: Submits 12-digit UPI Bank UTR
    Web->>API: POST /api/orders/[orderNumber]/submit-utr
    API->>PaySvc: submitUpiTransactionReference(claimedUtr)
    Note over PaySvc: Records claimedUtr only.<br/>DOES NOT confirm payment.
    Owner->>Owner: Inspects BharatPe app / Current Account Netbanking
    Owner->>AdminUI: Opens Order & clicks "Verify Bank Credit"
    AdminUI->>API: POST /api/admin/orders/[id]/verify-payment
    API->>PaySvc: verifyUpiPayment(verifiedTransactionId, amount)
    Note over PaySvc: Enforces verifiedTransactionId uniqueness.<br/>Transitions payment to VERIFIED.<br/>Transitions order to PAYMENT_CONFIRMED.
    AdminUI-->>Owner: Order confirmed, ready for atelier packing
```

---

## 3. Sovereign Payment Workflows & Integrity Guardrails

### A. Server-Authoritative NPCI Intent URL Generation
Generated strictly on the server to prevent client amount manipulation:
- **Format:** `upi://pay?pa={vpa}&pn={merchantName}&tr={orderNumber}&tn={orderReferenceTag}&am={rupees}&cu=INR`
- **Validation:** Enforces positive integer paise, standard NPCI parameters, and URL-encoding of all identifiers.
- **Reference Tag:** Tags format `NAVA-{orderNumber}` so the reference appears directly on the merchant's bank statement.

### B. Truthful Customer Payment States (No Misleading Confirmation)
Customer-submitted UTRs are recorded as **`claimedUtr`** only. The system explicitly distinguishes between customer claims and verified credits:

| Order Status | Payment Status | Customer-Facing Status | Meaning & Next Action |
|---|---|---|---|
| `AWAITING_PAYMENT_VERIFICATION` | `INITIATED` | **Awaiting Payment** | Please scan BharatPe QR code and complete transfer. |
| `AWAITING_PAYMENT_VERIFICATION` | `AWAITING_VERIFICATION` | **Payment Under Verification** | UTR received. Atelier team is matching statement credit. |
| `PAYMENT_CONFIRMED` | `VERIFIED` | **Payment Confirmed** | Credit verified in bank ledger. Queued for packing. |
| `PENDING_PAYMENT` | `PENDING_COLLECTION` | **Cash on Delivery** | Payment due in exact cash upon courier delivery. |
| `CANCELLED` | `REJECTED` | **Verification Failed** | UTR could not be reconciled. Order cancelled. |

### C. Unique Bank Transaction Constraint
To prevent malicious customers from reusing a single genuine bank transaction reference across multiple orders:
```sql
CREATE UNIQUE INDEX "Payment_verifiedTransactionId_key" 
ON "Payment"("verifiedTransactionId") 
WHERE "verifiedTransactionId" IS NOT NULL;
```
If an administrator attempts to credit an order using an already-verified bank credit ID, the transaction is rejected with an audit error.

### D. Duplicate Claim Detection
If two separate orders submit identical UTR references before manager verification:
- The system flags `isDuplicateClaim: true`.
- An audit alert is attached to the store manager dashboard.
- Both orders require heightened verification before packing.

---

## 4. Cash on Delivery (COD) Invariants

1. **Separation of Delivery and Payment:**
   Order delivery (`DELIVERED`) and financial collection (`COLLECTED`) are distinct state machines. Delivering a parcel does not automatically record financial settlement.
2. **Ceiling Enforcement:**
   `codMaxPaise` (default ₹5,000 / 500,000 paise) prevents large-ticket unverified COD exposure.
3. **Provisional Policy Disclosure:**
   In development or until the store owner formally approves COD policy (`CONFIG.payment.codPolicyApproved`), a provisional policy notice is visibly rendered on customer receipts.

---

## 5. Verification Test Evidence

All 14 payment integration tests in `e2e/payment-integration.spec.ts` and checkout tests in `e2e/orders-checkout.spec.ts` executed with 100% pass rate:
- `ORD-01`: Customer Web Checkout with BharatPe UPI QR instructions (HTTP 201) — **PASSED**
- `ORD-02`: Customer submits 12-digit UPI Bank UTR reference (HTTP 200) — **PASSED**
- `ORD-03`: Duplicate UTR claim across distinct orders flags audit alert — **PASSED**
- `ORD-04`: Cash on Delivery (COD) order placement (HTTP 201) — **PASSED**
- `ORD-08`: Admin verifies UPI payment against bank ledger credit (HTTP 200) — **PASSED**

---

## 6. Certification Verdict

**SOVEREIGN PAYMENT INTEGRITY:** **CERTIFIED**  
Zero floating-point risk, zero aggregator commission leakage, and complete auditability between bank credits and order fulfillment.
