import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Storefront UI & Admin Dashboard Functional Tests', () => {
  const screenshotsDir = path.resolve(process.cwd(), '../../docs/screenshots');

  test('Homepage renders hero, categories, featured products and captures screenshot', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Timeless Artistry in Every Bangle.');
    await expect(page.locator('text=Shop by Category')).toBeVisible();
    await expect(page.locator('text=Featured Pieces')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'homepage.png'), fullPage: true });
  });

  test('Shop page renders product grid, filter controls and captures screenshot', async ({ page }) => {
    await page.goto('/shop');
    await expect(page.locator('h1')).toContainText('Handcrafted Accessories');
    await expect(page.locator('input[name="search"]')).toBeVisible();
    await expect(page.locator('article').first()).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'shop.png'), fullPage: true });
  });

  test('Product detail page renders gallery, size selector, price, and captures screenshot', async ({ page }) => {
    await page.goto('/products/regal-kundan-bridal-chuda-kada-set');
    await expect(page.locator('h1')).toContainText('Regal Kundan Bridal Chuda & Kada Set');
    await expect(page.locator('text=Select Bangle Size:')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add to Bag' })).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'product-detail.png'), fullPage: true });
  });

  test('Cart workflow: add product, open drawer, view cart page, and capture screenshot', async ({ page }) => {
    await page.goto('/products/regal-kundan-bridal-chuda-kada-set');
    // Click Add to Bag
    await page.getByRole('button', { name: 'Add to Bag' }).click();

    // Verify slide-over drawer appears
    await expect(page.locator('text=Shopping Bag (1)')).toBeVisible();

    // Navigate to /cart
    await page.goto('/cart');
    await expect(page.locator('h1')).toContainText('Your Shopping Bag');
    await expect(page.locator('text=Regal Kundan Bridal Chuda & Kada Set')).toBeVisible();
    await expect(page.locator('text=Order on WhatsApp')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'cart.png'), fullPage: true });
  });

  test('Contact & Studio page renders enquiry form and captures screenshot', async ({ page }) => {
    await page.goto('/contact');
    await expect(page.locator('h1')).toContainText('Connect With Our Studio');
    await expect(page.locator('text=Bespoke Bridal & Bulk Return Gifts')).toBeVisible();
    await expect(page.locator('input[placeholder="e.g. Ananya Rao"]')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'contact.png'), fullPage: true });
  });

  test('Admin Login portal renders authentication gate and captures screenshot', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('text=Studio Administration Portal')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'admin-login.png'), fullPage: true });
  });

  test('Admin Dashboard Overview renders metrics cards and captures screenshot', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('input[type="password"]').fill('placeholder_minimum_32_character_cryptographic_secret');
    await page.getByRole('button', { name: 'Authenticate Studio Session' }).click();
    await expect(page).toHaveURL(/\/admin/);

    await expect(page.locator('h1')).toContainText('Studio Overview');
    await expect(page.locator('text=Active Published Pieces')).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'admin-dashboard.png'), fullPage: true });
  });

  test('Admin Products page renders catalog table and captures screenshot', async ({ page }) => {
    await page.goto('/admin/login');
    await page.locator('input[type="password"]').fill('placeholder_minimum_32_character_cryptographic_secret');
    await page.getByRole('button', { name: 'Authenticate Studio Session' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto('/admin/products');

    await expect(page.locator('h1')).toContainText('Products Catalogue');
    await expect(page.getByRole('link', { name: 'Add New Piece' })).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'admin-products.png'), fullPage: true });
  });

  test('Mobile viewport renders responsive navigation and hamburger drawer', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12/13/14 viewport
    await page.goto('/');

    await expect(page.locator('button[aria-label="Open mobile menu"]')).toBeVisible();
    // Open hamburger drawer
    await page.locator('button[aria-label="Open mobile menu"]').click();
    await expect(page.locator('nav').getByRole('link', { name: 'Handmade Bangles' })).toBeVisible();

    await page.screenshot({ path: path.join(screenshotsDir, 'mobile-homepage.png') });
  });
});
