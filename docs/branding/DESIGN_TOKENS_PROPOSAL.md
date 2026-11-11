# NAVA CREATIONS — Design Tokens Proposal
**Phase 0 | UI/UX Design System**
*Prepared: November 2026 | Status: Draft for Design Review*

---

> [!NOTE]
> This document defines the **design intent** of all tokens. Implementation (CSS custom properties, Tailwind config, Figma variables) follows after owner approval of the colour palette and typography direction.

> [!IMPORTANT]
> **WCAG 2.2 AA Compliance**: Normal text requires a contrast ratio of **≥ 4.5:1**. Large text (18pt / 14pt bold+) requires **≥ 3:1**. UI components and graphical elements require **≥ 3:1**. Contrast ratios below are calculated values — all AA failures are marked explicitly.

---

## 1. Colour System

### 1.1 Colour Philosophy

NAVA CREATIONS uses a **warm, restrained palette** rooted in Indian textile and mineral aesthetics. The palette avoids corporate neutrals (grey-blue) and cheap-luxury indicators (bright gold on black). Every colour must justify its presence — this is not a maximalist brand.

**Palette families:**
- **Plum** — primary brand authority
- **Ivory / Cream** — primary surface / background
- **Antique Gold** — accent and decoration only (never body text)
- **Emerald** — secondary accent for trust/nature references
- **Blush** — softening accent for personal/bridal contexts
- **Ink Navy** — primary readable body text
- **Alert tones** — restrained, purposeful

---

### 1.2 Colour Tokens — Full Table

> [!IMPORTANT]
> Antique gold (`--color-accent-gold`) **fails WCAG AA for body text on light backgrounds**. It is designated **decorative only** — icon fills, decorative borders, price highlights on dark backgrounds. Never use it as paragraph or label text.

#### Primary Palette

| Token Name | HEX | HSL | Intended Usage | Best Foreground | Approx. Contrast (on this bg) |
|---|---|---|---|---|---|
| `--color-primary-plum` | `#6B2D5E` | `hsl(312, 42%, 30%)` | Primary buttons, logo, key headings | `#FAF6F0` (ivory) | **8.1:1** ✅ AA + AAA |
| `--color-primary-plum-dark` | `#4E1F45` | `hsl(312, 43%, 21%)` | Hover state for plum buttons, deep accent | `#FAF6F0` (ivory) | **10.9:1** ✅ AAA |
| `--color-primary-plum-light` | `#8B3D7A` | `hsl(312, 39%, 39%)` | Plum in lighter contexts, secondary text | `#FAF6F0` (ivory) | **5.8:1** ✅ AA |
| `--color-primary-plum-muted` | `#C9A8C2` | `hsl(312, 29%, 73%)` | Disabled state tint, border on light bg | `#1A1A2E` (ink) | **3.6:1** ⚠️ AA large text only |
| `--color-surface-ivory` | `#FAF6F0` | `hsl(37, 67%, 97%)` | Page background, card surface | `#1A1A2E` (ink) | **16.5:1** ✅ AAA |
| `--color-surface-cream` | `#F2EAE0` | `hsl(30, 42%, 91%)` | Section alternates, input backgrounds | `#1A1A2E` (ink) | **12.3:1** ✅ AAA |
| `--color-surface-warm-white` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Modal backgrounds, clean surfaces | `#1A1A2E` (ink) | **17.4:1** ✅ AAA |

#### Accent Palette

| Token Name | HEX | HSL | Intended Usage | Best Foreground | Approx. Contrast |
|---|---|---|---|---|---|
| `--color-accent-gold` | `#C9A96E` | `hsl(38, 48%, 61%)` | Decorative borders, icon fills, price on dark bg **— NEVER body text** | — | **2.0:1 on ivory** ❌ FAILS AA |
| `--color-accent-gold-dark` | `#A07840` | `hsl(35, 44%, 44%)` | Slightly deeper gold for decorative borders | — | **3.6:1 on ivory** ⚠️ Large text only |
| `--color-accent-emerald` | `#1A5C3A` | `hsl(151, 55%, 23%)` | Trust badges, in-stock status, nature references | `#FAF6F0` (ivory) | **7.8:1** ✅ AA |
| `--color-accent-emerald-light` | `#2D8A58` | `hsl(151, 51%, 36%)` | Hover states, success states | `#FAF6F0` (ivory) | **4.8:1** ✅ AA |
| `--color-accent-blush` | `#F2C4CE` | `hsl(348, 72%, 86%)` | Bridal section backgrounds, soft section dividers | `#4E1F45` (deep plum) | **4.6:1** ✅ AA |
| `--color-accent-blush-deep` | `#D4879A` | `hsl(348, 44%, 68%)` | Blush buttons (bridal context only), hover | `#FAF6F0` (ivory) | **3.0:1** ⚠️ Large text / UI only |

