# NAVA CREATIONS — Website Sitemap & Information Architecture

> [!NOTE]
> Phase 0 UX document. All page names, slugs, and structures are proposals pending business owner sign-off. Mark any confirmed decisions with ✅ and open questions with ❓.

---

## 1. Navigation Structure

### 1.1 Primary Navigation (Mobile-First, Max 6 Items)

```
[ Logo ]  [ Search 🔍 ]  [ ♡ Wishlist ]  [ 🛒 Cart ]  [ ☰ Menu ]
```

| # | Nav Label | Trigger | Destination |
|---|-----------|---------|-------------|
| 1 | **Shop** | Tap → Drawer/Mega-menu | /shop |
| 2 | **Occasions** | Tap → Drawer | /occasions |
| 3 | **Custom Orders** | Direct link | /custom-orders |
| 4 | **Return Gifts** | Direct link | /return-gifts |
| 5 | **Our Story** | Direct link | /our-story |
| 6 | **Journal** | Direct link | /journal |

**Utility Nav (icon strip on mobile, top bar on desktop):**
- 🔍 Search → /search
- ♡ Wishlist → /account/wishlist
- 📦 Track Order → /track-order
- 👤 Account → /account (or /login if logged out)
- 🛒 Cart → /cart

---

### 1.2 Shop Mega-Menu / Drawer

```
SHOP
├── All Products            /shop
├── ── BY CATEGORY ──
├── Handmade Bangles        /shop/handmade-bangles
├── Bridal Bangles          /shop/bridal-bangles
├── Kundan Collection       /shop/kundan-collection
├── Festival Collection     /shop/festival-collection
├── Hair Accessories        /shop/hair-accessories
└── Other Accessories       /shop/other-accessories
```

### 1.3 Occasions Drawer

```
SHOP BY OCCASION
├── Bridal & Wedding        /occasions/bridal
├── Festivals               /occasions/festivals
├── Everyday Wear           /occasions/everyday
└── Gifting                 /occasions/gifting
```

---

## 2. Complete Public Page Inventory

### 2.1 Homepage & Core Discovery

