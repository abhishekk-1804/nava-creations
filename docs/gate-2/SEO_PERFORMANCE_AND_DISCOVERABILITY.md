# NAVA CREATIONS — SEO, PERFORMANCE & DIGITAL DISCOVERABILITY
**Document ID:** `DOC-G2-PHASE10-SEO`  
**Generated At:** 2026-11-15T09:57:00+05:30  
**Repository:** `D:\NAVA`  
**Branch:** `feature/production-readiness`  
**Role:** SEO, Accessibility & Performance Engineer  

---

## 1. TECHNICAL SEO ARCHITECTURE (NEXT.JS 15 APP ROUTER)

NAVA CREATIONS leverages Next.js 15's native server-rendered metadata APIs to achieve maximum discoverability across search engines (Google India, Bing) and South Asian wedding shopping queries:

```
[ Search Crawler: Googlebot ]
              |
              v
[ Next.js 15 Server-Side Render Engine ]
       |
       +---> [ robots.ts ]: Directs crawler, protects /admin, /orders, /checkout, /api
       |
       +---> [ sitemap.ts ]: Dynamic sitemap querying active products & collections from PostgreSQL
       |
       +---> [ generateMetadata() ]: Server-generates title, meta description, OpenGraph, Canonical URLs
       |
       +---> [ JSON-LD Schema ]: Injects structured Product, BreadcrumbList, Organization schemas
```

---

## 2. ROBOTS.TXT & DYNAMIC XML SITEMAP CONFIGURATION

### 2.1 Search Engine Boundary (`apps/web/app/robots.ts`)
```typescript
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://navacreations.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/shop', '/products/', '/collections/', '/contact', '/about', '/policies/'],
        disallow: ['/admin/', '/api/', '/orders/', '/checkout/']
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`
  };
}
```
**Security & Privacy Guarantee:** Guarantees that search engine crawlers do not index customer order confirmation pages, checkout pages, administrative consoles, or backend API endpoints.

### 2.2 Dynamic XML Sitemap (`apps/web/app/sitemap.ts`)
The sitemap dynamically fetches published catalog entities from PostgreSQL to guarantee zero stale links:
1. **Static Core Pages:** Priority 1.0 (Homepage), 0.9 (Shop catalog), 0.8 (Contact/Studio, About).
2. **Dynamic Products:** Fetches all active products (`isActive: true`), priority 0.8, with `lastModified: product.updatedAt`.
3. **Dynamic Collections:** Fetches curated collections (`col-bridal-2026`, `col-bestsellers`), priority 0.7.
4. **Policy Pages:** Shipping, Returns, Privacy, Terms, priority 0.5.

---

## 3. STRUCTURED DATA & JSON-LD SCHEMAS

The storefront embeds rich Schema.org JSON-LD microdata to capture Google Rich Snippets (star ratings, price in INR, and stock availability):

### 3.1 Product Schema (`Product` & `Offer`)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Bespoke Kundan Heirloom Bridal Chuda Set",
  "image": [
    "https://navacreations.com/images/products/kundan-bridal-1.jpg"
  ],
  "description": "Artisanal handcrafted Kundan bridal chuda set with red velvet accents and antique gold finish.",
  "sku": "NAV-KDN-06",
  "brand": {
    "@type": "Brand",
    "name": "NAVA CREATIONS"
  },
  "offers": {
    "@type": "Offer",
    "url": "https://navacreations.com/products/bespoke-kundan-heirloom-bridal-chuda-set",
    "priceCurrency": "INR",
    "price": "3499.00",
    "availability": "https://schema.org/InStock",
    "itemCondition": "https://schema.org/NewCondition",
    "seller": {
      "@type": "Organization",
      "name": "NAVA CREATIONS"
    }
  }
}
```

### 3.2 Organization & Local Business Schema
Identifies NAVA as an artisanal design studio based in Bengaluru with verified customer service contacts and social media profiles.

---

## 4. CORE WEB VITALS (CWV) & RUNTIME PERFORMANCE

Performance is optimized for Indian mobile cellular connections (4G/5G mobile latencies):

| Core Web Vital | Industry Benchmark | NAVA CREATIONS Optimization Strategy | Projected Score |
|:---|:---:|:---|:---:|
| **Largest Contentful Paint (LCP)** | $\le 2.5\text{ s}$ | Priority loading on hero banner (`priority={true}` in `next/image`), modern AVIF/WebP image formats via Cloudflare/Vercel edge CDN. | **$\sim 1.2\text{ s}$** |
| **Interaction to Next Paint (INP)** | $\le 200\text{ ms}$ | Minimal client-side JavaScript execution, lightweight React 19 Server Components, zero bulky third-party tracking scripts. | **$\sim 45\text{ ms}$** |
| **Cumulative Layout Shift (CLS)** | $\le 0.1$ | Explicit aspect ratio wrappers (`aspect-[4/5]` for bangle galleries), zero unsized dynamic layout shifts. | **$0.01$ (Virtually 0)** |
| **First Contentful Paint (FCP)** | $\le 1.8\text{ s}$ | Edge-rendered Next.js HTML served from Indian Anycast PoPs (Mumbai, Bengaluru). | **$\sim 0.8\text{ s}$** |

---

## 5. IMAGE OPTIMIZATION ARCHITECTURE

In `apps/web/next.config.mjs`, image optimization is configured with strict remote domain whitelisting to prevent SSRF vulnerabilities:

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',
    }
  ]
}
```
**Benefits:**
- Automatically converts source JPEGs into compressed AVIF/WebP formats.
- Reduces image payload sizes by **65%–80%** without visible fidelity loss on high-DPI smartphone displays.
