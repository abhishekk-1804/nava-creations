import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('Gate 2 Remediation Sprint 1: E2E Verification & Audit Remediation Suite', () => {
  const ADMIN_SECRET = process.env.ADMIN_AUTH_SECRET || 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const CRON_SECRET = process.env.CRON_SECRET || 'c1d2e3f4a5b60718293a4b5c6d7e8f90c1d2e3f4a5b60718293a4b5c6d7e8f90';
  const COOKIE_NAME = 'nava_admin_session';

  async function getAdminSessionCookie(request: any): Promise<string> {
    const res = await request.post('/api/admin/auth', {
      data: { token: ADMIN_SECRET },
    });
    const setCookie = res.headers()['set-cookie'];
    if (setCookie) {
      const match = setCookie.match(/nava_admin_session=([^;]+)/);
      if (match && match[1]) return match[1];
    }
    return '';
  }

  async function getValidAdminCookieHeader(request: any): Promise<string> {
    const token = await getAdminSessionCookie(request);
    return `${COOKIE_NAME}=${token}`;
  }

  // =========================================================================
  // 1. STATUTORY POLICIES & CUSTOMER TRUST (AUD-FIND-07 / BLK-01)
  // =========================================================================

  test('SPRINT1.01: Terms of Service page (/policies/terms) returns HTTP 200 with honest seller status', async ({ page }) => {
    const response = await page.goto('/policies/terms');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Terms & Conditions');
    await expect(page.locator('body')).toContainText('NAVA CREATIONS');
    await expect(page.locator('body')).toContainText('Seller Identity & Operating Status');
    await expect(page.locator('body')).toContainText('Bengaluru, Karnataka');
    // Trust audit: Zero placeholder exposure and zero invented corporate form
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('[Owner Action Required');
    expect(bodyText).not.toContain('Private Limited');
    expect(bodyText).not.toContain('LLP');
  });

  test('SPRINT1.02: Privacy Policy page (/policies/privacy) returns HTTP 200 with factual data flows', async ({ page }) => {
    const response = await page.goto('/policies/privacy');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Privacy Policy');
    await expect(page.locator('body')).toContainText('Data Minimization');
    await expect(page.locator('body')).toContainText('Bengaluru');
    // Trust audit: Zero placeholder exposure and zero invented third-party processors
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('[Owner Action Required');
    expect(bodyText).not.toContain('Meta Cloud API');
  });

  test('SPRINT1.03: Shipping & Delivery Policy page (/policies/shipping) returns HTTP 200 without unverified promises', async ({ page }) => {
    const response = await page.goto('/policies/shipping');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Shipping & Delivery Policy');
    await expect(page.locator('body')).toContainText('Bengaluru');
    await expect(page.locator('body')).toContainText('Protective Packaging Standard');
    // Trust audit: Zero unsupported delivery promises and zero invented PIN code counts
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('2 to 4 business days');
    expect(bodyText).not.toContain('7 to 10 business days');
    expect(bodyText).not.toContain('26,000+');
  });

  test('SPRINT1.04: Returns, Replacements & Refund Policy page (/policies/returns) returns HTTP 200 with fair remedies', async ({ page }) => {
    const response = await page.goto('/policies/returns');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('Returns, Replacements & Refunds');
    await expect(page.locator('body')).toContainText('Damaged, Defective or Transit-Broken Items');
    await expect(page.locator('body')).toContainText('Refund Initiated');
    // Trust audit: No absolute 24-hr video barrier, no blanket custom exclusion, zero placeholders
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Mandatory 24-Hour Unboxing Video Notice');
    expect(bodyText).not.toContain('[Owner Action Required');
    expect(bodyText).toContain('statutory rights');
  });

  test('SPRINT1.05: About workshop page (/about) returns HTTP 200 with modest, factual disclosures', async ({ page }) => {
    const response = await page.goto('/about');
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toContainText('About NAVA CREATIONS');
    await expect(page.locator('body')).toContainText('Bengaluru, Karnataka');
    await expect(page.locator('body')).toContainText('do not operate a walk-in retail store');
    // Trust audit: No unapproved street address exposed
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Road');
    expect(bodyText).not.toContain('Street');
    expect(bodyText).not.toContain('Layout');
    expect(bodyText).not.toContain('PIN: 560');
  });

  test('SPRINT1.06: Storefront footer renders direct links to all compliance policies', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer.locator('a[href="/policies/terms"]').first()).toBeVisible();
    await expect(footer.locator('a[href="/policies/privacy"]').first()).toBeVisible();
    await expect(footer.locator('a[href="/policies/shipping"]').first()).toBeVisible();
    await expect(footer.locator('a[href="/policies/returns"]').first()).toBeVisible();
    await expect(footer.locator('a[href="/about"]').first()).toBeVisible();
  });

  test('SPRINT1.07: Checkout page renders terms and privacy agreement notice', async ({ page }) => {
    await page.goto('/products/bespoke-kundan-heirloom-bridal-chuda-set');
    await page.waitForLoadState('networkidle');
    const sizeButton = page.getByRole('button', { name: /Size 2\.6/ });
    if (await sizeButton.isVisible()) {
      await sizeButton.click();
    }
    const addBtn = page.getByRole('button', { name: 'Add to Bag' });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Open cart page from drawer
    await page.getByRole('link', { name: /View Bag & Full Details/i }).click();
    await expect(page).toHaveURL(/\/cart/);

    // Proceed to checkout
    await page.getByRole('link', { name: /Proceed to Secure Checkout/i }).click();
    await expect(page).toHaveURL(/\/checkout/);

    await expect(page.locator('text=By confirming your order, you agree to our')).toBeVisible();
    await expect(page.locator('a[href="/policies/terms"]').first()).toBeVisible();
    await expect(page.locator('a[href="/policies/privacy"]').first()).toBeVisible();
    await expect(page.locator('a[href="/policies/returns"]').first()).toBeVisible();
  });

  // =========================================================================
  // 2. REFUND DOMAIN LIFECYCLE & ADMIN ENDPOINTS (AUD-FIND-08 / BLK-03)
  // =========================================================================

  test('SPRINT1.08: GET /api/admin/orders/[id]/refund requires admin authentication (HTTP 401)', async ({ request }) => {
    const res = await request.get('/api/admin/orders/NAV-2026-8821/refund');
    expect(res.status()).toBe(401);
  });

  test('SPRINT1.09: POST /api/admin/orders/[id]/refund requires admin authentication (HTTP 401)', async ({ request }) => {
    const res = await request.post('/api/admin/orders/NAV-2026-8821/refund', {
      data: { amountPaise: 50000, reason: 'CUSTOMER_RETURN' },
    });
    expect(res.status()).toBe(401);
  });

  test('SPRINT1.10: Authenticated GET /api/admin/orders/[id]/refund returns empty or valid refund list', async ({ request }) => {
    const cookieHeader = await getValidAdminCookieHeader(request);
    const res = await request.get('/api/admin/orders/NAV-2026-8821/refund', {
      headers: { Cookie: cookieHeader },
    });
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const data = await res.json();
      expect(Array.isArray(data.refunds)).toBe(true);
    }
  });

  test('SPRINT1.11: Authenticated POST /api/admin/orders/[id]/refund validates payload bounds', async ({ request }) => {
    const cookieHeader = await getValidAdminCookieHeader(request);
    // Invalid: negative or 0 amount
    const resZero = await request.post('/api/admin/orders/NAV-2026-8821/refund', {
      headers: { Cookie: cookieHeader },
      data: { amountPaise: 0, reason: 'CUSTOMER_RETURN' },
    });
    expect(resZero.status()).toBe(422);

    // Invalid: missing reason
    const resMissingReason = await request.post('/api/admin/orders/NAV-2026-8821/refund', {
      headers: { Cookie: cookieHeader },
      data: { amountPaise: 10000 },
    });
    expect(resMissingReason.status()).toBe(422);
  });

  // =========================================================================
  // 3. INVENTORY TIMEOUT & RESERVATION SWEEPER (AUD-FIND-01 / HP-01)
  // =========================================================================

  test('SPRINT1.12: POST /api/cron/release-reservations rejects unauthorized calls (HTTP 401)', async ({ request }) => {
    const res = await request.post('/api/cron/release-reservations');
    expect(res.status()).toBe(401);
  });

  test('SPRINT1.13: POST /api/cron/release-reservations executes with Bearer CRON_SECRET (HTTP 200)', async ({ request }) => {
    const res = await request.post('/api/cron/release-reservations', {
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(typeof body.releasedCount).toBe('number');
  });

  // =========================================================================
  // 4. DATABASE BACKUP & RESTORE SAFEGUARDS (AUD-FIND-02 / HP-03)
  // =========================================================================

  test('SPRINT1.14: Restore safeguard rejects production database targets (fail-closed)', async () => {
    const { validateTargetDatabaseSafety } = require('../../../scripts/restore-database');
    // Allowed patterns
    expect(() => validateTargetDatabaseSafety('nava_gateb_test')).not.toThrow();
    expect(() => validateTargetDatabaseSafety('nava_restore_verify_test')).not.toThrow();
    expect(() => validateTargetDatabaseSafety('disposable_staging_db')).not.toThrow();

    // Forbidden production patterns
    expect(() => validateTargetDatabaseSafety('nava_production')).toThrow(/forbidden production pattern/i);
    expect(() => validateTargetDatabaseSafety('nava_prod')).toThrow(/forbidden production pattern/i);
    expect(() => validateTargetDatabaseSafety('production')).toThrow(/forbidden production pattern/i);
    expect(() => validateTargetDatabaseSafety('prod')).toThrow(/forbidden production pattern/i);
    expect(() => validateTargetDatabaseSafety('nava')).toThrow(/forbidden production pattern/i);
  });

  test('SPRINT1.15: Automated backup creates valid non-empty archive', async () => {
    const backupsDir = path.resolve(__dirname, '../../../backups');
    expect(fs.existsSync(backupsDir)).toBe(true);
    const dumps = fs.readdirSync(backupsDir).filter((f) => f.endsWith('.dump'));
    expect(dumps.length).toBeGreaterThan(0);
    const firstDump = dumps[0];
    expect(firstDump).toBeDefined();
    if (!firstDump) throw new Error('No dump file found');
    const latestDump = path.join(backupsDir, firstDump);
    const stats = fs.statSync(latestDump);
    expect(stats.size).toBeGreaterThan(10000); // Greater than 10KB
  });
});