| Page Name | URL Slug | Purpose | Primary User Action | Key Content Elements | Internal Links To |
|-----------|----------|---------|--------------------|-----------------------|-------------------|
| **Homepage** | `/` | Brand first impression, discovery hub | Browse categories, click CTA | Hero banner, Featured collections, Shop by occasion strip, Bestsellers carousel, Custom Orders CTA, Instagram feed, Trust badges, Newsletter signup | /shop, /occasions/*, /custom-orders, /return-gifts, /our-story |
| **Search Results** | `/search?q={query}` | Surface relevant products from query | Refine filters, click product | Search bar (sticky), Filter panel, Product grid, No-results state with suggestions | /shop, /product/* |

---

### 2.2 Shop & Catalogue Pages

| Page Name | URL Slug | Purpose | Primary User Action | Key Content Elements | Internal Links To |
|-----------|----------|---------|--------------------|-----------------------|-------------------|
| **Shop (All Products)** | `/shop` | Master catalogue | Filter & browse | Filter sidebar (category, occasion, price, material, size, colour), Sort dropdown, Product grid, Pagination / infinite scroll | /product/*, /shop/* |
| **Handmade Bangles** | `/shop/handmade-bangles` | Category page | Browse, add to wishlist / cart | Category hero, Filter panel, Product grid, SEO intro copy | /product/*, /occasions/everyday |
| **Bridal Bangles** | `/shop/bridal-bangles` | Category page | Browse, enquire custom | Category hero, Bridal guide CTA, Product grid, Custom Enquiry banner | /product/*, /custom-orders, /size-guide |
| **Kundan Collection** | `/shop/kundan-collection` | Category page | Browse, buy | Collection story, Product grid, Styling tips | /product/*, /occasions/festivals |
| **Festival Collection** | `/shop/festival-collection` | Seasonal category | Browse, bulk enquire | Seasonal banner, Countdown timer (if active sale), Product grid, Bulk Order CTA | /product/*, /return-gifts |
| **Hair Accessories** | `/shop/hair-accessories` | Category page | Browse, buy | Category hero, Product grid | /product/* |
| **Other Accessories** | `/shop/other-accessories` | Catch-all category | Browse, buy | Product grid | /product/* |

---

### 2.3 Occasion Pages

| Page Name | URL Slug | Purpose | Primary User Action | Key Content Elements | Internal Links To |
|-----------|----------|---------|--------------------|-----------------------|-------------------|
| **Bridal & Wedding** | `/occasions/bridal` | Occasion landing | Browse, start custom enquiry | Editorial hero image, Curated product sets, Custom Order CTA, Testimonials, Size guide link | /shop/bridal-bangles, /custom-orders, /size-guide |
| **Festivals** | `/occasions/festivals` | Occasion landing | Browse, gifting | Festival-themed banner, Curated collections, Return Gifts CTA | /shop/festival-collection, /return-gifts |
| **Everyday Wear** | `/occasions/everyday` | Occasion landing | Quick browse & buy | Lifestyle imagery, Best-value picks, Mix-and-match guide | /shop/handmade-bangles, /shop/hair-accessories |
| **Gifting** | `/occasions/gifting` | Occasion landing | Browse gift sets, enquire | Gift set curation, Packaging preview, Price-range filter, Bulk enquiry CTA | /return-gifts, /shop/*, /cart |

---

### 2.4 Product Detail Page

| Page Name | URL Slug | Purpose | Primary User Action | Key Content Elements | Internal Links To |
|-----------|----------|---------|--------------------|-----------------------|-------------------|
| **Product Detail** | `/product/{slug}` | Conversion page | Add to cart / wishlist | Image gallery (5+ images + video), Product name, Price (MRP + offer price), Variant selector (size, colour, material), Stock status, Add to Cart + Buy Now CTAs, Product description, Craftsmanship notes, Size guide modal/link, Care instructions, Shipping & returns snippet, Customer reviews, Related products carousel, Recently viewed | /cart, /size-guide, /shop/{category}, /account/wishlist |

---

### 2.5 Specialist Enquiry Pages

| Page Name | URL Slug | Purpose | Primary User Action | Key Content Elements | Internal Links To |
|-----------|----------|---------|--------------------|-----------------------|-------------------|
| **Custom Bridal Enquiry** | `/custom-orders` | Lead capture for custom work | Submit enquiry form | Hero (bridal lifestyle), How-it-works steps (3-5 steps), Portfolio gallery, Enquiry form (name, mobile, occasion date, design description, budget range, images upload), WhatsApp CTA, FAQ accordion, Testimonials | /occasions/bridal, /contact |
| **Bulk / Return Gifts Enquiry** | `/return-gifts` | Lead capture for bulk orders | Submit bulk enquiry | USPs (custom packaging, wholesale pricing, guaranteed qty), Minimum order info ❓, Sample request option, Enquiry form (name, org/event name, qty, occasion, delivery date, budget), WhatsApp CTA, Catalogue download ❓ | /shop/festival-collection, /contact |
| **Size Guide** | `/size-guide` | Remove purchase barrier | Measure wrist size | Illustrated measurement guide, Size chart table (Indian bangle sizes S/M/L or numbers), Downloadable PDF ❓ | /product/* |

---

### 2.6 Shopping & Checkout Flow

| Page Name | URL Slug | Purpose | Primary User Action | Key Content Elements | Internal Links To |
|-----------|----------|---------|--------------------|-----------------------|-------------------|
| **Wishlist** | `/account/wishlist` | Save for later | Move to cart, share | Saved product list, Remove button, Add to Cart CTA, Share wishlist link | /cart, /product/* |
| **Cart** | `/cart` | Pre-checkout review | Proceed to checkout | Product line items (image, name, size, qty stepper, unit price, subtotal), Remove item, Coupon code field, Order summary (subtotal, delivery estimate, discount, total), Proceed to Checkout CTA, Continue Shopping link, Trust badges (secure payment, easy returns) | /checkout, /shop |
| **Checkout — Step 1: Address** | `/checkout/address` | Collect delivery address | Enter / select address | Logged-in: saved addresses + Add New; Guest: full address form; Login nudge for guests; Pincode serviceability check | /checkout/payment |
| **Checkout — Step 2: Payment** | `/checkout/payment` | Accept payment | Complete payment | Order summary sidebar, Payment method tabs (UPI, Cards, Net Banking, COD), Razorpay/Cashfree widget, Apply coupon (if not done), Place Order CTA | /checkout/confirmation, /checkout/address |
| **Order Confirmation** | `/checkout/confirmation` | Reassure & engage | View order, continue shopping | Order number, estimated delivery, items summary, delivery address, payment method, Download invoice link, Track Order CTA, Social share prompt, Recommended products | /track-order, /shop |

---

### 2.7 Account & Orders

| Page Name | URL Slug | Purpose | Primary User Action | Key Content Elements | Internal Links To |
|-----------|----------|---------|--------------------|-----------------------|-------------------|
| **Customer Registration** | `/register` | Account creation | Sign up | Email/mobile, Password, OTP verification, T&C checkbox | /account, /login |
| **Customer Login** | `/login` | Authentication | Log in | Email/mobile + password, OTP login option, Forgot password, Continue as Guest, Social login (Google) ❓ | /account, /register |
| **Customer Account** | `/account` | Account hub | Manage profile & orders | Profile card, Quick links (Orders, Wishlist, Addresses, Payment Methods), Recent order preview | /account/orders, /account/wishlist, /account/addresses |
| **Order History** | `/account/orders` | Browse past orders | View, track, reorder | Order list (order ID, date, status badge, total, thumbnail), Pagination | /account/orders/{id} |
| **Order Detail** | `/account/orders/{orderId}` | Single order info | Track, return/exchange, download invoice | Order timeline (Placed → Processing → Shipped → Delivered), Items, Addresses, Payment summary, Return/Exchange CTA, Download Invoice, Reorder CTA | /track-order, /contact |
| **Order Tracking** | `/track-order` | Public tracking | Enter order ID / AWB | Order ID + email/mobile field, Courier integration widget (Shiprocket/Delhivery), Timeline view | /contact |
| **Saved Addresses** | `/account/addresses` | Manage addresses | Add, edit, delete | Address cards, Default address toggle, Add New Address form | /checkout/address |

---

### 2.8 Brand & Content Pages

| Page Name | URL Slug | Purpose | Primary User Action | Key Content Elements | Internal Links To |
|-----------|----------|---------|--------------------|-----------------------|-------------------|
| **About NAVA** | `/our-story` | Brand trust & identity | Read, engage | Founder story, Brand values, Mission, Artisan/craft story ❓, Team photos ❓, Instagram embed | /craftsmanship, /contact, /journal |
| **Craftsmanship / Story** | `/craftsmanship` | Deepen trust, justify premium | Read, share | Process walkthrough (materials → making → finishing), Image-rich layout, Video ❓ | /our-story, /shop |
| **Journal / Blog Listing** | `/journal` | SEO, brand authority | Read article | Blog card grid (image, title, category, date), Category filter, Search | /journal/{slug} |
| **Blog / Journal Article** | `/journal/{slug}` | Long-form content, SEO | Read, share, shop | Article content, Author, Date, Tags, Share buttons, Related products CTA, Related articles | /shop/*, /journal |

---

### 2.9 Support & Policy Pages

| Page Name | URL Slug | Purpose | Primary User Action | Key Content Elements | Internal Links To |
|-----------|----------|---------|--------------------|-----------------------|-------------------|
| **Contact & Support** | `/contact` | Customer help | Submit query, WhatsApp | Contact form (name, email, mobile, order ID, query type, message), WhatsApp button, Business email, Business hours ❓, Map/location ❓ | /faqs, /track-order |
| **FAQs** | `/faqs` | Deflect support tickets | Read answers | Accordion by category (Orders, Shipping, Returns, Payments, Custom Orders, Sizing), Search within FAQs | /contact, /shipping-policy, /returns-policy |
| **Shipping Policy** | `/shipping-policy` | Set delivery expectations | Read | Shipping timelines, Courier partners, Free shipping threshold ❓, COD charges ❓, PAN India coverage ❓, International ❓ | /faqs, /contact |
| **Returns & Exchange Policy** | `/returns-policy` | Build trust | Read | Eligibility window ❓, Conditions, Process steps, Exclusions (custom items), Contact for returns | /contact, /faqs |
| **Cancellation Policy** | `/cancellation-policy` | Legal clarity | Read | Cancellation window, Process, Refund timeline | /contact |
| **Privacy Policy** | `/privacy-policy` | Legal compliance | Read | Data collected, usage, sharing, cookies, rights (DPDP Act 2023) | /terms |
| **Terms & Conditions** | `/terms` | Legal compliance | Read | Terms of use, Sale conditions, Dispute resolution | /privacy-policy |
| **Grievance Officer** | `/grievance-officer` | Legal (Consumer Protection Act) | Read, contact | Officer name ❓, designation, email, postal address, response timeline | /contact |

---

## 3. Admin Page Inventory

> [!IMPORTANT]
> Admin pages live under `/admin/*` and are protected by role-based access control. All admin routes must redirect unauthenticated users to `/admin/login`.

| Page Name | URL Slug | Description |
|-----------|----------|-------------|
| **Admin Login** | `/admin/login` | Secure admin authentication (2FA recommended) |
| **Dashboard** | `/admin` | KPI overview: today's orders, revenue, low-stock alerts, pending custom enquiries |
| **Products List** | `/admin/products` | Searchable, filterable product table with bulk actions |
| **Product Create / Edit** | `/admin/products/new` & `/admin/products/{id}/edit` | Full product form: images, variants, SEO, pricing, stock |
| **Inventory** | `/admin/inventory` | Stock level management, low-stock alerts, SKU-level adjustments |
| **Orders List** | `/admin/orders` | All orders with filter by status, date, payment method |
| **Order Detail** | `/admin/orders/{id}` | Full order view: items, customer, payment, fulfilment actions, notes, timeline |
| **Customers List** | `/admin/customers` | Customer directory, search, filter by segment |
| **Customer Detail** | `/admin/customers/{id}` | Customer profile, order history, notes |
| **Custom Enquiries** | `/admin/enquiries` | Bridal & bulk enquiry management, status pipeline |
| **Enquiry Detail** | `/admin/enquiries/{id}` | Full enquiry view, notes, quotation, status update |
| **Promotions / Coupons** | `/admin/promotions` | Coupon creation, discount rules, campaign management |
| **Content / Banners** | `/admin/content` | Homepage banners, promotional strips, announcement bar |
| **Blog Management** | `/admin/blog` | Create, edit, publish, schedule blog posts |
| **Blog Post Editor** | `/admin/blog/new` & `/admin/blog/{id}/edit` | Rich-text editor with SEO fields |
| **Reports / Analytics** | `/admin/reports` | Sales, revenue, top products, customer acquisition, coupon usage |
| **Admin User Management** | `/admin/users` | Invite, role-assign, deactivate admin users |
| **Settings** | `/admin/settings` | Store info, payment gateway config, shipping zones, notification templates |
| **Audit Log** | `/admin/audit-log` | Immutable log of all admin actions with actor, timestamp, change delta |

---

## 4. URL Strategy

### 4.1 Slug Conventions

| Rule | Example |
|------|---------|
| Lowercase, hyphen-separated | `/shop/handmade-bangles` |
| No trailing slash (301 redirect trailing slash → canonical) | `/shop/bridal-bangles` ✅ |
| Products: `/product/{descriptive-slug}` | `/product/gold-kundan-bridal-bangle-set` |
| Blog: `/journal/{yyyy-mm-dd-title-slug}` or `/journal/{title-slug}` | `/journal/how-to-measure-bangle-size` |
| No query strings in canonical URLs for category pages | Filters via URL params but canonical = base URL |
| Admin: `/admin/*` prefix | `/admin/orders` |

### 4.2 Canonical URL Rules

| Page Type | Canonical Rule |
|-----------|---------------|
| Category pages with active filters | Canonical = `/shop/{category}` (filterless base) |
| Paginated pages | Canonical = page 1 URL (`/shop/bridal-bangles`) |
| Search results | `<meta name="robots" content="noindex">`, no canonical |
| Product pages | Self-canonical |
| All policy/legal pages | Self-canonical |
| Duplicate occasion ↔ category overlap | Occasion pages canonical to themselves |

### 4.3 Breadcrumb Patterns

| Page Type | Breadcrumb |
|-----------|-----------|
| Category | Home > Shop > {Category Name} |
| Product | Home > Shop > {Category} > {Product Name} |
| Occasion | Home > Occasions > {Occasion Name} |
| Blog Article | Home > Journal > {Article Title} |
| Account | Home > My Account > {Section} |
| Policy | Home > {Policy Name} |
| Admin | Dashboard > {Section} > {Page} |

Breadcrumbs must be rendered as `<nav aria-label="breadcrumb">` with `BreadcrumbList` schema.org JSON-LD.

### 4.4 Robots.txt Directives

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /checkout/
Disallow: /account/
Disallow: /api/
Disallow: /search?*
Disallow: /cart

Sitemap: https://navacreations.in/sitemap.xml
```

> [!NOTE]
> Replace `navacreations.in` with the confirmed production domain once registered. ❓

---

## 5. Sitemap XML Structure

### 5.1 Sitemap Index

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://navacreations.in/sitemap-core.xml</loc>
    <lastmod>2024-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://navacreations.in/sitemap-products.xml</loc>
    <lastmod>2024-01-01</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://navacreations.in/sitemap-journal.xml</loc>
    <lastmod>2024-01-01</lastmod>
  </sitemap>
</sitemapindex>
```

### 5.2 Core Sitemap (`sitemap-core.xml`)

| URL | Priority | changefreq |
|-----|----------|------------|
| `/` | 1.0 | daily |
| `/shop` | 0.9 | daily |
| `/shop/handmade-bangles` | 0.9 | weekly |
| `/shop/bridal-bangles` | 0.9 | weekly |
| `/shop/kundan-collection` | 0.9 | weekly |
| `/shop/festival-collection` | 0.9 | weekly |
| `/shop/hair-accessories` | 0.8 | weekly |
| `/shop/other-accessories` | 0.7 | weekly |
| `/occasions/bridal` | 0.8 | monthly |
| `/occasions/festivals` | 0.8 | monthly |
| `/occasions/everyday` | 0.7 | monthly |
| `/occasions/gifting` | 0.7 | monthly |
| `/custom-orders` | 0.9 | monthly |
| `/return-gifts` | 0.8 | monthly |
| `/our-story` | 0.6 | monthly |
| `/craftsmanship` | 0.6 | monthly |
| `/journal` | 0.7 | daily |
| `/size-guide` | 0.6 | monthly |
| `/faqs` | 0.6 | monthly |
| `/contact` | 0.6 | monthly |
| `/shipping-policy` | 0.4 | monthly |
| `/returns-policy` | 0.4 | monthly |
| `/cancellation-policy` | 0.4 | monthly |
| `/privacy-policy` | 0.3 | yearly |
| `/terms` | 0.3 | yearly |
| `/grievance-officer` | 0.3 | yearly |

### 5.3 Products Sitemap (`sitemap-products.xml`)

- Auto-generated from database; every published product at `/product/{slug}`
- Priority: `0.8`
- changefreq: `weekly`
- Include `<image:image>` tags per product (product thumbnail + alt text)
- Exclude draft/archived products

### 5.4 Journal Sitemap (`sitemap-journal.xml`)

- Auto-generated from CMS; every published blog post at `/journal/{slug}`
- Priority: `0.6`
- changefreq: `monthly`
- Include `<image:image>` for featured image

---

## 6. Page Hierarchy Tree

```
navacreations.in/
│
├── (Homepage)
│
├── shop/
│   ├── (All Products)
│   ├── handmade-bangles/
│   ├── bridal-bangles/
│   ├── kundan-collection/
│   ├── festival-collection/
│   ├── hair-accessories/
│   └── other-accessories/
│
├── product/{slug}/
│
├── occasions/
│   ├── bridal/
│   ├── festivals/
│   ├── everyday/
│   └── gifting/
│
├── custom-orders/
├── return-gifts/
├── size-guide/
├── search/
│
├── cart/
├── checkout/
│   ├── address/
│   ├── payment/
│   └── confirmation/
│
├── account/
│   ├── (Account Hub)
│   ├── orders/
│   │   └── {orderId}/
│   ├── wishlist/
│   └── addresses/
│
├── login/
├── register/
├── track-order/
│
├── our-story/
├── craftsmanship/
│
├── journal/
│   └── {slug}/
│
├── contact/
├── faqs/
├── shipping-policy/
├── returns-policy/
├── cancellation-policy/
├── privacy-policy/
├── terms/
└── grievance-officer/
│
└── admin/
    ├── (Dashboard)
    ├── products/
    │   ├── new/
    │   └── {id}/edit/
    ├── inventory/
    ├── orders/
    │   └── {id}/
    ├── customers/
    │   └── {id}/
    ├── enquiries/
    │   └── {id}/
    ├── promotions/
    ├── content/
    ├── blog/
    │   ├── new/
    │   └── {id}/edit/
    ├── reports/
    ├── users/
    ├── settings/
    └── audit-log/
```

---

*Document version: 0.1 — Phase 0 — NAVA CREATIONS*
*Author: UX Specialist — Antigravity Swarm*
*Status: Draft — Pending business owner review*
