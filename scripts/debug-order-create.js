const http = require('http');

const data = JSON.stringify({
  items: [{ variantId: 'var-1-26', quantity: 1 }],
  customer: { name: 'Kavya Subramanian', phone: '+919886123456', email: 'kavya@example.in' },
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
});

// Also test PATCH /api/admin/orders/NAV-2026-8821
const patchData = JSON.stringify({
  status: 'SHIPPED',
  courierAwb: 'DELHIVERY-BLR-99812-V2',
  reason: 'Handed over to BlueDart courier partner',
});

async function testApi() {
  const { loadEnvTest } = require('./test-db-guard');
  const env = loadEnvTest();
  process.env.DATABASE_URL = env.DATABASE_URL;
  process.env.DIRECT_URL = env.DIRECT_URL;
  process.env.ADMIN_AUTH_SECRET = 'placeholder_minimum_32_character_cryptographic_secret';

  // Test OrderService.createOrder directly to see the exact error
  const { OrderService } = require('../apps/web/lib/order-service');
  try {
    const res = await OrderService.createOrder(JSON.parse(data));
    console.log('[SUCCESS] Order created:', res.orderNumber, res.status);
  } catch (err) {
    console.error('[FAIL ORDER CREATE]:', err.message, err.stack);
  }
}

testApi();
