# NAVA CREATIONS — PAYMENT ARCHITECTURE & PROVIDER EVALUATION
**Document ID:** `DOC-G2-PHASE4-PAYMENTS`  
**Generated At:** 2026-11-15T09:54:15+05:30  
**Repository:** `D:\NAVA`  
**Branch:** `feature/production-readiness`  
**Role:** E-commerce Payments Engineer & Principal Software Architect  

---

## 1. EXECUTIVE SUMMARY & STRATEGIC PAYMENT CONTEXT

For an Indian artisanal luxury e-commerce business selling bridal chudas and handcrafted accessories (average order value ₹1,500 to ₹6,500), payment economics, customer trust, and checkout abandonment are decisive commercial factors:
- **Merchant Discount Rate (MDR) Impact:** A 2.0% + GST gateway fee on a ₹3,500 heirloom bridal chuda represents a direct margin erosion of **₹82.60 per order**.
- **Checkout Trust in India:** Over 75% of Indian retail D2C payments originate via **Unified Payments Interface (UPI)**. Customers expect familiar UPI apps (Google Pay, PhonePe, Paytm, BHIM) and a zero-fraud guarantee.
- **Cash on Delivery (COD) Risk:** Unchecked COD leads to High Return-to-Origin (RTO) rates of 20%–35% in Indian fashion e-commerce.

To maximize merchant net margin while maintaining high customer conversion, NAVA CREATIONS implements a **Sovereign India-First Hybrid Payment Architecture**:
1. **Primary Launch Flow:** Zero-MDR Sovereign UPI QR (BharatPe / Direct Bank UPI) + Customer Bank UTR Verification.
2. **Guarded Offline Flow:** Cash on Delivery (COD) with a strict ₹5,000 ceiling (`COD_MAX_PAISE`) and telephonic verification.
3. **Growth Integration Ready:** Abstracted payment adapter interface allowing 1-click addition of Razorpay or Cashfree when automated gateway settlement is required.

---

## 2. INDIAN PAYMENT GATEWAY PROVIDER EVALUATION

| Criterion | Sovereign UPI QR (BharatPe) | Razorpay | Cashfree Payments | PhonePe Payment Gateway |
|:---|:---|:---|:---|:---|
| **Merchant Discount Rate (MDR)** | **0% (₹0 fee)** | 2.0% + 18% GST (Standard cards & Netbanking); 0% on UPI/RuPay | 1.90% + 18% GST (Cards); 0% on UPI | 1.90% + 18% GST; promotional 0% on UPI |
| **Setup & KYC Complexity** | Simple (Current Account + Business Pan / GSTIN) | Moderate (Full business KYC, website audit, legal docs) | Moderate (Business KYC, bank verification) | Moderate (Business KYC, website policy audit) |
| **Settlement Timeline** | **T+0 (Same day instant settlement to current account)** | T+2 business days | T+1 or T+2 business days | T+1 business day |
| **Payment Instruments** | UPI QR, UPI Intent (GPay, PhonePe, Paytm, BHIM) | UPI, Cards, Netbanking (50+ banks), Wallets, EMI, PayLater | UPI, Cards, Netbanking, Wallets, EMI, Cashfree AutoCollect | UPI, Cards, Netbanking, PhonePe Wallet |
| **Reconciliation Method** | Manual UTR check or BharatPe merchant app notification | Automated Webhook (`payment.captured`) | Automated Webhook (`PAYMENT_SUCCESS_WEBHOOK`) | Automated Webhook (`PAYMENT_SUCCESS`) |
| **Chargeback Risk** | **0% (Bank-to-bank transfer cannot be reversed via credit card dispute)** | Moderate (Subject to card scheme chargeback rules) | Moderate | Moderate |
| **Refund Automation** | Manual bank transfer / IMPS by merchant | Automated via Dashboard or API (`/v1/payments/{id}/refund`) | Automated via API (`/pg/orders/{id}/refunds`) | Automated via API (`/v3/credit/refund`) |
| **Infrastructure Overhead** | Zero monthly subscription fee | Zero setup fee | Zero setup fee | Zero setup fee |
| **Suitability for NAVA** | **Optimal for Soft-Launch (Maximizes margins)** | **Recommended Growth Gateway (Automated scale)** | **Strong Alternative (Lower card MDR)** | Viable alternative |

---

## 3. CURRENT IMPLEMENTATION DEEP DIVE: SOVEREIGN UPI + UTR ENGINE

NAVA's existing codebase (`apps/web/lib/payment-service.ts`, `apps/web/app/api/orders/[orderNumber]/submit-utr/route.ts`) provides a complete sovereign payment engine:

