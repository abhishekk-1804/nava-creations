import { test, expect } from '@playwright/test';
import crypto from 'node:crypto';

test.describe('Phase 2 Master Commerce: Customer Checkout & Admin Operations Verification', () => {
  const ADMIN_SECRET = 'placeholder_minimum_32_character_cryptographic_secret';

  // Helper to generate a valid administrative HMAC session token
  const createAdminSessionCookie = (): string => {
    const rawId = crypto.randomBytes(24).toString('hex');
    const expiryTimestamp = (Date.now() + 86400 * 1000).toString();
    const hmac = crypto.createHmac('sha256', ADMIN_SECRET);
    hmac.update(`${rawId}.${expiryTimestamp}`);
    const signature = hmac.digest('hex');
    return `${rawId}.${expiryTimestamp}.${signature}`;
  };

  test('ORD-01: Customer Web Checkout with BharatPe UPI QR instructions (HTTP 201)', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: {
        items: [
          {
            variantId: 'var-1-26', // Regal Kundan Bridal Chuda Set (Size 2.6) - ₹3,499.00
            quantity: 1,
          },
        ],
        customer: {
          name: 'Kavya Subramanian',
          phone: '+919886123456',
          email: 'kavya@example.in',
        },
        shippingAddress: {
          name: 'Kavya Subramanian',
          phone: '+919886123456',
          addressLine1: 'Flat 402, Shanthi Niketan',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560001',
        },
        paymentMethod: 'UPI_MERCHANT_QR',
        customerNotes: 'Please ensure velvet box packaging for bridal gift',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.order).toBeDefined();
    expect(body.order.orderNumber).toMatch(/^NAV-2026-\d{4}$/);
    expect(body.order.status).toBe('AWAITING_PAYMENT_VERIFICATION');
    expect(body.order.totalPaise).toBe(349900); // Free shipping over ₹1,999
    expect(body.order.paymentMethod).toBe('UPI_MERCHANT_QR');
    expect(body.order.paymentInstructions).toBeDefined();
    expect(body.order.paymentInstructions.upiIntentUrl).toContain('upi://pay');
    expect(body.order.paymentInstructions.vpa).toContain('bharatpe');
  });

  test('ORD-02: Customer submits 12-digit UPI Bank UTR reference (HTTP 200)', async ({ request }) => {
    // 1. Create order
    const orderRes = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-24', quantity: 1 }],
        customer: { name: 'Deepa Hegde', phone: '+919845001122' },
        shippingAddress: {
          name: 'Deepa Hegde',
          phone: '+919845001122',
          addressLine1: '12, 8th Main, Malleshwaram',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560003',
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });
    expect(orderRes.status()).toBe(201);
    const orderData = await orderRes.json();
    const orderNumber = orderData.order.orderNumber;

    // 2. Submit UTR
    const utrRes = await request.post(`/api/orders/${orderNumber}/submit-utr`, {
      data: { claimedUtr: '431288990011' },
    });
    expect(utrRes.status()).toBe(200);
    const utrBody = await utrRes.json();
    expect(utrBody.success).toBe(true);
    expect(utrBody.order.payment.claimedUtr).toBe('431288990011');
    expect(utrBody.order.payment.isDuplicateClaim).toBe(false);
  });

  test('ORD-03: Duplicate UTR claim across distinct orders flags audit alert', async ({ request }) => {
    const sharedUtr = '431299999999';

    // Order 1
    const res1 = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-24', quantity: 1 }],
        customer: { name: 'User A', phone: '+919845000001' },
        shippingAddress: {
          name: 'User A',
          phone: '+919845000001',
          addressLine1: 'Address A',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560001',
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });
    const ord1 = (await res1.json()).order.orderNumber;
    await request.post(`/api/orders/${ord1}/submit-utr`, { data: { claimedUtr: sharedUtr } });

    // Order 2 with identical UTR
    const res2 = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-26', quantity: 1 }],
        customer: { name: 'User B', phone: '+919845000002' },
        shippingAddress: {
          name: 'User B',
          phone: '+919845000002',
          addressLine1: 'Address B',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560002',
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });
    const ord2 = (await res2.json()).order.orderNumber;
    const utr2Res = await request.post(`/api/orders/${ord2}/submit-utr`, { data: { claimedUtr: sharedUtr } });
    expect(utr2Res.status()).toBe(200);
    const utr2Body = await utr2Res.json();
    expect(utr2Body.order.payment.isDuplicateClaim).toBe(true);
  });

  test('ORD-04: Cash on Delivery (COD) order placement (HTTP 201)', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-2-24', quantity: 1 }], // Temple Nakshi Kada Pair - ₹1,899.00
        customer: { name: 'Rohit Kulkarni', phone: '+919988776655' },
        shippingAddress: {
          name: 'Rohit Kulkarni',
          phone: '+919988776655',
          addressLine1: 'B-201, Green Glen Layout, Bellandur',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560103',
        },
        paymentMethod: 'COD',
      },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();
    expect(body.order.paymentMethod).toBe('COD');
    expect(body.order.status).toBe('PENDING_PAYMENT');
    expect(body.order.payment.status).toBe('PENDING_COLLECTION');
    // Under ₹1,999 adds standard ₹150 delivery: 189900 + 15000 = 204900 paise
    expect(body.order.totalPaise).toBe(204900);
  });

  test('ORD-05: Validation failure on invalid PIN code or phone number (HTTP 422)', async ({ request }) => {
    const response = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-24', quantity: 1 }],
        customer: { name: 'Invalid User', phone: '123' }, // Invalid phone
        shippingAddress: {
          name: 'Invalid User',
          phone: '123',
          addressLine1: 'Short',
          city: 'BLR',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560', // Invalid PIN
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });

    expect(response.status()).toBe(422);
    const body = await response.json();
    expect(body.error).toBe('Validation failed');
  });

  test('ORD-06: Public order tracking retrieval (HTTP 200)', async ({ request }) => {
    // Lookup pre-seeded sample order
    const response = await request.get('/api/orders/NAV-2026-8821');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.order.orderNumber).toBe('NAV-2026-8821');
    expect(body.order.totalPaise).toBe(349900);
  });

  test('ORD-07: Admin orders list retrieval with valid session (HTTP 200)', async ({ request }) => {
    const adminToken = createAdminSessionCookie();
    const response = await request.get('/api/admin/orders', {
      headers: {
        Cookie: `nava_admin_session=${adminToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.orders)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  test('ORD-08: Admin verifies UPI payment against bank ledger credit (HTTP 200)', async ({ request }) => {
    const adminToken = createAdminSessionCookie();

    // 1. Create fresh order awaiting verification
    const orderRes = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-26', quantity: 1 }],
        customer: { name: 'Lakshmi Narayanan', phone: '+919944001122' },
        shippingAddress: {
          name: 'Lakshmi Narayanan',
          phone: '+919944001122',
          addressLine1: 'No 5, Gandhi Bazaar, Basavanagudi',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560004',
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });
    const orderNumber = (await orderRes.json()).order.orderNumber;
    await request.post(`/api/orders/${orderNumber}/submit-utr`, {
      data: { claimedUtr: '431277665544' },
    });

    // 2. Admin verifies bank credit
    const verifyRes = await request.post(`/api/admin/orders/${orderNumber}/verify-payment`, {
      headers: { Cookie: `nava_admin_session=${adminToken}` },
      data: {
        verifiedTransactionId: `BANK-CR-${Date.now()}`,
        amountPaise: 349900,
        notes: 'Verified via BharatPe merchant daily settlement report',
      },
    });

    expect(verifyRes.status()).toBe(200);
    const verifyBody = await verifyRes.json();
    expect(verifyBody.success).toBe(true);
    expect(verifyBody.order.status).toBe('PAYMENT_CONFIRMED');
    expect(verifyBody.order.payment.status).toBe('VERIFIED');
  });

  test('ORD-09: Admin order fulfillment dispatch and AWB assignment (HTTP 200)', async ({ request }) => {
    const adminToken = createAdminSessionCookie();

    // Move sample order to SHIPPED
    const patchRes = await request.patch('/api/admin/orders/NAV-2026-8821', {
      headers: { Cookie: `nava_admin_session=${adminToken}` },
      data: {
        status: 'SHIPPED',
        courierAwb: 'DELHIVERY-BLR-99812-V2',
        reason: 'Handed over to BlueDart courier partner',
      },
    });

    expect(patchRes.status()).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.order.status).toBe('SHIPPED');
    expect(patchBody.order.courierAwb).toBe('DELHIVERY-BLR-99812-V2');
  });

  test('ORD-10: Admin enquiries list retrieval and status update (HTTP 200)', async ({ request }) => {
    const adminToken = createAdminSessionCookie();

    // 1. List enquiries
    const listRes = await request.get('/api/admin/enquiries', {
      headers: { Cookie: `nava_admin_session=${adminToken}` },
    });
    expect(listRes.status()).toBe(200);
    const listBody = await listRes.json();
    expect(Array.isArray(listBody.enquiries)).toBe(true);
    expect(listBody.enquiries.length).toBeGreaterThanOrEqual(1);

    const firstEnq = listBody.enquiries[0].enquiryNumber;

    // 2. Update status
    const updateRes = await request.patch(`/api/admin/enquiries/${firstEnq}`, {
      headers: { Cookie: `nava_admin_session=${adminToken}` },
      data: { status: 'CONTACTED' },
    });
    expect(updateRes.status()).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.enquiry.status).toBe('CONTACTED');
  });

  test('ORD-11: Unauthenticated request to admin orders returns HTTP 401', async ({ request }) => {
    const response = await request.get('/api/admin/orders');
    expect(response.status()).toBe(401);
  });

  test('ORD-12: Unauthenticated request to admin enquiries returns HTTP 401', async ({ request }) => {
    const response = await request.get('/api/admin/enquiries');
    expect(response.status()).toBe(401);
  });
});
