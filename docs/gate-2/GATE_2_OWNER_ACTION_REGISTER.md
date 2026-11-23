# NAVA CREATIONS — GATE 2 OWNER ACTION REGISTER
## Actionable Register of Owner Decisions, Legal Prerequisites & Operational Launch Deliverables

**Document ID:** `DOC-G2-OWNER-ACTION-REGISTER`  
**Execution Timestamp:** 2026-11-15T13:40:00+05:30  
**Repository Working Directory:** `D:\NAVA`  
**Git Branch:** `feature/production-readiness`  
**Git Commit HEAD SHA:** `b12bf269328e5be9480dad6f35f723cafa3e46a7`  
**Isolated Test Database:** `postgresql://postgres:postgres@127.0.0.1:5432/nava_gateb_test` (Enforced by [test-db-guard.js](file:///d:/NAVA/scripts/test-db-guard.js))  
**Auditor / Directorate:** E-Commerce Operations & Compliance Reviewer, Principal Software Architect

---

## 1. OWNER CONTEXT & BASELINE DECISIONS

This register separates software engineering completion from real-world enterprise operations. The engineering team has fully implemented and verified all technical capabilities. Live customer transactions cannot begin until the enterprise owner completes the operational, legal, and banking prerequisites below.

### 1.1 Confirmed Baseline Decisions (Ground Truth)
The following decisions have been officially confirmed by the owner and are fully reflected in the codebase:
1. **Business Registration Status:** The studio operates as an independent artisanal micro-enterprise and is currently **not registered** (`not_registered`).
2. **Physical Workshop:** The Bengaluru workshop exists, but its physical street address is strictly **not approved for publication**.
3. **Delivery Estimates:** Handcrafted production schedules and courier delivery estimates require **owner confirmation**.
4. **Returns & Refunds:** Statutory returns and manual refund terms require **formal owner review**.
5. **Payment Gateway:** Automated payment gateway chargebacks are not active; manual refund recording is implemented.

---

## 2. ITEMIZED OWNER ACTION REGISTER

| Item ID | Category | Action Title | Description & Practical Steps | Blocking Severity | Status | Target Completion Date |
|---|---|---|---|---|---|---|
| **OWN-ACT-01** | Legal / MSME | **Enterprise Registration & Udyam Filing** | File for Udyam Registration (free online government portal for MSMEs) under Micro Enterprise category. If operating as a Sole Proprietorship, obtain a Shop & Establishment Certificate or CA certificate to facilitate commercial banking. | **HIGH** | PENDING OWNER | Before opening public checkout |
| **OWN-ACT-02** | Banking & Payments | **Current Account & Merchant UPI VPA** | Open a commercial Current Account with an Indian Scheduled Commercial Bank (e.g., HDFC, ICICI, SBI) in the name of NAVA CREATIONS. Generate a dedicated Merchant UPI VPA and QR code linked to this current account. Configure `MERCHANT_UPI_VPA` in production environment. | **CRITICAL** | PENDING OWNER | Before accepting real payments |
| **OWN-ACT-03** | Communication | **Domain Email & Dedicated WhatsApp** | Set up Google Workspace or Zoho Mail for `support@navacreations.com`. Procure a dedicated business mobile SIM card and activate WhatsApp Business under the enterprise name (`NAVA CREATIONS`). Configure in production settings. | **HIGH** | PENDING OWNER | Before public launch |
| **OWN-ACT-04** | Logistics & Shipping | **Courier Contract & AWB Protocol** | Sign up with India Post Speed Post (BNPL / Corporate Account) or a multi-courier aggregator (Shiprocket, Delhivery, Blowhorn). Negotiate flat rate delivery across Karnataka and Pan-India. Agree on pickup scheduling from Bengaluru studio. | **HIGH** | PENDING OWNER | Before shipping orders |
| **OWN-ACT-05** | Customer Policies | **Customer Policy Formal Sign-Off** | Formally review and approve storefront policy disclosures in [CUSTOMER_POLICY_OWNER_REVIEW.md](file:///d:/NAVA/docs/gate-2/CUSTOMER_POLICY_OWNER_REVIEW.md), specifically confirming: shipping fee (₹150 standard, free over ₹1,999), 7-day return terms for defective items, bespoke sizing non-returnability, and non-walk-in studio policy. | **MEDIUM** | PENDING OWNER | Before deployment |
| **OWN-ACT-06** | Product Catalog | **Live Inventory Stock & Photography Audit** | Audit the physical stock of bangles in the Bengaluru studio. Confirm initial quantities for each variant (Size 2.4, 2.6, 2.8) in admin catalog, and review high-resolution product photography. | **MEDIUM** | PENDING OWNER | Before public launch |
| **OWN-DEC-01** | Engineering Policy | **UTR Review Window Decision (24h vs 48h)** | Decide whether the manual bank reconciliation window should remain 24 hours or be extended to 48 hours to account for weekends and bank holidays. | **LOW** | PENDING OWNER | Before deployment |

---

## 3. DEEP DIVE: ACTION STEP-BY-STEP GUIDES

### 3.1 OWN-ACT-01: Udyam (MSME) Registration Guide
1. Visit the official government portal: `https://udyamregistration.gov.in`.
2. Select "For New Entrepreneurs who are not Registered yet as MSME".
3. Enter the Aadhaar Number and Name of the owner.
4. Fill in enterprise details:
   - Enterprise Name: `NAVA CREATIONS`
   - Major Activity: `Manufacturing` (Handmade Bangles, Jewellery & Artificial Crafts)
   - NIC 2-Digit Code: `32` (Other manufacturing) / `3211` (Manufacture of jewellery and related articles).
   - Enterprise Type: `Micro Enterprise`.
5. Submit and download the instant Udyam Registration Certificate with unique UDYAM registration number.

### 3.2 OWN-ACT-02: Bank Current Account & Merchant UPI QR Setup
1. Submit Udyam Certificate, PAN, and address proof to bank branch.
2. Request a Commercial Current Account with instant UPI QR Merchant facility (e.g., BharatPe, HDFC SmartHub, PhonePe Business, or Google Pay for Business).
3. Ensure the QR code / VPA is configured with Merchant Category Code (MCC) `5944` (Jewellery, Watch, Clock, and Silverware Stores) or `5977` (Cosmetic Stores).
4. Update production environment variables:
   - `MERCHANT_UPI_VPA`: `navacreations@okhdfcbank`
   - `MERCHANT_DISPLAY_NAME`: `NAVA CREATIONS`
   - `MERCHANT_ONBOARDING_APPROVED`: `true`

### 3.3 OWN-ACT-03: Official Communication Activation
1. Domain Email:
   - Create MX records on Cloudflare DNS pointing to Google Workspace or Zoho Mail.
   - Configure mailbox: `support@navacreations.com`.
   - Set up auto-responder confirming receipt of customer enquiries within 24 hours.
2. WhatsApp Business:
   - Install WhatsApp Business app on a dedicated studio smartphone.
   - Set business description: *"Handcrafted artisanal bangles and bridal accessories. Made with love in Bengaluru. Production studio only — no walk-ins."*
   - Configure greeting message and link to `https://navacreations.com`.

### 3.4 OWN-DEC-01: UTR Verification Window Decision Analysis

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **Option A: Retain 24 Hours (Current Default)** | Releases abandoned or fake UTR stock quickly so genuine buyers can purchase; minimizes locked inventory; standard across modern D2C platforms. | If customer orders on Saturday evening and owner does not check bank until Monday morning, order might expire. | **Recommended for normal weekdays**, provided owner checks admin dashboard daily. |
| **Option B: Extend to 48 Hours** | Provides ample buffer for weekends, second/fourth Saturdays, and national bank holidays; reduces accidental order cancellations for slow NEFT transfers. | Unsold stock is locked for 2 full days if a fraudulent customer enters a random 12-digit number. | Recommended if owner is operating part-time or cannot perform daily morning reconciliation. |

*How to adjust:* Set `PAYMENT_VERIFICATION_WINDOW_HOURS=48` in production environment settings. The codebase dynamically respects this variable.

---

## 4. OWNER LAUNCH SIGNOFF DECLARATION

Once all actions above are satisfied, the owner may sign off on live deployment:

```
I, the undersigned enterprise owner of NAVA CREATIONS, hereby certify that:
1. All commercial banking, UPI VPA, and domain communications are operational.
2. The customer policy disclosures and shipping fee structures have been reviewed and approved.
3. The platform is authorized to begin accepting live customer orders.

Owner Name: __________________________________________________
Signature:  __________________________________________________
Date:       __________________________________________________
```
