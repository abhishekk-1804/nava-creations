# NAVA CREATIONS — Security Requirements

**Version:** 1.0  
**Date:** 2026-11-11  
**Author:** Security Engineering (Phase 0)  
**Reference Frameworks:** OWASP ASVS v4.0, OWASP Top 10 2021, DPDPA 2023  
**Priority Scale:** `P0` = Launch Blocker | `P1` = Pre-Launch | `P2` = Post-Launch

---

## Table of Contents

1. [Authentication & Session Management](#1-authentication--session-management)
2. [Authorization & RBAC](#2-authorization--rbac)
3. [Input Validation & Output Encoding](#3-input-validation--output-encoding)
4. [File Upload Security](#4-file-upload-security)
5. [Payment Security](#5-payment-security)
6. [Infrastructure Security](#6-infrastructure-security)
7. [Privacy & Data Protection (DPDPA 2023)](#7-privacy--data-protection-dpdpa-2023)
8. [Security Acceptance Checklist](#8-security-acceptance-checklist)
9. [Security Testing Plan](#9-security-testing-plan)
10. [Control Mapping Table](#10-control-mapping-table)

---

## 1. Authentication & Session Management

### 1.1 Password Policy `P0`

> [!IMPORTANT]
> These requirements apply to both customer accounts and all admin accounts. Admin requirements are strictly enforced with no override.

| Requirement | Specification |
|-------------|--------------|
| Minimum length | **12 characters** |
| Maximum length | 128 characters (prevent DoS via bcrypt with huge inputs — truncate at 72 bytes for bcrypt or hash first) |
| Complexity | At least 1 uppercase, 1 lowercase, 1 digit. Symbols encouraged but not mandated. |
| Breach checking | Check password against **HaveIBeenPwned Passwords API** (k-anonymity model — only first 5 chars of SHA1 hash sent) on registration and password change. Block any password returning `>0` matches. |
| Common password blocklist | Reject passwords matching a list of the 10,000 most common passwords. |
| Personal data prohibition | Reject passwords containing the user's name, email handle, or phone number. |
| Password history | Admin accounts: may not reuse any of the last 5 passwords. |

**Implementation note:** Use the [HIBP Passwords API](https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange) with range query (`/range/{first5HashChars}`) — never send the full password hash externally.

### 1.2 Password Hashing `P0`

> [!CAUTION]
> Never use MD5, SHA1, SHA256, or any unsalted/custom hashing scheme for passwords. These are trivially broken. Only the algorithms below are acceptable.

| Requirement | Specification |
|-------------|--------------|
| **Recommended algorithm** | **bcrypt** with cost factor **12** (minimum 10) |
| **Alternative (stronger)** | **Argon2id** with memory=64MB, iterations=3, parallelism=4 |
| Salt | Automatically generated per-password (bcrypt and Argon2id both do this) |
| Library | `bcryptjs` (pure JS, no native deps) or `@node-rs/bcrypt` (Rust, faster) |
| Input sanitisation | For bcrypt: enforce maximum 72-byte input (bcrypt silently truncates — a 73-char and 200-char password with the same first 72 bytes would be equivalent). Pre-hash with SHA-256 if supporting longer passwords. |

```typescript
// ✅ Correct — bcrypt with cost 12
import bcrypt from 'bcryptjs';
const hash = await bcrypt.hash(password, 12);
const valid = await bcrypt.compare(password, hash);

// ❌ Wrong — never do this
import crypto from 'crypto';
const hash = crypto.createHash('md5').update(password).digest('hex');
```

### 1.3 Multi-Factor Authentication (MFA) `P0`

| Role | MFA Requirement |
|------|----------------|
| **Owner / Super Admin** | **Mandatory TOTP** — cannot log in without TOTP. Enforce at middleware level. |
| Store Manager | Mandatory TOTP |
| Product Manager | Mandatory TOTP |
| Order Manager | Mandatory TOTP |
| Content Editor | Mandatory TOTP |
| Support Staff | Mandatory TOTP |
| **Customer accounts** | Optional — encourage but do not require (reduces checkout friction) |

**TOTP Implementation:**
- Library: `otplib` (RFC 6238 compliant)
- Code window: ±1 period (30-second window, allow 1 period either side for clock skew)
- Recovery codes: generate 8 single-use 16-character alphanumeric codes on TOTP enrollment
- Recovery code storage: hashed (bcrypt) in DB, displayed only once to user
- TOTP secret storage: encrypted at rest in DB (AES-256-GCM with key from secrets manager)

### 1.4 Session Management `P0`

| Requirement | Specification |
|-------------|--------------|
| Session store | Server-side (database or Redis) — not stateless JWT for admin sessions |
| Cookie flags | `HttpOnly`, `Secure`, `SameSite=Strict` — always all three |
| Session ID length | 128-bit cryptographically random (use `crypto.randomBytes(16)`) |
| **Session rotation** | Issue new session ID on login, privilege change, role change |
| Customer session TTL | 24 hours sliding; absolute max 7 days |
| Admin session TTL | 8 hours sliding; absolute max 1 day; re-auth required after 8 hours |
| Logout | Server-side session invalidation — do not rely only on cookie deletion |
| Concurrent sessions | Allow up to 3 concurrent customer sessions; admin: 1 active session per user (invalidate previous on new login) |

**JWT Considerations (if used for API auth):**
- Algorithm: **RS256 or ES256** — never HS256 with a weak secret, never `alg: none`
- Expiry (`exp`): 15 minutes for access tokens; 7 days for refresh tokens
- Refresh tokens: stored server-side (hashed) with ability to revoke
- Do not store sensitive PII in JWT payload (IDs are fine, PII is not)
- Validate `iss`, `aud`, `exp`, `nbf` on every request

### 1.5 Account Lockout & Rate Limiting `P0`

> [!WARNING]
> Do NOT implement hard account lockout (locking the account permanently after N failures) — this enables attackers to DoS user accounts. Use progressive delays instead.

| Scenario | Control |
|----------|---------|
| 1–3 failed login attempts | No delay |
| 4–5 failed attempts (same IP) | 2-second server-side delay |
| 6–10 failed attempts | CAPTCHA required (hCaptcha / Cloudflare Turnstile) |
| >10 failed attempts within 5 minutes | Temporary IP-based block (15 minutes) |
| Alert threshold | >20 failures/hour on same username → email alert to Owner |

### 1.6 Secure Account Recovery `P0`

| Requirement | Specification |
|-------------|--------------|
| Token generation | `crypto.randomBytes(32)` — 256-bit entropy |
| Token encoding | Base64url or hex |
| Token expiry | **15 minutes** (not 24 hours, not "never") |
| Token usage | **Single-use**: invalidate immediately upon first use or expiry |
| Rate limiting | Maximum 3 reset requests per email per hour |
| Email enumeration | Return identical message whether email exists or not: "If this email is registered, you will receive a reset link." |
| Post-reset actions | Invalidate ALL active sessions; notify user of password change via email |
| Security questions | **Prohibited** — not acceptable as a recovery mechanism |
| Recovery for admin accounts | TOTP recovery codes only; phone OTP as fallback if implemented |

---

## 2. Authorization & RBAC

### 2.1 RBAC Permission Matrix `P0`

| Permission | Owner | Store Mgr | Product Mgr | Order Mgr | Content Ed | Support |
|-----------|:-----:|:---------:|:-----------:|:---------:|:----------:|:-------:|
| Manage admin users & roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View financial reports | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create/edit/delete products | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage inventory | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View & manage all orders | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ (view only) |
| Process refunds | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Manage coupons/promotions | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Publish blog/CMS content | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| View customer PII | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ (name, email only) |
| Manage settings/integrations | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Handle customer enquiries | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |

### 2.2 Implementation Pattern `P0`

> [!IMPORTANT]
> Security checks must exist at **two layers**: middleware (routing) AND service layer (data). Middleware alone is insufficient — Server Actions bypass routing middleware.

```
Request
  ↓
Next.js Middleware (route-level auth check)
  ↓ if passes
Route Handler / Server Action
  ↓
Service Layer (resource-level permission check)
  ↓ if passes
Database Query (ownership filter in WHERE clause)
```

**Middleware (`middleware.ts`):**
```typescript
// Protect all /admin/* routes
export function middleware(request: NextRequest) {
  const session = getSession(request); // read server-side session

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!session || session.role === 'CUSTOMER') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (!session.mfaVerified) {
      return NextResponse.redirect(new URL('/admin/mfa', request.url));
    }
  }
}
```

**Service layer (every admin operation):**
```typescript
// ✅ Always check permission before executing
async function deleteProduct(productId: string, actorSession: AdminSession) {
  assertPermission(actorSession.role, 'products:delete'); // throws 403 if denied
  auditLog(actorSession, 'product:delete', productId);
  return db.product.delete({ where: { id: productId } });
}

// ✅ Customer resource ownership check
async function getOrder(orderId: string, customerSession: CustomerSession) {
  const order = await db.order.findFirst({
    where: { id: orderId, customerId: customerSession.customerId } // ownership check
  });
  if (!order) throw new NotFoundError(); // 404, not 403, to avoid leaking existence
  return order;
}
```

### 2.3 Explicit Deny by Default `P0`

```typescript
// ✅ Allowlist approach — deny unless explicitly permitted
const PERMISSIONS: Record<Role, Set<string>> = {
  OWNER: new Set(['*']), // all permissions
  STORE_MANAGER: new Set(['products:*', 'orders:*', 'reports:view', ...]),
  SUPPORT_STAFF: new Set(['orders:view', 'enquiries:*', 'customers:view:limited']),
  // etc.
};

function assertPermission(role: Role, permission: string): void {
  const allowed = PERMISSIONS[role];
  if (!allowed.has('*') && !allowed.has(permission)) {
    throw new ForbiddenError(`Role ${role} lacks permission: ${permission}`);
  }
}
```

### 2.4 Audit Logging `P0`

Every admin action must produce an audit log entry:

```typescript
interface AuditLogEntry {
  id: string;           // UUID
  timestamp: Date;      // server time (UTC)
  actorId: string;      // admin user ID
  actorEmail: string;   // snapshot of email at time of action
  actorRole: Role;      // snapshot of role at time of action
  action: string;       // e.g. "product:update", "order:refund", "user:delete"
  resourceType: string; // e.g. "Product", "Order", "AdminUser"
  resourceId: string;   // ID of affected resource
  metadata: object;     // diff/before-after for sensitive changes (redact PII)
  ipAddress: string;    // from X-Forwarded-For (trust only first hop)
  userAgent: string;    // browser user agent
}
```

- Audit logs are **append-only** — no UPDATE or DELETE permitted on audit log records
- Shipped to external log aggregator in real time — not solely stored in DB

---

## 3. Input Validation & Output Encoding

### 3.1 Validation Library `P0`

**Use Zod for all input validation** — both in Server Actions and API routes.

```typescript
// ✅ Always validate at the boundary — never trust input
import { z } from 'zod';

const CheckoutSchema = z.object({
  cartItems: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
    quantity: z.number().int().min(1).max(100),
    // ❌ No price field — server calculates price from DB
  })).min(1).max(50),
  shippingAddressId: z.string().uuid(),
  couponCode: z.string().max(50).regex(/^[A-Z0-9\-]+$/).optional(),
});

// In Server Action:
export async function checkout(formData: FormData) {
  const parsed = CheckoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: 'Invalid input', details: parsed.error.flatten() };
  // proceed with parsed.data
}
```

**Validation rules by field type:**
| Field Type | Validation |
|-----------|-----------|
| Email | RFC 5321 format, max 254 chars, lowercase normalise |
| Phone (India) | Regex: `/^[6-9]\d{9}$/` (10 digits, starts with 6–9) |
| Product name | Max 200 chars, strip HTML tags |
| Search query | Max 200 chars, strip SQL metacharacters |
| Sort field | Allowlist of valid column names: `['name', 'price', 'createdAt']` |
| Order direction | Enum: `'asc' | 'desc'` only |
| File names | Strip path separators, limit to alphanumeric + hyphen + dot |
| UUIDs | Regex or `z.string().uuid()` |
| Amounts | Server-computed only — reject from client input |

### 3.2 Parameterised Queries `P0`

> [!CAUTION]
> String-concatenated SQL is never acceptable. If a Prisma limitation forces raw SQL, use `$queryRaw` with tagged template literals only.

```typescript
// ✅ Prisma parameterised (always safe)
const products = await db.product.findMany({
  where: { name: { contains: searchTerm } }
});

// ✅ Raw SQL when needed — tagged template literal is parameterised
const results = await db.$queryRaw`
  SELECT * FROM products
  WHERE to_tsvector('english', name) @@ plainto_tsquery('english', ${searchTerm})
`;

// ❌ NEVER — string interpolation in SQL
const results = await db.$queryRawUnsafe(
  `SELECT * FROM products WHERE name LIKE '%${searchTerm}%'` // SQLi
);
```

### 3.3 Output Encoding `P0`

| Context | Requirement |
|---------|-------------|
| JSX rendering | React auto-escapes text content — safe by default |
| `dangerouslySetInnerHTML` | **Prohibited** without DOMPurify sanitisation. Must be code-reviewed. |
| Admin rich text (product descriptions, blog) | Sanitise with `dompurify` (server-side via JSDOM) or `sanitize-html` before storage AND before render |
| Customer-submitted content (reviews, enquiry messages) | Store as plain text; render as plain text — no HTML interpretation |
| JSON API responses | Use `Content-Type: application/json` — prevents browser MIME sniffing |

### 3.4 Content Security Policy `P0`

Add to `next.config.js` or middleware:

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'nonce-{NONCE}' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https://cdn.nava.in https://*.cloudinary.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://api.razorpay.com https://vitals.vercel-insights.com",
      "frame-src https://api.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];
```

> [!NOTE]
> Next.js App Router does not support nonce-based CSP in middleware easily. Use `next-safe-headers` or static CSP with a strict allowlist. Avoid `unsafe-inline` for scripts.

### 3.5 Rich Text Sanitisation `P1`

```typescript
// Server-side sanitisation before storing admin-authored HTML
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

function sanitiseRichText(dirty: string): string {
  return purify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li', 'h2', 'h3', 'a', 'img'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title'],
    ALLOW_DATA_ATTR: false,
  });
}
```

---

## 4. File Upload Security

> [!CAUTION]
> File uploads are one of the highest-risk features. Every requirement in this section is P0.

### 4.1 Allowed Types & Size Limits `P0`

| Upload Context | Allowed MIME Types | Max Size | Storage |
|----------------|-------------------|----------|---------|
| Product images (admin) | `image/jpeg`, `image/png`, `image/webp` | **5 MB** | Public CDN bucket (after processing) |
| Enquiry reference photos (customer) | `image/jpeg`, `image/png`, `image/webp` | **10 MB** | Private object storage bucket |

### 4.2 Server-Side MIME Validation `P0`

> [!IMPORTANT]
> Never trust the `Content-Type` header or the file extension for type validation — both are trivially spoofed. Always read the file's magic bytes.

```typescript
import { fileTypeFromBuffer } from 'file-type'; // reads magic bytes

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

async function validateUpload(buffer: Buffer): Promise<void> {
  // 1. Size check (buffer.length is already enforced at upload layer)
  if (buffer.length > 5 * 1024 * 1024) throw new Error('File too large');

  // 2. Magic byte check — not Content-Type header
  const type = await fileTypeFromBuffer(buffer);
  if (!type || !ALLOWED_IMAGE_TYPES.has(type.mime)) {
    throw new Error('Invalid file type');
  }
}
```

### 4.3 Storage Security `P0`

| Requirement | Implementation |
|-------------|---------------|
| **Rename on upload** | Generate UUID filename: `${crypto.randomUUID()}.jpg` — never use original filename |
| **Private enquiry bucket** | Customer attachments: bucket policy denies all public GetObject |
| **Pre-signed URLs** | Generate time-limited (15-minute) pre-signed URLs for customer to download their attachments |
| **Public product CDN** | Product images published to CDN only after admin approval |
| **Separate domain** | Files served from `cdn.nava.in` or `assets.nava.in` — not `nava.in` (prevents cookie access) |
| **Path traversal prevention** | Storage key = `products/{uuid}.{ext}` — never include any user input in storage path |
| **EXIF stripping** | Process images through `sharp` before storage — strips EXIF data (GPS coordinates, device info) |
| **No execution** | Object storage never executes uploaded files; ensure bucket has no Lambda triggers for public uploads |

### 4.4 Antivirus Scanning `P1`

For customer enquiry attachments:
- Option A (self-hosted): ClamAV as a sidecar service — scan buffer before storage
- Option B (cloud): AWS GuardDuty Malware Protection for S3, or VirusTotal API for small scale
- Reject and delete file if scan returns positive
- Log scan results for all uploads

### 4.5 Image Processing Pipeline `P0`

```typescript
import sharp from 'sharp';

async function processProductImage(inputBuffer: Buffer): Promise<Buffer> {
  return sharp(inputBuffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 }) // re-encode to strip embedded content
    .withMetadata(false)   // ← strips EXIF, ICC profiles, etc.
    .toBuffer();
}
```

---

## 5. Payment Security

> [!CAUTION]
> Payment security failures directly cause financial loss and regulatory liability. All items in this section are P0 launch blockers.

### 5.1 What Must Never Be Stored `P0`

| Data | Status |
|------|--------|
| Card numbers (PAN) | ❌ Never stored — ever |
| CVV / CVC | ❌ Never stored — ever |
| Card expiry dates | ❌ Never stored — ever |
| UPI PIN | ❌ Never stored — ever |
| Bank account passwords | ❌ Never stored — ever |
| Razorpay `razorpay_payment_id` | ✅ Store (reference ID only) |
| Order amount | ✅ Store server-side before payment |
| Payment status | ✅ Store; update only via verified webhook |

### 5.2 Server-Side Amount Calculation `P0`

```typescript
// ✅ Correct checkout flow
export async function createOrder(cartItems: CartItem[], sessionCustomerId: string) {
  // 1. Fetch current prices from DB — never from client
  const products = await db.product.findMany({
    where: { id: { in: cartItems.map(i => i.productId) } },
    include: { variants: true },
  });

  // 2. Calculate total server-side
  const subtotal = cartItems.reduce((sum, item) => {
    const variant = products
      .find(p => p.id === item.productId)?.variants
      .find(v => v.id === item.variantId);
    if (!variant) throw new Error(`Invalid variant: ${item.variantId}`);
    return sum + (variant.price * item.quantity);
  }, 0);

  const shipping = calculateShipping(subtotal); // server-side lookup
  const tax = calculateGST(products, subtotal); // server-side lookup
  const total = subtotal + shipping + tax;

  // 3. Store authoritative total in DB
  const order = await db.order.create({
    data: { customerId: sessionCustomerId, totalAmount: total, status: 'PENDING_PAYMENT' }
  });

  // 4. Create Razorpay order with DB amount — not client amount
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(total * 100), // paise
    currency: 'INR',
    receipt: order.id,
  });

  return { orderId: order.id, razorpayOrderId: razorpayOrder.id };
}
```

### 5.3 Webhook Verification `P0`

```typescript
// /api/webhooks/razorpay/route.ts
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.text(); // raw body — not parsed JSON
  const signature = request.headers.get('x-razorpay-signature');

  // 1. Verify HMAC-SHA256 signature FIRST — before any processing
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (!crypto.timingSafeEqual(
    Buffer.from(signature ?? ''),
    Buffer.from(expectedSignature)
  )) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);

  // 2. Idempotency — reject already-processed events
  const eventId = event.payload?.payment?.entity?.id;
  const existing = await db.processedWebhookEvent.findUnique({ where: { eventId } });
  if (existing) return new Response('Already processed', { status: 200 });

  // 3. Mark as processed atomically, then handle
  await db.$transaction([
    db.processedWebhookEvent.create({ data: { eventId, processedAt: new Date() } }),
    handlePaymentEvent(event),
  ]);

  return new Response('OK', { status: 200 });
}
```

> [!WARNING]
> Use `crypto.timingSafeEqual()` for HMAC comparison — not `===`. String comparison is timing-attack vulnerable.

### 5.4 Payment State Machine `P0`

```
PENDING_PAYMENT → PAYMENT_CAPTURED → PROCESSING → SHIPPED → DELIVERED
                ↓                  ↓
           PAYMENT_FAILED     CANCELLED (before ship)
                                   ↓
                              REFUND_INITIATED → REFUNDED
```

**Rules:**
- State transitions are only valid in the direction shown — no backward skips
- DELIVERED orders cannot be CANCELLED without a refund workflow
- PAYMENT_CAPTURED → PAYMENT_FAILED transition is invalid (cannot un-capture)
- Validate state transition server-side before any update: `isValidTransition(current, next)`

### 5.5 PCI-DSS Scope Reduction `P0`

By using **Razorpay Standard Checkout** (hosted payment page / Razorpay.js):
- Card data never touches NAVA servers
- PCI-DSS scope is reduced to **SAQ A** (simplest self-assessment — primarily about HTTPS and basic policies)
- Key obligation: ensure the payment form is embedded via official Razorpay SDK, not a custom form

> [!NOTE]
> Maintaining SAQ A compliance requires: HTTPS on all pages, no card data logged anywhere, quarterly external vulnerability scans, and an annual self-assessment questionnaire. Document this for the Owner.

---

## 6. Infrastructure Security

### 6.1 TLS & HTTPS `P0`

| Requirement | Specification |
|-------------|--------------|
| TLS version | TLS 1.2 minimum; TLS 1.3 preferred |
| Certificate | Let's Encrypt or Vercel managed certificate (auto-renew) |
| HSTS | `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (2 years) |
| Mixed content | Disallow — all resources (images, scripts, fonts) over HTTPS |
| Certificate monitoring | Alert 30 days before expiry |

### 6.2 Security Headers `P0`

```javascript
// next.config.js — apply to all responses
const headers = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'X-XSS-Protection', value: '0' }, // disable legacy XSS filter — CSP handles it
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];
```

Verify headers at [securityheaders.com](https://securityheaders.com) — target **A or A+** rating.

### 6.3 Rate Limiting `P0`

**Use `@upstash/ratelimit` with Redis (or Vercel KV) for distributed rate limiting.**

| Endpoint | Limit | Window | Scope |
|----------|-------|--------|-------|
| POST /api/auth/login | 5 requests | 1 minute | Per IP + per username |
| POST /api/auth/reset-password | 3 requests | 1 hour | Per email + per IP |
| POST /api/checkout | 10 requests | 1 minute | Per user session |
| GET /api/products (search) | 60 requests | 1 minute | Per IP |
| POST /api/enquiries | 5 requests | 10 minutes | Per IP |
| POST /api/auth/totp-verify | 5 attempts | 5 minutes | Per user (lockout on fail) |
| General API | 300 requests | 1 minute | Per IP |

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
});

// In login route:
const { success, limit, remaining } = await ratelimit.limit(`login:${ip}`);
if (!success) {
  return Response.json({ error: 'Too many attempts' }, {
    status: 429,
    headers: { 'Retry-After': '60' },
  });
}
```

### 6.4 Database Security `P0`

| Requirement | Specification |
|-------------|--------------|
| **Network access** | PostgreSQL accessible only from application subnet — no public IP |
| **Application DB user** | `nava_app` user with GRANT SELECT, INSERT, UPDATE, DELETE on specific tables — no CREATE, DROP, TRUNCATE, GRANT |
| **Superuser prohibition** | Application never connects as `postgres` or any superuser |
| **Connection string** | In environment variable only — never hardcoded or in config files |
| **Connection pooling** | PgBouncer (transaction mode) or Neon serverless pooler — prevents connection exhaustion |
| **Statement timeout** | `SET statement_timeout = '10s'` on connection — prevents long-running queries from blocking |
| **SSL connection** | `sslmode=require` in connection string |
| **Backups** | Daily automated backups, 30-day retention; weekly restore test |

### 6.5 Secrets Management `P0`

> [!CAUTION]
> A single leaked API key (Razorpay, database URL, SMTP password) can result in financial loss, data breach, or complete system compromise.

| Requirement | Implementation |
|-------------|---------------|
| **Never hardcode secrets** | No secrets in source code, config files, or comments |
| **Never commit secrets** | `.env`, `.env.local`, `.env.production` in `.gitignore` |
| **Never use `NEXT_PUBLIC_` for secrets** | That prefix exposes variables in the client bundle |
| **Production secret store** | Vercel Environment Variables dashboard (encrypted at rest) or Doppler |
| **Secret rotation** | Rotate all secrets if ever exposed; rotate payment webhook secrets quarterly |
| **Pre-commit hook** | `gitleaks` or `git-secrets` to block accidental commits |
| **CI secret scan** | Run `gitleaks detect` in CI on every push |
| **Audit git history** | Run `gitleaks detect --source .` before first production deploy |

**Required environment variables** (never to be `NEXT_PUBLIC_`):
```
DATABASE_URL
RAZORPAY_KEY_ID           # server-side only
RAZORPAY_KEY_SECRET       # server-side only
RAZORPAY_WEBHOOK_SECRET   # server-side only
SESSION_SECRET
SMTP_PASSWORD
WHATSAPP_API_TOKEN
NEXT_AUTH_SECRET
```

### 6.6 Dependency Security `P1`

| Requirement | Implementation |
|-------------|---------------|
| `npm audit` in CI | Block deployment on `critical` or `high` severity findings |
| Dependabot | `.github/dependabot.yml` configured for weekly npm updates |
| Lock file | `package-lock.json` committed and verified in CI (`npm ci` not `npm install`) |
| Peer review for new deps | Evaluate any new package: downloads, maintenance, known CVEs, install scripts |
| Snyk / Socket.dev | `P2`: deeper supply chain analysis beyond `npm audit` |

---

## 7. Privacy & Data Protection (DPDPA 2023)

> [!WARNING]
> The Digital Personal Data Protection Act 2023 (DPDPA) is in force in India. NAVA CREATIONS must comply as a data fiduciary. This section flags key obligations — **engage a legal professional for formal compliance review before launch.**

### 7.1 PII Inventory

| Field | Location | Purpose | Retention | Sensitive? |
|-------|----------|---------|-----------|-----------|
| Full name | `customers.full_name` | Delivery, personalisation | Account lifetime + 7 years (GST) | No |
| Email address | `customers.email` | Auth, comms | Account lifetime + 7 years | No |
| Phone number | `customers.phone` | Delivery, WhatsApp, OTP | Account lifetime + 7 years | No |
| Delivery addresses | `customer_addresses` | Shipping | Account lifetime + 7 years | No |
| Order history | `orders`, `order_items` | Fulfilment, support | 7 years (GST requirement) | No |
| Payment reference IDs | `payments.gateway_payment_id` | Reconciliation | 7 years | No |
| Enquiry photos (attachments) | Private object storage | Customisation requests | 2 years after enquiry closed | Yes (private) |
| IP addresses (logs) | Log aggregator | Security, rate limiting | 90 days | Moderate |
| Session data | Redis / DB sessions | Auth | Per TTL (7 days) | Yes |
| Wishlist | `wishlists` | UX | Account lifetime | No |
| Consent records | `consent_records` | Compliance | Lifetime + 7 years | No |
| Admin user data | `admin_users` | Access control | Employment + 7 years | Yes |

### 7.2 Data Minimisation `P0`

- **Do not** collect: date of birth, gender, social media handles, location (beyond delivery address), device fingerprints (beyond what analytics requires)
- Request only the minimum fields necessary for each transaction
- Make phone number optional for customer accounts where delivery is not required

### 7.3 Consent Management `P1`

| Requirement | Implementation |
|-------------|---------------|
| Consent at registration | Checkbox: "I agree to the [Privacy Policy] and [Terms of Service]" — both links open in new tab |
| Marketing consent | Separate opt-in checkbox — not pre-checked — for WhatsApp/email marketing |
| Consent records | Store: `customer_id`, `consent_type`, `consented_at`, `ip_address`, `consent_text_version` |
| Consent withdrawal | "Manage preferences" in account settings — unsubscribe in 10 business days |
| Cookie consent | Cookie banner for analytics/marketing cookies (not strictly necessary cookies) |

### 7.4 Data Retention Policy `P1`

| Data Type | Retention | Basis |
|-----------|-----------|-------|
| Order records & invoices | **7 years** from transaction date | GST Act requirement |
| Customer PII (account) | Account lifetime + 1 year after deletion request | DPDPA, operational |
| Payment reference IDs | 7 years | GST / RBI requirement |
| Customer enquiry attachments | 2 years after enquiry closed | Operational |
| Session data | TTL per session (max 7 days) | Operational |
| Audit logs | 2 years | Security, compliance |
| IP address logs | 90 days | Security |
| Marketing consent records | 7 years | DPDPA evidence |
| Deleted account data | Anonymise within 30 days of deletion (keep order records anonymised) | DPDPA |

### 7.5 Rights Management `P1`

| Right | Implementation |
|-------|---------------|
| **Right to access** | Customer can download their data from account settings ("Download my data" — JSON export of orders, addresses, wishlist, consent records) |
| **Right to correction** | Customer can edit name, email, phone, addresses in account settings |
| **Right to erasure (deletion)** | Customer can request account deletion. Anonymise PII fields; retain anonymised order records for GST compliance (7 years). Notify within 30 days. |
| **Right to withdraw consent** | Unsubscribe from marketing; withdraw non-essential data processing. Must process within 10 business days (DPDPA obligation). |
| **Right to grievance redressal** | Publish a Data Protection Officer (DPO) contact — or designate the Owner as contact — for data-related complaints. 30-day response SLA. |

> [!IMPORTANT]
> Under DPDPA 2023, right to erasure is **not absolute**. Orders must be retained for 7 years for GST compliance. Deletion must anonymise PII but preserve transactional records. Document this clearly in the Privacy Policy.

### 7.6 Data Breach Response Plan `P0`

```
Detection (automated alerts / security monitoring)
  ↓ within 24 hours
Containment (isolate affected systems, revoke compromised credentials)
  ↓ within 48 hours
Assessment (what data, how many customers, root cause)
  ↓ within 72 hours
DPDPA Notification obligation:
  - Notify Data Protection Board of India (DPBI) of significant breaches
  - Notify affected customers if their data was exposed
  - Exact timelines to be confirmed once DPDPA Rules are notified — flag for legal review
  ↓
Remediation (patch, rotate credentials, improve controls)
  ↓
Post-incident review (update threat model, security requirements)
```

**Breach severity classification:**

| Severity | Criteria | Response |
|----------|----------|----------|
| Critical | PII of >100 customers exposed; payment data exposed | Owner + legal counsel within 2 hours |
| High | PII of <100 customers exposed; admin credentials compromised | Owner within 4 hours |
| Medium | Logs exposed; limited operational data | Owner within 24 hours |
| Low | No PII exposed; operational disruption only | Document and review |

### 7.7 Key DPDPA 2023 Obligations `P1`

> [!WARNING]
> DPDPA 2023 is enacted but Rules are pending notification. Obligations below are from the Act text. Engage a qualified data protection lawyer before launch.

| Obligation | Requirement |
|------------|------------|
| Lawful basis | Consent is the primary basis for processing customer PII |
| Notice | Clear, plain-language privacy notice at the point of data collection |
| Purpose limitation | Data collected for checkout cannot be used for unrelated purposes |
| Data localisation | DPDPA does not impose blanket localisation; certain sectors may have additional requirements — verify |
| Children's data | Do not knowingly process data of children under 18 without verifiable parental consent |
| Significant data fiduciary | If turnover / data volume thresholds are met (Rules pending), additional obligations apply |
| DPO designation | May be required for significant data fiduciaries; proactively designate a contact person |

---

## 8. Security Acceptance Checklist

> [!IMPORTANT]
> This is a **go/no-go** checklist for production launch. All `P0` items must be checked before the site goes live. `P1` items must be completed within the first sprint after launch.

### P0 — Launch Blockers

- [ ] **AUTH-01** All protected endpoints require authentication; unauthenticated requests return 401/302, not data
- [ ] **AUTH-02** Admin dashboard (`/admin/*`) returns 302 to login for unauthenticated requests
- [ ] **AUTH-03** MFA (TOTP) is enabled and enforced for the Owner account
- [ ] **AUTH-04** Session cookies have `HttpOnly`, `Secure`, and `SameSite=Strict` flags
- [ ] **AUTH-05** Password hashing uses bcrypt cost 12 (verify by checking hash prefix `$2b$12$`)
- [ ] **SQL-01** No `$queryRawUnsafe` calls in codebase (`grep -r queryRawUnsafe src/`)
- [ ] **SQL-02** SQL injection tested: automated (`npm run test:security`) + manual on search, filters, sort params
- [ ] **XSS-01** `dangerouslySetInnerHTML` usage reviewed and sanitised with DOMPurify (`grep -r dangerouslySetInner src/`)
- [ ] **XSS-02** XSS tested in all text input fields (product search, review, enquiry message)
- [ ] **CSP-01** Content Security Policy header present and validated (no `unsafe-eval`, strict `script-src`)
- [ ] **CSRF-01** CSRF protection verified on all state-changing routes (SameSite=Strict confirmed)
- [ ] **UPLOAD-01** File upload tested with: `.php` file, `.js` file, file >5MB, mismatched extension/MIME type
- [ ] **UPLOAD-02** Uploaded files stored with UUID names, never original filename
- [ ] **UPLOAD-03** Customer enquiry attachments are in private bucket (verify: attempt direct URL access returns 403)
- [ ] **PAY-01** Payment webhook HMAC signature verification present and tested in code
- [ ] **PAY-02** Webhook verified with forged signature — confirm 400 response with no processing
- [ ] **PAY-03** Payment amount tamper tested: modified client amount results in DB amount being used
- [ ] **PAY-04** Order total recalculated server-side — no client price fields trusted
- [ ] **RBAC-01** Admin RBAC tested with each role attempting access to unauthorized function — confirm 403
- [ ] **RBAC-02** Customer cross-account access tested (Customer A accessing Customer B's order) — confirm 404
- [ ] **RATE-01** Rate limiting on login endpoint verified (6th request within 1 minute returns 429)
- [ ] **RATE-02** Rate limiting on password reset verified
- [ ] **SECRET-01** No secrets in codebase: `gitleaks detect --source .` returns 0 findings
- [ ] **SECRET-02** No `NEXT_PUBLIC_` env vars with secrets: `grep -r NEXT_PUBLIC_ .env*`
- [ ] **SECRET-03** `.env` and `.env.local` files are in `.gitignore`
- [ ] **HEADER-01** Security headers present on all responses: verify with [securityheaders.com](https://securityheaders.com) — minimum grade A
- [ ] **HTTPS-01** HTTPS enforced on all pages; HTTP redirects to HTTPS
- [ ] **HTTPS-02** HSTS header present with `max-age=63072000`
- [ ] **ERR-01** Error messages do not leak stack traces, table names, or DB structure — test with malformed inputs
- [ ] **ERR-02** `NODE_ENV=production` set in deployment
- [ ] **AUDIT-01** Audit log captures all admin actions (verify by performing an admin action and checking log)

### P1 — Pre-Launch (Complete within first sprint)

- [ ] **BACKUP-01** Automated database backups configured and verified with a test restore
- [ ] **BACKUP-02** Backups stored in encrypted private bucket
- [ ] **MFA-02** TOTP MFA configured for all admin accounts (all roles, not just Owner)
- [ ] **DEP-01** `npm audit` returns 0 critical/high vulnerabilities
- [ ] **DEP-02** GitHub Dependabot configured (`.github/dependabot.yml`)
- [ ] **DPDPA-01** Privacy Policy published, reviewed by a legal professional
- [ ] **DPDPA-02** Cookie consent banner live for non-essential cookies
- [ ] **DPDPA-03** "Download my data" and "Delete my account" flows functional
- [ ] **ZAP-01** OWASP ZAP baseline scan run; critical findings resolved
- [ ] **LOG-01** Logs shipping to external aggregator (Logtail / Datadog / Axiom)
- [ ] **SCAN-01** CodeQL or ESLint security rules configured in CI

### P2 — Post-Launch

- [ ] **PENTEST-01** External penetration test commissioned within 3 months of launch
- [ ] **AV-01** Antivirus scanning for enquiry file attachments implemented
- [ ] **SNYK-01** Snyk or Socket.dev integrated for deeper supply chain analysis
- [ ] **BREACH-01** Formal breach response runbook documented and rehearsed
- [ ] **DPO-01** Formal DPO designation and contact page published

---

## 9. Security Testing Plan

### 9.1 Static Analysis (SAST) `P1`

| Tool | Purpose | Integration |
|------|---------|-------------|
| **ESLint + `eslint-plugin-security`** | Detect: `eval()`, unsafe regex, path traversal, `child_process`, `innerHTML` | Pre-commit + CI |
| **CodeQL** | Deep semantic analysis: SQLi, XSS, path traversal, prototype pollution | GitHub Actions (`.github/workflows/codeql.yml`) |
| **`gitleaks`** | Secret scanning in code and git history | Pre-commit hook + CI |
| **TypeScript strict mode** | Type safety reduces injection risk | Build |

```yaml
# .github/workflows/security.yml (CodeQL)
name: Security Analysis
on: [push, pull_request]
jobs:
  codeql:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with: { languages: javascript-typescript }
      - uses: github/codeql-action/analyze@v3
```

### 9.2 Dynamic Analysis (DAST) `P1`

**OWASP ZAP Baseline Scan:**
```bash
# Run against staging environment
docker run -v $(pwd):/zap/wrk/:rw \
  ghcr.io/zaproxy/zaproxy:stable \
  zap-baseline.py -t https://staging.nava.in -r zap-report.html
```

Target: 0 high-severity findings before launch. Document and remediate all medium findings.

### 9.3 Manual Penetration Testing Checklist `P1`

**Scope:** Staging environment (not production), with written authorisation.

| Category | Test Cases |
|----------|-----------|
| **Authentication** | Brute force (observe rate limiting and CAPTCHA), password reset token prediction, session fixation, concurrent sessions |
| **Authorization** | RBAC boundary testing (all role pairs), IDOR on orders/addresses/wishlist, horizontal privilege escalation |
| **Injection** | SQLi in search, filters, sort, all form fields; command injection; template injection |
| **XSS** | Reflected, stored (product descriptions, reviews, blog, enquiries), DOM-based |
| **CSRF** | State-changing requests without SameSite cookie |
| **File Upload** | Malicious file types, path traversal in filenames, oversized files, MIME spoofing |
| **Payment** | Amount tampering, webhook spoofing, coupon abuse, race conditions |
| **Business Logic** | Negative quantity orders, coupon stacking, out-of-stock purchase race |
| **API** | Excessive data exposure in API responses, mass assignment, unversioned API enumeration |
| **Infrastructure** | HTTP headers, TLS configuration (use `testssl.sh`), directory listing |

### 9.4 When to Get External Security Review `P2`

Engage an external penetration tester or security firm when:
- Before launch if annual revenue exceeds ₹1 crore (significant financial risk)
- After any major feature addition (new payment flow, new file upload, new admin capabilities)
- After any security incident
- Annually as a matter of good practice
- When DPDPA Rules notify formal audit requirements for your data fiduciary tier

**Estimated cost:** ₹50,000–₹2,00,000 for a focused web application pentest from a reputable Indian security firm (SilentBreach, Kloudle, Payatu, or international firms with India presence).

---

## 10. Control Mapping Table

| Control | Threats Mitigated (from THREAT_MODEL.md) | OWASP ASVS Reference | Priority |
|---------|------------------------------------------|----------------------|----------|
| Rate limiting + progressive delays | T01, T02, T13, T20 | ASVS 2.2 | P0 |
| bcrypt cost 12 | T01 | ASVS 2.4 | P0 |
| TOTP MFA | T01, T04, T21 | ASVS 2.8 | P0 |
| Session rotation on login | T16 | ASVS 3.3 | P0 |
| HttpOnly + Secure + SameSite cookies | T07, T16 | ASVS 3.4 | P0 |
| RBAC middleware + service layer | T03, T04 | ASVS 4.1 | P0 |
| UUID resource identifiers | T15 | ASVS 4.2 | P0 |
| Zod input validation | T05, T08, T14 | ASVS 5.1 | P0 |
| Prisma parameterised queries | T05 | ASVS 5.3 | P0 |
| DOMPurify rich text sanitisation | T06 | ASVS 5.3 | P0 |
| Content Security Policy | T06 | ASVS 14.4 | P0 |
| Magic-byte MIME validation | T09 | ASVS 12.1 | P0 |
| UUID file rename on upload | T09 | ASVS 12.3 | P0 |
| Private bucket for enquiry attachments | T09, T24 | ASVS 12.4 | P0 |
| HMAC webhook verification | T10 | ASVS 10.3 | P0 |
| Server-side amount calculation | T11, T14 | ASVS 11.1 | P0 |
| DB row-level locking (`SELECT FOR UPDATE`) | T12 | ASVS 11.1 | P0 |
| Atomic coupon decrement | T13 | ASVS 11.1 | P0 |
| Generic error responses | T17 | ASVS 7.4 | P0 |
| npm audit in CI | T18 | ASVS 10.1 | P1 |
| `gitleaks` + no `NEXT_PUBLIC_` for secrets | T19 | ASVS 2.10 | P0 |
| Cloudflare WAF + edge rate limiting | T20, T22 | ASVS 13.1 | P0 |
| Structured JSON logging (Pino) | T25 | ASVS 7.3 | P1 |
| PostgreSQL private network + least-privilege | T23 | ASVS 8.3 | P0 |
| Encrypted private backup bucket | T24 | ASVS 8.3 | P1 |
| HSTS + TLS 1.2+ | All network threats | ASVS 9.1 | P0 |
| Security headers | T06, T07 | ASVS 14.4 | P0 |

---

*This document is a living specification. Update when: new features are planned, threat model is revised, security incidents occur, or new DPDPA Rules are notified. Review at minimum every 6 months.*

---

**Related Documents:**
- [`THREAT_MODEL.md`](./THREAT_MODEL.md) — STRIDE threat catalogue and risk matrix
- [`../../architecture/ARCHITECTURE.md`](../../architecture/ARCHITECTURE.md) — System architecture (if exists)
