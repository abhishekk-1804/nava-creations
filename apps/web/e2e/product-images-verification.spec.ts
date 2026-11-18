import { test, expect } from '@playwright/test';
import * as path from 'path';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../../docs/screenshots/prototype');

test.describe('NAVA Prototype — Product Image Pipeline Verification Suite', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  test('PIR-1: Homepage Product Images Load with Zero 404s', async ({ page }) => {
    const failed404s: string[] = [];
    const imageRequests: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if (
        response.request().resourceType() === 'image' ||
        url.match(/\.(jpg|jpeg|png|svg|webp)($|\?)/i)
      ) {
        imageRequests.push({ url, status });
        if (status === 404) {
          failed404s.push(url);
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log(`[Homepage] Total image requests tracked: ${imageRequests.length}`);
    for (const req of imageRequests) {
      console.log(`  - Image: ${req.url} -> Status ${req.status}`);
    }

    expect(failed404s).toEqual([]);

    // Check all img elements have natural dimensions > 0
    const images = page.locator('article img, main img');
    const count = await images.count();
    console.log(`[Homepage] Verifying ${count} <img> element(s) on page...`);
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const isVisible = await img.isVisible();
      expect(isVisible).toBe(true);

      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight);
      const currentSrc = await img.evaluate((el: HTMLImageElement) => el.currentSrc || el.src);

      console.log(`  - Img ${i + 1}: ${currentSrc} (${naturalWidth}x${naturalHeight}px)`);
      expect(naturalWidth).toBeGreaterThan(0);
      expect(naturalHeight).toBeGreaterThan(0);
    }

    // Capture visual confirmation screenshot
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_homepage_verified_images.png'), fullPage: true });
  });

  test('PIR-2: Shop Catalogue Product Images Load with Zero 404s', async ({ page }) => {
    const failed404s: string[] = [];
    const imageRequests: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if (
        response.request().resourceType() === 'image' ||
        url.match(/\.(jpg|jpeg|png|svg|webp)($|\?)/i)
      ) {
        imageRequests.push({ url, status });
        if (status === 404) {
          failed404s.push(url);
        }
      }
    });

    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    console.log(`[Shop] Total image requests tracked: ${imageRequests.length}`);
    for (const req of imageRequests) {
      console.log(`  - Image: ${req.url} -> Status ${req.status}`);
    }

    expect(failed404s).toEqual([]);

    const images = page.locator('article img');
    const count = await images.count();
    console.log(`[Shop] Verifying ${count} catalog product image(s)...`);
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      const naturalHeight = await img.evaluate((el: HTMLImageElement) => el.naturalHeight);
      const currentSrc = await img.evaluate((el: HTMLImageElement) => el.currentSrc || el.src);

      console.log(`  - Product ${i + 1}: ${currentSrc} (${naturalWidth}x${naturalHeight}px)`);
      expect(naturalWidth).toBeGreaterThan(0);
      expect(naturalHeight).toBeGreaterThan(0);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_shop_verified_images.png'), fullPage: true });
  });

  test('PIR-3: Product Detail Page Main Image & Thumbnails Load with Zero 404s', async ({ page }) => {
    const failed404s: string[] = [];
    const imageRequests: { url: string; status: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      if (
        response.request().resourceType() === 'image' ||
        url.match(/\.(jpg|jpeg|png|svg|webp)($|\?)/i)
      ) {
        imageRequests.push({ url, status });
        if (status === 404) {
          failed404s.push(url);
        }
      }
    });

    await page.goto('/products/royal-heritage-bridal-kundan-chuda-set');
    await page.waitForLoadState('networkidle');

    console.log(`[PDP] Total image requests tracked: ${imageRequests.length}`);
    for (const req of imageRequests) {
      console.log(`  - Image: ${req.url} -> Status ${req.status}`);
    }

    expect(failed404s).toEqual([]);

    // Check main image
    const mainImg = page.locator('.aspect-square img').first();
    expect(await mainImg.isVisible()).toBe(true);
    const mainWidth = await mainImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
    const mainHeight = await mainImg.evaluate((el: HTMLImageElement) => el.naturalHeight);
    console.log(`[PDP] Main Image dimensions: ${mainWidth}x${mainHeight}px`);
    expect(mainWidth).toBeGreaterThan(0);
    expect(mainHeight).toBeGreaterThan(0);

    // Click secondary thumbnail and verify switch
    const thumbnails = page.locator('button img');
    const thumbCount = await thumbnails.count();
    if (thumbCount > 1) {
      console.log(`[PDP] Switching to thumbnail 2...`);
      await page.locator('button:has(img)').nth(1).click();
      await page.waitForTimeout(500);

      const switchedWidth = await mainImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(switchedWidth).toBeGreaterThan(0);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_product_detail_verified_images.png'), fullPage: true });
  });

  test('PIR-4: All 5 Prototype Products Load Successfully in Direct Navigation', async ({ page }) => {
    const products = [
      'royal-heritage-bridal-kundan-chuda-set',
      'temple-goddess-antique-gold-matte-kadas',
      'shimmer-silk-thread-bangle-set-24-piece-box',
      'handcrafted-floral-pearl-hair-jada-pin-set',
      'traditional-meenakari-bangle-return-gift-box'
    ];

    for (const slug of products) {
      const page404s: string[] = [];
      page.on('response', (res) => {
        if (res.status() === 404 && res.request().resourceType() === 'image') {
          page404s.push(res.url());
        }
      });

      await page.goto(`/products/${slug}`);
      await page.waitForLoadState('networkidle');

      const img = page.locator('.aspect-square img').first();
      expect(await img.isVisible()).toBe(true);

      const width = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
      expect(width).toBeGreaterThan(0);
      expect(page404s).toEqual([]);
      console.log(`[Verified Product] ${slug} -> Image rendered successfully (${width}px wide, zero 404s)`);
    }
  });
});