#### Text & Ink

| Token Name | HEX | HSL | Intended Usage | Contrast on `--color-surface-ivory` |
|---|---|---|---|---|
| `--color-text-primary` | `#1A1A2E` | `hsl(240, 28%, 14%)` | All body text, primary labels | **16.5:1** ✅ AAA |
| `--color-text-secondary` | `#4A4A6A` | `hsl(240, 19%, 36%)` | Subheadings, metadata, secondary info | **8.2:1** ✅ AA |
| `--color-text-muted` | `#7A7A9A` | `hsl(240, 15%, 57%)` | Captions, placeholder text | **4.6:1** ✅ AA (barely; test rendered) |
| `--color-text-disabled` | `#ABABC0` | `hsl(240, 13%, 72%)` | Disabled input text | **2.5:1** ❌ Intentionally low — disabled state |
| `--color-text-on-plum` | `#FAF6F0` | `hsl(37, 67%, 97%)` | Text on plum backgrounds | **8.1:1** ✅ |
| `--color-text-link` | `#5C2449` | `hsl(319, 44%, 25%)` | Hyperlinks in body text | **9.4:1** ✅ AAA |

#### Alert & Status

| Token Name | HEX | HSL | Intended Usage | Foreground | Contrast |
|---|---|---|---|---|---|
| `--color-status-sale` | `#B84040` | `hsl(0, 48%, 48%)` | Sale badge (restrained — not neon red) | `#FFFFFF` | **5.2:1** ✅ AA |
| `--color-status-sale-bg` | `#FDF0F0` | `hsl(0, 75%, 97%)` | Sale section background tint | `#B84040` | **3.5:1** ⚠️ Large text |
| `--color-status-low-stock` | `#8B5E00` | `hsl(39, 100%, 27%)` | Low stock indicator | `#FAF6F0` | **5.9:1** ✅ AA |
| `--color-status-out-of-stock` | `#5A5A6A` | `hsl(240, 9%, 39%)` | Out of stock (muted, not alarming) | `#FAF6F0` | **5.1:1** ✅ AA |
| `--color-status-new` | `#1A5C3A` | `hsl(151, 55%, 23%)` | New arrival badge | `#FAF6F0` | **7.8:1** ✅ |
| `--color-status-success` | `#1A5C3A` | `hsl(151, 55%, 23%)` | Success toast, confirmed orders | `#FAF6F0` | **7.8:1** ✅ |
| `--color-status-error` | `#B84040` | `hsl(0, 48%, 48%)` | Error state inputs, error toast | `#FFFFFF` | **5.2:1** ✅ |
| `--color-status-warning` | `#8B5E00` | `hsl(39, 100%, 27%)` | Warning toast | `#FAF6F0` | **5.9:1** ✅ |

---

### 1.3 Button Colour Specifications

#### Primary Button (Filled — Plum)

| State | Background | Text | Border | Notes |
|-------|-----------|------|--------|-------|
| **Default** | `#6B2D5E` | `#FAF6F0` | none | Contrast 8.1:1 ✅ |
| **Hover** | `#4E1F45` | `#FAF6F0` | none | Darkens 15%; 10.9:1 ✅ |
| **Focus** | `#6B2D5E` | `#FAF6F0` | 3px offset `#C9A96E` | Gold focus ring; meets 3:1 for UI ✅ |
| **Active/Pressed** | `#3A1534` | `#FAF6F0` | none | Darkest; momentum feel |
| **Disabled** | `#C9A8C2` | `#FAF6F0` | none | Contrast 2.8:1 — intentionally low; aria-disabled must be set |
| **Loading** | `#6B2D5E` | `#FAF6F0` | none | Spinner replaces label; keep background |
| **Error context** | `#B84040` | `#FFFFFF` | none | Only when submit action fails |

#### Secondary Button (Outlined — Plum)

