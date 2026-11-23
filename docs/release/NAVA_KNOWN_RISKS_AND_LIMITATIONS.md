# NAVA CREATIONS — KNOWN RISKS & OPERATIONAL LIMITATIONS
**Document Identifier:** `NAVA-RISK-REGISTER-01`  
**Revision:** 1.0.0-rc1  
**Scope:** Production Operations & Architecture  

---

## 1. FINANCIAL & PAYMENT RISKS

### 1.1 Manual Bank Ledger Reconciliation Bottleneck
- **Description:** NAVA CREATIONS eliminates all intermediary gateway fees (₹0 MDR) by using direct BharatPe UPI QR intent generation. However, verifying payments requires the store owner or atelier manager to manually match customer-reported 12-digit UTRs against the bank current account statement.
- **Risk:** High order volume during festive or wedding seasons could create a backlog in order verification, delaying order packing.
- **Mitigation:**
  - Orders remain safely in `AWAITING_PAYMENT_VERIFICATION` without holding inventory indefinitely (governed by the 15-minute reservation TTL until customer submits UTR, after which inventory is protected).
  - Admin dashboard provides quick filter `status=AWAITING_VERIFICATION` and direct search by UTR.
  - Partial unique index physically prevents the owner from accidentally verifying the same bank credit twice.

### 1.2 Customer Typo or Fake UTR Submissions
- **Description:** A customer might enter a mistyped or fabricated 12-digit UTR on the order tracking page.
- **Risk:** An inattentive manager could mark an uncredited order as `VERIFIED`.
- **Mitigation:**
  - The system is architected as **fail-closed**: orders NEVER advance to `PAYMENT_CONFIRMED` automatically.
  - The admin UI requires the manager to confirm the exact credited amount in paise before confirming verification.
  - If a customer realizes they made a typo, they can re-submit the correct UTR as long as the payment is not yet verified.

### 1.3 Cash on Delivery (COD) Return-to-Origin (RTO) Logistics Costs
- **Description:** Customers ordering via COD may refuse delivery or become unreachable, incurring 2x courier shipping charges (forward + return).
- **Risk:** Margin erosion on handcrafted bangle sets.
- **Mitigation:**
  - COD is capped by policy (recommended maximum: ₹3,000–₹5,000).
  - Atelier team performs WhatsApp / phone verification prior to generating the shipping label.
  - Pre-dispatch cancellation is supported directly in the admin panel to release stock before dispatch.

---

## 2. INVENTORY & CONCURRENCY RISKS

### 2.1 Physical Studio Sales vs Online Inventory Sync
- **Description:** NAVA operates an artisanal boutique/studio in Bengaluru alongside the online storefront.
- **Risk:** An in-person customer could purchase the last piece of a bangle size in the studio while an online customer completes checkout.
- **Mitigation:**
  - The admin inventory management interface allows real-time stock adjustments (`/admin/inventory`) from any mobile browser.
  - The database CHECK constraint `inventory_items_non_negative_stock` prevents software-level negative numbers, but studio staff must log offline sales immediately.

### 2.2 Uncompleted Checkouts & Reservation Expiry
- **Description:** Customers adding items to cart and proceeding to checkout create a 15-minute stock hold.
- **Risk:** Abandoned checkouts could temporarily prevent other customers from buying limited-stock items until the hold expires.
- **Mitigation:**
  - The reservation TTL is strictly set to 15 minutes.
  - The scheduled cron endpoint (`/api/cron/release-reservations`) automatically releases holds every 10–15 minutes, returning stock to `available_qty`.
  - Orders where the customer has submitted a UTR are shielded from premature cancellation.

---

## 3. INFRASTRUCTURE & HOSTING RISKS (FREE TIER REALITY CHECK)

### 3.1 Neon / Supabase Serverless Postgres Sleep & Cold Starts
- **Description:** Free-tier managed PostgreSQL instances (such as Neon) scale compute to zero after 5 minutes of inactivity.
- **Risk:** The first customer visiting the storefront after an idle period may experience a 500ms–1.5s delay while the database instance wakes up.
- **Mitigation:**
  - The Next.js frontend employs static page generation (SSG) for high-traffic routes (`/`, `/shop`, `/categories/[slug]`), serving cached HTML immediately from the CDN.
  - A scheduled keep-alive ping (e.g. from the reservation cron job every 10 minutes) keeps the database instance warm during business hours.

### 3.2 Vercel Hobby Plan Terms & Serverless Concurrency
- **Description:** Vercel Hobby plans are designed for non-commercial projects and have a 10-second serverless execution timeout.
- **Risk:** Transitioning to high-volume commercial production requires moving to Vercel Pro ($20/mo) or deploying to a self-hosted Linux VPS (e.g., Oracle Cloud Always Free ARM VM).
- **Mitigation:**
  - The Next.js application is completely portable and standard. It can be containerized (`next start` / Docker) and hosted on any VPS or container host with zero vendor lock-in.

### 3.3 Distributed Rate Limiting without Redis
- **Description:** In a multi-instance serverless deployment (such as Vercel Edge/Serverless), the built-in in-memory rate limiter operates per-lambda-instance.
- **Risk:** A distributed brute-force attacker could distribute requests across multiple serverless instances, bypassing the single-instance counter.
- **Mitigation:**
  - Configure free Upstash Redis credentials (`UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`). The application code automatically detects Redis and activates distributed sliding-window rate limiting.

---

## 4. SECURITY & REGULATORY RISKS

### 4.1 Guest Token Invalidation on Secret Rotation
- **Description:** Guest access tokens for tracking orders are HMAC SHA-256 signatures derived from `ADMIN_AUTH_SECRET`.
- **Risk:** If `ADMIN_AUTH_SECRET` is rotated in production, existing guest order tracking links sent to customers via email or WhatsApp will fail verification.
- **Mitigation:**
  - Generate a secure, permanent 64-character random string during initial production setup and store it in a secure password vault.
  - Store managers can always look up orders directly in the authenticated admin portal regardless of guest tokens.

### 4.2 Digital Personal Data Protection (DPDP) Act 2023 Compliance
- **Description:** Indian data protection regulations mandate that customer personal data (phone numbers, addresses) must be protected against unauthorized access and enumeration.
- **Risk:** Sequential order numbers could be probed by attackers to enumerate customer details.
- **Mitigation:**
  - Order endpoint `/api/orders/[orderNumber]` requires either an authentic admin session or an HMAC guest access token.
  - Unauthenticated requests return uniform `404 Not Found` (never 401 or distinct error codes), preventing enumeration attacks.

---

## 5. SUMMARY OF RISK CLASSIFICATIONS

| Risk Item | Likelihood | Impact | Classification | Mitigation Status |
| :--- | :---: | :---: | :---: | :--- |
| Bank Verification Delay | Medium | Low | **VERIFIED** | Admin UTR filter and manual review workflow |
| Inventory Overselling | Low | High | **VERIFIED** | PostgreSQL CHECK constraint + atomic conditional decrement |
| Double Bank Credit | Low | Critical | **VERIFIED** | Partial unique index `payments_claimed_utr_verified_unique` |
| Serverless Postgres Cold Start | High | Low | **NOT VERIFIED** | Scheduled 10-min keep-alive ping |
| Multi-Instance Rate Limiting | Low | Medium | **NOT VERIFIED** | Requires Upstash Redis free tier setup |
| Live BharatPe VPA Switch | Medium | High | **REQUIRES OWNER APPROVAL** | Owner must confirm active current account VPA |
