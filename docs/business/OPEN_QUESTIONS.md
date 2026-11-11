# NAVA CREATIONS — Open Questions Register
**Phase 0 · Discovery & Definition**
**Version:** 0.1-DRAFT | **Status:** Living Document | **Last Updated:** 2026-11-11

---

> [!IMPORTANT]
> This register tracks every unresolved question that must be answered before design or development can proceed. Questions are grouped by area and prioritised. **No business-specific detail has been assumed or fabricated.**
> Update this document after each stakeholder session, adding answers and moving questions to Resolved.

---

> [!NOTE]
> **Priority Definitions:**
> - 🔴 **Critical** — Blocks development or carries legal/compliance risk; must be resolved before any build begins
> - 🟠 **High** — Required before MVP launch; affects architecture or user experience significantly
> - 🟡 **Medium** — Should be resolved before launch; affects completeness of feature
> - 🟢 **Low** — Can be resolved post-launch or during Phase 1

---

## Table of Contents
1. [Brand & Identity](#1-brand--identity)
2. [Products](#2-products)
3. [Business Operations](#3-business-operations)
4. [Legal & Compliance](#4-legal--compliance)
5. [Technical Setup](#5-technical-setup)
6. [Customer Data](#6-customer-data)
7. [Content](#7-content)
8. [Marketing](#8-marketing)
9. [Resolved Questions](#9-resolved-questions)

---

## 1. Brand & Identity

| # | Question | Why It Matters | Who Answers | Priority | Status |
|---|----------|---------------|-------------|----------|--------|
| BI-01 | What is the legal registered business name of NAVA CREATIONS? | Required for GST invoices, payment gateway KYC, and legal pages (Terms, Privacy Policy) | Business Owner | 🔴 Critical | Open |
| BI-02 | Is the brand name "NAVA CREATIONS" the trading name, or is there a separate legal entity name? | Affects how the name appears on invoices and contracts | Business Owner | 🔴 Critical | Open |
| BI-03 | Is there an existing brand logo in vector/high-resolution format? | Required for website header, favicon, invoices, packaging | Business Owner | 🟠 High | Open |
| BI-04 | Are there brand colour codes (HEX/RGB) and typography guidelines? | Required to build the visual identity system; avoids rework | Business Owner / Designer | 🟠 High | Open |
| BI-05 | What is the brand's core story / founding narrative? | Required for About Us page, SEO content, and customer trust | Business Owner | 🟡 Medium | Open |
| BI-06 | Is there an artisan / maker story to be told (e.g., "made by artisans in Bengaluru")? | Affects product page copy and authenticity claims; must not be fabricated | Business Owner | 🟡 Medium | Open |
| BI-07 | What tone of voice does the brand prefer? (e.g., warm/conversational vs aspirational/premium) | Guides all website copy, notification messages, and social content | Business Owner | 🟡 Medium | Open |
| BI-08 | Does the brand have an existing tagline or brand promise? | Used in hero banners and SEO metadata | Business Owner | 🟢 Low | Open |

---

## 2. Products

| # | Question | Why It Matters | Who Answers | Priority | Status |
|---|----------|---------------|-------------|----------|--------|
| PR-01 | What is the complete list of product categories and sub-categories to be listed on the website at launch? | Required to build navigation, filters, and catalogue structure | Business Owner | 🔴 Critical | Open |
| PR-02 | How many individual products (SKUs) will be listed at MVP launch? | Required to estimate data-entry effort and catalogue build timeline | Business Owner | 🔴 Critical | Open |
| PR-03 | What variants does each product have? (e.g., size in mm/inches, colour, finish, material) | Required for variant management and stock tracking design | Business Owner | 🔴 Critical | Open |
| PR-04 | What is the retail selling price for each product / variant? | Required for checkout, cart, invoices, and payment gateway | Business Owner | 🔴 Critical | Open |
| PR-05 | What are the HSN codes for each product category? (e.g., bangles, hair accessories) | Mandatory for GST-compliant invoicing | Business Owner + CA | 🔴 Critical | Open |
| PR-06 | What is the GST rate applicable to each product category? (CGST + SGST for intra-state) | Mandatory for correct tax calculation on invoices | CA (Chartered Accountant) | 🔴 Critical | Open |
| PR-07 | Does the brand sell products at MRP inclusive or exclusive of GST? | Determines how prices are displayed and how invoices are structured | Business Owner + CA | 🔴 Critical | Open |
| PR-08 | What materials are used in each product type? (e.g., brass, lac, acrylic, glass, Kundan stones) | Required for product descriptions, care instructions, and authenticity claims | Business Owner | 🟠 High | Open |
| PR-09 | What are the care and storage instructions for each product type? | Required for product detail pages; reduces returns due to customer mishandling | Business Owner | 🟠 High | Open |
| PR-10 | What are the available sizes (inner diameter in mm or standard size labels) per product type? | Required for size guide, variant setup, and reducing size-related returns | Business Owner | 🟠 High | Open |
| PR-11 | Is there a standard size (most popular) that can be pre-selected on PDPs? | UX decision; reduces decision fatigue | Business Owner | 🟡 Medium | Open |
| PR-12 | What is the current stock quantity per SKU / variant? | Required for inventory setup and preventing overselling | Business Owner | 🟠 High | Open |
| PR-13 | What is the low-stock threshold that should trigger admin alerts? (e.g., ≤ 5 units) | Required for inventory alert configuration | Business Owner | 🟡 Medium | Open |
| PR-14 | Are there any products that are made-to-order (not held in stock)? | Affects stock management and delivery timeline communication | Business Owner | 🟠 High | Open |
| PR-15 | What is the minimum order quantity (MOQ) for bulk / return-gift orders per product type? | Required for bulk order page and checkout rules | Business Owner | 🟠 High | Open |
| PR-16 | What is the weight and dimensions of each product (and packaging) for shipping rate calculation? | Required for real-time shipping rate calculation at checkout | Business Owner | 🟠 High | Open |
| PR-17 | Does the brand plan to add new products frequently (e.g., seasonal collections)? | Affects CMS design and admin workflow | Business Owner | 🟡 Medium | Open |
| PR-18 | Are there products that should NOT be available for online purchase (e.g., display only, enquiry only)? | Affects product listing logic | Business Owner | 🟡 Medium | Open |

---

## 3. Business Operations

| # | Question | Why It Matters | Who Answers | Priority | Status |
|---|----------|---------------|-------------|----------|--------|
| OPS-01 | Does the business offer Cash on Delivery (COD)? If yes, in which pincodes / cities? | COD is a major checkout feature affecting payment gateway and logistics selection | Business Owner | 🔴 Critical | Open |
| OPS-02 | What is the return and exchange policy? (Eligibility, timeframe, process, who pays return shipping) | Required for website policy page, checkout, and customer trust; also legal requirement | Business Owner | 🔴 Critical | Open |
| OPS-03 | What is the standard order processing and dispatch time? (e.g., "shipped within 2 business days") | Required for checkout, order confirmation communications, and customer expectation setting | Business Owner | 🔴 Critical | Open |
| OPS-04 | Which cities / pincodes does the brand currently ship to? | Required for pincode serviceability check at checkout | Business Owner + Logistics Partner | 🔴 Critical | Open |
| OPS-05 | Who will be responsible for packing and dispatching orders? | Affects operational workflow and staffing plan | Business Owner | 🟠 High | Open |
| OPS-06 | What is the current average monthly order volume? | Required to size the infrastructure (hosting, payment gateway plan tier) | Business Owner | 🟠 High | Open |
| OPS-07 | What is the average order value (AOV) currently? | Required for business projections and payment gateway plan selection | Business Owner | 🟠 High | Open |
| OPS-08 | Is there a physical store or workshop that customers can visit? If so, should this be shown on the website? | Affects About Us, Contact pages, and local SEO | Business Owner | 🟡 Medium | Open |
| OPS-09 | What is the typical turnaround time for custom orders? | Required for the customisation enquiry workflow and customer communications | Business Owner | 🟠 High | Open |
| OPS-10 | Does the brand offer gift wrapping or branded packaging? If yes, is there an additional charge? | Required for checkout options and product listing | Business Owner | 🟡 Medium | Open |
| OPS-11 | Is the business operational on Sundays and public holidays? | Affects order processing and customer communication SLAs | Business Owner | 🟡 Medium | Open |
| OPS-12 | What is the preferred payment collection model for bulk/custom orders? (Full upfront? 50 % deposit? Proforma invoice?) | Required for bulk order and customisation enquiry checkout flow design | Business Owner | 🟠 High | Open |
| OPS-13 | Does the brand have an existing email address for business communications? | Required for transactional emails (order confirmation, invoice) | Business Owner | 🔴 Critical | Open |
| OPS-14 | What is the preferred domain name for the website? (e.g., navacreations.in) | Required to initiate domain registration | Business Owner | 🔴 Critical | Open |
| OPS-15 | Has the domain already been registered? If so, with which registrar? | Affects DNS and hosting setup | Business Owner | 🟠 High | Open |
| OPS-16 | Does the brand currently have a WhatsApp Business account? What is the number? | Required for WhatsApp API integration planning | Business Owner | 🟠 High | Open |
| OPS-17 | Is the WhatsApp number a personal number or a dedicated business number? | WhatsApp Business API requires a dedicated number not currently linked to the app | Business Owner | 🔴 Critical | Open |
| OPS-18 | What are the brand's peak seasons and expected traffic spikes? | Required for infrastructure scaling plan and marketing calendar | Business Owner | 🟡 Medium | Open |

---

## 4. Legal & Compliance

| # | Question | Why It Matters | Who Answers | Priority | Status |
|---|----------|---------------|-------------|----------|--------|
| LC-01 | What is the GSTIN of the business? | Mandatory on all GST invoices; required for payment gateway KYC | Business Owner | 🔴 Critical | Open |
| LC-02 | Is the business registered under GST? If not, what is the annual turnover status and threshold? | Determines whether GST invoicing is mandatory | Business Owner + CA | 🔴 Critical | Open |
| LC-03 | What is the registered business address for GST purposes? | Required on GST invoices | Business Owner | 🔴 Critical | Open |
| LC-04 | Is the business a sole proprietorship, partnership, LLP, or private limited company? | Affects KYC requirements for payment gateway, shipping partner agreements | Business Owner | 🔴 Critical | Open |
| LC-05 | Is there a PAN card associated with the business? | Required for payment gateway KYC (Razorpay / Cashfree) | Business Owner | 🔴 Critical | Open |
| LC-06 | Does the business have a bank account in the business name? | Required for payment gateway settlement | Business Owner | 🔴 Critical | Open |
| LC-07 | What is the brand's return/refund policy from a consumer protection standpoint? | Consumer Protection Act 2019 and e-commerce rules require a clear stated policy | Business Owner + Legal | 🔴 Critical | Open |
| LC-08 | Does the website need to comply with the BIS hallmarking or quality certification requirements for any product category? | Some jewellery categories may have certification requirements; check for bangles | Business Owner + Legal | 🟠 High | Open |
| LC-09 | Has a Privacy Policy been drafted that is compliant with the Digital Personal Data Protection Act 2023 (DPDP)? | Mandatory for any website collecting personal data in India | Legal / CA | 🔴 Critical | Open |
| LC-10 | What data will be collected from customers, and has consent management been designed? | DPDP Act 2023 requires explicit consent for data collection | Legal / Technical | 🔴 Critical | Open |
| LC-11 | Are there any products that have specific labelling requirements under consumer protection law? | The Legal Metrology Act may apply to certain packaged accessories | Legal | 🟡 Medium | Open |
| LC-12 | What is the contact address / registered office to be shown in the website footer and legal pages? | Required by IT (Intermediary Guidelines) Rules and consumer protection norms | Business Owner | 🔴 Critical | Open |
| LC-13 | Are there any existing or planned trademark registrations for "NAVA CREATIONS"? | Affects brand protection and domain selection | Business Owner + Legal | 🟡 Medium | Open |

---

## 5. Technical Setup

| # | Question | Why It Matters | Who Answers | Priority | Status |
|---|----------|---------------|-------------|----------|--------|
| TS-01 | What is the preferred technology stack? (e.g., Shopify, WooCommerce, custom Next.js + headless CMS, etc.) | Foundational architecture decision; affects all subsequent development | Business Owner + Tech Team | 🔴 Critical | Open |
| TS-02 | Has a payment gateway been selected: Razorpay or Cashfree? | Different APIs, COD capabilities, and pricing; must decide before checkout development | Business Owner | 🔴 Critical | Open |
| TS-03 | Has a logistics / shipping partner been selected: Shiprocket, Delhivery, or other? | Affects API integration, COD workflow, and checkout rate calculation | Business Owner | 🔴 Critical | Open |
| TS-04 | Has a WhatsApp Business API provider (BSP) been selected? (e.g., Interakt, Wati, AiSensy) | Required for notification design and API integration | Business Owner | 🟠 High | Open |
| TS-05 | Is there a preferred hosting provider? (e.g., AWS, Vercel, DigitalOcean, Cloudflare) | Affects infrastructure architecture and cost | Tech Team | 🟠 High | Open |
| TS-06 | Is there a preferred database? (e.g., PostgreSQL, MySQL, MongoDB) | Foundational technical decision | Tech Team | 🟠 High | Open |
| TS-07 | Will a CDN be used for static assets and images? (e.g., Cloudflare, AWS CloudFront, Bunny.net) | Required for performance targets (LCP ≤ 2.5s) in India | Tech Team | 🟠 High | Open |
| TS-08 | Does the business owner have access to a laptop/desktop for admin dashboard use, or will it be mobile-only? | Affects admin dashboard responsive design priority | Business Owner | 🟡 Medium | Open |
| TS-09 | Will the owner manage the website independently post-launch, or is there ongoing developer support? | Affects CMS complexity and admin dashboard design | Business Owner | 🟡 Medium | Open |
| TS-10 | Is there an existing Google Analytics or Search Console account to integrate? | Affects analytics setup | Business Owner | 🟡 Medium | Open |
| TS-11 | Is there an existing Instagram Business account linked to a Meta Business Manager? | Required for Meta Pixel integration (retargeting ads) and WhatsApp API | Business Owner | 🟠 High | Open |
| TS-12 | What is the email service provider for transactional emails? (e.g., SendGrid, Amazon SES, Mailchimp Transactional) | Required for order confirmation, invoice, and notification emails | Tech Team | 🟠 High | Open |
| TS-13 | What is the target launch date? | Drives project planning, sprint structure, and scope decisions | Business Owner | 🔴 Critical | Open |
| TS-14 | What is the total project budget (approx. range)? | Affects tech stack selection and feature prioritisation | Business Owner | 🔴 Critical | Open |
| TS-15 | Is there a staging / test environment requirement? | Required for QA, UAT, and security testing before launch | Tech Team | 🟠 High | Open |

---

## 6. Customer Data

| # | Question | Why It Matters | Who Answers | Priority | Status |
|---|----------|---------------|-------------|----------|--------|
| CD-01 | Does the business have any existing customer data (names, phone numbers, emails) from past WhatsApp/Instagram orders? | Potential for migrating to CRM; requires DPDP-compliant consent before use | Business Owner | 🟠 High | Open |
| CD-02 | If existing customer data exists, was it collected with consent for email/SMS marketing? | DPDP Act and TRAI regulations require consent for marketing communications | Business Owner + Legal | 🔴 Critical | Open |
| CD-03 | What customer data should be collected at account registration? (name, email, phone, DOB, anniversary?) | Affects registration form design and CRM schema | Business Owner | 🟡 Medium | Open |
| CD-04 | Should the website collect opt-in for WhatsApp marketing vs transactional messages? | TRAI and Meta WhatsApp policies distinguish marketing from transactional messages; consent required | Legal + Tech | 🔴 Critical | Open |
| CD-05 | Is there a plan for email marketing? If so, what platform? (e.g., Mailchimp, Klaviyo, MoEngage) | Affects customer data schema and integration architecture | Business Owner | 🟡 Medium | Open |
| CD-06 | How long should customer data be retained? | DPDP Act requires a defined retention policy | Legal | 🟠 High | Open |
| CD-07 | Should customers be able to request deletion of their account and data? (Right to Erasure) | Required under DPDP Act 2023 | Legal + Tech | 🔴 Critical | Open |
| CD-08 | Will customer purchase history be used for personalised product recommendations? | Requires explicit consent under DPDP if any profiling is done | Legal + Tech | 🟡 Medium | Open |

---

## 7. Content

| # | Question | Why It Matters | Who Answers | Priority | Status |
|---|----------|---------------|-------------|----------|--------|
| CO-01 | Are professional product photos available for all products? | Product photography is the #1 conversion factor for accessories; poor photos = low sales | Business Owner | 🔴 Critical | Open |
| CO-02 | Are photos available in high resolution (≥ 1200 px wide) suitable for web use? | Low-resolution photos cannot be used at zoom level and reduce perceived quality | Business Owner | 🔴 Critical | Open |
| CO-03 | Are there on-model / on-wrist / on-hand photos, or only flat-lay product shots? | On-wrist photos are significantly higher converting for bangles; needed for PDPs | Business Owner | 🟠 High | Open |
| CO-04 | Is there video content (Reels, demo videos) for products that can be embedded on PDPs? | Video dramatically increases time-on-page and conversion for accessories | Business Owner | 🟠 High | Open |
| CO-05 | Does the business have an About Us story / founder note written or in notes form? | Required for About page; a personal founder story builds trust for small brands | Business Owner | 🟠 High | Open |
| CO-06 | Have Shipping Policy, Return Policy, Privacy Policy, and Terms of Service been drafted? | Required for website launch; absence creates legal and trust risk | Business Owner + Legal | 🔴 Critical | Open |
| CO-07 | Is there a size guide / measuring instruction document or image? | Reduces size-related returns and pre-purchase questions; critical for bangles | Business Owner | 🔴 Critical | Open |
| CO-08 | Are there customer testimonials or review quotes (with permission) that can be used on the website? | Social proof is critical for conversion; must be real and permission-granted | Business Owner | 🟠 High | Open |
| CO-09 | Is there an FAQ document addressing common customer questions? | Reduces pre-purchase WhatsApp queries; can be a website section | Business Owner | 🟡 Medium | Open |
| CO-10 | Will the website have a blog or content section for SEO? If so, who writes it? | Long-form content drives organic search traffic; needs content owner | Business Owner + Content Writer | 🟢 Low | Open |
| CO-11 | Will product descriptions be written by the owner or by a copywriter? | Quality product descriptions affect both SEO and conversion | Business Owner + Copywriter | 🟠 High | Open |
| CO-12 | Should website content be in English only, or also Kannada / Hindi? | Multilingual affects development effort; likely post-MVP | Business Owner | 🟢 Low | Open |
| CO-13 | Are there any lifestyle / occasion photos (wedding, festival) in which products appear, that can be used on the website? | Occasion-context imagery significantly increases relatability and conversion | Business Owner | 🟡 Medium | Open |

---

## 8. Marketing

| # | Question | Why It Matters | Who Answers | Priority | Status |
|---|----------|---------------|-------------|----------|--------|
| MK-01 | What is the marketing budget for the first 6 months post-launch? | Determines whether paid ads (Meta/Google) are viable alongside organic SEO | Business Owner | 🟠 High | Open |
| MK-02 | Will Meta (Instagram/Facebook) ads be run to drive traffic to the website? | Affects Meta Pixel setup, landing page design, and tracking configuration | Business Owner | 🟠 High | Open |
| MK-03 | Will Google Ads (Shopping / Search) be run? | Affects Google Merchant Centre setup and product feed requirements | Business Owner | 🟡 Medium | Open |
| MK-04 | Is there a plan to migrate the Instagram audience to the website (e.g., link in bio, Stories CTA)? | Critical for initial traffic; strategy should be defined before launch | Business Owner | 🟠 High | Open |
| MK-05 | Is there an existing WhatsApp broadcast list of customers? Can they be communicated to about the website launch? | An existing list of warm contacts is a significant launch asset | Business Owner | 🟠 High | Open |
| MK-06 | Will influencer collaborations or reviews be used to drive initial website traffic? | Common and effective for Indian accessories D2C brands | Business Owner | 🟡 Medium | Open |
| MK-07 | What is the plan for collecting and displaying customer reviews post-launch? | Reviews are essential for conversion; plan must be in place from Day 1 | Business Owner | 🟠 High | Open |
| MK-08 | Will a referral programme ("share with a friend, get X % off") be offered at launch or post-launch? | Effective for word-of-mouth driven brands; affects discount/coupon infrastructure | Business Owner | 🟢 Low | Open |
| MK-09 | Is there a planned launch offer to incentivise first website orders? (e.g., launch discount code) | A launch offer drives the critical first cohort of orders and reviews | Business Owner | 🟠 High | Open |
| MK-10 | What is the SEO target keyword focus? (e.g., "handmade bangles Bengaluru", "bridal bangles online India") | Affects meta titles, descriptions, URL slugs, and content structure | Business Owner + SEO | 🟡 Medium | Open |
| MK-11 | Should the website support Google Shopping product listings? | Requires structured product data (schema.org) and Google Merchant Centre account | Tech Team + Business Owner | 🟡 Medium | Open |
| MK-12 | Will a loyalty or rewards programme be offered post-launch? | Affects CRM and account feature design; decide early to avoid rework | Business Owner | 🟢 Low | Open |

---

## 9. Resolved Questions

> [!NOTE]
> Move items here as answers are obtained. Record the answer, date resolved, and source.

| # (Original) | Question | Answer | Date Resolved | Source |
|--------------|----------|--------|---------------|--------|
| — | — | — | — | — |

---

*Document prepared as part of NAVA CREATIONS Phase 0 — Discovery & Definition.*
*Owner: Business Analyst / Product Manager.*
*Review cadence: Update after every stakeholder session. Target: all Critical questions resolved before tech stack selection.*
