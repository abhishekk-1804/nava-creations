import { test, expect } from '@playwright/test';
import path from 'path';

const BREAKPOINTS = [
  { name: '375px', width: 375, height: 667 },   // iPhone SE
  { name: '390px', width: 390, height: 844 },   // iPhone 12/13/14
  { name: '768px', width: 768, height: 1024 },  // Tablet portrait
  { name: '1024px', width: 1024, height: 768 }, // Small desktop / tablet landscape
  { name: '1440px', width: 1440, height: 900 }, // Desktop widescreen
];

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'shop', path: '/shop' },
  { name: 'product-detail', path: '/products/regal-kundan-bridal-chuda-kada-set' },
  { name: 'cart', path: '/cart' },
  { name: 'contact', path: '/contact' },
];

test.describe('Responsive Visual Breakpoints & Screenshot Capture', () => {
  const outputDir = path.resolve(process.cwd(), '../../docs/screenshots/ui-ux');

  for (const bp of BREAKPOINTS) {
    test.describe(`Breakpoint: ${bp.name} (${bp.width}x${bp.height})`, () => {
      for (const pageItem of PAGES) {
        test(`Capture ${pageItem.name} at ${bp.name}`, async ({ page }) => {
          await page.setViewportSize({ width: bp.width, height: bp.height });
          await page.goto(pageItem.path);
          await page.waitForLoadState('networkidle');

          const filename = `${pageItem.name}-${bp.name}.png`;
          const filePath = path.join(outputDir, filename);

          await page.screenshot({ path: filePath, fullPage: true });

          // Robust responsive assertions: Verify essential landmarks & layout containment
          await expect(page.locator('header')).toBeVisible();
          await expect(page.locator('main')).toBeVisible();

          // Verify no horizontal overflow beyond viewport width
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          expect(scrollWidth).toBeLessThanOrEqual(bp.width + 1);
        });
      }
    });
  }
});
