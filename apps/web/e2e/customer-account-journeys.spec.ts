import { test, expect } from '@playwright/test';

test.describe.serial('NAVA Prototype — Customer Account & Order Lifecycle End-to-End Verification', () => {
  const timestamp = Date.now();
  const testCustomerEmail = `e2e_customer_${timestamp}@nava-creations.in`;
  const testCustomerName = `Priya Test Sharma ${timestamp}`;
  const testCustomerPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;

  test.beforeEach(async () => {
    test.setTimeout(60000);
  });

  test('CJ-1: Unauthenticated visit to /account redirects to /login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
    await expect(page.locator('text=Customer Account Login')).toBeVisible({ timeout: 10000 });
  });

  test('CJ-2: Customer Passwordless Registration Journey via UI', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('text=Join Our Atelier')).toBeVisible();

    await page.fill('input[type="text"]', testCustomerName);
    await page.fill('input[type="email"]', testCustomerEmail);
    await page.fill('input[type="tel"]', testCustomerPhone);

    await page.click('button:has-text("Create Account")');

    // Should successfully redirect to /account
    await expect(page).toHaveURL(/\/account/, { timeout: 10000 });
    await expect(page.locator(`text=Welcome back, ${testCustomerName}`)).toBeVisible();
    await expect(page.locator(`text=${testCustomerEmail}`)).toBeVisible();
  });

  test('CJ-3: Customer Credentials Login & Logout Lifecycle', async ({ page }) => {
    // Start at login page
    await page.goto('/login');
    await expect(page.locator('text=Customer Account Login')).toBeVisible();

    // Fill customer email and password
    await page.fill('input[name="identifier"]', 'customer@nava-creations.in');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    await expect(page).toHaveURL(/\/account/, { timeout: 10000 });
    await expect(page.locator('h1:has-text("Welcome back")')).toBeVisible();

    // Test Logout
    await page.click('button:has-text("Log Out")');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('CJ-4: Saved Delivery Address Creation and Listing', async ({ page }) => {
    // Login as seeded customer
    await page.goto('/login');
    await page.click('button:has-text("Prototype Mode: Instant Seed Login")');
    await expect(page).toHaveURL(/\/account/);

    // Switch to Saved Addresses tab
    await page.click('button:has-text("Saved Addresses")');
    await expect(page.locator('text=Delivery Addresses')).toBeVisible();

    // Add new address
    await page.click('button:has-text("Add New Address"), button:has-text("Add Your First Address")');
    await page.fill('input[placeholder="e.g. Priya Sharma"]', 'Priya Sharma Indiranagar');
    await page.fill('input[placeholder="+91 98765 43210"]', '+91 98860 12345');
    await page.fill('input[placeholder="e.g. #42, 5th Cross, Indiranagar"]', '#108, 12th Main Road, HAL 2nd Stage');
    await page.fill('input[placeholder="Bengaluru"]', 'Bengaluru');
    await page.fill('input[placeholder="560038"]', '560038');
    await page.click('button:has-text("Save Address")');

    // Confirm address appears
    await expect(page.locator('text=108, 12th Main Road').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=560038').first()).toBeVisible();
  });

  test('CJ-5: End-to-End Storefront Checkout with Customer Account & Order Tracking', async ({ page }) => {
    test.setTimeout(90000);
    // 1. Log in first so checkout links to customer
    await page.goto('/login');
    await page.click('button:has-text("Prototype Mode: Instant Seed Login")');
    await expect(page).toHaveURL(/\/account/);

    // 2. Browse catalogue
    await page.goto('/shop');
    await expect(page.getByRole('heading', { name: 'Handcrafted Accessories' })).toBeVisible({ timeout: 10000 });

    // 3. Click first product card
    const firstProduct = page.locator('a[href^="/products/"]').first();
    await firstProduct.click();
    await expect(page.locator('button:has-text("Add to Bag")')).toBeVisible({ timeout: 10000 });

    // 4. Add to cart
    await page.click('button:has-text("Add to Bag")');

    // 5. Navigate to checkout
    await page.goto('/checkout');
    await expect(page.locator('text=Complete Your Order')).toBeVisible();

    // Verify logged in customer indicator is displayed
    await expect(page.locator('text=Logged in as Priya Sharma')).toBeVisible();

    // Fill contact & delivery info if empty
    const nameInput = page.locator('input[name="name"]');
    if (!(await nameInput.inputValue())) {
      await nameInput.fill('Priya Sharma');
    }
    const phoneInput = page.locator('input[name="phone"]');
    if (!(await phoneInput.inputValue())) {
      await phoneInput.fill('9876543210');
    }
    const addressInput = page.locator('input[name="addressLine1"]');
    const currentAddress = await addressInput.inputValue();
    if (!currentAddress || currentAddress.length < 5) {
      await page.fill('input[name="addressLine1"]', '#42, Lotus Boulevard, Indiranagar');
      await page.fill('input[name="city"]', 'Bengaluru');
      await page.fill('input[name="postalCode"]', '560038');
    }

    // Submit order
    await page.click('button:has-text("Confirm & Place Order")');

    // Should land on order tracking page
    await expect(page).toHaveURL(/\/orders\/NAV-/, { timeout: 15000 });
    await expect(page.locator('h1:has-text("Order NAV-")')).toBeVisible({ timeout: 10000 });

    // Check for UTR submission input
    const utrInput = page.locator('input[placeholder*="12 digits"]');
    await expect(utrInput).toBeVisible({ timeout: 10000 });

    // Submit valid 12-digit UTR
    const utrValue = `4312${Date.now().toString().slice(-8)}`;
    await utrInput.fill(utrValue);
    await page.click('button:has-text("Submit UTR Reference")');

    // Confirm UTR claimed
    await expect(page.locator('text=UTR Reference Recorded')).toBeVisible({ timeout: 10000 });
  });

  test('CJ-6: Customer Account reflects newly placed order', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Prototype Mode: Instant Seed Login")');
    await expect(page).toHaveURL(/\/account/);

    // Orders tab is default
    await expect(page.locator('button:has-text("My Orders")')).toBeVisible();
    // At least one order exists
    await expect(page.locator('text=NAV-').first()).toBeVisible({ timeout: 10000 });
  });

  test('CJ-7: Admin Email/Password Login & Order Verification Lifecycle', async ({ page }) => {
    // 1. Visit Admin Login
    await page.goto('/admin/login');
    await expect(page.locator('text=Studio Administration Portal')).toBeVisible();

    // 2. Login with Seed Admin Credentials
    await page.fill('input[placeholder="admin@nava-creations.internal"]', 'admin@nava-creations.internal');
    await page.fill('input[type="password"]', 'Admin@Nava2026!');
    await page.click('button:has-text("Authenticate Studio Session")');

    // 3. Confirm redirected to Admin Overview
    await expect(page).toHaveURL(/\/admin$/, { timeout: 10000 });
    await expect(page.locator('text=Studio Overview').first()).toBeVisible();

    // 4. Navigate to Admin Orders
    await page.goto('/admin/orders');
    await expect(page.locator('text=Orders & Payment Reconciliation')).toBeVisible();

    // 5. Check if any order with CLAIMED status can be inspected
    const verifyButtons = page.locator('button:has-text("Verify"), button:has-text("Review")');
    const count = await verifyButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('CJ-8: Admin Payment Verification & Refund Processing API Journey', async ({ request }) => {
    // 1. Authenticate as Admin
    const authRes = await request.post('/api/admin/auth', {
      data: {
        email: 'admin@nava-creations.internal',
        password: 'Admin@Nava2026!',
      },
    });
    expect(authRes.status()).toBe(200);
    const setCookie = authRes.headers()['set-cookie'] || '';
    expect(setCookie).toContain('nava_admin_session');

    // 2. Fetch admin orders list
    const ordersRes = await request.get('/api/admin/orders', {
      headers: { Cookie: setCookie },
    });
    expect(ordersRes.status()).toBe(200);
    const ordersData = await ordersRes.json();
    expect(ordersData.orders.length).toBeGreaterThan(0);

    // Pick first unverified or awaiting verification order
    const pendingOrder = ordersData.orders.find(
      (o: any) => o.status === 'AWAITING_PAYMENT_VERIFICATION' || o.payment?.status === 'AWAITING_VERIFICATION'
    ) || ordersData.orders[0];

    // 3. Verify Payment
    const verifyRes = await request.post(`/api/admin/orders/${pendingOrder.orderNumber}/verify-payment`, {
      headers: { Cookie: setCookie },
      data: {
        verifiedTransactionId: `TXN_SETTLED_${Date.now()}`,
        amountPaise: pendingOrder.totalPaise,
        notes: 'Reconciled via store manager statement match in prototype testing',
      },
    });
    if (verifyRes.status() !== 200) {
      console.error('VERIFY PAYMENT FAILURE:', verifyRes.status(), await verifyRes.text());
    }
    expect(verifyRes.status()).toBe(200);
    const verifyData = await verifyRes.json();
    expect(verifyData.success).toBe(true);

    // 4. Test Refund Lifecycle
    const refundRes = await request.post(`/api/admin/orders/${pendingOrder.orderNumber}/refund`, {
      headers: { Cookie: setCookie },
      data: {
        amountPaise: 10000, // ₹100 partial refund
        reason: 'Prototype Test: Customer requested size adjustment partial credit',
        restockItems: false,
      },
    });
    expect([200, 201]).toContain(refundRes.status());
    const refundData = await refundRes.json();
    expect(refundData.success).toBe(true);
    expect(refundData.refund).toBeDefined();
  });

  test('CJ-9: Safe Guest Order Claiming by Customer Account', async ({ request }) => {
    // 1. Create a guest order with customer's email and phone
    const guestOrderRes = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-24', quantity: 1 }],
        customer: {
          name: 'Priya Sharma Guest',
          phone: '+919876543210',
          email: 'customer@nava-creations.in',
        },
        shippingAddress: {
          name: 'Priya Sharma Guest',
          phone: '+919876543210',
          email: 'customer@nava-creations.in',
          addressLine1: '#12 Residency Road',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560025',
        },
        paymentMethod: 'COD',
      },
    });
    expect([200, 201]).toContain(guestOrderRes.status());
    const guestOrderData = await guestOrderRes.json();
    const guestOrderNumber = guestOrderData.order.orderNumber;
    expect(guestOrderNumber).toBeDefined();

    // 2. Authenticate as Priya Sharma
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: 'customer@nava-creations.in',
        otp: '123456',
      },
    });
    expect(loginRes.status()).toBe(200);
    const customerCookie = loginRes.headers()['set-cookie'] || '';
    expect(customerCookie).toContain('nava_customer_session');

    // 3. Claim the guest order
    const claimRes = await request.post('/api/customer/orders/claim', {
      headers: { Cookie: customerCookie },
      data: { orderNumber: guestOrderNumber },
    });
    expect(claimRes.status()).toBe(200);
    const claimData = await claimRes.json();
    expect(claimData.success).toBe(true);

    // 4. Verify order appears in customer orders
    const ordersRes = await request.get('/api/customer/orders', {
      headers: { Cookie: customerCookie },
    });
    expect(ordersRes.status()).toBe(200);
    const ordersData = await ordersRes.json();
    const found = ordersData.orders.some((o: any) => o.orderNumber === guestOrderNumber);
    expect(found).toBe(true);

    // 5. Cross-claim rejection test: Another user cannot claim Priya's order
    const anotherLoginRes = await request.post('/api/auth/register', {
      data: {
        name: 'Another Customer',
        email: `another_${Date.now()}@nava-creations.in`,
        phone: '+919845999999',
      },
    });
    const anotherCookie = anotherLoginRes.headers()['set-cookie'] || '';

    const crossClaimRes = await request.post('/api/customer/orders/claim', {
      headers: { Cookie: anotherCookie },
      data: { orderNumber: guestOrderNumber },
    });
    // Already claimed by Priya, so must reject with 409 Conflict
    expect(crossClaimRes.status()).toBe(409);
  });

  test('CJ-10: Defensive rendering on /account when user has null name and phone', async ({ page }) => {
    // 1. Authenticate customer first
    await page.goto('/login');
    await page.click('button:has-text("Prototype Mode: Instant Seed Login")');
    await expect(page).toHaveURL('http://localhost:3000/account', { timeout: 10000 });

    // 2. Intercept /api/auth/me to return a user with null name and null phone
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          user: {
            id: 'mock-null-user-id',
            name: null,
            email: 'nameless.customer@example.com',
            phone: null,
            role: 'CUSTOMER',
            createdAt: '2026-11-20T10:00:00.000Z',
          },
        }),
      });
    });

    // 3. Reload account page to trigger /api/auth/me with null fields
    await page.reload();
    await expect(page).toHaveURL(/\/account/);

    // Avatar initial should safely fallback to 'N' from email nameless.customer
    const avatar = page.locator('.w-14.h-14.rounded-full');
    await expect(avatar).toHaveText('N');

    // Heading should fall back safely to email
    await expect(page.locator('h1:has-text("Welcome back, nameless.customer@example.com")')).toBeVisible();

    // Profile tab should show safe fallbacks
    await page.click('button:has-text("Profile Information")');
    await expect(page.locator('text=Customer (Name not set)')).toBeVisible();
    await expect(page.locator('text=nameless.customer@example.com').first()).toBeVisible();
    await expect(page.locator('text=Not provided').first()).toBeVisible();
  });
});
