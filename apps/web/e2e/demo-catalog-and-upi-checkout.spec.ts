import { test, expect } from '@playwright/test';

test.describe('NAVA CREATIONS — Navigation Routes, Demo Catalog & End-to-End UPI Checkout', () => {
  test('1. All Header Navigation routes resolve cleanly with Zero 404s', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    // Audit Desktop Navigation Links
    const linksToTest = [
      { text: 'Shop All', expectedUrl: /\/shop$/ },
      { text: 'Handmade Bangles', expectedUrl: /\/shop\?category=handmade-bangles/ },
      { text: 'Bridal Sets', expectedUrl: /\/collections\/bridal-edit-2026/ },
      { text: 'Kundan Artistry', expectedUrl: /\/collections\/kundan-artistry/ },
      { text: 'Return Gifts', expectedUrl: /\/shop\?category=return-gifts/ },
      { text: 'Contact & Studio', expectedUrl: /\/contact/ },
    ];

    for (const item of linksToTest) {
      await page.goto('http://localhost:3000/');
      const link = page.locator(`header nav a:has-text("${item.text}")`).first();
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(item.expectedUrl);
      // Ensure zero 404s
      await expect(page.locator('text=404').first()).toHaveCount(0);
      await expect(page.locator('text=This page could not be found').first()).toHaveCount(0);
    }
  });

  test('2. All Footer Category & Collection routes resolve cleanly with Zero 404s', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    const footerCategories = [
      { text: 'Handmade Bangles', expectedUrl: /\/shop\?category=handmade-bangles/ },
      { text: 'Bridal Sets & Chuda', expectedUrl: /\/shop\?category=bridal-jewellery/ },
      { text: 'Kundan Artistry', expectedUrl: /\/collections\/kundan-artistry/ },
      { text: 'Hair Accessories', expectedUrl: /\/shop\?category=hair-accessories/ },
      { text: 'Return Gifts & Favours', expectedUrl: /\/shop\?category=return-gifts/ },
    ];

    for (const item of footerCategories) {
      await page.goto('http://localhost:3000/');
      const link = page.locator(`footer a:has-text("${item.text}")`).first();
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(item.expectedUrl);
      await expect(page.locator('text=404').first()).toHaveCount(0);
    }
  });

  test('3. Legacy /categories/[slug] requests gracefully handle routes without 404', async ({ page }) => {
    // 1. Known Category slug loads category page cleanly
    await page.goto('http://localhost:3000/categories/handmade-bangles');
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=404').first()).toHaveCount(0);

    // 2. Collection slug hitting /categories/ redirects to /collections/
    await page.goto('http://localhost:3000/categories/bridal-edit-2026');
    await expect(page).toHaveURL(/\/collections\/bridal-edit-2026/);
    await expect(page.locator('text=404').first()).toHaveCount(0);

    // 3. Unknown category slug redirects to /shop?category=... (zero 404 guarantee)
    await page.goto('http://localhost:3000/categories/custom-bangle-trousseau');
    await expect(page).toHaveURL(/\/shop\?category=custom-bangle-trousseau/);
    await expect(page.locator('text=404').first()).toHaveCount(0);
  });

  test('4. Catalogue (/shop) populates with Demo Products & Indian Bangle Sizes (2.2, 2.4, 2.6, 2.8)', async ({ page }) => {
    await page.goto('http://localhost:3000/shop');
    await expect(page.locator('h1').first()).toContainText('Handcrafted Accessories');

    // Check that seeded demo products are present
    const rubyChuda = page.locator('text=Ruby Jadau Bridal Chuda').first();
    const antiqueBangles = page.locator('text=Antique Gold Kundan Bangles').first();
    const kempSet = page.locator('text=Classic Kemp Set').first();
    const meenakariKada = page.locator('text=Regal Meenakari Bridal Kada').first();

    await expect(rubyChuda).toBeVisible({ timeout: 10000 });
    await expect(antiqueBangles).toBeVisible({ timeout: 10000 });
    await expect(kempSet).toBeVisible({ timeout: 10000 });
    await expect(meenakariKada).toBeVisible({ timeout: 10000 });

    // Click into Ruby Jadau Bridal Chuda
    await rubyChuda.click();
    await expect(page).toHaveURL(/\/products\/ruby-jadau-bridal-chuda/);

    // Verify all 4 Indian Bangle sizes are rendered as options
    const sizeButtons = page.getByRole('button', { name: /Size 2\.[2468]/ });
    await expect(sizeButtons).toHaveCount(4);

    // Verify In Stock indicator
    await expect(page.locator('text=In Stock').first()).toBeVisible();
  });

  test('5. End-to-End Storefront Checkout with UPI & 12-Digit UTR Submission', async ({ page }) => {
    // 1. Browse catalogue and add a 2.4 bangle to cart
    await page.goto('http://localhost:3000/products/ruby-jadau-bridal-chuda');
    await expect(page.locator('h1').first()).toContainText('Ruby Jadau Bridal Chuda');

    // Select Size 2.4 specifically
    const size24Button = page.locator('button:has-text("2.4")').first();
    await size24Button.click();

    // Add to cart
    await page.click('button:has-text("Add to Bag")');
    await expect(page.locator('text=Piece added to your shopping bag!')).toBeVisible({ timeout: 10000 });

    // 2. Navigate to /checkout
    await page.goto('http://localhost:3000/checkout');
    await expect(page.locator('h1:has-text("Complete Your Order")')).toBeVisible({ timeout: 10000 });

    // Verify payment selection section is active and reads sovereign payment settings
    const upiRadio = page.locator('input[value="UPI_MERCHANT_QR"]');
    await expect(upiRadio).toBeVisible();
    await expect(upiRadio).toBeChecked();

    // Fill delivery form
    await page.fill('input[name="name"]', 'Deepa Jayaram');
    await page.fill('input[name="phone"]', '9845012345');
    await page.fill('input[name="email"]', 'deepa.jayaram@example.com');
    await page.fill('input[name="addressLine1"]', 'Flat 402, Shanthi Niketan Apartments, 5th Cross');
    await page.fill('input[name="city"]', 'Bengaluru');
    await page.selectOption('select[name="stateCode"]', '29');
    await page.fill('input[name="postalCode"]', '560001');

    // 3. Confirm and place order
    await page.click('button:has-text("Confirm & Place Order")');

    // 4. Verify landing on order confirmation page (/orders/NAV-...)
    await expect(page).toHaveURL(/\/orders\/NAV-/, { timeout: 15000 });
    const orderHeading = page.locator('h1:has-text("Order NAV-")');
    await expect(orderHeading).toBeVisible({ timeout: 10000 });
    const orderTitle = await orderHeading.innerText();
    const orderNumber = orderTitle.replace('Order ', '').trim();
    expect(orderNumber).toMatch(/^NAV-/);

    // 5. Submit 12-Digit UTR
    const utrInput = page.locator('input[placeholder*="12 digits"]');
    await expect(utrInput).toBeVisible({ timeout: 10000 });

    const testUtr = `4312${Date.now().toString().slice(-8)}`;
    await utrInput.fill(testUtr);
    await page.click('button:has-text("Submit UTR Reference")');

    // Confirm UTR recorded
    await expect(page.locator('text=UTR Reference Recorded')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${testUtr}`)).toBeVisible();

    // 6. Verify that /checkout/success?orderNumber=... displays Order ID
    await page.goto(`http://localhost:3000/checkout/success?orderNumber=${orderNumber}`);
    await expect(page.locator('h1:has-text("Order Successfully Placed")')).toBeVisible();
    await expect(page.locator(`text=${orderNumber}`)).toBeVisible();
  });
});