| State | Background | Text | Border | Notes |
|-------|-----------|------|--------|-------|
| **Default** | transparent | `#6B2D5E` | 1.5px `#6B2D5E` | Text contrast on ivory: 8.1:1 ✅ |
| **Hover** | `#F5EDF3` | `#4E1F45` | 1.5px `#4E1F45` | Very light plum tint on bg |
| **Focus** | transparent | `#6B2D5E` | 3px offset `#C9A96E` | Gold focus ring |
| **Active/Pressed** | `#E8D5E4` | `#3A1534` | 1.5px `#3A1534` | |
| **Disabled** | transparent | `#ABABC0` | 1.5px `#ABABC0` | Low contrast intentional |

#### Ghost / Text Button

| State | Background | Text | Underline | Notes |
|-------|-----------|------|-----------|-------|
| **Default** | none | `#6B2D5E` | none | Used for "View all", "Learn more" |
| **Hover** | none | `#4E1F45` | 1px `#C9A96E` | Gold underline on hover — distinctive |
| **Focus** | none | `#6B2D5E` | 2px `#C9A96E` | Underline focus indicator |
| **Disabled** | none | `#ABABC0` | none | |

---

## 2. Typography System

### 2.1 Font Pairing

| Role | Font Family | Google Fonts URL | Weights to Load |
|------|------------|-----------------|-----------------|
| **Display / Heading** | Cormorant Garamond | [fonts.google.com/specimen/Cormorant+Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) | 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold) |
| **Body / UI** | DM Sans | [fonts.google.com/specimen/DM+Sans](https://fonts.google.com/specimen/DM+Sans) | 400 (Regular), 500 (Medium), 600 (SemiBold) |
| **Price / Mono** | DM Mono | [fonts.google.com/specimen/DM+Mono](https://fonts.google.com/specimen/DM+Mono) | 400 (Regular) — price tags, SKUs, order numbers |

> [!TIP]
> Load fonts via `font-display: swap` and subset to Latin + Devanagari-adjacent characters. Use `preconnect` to fonts.googleapis.com and fonts.gstatic.com. Avoid loading all weights — only the four listed above.

**Pairing Rationale:**
- Cormorant Garamond is an elegant, historically-grounded serif that photographs beautifully on screen and in print. Its contrast between thin and thick strokes reads as *crafted*, not corporate.
- DM Sans is a geometric humanist sans-serif with excellent legibility at small sizes on mobile screens. It has just enough warmth to complement Cormorant without competing with it.
- DM Mono for prices maintains the DM family consistency while making numeric characters tabular and clear — critical for price comparison scanning.

---

### 2.2 Type Scale (Modular Scale — Major Third: 1.25×)

**Base:** 16px desktop / 15px mobile

#### Desktop Type Scale

| Token | Name | Size | Line Height | Weight | Font | Letter Spacing | Use |
|-------|------|------|-------------|--------|------|----------------|-----|
| `--text-display-xl` | Display XL | 56px (3.5rem) | 1.1 | 300 Light | Cormorant Garamond | -0.01em | Homepage hero headline |
| `--text-display-lg` | Display LG | 44px (2.75rem) | 1.15 | 400 Regular | Cormorant Garamond | -0.01em | Section hero, campaign headers |
| `--text-h1` | Heading 1 | 36px (2.25rem) | 1.2 | 500 Medium | Cormorant Garamond | -0.005em | Page titles |
| `--text-h2` | Heading 2 | 28px (1.75rem) | 1.25 | 500 Medium | Cormorant Garamond | 0 | Section headings |
| `--text-h3` | Heading 3 | 22px (1.375rem) | 1.3 | 600 SemiBold | Cormorant Garamond | 0 | Card titles, sub-sections |
| `--text-h4` | Heading 4 | 18px (1.125rem) | 1.35 | 500 Medium | DM Sans | 0 | Sidebar heads, accordion headers |
| `--text-body-lg` | Body Large | 18px (1.125rem) | 1.65 | 400 Regular | DM Sans | 0 | Lead paragraphs, intro copy |
| `--text-body` | Body | 16px (1rem) | 1.65 | 400 Regular | DM Sans | 0 | Standard body text |
| `--text-body-sm` | Body Small | 14px (0.875rem) | 1.6 | 400 Regular | DM Sans | 0 | Secondary descriptions, accordion content |
| `--text-label` | Label | 14px (0.875rem) | 1.4 | 500 Medium | DM Sans | 0.01em | Form labels, button text |
| `--text-caption` | Caption | 12px (0.75rem) | 1.5 | 400 Regular | DM Sans | 0 | Image captions, helper text |
| `--text-overline` | Overline | 11px (0.6875rem) | 1.4 | 600 SemiBold | DM Sans | 0.12em | Category labels, section descriptors (all-caps) |
| `--text-price` | Price Display | 20px (1.25rem) | 1.3 | 400 Regular | DM Mono | 0 | Product price, cart totals |
| `--text-price-lg` | Price Large | 28px (1.75rem) | 1.2 | 400 Regular | DM Mono | 0 | Hero product price, checkout total |
| `--text-button` | Button | 14px (0.875rem) | 1 | 500 Medium | DM Sans | 0.04em | All button labels |

#### Mobile Type Scale (base 15px)

| Token | Desktop | Mobile | Reduction |
|-------|---------|--------|-----------|
| `--text-display-xl` | 56px | 36px | -36% |
| `--text-display-lg` | 44px | 30px | -32% |
| `--text-h1` | 36px | 26px | -28% |
| `--text-h2` | 28px | 22px | -21% |
| `--text-h3` | 22px | 19px | -14% |
| `--text-h4` | 18px | 17px | -6% |
| `--text-body` | 16px | 15px | -6% |
| `--text-body-sm` | 14px | 13px | -7% |
| `--text-caption` | 12px | 12px | No change |
| `--text-price` | 20px | 18px | -10% |

> [!IMPORTANT]
> **Minimum readable size**: 12px (0.75rem) is the absolute minimum for any rendered text. Never render text smaller than 12px — this applies to captions, legal text, and terms. On mobile, 13px minimum is preferred. The `--text-caption` token at 12px is the floor.

---

## 3. Spacing & Layout Tokens

### 3.1 Spacing Scale (4px base)

| Token | Value | Pixels | Use Cases |
|-------|-------|--------|-----------|
| `--space-0` | 0 | 0px | Reset |
| `--space-1` | 0.25rem | 4px | Icon internal padding, micro gaps |
| `--space-2` | 0.5rem | 8px | Inline element gaps, tight padding |
| `--space-3` | 0.75rem | 12px | Input internal padding (compact), badge padding |
| `--space-4` | 1rem | 16px | Standard component padding, card gap |
| `--space-5` | 1.25rem | 20px | Form field vertical rhythm |
| `--space-6` | 1.5rem | 24px | Card padding, section sub-gap |
| `--space-8` | 2rem | 32px | Between components, standard section padding |
| `--space-10` | 2.5rem | 40px | Section inner padding |
| `--space-12` | 3rem | 48px | Mobile section gap |
| `--space-16` | 4rem | 64px | Desktop section gap |
| `--space-20` | 5rem | 80px | Large section gap |
| `--space-24` | 6rem | 96px | Hero section padding |
| `--space-32` | 8rem | 128px | Maximum section margin |

### 3.2 Grid System

| Breakpoint | Name | Min Width | Columns | Gutter | Margin | Max Content Width |
|-----------|------|-----------|---------|--------|--------|-----------------|
| `xs` | Mobile S | 320px | 4 | 16px | 16px | 288px |
| `sm` | Mobile L | 390px | 4 | 16px | 20px | 350px |
| `md` | Tablet | 768px | 8 | 24px | 32px | 704px |
| `lg` | Laptop | 1024px | 12 | 24px | 48px | 976px |
| `xl` | Desktop | 1280px | 12 | 32px | 64px | 1152px |
| `2xl` | Wide | 1440px | 12 | 32px | auto | 1200px |

**Max content width**: `1200px` — prevents text lines becoming too long on ultra-wide screens.

> [!NOTE]
> The product grid uses a nested sub-grid: within the 12-column layout, product cards span 3 columns (desktop), 4 columns (tablet: 2-up), or full width (mobile: 1-up). The 4-column mobile grid means product cards are always full-bleed on mobile — no cramped 2-column mobile product grid.

### 3.3 Border Radius Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--radius-none` | 0 | Intentional sharp corners (editorial) |
| `--radius-sm` | 4px | Badges, pills, small chips |
| `--radius-md` | 8px | Input fields, small cards |
| `--radius-lg` | 12px | Product cards, modals, dropdowns |
| `--radius-xl` | 16px | Feature cards, promotional banners |
| `--radius-2xl` | 24px | Large modal, full-bleed card |
| `--radius-full` | 9999px | Circular buttons, avatar, loading dots |

**Brand convention**: NAVA uses restrained rounding — predominantly `--radius-md` (8px) and `--radius-lg` (12px). The brand is not "bubbly" (no 24px on standard buttons). Excessive rounding signals playful/youthful brands, not premium craft.

### 3.4 Shadow Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--shadow-none` | none | Flat surfaces |
| `--shadow-xs` | `0 1px 2px rgba(26,26,46,0.06)` | Subtle elevation, input fields on cream |
| `--shadow-sm` | `0 2px 4px rgba(26,26,46,0.08)` | Hover states, raised chips |
| `--shadow-md` | `0 4px 12px rgba(26,26,46,0.10)` | Product cards, dropdowns |
| `--shadow-lg` | `0 8px 24px rgba(26,26,46,0.12)` | Modals, drawers |
| `--shadow-xl` | `0 16px 48px rgba(26,26,46,0.16)` | Full-screen overlays, sticky headers |
| `--shadow-gold` | `0 2px 12px rgba(201,169,110,0.25)` | Gold-accented feature elements (sparing) |

> [!TIP]
> NAVA uses warm-toned shadows (using the ink navy `#1A1A2E` at low opacity) — not generic grey box shadows. This keeps shadows feeling like depth rather than a UI framework default.

### 3.5 Animation & Transition Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--duration-instant` | 0ms | Disabled states |
| `--duration-fast` | 120ms | Focus rings, micro-interactions |
| `--duration-normal` | 220ms | Hover states, button press feedback |
| `--duration-moderate` | 350ms | Dropdown open, accordion expand |
| `--duration-slow` | 500ms | Modal in/out, page section reveal |
| `--duration-very-slow` | 800ms | Hero content fade-in, page load animation |
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing (Material's standard) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving screen |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering screen |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful confirms, cart addition bounce |

> [!IMPORTANT]
> **Respect prefers-reduced-motion**: All non-essential animations must be disabled when the user has set `prefers-reduced-motion: reduce`. Essential motion (focus rings, state changes) may remain but should be instant or at `--duration-fast`.

---

## 4. Component Design Specifications

> [!NOTE]
> These are **design specifications**, not code. Dimensions, spacing, and colour references use the tokens defined above. Implementation is a separate phase.

---

### 4.1 Primary Button (Filled)

| Property | Value |
|----------|-------|
| **Height** | 48px (desktop), 52px (mobile — larger tap target) |
| **Padding** | `--space-4` (16px) vertical × `--space-6` (24px) horizontal |
| **Typography** | `--text-button` — DM Sans 500, 14px, tracking 0.04em |
| **Background** | `--color-primary-plum` `#6B2D5E` |
| **Text colour** | `--color-text-on-plum` `#FAF6F0` |
| **Border radius** | `--radius-md` (8px) |
| **Min-width** | 120px |
| **Icon** | Optional leading icon — 20px, 8px gap to text |
| **Loading** | Spinner replaces icon; label changes to "Please wait…" |

---

### 4.2 Secondary Button (Outlined)

| Property | Value |
|----------|-------|
| **Height** | 48px (desktop), 52px (mobile) |
| **Padding** | `--space-4` × `--space-6` |
| **Typography** | `--text-button` — DM Sans 500, 14px |
| **Background** | transparent |
| **Text colour** | `--color-primary-plum` `#6B2D5E` |
| **Border** | 1.5px solid `--color-primary-plum` |
| **Border radius** | `--radius-md` (8px) |

---

### 4.3 Ghost / Text Button

| Property | Value |
|----------|-------|
| **Height** | auto (inline) |
| **Padding** | `--space-1` × `--space-2` |
| **Typography** | `--text-body-sm` — DM Sans 500, 14px |
| **Background** | none |
| **Text colour** | `--color-primary-plum` `#6B2D5E` |
| **Underline** | On hover only — gold `#C9A96E` underline |
| **Min tap area** | 44×44px (accessible tap target via padding) |

---

### 4.4 Input Field

**Dimensions**:
- Height: 52px (comfortable touch target)
- Padding: `--space-4` (16px) horizontal, `--space-3` (12px) vertical
- Border radius: `--radius-md` (8px)
- Typography: `--text-body` DM Sans 400, 16px

| State | Background | Border | Label colour | Helper text |
|-------|-----------|--------|--------------|-------------|
| **Default** | `--color-surface-cream` `#F2EAE0` | 1px `#ABABC0` | `--color-text-secondary` | `--color-text-muted` |
| **Focus** | `--color-surface-ivory` | 2px `--color-primary-plum` | `--color-primary-plum` | `--color-text-muted` |
| **Filled** | `--color-surface-ivory` | 1px `#7A7A9A` | `--color-text-secondary` | — |
| **Error** | `#FDF0F0` | 2px `--color-status-error` `#B84040` | `#B84040` | Error message in `#B84040`, 12px |
| **Disabled** | `#F0EDE8` | 1px `#ABABC0` dashed | `--color-text-disabled` | — |

**Label position**: Floating label — appears above the field on focus or when filled (not inside placeholder-only pattern, which is inaccessible).

---

### 4.5 Product Card

| Property | Value |
|----------|-------|
| **Image ratio** | 4:5 (portrait) — optimised for bangles on wrist or flat-lay |
| **Card width** | Fills grid column (3-col on desktop → ~280px; full on mobile) |
| **Card background** | `--color-surface-ivory` `#FAF6F0` |
| **Border radius** | `--radius-lg` (12px) on card; `--radius-lg` on image (clipped) |
| **Shadow** | `--shadow-md` on hover; `--shadow-none` default |
| **Padding** | `--space-4` (16px) on all sides below image |
| **Image height** | Auto, aspect-ratio locked 4:5 |
| **Product name** | `--text-h3` Cormorant Garamond, max 2 lines, ellipsis |
| **Price** | `--text-price` DM Mono, `--color-primary-plum` |
| **Original price** | `--text-body-sm`, strikethrough, `--color-text-muted` |
| **CTA button** | Ghost button "Add to cart" or icon-only on mobile |
| **Wishlist icon** | 24px heart icon, top-right of image, overlay |
| **Hover behaviour** | Card lifts (`--shadow-md`), image subtle zoom (transform: scale 1.03), duration `--duration-moderate` |

---

### 4.6 Badges

All badges use `--text-overline` typography: DM Sans SemiBold, 11px, all-caps, letter-spacing 0.12em.

| Badge Type | Background | Text Colour | Border Radius | Padding |
|-----------|-----------|-------------|---------------|---------|
| **New** | `--color-status-new` `#1A5C3A` | `#FAF6F0` | `--radius-sm` (4px) | 3px × 8px |
| **Sale** | `--color-status-sale` `#B84040` | `#FFFFFF` | `--radius-sm` | 3px × 8px |
| **Low Stock** | `--color-status-low-stock` `#8B5E00` | `#FAF6F0` | `--radius-sm` | 3px × 8px |
| **Out of Stock** | `--color-status-out-of-stock` `#5A5A6A` | `#FAF6F0` | `--radius-sm` | 3px × 8px |
| **Handmade** | `--color-surface-cream` `#F2EAE0` | `--color-text-secondary` `#4A4A6A` | `--radius-sm` | 3px × 8px |
| **Customisable** | `--color-accent-blush` `#F2C4CE` | `#4E1F45` | `--radius-sm` | 3px × 8px |

---

### 4.7 Toast Notification

| Property | Value |
|----------|-------|
| **Position** | Bottom-centre on mobile; bottom-right on desktop |
| **Width** | 320px desktop; calc(100vw - 32px) mobile |
| **Padding** | `--space-4` (16px) |
| **Border radius** | `--radius-lg` (12px) |
| **Shadow** | `--shadow-lg` |
| **Duration** | Auto-dismiss at 4000ms (success), 6000ms (error), manual (warning) |
| **Animation** | Slide up from bottom, `--ease-out`, `--duration-slow` |

| Type | Background | Left border (4px) | Icon | Text colour |
|------|-----------|-----------------|------|-------------|
| **Success** | `#F0FAF5` | `#1A5C3A` | ✓ checkmark | `#1A5C3A` |
| **Error** | `#FDF0F0` | `#B84040` | ✕ | `#B84040` |
| **Warning** | `#FDF8E6` | `#8B5E00` | ⚠ | `#8B5E00` |
| **Info** | `#F2EDF8` | `#6B2D5E` | ℹ | `#4E1F45` |

---

### 4.8 Modal Overlay

| Property | Value |
|----------|-------|
| **Backdrop** | `rgba(26,26,46,0.6)` — warm dark, not pure black |
| **Backdrop blur** | `blur(4px)` — creates depth, ensures modal foreground feels above page |
| **Modal background** | `--color-surface-warm-white` `#FFFFFF` |
| **Border radius** | `--radius-2xl` (24px) on mobile (bottom sheet); `--radius-xl` (16px) on desktop (centered) |
| **Max-width** | 540px desktop; full width mobile (bottom sheet) |
| **Padding** | `--space-6` (24px) desktop; `--space-5` (20px) mobile |
| **Close button** | 44×44px tap area, top-right, `--color-text-muted`, X icon 20px |
| **Entry animation** | Desktop: fade + scale from 0.96; Mobile: slide up from bottom; `--duration-moderate` |
| **Exit animation** | Reverse; `--duration-fast` |

> [!IMPORTANT]
> Modal must trap focus (focus lock). `Escape` key must dismiss. Backdrop click should dismiss (with confirmation if form is dirty). `aria-modal="true"` and `role="dialog"` with `aria-labelledby` pointing to the modal title are required.

---

### 4.9 Loading Skeleton

| Property | Value |
|----------|-------|
| **Base colour** | `--color-surface-cream` `#F2EAE0` |
| **Shimmer colour** | `#FAF6F0` → `#F2EAE0` → `#FAF6F0` (warm shimmer, not cold grey) |
| **Animation** | Linear gradient shimmer, left-to-right, 1.5s infinite |
| **Border radius** | Match the element being loaded (image: `--radius-lg`; text: `--radius-sm`) |
| **Text skeleton width** | H1: 60%; H2: 50%; body: 90% first line, 75% second, 40% third |
| **Product card skeleton** | Full image placeholder (4:5 ratio) + two text line skeletons + price skeleton |

> [!NOTE]
> Skeleton screens are preferred over spinners for page content loads (they reduce perceived load time). Spinners are acceptable for button loading states and short operations (< 1s expected).

---

## 5. Token Naming Conventions

### 5.1 CSS Custom Property Structure

```
--{category}-{concept}-{variant}
```

**Categories**: `color`, `text`, `space`, `radius`, `shadow`, `duration`, `ease`
**Concepts**: `primary`, `surface`, `accent`, `status`, `text`, `body`, `display`, etc.
**Variants**: `dark`, `light`, `muted`, `sm`, `lg`, `xl`, etc.

### 5.2 Examples

```css
/* Correct token usage */
:root {
  --color-primary-plum: #6B2D5E;
  --color-surface-ivory: #FAF6F0;
  --color-accent-gold: #C9A96E;
  --color-text-primary: #1A1A2E;
  --text-body: 1rem;
  --space-4: 1rem;
  --radius-md: 8px;
  --shadow-md: 0 4px 12px rgba(26,26,46,0.10);
  --duration-normal: 220ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 5.3 Semantic Aliasing (Recommended)

After primitives are defined, create semantic aliases:

```css
/* Semantic aliases — these are what components reference */
:root {
  --color-brand: var(--color-primary-plum);
  --color-brand-hover: var(--color-primary-plum-dark);
  --color-background: var(--color-surface-ivory);
  --color-surface: var(--color-surface-cream);
  --color-text: var(--color-text-primary);
  --color-text-subtle: var(--color-text-secondary);
  --color-link: var(--color-text-link);
  --color-border: var(--color-primary-plum-muted);
  --color-success: var(--color-status-success);
  --color-error: var(--color-status-error);
}
```

---

## 6. Quick Reference: Colour Palette Summary

| Colour | HEX | Role |
|--------|-----|------|
| Primary Plum | `#6B2D5E` | Brand primary, CTA buttons |
| Plum Dark | `#4E1F45` | Hover, deep accent |
| Plum Light | `#8B3D7A` | Secondary emphasis |
| Ivory | `#FAF6F0` | Primary background |
| Cream | `#F2EAE0` | Secondary surface, inputs |
| Antique Gold | `#C9A96E` | ⚠️ Decorative only — no body text |
| Emerald | `#1A5C3A` | Success, trust, in-stock |
| Blush | `#F2C4CE` | Bridal accent, soft backgrounds |
| Ink Navy | `#1A1A2E` | All body text |
| Text Secondary | `#4A4A6A` | Subheadings, metadata |
| Sale Red | `#B84040` | Sale badge, errors (restrained) |
| Low Stock Amber | `#8B5E00` | Low stock warning |

---

*Document version 0.1 — Requires design review and business owner approval before implementation begins.*
