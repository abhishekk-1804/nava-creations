# NAVA CREATIONS — BUSINESS OPERATIONS RUNBOOK
**Document Identifier:** `NAVA-BIZ-OPS-01`  
**Target Audience:** Store Owner & Atelier Operations Team  
**Revision:** 1.0.0-rc1  
**Status:** **DRAFT POLICIES READY FOR OWNER RATIFICATION**  

---

## 1. OFFICIAL BUSINESS PROFILE & OPERATIONAL CHANNELS

| Profile Element | Operational Specification | Status |
| :--- | :--- | :---: |
| **Brand / Legal Name** | NAVA CREATIONS | Confirmed |
| **Atelier Location** | Bengaluru, Karnataka, India | Confirmed |
| **Primary Contact Number** | `+91-98860-00000` (WhatsApp & Voice) | Requires Owner Approval |
| **Customer Support Email** | `orders@navacreations.in` / `support@navacreations.in` | Requires Owner Approval |
| **Support Hours** | Monday – Saturday: 10:00 AM – 7:00 PM IST | Confirmed |
| **Merchant UPI VPA** | BharatPe UPI QR (`bharatpe.9886000000@fbpe`) | Requires Owner Approval |
| **Tax Regime** | Unregistered / Composition Scheme (Turnover < ₹40 Lakhs) | Confirmed |

---

## 2. DRAFT CUSTOMER POLICIES (FOR OWNER RATIFICATION)

### 2.1 Shipping & Delivery Policy
- **Coverage:** Pan-India delivery covering all serviceable 6-digit postal PIN codes.
- **Processing Time:** Handcrafted items dispatched within 24–48 hours from Bengaluru atelier.
- **Estimated Delivery:** 
  - South India (Karnataka, Tamil Nadu, Kerala, AP, Telangana): 2–4 business days.
  - Rest of India: 4–7 business days.
- **Shipping Rates:** Free standard shipping on orders above ₹1,500; flat ₹80 for smaller orders.

### 2.2 Returns, Exchanges & Damaged Items Policy
- **Artisanal Quality Notice:** Handcrafted bangles and bridal jewellery feature unique artistic nuances. Slight variations in silk thread texture or bead placement are natural characteristics of handcrafting.
- **Damage in Transit:** Customer must report damaged parcels within 24 hours of delivery with unboxing photographs or video sent via WhatsApp.
- **Size Exchanges:** Bangle size exchanges (2.4, 2.6, 2.8) accepted within 5 days of delivery, provided items are unworn and in original atelier packaging. Customer bears return shipping charge (₹80).

### 2.3 Refund Policy
- **UPI Orders:** Refunds processed directly to original source account within 3–5 business days following inspection of returned goods.
- **Cash on Delivery (COD):** Refunds issued via direct NEFT / UPI transfer upon receipt of customer bank account details.

### 2.4 Cancellation Policy
- **Pre-Dispatch:** Customers may cancel orders free of charge prior to shipping by messaging WhatsApp support with their Order Number.
- **Post-Dispatch:** Orders in transit cannot be cancelled; must follow standard return procedure.

### 2.5 Privacy Policy (DPDP Act 2023 Compliant)
- NAVA CREATIONS collects customer name, phone number, and delivery address solely for fulfilling orders.
- Zero customer data is sold, rented, or shared with third-party advertisers.
- Unauthenticated order access is blocked to prevent data harvesting.

---

## 3. MANUAL PAYMENT RECONCILIATION STANDARD OPERATING PROCEDURE (SOP)

```
========================================================================================
                      MANUAL UPI PAYMENT RECONCILIATION WORKFLOW
========================================================================================
[Customer Checkout] ──> [Generates Dynamic BharatPe QR] ──> [Customer Pays in UPI App]
                                                                     │
[Order in AWAITING_PAYMENT_VERIFICATION] <── [Customer Enters 12-Digit Bank UTR]
                 │
                 ▼
[Manager Checks ICICI / BharatPe Bank Statement App]
                 │
  ┌──────────────┴──────────────┐
  ▼                             ▼
[Credit Matches UTR & Amount]  [Discrepancy / Fake UTR / Underpayment]
  │                             │
  ├─ 1. Open /admin/orders/[id]  ├─ 1. Contact customer via WhatsApp
  ├─ 2. Enter Verified Bank Ref  ├─ 2. Customer re-submits correct UTR OR
  ├─ 3. Click "Verify Payment"   └─ 3. Manager marks order "REJECTED"
  │                                   (Releases inventory hold immediately)
  ▼
[Order -> PAYMENT_CONFIRMED]
[Print Atelier Packing Slip]
========================================================================================
```

### 3.1 Edge Case Handling
1. **Duplicate UTR Submitted by Multiple Customers:**
   - Both orders remain in pending state. The admin UI flags `isDuplicateClaim: true`.
   - Manager checks the bank statement for the exact matching amount.
   - Manager verifies only the genuine customer order. The partial unique index physically blocks verifying the second order with the same bank transaction reference.
2. **Underpayment:**
   - Manager messages customer on WhatsApp: *"We received ₹1,200 for Order NAV-XXXX, but the total is ₹1,500. Please send the remaining ₹300 using this QR."*
   - Order remains in verification hold until fully settled.

---

## 4. ATELIER PACKING & DISPATCH WORKFLOW

1. **Daily Morning Batch:** Manager filters orders by `Status: PAYMENT_CONFIRMED`.
2. **Packing Slip Generation:** Click `/admin/orders/[id]/packing-slip` and print the atelier slip.
3. **Bangle Inspection:** Check silk thread wrapping, stone settings, and verify size stamps (2.4, 2.6, 2.8).
4. **Protective Packaging:** Wrap bangles in bubble cushioning inside rigid jewelry boxes. Attach customer address label.
5. **Courier Handoff:** Hand over to courier partner (India Post / Shiprocket / Delhivery) and record Courier AWB in the admin portal.
6. **Order Transition:** Advance status to `SHIPPED` and notify customer via WhatsApp with AWB tracking link.
