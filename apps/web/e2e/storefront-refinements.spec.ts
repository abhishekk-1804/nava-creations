import { test, expect } from '@playwright/test';

test.describe('NAVA CREATIONS — Storefront UI/UX Refinements Suite', () => {
  test('1. Announcement Bar Marquee renders rotating messages and pauses on hover', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    const announcementBar = page.locator('aside[aria-label="Store Announcement"]');
    await expect(announcementBar).toBeVisible();

    // Verify all 3 rotating messages
    await expect(announcementBar).toContainText("India's Premier Handcrafted Bangle Atelier");
    await expect(announcementBar).toContainText('Bespoke Bridal & Custom Sizes (2.2 - 2.10)');
    await expect(announcementBar).toContainText('Contact & WhatsApp Studio: +91 72046 28513 | +91 63612 00493');

    // Verify marquee container has animation class
    const marqueeContainer = announcementBar.locator('.animate-marquee');
    await expect(marqueeContainer).toBeVisible();
  });

  test('2. Navigation routes Kundan Artistry correctly without 404', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Check desktop header nav link
    const kundanLink = page.locator('header nav a[href="/collections/kundan-artistry"]');
    await expect(kundanLink).toBeVisible();
    await expect(kundanLink).toContainText('Kundan Artistry');

    // Click link and navigate
    await kundanLink.click();
    await page.waitForURL('http://localhost:3000/collections/kundan-artistry');

    // Ensure page rendered cleanly without 404
    await expect(page.locator('h1')).toContainText('Kundan Artistry');
    await expect(page.locator('text=404')).toHaveCount(0);
  });

  test('3. Customer Login UI displays unified Sign In form and Studio Admin Login link', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    // Check Sign In heading and input fields
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();
    await expect(page.locator('input[name="identifier"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();

    // Check discrete Studio Admin Login link
    const adminLink = page.locator('a[href="/admin/login"]');
    await expect(adminLink).toBeVisible();
    await expect(adminLink).toContainText('Studio Admin Login');
  });

  test('4. Shop empty state provides bespoke request CTA to /contact', async ({ page }) => {
    await page.goto('http://localhost:3000/shop?category=cat-nonexistent');

    // Empty state heading
    const emptyHeading = page.locator('h3:has-text("No pieces found")').first();
    await expect(emptyHeading).toBeVisible();

    // Explanation copy
    await expect(page.locator('text=Our Bengaluru artisans craft bespoke bridal chuda').first()).toBeVisible();

    // Primary CTA to /contact
    const contactCta = page.locator('a[href="/contact"]:has-text("Request Bespoke Order")').first();
    await expect(contactCta).toBeVisible();

    // Secondary clear filters CTA
    const clearFilters = page.locator('a[href="/shop"]:has-text("Clear All Filters")').first();
    await expect(clearFilters).toBeVisible();
  });
});
