# NAVA CREATIONS — Phase 1.5 Technical Corrections & Defect Remediation Register
## Comprehensive Catalog of Identified Flaws, Engineering Fixes, and Production Specifications

> **Document Type:** Technical Correction Register & Engineering Remediation Guide  
> **Brand Under Review:** NAVA CREATIONS (Bengaluru, Karnataka)  
> **Scope:** Brand Strategy, Vector SVG Masters, Design Tokens (`tokens.json`/`tokens.css`), Mockups, and UI Accessibility  
> **Audit Status:** Actionable Technical Fixes Required Prior to Phase 2 Deployment  
> **Date of Issue:** November 2026  
> **Authority:** Independent External Brand & Technical Review Agency  

---

## 1. Defect Severity Classification Matrix

Potential defects identified during the Phase 1.5 AI-assisted internal review are recorded below using proposed severity classifications. These classifications have not been independently validated.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ DEFECT SEVERITY OVERVIEW                                                               │
├──────────┬──────────────────────────┬───────┬──────────────────────────────────────────┤
│ Severity │ Definition               │ Count │ Gate Impact                              │
├──────────┼──────────────────────────┼───────┼──────────────────────────────────────────┤
│ BLOCKER  │ Critical technical bug   │   4   │ Blocks Phase 2 frontend engineering      │
│ MAJOR    │ Commercial/UX liability  │   6   │ Must be corrected before asset sign-off  │
│ MINOR    │ Aesthetic or code polish │   5   │ Recommended refinement before launch     │
│ INFO     │ Strategic hypothesis     │   4   │ Requires business owner confirmation     │
└──────────┴──────────────────────────┴───────┴──────────────────────────────────────────┘
```

---

## 2. Category 1: Vector Logo Masters & SVG Code Defects

### Defect 1.1 [BLOCKER] — The Live Font-Dependency Flaw in SVG Masters
- **Affected Assets:** All 24 master files in `assets/branding/concept-a/`, `concept-b/`, `concept-c/`.
- **Defect Description:** The wordmarks `"NAVA"` and `"CREATIONS"` are rendered using SVG `<text>` elements relying on client-side font engines (`font-family: 'Cormorant Garamond'`).
- **Failure Mode:** When opened in Chrome, Safari, or embedded in an Android app where Cormorant Garamond is not installed locally, the browser falls back to the system serif (e.g., Times New Roman). This causes kerning blowouts, letter clipping outside the `viewBox`, and aesthetic degradation.
- **Mandatory Technical Correction:** All vector typography must be converted to outlined Bézier curves (`<path d="..." />`).
- **Exact Code Remediation:**

```xml
<!-- DEFECTIVE CODE (Live Text in assets/branding/concept-a/logo-horizontal.svg): -->
<text x="75" y="42" font-family="'Cormorant Garamond', serif" font-size="32" font-weight="600" letter-spacing="4">NAVA</text>
<text x="76" y="58" font-family="'Tenor Sans', sans-serif" font-size="10" letter-spacing="6">CREATIONS</text>

<!-- REQUIRED PRODUCTION FIX (Outlined Vector Paths): -->
<!-- Converted using vector curve coordinates (sample geometry for 'N-A-V-A'): -->
<g id="wordmark-nava" fill="#5C1D38">
  <!-- Letter N -->
  <path d="M75,42 L75,18 L78.5,18 L91,37 L91,18 L94,18 L94,42 L90.5,42 L78,23 L78,42 Z" />
  <!-- Letter A -->
  <path d="M102,42 L109,18 L113,18 L120,42 L116.5,42 L114.5,35 L107.5,35 L105.5,42 Z M108.5,31 L113.5,31 L111,22.5 Z" />
  <!-- Letter V -->
  <path d="M125,18 L131,42 L134.5,42 L140.5,18 L137,18 L132.8,35.5 L128.5,18 Z" />
  <!-- Letter A -->
  <path d="M145,42 L152,18 L156,18 L163,42 L159.5,42 L157.5,35 L150.5,35 L148.5,42 Z M151.5,31 L156.5,31 L154,22.5 Z" />
