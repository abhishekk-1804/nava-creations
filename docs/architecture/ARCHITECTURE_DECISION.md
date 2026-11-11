# Architecture Decision Records — NAVA CREATIONS

> [!NOTE]
> This document captures all major architectural decisions for the NAVA CREATIONS e-commerce platform. Each ADR follows the standard format: Status → Context → Decision → Rationale → Consequences → Migration Path.

**Project:** NAVA CREATIONS — Indian Accessories E-Commerce Platform  
**Location:** Bengaluru, Karnataka, India  
**Phase:** 0 — Foundation & Planning  
**Last Updated:** 2026-11-11  
**Author:** Architecture Team

---

## Table of Contents

1. [ADR-001: Modular Monolith vs Microservices](#adr-001-modular-monolith-vs-microservices)
2. [ADR-002: Next.js App Router as Primary Framework](#adr-002-nextjs-app-router-as-primary-framework)
3. [ADR-003: PostgreSQL as Primary Database](#adr-003-postgresql-as-primary-database)
4. [ADR-004: Prisma vs Drizzle ORM](#adr-004-prisma-vs-drizzle-orm)
5. [ADR-005: Business Logic Placement](#adr-005-business-logic-placement)
6. [ADR-006: Deployment Platform](#adr-006-deployment-platform)
7. [ADR-007: Image Storage Strategy](#adr-007-image-storage-strategy)
8. [ADR-008: Caching Strategy](#adr-008-caching-strategy)
9. [ADR-009: Payment Gateway Selection](#adr-009-payment-gateway-selection)

---

## ADR-001: Modular Monolith vs Microservices

**Status:** `Accepted`  
**Date:** 2026-11-11

### Context

NAVA CREATIONS is launching as a small business with a solo developer and AI assistance. The platform needs to handle:
- Product catalogue browsing
- Cart and checkout flows
- Payment processing (Indian gateways)
- Inventory management
- Admin operations
- Shipping integrations

The team size, budget, and operational complexity must drive the architecture choice. Premature distribution is a known failure mode for small teams.

### Options Evaluated

| Option | Description | Complexity | Cost | Fit for Solo Dev |
|--------|-------------|------------|------|-----------------|
| **Modular Monolith** | Single deployable unit with well-defined internal module boundaries | Low | Low | ✅ Excellent |
| **Microservices** | Independent services per domain (product, order, payment…) | Very High | High | ❌ Poor |
| **Mini-services / BFF** | 2–3 services (web + background jobs) | Medium | Medium | ⚠️ Acceptable |
| **Serverless functions only** | Pure function-per-endpoint | Medium | Low-Medium | ⚠️ Limited |

### Decision

**Adopt a Modular Monolith** deployed as a single Next.js application with strict internal module separation enforced by directory conventions and TypeScript path aliases.

### Rationale

1. **Solo developer constraint:** Microservices require distributed systems expertise, service discovery, inter-service auth, and complex deployment pipelines. A solo developer cannot safely operate this.
2. **Cost:** Microservices require multiple compute instances. A monolith runs on one Vercel project.
3. **Debuggability:** A single process means stack traces are readable; logs are in one place; there is no network hop to debug.
4. **Consistency:** Database transactions span the entire business operation without distributed saga complexity.
5. **Speed to market:** Modular monolith lets NAVA ship a working MVP within weeks, not months.
6. **Modularity still enforced:** Internal boundaries (domain services, repositories, route handlers) are enforced by code conventions, not network calls.

### Consequences

**Positive:**
- Fast iteration and deployment
- Simple debugging and observability
- Atomic transactions across domains (e.g., decrement stock + create order in one DB transaction)
- Zero inter-service latency

**Negative:**
- Horizontal scaling requires stateless design from day one (no in-process state)
- A bug in one module can crash the whole app (mitigated by error boundaries and health checks)
- Module boundary discipline requires intentional enforcement

### Migration Path

When traffic or team size makes extraction worthwhile:

1. **Phase 1 (now):** Modular monolith, internal boundaries by directory
2. **Phase 2 (>50k orders/month or second developer):** Extract background jobs (email, webhook processing) to a separate worker process — still on same DB
3. **Phase 3 (team of 3+, >₹5Cr GMV):** Extract specific high-load domains (inventory, search) as separate services with shared PostgreSQL or dedicated read replicas
4. **Never:** Do not extract payment handling — keep it inside the monolith or dedicated secure service with tight perimeter

> [!IMPORTANT]
> The modular monolith decision requires strict discipline: no cross-module direct database queries, no importing from sibling module's internal files. All cross-module communication via public service APIs defined in each module's `index.ts`.

---

## ADR-002: Next.js App Router as Primary Framework

**Status:** `Accepted`  
**Date:** 2026-11-11

### Context

NAVA CREATIONS needs:
- Server-side rendering for SEO (product pages, collections must be indexed by Google)
- Fast page loads on mobile (most Indian shoppers are on 4G mobile)
- A single codebase for storefront and admin dashboard
- TypeScript support
- Good ecosystem for e-commerce patterns

### Options Evaluated

| Framework | SSR/SSG | TypeScript | Ecosystem | Learning Curve | Indian E-comm examples |
|-----------|---------|------------|-----------|----------------|------------------------|
| **Next.js App Router** | Excellent | Native | Largest | Medium | Many |
| **Remix** | Excellent | Native | Good | Medium | Few |
| **SvelteKit** | Excellent | Good | Smaller | Low-Medium | Very few |
| **Nuxt (Vue 3)** | Excellent | Good | Medium | Low (if Vue known) | Few |

### Decision

**Next.js App Router (v14+)** with TypeScript and the React Server Components model.

### Rationale

1. **SEO is critical:** Indian shoppers search Google for "bridal bangles Bengaluru" — product pages must be server-rendered. App Router's RSC model makes this the default.
2. **Largest ecosystem:** Most e-commerce patterns, auth libraries, payment SDKs, and middleware integrations have Next.js examples.
3. **Server Actions:** Eliminate boilerplate API routes for form submissions, reducing attack surface and code volume.
4. **Vercel synergy:** Optimal deployment target for Next.js; edge functions, ISR, and image optimization are native.
5. **Talent pool:** Most Indian full-stack developers know React/Next.js — better for future hiring.
6. **Route groups:** App Router supports `(storefront)` and `(admin)` route groups within a single app — no need for a separate admin SPA.

### Trade-offs

**Accepted limitations of App Router:**
- Server Components have no browser APIs — requires careful Client/Server component split
- App Router is newer; some third-party libraries still assume Pages Router patterns
- Learning curve for RSC mental model vs traditional React

**Mitigation:** Use `"use client"` directive deliberately; keep Client Components at the leaf level; use `Suspense` boundaries for streaming.

### Consequences

- Admin dashboard lives at `/admin/*` within the same Next.js app — no separate deployment
- API routes at `/api/*` for webhooks and external integrations that require raw HTTP
- Server Actions used for all form-based mutations (cart add, checkout, profile update)

---

## ADR-003: PostgreSQL as Primary Database

**Status:** `Accepted`  
**Date:** 2026-11-11

### Context

The database must:
- Enforce referential integrity (orders → order_items, inventory transactions)
- Support JSONB for order snapshots (preserve product state at time of purchase)
- Handle concurrent inventory updates safely (atomic decrement, check-then-act pattern)
- Store financial records with ACID guarantees
- Run managed (no self-hosting ops burden for a solo developer)

### Options Evaluated

| Database | ACID | JSONB | Managed Options | Indian Data Residency | Fit |
|----------|------|-------|-----------------|----------------------|-----|
| **PostgreSQL** | ✅ Full | ✅ Native | Neon, Supabase, Railway, AWS RDS | Neon (Singapore), Supabase (Mumbai) | ✅ Best |
| **MySQL / PlanetScale** | ✅ Full | ⚠️ Limited JSON | PlanetScale, Railway | ⚠️ Limited | Acceptable |
| **MongoDB** | ⚠️ Limited multi-doc | ✅ Native | Atlas | ✅ Mumbai | ❌ Poor for financial data |
| **SQLite (Turso)** | ✅ Single-node | ❌ | Turso (edge) | ❌ | ❌ Not suitable |

### Decision

**PostgreSQL** as the sole database. Hosted on **Neon** (serverless PostgreSQL) for initial launch.

### Rationale

1. **Financial integrity:** Orders, payments, and inventory are financial records. ACID transactions are non-negotiable.
2. **JSONB:** Native JSONB for `order_items.product_snapshot` — indexed, queryable, compressed. Perfect for the historical snapshot pattern.
3. **Row-level locking:** `SELECT ... FOR UPDATE` for stock reservation — prevents overselling without application-level locks.
4. **Neon serverless:** Scales to zero (₹0 at rest), scales up under load, branch-based dev workflows, Vercel integration native.
5. **Prisma/Drizzle support:** Both preferred ORMs have first-class PostgreSQL support.

### Consequences

- All caching (if added later) must treat PostgreSQL as source of truth
- Neon's free tier has compute limits — upgrade to paid plan at ~1000 daily active users
- Data residency: Neon's closest region is Singapore (AWS ap-southeast-1); Supabase has Mumbai (ap-south-1) if Indian data residency becomes a legal requirement

> [!WARNING]
> If Indian data localisation laws (DPDP Act 2023) require personal data to be stored in India, evaluate **Supabase (Mumbai)** or **AWS RDS (Mumbai)**. This should be verified with legal counsel before launch.

---

## ADR-004: Prisma vs Drizzle ORM

**Status:** `Accepted`  
**Date:** 2026-11-11

### Context

An ORM or query builder is needed to interact with PostgreSQL. The choice affects developer velocity, type safety, migration management, and runtime performance. This is a solo developer using AI assistance heavily.

### Options in Detail

#### Prisma ORM

| Aspect | Detail |
|--------|--------|
| **Model definition** | `schema.prisma` DSL — single source of truth for DB schema + TypeScript types |
| **Type safety** | Full end-to-end: schema → generated client → TypeScript types |
| **Query API** | Fluent, object-oriented `.findMany({ where: {}, include: {} })` |
| **Migrations** | `prisma migrate dev` — generates SQL migration files automatically |
| **AI assistance** | Prisma's DSL and patterns are extremely well-known to AI tools (Copilot, Claude, Gemini) |
| **Raw SQL** | `prisma.$queryRaw` for complex queries |
| **Performance** | Prisma Client generates N+1-safe queries; slightly more overhead than raw Drizzle |
| **Bundle size** | Larger (Prisma engines are sizeable); matters less on server-side |
| **Ecosystem** | Mature; `prisma-extension-*` packages for pagination, soft-delete, audit |
| **Learning curve** | Low for someone who has never used either |
| **Neon compatibility** | ✅ Official support with connection pooling via `@prisma/adapter-neon` |

#### Drizzle ORM

| Aspect | Detail |
|--------|--------|
| **Model definition** | TypeScript-first schema definition — schema IS the TypeScript type |
| **Type safety** | Excellent; schema and query types are unified |
| **Query API** | SQL-like builder: `db.select().from(users).where(eq(users.id, id))` |
| **Migrations** | `drizzle-kit push` or `drizzle-kit generate` — generates SQL |
| **AI assistance** | Good but Prisma patterns are more prevalent in AI training data |
| **Raw SQL** | `db.execute(sql\`...\`)` — natural, since it's SQL-first |
| **Performance** | Minimal overhead; thin abstraction over `pg` driver |
| **Bundle size** | Smaller; works well at the edge |
| **Ecosystem** | Newer; growing; fewer extension libraries |
| **Learning curve** | Low for SQL-fluent developers; higher for those who prefer ORM abstraction |
| **Neon compatibility** | ✅ First-class `drizzle-orm/neon-serverless` driver |

### Decision

**Prisma ORM** for the initial implementation.

### Reasoning for a Solo Developer

1. **AI tooling synergy:** Prisma's schema DSL is extensively represented in AI training data. AI assistants generate more accurate Prisma code, reducing debugging time for a solo developer.
2. **Single source of truth:** The `.prisma` schema file defines DB schema, TypeScript types, and ORM client simultaneously — fewer files to keep in sync.
3. **Migration management:** `prisma migrate dev` is the most polished migration workflow — it generates SQL, applies it, and maintains a migration history suitable for production deployment.
4. **Soft delete extensions:** `prisma-extension-soft-delete` saves significant boilerplate for the product/user/address soft-delete pattern.
5. **Learning curve:** A developer who has not used either can be productive with Prisma within hours.

### Migration Path to Drizzle

If edge deployments become necessary (Vercel Edge Runtime does not support Prisma's native engine):
- Schema can be translated to Drizzle table definitions (mostly mechanical)
- Queries require manual rewrite
- Estimated migration effort: 3–5 developer-days

> [!TIP]
> Keep all Prisma calls inside the `packages/db/` package. This isolates the ORM dependency and makes a future switch to Drizzle a single-package change.

---

## ADR-005: Business Logic Placement

**Status:** `Accepted`  
**Date:** 2026-11-11

### Context

Next.js App Router offers multiple places where business logic can run:
- Inside React Server Components (RSC)
- Inside Server Actions
- Inside Route Handlers (`/api/...`)
- In a dedicated Express/Hono API service

The team needs to decide where validation, authorisation, pricing calculations, inventory checks, and payment orchestration live.

### Options

| Option | Location | Pros | Cons |
|--------|----------|------|------|
| **Logic in Server Actions** | `app/actions/*.ts` | Minimal boilerplate, type-safe end-to-end | Harder to test in isolation; couples logic to Next.js |
| **Domain Services + Server Actions** | `packages/domain/` + actions call services | Testable pure functions; reusable | Slight indirection |
| **Dedicated API Service** | Separate Express/Hono process | Fully decoupled; language-agnostic clients | Two deployments, latency, auth complexity |
| **Logic in RSC** | Direct DB calls in `page.tsx` | Fewest files | Untestable, violates SRP |

### Decision

**Domain Services in `packages/domain/`, called by Server Actions and Route Handlers.**

Architecture:
```
Route Handler / Server Action
         ↓  (input validated here — always server-side)
    Domain Service   (business logic — no DB calls)
         ↓
    Repository       (all Prisma calls here)
         ↓
    PostgreSQL
```

### Rationale

1. **Business rules on the server, always:** Server Actions run on the server — no business logic is exposed to the client.
2. **Testability:** Domain services are pure TypeScript functions that can be unit-tested without spinning up a database or Next.js.
3. **Replaceability:** The Next.js framework is a delivery mechanism. If NAVA ever needs a mobile app, the domain services and repositories are reused by any API layer.
4. **Single validation point:** Input is validated in the action/route handler before reaching domain logic — the domain service can trust its inputs.

### Key Rule

> **Frontend input is always untrusted.** Even Server Actions receive input that could be manipulated. All price calculations, discount applications, and inventory checks happen in domain services using server-side data, never trusting client-sent prices.

### Future Migration Path

If a mobile app or third-party API is needed:
1. Add a Hono/Express API layer that calls the same domain services
2. Domain services and repositories require zero changes
3. Add OAuth2/API key auth to the new API layer only

---

## ADR-006: Deployment Platform

**Status:** `Accepted`  
**Date:** 2026-11-11

### Context

Deployment must be:
- Affordable for a small business at launch (< ₹5,000/month ideally)
- Low operational overhead (no server administration for a solo developer)
- Scalable as NAVA grows
- Capable of running Next.js with Server Actions and API routes

### Options Evaluated

| Platform | Setup Effort | Cost (Launch) | Cost (Growth) | Ops Burden | Next.js Support |
|----------|-------------|---------------|---------------|------------|-----------------|
| **Vercel + Neon** | Very Low | Free / ~$20/mo | $20–200/mo | Minimal | Native/Optimal |
| **Railway** | Low | ~$5–20/mo | $20–100/mo | Low | Good |
| **AWS (ECS/App Runner + RDS)** | High | $50–150/mo | Scales well | High | Good |
| **DigitalOcean / VPS** | Medium | $12–25/mo | Manageable | Medium | Manual config |
| **Supabase + Vercel** | Low | Free / ~$25/mo | $25–100/mo | Minimal | Good |

### Decision

**Initial launch: Vercel (Pro plan) + Neon (Serverless PostgreSQL)**

**Configuration:**
- Next.js app → Vercel (auto-deploys on `git push main`)
- Database → Neon (serverless, connection pooling via PgBouncer built-in)
- Image storage → Cloudinary (free tier initially)
- Secrets → Vercel Environment Variables (never in Git)

### Rationale

1. **Zero-config Next.js deployment:** Vercel is built by the Next.js team. Server Actions, ISR, edge middleware, and image optimisation work without configuration.
2. **Neon branching:** Create a database branch for each PR — staging environments with real schema, zero cost when paused.
3. **Git-based deployments:** Every `git push` creates a preview deployment — solo developer can test before promoting to production.
4. **Cost at launch:** Vercel hobby is free; Vercel Pro is $20/month. Neon free tier handles initial load.
5. **Global CDN:** Vercel's CDN serves static assets globally; Indian users benefit from edge caching.

### Cost Projections

| Traffic Level | Vercel | Neon | Total Est. |
|--------------|--------|------|-----------|
| Launch (< 1k sessions/day) | Free/Pro $20 | Free | ~$20/mo |
| Growth (1k–10k sessions/day) | Pro $20 | Launch $19 | ~$40/mo |
| Scale (10k+ sessions/day) | Pro + compute | Scale $69 | ~$100+/mo |

> [!NOTE]
> All cost figures are approximate and in USD. Verify current pricing at vercel.com/pricing and neon.tech/pricing before launch.

### Migration Path as Business Grows

1. **Stage 1 (Launch):** Vercel + Neon free/pro tiers
2. **Stage 2 (₹1Cr+ GMV):** Add Vercel Postgres or migrate Neon to paid; consider Cloudflare CDN for images
3. **Stage 3 (₹5Cr+ GMV):** Evaluate Railway or AWS App Runner for more compute control; add read replica for analytics
4. **Stage 4 (₹25Cr+ GMV):** AWS India region (Mumbai) for data residency; dedicated RDS, ElastiCache

---

## ADR-007: Image Storage Strategy

**Status:** `Accepted`  
**Date:** 2026-11-11

### Context

Product images are core to jewellery/accessory e-commerce. NAVA will need:
- High-quality product images (multiple per product, multiple angles)
- Responsive image delivery (mobile-optimised)
- Transformation capabilities (resize, crop, watermark)
- Reasonable free tier for launch
- Private storage for customer enquiry attachments (reference photos)

### Options Evaluated

| Option | Free Tier | Transformations | CDN | Private Storage | Integration |
|--------|-----------|-----------------|-----|----------------|------------|
| **Cloudinary** | 25 credits/mo (generous) | ✅ Native | ✅ Global | ✅ Via signed URLs | npm SDK |
| **Supabase Storage** | 1 GB free | ❌ None | ✅ Via CDN | ✅ Bucket policies | npm SDK |
| **Backblaze B2 + Cloudflare CDN** | 10 GB free | ❌ (need separate transform) | ✅ Cloudflare | ✅ | Manual setup |
| **AWS S3 + CloudFront** | Minimal free | ❌ (need Lambda@Edge) | ✅ | ✅ | Mature |
| **Vercel Blob** | 500 MB free | ❌ | ✅ Via Vercel | ⚠️ | Native |

### Decision

**Cloudinary** for product images and media assets.  
**Supabase Storage** (or Cloudinary private folders) for customer enquiry attachments.

### Rationale

1. **Transformation API:** Jewellery photos need responsive sizes, format conversion (AVIF/WebP), and potentially watermarks. Cloudinary's URL-based transformations (`w_800,f_auto,q_auto`) eliminate server-side image processing.
2. **Generous free tier:** 25 credits/month covers ~10,000 image transformations — sufficient for launch.
3. **Next.js image loader:** Custom Cloudinary loader integrates with `next/image` component for optimal responsive images.
4. **Lazy migration:** Cloudinary upload widget for admin; store only the Cloudinary URL in DB — not vendor-locked to Cloudinary data format.
5. **Private enquiry attachments:** Customer reference photos (uploaded during customisation enquiry) must not be publicly accessible. Use signed Cloudinary URLs with expiry, or a private Supabase bucket.

### Consequences

- Product image URLs in DB are Cloudinary public IDs, not direct URLs — transformation parameters added at render time
- If migrating away from Cloudinary: bulk-download assets, re-upload to new provider, update URL templates in DB
- Never store direct customer face photos without explicit consent (DPDP Act compliance)

> [!CAUTION]
> Do not store Cloudinary API secret in frontend code or Git. Use server-side signed uploads — the client requests a signed upload URL from the Next.js server, then uploads directly to Cloudinary.

---

## ADR-008: Caching Strategy

**Status:** `Accepted`  
**Date:** 2026-11-11

### Context

Caching can dramatically improve performance and reduce database load. However, adding Redis or a caching layer too early adds operational complexity without proven benefit. The question is whether to add Redis at launch.

### Options

| Approach | Complexity | Cost | Use Case |
|----------|------------|------|----------|
| **No explicit cache** | None | Free | Appropriate for < 1k daily sessions |
| **Next.js data cache** | Very Low | Free (built-in) | Static product pages, RSC output |
| **Redis (Upstash)** | Low-Medium | Free tier / $20+/mo | Session store, rate limiting, cart |
| **Redis (self-hosted)** | High | Server cost | Not suitable for solo dev |
| **Neon read replica** | Low | Additional Neon cost | Read-heavy analytics queries |

### Decision

**No Redis at launch. Use Next.js built-in caching and PostgreSQL directly.**

Caching layers used at launch:
1. **Next.js `fetch` cache:** Revalidated product and category data (`revalidate: 60` seconds)
2. **Next.js full-page cache:** Static collection pages cached at the CDN edge
3. **Vercel CDN:** Image assets and static files served from Vercel's global edge
4. **PostgreSQL-level:** Neon's connection pooler reduces connection overhead

### Rationale

1. **Premature optimisation:** At launch traffic levels (< 1,000 sessions/day), PostgreSQL with proper indexes handles all read load with sub-100ms response times.
2. **Cache invalidation complexity:** Redis requires implementing invalidation logic for every write — a significant bug surface for a solo developer.
3. **Session storage:** Next.js auth (using `next-auth` or `jose`) uses HTTP-only cookies with encrypted JWT — no server-side session store needed.
4. **Cart persistence:** Cart lives in PostgreSQL (for logged-in users) or localStorage (for guests), merged at login — no Redis needed.

### When to Add Redis (Upstash)

Add **Upstash Redis** (serverless, consumption-priced) when:
- Product page load times exceed 500ms under real traffic
- Rate limiting on API endpoints is needed
- Session store for high-concurrency admin operations
- Real-time stock availability for high-demand festival drops

> [!TIP]
> Upstash Redis is serverless and consumption-priced — zero cost when idle. At the point Redis is needed, Upstash is the lowest-friction addition.

### Migration Path

1. Add `@upstash/redis` package
2. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` env vars
3. Implement cache-aside pattern in repositories for hot read paths
4. Add rate limiting middleware using `@upstash/ratelimit`

---

## ADR-009: Payment Gateway Selection

**Status:** `Accepted`  
**Date:** 2026-11-11

### Context

NAVA CREATIONS is an Indian business selling to Indian customers. Payment methods required:
- UPI (PhonePe, GPay, Paytm, BHIM)
- Debit/Credit Cards (Visa, Mastercard, RuPay)
- Net Banking
- Wallets (Paytm, PhonePe, etc.)
- EMI (Cardless EMI, Pay Later)
- Cash on Delivery (COD — high demand in Indian e-commerce)

The gateway must support:
- Webhook-based payment confirmation (never trust client-side success)
- Refund API
- Settlement reports
- Indian KYC onboarding
- Test mode for development

### Options Evaluated

#### Razorpay

| Aspect | Details |
|--------|---------|
| **Founded** | 2014, Bengaluru — well-established |
| **MDR (cards)** | ~2% (verify at razorpay.com) ⚠️ |
| **UPI** | 0% MDR for standard UPI (as per RBI mandate) |
| **Settlement** | T+2 for most payment methods |
| **Webhook reliability** | High; documented retry logic |
| **Dashboard** | Excellent; analytics, reconciliation built-in |
| **Developer docs** | Excellent; large Indian developer community |
| **SDK** | `razorpay` npm package; Checkout.js |
| **COD** | Via Razorpay Magic — verify availability |
| **KYC** | Standard Indian business KYC |
| **Customer support** | Responsive for business accounts |

#### Cashfree Payments

| Aspect | Details |
|--------|---------|
| **Founded** | 2015, Bengaluru |
| **MDR (cards)** | ~1.75–2% (verify at cashfree.com) ⚠️ |
| **UPI** | 0% (RBI mandate) |
| **Settlement** | T+1 or even same-day options |
| **Webhook reliability** | Good; documented events |
| **Dashboard** | Good; slightly less refined than Razorpay |
| **Developer docs** | Good; improving |
| **SDK** | `cashfree-pg` npm package |
| **COD** | Available via Cashfree COD service |
| **KYC** | Standard Indian business KYC |
| **Instant Refund** | Instant refunds to UPI — differentiator |

### Comparison Table

| Feature | Razorpay | Cashfree |
|---------|----------|----------|
| UPI MDR | 0% | 0% |
| Card MDR | ~2% ⚠️ | ~1.75% ⚠️ |
| Net Banking MDR | ₹15 flat ⚠️ | Competitive ⚠️ |
| Settlement speed | T+2 | T+1 / Instant |
| Developer experience | Excellent | Good |
| Indian community | Very large | Growing |
| Webhook reliability | Excellent | Good |
| COD management | Via partners | Direct |
| Instant refund | No | Yes (UPI) |
| International cards | ✅ | ✅ |
| Affordability for small biz | Good | Slightly better |

> [!IMPORTANT]
> All MDR figures above are approximate and based on publicly available information at the time of writing. **Verify exact rates on official pricing pages before signing any merchant agreement.** MDR for businesses with < ₹5 lakh/month volume may differ from enterprise rates.

### Decision

**Start with Razorpay; design integration to be replaceable with Cashfree.**

**Primary rationale:**
1. **Ecosystem:** Razorpay has the most tutorials, Stack Overflow answers, and AI-known code patterns in the Indian developer community — critical for a solo developer with AI assistance.
2. **Documentation quality:** Razorpay's API docs and webhook documentation are the most comprehensive in the Indian market.
3. **Dashboard:** Razorpay dashboard provides excellent reconciliation, settlement reports, and dispute management needed even at small scale.
4. **Community:** Largest Indian payment gateway community for troubleshooting edge cases.

**Cashfree consideration for future:**
- If Cashfree's faster settlement (T+1) becomes critical for cash flow
- If Cashfree's instant UPI refunds reduce customer support load
- As a backup gateway if Razorpay has downtime

### Integration Design (Gateway-Agnostic)

```typescript
// packages/domain/src/payment/payment.service.ts
interface PaymentGateway {
  createOrder(amount: number, currency: string, metadata: object): Promise<GatewayOrder>
  verifyWebhookSignature(payload: string, signature: string): boolean
  initiateRefund(paymentId: string, amount: number, notes: string): Promise<GatewayRefund>
  fetchPaymentStatus(paymentId: string): Promise<GatewayPaymentStatus>
}

// Concrete implementations:
class RazorpayGateway implements PaymentGateway { ... }
class CashfreeGateway implements PaymentGateway { ... }
```

This interface means swapping gateways requires implementing a new class, not rewriting the domain logic.

### Consequences

- Payment confirmation **always** happens via webhook, never client-reported status
- Gateway payment IDs are stored alongside internal order IDs (never replace internal IDs)
- PCI-DSS scope: NAVA never handles raw card data — card entry happens inside gateway's hosted fields/checkout
- COD orders: handled as a special order state; no payment gateway involved until optional COD verification

---

## Summary Decision Matrix

| Decision | Choice | Confidence | Review Trigger |
|----------|--------|------------|----------------|
| Architecture style | Modular Monolith | High | 2nd developer, >50k orders/month |
| Framework | Next.js App Router | High | Major framework change in market |
| Database | PostgreSQL (Neon) | High | DPDP compliance, data residency laws |
| ORM | Prisma | High | Edge deployment requirement |
| Business logic | Domain Services + Server Actions | High | Mobile app launch |
| Deployment | Vercel + Neon | High | >10k sessions/day, cost review |
| Image storage | Cloudinary | Medium | Cost at scale; re-evaluate at 50k assets |
| Caching | None (Next.js cache only) | High | >500ms p95 latency |
| Payment gateway | Razorpay (primary) | High | Settlement speed, pricing renegotiation |

---

*Document maintained by the Architecture Team. Each ADR should be revisited when its stated review trigger is met.*
