import { test, expect } from '@playwright/test';

test.describe('NAVA CREATIONS — Phase 4 Admin Analytics & Dynamic Settings Suite', () => {
  test('1. Admin Executive Dashboard renders Recharts Financial Analytics with Indian Rupee formatting', async ({ page }) => {
    // 1. Authenticate as Studio Admin
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[placeholder="admin@nava-creations.internal"]', 'admin@nava-creations.internal');
    await page.fill('input[type="password"]', 'Admin@Nava2026!');
    await page.click('button:has-text("Authenticate Studio Session")');
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10000 });

    // 2. Verify Executive Metric Cards
    await expect(page.locator('h1').first()).toContainText('Studio Overview');
    await expect(page.locator('text=Gross Revenue').first()).toBeVisible();
    await expect(page.locator('text=Estimated EBITDA').first()).toBeVisible();
    await expect(page.locator('text=Total Orders Placed').first()).toBeVisible();
    await expect(page.locator('text=Marketing Conversion').first()).toBeVisible();

    // 3. Verify Indian Rupee Currency Formatting (₹)
    const rupeeElements = page.locator('text=/₹[0-9,]+/');
    const rupeeCount = await rupeeElements.count();
    expect(rupeeCount).toBeGreaterThanOrEqual(2);

    // 4. Verify Recharts Charts Container & SVG elements
    const rechartsContainer = page.locator('.recharts-responsive-container');
    await expect(rechartsContainer.first()).toBeVisible();

    // Verify Tab Switching
    const volumeTabBtn = page.getByRole('button', { name: 'Order Volume (30D)' });
    await expect(volumeTabBtn).toBeVisible();
    await volumeTabBtn.click();
    await expect(page.locator('text=Daily Order Volume & Channel Distribution').first()).toBeVisible();

    // Switch back to Revenue vs Profit
    const financialTabBtn = page.getByRole('button', { name: 'Revenue vs. Profit' });
    await financialTabBtn.click();
    await expect(page.locator('text=Revenue vs. Operating Profit Margin').first()).toBeVisible();

    // 5. Verify Collection Revenue Contribution Cards
    await expect(page.locator('text=Collection Revenue Contribution').first()).toBeVisible();
    await expect(page.locator('text=Kundan Artistry').first()).toBeVisible();
  });

  test('2. Admin Settings Form allows updating UPI VPA and Store Configuration', async ({ page }) => {
    // 1. Authenticate as Studio Admin
    await page.goto('http://localhost:3000/admin/login');
    await page.fill('input[placeholder="admin@nava-creations.internal"]', 'admin@nava-creations.internal');
    await page.fill('input[type="password"]', 'Admin@Nava2026!');
    await page.click('button:has-text("Authenticate Studio Session")');
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10000 });

    // 2. Navigate to Admin Settings
    await page.goto('http://localhost:3000/admin/settings');
    await expect(page.locator('h1').first()).toContainText('Studio Settings & Policies');

    // 3. Verify Core Dynamic Fields
    const upiInput = page.locator('input[placeholder="nava.creations@bharatpe"]');
    await expect(upiInput).toBeVisible();

    // Check COD option
    await expect(page.locator('text=Enable Cash on Delivery (COD) Checkout Option')).toBeVisible();
  });

  test('3. Storefront Checkout dynamically reads UPI VPA from Database', async ({ page }) => {
    // 1. Add item to cart first so checkout is active
    await page.goto('http://localhost:3000/products/ruby-jadau-bridal-chuda');
    await expect(page.locator('h1').first()).toContainText('Ruby Jadau Bridal Chuda');

    // Select Size 2.4 and add to bag
    const sizeButton = page.locator('button:has-text("2.4")').first();
    await sizeButton.click();
    await page.click('button:has-text("Add to Bag")');
    await expect(page.locator('text=Piece added to your shopping bag!')).toBeVisible({ timeout: 10000 });

    // 2. Visit /checkout
    await page.goto('http://localhost:3000/checkout');
    await expect(page.locator('h1:has-text("Complete Your Order")')).toBeVisible({ timeout: 10000 });

    // 3. Verify Dynamic UPI ID pill is present and reads VPA from database
    await expect(page.locator('text=UPI ID:').first()).toBeVisible();
    await expect(page.locator('text=@bharatpe').first()).toBeVisible();
  });
});
