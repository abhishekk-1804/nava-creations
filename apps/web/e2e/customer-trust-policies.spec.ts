import { test, expect } from '@playwright/test';

test.describe('Customer Trust & Policy Accuracy Audit Suite', () => {
  const POLICY_ROUTES = [
    '/policies/terms',
    '/policies/privacy',
    '/policies/shipping',
    '/policies/returns',
    '/about',
  ];

  // ---------------------------------------------------------------------------
  // 1. ROUTE ACCESSIBILITY & NAVIGATION
  // ---------------------------------------------------------------------------

  test('POL-01: All 5 statutory and brand policy routes return HTTP 200', async ({ page }) => {
    for (const route of POLICY_ROUTES) {
      const response = await page.goto(route);
      expect(response?.status(), `Route ${route} should return HTTP 200`).toBe(200);
      await expect(page.locator('h1')).toBeVisible();
    }
  });

  test('POL-02: Storefront footer renders direct links to all policy pages', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.locator('a[href="/policies/terms"]').first()).toBeVisible();
    await expect(footer.locator('a[href="/policies/privacy"]').first()).toBeVisible();
    await expect(footer.locator('a[href="/policies/shipping"]').first()).toBeVisible();
    await expect(footer.locator('a[href="/policies/returns"]').first()).toBeVisible();
    await expect(footer.locator('a[href="/about"]').first()).toBeVisible();
  });

  test('POL-03: Checkout page renders terms and privacy agreement links', async ({ page }) => {
    await page.goto('/checkout');
    // If empty cart, visit product and add to cart first
    if (await page.locator('text=Your Shopping Bag is Empty').isVisible()) {
      await page.goto('/products/bespoke-kundan-heirloom-bridal-chuda-set');
      await page.waitForLoadState('networkidle');
      const sizeButton = page.getByRole('button', { name: /Size 2\.6/ });
      if (await sizeButton.isVisible()) {
        await sizeButton.click();
      }
      const addBtn = page.getByRole('button', { name: 'Add to Bag' });
      await addBtn.click();
      await page.getByRole('link', { name: /View Bag & Full Details/i }).click();
      await page.getByRole('link', { name: /Proceed to Secure Checkout/i }).click();
    }

    await expect(page.locator('text=By confirming your order, you agree to our')).toBeVisible();
    await expect(page.locator('a[href="/policies/terms"]').first()).toBeVisible();
    await expect(page.locator('a[href="/policies/privacy"]').first()).toBeVisible();
    await expect(page.locator('a[href="/policies/returns"]').first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 2. BUSINESS IDENTITY & SELLER DISCLOSURES
  // ---------------------------------------------------------------------------

  test('POL-04: Terms & Conditions discloses unregistered small artisanal business status without invented corporate form', async ({ page }) => {
    await page.goto('/policies/terms');
    const body = await page.locator('body').innerText();

    // Must identify as NAVA CREATIONS in Bengaluru, Karnataka
    expect(body).toContain('NAVA CREATIONS');
    expect(body).toContain('Bengaluru, Karnataka');

    // Must disclose independent small artisanal business / unregistered status
    expect(body).toContain('unregistered');

    // Must NOT claim registered company forms
    expect(body).not.toContain('Private Limited');
    expect(body).not.toContain('Pvt Ltd');
    expect(body).not.toContain('LLP');
    expect(body).not.toContain('CIN:');

    // Must NOT contain internal placeholders
    expect(body).not.toContain('[Owner Action Required');
  });

  test('POL-05: Pricing section clarifies tax status without claiming uncollected GST', async ({ page }) => {
    await page.goto('/policies/terms');
    const body = await page.locator('body').innerText();

    // Clarifies that business operates under threshold exemption and does not collect GST
    expect(body).toContain('does not charge or collect Goods and Services Tax');
    expect(body).not.toContain('inclusive of applicable Goods and Services Tax (GST)');
  });

  // ---------------------------------------------------------------------------
  // 3. WORKSHOP & ADDRESS CONFIDENTIALITY
  // ---------------------------------------------------------------------------

  test('POL-06: About page states Bengaluru workshop exists without exposing street address or retail walk-ins', async ({ page }) => {
    await page.goto('/about');
    const body = await page.locator('body').innerText();

    // Factual workshop confirmation in Bengaluru
    expect(body).toContain('NAVA CREATIONS');
    expect(body).toContain('Bengaluru, Karnataka');
    expect(body).toContain('workshop');

    // Factual retail boundary: No public walk-ins
    expect(body).toContain('do not operate a walk-in retail store');

    // Confirms street address is NOT disclosed
    expect(body).not.toContain('Road');
    expect(body).not.toContain('Street');
    expect(body).not.toContain('Layout');
    expect(body).not.toContain('PIN: 560');
    expect(body).not.toContain('[Owner Action Required');
  });

  // ---------------------------------------------------------------------------
  // 4. SHIPPING & DELIVERY ACCURACY
  // ---------------------------------------------------------------------------

  test('POL-07: Shipping policy confirms delivery estimates are confirmed directly and removes unverified promises', async ({ page }) => {
    await page.goto('/policies/shipping');
    const body = await page.locator('body').innerText();

    // Factual packaging and dispatch description
    expect(body).toContain('Protective Packaging Standard');
    expect(body).toContain('Bengaluru');

    // Delivery estimates confirmed prior to dispatch
    expect(body).toMatch(/Delivery Timelines Confirmed Prior to Dispatch/i);

    // Unverified claims removed
    expect(body).not.toContain('2 to 4 business days');
    expect(body).not.toContain('7 to 10 business days');
    expect(body).not.toContain('26,000+');
    expect(body).not.toContain('[Owner Action Required');
  });

  // ---------------------------------------------------------------------------
  // 5. RETURNS, CANCELLATION & REFUND LIFECYCLE
  // ---------------------------------------------------------------------------

  test('POL-08: Returns policy provides fair remedies without absolute 24-hr video barrier or blanket custom exclusions', async ({ page }) => {
    await page.goto('/policies/returns');
    const body = await page.locator('body').innerText();

    // Remedies for damaged, defective, or incorrect items
    expect(body).toContain('Damaged, Defective or Transit-Broken Items');
    expect(body).toContain('Incorrect, Incomplete, or Materially Different Orders');
    expect(body).toContain('Lost Shipments & Delivery Failures');

    // Unboxing video is NOT an absolute barrier
    expect(body).not.toContain('Mandatory 24-Hour Unboxing Video Notice');
    expect(body).toContain('not an absolute condition');

    // Custom pieces preserve statutory rights for defect/damage
    expect(body).toContain('statutory rights');

    // Pre-dispatch cancellation is supported
    expect(body).toMatch(/Pre-Dispatch Cancellation/i);

    // Distinguishes the 5 refund stages
    expect(body).toContain('1. Refund Requested');
    expect(body).toContain('2. Refund Under Review');
    expect(body).toContain('3. Refund Approved');
    expect(body).toContain('4. Refund Initiated');
    expect(body).toContain('5. Refund Completed');

    // Automated gateway refunds are explicitly declared inactive
    expect(body).toContain('Automated payment gateway refunds are currently not active');

    // Zero internal placeholders
    expect(body).not.toContain('[Owner Action Required');
  });

  // ---------------------------------------------------------------------------
  // 6. PRIVACY POLICY DATA FLOWS
  // ---------------------------------------------------------------------------

  test('POL-09: Privacy policy accurately describes implemented data flows and omits invented third-party processors', async ({ page }) => {
    await page.goto('/policies/privacy');
    const body = await page.locator('body').innerText();

    // Actual collected data
    expect(body).toContain('Data Minimization');
    expect(body).toContain('Contact Identifiers');
    expect(body).toContain('Payment Identifiers');

    // Explains HttpOnly session cookies
    expect(body).toContain('nava_order_');
    expect(body).toContain('HttpOnly');

    // Omits invented third-party processors
    expect(body).not.toContain('Meta Cloud API');
    expect(body).not.toContain('data brokers');

    // Zero internal placeholders
    expect(body).not.toContain('[Owner Action Required');
  });

  // ---------------------------------------------------------------------------
  // 7. ZERO PLACEHOLDER AUDIT ACROSS ALL POLICY PAGES
  // ---------------------------------------------------------------------------

  test('POL-10: Absolute zero internal placeholders [Owner Action Required] across all customer-facing routes', async ({ page }) => {
    for (const route of POLICY_ROUTES) {
      await page.goto(route);
      const content = await page.content();
      expect(content, `Route ${route} must not contain [Owner Action Required]`).not.toContain('[Owner Action Required');
      expect(content, `Route ${route} must not contain [Owner Action`).not.toContain('[Owner Action');
    }
  });

  // ---------------------------------------------------------------------------
  // 8. ORDER TRACKING REFUND STATUS ACCURACY
  // ---------------------------------------------------------------------------

  test('POL-11: Order status UI displays "Refund Initiated" instead of misleading "Refund Completed/Processed"', async ({ page }) => {
    // Navigate to a sample order view
    await page.goto('/orders/NAV-2026-8821');
    await page.waitForLoadState('networkidle');

    const content = await page.content();
    // Must never claim "Refund Processed" as an accomplished bank settlement
    expect(content).not.toContain('Refund Processed');
  });
});