### 3.1 Sovereign UPI Flow Diagram
```
[ Customer Checkout ]
        |
        v
[ Order Created: NAV-2026-XXXX (PENDING) ]
        |
        v
[ Dynamic BharatPe UPI QR Displayed ]
- VPA: navacreations@icici (or configured merchant VPA)
- Payee Name: NAVA CREATIONS
- Pre-filled Amount: Order total in INR
- Order Reference Note: NAV-2026-XXXX
        |
        v (Customer scans QR via Google Pay / PhonePe / Paytm / BHIM)
[ Customer Submits 12-Digit Bank UTR Reference ]
        |
        +---> [ System Deduplication Check ]: Checks Payment.utrReference across ALL orders
        |
        v (Valid & Unique UTR)
[ Order Status: AWAITING_PAYMENT_VERIFICATION ]
        |
        v (Store Admin inspects bank account / BharatPe merchant app)
[ Admin Clicks "Verify Payment" in Admin Portal ]
        |
        v
[ Atomic Transaction ]:
- Payment Status -> VERIFIED
- Order Status -> PROCESSING (Stock confirmed consumed)
- Automated Order Confirmation Email dispatched
```

### 3.2 UTR Deduplication & Fraud Mitigation
A classic fraud vector in manual UPI submission is reusing the same 12-digit UTR reference across multiple orders. NAVA eliminates this vector at the database level:
```typescript
// From apps/web/app/api/orders/[orderNumber]/submit-utr/route.ts
const existingPayment = await prisma.payment.findFirst({
  where: {
    utrReference: utrTrimmed,
    status: { in: ['VERIFIED', 'SUBMITTED_UTR'] },
    order: {
      orderNumber: { not: orderNumber } // Check other orders
    }
  }
});

if (existingPayment) {
  return NextResponse.json(
    { error: 'This UTR reference has already been submitted for another order.' },
    { status: 409 }
  );
}
```

---

## 4. CASH ON DELIVERY (COD) CONTROL ENGINE

To prevent margin destruction from high RTO (Return to Origin) rates, the platform enforces strict COD governance:
1. **Configurable Ceiling (`COD_MAX_PAISE`):** COD is strictly restricted to orders under ₹5,000 (`500000` paise). High-value heirloom bridal chudas (e.g. ₹6,500+) require prepaid UPI or gateway payment.
2. **Mandatory Phone Verification:** Guest checkout requires a valid 10-digit Indian mobile number (`/^[6-9]\d{9}$/`).
3. **Admin Telephonic Confirmation:** Before transitioning an order from `PENDING` to `PROCESSING`, store staff perform a telephone confirmation call with the customer.

---

## 5. EXTENSIBLE PAYMENT GATEWAY ADAPTER INTERFACE

To future-proof the codebase for instant Razorpay / Cashfree activation when monthly volume exceeds 500 orders, the domain defines a clean provider interface:

```typescript
export interface PaymentGatewayProvider {
  createPaymentOrder(order: Order): Promise<{
    providerOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }>;

  verifyWebhookSignature(payload: string, signature: string, secret: string): boolean;

  processRefund(paymentId: string, amountPaise: number, reason: string): Promise<{
    refundId: string;
    status: 'PROCESSED' | 'PENDING' | 'FAILED';
  }>;
}
```

---

## 6. PAYMENT STATE MACHINE & INVARIANTS

```
                     +-----------------------------+
                     |           PENDING           |
                     +-----------------------------+
                       /            |            \
       (UPI Scanned & /             |             \ (COD Selected)
         UTR Entered)/              |              \
                    v               |               v
      +-------------------------+   |   +-------------------------+
      |  AWAITING_VERIFICATION  |   |   |     PENDING (COD)       |
      +-------------------------+   |   +-------------------------+
             |           |          |                |
   (Admin    |   (Admin  |          | (15-min TTL    | (Store Confirms
  Verified)  |  Rejected)|          |  Expires)      |  Order via Phone)
             v           v          v                v
      +------------+  +-----------------+      +------------+
      |  VERIFIED  |  | CANCELLED / EXPIRED |      | PROCESSING |
      +------------+  +-----------------+      +------------+
             |                                       |
             +---------------->+<--------------------+
                               |
                               v
                     +-------------------+
                     |     REFUNDED      |
                     +-------------------+
```

### Invariant Rules
- **Rule 1:** An order cannot transition to `PROCESSING` without either `Payment.status === 'VERIFIED'` (for UPI/Gateway) or `PaymentMethod === 'CASH_ON_DELIVERY'` with store manager confirmation.
- **Rule 2:** A payment cannot be verified twice (idempotent state transition).
- **Rule 3:** If an order in `PENDING` exceeds the 15-minute reservation TTL without a submitted UTR, the reservation cron atomically releases the reserved stock back to `availableQty`.
