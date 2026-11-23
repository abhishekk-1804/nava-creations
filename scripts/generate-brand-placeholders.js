/**
 * NAVA CREATIONS — BRANDED PRODUCT ASSET GENERATOR
 * Generates polished, high-resolution NAVA-branded product visuals and placeholders.
 * Adheres strictly to NAVA Brand Guidelines (Deep Plum #5C1D38, Antique Gold #C5A059, Cream #FAF6F0).
 * Uses Playwright Chromium to render pixel-perfect JPEG/PNG binaries.
 */

const fs = require('fs');
const path = require('path');
const { chromium } = require('../apps/web/node_modules/@playwright/test');

const BRANDING_DIR = path.resolve(__dirname, '../apps/web/public/branding');

if (!fs.existsSync(BRANDING_DIR)) {
  fs.mkdirSync(BRANDING_DIR, { recursive: true });
}

// XML escaping helper for SVG text elements
function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Common SVG template wrapper
function createSvgWrapper(title, category, subtitle, visualArt) {
  const safeTitle = escapeXml(title);
  const safeCategory = escapeXml(category);
  const safeSubtitle = escapeXml(subtitle);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="100%" height="100%">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#FAF6F0" />
      <stop offset="100%" stop-color="#F2ECE4" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E5C77A" />
      <stop offset="50%" stop-color="#C5A059" />
      <stop offset="100%" stop-color="#8C6E2D" />
    </linearGradient>
    <linearGradient id="plumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#732646" />
      <stop offset="50%" stop-color="#5C1D38" />
      <stop offset="100%" stop-color="#3D1224" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#5C1D38" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="800" height="800" fill="url(#bgGlow)" />

  <!-- Outer Heritage Border -->
  <rect x="24" y="24" width="752" height="752" rx="12" fill="none" stroke="#C5A059" stroke-width="1.2" opacity="0.4" />
  <rect x="36" y="36" width="728" height="728" rx="8" fill="none" stroke="#C5A059" stroke-width="0.8" stroke-dasharray="4 4" opacity="0.5" />

  <!-- Corner Flourishes -->
  <g stroke="#C5A059" stroke-width="1.5" fill="none" opacity="0.6">
    <path d="M 46 64 C 46 46, 64 46, 64 46" />
    <circle cx="46" cy="46" r="3" fill="#5C1D38" stroke="none" />
    <path d="M 754 64 C 754 46, 736 46, 736 46" />
    <circle cx="754" cy="46" r="3" fill="#5C1D38" stroke="none" />
    <path d="M 46 736 C 46 754, 64 754, 64 754" />
    <circle cx="46" cy="754" r="3" fill="#5C1D38" stroke="none" />
    <path d="M 754 736 C 754 754, 736 754, 736 754" />
    <circle cx="754" cy="754" r="3" fill="#5C1D38" stroke="none" />
  </g>

  <!-- Brand Header -->
  <g transform="translate(400, 95)" text-anchor="middle">
    <!-- Mini Parijata Flower Crest -->
    <circle cx="0" cy="-22" r="4" fill="#5C1D38" stroke="#C5A059" stroke-width="1.2" />
    <path d="M 0 -26 C -4 -34, -2 -40, 0 -44 C 2 -40, 4 -34, 0 -26 Z" fill="none" stroke="#C5A059" stroke-width="1.2" stroke-linecap="round" />
    <path d="M 3 -24 C 11 -28, 17 -26, 20 -23 C 17 -20, 10 -20, 3 -24 Z" fill="none" stroke="#C5A059" stroke-width="1.2" stroke-linecap="round" />
    <path d="M -3 -24 C -11 -28, -17 -26, -20 -23 C -17 -20, -10 -20, -3 -24 Z" fill="none" stroke="#C5A059" stroke-width="1.2" stroke-linecap="round" />

    <text y="0" font-family="'Cormorant Garamond', Georgia, serif" font-size="20" font-weight="600" letter-spacing="0.28em" fill="#5C1D38">NAVA CREATIONS</text>
    <text y="18" font-family="'DM Sans', Helvetica, sans-serif" font-size="9" font-weight="600" letter-spacing="0.32em" fill="#C5A059">BENGALURU ATELIER</text>
  </g>

  <!-- Central Visual Art Presentation (Center at 400, 390) -->
  <g id="visual-art" transform="translate(400, 390)">
    ${visualArt}
  </g>

  <!-- Product Labels / Typography Footer -->
  <g transform="translate(400, 670)" text-anchor="middle">
    <!-- Category Pill -->
    <rect x="-90" y="-34" width="180" height="22" rx="11" fill="#FAF6F0" stroke="#C5A059" stroke-width="1" />
    <text y="-20" font-family="'DM Sans', Helvetica, sans-serif" font-size="9.5" font-weight="700" letter-spacing="0.22em" fill="#5C1D38">${safeCategory.toUpperCase()}</text>

    <!-- Main Title -->
    <text y="12" font-family="'Cormorant Garamond', Georgia, serif" font-size="28" font-weight="600" letter-spacing="0.04em" fill="#1C1917">${safeTitle}</text>

    <!-- Subtitle / Craft Detail -->
    <text y="38" font-family="'DM Sans', Helvetica, sans-serif" font-size="12" font-weight="400" letter-spacing="0.08em" fill="#78716C">${safeSubtitle}</text>
  </g>

  <!-- Bottom Authenticity Tag -->
  <g transform="translate(400, 746)" text-anchor="middle">
    <line x1="-120" y1="-8" x2="120" y2="-8" stroke="#E7E5E4" stroke-width="0.8" />
    <text y="6" font-family="'DM Sans', Helvetica, sans-serif" font-size="9" font-weight="500" letter-spacing="0.16em" fill="#A8A29E">AUTHENTIC HANDCRAFTED ARTISAN HEIRLOOM • BENGALURU</text>
  </g>
</svg>`;
}

// 1. Bridal Kundan Chuda Set (sample-chuda-1)
const chuda1Art = `
  <!-- Aura Circle -->
  <circle cx="0" cy="-10" r="190" fill="#FAF4EA" opacity="0.6" filter="url(#cardShadow)" />
  <circle cx="0" cy="-10" r="175" fill="none" stroke="#C5A059" stroke-width="1.2" stroke-dasharray="3 4" opacity="0.6" />

  <!-- Concentric Chuda Bangle Stack in Isometric Elevation -->
  <!-- Top Kundan Broad Kada -->
  <ellipse cx="0" cy="-90" rx="150" ry="46" fill="none" stroke="url(#goldGrad)" stroke-width="22" />
  <ellipse cx="0" cy="-90" rx="150" ry="46" fill="none" stroke="url(#plumGrad)" stroke-width="8" />
  <!-- Kundan Gem Stones on Top Kada -->
  <g fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5">
    <ellipse cx="-110" cy="-95" rx="7" ry="5" />
    <ellipse cx="-60" cy="-75" rx="8" ry="6" />
    <ellipse cx="0" cy="-68" rx="10" ry="7" />
    <ellipse cx="60" cy="-75" rx="8" ry="6" />
    <ellipse cx="110" cy="-95" rx="7" ry="5" />
  </g>

  <!-- Middle Crimson and Gold Spacer Bangles -->
  <ellipse cx="0" cy="-55" rx="146" ry="44" fill="none" stroke="#8B263E" stroke-width="10" />
  <ellipse cx="0" cy="-35" rx="144" ry="43" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-dasharray="3 3" />
  <ellipse cx="0" cy="-15" rx="144" ry="43" fill="none" stroke="#5C1D38" stroke-width="14" />
  <ellipse cx="0" cy="10" rx="144" ry="43" fill="none" stroke="url(#goldGrad)" stroke-width="6" stroke-dasharray="3 3" />
  <ellipse cx="0" cy="30" rx="146" ry="44" fill="none" stroke="#8B263E" stroke-width="10" />

  <!-- Bottom Kundan Broad Kada -->
  <ellipse cx="0" cy="65" rx="150" ry="46" fill="none" stroke="url(#goldGrad)" stroke-width="22" />
  <ellipse cx="0" cy="65" rx="150" ry="46" fill="none" stroke="url(#plumGrad)" stroke-width="8" />
  <!-- Bottom Kundan Stones -->
  <g fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5">
    <ellipse cx="-110" cy="60" rx="7" ry="5" />
    <ellipse cx="-60" cy="80" rx="8" ry="6" />
    <ellipse cx="0" cy="87" rx="10" ry="7" />
    <ellipse cx="60" cy="80" rx="8" ry="6" />
    <ellipse cx="110" cy="60" rx="7" ry="5" />
  </g>
`;

// 2. Bridal Chuda Macro Detail (sample-chuda-2)
const chuda2Art = `
  <circle cx="0" cy="-10" r="185" fill="#FAF4EA" opacity="0.6" filter="url(#cardShadow)" />
  <g transform="scale(1.35) translate(0, -10)">
    <!-- Kundan Flower Cluster Macro -->
    <circle cx="0" cy="0" r="24" fill="url(#plumGrad)" stroke="url(#goldGrad)" stroke-width="4" />
    <circle cx="0" cy="0" r="10" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <!-- 8 Surrounding Kundan Petals -->
    <g fill="#FFFFFF" stroke="url(#goldGrad)" stroke-width="2.5">
      <ellipse cx="0" cy="-45" rx="14" ry="20" />
      <ellipse cx="32" cy="-32" rx="14" ry="20" transform="rotate(45, 32, -32)" />
      <ellipse cx="45" cy="0" rx="20" ry="14" />
      <ellipse cx="32" cy="32" rx="14" ry="20" transform="rotate(-45, 32, 32)" />
      <ellipse cx="0" cy="45" rx="14" ry="20" />
      <ellipse cx="-32" cy="32" rx="14" ry="20" transform="rotate(45, -32, 32)" />
      <ellipse cx="-45" cy="0" rx="20" ry="14" />
      <ellipse cx="-32" cy="-32" rx="14" ry="20" transform="rotate(-45, -32, -32)" />
    </g>
    <!-- Gold filigree tendrils -->
    <circle cx="0" cy="0" r="78" fill="none" stroke="url(#goldGrad)" stroke-width="2.5" stroke-dasharray="4 6" />
    <circle cx="0" cy="0" r="88" fill="none" stroke="#5C1D38" stroke-width="1.5" />
  </g>
`;

// 3. Temple Goddess Antique Gold Matte Kadas (sample-kada-1)
const kada1Art = `
  <circle cx="0" cy="-10" r="190" fill="#FAF4EA" opacity="0.6" filter="url(#cardShadow)" />
  <!-- Pair of Antique Matte Kadas Interlinked -->
  <!-- Left Kada -->
  <g transform="translate(-50, -20) rotate(-15)">
    <ellipse cx="0" cy="0" rx="110" ry="70" fill="none" stroke="url(#goldGrad)" stroke-width="26" />
    <ellipse cx="0" cy="0" rx="110" ry="70" fill="none" stroke="#8C6E2D" stroke-width="4" />
    <!-- Embossed Lakshmi Temple Arch motif studs -->
    <circle cx="-90" cy="0" r="6" fill="#C5A059" />
    <circle cx="-65" cy="-45" r="6" fill="#C5A059" />
    <circle cx="0" cy="-62" r="7" fill="#5C1D38" stroke="#C5A059" stroke-width="2" />
    <circle cx="65" cy="-45" r="6" fill="#C5A059" />
    <circle cx="90" cy="0" r="6" fill="#C5A059" />
  </g>
  <!-- Right Kada -->
  <g transform="translate(50, 10) rotate(15)">
    <ellipse cx="0" cy="0" rx="110" ry="70" fill="none" stroke="url(#goldGrad)" stroke-width="26" />
    <ellipse cx="0" cy="0" rx="110" ry="70" fill="none" stroke="#8C6E2D" stroke-width="4" />
    <circle cx="-90" cy="0" r="6" fill="#C5A059" />
    <circle cx="-65" cy="-45" r="6" fill="#C5A059" />
    <circle cx="0" cy="-62" r="7" fill="#5C1D38" stroke="#C5A059" stroke-width="2" />
    <circle cx="65" cy="-45" r="6" fill="#C5A059" />
    <circle cx="90" cy="0" r="6" fill="#C5A059" />
  </g>
`;

// 4. Shimmer Silk Thread Bangle Set (sample-silk-1)
const silk1Art = `
  <circle cx="0" cy="-10" r="190" fill="#FAF4EA" opacity="0.6" filter="url(#cardShadow)" />
  <!-- Silk Thread Bangle Stack Multi-Colored -->
  <g transform="translate(0, -10)">
    <!-- 8 Multi-Tone Silk Bangles stacked -->
    <ellipse cx="0" cy="-80" rx="140" ry="42" fill="none" stroke="#1E3A8A" stroke-width="12" />
    <ellipse cx="0" cy="-60" rx="140" ry="42" fill="none" stroke="url(#goldGrad)" stroke-width="8" stroke-dasharray="4 2" />
    <ellipse cx="0" cy="-40" rx="140" ry="42" fill="none" stroke="#0D9488" stroke-width="12" />
    <ellipse cx="0" cy="-20" rx="140" ry="42" fill="none" stroke="#8B263E" stroke-width="14" />
    <ellipse cx="0" cy="0" rx="140" ry="42" fill="none" stroke="#D97706" stroke-width="12" />
    <ellipse cx="0" cy="20" rx="140" ry="42" fill="none" stroke="url(#goldGrad)" stroke-width="8" stroke-dasharray="4 2" />
    <ellipse cx="0" cy="40" rx="140" ry="42" fill="none" stroke="#5C1D38" stroke-width="16" />
    <ellipse cx="0" cy="65" rx="140" ry="42" fill="none" stroke="#1E3A8A" stroke-width="12" />
  </g>
`;

// 5. Floral Pearl Hair Jada Pin Set (sample-hair-1)
const hair1Art = `
  <circle cx="0" cy="-10" r="190" fill="#FAF4EA" opacity="0.6" filter="url(#cardShadow)" />
  <!-- Array of 3 Handcrafted Jada Pins with Pearl Clusters -->
  <g transform="translate(-70, -10) rotate(-10)">
    <!-- Central Pin Pin-shaft -->
    <line x1="0" y1="20" x2="0" y2="120" stroke="#C5A059" stroke-width="4" stroke-linecap="round" />
    <!-- Floral Head -->
    <circle cx="0" cy="0" r="32" fill="url(#plumGrad)" stroke="url(#goldGrad)" stroke-width="3" />
    <!-- Pearl Drops -->
    <circle cx="0" cy="-38" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="28" cy="-26" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="36" cy="6" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="20" cy="32" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="-20" cy="32" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="-36" cy="6" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="-28" cy="-26" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="0" cy="0" r="8" fill="#FFFFFF" />
  </g>
  <g transform="translate(70, 0) rotate(10)">
    <line x1="0" y1="20" x2="0" y2="120" stroke="#C5A059" stroke-width="4" stroke-linecap="round" />
    <circle cx="0" cy="0" r="32" fill="url(#plumGrad)" stroke="url(#goldGrad)" stroke-width="3" />
    <circle cx="0" cy="-38" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="28" cy="-26" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="36" cy="6" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="20" cy="32" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="-20" cy="32" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="-36" cy="6" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="-28" cy="-26" r="8" fill="#FFFFFF" stroke="#C5A059" stroke-width="1.5" />
    <circle cx="0" cy="0" r="8" fill="#FFFFFF" />
  </g>
`;

// 6. Traditional Meenakari Bangle Return Gift Box (sample-gift-1)
const gift1Art = `
  <circle cx="0" cy="-10" r="190" fill="#FAF4EA" opacity="0.6" filter="url(#cardShadow)" />
  <!-- Hexagonal / Square Decorated Gift Box in Isometric view -->
  <g transform="translate(0, -30)">
    <!-- Box Base -->
    <rect x="-110" y="-30" width="220" height="150" rx="14" fill="#FAF6F0" stroke="url(#goldGrad)" stroke-width="4" filter="url(#cardShadow)" />
    <!-- Box Lid with Brocade Ribbon -->
    <rect x="-116" y="-60" width="232" height="42" rx="8" fill="url(#plumGrad)" stroke="url(#goldGrad)" stroke-width="3" />
    <!-- Golden Brocade Ribbon vertical and horizontal -->
    <rect x="-16" y="-60" width="32" height="180" fill="url(#goldGrad)" />
    <!-- Rosette Bow On Top -->
    <ellipse cx="-20" cy="-75" rx="28" ry="16" fill="url(#goldGrad)" stroke="#5C1D38" stroke-width="2" transform="rotate(-20, -20, -75)" />
    <ellipse cx="20" cy="-75" rx="28" ry="16" fill="url(#goldGrad)" stroke="#5C1D38" stroke-width="2" transform="rotate(20, 20, -75)" />
    <circle cx="0" cy="-75" r="12" fill="#5C1D38" stroke="#C5A059" stroke-width="3" />
    <!-- Meenakari floral motif on box -->
    <circle cx="-60" cy="40" r="14" fill="#8B263E" stroke="#C5A059" stroke-width="2" />
    <circle cx="60" cy="40" r="14" fill="#8B263E" stroke="#C5A059" stroke-width="2" />
  </g>
`;

// 7. Master NAVA Product Placeholder (nava-product-placeholder)
const masterPlaceholderArt = `
  <circle cx="0" cy="-10" r="195" fill="#FAF4EA" opacity="0.6" filter="url(#cardShadow)" />
  <circle cx="0" cy="-10" r="175" fill="none" stroke="#C5A059" stroke-width="1.5" stroke-dasharray="4 5" opacity="0.7" />

  <!-- Authentic Concentric NAVA Bangle Circles -->
  <circle cx="0" cy="-10" r="130" fill="none" stroke="url(#goldGrad)" stroke-width="16" />
  <circle cx="0" cy="-10" r="130" fill="none" stroke="url(#plumGrad)" stroke-width="6" />
  <circle cx="0" cy="-10" r="105" fill="none" stroke="url(#goldGrad)" stroke-width="3" stroke-dasharray="2 3" />

  <!-- Botanical Parijata Crest -->
  <g transform="translate(0, -10) scale(1.65)">
    <circle cx="0" cy="0" r="6" fill="#5C1D38" stroke="#C5A059" stroke-width="2" />
    <!-- 5 Botanical Petals -->
    <path d="M 0 -6 C -8 -20, -3 -32, 0 -38 C 3 -32, 8 -20, 0 -6 Z" fill="none" stroke="#C5A059" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 5 -3 C 20 -10, 31 -6, 35 -1 C 30 5, 19 6, 5 -3 Z" fill="none" stroke="#C5A059" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 4 4 C 16 16, 22 25, 21 30 C 17 29, 9 19, 4 4 Z" fill="none" stroke="#C5A059" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M -4 4 C -16 16, -22 25, -21 30 C -17 29, -9 19, -4 4 Z" fill="none" stroke="#C5A059" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M -5 -3 C -20 -10, -31 -6, -35 -1 C -30 5, -19 6, -5 -3 Z" fill="none" stroke="#C5A059" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="0" cy="-22" r="2.5" fill="#C5A059" />
  </g>
`;

// 8. BharatPe UPI QR Code Graphic
const upiQrSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <rect width="400" height="400" fill="#FFFFFF" rx="16" stroke="#E7E5E4" stroke-width="2" />
  <!-- Header Bar -->
  <rect x="0" y="0" width="400" height="70" fill="#5C1D38" rx="16" />
  <rect x="0" y="54" width="400" height="16" fill="#5C1D38" />
  <text x="200" y="42" font-family="'Cormorant Garamond', Georgia, serif" font-size="22" font-weight="600" letter-spacing="0.2em" fill="#FFFFFF" text-anchor="middle">NAVA CREATIONS</text>
  
  <!-- QR Grid Patterns -->
  <g transform="translate(60, 95)">
    <!-- QR Corner Boxes -->
    <rect x="0" y="0" width="70" height="70" rx="8" fill="#1C1917" />
    <rect x="10" y="10" width="50" height="50" rx="4" fill="#FFFFFF" />
    <rect x="20" y="20" width="30" height="30" rx="2" fill="#5C1D38" />

    <rect x="210" y="0" width="70" height="70" rx="8" fill="#1C1917" />
    <rect x="220" y="10" width="50" height="50" rx="4" fill="#FFFFFF" />
    <rect x="230" y="20" width="30" height="30" rx="2" fill="#5C1D38" />

    <rect x="0" y="170" width="70" height="70" rx="8" fill="#1C1917" />
    <rect x="10" y="180" width="50" height="50" rx="4" fill="#FFFFFF" />
    <rect x="20" y="190" width="30" height="30" rx="2" fill="#5C1D38" />

    <!-- Pseudo Data Matrix Modules -->
    <g fill="#1C1917">
      <rect x="90" y="10" width="16" height="16" rx="2" />
      <rect x="120" y="10" width="32" height="16" rx="2" />
      <rect x="170" y="10" width="16" height="16" rx="2" />
      
      <rect x="90" y="40" width="32" height="16" rx="2" />
      <rect x="140" y="40" width="16" height="32" rx="2" />
      <rect x="170" y="40" width="24" height="16" rx="2" />

      <rect x="10" y="90" width="24" height="24" rx="2" />
      <rect x="50" y="90" width="16" height="16" rx="2" />
      <rect x="80" y="90" width="32" height="16" rx="2" />
      <rect x="130" y="90" width="24" height="24" rx="2" />
      <rect x="170" y="90" width="16" height="32" rx="2" />
      <rect x="210" y="90" width="32" height="16" rx="2" />
      <rect x="256" y="90" width="24" height="24" rx="2" />

      <rect x="10" y="130" width="32" height="16" rx="2" />
      <rect x="60" y="130" width="16" height="24" rx="2" />
      <rect x="90" y="130" width="24" height="16" rx="2" />
      <rect x="180" y="130" width="32" height="16" rx="2" />
      <rect x="230" y="130" width="16" height="32" rx="2" />

      <rect x="90" y="170" width="16" height="32" rx="2" />
      <rect x="120" y="170" width="32" height="16" rx="2" />
      <rect x="170" y="170" width="16" height="16" rx="2" />
      <rect x="200" y="170" width="32" height="24" rx="2" />
      <rect x="250" y="170" width="24" height="16" rx="2" />

      <rect x="90" y="218" width="32" height="22" rx="2" />
      <rect x="140" y="210" width="24" height="30" rx="2" />
      <rect x="180" y="218" width="40" height="22" rx="2" />
      <rect x="240" y="210" width="34" height="30" rx="2" />
    </g>

    <!-- Center Logo Shield -->
    <rect x="105" y="85" width="70" height="70" rx="10" fill="#FFFFFF" stroke="#C5A059" stroke-width="2" />
    <circle cx="140" cy="120" r="22" fill="#FAF6F0" />
    <circle cx="140" cy="120" r="16" fill="none" stroke="#5C1D38" stroke-width="3" />
    <circle cx="140" cy="120" r="5" fill="#C5A059" />
  </g>

  <!-- Footer Tag -->
  <text x="200" y="365" font-family="'DM Sans', Helvetica, sans-serif" font-size="11" font-weight="600" letter-spacing="0.1em" fill="#5C1D38" text-anchor="middle">BHARATPE ZERO-MDR UPI</text>
  <text x="200" y="382" font-family="'DM Sans', Helvetica, sans-serif" font-size="9" fill="#78716C" text-anchor="middle">Scan with GPay, PhonePe, Paytm, or BHIM</text>
</svg>`;

const ASSETS = [
  {
    filename: 'sample-chuda-1',
    svg: createSvgWrapper(
      'Royal Heritage Bridal Kundan Chuda Set',
      'Bridal Edit 2026',
      'Exquisite Kundan Stones, Ruby Cabochons & Gold Kadas',
      chuda1Art
    )
  },
  {
    filename: 'sample-chuda-2',
    svg: createSvgWrapper(
      'Royal Heritage Bridal Chuda',
      'Atelier Macro Detail',
      'Artisan Hand-Set Kundan Facets & Filigree',
      chuda2Art
    )
  },
  {
    filename: 'sample-kada-1',
    svg: createSvgWrapper(
      'Temple Goddess Antique Gold Kadas',
      'Temple Jewellery',
      'Micro-Gold Matte Plating with Embossed Lakshmi Motifs',
      kada1Art
    )
  },
  {
    filename: 'sample-silk-1',
    svg: createSvgWrapper(
      'Shimmer Silk Thread Bangle Set',
      'Silk Collection',
      '24-Piece Vibrant Silk Wrapped Stack with Zardosi Work',
      silk1Art
    )
  },
  {
    filename: 'sample-hair-1',
    svg: createSvgWrapper(
      'Floral Pearl Hair Jada Pin Set',
      'Bridal Hair Adornments',
      'Handcrafted Pearl Clusters on Antique Gold Prongs',
      hair1Art
    )
  },
  {
    filename: 'sample-gift-1',
    svg: createSvgWrapper(
      'Traditional Meenakari Return Gift Box',
      'Festive Gifting',
      'Set of 5 Handcrafted Peacock Enamel Gift Boxes',
      gift1Art
    )
  },
  {
    filename: 'nava-product-placeholder',
    svg: createSvgWrapper(
      'Artisan Heirloom Piece',
      'NAVA Atelier Curation',
      'Handcrafted in Bengaluru • Photography in Curation',
      masterPlaceholderArt
    )
  }
];

async function main() {
  console.log('--- GENERATING POLISHED NAVA BRANDED SVG ASSETS ---');

  // 1. Save all SVGs
  for (const asset of ASSETS) {
    const svgPath = path.join(BRANDING_DIR, `${asset.filename}.svg`);
    fs.writeFileSync(svgPath, asset.svg, 'utf8');
    console.log(`[SVG] Created: ${svgPath}`);
  }

  // Save UPI QR SVG
  const qrSvgPath = path.join(BRANDING_DIR, 'merchant-upi-qr.svg');
  fs.writeFileSync(qrSvgPath, upiQrSvg, 'utf8');
  console.log(`[SVG] Created: ${qrSvgPath}`);

  // 2. Launch Chromium via Playwright to render pixel-perfect binaries
  console.log('\n--- RENDERING HIGH-RESOLUTION JPEG / PNG BINARIES ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 800, height: 800 });

  for (const asset of ASSETS) {
    const svgPath = path.join(BRANDING_DIR, `${asset.filename}.svg`);
    const fileUrl = 'file:///' + svgPath.replace(/\\/g, '/');

    await page.goto(fileUrl);
    await page.waitForLoadState('networkidle');

    // Render as high-quality JPEG
    const jpgPath = path.join(BRANDING_DIR, `${asset.filename}.jpg`);
    await page.screenshot({ path: jpgPath, type: 'jpeg', quality: 92 });
    console.log(`[JPG] Rendered: ${jpgPath} (${fs.statSync(jpgPath).size} bytes)`);

    // Also render as PNG
    const pngPath = path.join(BRANDING_DIR, `${asset.filename}.png`);
    await page.screenshot({ path: pngPath, type: 'png' });
    console.log(`[PNG] Rendered: ${pngPath} (${fs.statSync(pngPath).size} bytes)`);
  }

  // Render merchant QR as PNG
  await page.setViewportSize({ width: 400, height: 400 });
  const qrSvgUrl = 'file:///' + qrSvgPath.replace(/\\/g, '/');
  await page.goto(qrSvgUrl);
  await page.waitForLoadState('networkidle');
  const qrPngPath = path.join(BRANDING_DIR, 'merchant-upi-qr.png');
  await page.screenshot({ path: qrPngPath, type: 'png' });
  console.log(`[PNG] Rendered: ${qrPngPath} (${fs.statSync(qrPngPath).size} bytes)`);

  await browser.close();
  console.log('--- ALL BRANDED PRODUCT ASSETS SUCCESSFULLY GENERATED ---');
}

main().catch(err => {
  console.error('ASSET GENERATION ERROR:', err);
  process.exit(1);
});
