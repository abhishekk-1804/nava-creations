import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../../docs/screenshots/luxury-storefront');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

test.describe('NAVA CREATIONS — Luxury Storefront & Conversion Verification Suite', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  test('1. Root Metadata & Header Navigation & Announcement Bar', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('http://localhost:3000/');

    // Check title
    await expect(page).toHaveTitle(/NAVA CREATIONS Bengaluru \| Bespoke Bridal Bangles & Kundan Jewellery/);

    // Check announcement bar
    const announcementBar = page.locator('aside[aria-label="Store Announcement"]');
    await expect(announcementBar).toBeVisible();
    await expect(announcementBar).toContainText("India's Premier Handcrafted Bangle Atelier");
    await expect(announcementBar).toContainText('+91 72046 28513');

    // Check brand mark in header
    const brandMark = page.locator('header a[aria-label="NAVA CREATIONS Bengaluru Home"]');
    await expect(brandMark).toBeVisible();
    await expect(brandMark).toContainText('NAVA CREATIONS');
    await expect(brandMark).toContainText('Bengaluru • Atelier');

    // Check touch targets (Search, Account, Cart)
    await expect(page.locator('button[aria-label="Search accessories"]')).toBeVisible();
    await expect(page.locator('a[aria-label="My Account"]')).toBeVisible();
    await expect(page.locator('button[aria-label="View shopping cart"]')).toBeVisible();

    expect(consoleErrors).toHaveLength(0);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_header_and_announcement.png') });
  });

  test('2. Editorial Hero Section & Arched Showcase Card', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Eyebrow and Headline
    await expect(page.locator('text=✦ BENGALURU ATELIER • BESPOKE BRIDAL & FESTIVE').first()).toBeVisible();
    await expect(page.locator('h1').first()).toContainText('Heirloom Bangles, Crafted for Your Sacred Moments.');

    // Right-column Arched Luxury Showcase Card
    await expect(page.locator('text=The 2026 Bridal Chuda')).toBeVisible();
    await expect(page.locator('text=Custom Bridal Orders: 7–14 Days Handcrafted')).toBeVisible();

    // Sizing pills inside hero
    for (const size of ['2.2', '2.4', '2.6', '2.8', '2.10']) {
      await expect(page.locator(`button[title="View details for size ${size}"]`)).toBeVisible();
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_editorial_hero.png') });

    // Click on size 2.6 pill to verify modal opens
    await page.locator('button[title="View details for size 2.6"]').click();
    await expect(page.locator('h3#size-guide-title')).toContainText('Find Your Bangle Size (2.2 – 2.10)');
    await expect(page.locator('text=Size 2.6 • Medium / Most Common Bridal Fit')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_wrist_sizing_modal.png') });

    // Close modal
    await page.locator('button[aria-label="Close modal"]').click();
  });

  test('3. Product Cards Micro-Interactions & Zero SVG Parser Errors', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Check Featured Pieces section
    await expect(page.locator('text=Featured Pieces').first()).toBeVisible();

    // Verify Bridal Chuda Set card
    const chudaCard = page.locator('article', { hasText: 'Bridal Chuda Set' });
    await expect(chudaCard).toBeVisible();

    // Ensure zero XML parser error strings
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('error on line');
    expect(bodyText).not.toContain('xmlParseEntityRef');

    // Ensure WhatsApp inquiry trigger is visible on cards
    const whatsappInquiryBtns = page.locator('a[title="Ask on WhatsApp"]');
    await expect(whatsappInquiryBtns.first()).toBeVisible();

    // Ensure size availability pills appear
    await expect(chudaCard.locator('text=Sizes:')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_product_cards.png') });
  });

  test('4. Bridal Edit 2026 Split Banner & Collection Page', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Check Bridal Edit 2026 banner on homepage
    await expect(page.locator('text=BRIDAL TROUSSEAU • 2026').first()).toBeVisible();
    await expect(page.getByText('Pillar I', { exact: true })).toBeVisible();
    await expect(page.getByText('Bridal Chuda Sets', { exact: true })).toBeVisible();
    await expect(page.getByText('Pillar II', { exact: true })).toBeVisible();
    await expect(page.locator('text=Temple Kundan Kadas')).toBeVisible();
    await expect(page.getByText('Pillar III', { exact: true })).toBeVisible();
    await expect(page.locator('text=Sangeet Favours')).toBeVisible();

    // Check Lookbook button
    const lookbookBtn = page.getByRole('link', { name: 'Download 2026 Lookbook (PDF)' });
    await expect(lookbookBtn).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_bridal_split_banner.png') });

    // Navigate to /collections/bridal-edit-2026
    await page.goto('http://localhost:3000/collections/bridal-edit-2026');
    await expect(page.locator('h1').first()).toContainText('Bridal Edit 2026');
    await expect(page.getByRole('link', { name: 'Download 2026 Lookbook (PDF)' })).toBeVisible();
  });

  test('5. Dedicated /lookbook/bridal-edit-2026 Guide Page', async ({ page }) => {
    await page.goto('http://localhost:3000/lookbook/bridal-edit-2026');

    // Header & Story
    await expect(page.locator('h1').first()).toContainText('Bridal Edit 2026: Heirloom Trousseau Guide');
    await expect(page.locator('text=Jadau Kundan stonework').first()).toBeVisible();
    await expect(page.locator('text=1-micron 22K electro-gold plating').first()).toBeVisible();

    // Sizing table
    await expect(page.locator('text=Official Bangle Wrist-Sizing Guide (2.2 – 2.10)')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('td:has-text("2.6")').first()).toBeVisible();

    // Booking Desk
    await expect(page.locator('text=Bridal Trousseau & Bulk Return Gift Booking Desk')).toBeVisible();
    await expect(page.locator('text=+91 72046 28513').first()).toBeVisible();
    await expect(page.locator('text=+91 63612 00493').first()).toBeVisible();
    await expect(page.locator('text=@nava__creationsss').first()).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_bridal_lookbook.png'), fullPage: true });
  });

  test('6. Footer Integrity & Zero Exposed Engineering Links', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Verify phone numbers in footer
    await expect(footer).toContainText('+91 72046 28513');
    await expect(footer).toContainText('+91 63612 00493');

    // VERIFY COMPLETE REMOVAL OF SYSTEM DIAGNOSTICS
    await expect(footer.locator('text=System Diagnostics')).toHaveCount(0);
    const apiHealthLink = footer.locator('a[href="/api/health"]');
    await expect(apiHealthLink).toHaveCount(0);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_footer.png') });
  });

  test('7. Mobile Viewport (375px) Luxury Responsiveness', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('http://localhost:3000/');

    await expect(page.locator('button[aria-label="Open mobile menu"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Heirloom Bangles, Crafted for Your Sacred Moments.');

    // Verify mobile menu opens and does NOT contain admin link
    await page.locator('button[aria-label="Open mobile menu"]').click();
    await expect(page.locator('text=Studio Admin Dashboard')).toHaveCount(0);
    await expect(page.locator('text=WhatsApp Bridal Concierge')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_mobile_storefront_375px.png') });
  });
});
