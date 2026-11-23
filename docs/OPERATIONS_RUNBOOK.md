# NAVA CREATIONS — BUSINESS OPERATIONS RUNBOOK

**Target Audience:** Store Owner, Atelier Manager & Order Operators  
**Business Profile:** Bengaluru Handcrafted Bangles & Bridal Accessories  
**Document Revision:** 1.0.0-rc1  

---

## 1. Daily Operations Standard Operating Procedures (SOP)

### 1.1 Morning Routine (10:00 AM IST)

1. **Log in to Admin Dashboard:** Navigate to `https://navacreations.in/admin` and authenticate.
2. **Review Pending Orders:** Navigate to `/admin/orders` and filter by status `PENDING`.
3. **Reconcile UPI Payments:** Match customer-submitted UTRs against your bank current account / BharatPe merchant app statement.
4. **Inspect Inventory Alerts:** Navigate to `/admin/inventory` to review low-stock variants (bangle sizes below 3 units).

---

## 2. Order Fulfillment Workflow

```
[Customer Checkout] ──> [Pending Payment Verification] ──> [Packing & Atelier QA] ──> [Courier Dispatch] ──> [Delivered]
```

### Step 1: Payment Verification (BharatPe UPI Orders)

1. Open `/admin/orders`.
2. Locate orders in `PENDING` status with payment method `UPI_MERCHANT_QR`.
3. Open your BharatPe Merchant app or Bank Current Account statement.
4. Verify:
   - Transaction amount matches the exact order total (including shipping).
   - Customer's claimed 12-digit UTR matches the bank transaction credit.
5. In the Admin portal, click **Verify Payment**.
6. Enter the verified Bank Transaction ID and confirm.
7. The order status automatically advances to `PAYMENT_CONFIRMED`.

> [!WARNING]
> Never ship an order in `PENDING` status without verifying actual funds received in your bank account. Duplicate or fraudulent UTR claims will be flagged and rejected by the system.

### Step 2: Atelier Packing & Quality Control

1. Click **Print Packing Slip** (`/admin/orders/[id]/packing-slip`).
2. Collect the specified bangle sizes (e.g. Size 2.4, 2.6) from the workshop.
3. Conduct craftsmanship inspection:
   - Check stone settings, Kundan foil, and silk thread wrapping.
   - Wipe with dry microfiber cloth.
4. Pack in brand velvet pouch and protective bubble-wrap mailer box.
5. Enclose printed packing slip and handwritten thank-you card.

### Step 3: Courier Dispatch & Tracking Assignment

1. Book dispatch via courier partner (Delhivery, Blue Dart, or DTDC).
2. Obtain the Air Waybill (AWB) tracking number.
3. In `/admin/orders`, select **Dispatch / Mark Shipped**.
4. Enter the courier partner name and AWB number.
5. The order status updates to `SHIPPED`. The customer can track their parcel using the order tracking page (`/orders/[orderNumber]`), protected by an HttpOnly order-scoped session cookie without sensitive secrets exposed in URLs.

---

## 3. Cash on Delivery (COD) Guidelines

- **Maximum Order Value:** COD is capped at ₹5,000 to minimize Return-to-Origin (RTO) risk.
- **Mandatory Phone Verification:** Before packing a COD order, the atelier team MUST call the customer on their WhatsApp mobile number to confirm delivery intent and complete address.
- **Unreachable Customers:** If customer does not answer after 3 attempts over 24 hours, move order status to `CANCELLED` to release reserved inventory.

---

## 4. Customer Support & WhatsApp Concierge

- **Official Support Channel:** WhatsApp Concierge (`+91-98860-00000`).
- **Support Hours:** Monday to Saturday, 10:00 AM to 7:00 PM IST.
- **Bangle Sizing Inquiries:** Share the interactive Bangle Sizing Guide (`/shop` or product detail page) or instruct the customer to measure their hand circumference with a strip of paper.
- **Bridal Customizations:** Direct custom trousseau requests to the atelier manager with expected wedding date and outfit reference photos.

---

## 5. Returns, Damaged Items & Cancellations

- **Damage in Transit:** Customer must report damaged packages within 24 hours of delivery with unboxing photos/video via WhatsApp. Issue immediate replacement or refund.
- **Size Exchanges:** Accepted within 5 days of delivery for unworn items in original packaging. Customer bears flat return shipping (₹80).
- **Refund Processing:**
  - UPI Orders: Refund directly to source account within 3–5 business days after inspecting returned goods.
  - COD Orders: Collect customer UPI ID or bank account details to process direct transfer.