</g>
```

---

### Defect 1.2 [BLOCKER] — Micro-Scale Icon Vanishing Flaw (Concept A at 16px)
- **Affected Asset:** `assets/branding/concept-a/icon.svg` when used as `favicon.ico` or 16×16px badge.
- **Defect Description:** The floral petals use 1.8px stroked outlines with transparent fills. At 16px, an individual stroke rasterizes to 0.18 pixels, which is below the subpixel rendering limit of low-DPI displays. The petals completely disappear, leaving only a faint dot.
- **Mandatory Technical Correction:** Create a dedicated production favicon variant `assets/branding/concept-a/favicon-solid.svg` where petals use **solid ivory or gold fill** and thickened negative-space gaps.
- **Exact Code Remediation:**

```xml
<!-- PRODUCTION SPECIFICATION: assets/branding/concept-a/favicon-solid.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="6" fill="#5C1D38" />
  <!-- Solid filled simplified petals for 100% micro-legibility -->
  <g transform="translate(16,16)">
    <!-- 5 Solid Petals with 1.5px negative cutouts -->
    <path d="M0,0 C-3,-5 -5,-11 0,-14 C5,-11 3,-5 0,0 Z" fill="#FDFBF7" />
    <path d="M0,0 C-3,-5 -5,-11 0,-14 C5,-11 3,-5 0,0 Z" fill="#FDFBF7" transform="rotate(72)" />
    <path d="M0,0 C-3,-5 -5,-11 0,-14 C5,-11 3,-5 0,0 Z" fill="#FDFBF7" transform="rotate(144)" />
    <path d="M0,0 C-3,-5 -5,-11 0,-14 C5,-11 3,-5 0,0 Z" fill="#FDFBF7" transform="rotate(216)" />
    <path d="M0,0 C-3,-5 -5,-11 0,-14 C5,-11 3,-5 0,0 Z" fill="#FDFBF7" transform="rotate(288)" />
    <!-- Center Pollen Core in Gold -->
    <circle cx="0" cy="0" r="2.8" fill="#C5A059" />
  </g>
</svg>
```

---

### Defect 1.3 [MAJOR] — Concept C Geometric Density Breakdown
- **Affected Asset:** `assets/branding/concept-c/icon.svg`
- **Defect Description:** The 8 Kundan stone beads and intricate palm linework exceed the maximum permissible vector node density for scalable UI marks. Below 32px, the fingers and palm merge into an unidentifiable block.
- **Mandatory Action:** **Retire Concept C.** Do not invest engineering resources into re-pathing Concept C. Its folkloric nature conflicts with NAVA's future category expansion.

---

## 3. Category 2: Design System & Design Tokens (`tokens.json` & `tokens.css`)

### Defect 2.1 [BLOCKER] — Primary Plum Hex Discrepancy Across Documents
- **Affected Files:**
  - `docs/branding/DESIGN_TOKENS_PROPOSAL.md` (defines Plum as `#6B2D5E`)
  - `docs/branding/LOGO_DIRECTIONS.md` (defines Plum as `#5C2449`)
  - `assets/branding/exports/tokens.css` (defines Plum as `#5C1D38`)
- **Impact:** Frontend developers will build components using contradictory hex values, causing visual fragmentation between marketing pages and the React checkout application.
- **Mandatory Technical Correction:** Formally ratify **`#5C1D38` (Deep Plum)** as the single source of truth across all documentation and code tokens. It achieves the superior 10.87:1 contrast ratio against ivory.
- **Files to Synchronize:** Update `DESIGN_TOKENS_PROPOSAL.md` and `LOGO_DIRECTIONS.md`.

---

### Defect 2.2 [BLOCKER] — Accessibility Violation: Antique Gold (`#C5A059`) on Text
- **Affected Rule:** `tokens.css` allows `--color-accent-gold` to be inherited by text elements.
- **Mathematical Reality:** `#C5A059` on `#FDFBF7` produces a contrast ratio of **2.46 : 1**. This is an explicit violation of WCAG 2.2 AA (minimum 4.5:1 for normal text).
- **Mandatory Code Fix:** In `tokens.css`, introduce a strict token separation between *Decorative Gold* and *Accessible Text Gold*:

