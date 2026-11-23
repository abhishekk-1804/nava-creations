# NAVA CREATIONS — Sprint 2J.1 Payment Verification Report
## Sovereign India-First Payment Integrity, Dual-Token Reconciliation & COD Architecture

**Document Version:** 1.0.0  
**Date:** 2026-11-11  
**Project:** NAVA CREATIONS (`D:\NAVA`)  
**Scope:** Payment Verification Hardening, Claimed vs Verified UTR Separation, NPCI Specifications, and COD Reconciliation  

---

## 1. Executive Summary

In Sprint 2J.1, NAVA CREATIONS addressed critical transaction-integrity requirements in its sovereign India-first payment domain.

**Key Achievements:**
1. **Architectural Separation of Claim vs Credit:** Completely separated `claimedUtr` (the reference number submitted by the customer) from `verifiedTransactionId` (the authoritative bank credit confirmed by the store owner). A customer submission **never** independently establishes payment success.
2. **Anti-Replay Attack Protection:** Enforced strict uniqueness on `verifiedTransactionId` across all orders, guaranteeing that no single bank credit can ever be re-used to confirm multiple orders.
3. **Double-Verification Guard:** Prevented multiple verification attempts on already-confirmed orders.
4. **Acquiring Bank & NPCI Compliance:** Verified that UPI Intent generation conforms to NPCI standards (`pa`, `pn`, `tr`, `tn`, `am`, `cu=INR`) and strictly disables UPI checkout if merchant onboarding is unapproved or unconfigured.
5. **Configurable Cash on Delivery (COD):** Decoupled the ₹5,000 order ceiling into an environment-driven variable (`COD_MAX_PAISE`) and established formal tracking for pending business-owner policy sign-off (`COD_POLICY_APPROVED`).

---

## 2. Transaction Integrity: Claimed UTR vs Verified Bank Transaction ID

In basic e-commerce setups, user input is often treated as fact. If a user submits a 12-digit number into a "UPI Reference" box, poorly engineered backends might prematurely mark the order as "Paid".

NAVA CREATIONS enforces a strict **dual-token asymmetric verification model**:

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer Browser
    participant API as NAVA API Boundary
    participant DB as Orders & Payments DB
    actor Owner as Store Owner (Admin)
    participant Bank as Bank Account / BharatPe App

    Customer->>API: 1. POST Checkout (UPI Selected)
    API->>Customer: 2. Return NPCI Intent URI & QR (Status: AWAITING_PAYMENT)
    Customer->>Bank: 3. Customer pays via UPI App (GPay/PhonePe/Paytm)
    Customer->>API: 4. Submit 12-Digit UTR (claimedUtr)
    API->>DB: 5. Store claimedUtr; Set Status: AWAITING_PAYMENT_VERIFICATION
    API->>Customer: 6. Customer State: PAYMENT_UNDER_VERIFICATION (Order Unpaid)
    
    Note over Owner,Bank: Out-of-band Manual Ledger Audit
    Owner->>Bank: 7. Inspect Current Account Statement / BharatPe Ledger
    Bank-->>Owner: 8. Confirm exact ₹ credit, timestamp, and bankRef
    
    alt Credit Confirmed in Bank Ledger
        Owner->>API: 9a. Verify Payment (adminId, verifiedTransactionId, amountPaise)
        API->>DB: 10a. Check verifiedTransactionId uniqueness; Transition to VERIFIED
        API->>DB: 11a. Transition Order to PAYMENT_CONFIRMED & queue for atelier packing
    else No Credit / Fraudulent UTR
        Owner->>API: 9b. Reject Payment (adminId, reason: "Credit not received")
        API->>DB: 10b. Transition to REJECTED; Order to CANCELLED; Release inventory
    end
