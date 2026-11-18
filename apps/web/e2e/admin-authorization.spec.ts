import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';

test.describe('Sprint 2H Phase B: Admin Authentication & Authorization Verification', () => {
  const ADMIN_SECRET = process.env.ADMIN_AUTH_SECRET || 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const COOKIE_NAME = 'nava_admin_session';

  // Helper to construct a signed session token
  function makeSessionToken(rawId: string, expiryTimestamp: number, secret: string) {
    const expiryStr = expiryTimestamp.toString();
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${rawId}.${expiryStr}`);
    const signature = hmac.digest('hex');
    return `${rawId}.${expiryStr}.${signature}`;
  }

  // 1. Unauthenticated route redirects
  test('B2.1: Unauthenticated visit to /admin redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('text=Studio Administration Portal')).toBeVisible();
  });

  test('B2.2: Unauthenticated visit to /admin/products redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/products');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('B2.3: Unauthenticated visit to /admin/inventory redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/inventory');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('B2.4: Unauthenticated visit to /admin/orders redirects to /admin/login', async ({ page }) => {
    await page.goto('/admin/orders');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  // 2. Unauthenticated API calls
  test('B2.5: Unauthenticated POST /api/admin/catalog/products returns HTTP 401', async ({ request }) => {
    const res = await request.post('/api/admin/catalog/products', {
      data: { name: 'Test Unauthorized' },
    });
    expect(res.status()).toBe(401);
  });

  test('B2.6: Unauthenticated PUT /api/admin/catalog/products/[id] returns HTTP 401', async ({ request }) => {
    const res = await request.put('/api/admin/catalog/products/test-id', {
      data: { name: 'Test Unauthorized' },
    });
    expect(res.status()).toBe(401);
  });

  test('B2.7: Unauthenticated DELETE /api/admin/catalog/products/[id] returns HTTP 401', async ({ request }) => {
    const res = await request.delete('/api/admin/catalog/products/test-id');
    expect(res.status()).toBe(401);
  });

  test('B2.8: Unauthenticated POST /api/admin/inventory/[variantId] returns HTTP 401', async ({ request }) => {
    const res = await request.post('/api/admin/inventory/var-1-26', {
      data: { availableQty: 10 },
    });
    expect(res.status()).toBe(401);
  });

  // 3. Login credential validation
  test('B2.9: POST /api/admin/auth with missing credentials returns HTTP 400', async ({ request }) => {
    const res = await request.post('/api/admin/auth', {
      data: {},
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('required');
  });

  test('B2.10: POST /api/admin/auth with invalid credentials returns HTTP 401', async ({ request }) => {
    const res = await request.post('/api/admin/auth', {
      data: { token: 'completely_wrong_secret_key_12345' },
    });
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid administrative credentials');
  });

  // 4. Tampered & expired tokens
  test('B2.11: Tampered session cookie is rejected with HTTP 401 on admin API endpoints', async ({
    request,
  }) => {
    const rawId = 'abcdef0123456789abcdef0123456789abcdef0123456789';
    const futureExpiry = Date.now() + 3600 * 1000;
    // Forge invalid signature
    const tamperedToken = `${rawId}.${futureExpiry}.invalid000000000000000000000000000000000000000000000000000000000000`;

    const res = await request.post('/api/admin/catalog/products', {
      headers: {
        Cookie: `${COOKIE_NAME}=${tamperedToken}`,
      },
      data: { name: 'Attempt with Tampered Token' },
    });
    expect(res.status()).toBe(401);
  });

  test('B2.12: Expired session token is rejected with HTTP 401 on admin API endpoints', async ({ request }) => {
    const rawId = 'abcdef0123456789abcdef0123456789abcdef0123456789';
    const pastExpiry = Date.now() - 3600 * 1000; // 1 hour in the past
    const expiredToken = makeSessionToken(rawId, pastExpiry, ADMIN_SECRET);

    const res = await request.post('/api/admin/catalog/products', {
      headers: {
        Cookie: `${COOKIE_NAME}=${expiredToken}`,
      },
      data: { name: 'Attempt with Expired Token' },
    });
    expect(res.status()).toBe(401);
  });

  // 5. Complete authenticated lifecycle: login, protected access, logout, access after logout
  test('B2.13: Full session lifecycle (login, protected access, logout, access after logout)', async ({
    page,
    request,
  }) => {
    // 1. Login
    await page.goto('/admin/login');
    await page.locator('input[type="password"]').fill(ADMIN_SECRET);
    await page.getByRole('button', { name: 'Authenticate Studio Session' }).click();

    // 2. Redirected to /admin
    await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 });
    await expect(page.locator('h1')).toContainText('Studio Overview');

    // Extract session cookie from browser context
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find((c) => c.name === COOKIE_NAME);
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);

    // Verify authorized API access with active session
    const apiRes = await request.post('/api/admin/catalog/products', {
      headers: {
        Cookie: `${COOKIE_NAME}=${sessionCookie?.value}`,
      },
      data: {
        name: 'Validated Atelier Kada',
        pricePaise: 499900,
        categoryId: 'cat-bangles',
      },
    });
    // In development mode without DB, it should either create or raise 503, never 401 Unauthorized
    expect(apiRes.status()).not.toBe(401);

    // 3. Logout
    await page.waitForLoadState('networkidle');
    const logoutBtn = page.getByRole('button', { name: 'End Session' });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // 4. Verify redirected to login
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });

    // 5. Attempt to access /admin after logout
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);

    // 6. Direct API access after logout is rejected
    const postLogoutApiRes = await request.post('/api/admin/catalog/products', {
      data: { name: 'Attempt Post-Logout' },
    });
    expect(postLogoutApiRes.status()).toBe(401);
  });
});