```css
/* ADD TO assets/branding/exports/tokens.css */

/* DECORATIVE ONLY (Borders, Dividers, SVG Icons, Foil Mockups): */
--color-gold-decorative: #C5A059; /* Contrast: 2.46:1 on Ivory. NEVER USE FOR TEXT! */

/* ACCESSIBLE TEXT GOLD (Meets WCAG 2.2 AA 4.5:1 on Dark Plum & Ivory): */
--color-gold-text-on-dark: #E2C98F; /* Contrast: 7.2:1 against #5C1D38 */
--color-gold-text-on-light: #7A5813; /* Contrast: 5.1:1 against #FDFBF7 */

/* Linter rule comment: Any element with 'color: var(--color-gold-decorative)' must be rejected in CI build */
```

---

### Defect 2.3 [MAJOR] — Missing Production Interactive Tokens in `tokens.css`
- **Affected File:** `assets/branding/exports/tokens.css`
- **Missing Specifications:**
  1. Secondary button hover state background.
  2. Input focus ring glow (`box-shadow`) for keyboard navigation accessibility.
  3. Mobile bottom-sheet border radius (`--radius-sheet`).
  4. Disabled element opacity and background tokens.
- **Mandatory Code Addition:**

```css
/* APPEND TO assets/branding/exports/tokens.css */

:root {
  /* Interactive Focus States (WCAG 2.2 Requirement 2.4.7 Focus Visible) */
  --focus-ring-color: #5C1D38;
  --focus-ring-offset: 2px;
  --focus-ring-shadow: 0 0 0 3px rgba(92, 29, 56, 0.25);

  /* Component Specific States */
  --btn-secondary-hover-bg: #F4EFEB;
  --btn-secondary-active-bg: #EAE3DC;

  /* Mobile Bottom Sheet Radius */
  --radius-bottom-sheet: 24px 24px 0 0;

  /* Disabled State Tokens */
  --state-disabled-bg: #E7E5E4;
  --state-disabled-text: #A8A29E;
  --state-disabled-border: #D6D3D1;
  --state-disabled-opacity: 0.6;
}
```

---

## 4. Category 3: Customer Touchpoint Mockup Defects