```

### 2.1 The Two Distinct Tokens

| Property | `claimedUtr` | `verifiedTransactionId` |
| :--- | :--- | :--- |
| **Origin** | Customer form submission | Store owner audit from official bank statement |
| **Trust Level** | **Zero Trust** (Unverified claim) | **Authoritative Trust** (Bank confirmed) |
| **Database Constraint** | Indexed for lookup; allows duplicate detection | **Strictly Unique (`@unique`)** across all orders |
| **Order Impact** | Remains `AWAITING_PAYMENT_VERIFICATION` | Advances order to `PAYMENT_CONFIRMED` |
| **Customer State** | `PAYMENT_UNDER_VERIFICATION` | `VERIFIED` |
| **Fraud Mitigation** | Duplicate claims flagged for manual audit | Identical bank credit cannot confirm a second order |

---

## 3. Truthful Customer-Facing Payment Progression

The customer interface never displays misleading or premature confirmation states. Internal statuses are mapped via `PaymentService.getCustomerPaymentStatus`:

| Order Status | Payment Status | Customer-Facing State | UI Title & Truthful Guidance | Next Action |
| :--- | :--- | :--- | :--- | :--- |
| `PENDING_PAYMENT` | `INITIATED` | `AWAITING_PAYMENT` | **Awaiting Payment**<br>Please scan the BharatPe UPI QR code or tap the UPI intent link to pay. | Customer pays via UPI app |
| `AWAITING_PAYMENT_VERIFICATION` | `AWAITING_VERIFICATION` | `PAYMENT_UNDER_VERIFICATION` | **Payment Under Verification**<br>Your UPI transaction reference has been submitted. Our atelier team is reconciling credit with our current account statement. | Customer waits; no re-payment needed |
| `PAYMENT_CONFIRMED` | `VERIFIED` | `VERIFIED` | **Payment Confirmed**<br>Payment credit verified. Your handcrafted jewelry order is confirmed and queued for packing. | Atelier dispatches order |
| `CANCELLED` | `REJECTED` | `REJECTED` | **Payment Verification Failed**<br>The submitted reference could not be reconciled against bank statement credits. This order remains unpaid and cancelled. | Customer can re-order or contact atelier |
| `CANCELLED` | `EXPIRED` | `EXPIRED` | **Payment Expired**<br>The payment window for this order has expired. Reserved inventory has been released. | Cart re-added |

> [!IMPORTANT]
> **No BharatPe Automatic Callback:** The system makes no claim of automatic BharatPe webhooks or real-time payment gateway callbacks. All reconciliation is performed deliberately and truthfully by the store manager against current account bank records.

---

## 4. NPCI UPI Intent & Acquirer Approval Requirements

### 4.1 NPCI Specification Conformance
The generated intent string follows the Universal NPCI Deep Linking Specification:
```text
upi://pay?pa={vpa}&pn={merchantName}&tr={orderNumber}&tn={orderTag}&am={rupees}&cu=INR
```
- **`pa` (Payee VPA):** Sourced strictly from `CONFIG.payment.upiVpa`.
- **`pn` (Payee Name):** Fully URL-encoded (`encodeURIComponent`).
- **`tr` (Transaction Reference):** Order number (`ORD-2026-XXXX`).
- **`tn` (Transaction Note):** Human-identifiable tag (`NAVA-ORD2026XXXX`) to facilitate manual bank statement matching.
- **`am` (Amount):** Server-authoritative integer paise converted to two-decimal rupees string (`(amountPaise / 100).toFixed(2)`).
- **`cu` (Currency):** Strictly `INR`.

### 4.2 Safeguard Against Unconfigured Checkout
If `CONFIG.payment.isMerchantConfirmed` is `false` or `MERCHANT_UPI_VPA` is unset:
- `PaymentService.isUpiConfigured()` returns `false`.
- Calling `generateUpiInstructions` throws an explicit, user-friendly exception:
  `"Merchant UPI collection is not yet configured or approved by the business owner. Please select Cash on Delivery or contact our atelier via WhatsApp."`
- The storefront never displays a broken, generic, or mock QR code to customers.

### 4.3 Acquirer Bank Merchant Approval Mandate
Dynamic web-based UPI collections without an approved merchant acquiring contract present real-world operational risks:
1. **P2P vs P2M Limits:** Generating dynamic UPI intent links to a personal VPA is categorized by NPCI as P2P (Person-to-Person). Banks impose daily transaction limits (₹1,00,000/day total, with tighter ₹2,000 to ₹5,000 limits for first-time payees).
2. **Merchant Category Code (MCC):** Approved merchant accounts are assigned MCC `5944` (Jewelry, Watch, and Silverware Stores), unlocking merchant transaction volumes, higher daily caps, and verified green badges in Google Pay and PhonePe.
3. **Compliance Requirement:** The store owner must formalize merchant onboarding with BharatPe or their corporate acquiring bank (ICICI / HDFC / Axis) before activating live UPI collections.

---

## 5. Cash on Delivery (COD) Policy & Courier Reconciliation

### 5.1 Configurable Order Threshold
- In Sprint 2J, a ₹5,000 limit was introduced.
- In Sprint 2J.1, this limit is made fully configurable via `process.env.COD_MAX_PAISE` (defaulting to 500,000 paise / ₹5,000.00).
- An explicit governance flag `COD_POLICY_APPROVED` tracks business sign-off:
  - If `COD_POLICY_APPROVED="false"`, the system applies the ₹5,000 threshold with a clear diagnostic notice: `"[Provisional policy threshold applied pending formal business-owner sign-off]"`.
  - Once the business owner reviews loss-prevention and courier return rates, setting `COD_POLICY_APPROVED="true"` finalizes the active commercial rule.

### 5.2 Separation of Collection and Fulfillment
Payment collection is modeled as completely independent from order delivery:
1. Order fulfills: `PROCESSING` $\to$ `SHIPPED` $\to$ `DELIVERED`.
2. Payment remains: `PENDING_COLLECTION`.
3. The logistics courier (e.g. Delhivery, BlueDart) remits cash in a weekly settlement batch.
4. The store manager executes `PaymentService.recordCodCollection`:
   - Records `collectedBy`, `collectedAt`, `courierAwb`, and `settlementBatchId`.
   - Transitions Payment to `COLLECTED`.

---

## 6. Verification Evidence

The hardened payment service was tested via automated Playwright tests in `apps/web/e2e/payment-integration.spec.ts`:
- **P.0:** Absent merchant config disables UPI checkout (PASS).
- **P.1:** Server-authoritative intent URI with `am`, `cu=INR`, `tr`, `tn` (PASS).
- **P.3:** Customer UTR creates `claimedUtr` in `AWAITING_PAYMENT_VERIFICATION` (PASS).
- **P.4:** Duplicate claimed UTRs flagged for audit without false success (PASS).
- **P.5:** Store owner verification with unique `verifiedTransactionId` (PASS).
- **P.5b:** Unique bank reference constraint prevents credit replay across orders (PASS).
- **P.5c:** Prevention of double-verification on the same order (PASS).
- **P.6:** Missing administrator ID rejected (PASS).
- **P.7:** Order cancellation on payment rejection with audit reason (PASS).
- **P.8:** Configurable COD ceiling enforcement (PASS).
- **P.9:** COD collection reconciliation separate from delivery (PASS).
- **P.10:** Safe deferral of net banking (PASS).
- **P.14:** Truthful customer state mapping (PASS).
