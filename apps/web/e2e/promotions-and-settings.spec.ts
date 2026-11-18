import { test, expect } from '@playwright/test';

test.describe('Work Packages E2E: Promotions, Studio Settings, Taxonomy & Fulfillment', () => {
  const ADMIN_SECRET = process.env.ADMIN_AUTH_SECRET || 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
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

  // ---------------------------------------------------------------------------
  // 1. Public Coupon Validation API
  // ---------------------------------------------------------------------------
  test('WP-PROMO 1.1: Valid coupon code returns discount calculation', async ({ request }) => {
    const res = await request.post('/api/promotions/validate', {
      data: {
        code: 'BRIDAL10',
        subtotalPaise: 250000, // ₹2,500 (> ₹2,000 threshold)
      },
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.coupon.code).toBe('BRIDAL10');
    expect(data.discountPaise).toBe(25000); // 10% of 2500 = ₹250
    expect(data.newTotalPaise).toBe(225000);
  });

  test('WP-PROMO 1.2: Minimum order threshold violation is rejected with 422', async ({ request }) => {
    const res = await request.post('/api/promotions/validate', {
      data: {
        code: 'BRIDAL10',
        subtotalPaise: 100000, // ₹1,000 (< ₹2,000 minimum)
      },
    });

    expect(res.status()).toBe(422);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain('Minimum order');
  });

  test('WP-PROMO 1.3: Non-existent coupon code returns 404', async ({ request }) => {
    const res = await request.post('/api/promotions/validate', {
      data: {
        code: 'NON_EXISTENT_COUPON_99',
        subtotalPaise: 500000,
      },
    });

    expect(res.status()).toBe(404);
    const data = await res.json();
    expect(data.valid).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 2. Admin Settings Management
  // ---------------------------------------------------------------------------
  test('WP-SETTINGS 2.1: Unauthenticated GET /api/admin/settings returns 401', async ({ request }) => {
    const res = await request.get('/api/admin/settings');
    expect(res.status()).toBe(401);
  });

  test('WP-SETTINGS 2.2: Authenticated GET and PATCH /api/admin/settings works correctly', async ({
    request,
  }) => {
    const cookieHeader = await getValidAdminCookieHeader(request);

    // GET settings
    const getRes = await request.get('/api/admin/settings', {
      headers: { Cookie: cookieHeader },
    });
    expect(getRes.status()).toBe(200);
    const getData = await getRes.json();
    expect(getData.success).toBe(true);
    expect(getData.settings.studioName).toBeDefined();

    // PATCH settings
    const patchRes = await request.patch('/api/admin/settings', {
      headers: { Cookie: cookieHeader },
      data: {
        upiVpa: 'nava.creations@bharatpe',
        merchantName: 'NAVA CREATIONS BENGALURU',
        freeShippingThresholdPaise: 199900,
        codEnabled: true,
        codMaxPaise: 500000,
      },
    });

    expect(patchRes.status()).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.success).toBe(true);
    expect(patchData.settings.merchantName).toBe('NAVA CREATIONS BENGALURU');
    expect(patchData.settings.freeShippingThresholdPaise).toBe(199900);
  });

  // ---------------------------------------------------------------------------
  // 3. Admin Merchandising: Categories & Collections API
  // ---------------------------------------------------------------------------
  test('WP-MERCH 3.1: Admin Categories CRUD operations', async ({ request }) => {
    const cookieHeader = await getValidAdminCookieHeader(request);

    // GET categories
    const getRes = await request.get('/api/admin/catalog/categories', {
      headers: { Cookie: cookieHeader },
    });
    expect(getRes.status()).toBe(200);
    const getData = await getRes.json();
    expect(getData.success).toBe(true);
    expect(Array.isArray(getData.categories)).toBe(true);

    // POST create category
    const uniqueSlug = `test-cat-${Date.now()}`;
    const createRes = await request.post('/api/admin/catalog/categories', {
      headers: { Cookie: cookieHeader },
      data: {
        name: 'Heritage Temple Bangles',
        slug: uniqueSlug,
        hsnCode: '7117',
        description: 'Traditional temple jewelry bangle sets',
      },
    });
    expect(createRes.status()).toBe(201);
    const createData = await createRes.json();
    expect(createData.success).toBe(true);
    expect(createData.category.name).toBe('Heritage Temple Bangles');

    // PATCH update category
    const catId = createData.category.id;
    const patchRes = await request.patch(`/api/admin/catalog/categories/${catId}`, {
      headers: { Cookie: cookieHeader },
      data: {
        isActive: false,
      },
    });
    expect(patchRes.status()).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.category.isActive).toBe(false);
  });

  test('WP-MERCH 3.2: Admin Collections CRUD operations', async ({ request }) => {
    const cookieHeader = await getValidAdminCookieHeader(request);

    // GET collections
    const getRes = await request.get('/api/admin/catalog/collections', {
      headers: { Cookie: cookieHeader },
    });
    expect(getRes.status()).toBe(200);
    const getData = await getRes.json();
    expect(getData.success).toBe(true);
    expect(Array.isArray(getData.collections)).toBe(true);

    // POST create collection
    const uniqueSlug = `test-col-${Date.now()}`;
    const createRes = await request.post('/api/admin/catalog/collections', {
      headers: { Cookie: cookieHeader },
      data: {
        name: 'Festive Diwali Edit 2026',
        slug: uniqueSlug,
        description: 'Curated auspicious deepavali gold thread bangles',
        displayOrder: 10,
        status: 'PUBLISHED',
      },
    });
    expect(createRes.status()).toBe(201);
    const createData = await createRes.json();
    expect(createData.success).toBe(true);
    expect(createData.collection.name).toBe('Festive Diwali Edit 2026');

    // PATCH toggle collection
    const colId = createData.collection.id;
    const patchRes = await request.patch(`/api/admin/catalog/collections/${colId}`, {
      headers: { Cookie: cookieHeader },
      data: {
        status: 'DRAFT',
      },
    });
    expect(patchRes.status()).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.collection.status).toBe('DRAFT');
  });

  // ---------------------------------------------------------------------------
  // 4. Atelier Packing Slip UI
  // ---------------------------------------------------------------------------
  test('WP-FULFILL 4.1: Unauthenticated visit to packing slip redirects to login', async ({ page }) => {
    await page.goto('/admin/orders/NAV-2026-8821/packing-slip');
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('WP-FULFILL 4.2: Authenticated visit renders printable atelier packing slip', async ({
    page,
    request,
    context,
  }) => {
    // Set valid session cookie
    const token = await getAdminSessionCookie(request);

    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: token,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/admin/orders/NAV-2026-8821/packing-slip');

    // Verify packing slip elements
    await expect(page.locator('text=NAVA CREATIONS')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=ATELIER PACKING SLIP')).toBeVisible();
    await expect(page.getByText('Order #NAV-2026-8821', { exact: true })).toBeVisible();
    await expect(page.locator('text=Ananya Rao')).toBeVisible();
    await expect(page.locator('text=Atelier Quality Inspection')).toBeVisible();
    await expect(page.locator('text=HSN Code: 7117')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // 5. Admin Settings UI Page
  // ---------------------------------------------------------------------------
  test('WP-SETTINGS 5.1: Authenticated admin settings UI displays all form sections', async ({
    page,
    request,
    context,
  }) => {
    const token = await getAdminSessionCookie(request);

    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: token,
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    await page.goto('/admin/settings');

    await expect(page.locator('h1')).toContainText('Studio Settings & Policies', { timeout: 15000 });
    await expect(page.locator('text=Sovereign Direct UPI Gateway')).toBeVisible();
    await expect(page.locator('text=Atelier Identity & Dispatch Origin')).toBeVisible();
    await expect(page.locator('text=Customer Concierge & Social Channels')).toBeVisible();
    await expect(page.locator('text=Shipping Rates & Cash on Delivery (COD) Rules')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Configuration' })).toBeVisible();
  });
});
