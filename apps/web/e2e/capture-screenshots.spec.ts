import { test } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../../docs/screenshots/prototype');

test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.beforeEach(async () => {
  test.setTimeout(90000);
});

test.describe('NAVA Prototype — High-Resolution Screenshot Capture Suite', () => {
  test('Capture Storefront, Customer, and Admin Prototype Screens', async ({ page, request }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Homepage
    console.log('Capturing 01_homepage.png...');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_homepage.png'), fullPage: true });

    // 2. Shop / Catalog
    console.log('Capturing 02_shop_catalog.png...');
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_shop_catalog.png'), fullPage: true });

    // 3. Product Detail Page
    console.log('Capturing 03_product_detail.png...');
    // Find first product link or direct navigate to kalamkari-cotton-shirt
    await page.goto('/products/kalamkari-cotton-shirt');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_product_detail.png'), fullPage: true });

    // 4. Cart Page (Add an item first)
    console.log('Capturing 04_cart.png...');
    // Click Add to Bag if present, then go to cart
    const addToBagBtn = page.locator('button:has-text("Add to Bag"), button:has-text("Add to Cart")').first();
    if (await addToBagBtn.isVisible()) {
      await addToBagBtn.click();
      await page.waitForTimeout(1000);
    }
    await page.goto('/cart');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_cart.png'), fullPage: true });

    // 5. Customer Login Page
    console.log('Capturing 05_customer_login.png...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_customer_login.png'), fullPage: true });

    // 6. Log in as Customer and capture Customer Account Dashboard
    console.log('Capturing 06_customer_account.png...');
    await page.fill('input[type="email"]', 'customer@nava-creations.in');
    await page.fill('input[type="password"]', 'Customer@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/account', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_customer_account.png'), fullPage: true });

    // 7. Checkout Page (logged-in with address prefilled)
    console.log('Capturing 07_checkout.png...');
    await page.goto('/checkout');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_checkout.png'), fullPage: true });

    // 8. Order Tracking Page with BharatPe QR & UTR Submission
    console.log('Capturing 08_order_tracking.png...');
    // Return to account page to pick up an existing order, or navigate to it
    await page.goto('/account');
    await page.waitForLoadState('networkidle');
    const orderLink = page.locator('a:has-text("View Order & Tracking")').first();
    if (await orderLink.isVisible()) {
      await orderLink.click();
      await page.waitForURL('**/orders/**', { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_order_tracking.png'), fullPage: true });
    } else {
      // Direct navigate to first order if available via API
      const ordersRes = await request.get('/api/customer/orders');
      if (ordersRes.ok()) {
        const ordersData = await ordersRes.json();
        if (ordersData.orders && ordersData.orders.length > 0) {
          await page.goto(`/orders/${ordersData.orders[0].orderNumber}`);
          await page.waitForLoadState('networkidle');
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_order_tracking.png'), fullPage: true });
        }
      }
    }

    // 9. Admin Login Page
    console.log('Capturing 09_admin_login.png...');
    // Create new context or clear cookies for admin
    const adminContext = await page.context().browser()!.newContext({ viewport: { width: 1440, height: 900 } });
    const adminPage = await adminContext.newPage();
    await adminPage.goto('/admin/login');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '09_admin_login.png'), fullPage: true });

    // 10. Admin Studio Dashboard
    console.log('Capturing 10_admin_overview.png...');
    await adminPage.fill('input[type="email"]', 'admin@nava-creations.internal');
    await adminPage.fill('input[type="password"]', 'Admin@Nava2026!');
    await adminPage.click('button[type="submit"]');
    await adminPage.waitForURL('**/admin', { timeout: 15000 });
    await adminPage.waitForLoadState('networkidle');
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '10_admin_overview.png'), fullPage: true });

    // 11. Admin Orders Management
    console.log('Capturing 11_admin_orders.png...');
    await adminPage.goto('/admin/orders');
    await adminPage.waitForLoadState('networkidle');
    await adminPage.screenshot({ path: path.join(SCREENSHOT_DIR, '11_admin_orders.png'), fullPage: true });

    await adminContext.close();
  });
});
