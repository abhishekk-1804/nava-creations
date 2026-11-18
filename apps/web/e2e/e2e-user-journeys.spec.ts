import { test, expect } from '@playwright/test';

test.describe('Sprint 2H Phase I: Complete Customer & Admin End-to-End Journeys', () => {
  const ADMIN_SECRET = process.env.ADMIN_AUTH_SECRET || 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

  test('Customer Journey: Discovery, search, variant selection, bag management & enquiry', async ({
    page,
  }) => {
    test.setTimeout(60000);

    // 1. Open homepage
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Timeless Artistry in Every Bangle.');

    // 2. Navigate to shop
    await page.getByRole('link', { name: 'Explore Accessories' }).first().click();
    await expect(page).toHaveURL(/\/shop/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Handcrafted Accessories');

    // 3. Search for a product
    const searchInput = page.getByRole('textbox', { name: 'Search accessories by name or keyword' });
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Kundan');
    await page.getByRole('button', { name: 'Filter' }).click();
    await expect(page).toHaveURL(/search=Kundan/, { timeout: 15000 });

    // 4. Open product detail
    const productCard = page.locator('article').filter({ hasText: 'Bespoke Kundan Heirloom Bridal Chuda Set' });
    await expect(productCard).toBeVisible();
    await productCard.getByRole('link', { name: 'Bespoke Kundan Heirloom Bridal Chuda Set' }).first().click();
    await expect(page).toHaveURL(/\/products\/bespoke-kundan-heirloom-bridal-chuda-set/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Bespoke Kundan Heirloom Bridal Chuda Set');

    // Wait for hydration on product page
    await page.waitForLoadState('networkidle');

    // 5. Select a variant
    const sizeButton = page.getByRole('button', { name: /Size 2\.6/ });
    await expect(sizeButton).toBeVisible();
    await sizeButton.click();

    // 6. Add product to cart
    const addToBagBtn = page.getByRole('button', { name: 'Add to Bag' });
    await expect(addToBagBtn).toBeVisible();
    await addToBagBtn.click();

    // 7. Verify slide-over drawer opens automatically
    await expect(page.locator('text=Shopping Bag (1)')).toBeVisible();

    // 8. Open full cart page
    await page.getByRole('link', { name: /View Bag & Full Details/i }).click();
    await expect(page).toHaveURL(/\/cart/);
    await expect(page.locator('h1')).toContainText('Your Shopping Bag');
    await page.waitForLoadState('networkidle');

    // 9. Update quantity
    const increaseBtn = page.getByRole('button', { name: 'Increase quantity' });
    await expect(increaseBtn).toBeVisible();
    await increaseBtn.click();
    await expect(page.locator('text=Total Payable')).toBeVisible();
    await expect(page.locator('text=₹6,998').first()).toBeVisible({ timeout: 10000 });

    // 10. Remove product
    const removeBtn = page.getByRole('button', { name: 'Remove item' });
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();
    await expect(page.locator('text=No items in your bag')).toBeVisible({ timeout: 10000 });

    // 11. Navigate to contact page and submit an enquiry
    await page.goto('/contact');
    await expect(page.locator('h1')).toContainText('Connect With Our Studio');

    await page.locator('#contact-name').fill('Pooja Hegde');
    await page.locator('#contact-phone').fill('+91 98860 12345');
    await page.locator('#contact-notes').fill('Interested in custom sizing 2.6 for upcoming bridal celebrations in Bangalore.');

    // Wait 1.2s to satisfy anti-bot dwell time check
    await page.waitForTimeout(1200);

    await page.getByRole('button', { name: 'Submit Bridal Consultation Enquiry' }).click();
    await expect(
      page.locator('text=Enquiry Recorded Successfully').or(page.locator('text=Direct WhatsApp Connection Required'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('Admin Journey: Authentication, dashboard overview, catalog inspection & session termination', async ({
    page,
  }) => {
    test.setTimeout(60000);

    // 1. Open admin login
    await page.goto('/admin/login');
    await expect(page.locator('text=Studio Administration Portal')).toBeVisible();

    // 2. Authenticate with credentials
    await page.locator('input[type="password"]').fill(ADMIN_SECRET);
    await page.getByRole('button', { name: 'Authenticate Studio Session' }).click();

    // 3. Open dashboard
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Studio Overview');
    await expect(page.locator('text=Active Published Pieces')).toBeVisible();

    // 4. Navigate to Products catalogue
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/\/admin\/products/);
    await expect(page.locator('h1')).toContainText('Products Catalogue');
    await expect(page.locator('table')).toBeVisible();

    // 5. Navigate to Inventory Stock
    await page.getByRole('link', { name: 'Inventory Stock' }).click();
    await expect(page).toHaveURL(/\/admin\/inventory/);
    await expect(page.locator('h1')).toContainText('Workshop Inventory & Stock');

    // 6. Navigate to System Health
    await page.getByRole('link', { name: 'System Health' }).click();
    await expect(page).toHaveURL(/\/admin\/system/);
    await expect(page.locator('h1')).toContainText('System Diagnostics & Health');

    // 7. Session termination / Logout
    await page.waitForLoadState('networkidle');
    const logoutBtn = page.getByRole('button', { name: 'End Session' });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // 8. Verify redirected to login and access denied
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
