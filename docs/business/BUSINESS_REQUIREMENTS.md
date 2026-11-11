# NAVA CREATIONS — Business Requirements Document (BRD)
**Phase 0 · Discovery & Definition**
**Version:** 0.1-DRAFT | **Status:** Working Document | **Last Updated:** 2026-11-11

---

> [!IMPORTANT]
> This document distinguishes rigorously between **Confirmed Facts** (✅), **Working Hypotheses** (🔶), and items that **Require Research** (❓). No business-specific detail (prices, GSTIN, legal name, return policy, delivery timelines) has been assumed or fabricated. All such items appear in `OPEN_QUESTIONS.md`.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Business Objectives](#2-business-objectives)
3. [Confirmed Facts vs Hypotheses](#3-confirmed-facts-vs-hypotheses)
4. [Stakeholders](#4-stakeholders)
5. [Functional Requirements — Storefront](#5-functional-requirements--storefront)
6. [Functional Requirements — Admin Dashboard](#6-functional-requirements--admin-dashboard)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Indian Operational Requirements](#8-indian-operational-requirements)
9. [Scope Boundaries](#9-scope-boundaries)
10. [Acceptance Criteria](#10-acceptance-criteria)
11. [Source Register](#11-source-register)

---

## 1. Executive Summary

**Nava Creations** is a Bengaluru-based accessories brand selling handmade bangles, bridal bangles, Kundan-work bangles, festival collections, return gifts, hair accessories, and other Indian-style accessories. The brand currently operates through **Instagram** (`@nava__creationsss`) and **WhatsApp**, relying on direct messaging for discovery, enquiries, and order coordination.

### Project Scope — Phase 0
This phase delivers the **foundational documentation and architecture decisions** required before any code is written:
- Business requirements (this document)
- Customer segmentation and research plan
- Open-questions register for stakeholder workshops

### Project Scope — Overall
Build an **independent, owned e-commerce website and back-office infrastructure** that:
- Removes dependency on Instagram algorithm and WhatsApp ad-hoc workflows
- Provides customers a trusted, professional purchase experience
- Gives the business owner visibility into inventory, orders, and revenue
- Supports bridal, bulk, and customisation enquiry workflows alongside standard D2C retail

### Why Now
Small Indian artisan/accessories brands that rely solely on Instagram risk:
- Account suspension or reach suppression wiping out the entire customer channel
- No searchable catalogue (Instagram is not indexed by Google for product listings)
- Manual order management becoming a bottleneck as volume grows
- Inability to run email/SMS remarketing without owned customer data

---

## 2. Business Objectives

> [!NOTE]
> Objectives below are calibrated for a **small independent accessories brand** in Bengaluru. They are realistic for a 12-month horizon post-launch.

### 2.1 Primary Objectives
| # | Objective | Key Result (12-month target) | Priority |
|---|-----------|------------------------------|----------|
| O1 | Establish an owned, SEO-indexed digital storefront | Website live with full product catalogue; indexed by Google | Critical |
| O2 | Convert Instagram & WhatsApp followers to website buyers | ≥ 15 % of monthly orders originating from website within 6 months | High |
| O3 | Reduce manual order management effort | 80 % of standard orders processed without WhatsApp back-and-forth | High |
| O4 | Collect owned customer data (email, phone, preferences) | CRM with ≥ 500 verified customer profiles in 12 months | Medium |
| O5 | Support bridal and bulk-order revenue streams with structured enquiry | Zero bridal/bulk leads lost due to lack of structured enquiry workflow | High |
| O6 | Achieve GST-compliant invoicing for all transactions | 100 % of orders generating a compliant tax invoice | Critical |
| O7 | Enable data-driven product decisions | Monthly sales reports by product, category, and occasion | Medium |

### 2.2 Non-Goals (Phase 0 Scope Exclusions)
- Multi-vendor / marketplace model
- Mobile native app (iOS/Android)
- International shipping
- Wholesale B2B portal
- AI-powered product recommendation engine

---

## 3. Confirmed Facts vs Hypotheses

### 3.1 Confirmed Facts ✅
| Fact | Source |
|------|--------|
| Brand operates Instagram account `@nava__creationsss` | Stakeholder brief |
| Brand uses WhatsApp as a primary sales/customer channel | Stakeholder brief |
| Products include: handmade bangles, bridal bangles, Kundan-work bangles, festival collections, return gifts, hair accessories | Stakeholder brief |
| Business is located in Bengaluru, Karnataka, India | Stakeholder brief |
| Customer types include B2C retail, bridal, festival/occasion, return-gift/bulk, and customisation buyers | Stakeholder brief |
| Goal is to build an independent website and commerce infrastructure | Stakeholder brief |

### 3.2 Working Hypotheses 🔶
| Hypothesis | Basis | Validation Method |
|-----------|-------|-------------------|
| The majority of current customers are women aged 20–45 in South India | Industry norm for Indian accessories brands | Customer survey / analytics |
| Most orders are currently placed via WhatsApp DM after Instagram discovery | Common pattern for IG-first brands | Stakeholder interview |
| Bridal and bulk orders represent a disproportionate share of revenue despite fewer transactions | Typical in Indian accessories market | Review of past order data |
| Customers expect COD as a payment option | Standard expectation for Indian D2C | Customer survey |
| WhatsApp is used for order status updates | Common SMB practice | Stakeholder interview |
| Product photography is done in-house on a smartphone | Common for small IG-first brands | Stakeholder interview |
| The business owner manages operations largely alone or with 1–2 helpers | Scale of business inferred from IG-first model | Stakeholder interview |

### 3.3 Requires Research ❓
| Item | Why It Matters |
|------|---------------|
| Legal registered business name | Required for GST invoices, payment gateway KYC |
| GSTIN (or GST exemption status) | Mandatory for compliant invoicing |
| Current monthly order volume and revenue | Sizing the technical infrastructure |
| Exact product pricing | Required for catalogue build |
| Materials and care instructions per SKU | Required for product detail pages |
| Return and exchange policy | Required for checkout, trust, and legal compliance |
| Delivery timelines and geographic coverage | Required for checkout and shipping integrations |
| Artisan/maker details (if any claims will be made) | Consumer protection and authenticity claims |

---

## 4. Stakeholders

| Role | Involvement | Input Needed |
|------|-------------|--------------|
| Business Owner / Founder | Decision-maker, primary user of admin dashboard | All open questions in OPEN_QUESTIONS.md |
| End Customers | Storefront users | Customer interviews (see CUSTOMER_SEGMENTS.md) |
| Payment Gateway Partner | Razorpay or Cashfree (❓ to be decided) | KYC docs, settlement terms |
| Logistics Partner | Shiprocket / Delhivery (❓ to be decided) | API credentials, rate cards |
| WhatsApp Business API Provider | Meta or BSP (Business Solution Provider) | Account setup, template approvals |
| Developer / Technical Team | Builds and maintains the platform | Architecture decisions, NFRs |
| Accountant / CA | GST compliance | GSTIN, HSN codes, invoice format |

---

## 5. Functional Requirements — Storefront

### 5.1 Product Catalogue

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-PC-01 | Display products organised by category (Bangles, Bridal, Festival, Hair Accessories, Return Gifts, Other) | Must | Categories ❓ — confirm with owner |
| FR-PC-02 | Product detail page (PDP): multiple images (min 4), name, description, price, size/colour variants, stock availability | Must | |
| FR-PC-03 | Product variants (size, colour/finish, material where applicable) with individual stock tracking | Must | |
| FR-PC-04 | "Out of Stock" indicator with optional "Notify me when available" (email/WhatsApp) | Should | |
| FR-PC-05 | Related products / "You may also like" section on PDP | Could | Post-MVP |
| FR-PC-06 | Product badges: "New", "Best Seller", "Festival Pick", "Bridal Collection" | Should | |
| FR-PC-07 | Photo gallery with zoom and multiple-image carousel | Must | |
| FR-PC-08 | Video embed support per product (for demonstration reels) | Should | |
| FR-PC-09 | Custom enquiry CTA ("Enquire for Customisation") visible on PDP | Must | Bridal / custom segment |
| FR-PC-10 | Bulk order CTA ("Order in bulk / Return Gifts") visible on category and PDP pages | Must | |
| FR-PC-11 | Shareable product links (WhatsApp share button, link copy) | Must | Indian market essential |

### 5.2 Search & Discovery

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-SD-01 | Site-wide search with instant suggestions (product name, category) | Must | |
| FR-SD-02 | Filter by: Category, Occasion (Bridal, Festival, Casual, Return Gift), Colour, Size, Price range, New Arrivals | Must | |
| FR-SD-03 | Sort by: Price (low-high, high-low), Newest, Best Sellers, Relevance | Must | |
| FR-SD-04 | Collection / curated landing pages (e.g., "Diwali Collection", "Bridal Special") | Should | |
| FR-SD-05 | No-results page with suggestions or WhatsApp contact link | Should | |

### 5.3 Cart

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-CA-01 | Persistent cart (saved across sessions for logged-in users; cookie-based for guests) | Must | |
| FR-CA-02 | Quantity update and item removal in cart | Must | |
| FR-CA-03 | Display: item image, name, variant, unit price, subtotal, shipping estimate | Must | |
| FR-CA-04 | Coupon / promo code entry with real-time validation | Should | |
| FR-CA-05 | Cart summary: subtotal, discount, estimated shipping, estimated GST, total | Must | |
| FR-CA-06 | Save for later / move to wishlist from cart | Could | |
| FR-CA-07 | Minimum order quantity enforcement for bulk/return-gift items | Should | |

### 5.4 Checkout

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-CH-01 | Guest checkout (no forced account creation) | Must | Reduces friction |
| FR-CH-02 | Address form: name, phone, address line 1 & 2, city, state (pre-fill Karnataka), pincode, landmark (optional) | Must | |
| FR-CH-03 | Pincode-based delivery feasibility and estimated delivery date | Must | Via Shiprocket / Delhivery API |
| FR-CH-04 | Multiple saved addresses for registered users | Should | |
| FR-CH-05 | Order summary review before payment | Must | |
| FR-CH-06 | GST-inclusive pricing display (price already includes GST, invoice generated post-order) | Must | ❓ Confirm with CA |
| FR-CH-07 | Pre-checkout WhatsApp/phone verification for COD orders | Should | Fraud reduction |
| FR-CH-08 | Customisation notes field at checkout ("Add a note to your order") | Must | |
| FR-CH-09 | Gift wrapping option (❓ if offered) | Could | |

### 5.5 Payments

> [!IMPORTANT]
> Payment gateway selection (Razorpay vs Cashfree) depends on KYC completion, settlement timelines, and pricing. This is an **open question** to be resolved before development begins.

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-PAY-01 | UPI payment (GPay, PhonePe, Paytm, BHIM) | Must | Priority #1 in Indian market |
| FR-PAY-02 | Debit and credit cards (Visa, Mastercard, RuPay) | Must | |
| FR-PAY-03 | Net banking | Should | |
| FR-PAY-04 | EMI options (on orders above ❓ threshold) | Could | Relevant for bridal orders |
| FR-PAY-05 | Cash on Delivery (COD) | Must | ❓ Confirm if offered; standard expectation |
| FR-PAY-06 | COD order confirmation via SMS / WhatsApp OTP | Should | Fraud reduction |
| FR-PAY-07 | Payment failure handling with retry option | Must | |
| FR-PAY-08 | Secure payment page (PCI-DSS compliant via gateway) | Must | Handled by gateway |
| FR-PAY-09 | Order confirmation page and email/SMS/WhatsApp notification on successful payment | Must | |

### 5.6 Orders & Tracking

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-ORD-01 | Order confirmation page with order ID, summary, and expected delivery | Must | |
| FR-ORD-02 | Email + WhatsApp order confirmation with invoice PDF | Must | |
| FR-ORD-03 | Order tracking page (order status, AWB number, carrier link) | Must | |
| FR-ORD-04 | Order history for registered users | Must | |
| FR-ORD-05 | Order cancellation request (within configurable window, e.g., before dispatch) | Should | ❓ Policy TBD |
| FR-ORD-06 | Return / exchange request form | Should | ❓ Policy TBD |
| FR-ORD-07 | Guest order tracking by order ID + phone number | Must | |

### 5.7 Customer Accounts

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-ACC-01 | Register with email or mobile number (OTP-based) | Must | |
| FR-ACC-02 | Login via email/password, OTP, or Google Sign-In | Must | |
| FR-ACC-03 | Profile: name, phone, email, DOB (for birthday offers), anniversary date (for bridal re-orders) | Should | |
| FR-ACC-04 | Saved addresses management | Must | |
| FR-ACC-05 | Order history with re-order capability | Should | |
| FR-ACC-06 | Wishlist (saved products) | Should | |
| FR-ACC-07 | "My Custom Enquiries" — view status of customisation requests | Should | |
| FR-ACC-08 | Communication preferences (email, WhatsApp, SMS opt-in/out) | Must | TRAI/DPDP compliance |

### 5.8 Wishlist

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-WL-01 | Add / remove products from wishlist (logged-in users) | Should | |
| FR-WL-02 | Shareable wishlist link (WhatsApp / link copy) | Could | Gifting use case |
| FR-WL-03 | Move item from wishlist to cart | Should | |
| FR-WL-04 | Wishlist items low-stock / back-in-stock notification | Could | |

### 5.9 Reviews & Ratings

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-REV-01 | Star rating (1–5) + text review per verified purchase | Should | |
| FR-REV-02 | Photo upload with review | Should | High trust signal in Indian market |
| FR-REV-03 | Review moderation workflow in admin | Should | |
| FR-REV-04 | Display aggregate rating on product listing and PDP | Should | |
| FR-REV-05 | "Verified Purchase" badge on reviews | Should | |

### 5.10 Custom Enquiries

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-CE-01 | Enquiry form: product reference, quantity, customisation description, occasion/date, budget range, contact details (name, phone, email) | Must | |
| FR-CE-02 | File upload for inspiration images / reference photos | Should | |
| FR-CE-03 | Auto-acknowledgement email/WhatsApp to customer | Must | |
| FR-CE-04 | Enquiry lands in admin dashboard for follow-up | Must | |
| FR-CE-05 | Admin can update enquiry status and send message to customer | Should | |

### 5.11 Bulk / Return-Gift Orders

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-BLK-01 | Dedicated "Bulk / Return Gifts" landing page with form | Must | |
| FR-BLK-02 | Form: product of interest, quantity required, customisation needs, event date, budget, contact details | Must | |
| FR-BLK-03 | Auto-acknowledgement and admin notification | Must | |
| FR-BLK-04 | Minimum order quantity display per product (❓ MOQ to be confirmed per SKU) | Should | |

---

## 6. Functional Requirements — Admin Dashboard

> [!NOTE]
> The admin dashboard is used by the business owner (and potentially 1–2 helpers). Role-based access control must allow restricting helper access appropriately.

### 6.1 Product Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-ADM-PM-01 | Create / edit / archive products with: title, description, category, tags, occasion tags | Must | |
| FR-ADM-PM-02 | Variant management: define attributes (size, colour, finish) and generate SKUs per variant | Must | |
| FR-ADM-PM-03 | Bulk image upload per product; reorder images; set featured image | Must | |
| FR-ADM-PM-04 | Price: MRP, selling price, cost price (private, for margin calc) | Must | |
| FR-ADM-PM-05 | HSN code entry per product (for GST invoicing) | Must | |
| FR-ADM-PM-06 | SEO fields: meta title, meta description, URL slug | Should | |
| FR-ADM-PM-07 | Product status: Draft / Active / Out of Stock / Archived | Must | |
| FR-ADM-PM-08 | Duplicate product (for creating variants quickly) | Should | |
| FR-ADM-PM-09 | Bulk CSV import / export of product catalogue | Should | |

### 6.2 Inventory Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-ADM-INV-01 | Stock quantity per SKU/variant | Must | |
| FR-ADM-INV-02 | Low-stock threshold alert (email / dashboard notification) | Must | |
| FR-ADM-INV-03 | Stock reservation on order placement (released on cancellation) | Must | Prevents overselling |
| FR-ADM-INV-04 | Inventory adjustment log (manual corrections with reason) | Should | |
| FR-ADM-INV-05 | Inventory report: current stock value, low stock items, out-of-stock items | Should | |

### 6.3 Order Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-ADM-ORD-01 | Order list with filters: status, date range, payment method, fulfilment status | Must | |
| FR-ADM-ORD-02 | Order detail view: items, pricing, GST breakdown, customer info, shipping address | Must | |
| FR-ADM-ORD-03 | Update order status: Confirmed → Processing → Packed → Dispatched → Delivered → Returned | Must | |
| FR-ADM-ORD-04 | Generate and download GST-compliant invoice PDF per order | Must | |
| FR-ADM-ORD-05 | Enter AWB / tracking number; triggers customer notification | Must | |
| FR-ADM-ORD-06 | Create manual order (phone/WhatsApp orders entered by admin) | Should | |
| FR-ADM-ORD-07 | COD order confirmation / rejection workflow | Must | If COD offered |
| FR-ADM-ORD-08 | Refund initiation for prepaid orders | Should | Via payment gateway refund API |
| FR-ADM-ORD-09 | Bulk label printing / packing list export | Should | |

### 6.4 Customer Management

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-ADM-CUS-01 | Customer list with search, filter by segment, order count, total spend | Should | |
| FR-ADM-CUS-02 | Customer profile: contact info, order history, enquiry history, communication preferences | Should | |
| FR-ADM-CUS-03 | Add customer note (admin-only internal notes) | Could | |
| FR-ADM-CUS-04 | Export customer list (CSV) for email/WhatsApp campaigns | Should | DPDP compliant |

### 6.5 Promotions & Coupons

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-ADM-PROMO-01 | Create coupon codes: percentage discount, fixed amount, free shipping | Must | |
| FR-ADM-PROMO-02 | Coupon rules: min order value, max uses, per-customer limit, validity dates, applicable categories | Should | |
| FR-ADM-PROMO-03 | Sale pricing: set sale price with optional sale end date per product/variant | Must | |
| FR-ADM-PROMO-04 | Automatic collection-level sale (e.g., 20 % off all Festival items) | Could | |
| FR-ADM-PROMO-05 | Coupon usage report | Should | |

### 6.6 Content / CMS

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-ADM-CMS-01 | Homepage banner / hero management (image, text, CTA link) | Must | |
| FR-ADM-CMS-02 | Announcement bar (e.g., "Free shipping above ₹X") | Should | ❓ Threshold TBD |
| FR-ADM-CMS-03 | Static pages: About Us, Contact, Shipping Policy, Return Policy, Privacy Policy, Terms | Must | |
| FR-ADM-CMS-04 | Collection / occasion landing page content management | Should | |
| FR-ADM-CMS-05 | Blog / inspiration articles (optional, for SEO) | Could | |

### 6.7 Reports & Analytics

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-ADM-RPT-01 | Sales dashboard: total revenue, orders, AOV, by date range | Must | |
| FR-ADM-RPT-02 | Sales by product / category / occasion | Must | |
| FR-ADM-RPT-03 | Payment method breakdown (UPI, card, COD) | Should | |
| FR-ADM-RPT-04 | GST output report (for CA / filing) | Must | |
| FR-ADM-RPT-05 | Fulfilment report: average dispatch time, carrier-wise | Should | |
| FR-ADM-RPT-06 | Customer acquisition report (new vs returning) | Should | |
| FR-ADM-RPT-07 | Enquiry conversion report (enquiries received vs orders placed) | Could | |
| FR-ADM-RPT-08 | Integration with Google Analytics 4 | Should | |

### 6.8 Users & Roles (RBAC)

| ID | Requirement | Priority | Notes |
|----|-------------|----------|-------|
| FR-ADM-RBAC-01 | Role: **Owner** — full access to all features including billing and reports | Must | |
| FR-ADM-RBAC-02 | Role: **Fulfillment Staff** — view orders, update status, print labels; no product editing or financial data | Should | |
| FR-ADM-RBAC-03 | Role: **Product Manager** — manage products, inventory; no order financial data | Could | |
| FR-ADM-RBAC-04 | Audit log: who changed what, when | Should | |
| FR-ADM-RBAC-05 | Two-factor authentication for admin login | Must | |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Target | Standard |
|--------|--------|----------|
| Largest Contentful Paint (LCP) | ≤ 2.5 s | Core Web Vitals (Good) |
| Interaction to Next Paint (INP) | ≤ 200 ms | Core Web Vitals (Good) |
| Cumulative Layout Shift (CLS) | ≤ 0.1 | Core Web Vitals (Good) |
| Time to First Byte (TTFB) | ≤ 800 ms | — |
| Page load on 3G mobile (product listing) | ≤ 4 s | Indian mobile network conditions |
| Uptime | ≥ 99.5 % | Measured monthly |
| Concurrent users (MVP) | 500 simultaneous | Scale-up plan for peak seasons |

> [!NOTE]
> Performance targets are especially critical for India, where a large segment of users are on mid-range Android devices with 4G/3G connectivity. Images must be served in WebP with responsive sizes; use a CDN.

### 7.2 Accessibility

| Requirement | Standard |
|-------------|----------|
| Conformance level | WCAG 2.2 Level AA |
| Keyboard navigation for all interactive elements | WCAG 2.1.1 |
| Screen reader compatibility (NVDA, TalkBack) | — |
| Colour contrast ratio ≥ 4.5:1 for normal text | WCAG 1.4.3 |
| All images have descriptive alt text | WCAG 1.1.1 |
| Form fields have visible labels and error messages | WCAG 1.3.1, 3.3.1 |
| Focus indicators visible | WCAG 2.4.7 |

### 7.3 Security

| Requirement | Standard / Method |
|-------------|------------------|
| OWASP Top 10 mitigations | Mandatory — to be verified by pre-launch security review |
| SQL injection prevention | Parameterised queries / ORM |
| XSS prevention | Output escaping, CSP headers |
| CSRF protection | CSRF tokens on all state-changing forms |
| HTTPS everywhere | TLS 1.2+ enforced; HSTS header |
| Sensitive data encryption at rest | Passwords: bcrypt/Argon2; PII fields encrypted |
| Payment data | Never stored on platform; handled exclusively by PCI-DSS certified gateway |
| Rate limiting on login, OTP, and checkout endpoints | — |
| Admin IP allowlist (optional but recommended) | — |
| Dependency vulnerability scanning | Automated in CI pipeline |
| DPDP Act 2023 compliance | Indian data protection; consent management required |

### 7.4 Mobile-First Design

| Requirement | Detail |
|-------------|--------|
| Responsive breakpoints | Mobile (320–767 px), Tablet (768–1023 px), Desktop (≥ 1024 px) |
| Primary design target | 375 px viewport (iPhone SE / mid-range Android) |
| Touch targets | ≥ 44 × 44 px |
| Bottom navigation bar on mobile | For primary categories and cart |
| Images | Lazy-loaded, next-gen formats (WebP/AVIF), srcset |
| Font sizes | Base ≥ 16 px; no text below 12 px |

### 7.5 Internationalisation & Localisation

| Requirement | Detail |
|-------------|--------|
| Primary language | English (Indian English) |
| Currency | Indian Rupee (₹ / INR) |
| Date/time format | DD MMM YYYY; IST (UTC+5:30) |
| Number format | Indian number system (₹1,00,000 not ₹100,000) |
| Multilingual support (Kannada / Hindi) | Could — Post-MVP |

---

## 8. Indian Operational Requirements

### 8.1 GST Invoicing

| Requirement | Detail |
|-------------|--------|
| Generate GST-compliant invoice per order | Mandatory under GST Act |
| Invoice fields | GSTIN ❓, business legal name ❓, buyer details, HSN codes ❓, CGST + SGST (intra-state) or IGST (inter-state) breakdown, invoice number, date |
| Intra-state (Karnataka) | CGST + SGST split |
| Inter-state | IGST |
| Reverse charge | Not applicable for B2C retail |
| Invoice download | From order confirmation email and customer account |
| E-invoice (B2B above ₹5 Cr threshold) | Not applicable at MVP scale; monitor threshold |

> [!WARNING]
> GST rates per HSN code must be confirmed with a CA before development. Applying incorrect rates creates legal liability.

### 8.2 COD Workflow

| Step | Requirement |
|------|-------------|
| COD order placement | Customer places order; payment collected on delivery |
| COD verification | OTP or WhatsApp confirmation to reduce fake orders |
| COD order flag | Admin can mark COD orders and view pending collections |
| COD remittance | Logistics partner remits COD amount (minus charges) on a cycle ❓ |
| Failed delivery / returned COD | Admin notified; order status updated; customer re-contacted |

### 8.3 Payment Gateway

> [!IMPORTANT]
> **Razorpay** and **Cashfree** are the two shortlisted options. Final selection depends on settlement timelines, pricing, COD availability (Cashfree offers COD), and KYC requirements. This is an open question.

| Feature | Razorpay | Cashfree |
|---------|----------|----------|
| UPI | ✅ | ✅ |
| Cards | ✅ | ✅ |
| Net Banking | ✅ | ✅ |
| COD (via logistics) | ❌ native | ✅ native |
| Instant settlement option | ✅ (fee) | ✅ (fee) |
| Standard settlement | T+2 | T+2 |
| EMI | ✅ | ✅ |

### 8.4 Shipping / Logistics Integration

> [!NOTE]
> **Shiprocket** and **Delhivery Direct** are the two shortlisted options. Shiprocket is an aggregator (access to multiple carriers); Delhivery is a direct carrier. Both offer API integrations and COD services.

| Requirement | Detail |
|-------------|--------|
| Pincode serviceability check | At checkout before payment |
| Rate calculation at checkout | Weight + dimensions + zone-based |
| Waybill / AWB generation | On order dispatch from admin |
| Tracking webhook | Updates order status automatically |
| COD remittance | Automated reconciliation |
| Returns pickup | Requested from admin, carrier picks up |
| Shiprocket features | Multi-carrier, tracking page, COD, NDR management |
| Delhivery features | Wide network, strong COD workflow, good API |

### 8.5 WhatsApp Business API

| Requirement | Detail |
|-------------|--------|
| Order confirmation notification | Triggered on order placement |
| Dispatch notification with tracking link | Triggered on AWB entry |
| Delivery notification | Triggered by carrier webhook |
| COD verification OTP | Triggered on COD order placement |
| Custom enquiry acknowledgement | Triggered on enquiry form submission |
| Bulk order enquiry acknowledgement | Triggered on bulk enquiry form submission |
| Template approval | All above templates require Meta pre-approval |
| BSP options | Interakt, Wati, AiSensy (❓ to be selected) |

---

## 9. Scope Boundaries

### 9.1 MVP Launch Scope (In-Scope)

| Area | In-Scope for MVP |
|------|-----------------|
| Storefront | Product catalogue, search, filters, cart, checkout (UPI + Card + COD), order placement, guest + account checkout |
| Product types | All existing product categories (Bangles, Bridal, Festival, Hair Accessories, Return Gifts) |
| Customer accounts | Register/login, order history, wishlist |
| Enquiries | Custom enquiry form, Bulk/Return-gift enquiry form |
| Admin | Product mgmt, inventory, order mgmt, GST invoice generation, basic reports |
| Payments | Razorpay or Cashfree (UPI, card, COD) |
| Shipping | Shiprocket or Delhivery integration |
| Notifications | WhatsApp Business API: order confirmation, dispatch, delivery |
| Legal pages | Privacy Policy, Terms of Service, Shipping Policy, Return Policy, About |
| GST | Tax-inclusive pricing, invoice generation |
| Analytics | Google Analytics 4 |

### 9.2 Post-Launch (Out of MVP Scope)

| Feature | Rationale for Deferral |
|---------|----------------------|
| Multilingual (Kannada/Hindi) | Content creation overhead; English sufficient at launch |
| Native mobile app | Website PWA can serve mobile users initially |
| Product reviews (photo + text) | Needs purchase base to seed first; launch after 3 months |
| EMI options | Low priority at MVP; add once transaction volume proven |
| Blog / SEO articles | Content strategy should be defined post-launch |
| AI-powered product recommendations | Needs purchase data; not useful at zero orders |
| International shipping | Outside current business scope |
| Loyalty / points programme | Add when repeat purchase rate is established |
| Subscription boxes | New product format; evaluate post-launch |
| WhatsApp Shop catalogue sync | Evaluate after primary website is stable |

---

## 10. Acceptance Criteria

### 10.1 MVP Launch Gates

> [!IMPORTANT]
> The following criteria must all be met before the site goes live.

| Gate | Criterion | Verification |
|------|-----------|--------------|
| AC-01 | All product categories and products are live with accurate information | Manual QA by owner |
| AC-02 | Checkout flow completes successfully for UPI, card, and COD on mobile and desktop | End-to-end test orders |
| AC-03 | GST-compliant invoice generated and emailed for every test order | CA review of invoice format |
| AC-04 | WhatsApp notifications delivered for order confirmation and dispatch | Test with 5 real orders |
| AC-05 | Core Web Vitals in "Good" range (LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1) | Google PageSpeed Insights on staging |
| AC-06 | No P0 security vulnerabilities (OWASP Top 10) | OWASP ZAP scan on staging |
| AC-07 | Custom enquiry and bulk enquiry forms deliver leads to admin and trigger WhatsApp ack | End-to-end test |
| AC-08 | Admin can manage products, process orders, update status, and download invoices | Owner walkthrough |
| AC-09 | Privacy Policy, Shipping Policy, Return Policy, and Terms pages are live | Legal review |
| AC-10 | Pincode serviceability check works at checkout | Test with 10 pincodes (in and out of range) |

---

## 11. Source Register

| Item | Type | Source / Confidence |
|------|------|-------------------|
| Instagram handle `@nava__creationsss` | ✅ Confirmed | Stakeholder brief |
| Product categories (bangles, bridal, festival, hair, return gifts) | ✅ Confirmed | Stakeholder brief |
| Location: Bengaluru, Karnataka | ✅ Confirmed | Stakeholder brief |
| Customer types | ✅ Confirmed | Stakeholder brief |
| WhatsApp as primary channel | ✅ Confirmed | Stakeholder brief |
| COD as expected payment option | 🔶 Hypothesis | Industry norm; needs owner confirmation |
| Business owner operates largely alone | 🔶 Hypothesis | Scale inference; needs confirmation |
| Majority customers: women 20–45 | 🔶 Hypothesis | Industry norm; needs customer survey |
| Bridal = disproportionate revenue | 🔶 Hypothesis | Category logic; needs order data |
| Shiprocket/Delhivery as logistics options | 🔶 Hypothesis | Standard for small Indian D2C; needs selection |
| Razorpay/Cashfree as payment gateway | 🔶 Hypothesis | Standard for small Indian D2C; needs selection |
| Legal business name | ❓ Requires research | Owner to provide |
| GSTIN | ❓ Requires research | Owner to provide |
| GST rates per product | ❓ Requires research | CA to advise |
| Product pricing | ❓ Requires research | Owner to provide |
| Return and exchange policy | ❓ Requires research | Owner to define |
| Delivery timelines | ❓ Requires research | Logistics partner selection |
| MOQ per SKU | ❓ Requires research | Owner to define |

---

*Document prepared as part of NAVA CREATIONS Phase 0 — Discovery & Definition.*
*All open items tracked in `OPEN_QUESTIONS.md`. Customer insights tracked in `CUSTOMER_SEGMENTS.md`.*
