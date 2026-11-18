import { test, expect } from '@playwright/test';
import { SettingsService } from '../lib/settings-service';
import { OrderService } from '../lib/order-service';

const ADMIN_SECRET =
  process.env.ADMIN_AUTH_SECRET ||
  'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
const CRON_SECRET = process.env.CRON_SECRET || 'c1d2e3f4a5b60718293a4b5c6d7e8f90c1d2e3f4a5b60718293a4b5c6d7e8f90';

// Helper to obtain authenticated admin session cookie
async function getAdminCookie(request: any): Promise<string> {
  const authRes = await request.post('/api/admin/auth', {
    data: { secretKey: ADMIN_SECRET },
  });
  const setCookie = authRes.headers()['set-cookie'] || '';
  const match = setCookie.match(/nava_admin_session=([^;]+)/);
  return match ? match[1] : '';
}

test.describe('Gate 2 Final Engineering Remediation Suite (ENG-01 to ENG-05)', () => {
  test.beforeEach(async () => {
    SettingsService.resetForTesting();
  });

  // =========================================================================
  // ENG-01: UTR VERIFICATION WINDOW & EXPIRY BOUNDARIES
  // =========================================================================

  test('ENG-01.1: Verification window retains active reservation before 24h elapses', async ({ request }) => {
    // 1. Create a fresh order
    const orderRes = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-24', quantity: 1 }],
        customer: { name: 'Aarav Mehta', phone: '+919886099901' },
        shippingAddress: {
          name: 'Aarav Mehta',
          phone: '+919886099901',
          addressLine1: '14, Cunningham Road',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560052',
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });
    expect(orderRes.status()).toBe(201);
    const orderData = await orderRes.json();
    const orderNumber = orderData.order.orderNumber;

    // 2. Submit UTR - sets status to AWAITING_PAYMENT_VERIFICATION with 24-hour verification window
    const utrRes = await request.post(`/api/orders/${orderNumber}/submit-utr`, {
      data: { claimedUtr: `UTR${Date.now()}`.slice(0, 16) },
    });
    expect(utrRes.status()).toBe(200);

    // 3. Trigger cron reservation release - this active order must NOT be expired
    const cronRes = await request.post('/api/cron/release-reservations', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    expect(cronRes.status()).toBe(200);

    // 4. Verify order remains in AWAITING_PAYMENT_VERIFICATION
    const adminCookie = await getAdminCookie(request);
    const checkRes = await request.get(`/api/admin/orders/${orderNumber}`, {
      headers: { Cookie: `nava_admin_session=${adminCookie}` },
    });
    expect(checkRes.status()).toBe(200);
    const checkData = await checkRes.json();
    expect(checkData.order.status).toBe('AWAITING_PAYMENT_VERIFICATION');
  });

  test('ENG-01.2: Cron reservation release runs safely and requires Bearer auth', async ({ request }) => {
    // Rejects unauthorized trigger
    const unauthRes = await request.post('/api/cron/release-reservations');
    expect(unauthRes.status()).toBe(401);

    // Authorizes with Bearer CRON_SECRET
    const authRes = await request.post('/api/cron/release-reservations', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    expect(authRes.status()).toBe(200);
    const body = await authRes.json();
    expect(body.success).toBe(true);
    expect(typeof body.releasedCount).toBe('number');
  });

  // =========================================================================
  // ENG-02: DYNAMIC SHIPPING CONFIGURATION & THRESHOLDS
  // =========================================================================

  test('ENG-02.1: Public GET /api/settings returns dynamic shipping thresholds', async ({ request }) => {
    const res = await request.get('/api/settings');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.settings.freeShippingThresholdPaise).toBe(199900);
    expect(body.settings.standardShippingFeePaise).toBe(15000);
    expect(body.settings.studioCity).toBe('Bengaluru');
  });

  test('ENG-02.2: Shipping fee calculation respects threshold boundaries', () => {
    // 199800 paise (₹1,998) - below threshold: incurs standard fee ₹150 (15000 paise)
    expect(SettingsService.calculateShipping(199800)).toBe(15000);

    // 199900 paise (₹1,999) - exactly at threshold: qualifies for free shipping (0 paise)
    expect(SettingsService.calculateShipping(199900)).toBe(0);

    // 200000 paise (₹2,000) - above threshold: qualifies for free shipping (0 paise)
    expect(SettingsService.calculateShipping(200000)).toBe(0);
  });

  test('ENG-02.3: Order creation dynamically updates shipping fee when store settings change', async () => {
    // Adjust settings
    await SettingsService.updateSettings({
      freeShippingThresholdPaise: 250000, // ₹2,500
      standardShippingFeePaise: 20000, // ₹200
    });

    const settings = await SettingsService.getSettings();
    expect(settings.freeShippingThresholdPaise).toBe(250000);
    expect(settings.standardShippingFeePaise).toBe(20000);

    // ₹2,000 net subtotal: under ₹2,500 threshold, so standard fee ₹200 applies
    const feeUnder = SettingsService.calculateShipping(200000, settings);
    expect(feeUnder).toBe(20000);

    // ₹2,500 net subtotal: meets threshold, free shipping applies
    const feeAt = SettingsService.calculateShipping(250000, settings);
    expect(feeAt).toBe(0);

    // Reset settings
    SettingsService.resetForTesting();
  });

  // =========================================================================
  // ENG-03: INDIAN POSTAL PIN CODE VALIDATION
  // =========================================================================

  test('ENG-03.1: Valid 6-digit Indian PIN codes starting with 1-9 pass validation', () => {
    const validPins = ['560001', '110001', '400001', '600001', '700001', '500001'];
    for (const pin of validPins) {
      expect(() => {
        OrderService.validateAddress({
          name: 'Aditi Varma',
          phone: '+919886012345',
          addressLine1: '100 Feet Road, Indiranagar',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: pin,
        });
      }).not.toThrow();
    }
  });

  test('ENG-03.2: PIN codes starting with 0 or malformed are strictly rejected', () => {
    const invalidPins = ['056001', '000000', '56001', '5600001', 'ABCDEF', '56000A', '  '];
    for (const pin of invalidPins) {
      expect(() => {
        OrderService.validateAddress({
          name: 'Aditi Varma',
          phone: '+919886012345',
          addressLine1: '100 Feet Road, Indiranagar',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: pin,
        });
      }).toThrow(/valid 6-digit Indian PIN code/i);
    }
  });

  test('ENG-03.3: POST /api/orders rejects invalid PIN code starting with 0 (HTTP 422)', async ({ request }) => {
    const res = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-24', quantity: 1 }],
        customer: { name: 'Test User', phone: '+919886012345', email: 'test@example.in' },
        shippingAddress: {
          name: 'Test User',
          phone: '+919886012345',
          addressLine1: '42, MG Road',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '056001', // Starts with 0 — invalid Indian postal code
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });

    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.message).toMatch(/valid 6-digit Indian PIN code/i);
  });

  // =========================================================================
  // ENG-04: DATABASE-LEVEL UTR PROTECTION & REPLAY DEFENSE
  // =========================================================================

  test('ENG-04.1: Submitting verified UTR on another order throws ConflictError (HTTP 409)', async ({ request }) => {
    const adminCookie = await getAdminCookie(request);

    // 1. Create Order A
    const orderResA = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-24', quantity: 1 }],
        customer: { name: 'Customer A', phone: '+919886011111' },
        shippingAddress: {
          name: 'Customer A',
          phone: '+919886011111',
          addressLine1: '1, Commercial Street',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560001',
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });
    expect(orderResA.status()).toBe(201);
    const orderDataA = await orderResA.json();
    const orderNumberA = orderDataA.order.orderNumber;
    const testUtr = `REPLAY${Date.now()}`.slice(0, 16);

    // 2. Submit UTR on Order A
    const utrResA = await request.post(`/api/orders/${orderNumberA}/submit-utr`, {
      data: { claimedUtr: testUtr },
    });
    expect(utrResA.status()).toBe(200);

    // 3. Admin verifies Order A payment
    const verifyRes = await request.post(`/api/admin/orders/${orderNumberA}/verify-payment`, {
      headers: { Cookie: `nava_admin_session=${adminCookie}` },
      data: {
        verifiedTransactionId: testUtr,
        amountPaise: orderDataA.order.totalPaise,
        notes: 'Verified against bank credit ledger',
      },
    });
    expect(verifyRes.status()).toBe(200);

    // 4. Create Order B
    const orderResB = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-24', quantity: 1 }],
        customer: { name: 'Customer B', phone: '+919886022222' },
        shippingAddress: {
          name: 'Customer B',
          phone: '+919886022222',
          addressLine1: '2, Residency Road',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560025',
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });
    expect(orderResB.status()).toBe(201);
    const orderDataB = await orderResB.json();
    const orderNumberB = orderDataB.order.orderNumber;

    // 5. Attempt replay attack: Submit Order A's verified UTR on Order B
    const replayRes = await request.post(`/api/orders/${orderNumberB}/submit-utr`, {
      data: { claimedUtr: testUtr },
    });

    expect(replayRes.status()).toBe(409); // Conflict
    const replayBody = await replayRes.json();
    expect(replayBody.message).toMatch(/already been verified and credited/i);
  });

  test('ENG-04.2: Concurrent UTR submissions across separate requests serialize safely and prevent unflagged duplicate claims', async ({ request }) => {
    // 1. Create two separate active orders
    const createOrder = async (name: string, phone: string) => {
      const res = await request.post('/api/orders', {
        data: {
          items: [{ variantId: 'var-1-24', quantity: 1 }],
          customer: { name, phone },
          shippingAddress: {
            name,
            phone,
            addressLine1: '123 MG Road',
            city: 'Bengaluru',
            stateCode: '29',
            stateName: 'Karnataka',
            postalCode: '560001',
          },
          paymentMethod: 'UPI_MERCHANT_QR',
        },
      });
      expect(res.status()).toBe(201);
      return (await res.json()).order.orderNumber;
    };

    const orderNum1 = await createOrder('Concurrent User 1', '+919886044441');
    const orderNum2 = await createOrder('Concurrent User 2', '+919886044442');

    const concurrentUtr = `CONC${Date.now()}`.slice(0, 16);

    // 2. Fire concurrent UTR submission requests simultaneously
    const [res1, res2] = await Promise.all([
      request.post(`/api/orders/${orderNum1}/submit-utr`, { data: { claimedUtr: concurrentUtr } }),
      request.post(`/api/orders/${orderNum2}/submit-utr`, { data: { claimedUtr: concurrentUtr } }),
    ]);

    expect(res1.status()).toBe(200);
    expect(res2.status()).toBe(200);

    const body1 = await res1.json();
    const body2 = await res2.json();

    const dupFlags = [body1.order.payment.isDuplicateClaim, body2.order.payment.isDuplicateClaim];
    // Exactly one original claim (false) and one flagged duplicate (true)
    expect(dupFlags.filter((f) => f === false).length).toBe(1);
    expect(dupFlags.filter((f) => f === true).length).toBe(1);
  });

  test('ENG-04.3: Concurrent payment verification with identical transaction ID is rejected by database unique constraint (HTTP 409)', async ({ request }) => {
    const adminCookie = await getAdminCookie(request);

    const createOrder = async (name: string, phone: string, utr: string) => {
      const res = await request.post('/api/orders', {
        data: {
          items: [{ variantId: 'var-1-24', quantity: 1 }],
          customer: { name, phone },
          shippingAddress: {
            name,
            phone,
            addressLine1: '456 Brigade Road',
            city: 'Bengaluru',
            stateCode: '29',
            stateName: 'Karnataka',
            postalCode: '560025',
          },
          paymentMethod: 'UPI_MERCHANT_QR',
        },
      });
      expect(res.status()).toBe(201);
      const data = await res.json();
      await request.post(`/api/orders/${data.order.orderNumber}/submit-utr`, { data: { claimedUtr: utr } });
      return data.order;
    };

    const sharedVerifiedTxId = `VRF${Date.now()}`.slice(0, 16);
    const ord1 = await createOrder('Verif User 1', '+919886055551', sharedVerifiedTxId);
    const ord2 = await createOrder('Verif User 2', '+919886055552', `DIFF${Date.now()}`.slice(0, 16));

    // Concurrently verify both orders with the EXACT SAME verifiedTransactionId
    const [ver1, ver2] = await Promise.all([
      request.post(`/api/admin/orders/${ord1.orderNumber}/verify-payment`, {
        headers: { Cookie: `nava_admin_session=${adminCookie}` },
        data: {
          verifiedTransactionId: sharedVerifiedTxId,
          amountPaise: ord1.totalPaise,
          notes: 'Admin verification 1',
        },
      }),
      request.post(`/api/admin/orders/${ord2.orderNumber}/verify-payment`, {
        headers: { Cookie: `nava_admin_session=${adminCookie}` },
        data: {
          verifiedTransactionId: sharedVerifiedTxId,
          amountPaise: ord2.totalPaise,
          notes: 'Admin verification 2',
        },
      }),
    ]);

    const statuses = [ver1.status(), ver2.status()];
    // Exactly one succeeds (200) and one fails with 409 Conflict due to database unique constraint
    expect(statuses).toContain(200);
    expect(statuses).toContain(409);
  });

  test('ENG-04.4: UTR normalization across API endpoints strictly enforces trimming, upper-casing, regex and length boundaries', async ({ request }) => {
    const createOrder = async (name: string, phone: string) => {
      const res = await request.post('/api/orders', {
        data: {
          items: [{ variantId: 'var-1-24', quantity: 1 }],
          customer: { name, phone },
          shippingAddress: {
            name,
            phone,
            addressLine1: '789 Commercial Street',
            city: 'Bengaluru',
            stateCode: '29',
            stateName: 'Karnataka',
            postalCode: '560001',
          },
          paymentMethod: 'UPI_MERCHANT_QR',
        },
      });
      expect(res.status()).toBe(201);
      return (await res.json()).order.orderNumber;
    };

    // 1. Whitespace padding and lowercase normalization
    const ord1 = await createOrder('Norm User 1', '+919886066661');
    const resNorm = await request.post(`/api/orders/${ord1}/submit-utr`, {
      data: { claimedUtr: '   upi4312abc9988   ' },
    });
    expect(resNorm.status()).toBe(200);
    const bodyNorm = await resNorm.json();
    expect(bodyNorm.order.payment.claimedUtr).toBe('UPI4312ABC9988');

    // 2. Internal spaces rejection
    const ord2 = await createOrder('Norm User 2', '+919886066662');
    const resSpaces = await request.post(`/api/orders/${ord2}/submit-utr`, {
      data: { claimedUtr: '4312 9999 8888' },
    });
    expect(resSpaces.status()).toBe(400);

    // 3. Special characters rejection
    const ord3 = await createOrder('Norm User 3', '+919886066663');
    const resSpecial = await request.post(`/api/orders/${ord3}/submit-utr`, {
      data: { claimedUtr: '4312-9999-8888!' },
    });
    expect(resSpecial.status()).toBe(400);

    // 4. Empty reference rejection
    const ord4 = await createOrder('Norm User 4', '+919886066664');
    const resEmpty = await request.post(`/api/orders/${ord4}/submit-utr`, {
      data: { claimedUtr: '     ' },
    });
    expect(resEmpty.status()).toBe(422);

    // 5. Length boundaries: 22 chars valid, 23 chars rejected
    const ord5Valid = await createOrder('Norm User 5A', '+919886066665');
    const utr22 = 'A'.repeat(22);
    const res22 = await request.post(`/api/orders/${ord5Valid}/submit-utr`, {
      data: { claimedUtr: utr22 },
    });
    expect(res22.status()).toBe(200);
    expect((await res22.json()).order.payment.claimedUtr).toBe(utr22);

    const ord5Invalid = await createOrder('Norm User 5B', '+919886066666');
    const utr23 = 'A'.repeat(23);
    const res23 = await request.post(`/api/orders/${ord5Invalid}/submit-utr`, {
      data: { claimedUtr: utr23 },
    });
    expect(res23.status()).toBe(400);
  });

  // =========================================================================
  // ENG-05: CUSTOMER ORDER TRACKING UI FOR CANCELLED & REFUNDED STATES
  // =========================================================================

  test('ENG-05.1: Cancelled order renders cancellation banner and hides payment QR', async ({ request, page }) => {
    const adminCookie = await getAdminCookie(request);

    // 1. Create an order
    const orderRes = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-24', quantity: 1 }],
        customer: { name: 'Rohan Mehra', phone: '+919886033333' },
        shippingAddress: {
          name: 'Rohan Mehra',
          phone: '+919886033333',
          addressLine1: '3, Lavelle Road',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560001',
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });
    expect(orderRes.status()).toBe(201);
    const setCookie = orderRes.headers()['set-cookie'] || '';
    const orderData = await orderRes.json();
    const orderNumber = orderData.order.orderNumber;

    // 2. Admin cancels the order
    const cancelRes = await request.patch(`/api/admin/orders/${orderNumber}`, {
      headers: { Cookie: `nava_admin_session=${adminCookie}` },
      data: {
        status: 'CANCELLED',
        reason: 'Customer requested order cancellation',
      },
    });
    expect(cancelRes.status()).toBe(200);

    // 3. Extract cookie value and visit customer order tracking page
    const cookieMatch = setCookie.match(new RegExp(`nava_order_${orderNumber}=([^;]+)`));
    if (cookieMatch && cookieMatch[1]) {
      await page.context().addCookies([
        {
          name: `nava_order_${orderNumber}`,
          value: cookieMatch[1],
          domain: '127.0.0.1',
          path: `/api/orders/${orderNumber}`,
        },
      ]);
    }

    await page.goto(`/orders/${orderNumber}`);
    await page.waitForLoadState('networkidle');

    // 4. Assert cancellation banner is displayed and payment QR form is suppressed
    await expect(page.locator('text=Order Cancelled — Inventory Reservation Released')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Browse Workshop to Re-order')).toBeVisible();
    await expect(page.locator('text=Beneficiary UPI VPA')).not.toBeVisible();
    await expect(page.locator('button:has-text("Submit Reference for Verification")')).not.toBeVisible();
  });
});