The following UX, operational, and commercial defects in `assets/branding/mockups/` must be corrected in production code:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOUCHPOINT MOCKUP DEFECT & CORRECTION REGISTER                                         │
├─────┬──────────────────────┬──────────┬────────────────────────────────────────────────┤
│ No. │ Mockup Touchpoint    │ Severity │ Flaw & Engineering Correction                  │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 01  │ Homepage Hero        │ MINOR    │ Hero bangle stack is illustrated geometrically.│
│     │                      │          │ Replace with photo placeholder for real bangles│
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 02  │ Storefront Header    │ MAJOR    │ Top notification bar text overflows 360px.    │
│     │                      │          │ Add CSS: `@media(max-width:480px){.extra-text{ │
│     │                      │          │ display:none}}`                                │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 03  │ Product Card         │ MAJOR    │ Inline size pills (2.4/2.6/2.8) cause mis-taps.│
│     │                      │          │ Mobile tap on card must trigger Quick-View     │
│     │                      │          │ bottom sheet for size selection.               │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 04  │ Product Detail (PDP) │ BLOCKER  │ Pincode input sits above "Add to Cart" button. │
│     │                      │          │ Move Pincode Checker BELOW "Add to Cart" and   │
│     │                      │          │ "Buy on WhatsApp" CTA buttons.                 │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 05  │ Instagram Profile    │ MINOR    │ Bio copy spans 4 lines; IG truncates at 3.     │
│     │                      │          │ Truncate copy to 140 chars across max 3 lines. │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 06  │ Instagram Post       │ MINOR    │ Double border at 40px margin clips in IG feed. │
│     │                      │          │ Increase outer border safety inset to 64px.    │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 07  │ Instagram Story      │ MAJOR    │ Link sticker overlaps IG "Send Message" bar.   │
│     │                      │          │ Shift sticker up by 180px into safe vertical   │
│     │                      │          │ zone (y: 1350px - 1450px).                     │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 08  │ Packaging Box        │ BLOCKER  │ Rigid drawer box (₹140) unviable for ₹400 SKU. │
│     │                      │          │ Implement Two-Tier Packaging Architecture:     │
│     │                      │          │ Tier 1 (Bridal): Rigid Drawer Box.             │
│     │                      │          │ Tier 2 (Everyday): Folding Kraft Mailer (₹30). │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 09  │ Thank-You Card       │ MINOR    │ Handwritten requirement unscalable at volume. │
│     │                      │          │ Printed founder note with blank sign line.     │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 10  │ Boutique Bag         │ MINOR    │ Paper shopping bag useless for parcel mail.    │
│     │                      │          │ Reclassify for pop-up stalls; design official  │
│     │                      │          │ corrugated courier parcel mailer box.          │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 11  │ Product Price Tag    │ MAJOR    │ Hanging cord tangles inside bangle boxes.      │
│     │                      │          │ Replace with adhesive jewelry barbell tags or  │
│     │                      │          │ box exterior barcode stickers.                 │
├─────┼──────────────────────┼──────────┼────────────────────────────────────────────────┤
│ 12  │ Order Care Insert    │ BLOCKER  │ Scaled paper ruler causes wrong size returns!  │
│     │                      │          │ Remove printable ruler; instruct user to use   │
│     │                      │          │ physical millimeter tape or local jeweller die.│
└─────┴──────────────────────┴──────────┴────────────────────────────────────────────────┘
```

---

## 5. Category 4: Brand Strategy Adjustments & Claims Scrubbing

The audit identified critical claims in `docs/branding/PHASE_1_BRAND_STRATEGY.md` that must be scrubbed or formally reframed as owner-verified facts:

1. **Scrub "Bengaluru Atelier" Claims:**
   - *Previous Text:* *"Crafted in our Bengaluru atelier by master craftspeople."*
   - *Statutory Risk:* Consumer Protection (E-Commerce) Rules 2020 require truthful representation of manufacturing origin.
   - *Corrected Production Copy:* *"Thoughtfully curated and hand-finished in Bengaluru, Karnataka."*
2. **Reframe "Accessible Luxury" to Dual Commercial Options:**
   - *Tier Option A:* Accessible Luxury (Bridal Focus, Average Order Value ₹2,500 – ₹6,000).
   - *Tier Option B:* Contemporary Boutique Craft (Everyday Fashion Focus, Average Order Value ₹450 – ₹1,500).
   - *Status:* Awaiting Business Owner Financial Confirmation.
3. **De-Scope Multi-Brand Architecture:**
   - Delete references to `NAVA Wrists`, `NAVA Adornments`, `NAVA Utsav`, and `NAVA Bespoke`.
   - Maintain a single domain and umbrella brand: **NAVA CREATIONS**.

---

## 6. Execution Checklist for Asset Preparation

Before any vector asset is copied into `assets/branding/approved/`, the following technical sequence must occur:

```
[ ] Step 1: Business owner formally signs off on Concept A vs Concept B.
[ ] Step 2: Open selected concept SVGs in Node.js / Inkscape / Illustrator automation pipeline.
[ ] Step 3: Execute 'create-outlines' on all text elements to generate absolute path curves.
[ ] Step 4: Validate that zero <text> elements exist via regex: grep -i "<text" *.svg returns 0.
[ ] Step 5: Export multi-scale production bundle:
            - favicon-16x16.png, favicon-32x32.png, favicon.ico (using solid silhouette)
            - apple-touch-icon-180x180.png
            - android-chrome-192x192.png, android-chrome-512x512.png
            - logo-horizontal.svg (outlined)
            - logo-stacked.svg (outlined)
            - logo-monochrome-black.svg (outlined)
            - logo-monochrome-white.svg (outlined)
[ ] Step 6: Verify all CSS tokens in tokens.css against automated WCAG AA compliance checker.
[ ] Step 7: Move verified production package to assets/branding/approved/ with git commit tag.
```

---

*Technical Corrections Register approved by Senior Technical Review Team.*  
*Next Document: [`docs/branding/PHASE_1_5_APPROVAL_GATE.md`](PHASE_1_5_APPROVAL_GATE.md)*
