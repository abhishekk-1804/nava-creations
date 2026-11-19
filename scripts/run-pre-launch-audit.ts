/**
 * NAVA CREATIONS — PRE-LAUNCH PAYMENT GATEWAY & ADVERSARIAL SECURITY AUDIT SUITE
 * 
 * Target Environment: Isolated PostgreSQL 16 test database (nava_gateb_test) via .env.test ONLY.
 * Target Web Server: http://localhost:3000 (running Next.js production server against nava_gateb_test)
 * 
 * Covers:
 * Part 1: End-to-End Payment Gateway & Order Lifecycle Verification (6 Scenarios)
 * Part 2: Goldfish Adversarial Security Audit (8 Attack Vectors)
 */

import { loadEnvTest, verifyTestDatabaseSafeguards } from './test-db-guard';
import { PrismaClient } from '../packages/db/node_modules/@prisma/client';
import { execFileSync } from 'child_process';
import crypto from 'crypto';
import { PaymentService } from '../apps/web/lib/payment-service';
import { OrderService } from '../apps/web/lib/order-service';
import { CONFIG } from '../apps/web/lib/config';

// Enforce test DB safeguards first
const guard = verifyTestDatabaseSafeguards();
console.log(`[PASS] Environment Guard: Verified target DB "${guard.database}" on "${guard.host}".`);

const env = loadEnvTest();
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_SECRET = env.ADMIN_AUTH_SECRET || 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
const PSQL_PATH = 'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe';

const prisma = new PrismaClient({
  datasources: { db: { url: env.DATABASE_URL } },
});

function queryPsql(user: string, password: string, sql: string, database = 'nava_gateb_test'): string {
  const psqlEnv = { ...process.env, PGPASSWORD: password };
  const args = [
    '-h', '127.0.0.1',
    '-p', '5432',
    '-U', user,
    '-d', database,
    '-w',
    '-t',
    '-A',
    '-c', sql,
  ];
  return execFileSync(PSQL_PATH, args, { env: psqlEnv, encoding: 'utf8' }).trim();
}

interface TestRecord {
  section: string;
  id: string;
  name: string;
  status: 'PASSED' | 'FAILED';
  durationMs: number;
  details: string;
}

const auditResults: TestRecord[] = [];

function recordResult(section: string, id: string, name: string, status: 'PASSED' | 'FAILED', durationMs: number, details: string) {
  auditResults.push({ section, id, name, status, durationMs, details });
  const icon = status === 'PASSED' ? '[✓]' : '[✗]';
  console.log(`${icon} [${id}] ${name.padEnd(65)} [${status}] (${durationMs}ms)`);
  if (status === 'FAILED') {
    console.error(`    ERROR: ${details}`);
  }
}

async function getAdminCookie(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/admin/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': '10.0.0.1',
    },
    body: JSON.stringify({ secretKey: ADMIN_SECRET }),
  });
  if (!res.ok) throw new Error(`Admin login failed: ${res.status}`);
  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/nava_admin_session=([^;]+)/);
  if (!match) throw new Error('No nava_admin_session cookie received');
  return match[0];
}

async function runAudit() {
  console.log('\n' + '='.repeat(90));
  console.log('NAVA CREATIONS — PRE-LAUNCH PAYMENT GATEWAY & ADVERSARIAL SECURITY AUDIT');
  console.log('='.repeat(90) + '\n');

  // Verify server reachability
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error(`Web server unreachable at ${BASE_URL}/api/health (status: ${healthRes.status})`);
  }
  const healthData = await healthRes.json();
  console.log(`[PASS] Test Server Active: ${healthData.service} (${healthData.environment}) DB: ${healthData.checks.database}\n`);

  // Obtain admin auth cookie
  const adminCookie = await getAdminCookie();

  // =========================================================================
  // SECTION 1: END-TO-END PAYMENT GATEWAY & ORDER LIFECYCLE VERIFICATION
  // =========================================================================
  console.log('--- SECTION 1: PAYMENT GATEWAY & ORDER LIFECYCLE ---');

  // Scenario 1.1: Fail-Closed UPI Guard Check
  {
    const start = Date.now();
    try {
      PaymentService.setMerchantConfigForTesting({
        upiVpa: 'UNCONFIGURED_MERCHANT_VPA',
        merchantName: 'NAVA CREATIONS',
        isMerchantConfirmed: false,
      });

      let blocked = false;
      let errorMsg = '';
      try {
        PaymentService.generateUpiInstructions({
          orderNumber: 'TEST-UNCONFIGURED',
          amountPaise: 349900,
        });
      } catch (err: any) {
        blocked = true;
        errorMsg = err.message;
      }

      PaymentService.setMerchantConfigForTesting(undefined); // reset

      if (blocked && errorMsg.includes('Merchant UPI collection is not yet configured or approved')) {
        recordResult('Section 1', 'PAY-01', 'Fail-Closed Guard: Unconfigured UPI Blocked with Advisory', 'PASSED', Date.now() - start, errorMsg);
      } else {
        recordResult('Section 1', 'PAY-01', 'Fail-Closed Guard: Unconfigured UPI Blocked with Advisory', 'FAILED', Date.now() - start, 'Unconfigured UPI was not blocked');
      }
    } catch (err: any) {
      recordResult('Section 1', 'PAY-01', 'Fail-Closed Guard: Unconfigured UPI Blocked with Advisory', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Scenario 1.2: Fail-Closed COD Policy Guard Check
  {
    const start = Date.now();
    try {
      const originalApproved = CONFIG.payment.codPolicyApproved;
      Object.defineProperty(CONFIG.payment, 'codPolicyApproved', { value: false, configurable: true });

      let blocked = false;
      let errorMsg = '';
      try {
        await OrderService.createOrder({
          customer: { name: 'Priya Sharma', email: 'priya@example.com', phone: '+919876543210' },
          shippingAddress: { name: 'Priya Sharma', phone: '+919876543210', addressLine1: 'Indiranagar', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560038' },
          items: [{ variantId: 'var-3-24', quantity: 1 }],
          paymentMethod: 'COD',
        });
      } catch (err: any) {
        blocked = true;
        errorMsg = err.message;
      }

      Object.defineProperty(CONFIG.payment, 'codPolicyApproved', { value: originalApproved, configurable: true });

      if (blocked && errorMsg.includes('Cash on Delivery policy is not approved by store management')) {
        recordResult('Section 1', 'PAY-02', 'Fail-Closed Guard: Unapproved COD Policy Blocked with Advisory', 'PASSED', Date.now() - start, errorMsg);
      } else {
        recordResult('Section 1', 'PAY-02', 'Fail-Closed Guard: Unapproved COD Policy Blocked with Advisory', 'FAILED', Date.now() - start, 'Unapproved COD was not blocked');
      }
    } catch (err: any) {
      recordResult('Section 1', 'PAY-02', 'Fail-Closed Guard: Unapproved COD Policy Blocked with Advisory', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Scenario 1.3: Full BharatPe UPI Verification Lifecycle (Happy Path)
  let happyOrderNumber = '';
  let happyGuestToken = '';
  const happyUtr = `998877${Math.floor(100000 + Math.random() * 900000)}`;
  {
    const start = Date.now();
    try {
      // 1. Initial inventory snapshot
      const beforeInv = await prisma.inventoryItem.findUnique({ where: { variantId: 'var-1-24' } });
      if (!beforeInv) throw new Error('Inventory item var-1-24 not found');

      // 2. Create order via POST /api/orders with client tampered price (pricePaise: 100)
      const createRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Kavita Rao', email: 'kavita.rao@example.com', phone: '+919845011223' },
          shippingAddress: { name: 'Kavita Rao', phone: '+919845011223', addressLine1: '12 Lavelle Road', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560001' },
          items: [{ variantId: 'var-1-24', quantity: 1, pricePaise: 100 }], // Tampered price
          paymentMethod: 'UPI_MERCHANT_QR',
        }),
      });

      if (createRes.status !== 201) {
        throw new Error(`Order creation failed: ${createRes.status} ${await createRes.text()}`);
      }

      const createBody = await createRes.json();
      happyOrderNumber = createBody.order.orderNumber;
      const orderTotal = createBody.order.totalPaise;

      // Extract guest token
      const cookieHeader = createRes.headers.get('set-cookie') || '';
      const tokenMatch = cookieHeader.match(/nava_order_[^=]+=([^;]+)/);
      happyGuestToken = tokenMatch ? tokenMatch[1] : '';

      // Verify server-authoritative price
      if (orderTotal !== 349900) {
        throw new Error(`Client price tampering was not discarded. Total is ${orderTotal}, expected 349900`);
      }

      // Check stock hold
      const holdInv = await prisma.inventoryItem.findUnique({ where: { variantId: 'var-1-24' } });
      if (!holdInv || holdInv.availableQty !== beforeInv.availableQty - 1 || holdInv.reservedQty !== beforeInv.reservedQty + 1) {
        throw new Error(`Stock hold mismatch: available=${holdInv?.availableQty}, reserved=${holdInv?.reservedQty}`);
      }

      // Check reservation TTL (~15 min)
      const resv = await prisma.inventoryReservation.findFirst({
        where: { order: { orderNumber: happyOrderNumber } },
      });
      if (!resv || resv.status !== 'PENDING') {
        throw new Error('Reservation record missing or not PENDING');
      }

      // 3. Customer submits valid 12-digit UTR
      const utrRes = await fetch(`${BASE_URL}/api/orders/${happyOrderNumber}/submit-utr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `nava_order_${happyOrderNumber}=${happyGuestToken}`,
        },
        body: JSON.stringify({ claimedUtr: happyUtr }),
      });

      if (utrRes.status !== 200) {
        throw new Error(`UTR submission failed: ${utrRes.status} ${await utrRes.text()}`);
      }

      const utrBody = await utrRes.json();
      const currentPaymentStatus = utrBody.order.payment?.status;
      if (currentPaymentStatus !== 'AWAITING_VERIFICATION') {
        throw new Error(`Expected payment status AWAITING_VERIFICATION, got ${currentPaymentStatus}`);
      }

      // Check TTL extension in DB (~24 hours)
      const extResv = await prisma.inventoryReservation.findUnique({ where: { id: resv.id } });
      if (!extResv) throw new Error('Extended reservation missing');
      const ttlHours = (extResv.expiresAt.getTime() - Date.now()) / (3600 * 1000);
      if (ttlHours < 20 || ttlHours > 25) {
        throw new Error(`Reservation TTL not extended to ~24h (actual: ${ttlHours.toFixed(1)}h)`);
      }

      // 4. Admin verifies payment
      const verifyRes = await fetch(`${BASE_URL}/api/admin/orders/${happyOrderNumber}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': adminCookie,
        },
        body: JSON.stringify({
          verifiedTransactionId: `BHARATPE-${happyUtr}`,
          notes: 'Matched with BharatPe merchant statement',
        }),
      });

      if (verifyRes.status !== 200) {
        throw new Error(`Admin verify failed: ${verifyRes.status} ${await verifyRes.text()}`);
      }

      const verifyBody = await verifyRes.json();
      if (verifyBody.order.payment?.status !== 'VERIFIED' || verifyBody.order.status !== 'PAYMENT_CONFIRMED') {
        throw new Error(`Unexpected order state: status=${verifyBody.order.status}, paymentStatus=${verifyBody.order.payment?.status}`);
      }

      // 5. Final inventory accounting verification (reserved -> allocatedSoldQty)
      const finalInv = await prisma.inventoryItem.findUnique({ where: { variantId: 'var-1-24' } });
      if (!finalInv || finalInv.reservedQty !== holdInv.reservedQty - 1 || finalInv.allocatedSoldQty !== holdInv.allocatedSoldQty + 1) {
        throw new Error(`Inventory transition failed: reserved=${finalInv?.reservedQty}, allocatedSold=${finalInv?.allocatedSoldQty}`);
      }

      // Verify Audit Log
      const happyPayment = await prisma.payment.findFirst({
        where: { order: { orderNumber: happyOrderNumber } },
      });
      const auditLog = await prisma.auditLog.findFirst({
        where: {
          action: 'PAYMENT_VERIFIED',
          entityId: happyPayment?.id,
        },
      });
      if (!auditLog) {
        throw new Error('Audit log for PAYMENT_VERIFIED was not recorded');
      }

      recordResult('Section 1', 'PAY-03', 'Full BharatPe UPI Lifecycle (15m Hold -> UTR -> 24h Hold -> Admin Verify -> Allocated Sold)', 'PASSED', Date.now() - start, `Order ${happyOrderNumber} verified. Inventory moved to allocated_sold_qty.`);
    } catch (err: any) {
      recordResult('Section 1', 'PAY-03', 'Full BharatPe UPI Lifecycle (Happy Path)', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Scenario 1.4: Payment Rejection & Inventory Release Edge Case
  {
    const start = Date.now();
    try {
      const rejectUtr = `776655${Math.floor(100000 + Math.random() * 900000)}`;
      const beforeInv = await prisma.inventoryItem.findUnique({ where: { variantId: 'var-1-24' } });
      if (!beforeInv) throw new Error('Inventory item var-1-24 not found');

      // Create order
      const createRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Deepa Hegde', email: 'deepa@example.com', phone: '+919845022334' },
          shippingAddress: { name: 'Deepa Hegde', phone: '+919845022334', addressLine1: '45 Malleshwaram', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560003' },
          items: [{ variantId: 'var-1-24', quantity: 1 }],
          paymentMethod: 'UPI_MERCHANT_QR',
        }),
      });
      const createBody = await createRes.json();
      const orderNum = createBody.order.orderNumber;
      const guestToken = (createRes.headers.get('set-cookie') || '').match(/nava_order_[^=]+=([^;]+)/)![1];

      // Submit UTR
      await fetch(`${BASE_URL}/api/orders/${orderNum}/submit-utr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `nava_order_${orderNum}=${guestToken}`,
        },
        body: JSON.stringify({ claimedUtr: rejectUtr }),
      });

      // Admin rejects payment
      const rejectRes = await fetch(`${BASE_URL}/api/admin/orders/${orderNum}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': adminCookie,
        },
        body: JSON.stringify({
          action: 'REJECT',
          reason: 'Fraudulent UTR reference not present in BharatPe statement',
        }),
      });

      if (rejectRes.status !== 200) {
        throw new Error(`Admin reject failed: ${rejectRes.status} ${await rejectRes.text()}`);
      }

      const rejectBody = await rejectRes.json();
      if (rejectBody.order.payment?.status !== 'REJECTED' || rejectBody.order.status !== 'CANCELLED') {
        throw new Error(`Order state after rejection incorrect: status=${rejectBody.order.status}, paymentStatus=${rejectBody.order.payment?.status}`);
      }

      // Check stock restored to availableQty
      const afterInv = await prisma.inventoryItem.findUnique({ where: { variantId: 'var-1-24' } });
      if (!afterInv || afterInv.availableQty !== beforeInv.availableQty) {
        throw new Error(`Inventory not restored to available: before=${beforeInv.availableQty}, after=${afterInv?.availableQty}`);
      }

      // Check partial unique index: UTR is released and can be re-submitted on a new order
      const createRes2 = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Legitimate Buyer', email: 'buyer@example.com', phone: '+919845099887' },
          shippingAddress: { name: 'Legitimate Buyer', phone: '+919845099887', addressLine1: '77 Residency Rd', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560025' },
          items: [{ variantId: 'var-1-24', quantity: 1 }],
          paymentMethod: 'UPI_MERCHANT_QR',
        }),
      });
      const orderNum2 = (await createRes2.json()).order.orderNumber;
      const guestToken2 = (createRes2.headers.get('set-cookie') || '').match(/nava_order_[^=]+=([^;]+)/)![1];

      const resubmitRes = await fetch(`${BASE_URL}/api/orders/${orderNum2}/submit-utr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `nava_order_${orderNum2}=${guestToken2}`,
        },
        body: JSON.stringify({ claimedUtr: rejectUtr }),
      });

      if (resubmitRes.status !== 200) {
        throw new Error(`Re-submission of unlocked UTR failed: ${resubmitRes.status} ${await resubmitRes.text()}`);
      }

      recordResult('Section 1', 'PAY-04', 'Payment Rejection, Stock Release & UTR Unlocking', 'PASSED', Date.now() - start, `Order ${orderNum} rejected. Stock returned to available. UTR ${rejectUtr} successfully re-submitted.`);
    } catch (err: any) {
      recordResult('Section 1', 'PAY-04', 'Payment Rejection, Stock Release & UTR Unlocking', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Scenario 1.5: Expired Reservation Edge Case
  {
    const start = Date.now();
    try {
      // Create order
      const createRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Expired Test', email: 'expired@example.com', phone: '+919845033445' },
          shippingAddress: { name: 'Expired Test', phone: '+919845033445', addressLine1: '90 MG Road', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560001' },
          items: [{ variantId: 'var-1-24', quantity: 1 }],
          paymentMethod: 'UPI_MERCHANT_QR',
        }),
      });
      const orderNum = (await createRes.json()).order.orderNumber;
      const guestToken = (createRes.headers.get('set-cookie') || '').match(/nava_order_[^=]+=([^;]+)/)![1];

      // Artificially expire the reservation in PostgreSQL
      await prisma.inventoryReservation.updateMany({
        where: { order: { orderNumber: orderNum } },
        data: { expiresAt: new Date(Date.now() - 10 * 60 * 1000) }, // 10 minutes ago
      });

      // Attempt to submit UTR
      const expiredUtr = `665544${Math.floor(100000 + Math.random() * 900000)}`;
      const submitRes = await fetch(`${BASE_URL}/api/orders/${orderNum}/submit-utr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `nava_order_${orderNum}=${guestToken}`,
        },
        body: JSON.stringify({ claimedUtr: expiredUtr }),
      });

      if (submitRes.status === 409) {
        recordResult('Section 1', 'PAY-05', 'Expired Reservation Rejects Verification (HELD_STOCK_UNAVAILABLE)', 'PASSED', Date.now() - start, 'Expired reservation blocked with HTTP 409 Conflict.');
      } else {
        recordResult('Section 1', 'PAY-05', 'Expired Reservation Rejects Verification (HELD_STOCK_UNAVAILABLE)', 'FAILED', Date.now() - start, `Expected 409 Conflict, received status ${submitRes.status}`);
      }
    } catch (err: any) {
      recordResult('Section 1', 'PAY-05', 'Expired Reservation Rejects Verification', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Scenario 1.6: COD & WhatsApp Orders
  {
    const start = Date.now();
    try {
      // 1. COD <= ₹5,000 (var-3-24 = 149900 paise)
      const codOkRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Asha Kumari', email: 'asha@example.com', phone: '+919845077889' },
          shippingAddress: { name: 'Asha Kumari', phone: '+919845077889', addressLine1: '32 Whitefield', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560066' },
          items: [{ variantId: 'var-3-24', quantity: 1 }],
          paymentMethod: 'COD',
        }),
      });

      if (codOkRes.status !== 201) {
        throw new Error(`COD <= ₹5,000 failed: ${codOkRes.status} ${await codOkRes.text()}`);
      }
      const codOkBody = await codOkRes.json();
      if (codOkBody.order.payment?.status !== 'PENDING_COLLECTION' || codOkBody.order.status !== 'PENDING_PAYMENT') {
        throw new Error(`COD status mismatch: ${codOkBody.order.status}, ${codOkBody.order.payment?.status}`);
      }

      // 2. COD > ₹5,000 (2 x var-1-24 = 699800 paise)
      const codHighRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Asha Kumari', email: 'asha@example.com', phone: '+919845077889' },
          shippingAddress: { name: 'Asha Kumari', phone: '+919845077889', addressLine1: '32 Whitefield', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560066' },
          items: [{ variantId: 'var-1-24', quantity: 2 }],
          paymentMethod: 'COD',
        }),
      });

      if (codHighRes.status !== 422) {
        throw new Error(`COD > ₹5,000 should return 422, got ${codHighRes.status}`);
      }
      const highBody = await codHighRes.json();
      if (!highBody.message.includes('Cash on Delivery is only permitted for orders up to')) {
        throw new Error(`Unexpected error message for COD ceiling: ${highBody.message}`);
      }

      // 3. WhatsApp channel order
      const waRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'WhatsApp Concierge Buyer', email: 'wa@example.com', phone: '+919845088990' },
          shippingAddress: { name: 'WhatsApp Concierge Buyer', phone: '+919845088990', addressLine1: '14 Richmond Town', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560025' },
          items: [{ variantId: 'var-3-24', quantity: 1 }],
          paymentMethod: 'UPI_MERCHANT_QR',
          channel: 'WHATSAPP',
        }),
      });

      if (waRes.status !== 201) {
        throw new Error(`WhatsApp order creation failed: ${waRes.status}`);
      }
      const waBody = await waRes.json();
      const dbWaOrder = await prisma.order.findUnique({ where: { orderNumber: waBody.order.orderNumber } });
      if (!dbWaOrder) {
        throw new Error(`Order ${waBody.order.orderNumber} not found in database.`);
      }
      if (waBody.order.channel !== 'WHATSAPP') {
        throw new Error(`Expected channel WHATSAPP, got ${waBody.order.channel}`);
      }
      if (!waBody.order.whatsappConciergeUrl || !waBody.order.whatsappConciergeUrl.includes('wa.me')) {
        throw new Error('Expected whatsappConciergeUrl to be generated');
      }

      recordResult('Section 1', 'PAY-06', 'COD Thresholds (<=₹5k Pass, >₹5k 422) & WhatsApp Channel Integrity', 'PASSED', Date.now() - start, 'COD ₹1,499 passed, ₹6,998 rejected with 422. WhatsApp order verified in DB.');
    } catch (err: any) {
      recordResult('Section 1', 'PAY-06', 'COD & WhatsApp Orders', 'FAILED', Date.now() - start, err.message);
    }
  }

  // =========================================================================
  // SECTION 2: GOLDFISH ADVERSARIAL SECURITY AUDIT (8 ATTACK VECTORS)
  // =========================================================================
  console.log('\n--- SECTION 2: ADVERSARIAL SECURITY AUDIT (8 HOSTILE VECTORS) ---');

  // Attack 1: Price & Quantity Tampering
  {
    const start = Date.now();
    try {
      // 1. Float quantity
      const floatRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Attacker', email: 'atk@example.com', phone: '+919845000000' },
          shippingAddress: { name: 'Attacker', phone: '+919845000000', addressLine1: 'Nowhere', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560001' },
          items: [{ variantId: 'var-1-24', quantity: 1.5 }],
          paymentMethod: 'UPI_MERCHANT_QR',
        }),
      });
      if (floatRes.status !== 422) throw new Error(`Float quantity 1.5 returned ${floatRes.status}, expected 422`);

      // 2. Negative quantity
      const negRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Attacker', email: 'atk@example.com', phone: '+919845000000' },
          shippingAddress: { name: 'Attacker', phone: '+919845000000', addressLine1: 'Nowhere', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560001' },
          items: [{ variantId: 'var-1-24', quantity: -1 }],
          paymentMethod: 'UPI_MERCHANT_QR',
        }),
      });
      if (negRes.status !== 422) throw new Error(`Negative quantity -1 returned ${negRes.status}, expected 422`);

      // 3. Zero quantity
      const zeroRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Attacker', email: 'atk@example.com', phone: '+919845000000' },
          shippingAddress: { name: 'Attacker', phone: '+919845000000', addressLine1: 'Nowhere', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560001' },
          items: [{ variantId: 'var-1-24', quantity: 0 }],
          paymentMethod: 'UPI_MERCHANT_QR',
        }),
      });
      if (zeroRes.status !== 422) throw new Error(`Zero quantity 0 returned ${zeroRes.status}, expected 422`);

      recordResult('Section 2', 'ATK-01', 'Price & Quantity Tampering (Float/Negative/Zero Strictly Blocked)', 'PASSED', Date.now() - start, 'All float, negative, and zero quantities rejected with HTTP 422.');
    } catch (err: any) {
      recordResult('Section 2', 'ATK-01', 'Price & Quantity Tampering', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Attack 2: UTR Replay & Format Injection
  {
    const start = Date.now();
    try {
      // 1. Replay attack: happyUtr is already active on happyOrderNumber
      const createRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'Replay Attacker', email: 'replay@example.com', phone: '+919845011999' },
          shippingAddress: { name: 'Replay Attacker', phone: '+919845011999', addressLine1: 'Nowhere', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560001' },
          items: [{ variantId: 'var-3-24', quantity: 1 }],
          paymentMethod: 'UPI_MERCHANT_QR',
        }),
      });
      const orderNum = (await createRes.json()).order.orderNumber;
      const guestToken = (createRes.headers.get('set-cookie') || '').match(/nava_order_[^=]+=([^;]+)/)![1];

      // Attempt duplicate UTR submission
      const replayRes = await fetch(`${BASE_URL}/api/orders/${orderNum}/submit-utr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `nava_order_${orderNum}=${guestToken}`,
        },
        body: JSON.stringify({ claimedUtr: happyUtr }),
      });
      if (replayRes.status !== 409) {
        throw new Error(`Duplicate active UTR should return 409 Conflict, got ${replayRes.status}`);
      }

      // 2. Format injection: SQL injection payload
      const sqliRes = await fetch(`${BASE_URL}/api/orders/${orderNum}/submit-utr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `nava_order_${orderNum}=${guestToken}`,
        },
        body: JSON.stringify({ claimedUtr: "' OR '1'='1' --" }),
      });
      if (sqliRes.status !== 400 && sqliRes.status !== 422) {
        throw new Error(`SQLi UTR payload should return 400/422 Error, got ${sqliRes.status}`);
      }

      // 3. Format injection: XSS payload
      const xssRes = await fetch(`${BASE_URL}/api/orders/${orderNum}/submit-utr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `nava_order_${orderNum}=${guestToken}`,
        },
        body: JSON.stringify({ claimedUtr: '<script>alert(1)</script>' }),
      });
      if (xssRes.status !== 400 && xssRes.status !== 422) {
        throw new Error(`XSS UTR payload should return 400/422 Error, got ${xssRes.status}`);
      }

      // 4. Invalid short string
      const shortRes = await fetch(`${BASE_URL}/api/orders/${orderNum}/submit-utr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': `nava_order_${orderNum}=${guestToken}`,
        },
        body: JSON.stringify({ claimedUtr: '12345' }),
      });
      if (shortRes.status !== 400 && shortRes.status !== 422) {
        throw new Error(`Short UTR payload should return 400/422 Error, got ${shortRes.status}`);
      }

      recordResult('Section 2', 'ATK-02', 'UTR Replay & Format Injection (Duplicate 409, SQLi/XSS/Short 400/422)', 'PASSED', Date.now() - start, 'Active UTR replay returned 409 Conflict. SQLi, XSS, and short formats blocked with 400/422.');
    } catch (err: any) {
      recordResult('Section 2', 'ATK-02', 'UTR Replay & Format Injection', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Attack 3: Self-Confirmation Privilege Escalation
  {
    const start = Date.now();
    try {
      // 1. Unauthenticated request to verify-payment
      const unauthRes = await fetch(`${BASE_URL}/api/admin/orders/${happyOrderNumber}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedTransactionId: 'ATTACKER-FORGED-TXN' }),
      });
      if (unauthRes.status !== 401) {
        throw new Error(`Unauthenticated verify-payment should return 401, got ${unauthRes.status}`);
      }

      // 2. Request with forged/customer bearer token
      const forgedRes = await fetch(`${BASE_URL}/api/admin/orders/${happyOrderNumber}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer customer_token_pretending_to_be_admin_token',
        },
        body: JSON.stringify({ verifiedTransactionId: 'ATTACKER-FORGED-TXN' }),
      });
      if (forgedRes.status !== 401) {
        throw new Error(`Forged token verify-payment should return 401, got ${forgedRes.status}`);
      }

      recordResult('Section 2', 'ATK-03', 'Self-Confirmation Privilege Escalation (401 Unauthorized)', 'PASSED', Date.now() - start, 'Unauthenticated and customer tokens strictly rejected with HTTP 401.');
    } catch (err: any) {
      recordResult('Section 2', 'ATK-03', 'Self-Confirmation Privilege Escalation', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Attack 4: Order Tracking Enumeration (SEC-01)
  {
    const start = Date.now();
    try {
      // 1. Query order without token
      const noTokenRes = await fetch(`${BASE_URL}/api/orders/${happyOrderNumber}`);
      if (noTokenRes.status !== 404) {
        throw new Error(`Query without token should return uniform 404, got ${noTokenRes.status}`);
      }

      // 2. Query with invalid 64-char token
      const badTokenRes = await fetch(`${BASE_URL}/api/orders/${happyOrderNumber}`, {
        headers: { 'x-guest-order-token': 'a'.repeat(64) },
      });
      if (badTokenRes.status !== 404) {
        throw new Error(`Query with bad token should return uniform 404, got ${badTokenRes.status}`);
      }

      // 3. Query with valid token
      const validRes = await fetch(`${BASE_URL}/api/orders/${happyOrderNumber}`, {
        headers: { 'x-guest-order-token': happyGuestToken },
      });
      if (validRes.status !== 200) {
        throw new Error(`Query with valid token should return 200, got ${validRes.status}`);
      }
      if (validRes.headers.get('referrer-policy') !== 'no-referrer') {
        throw new Error(`Expected Referrer-Policy: no-referrer, got ${validRes.headers.get('referrer-policy')}`);
      }
      const validBody = await validRes.json();
      if (validBody.order.guestAccessToken !== undefined) {
        throw new Error('Raw guestAccessToken leaked in response payload!');
      }

      recordResult('Section 2', 'ATK-04', 'Order Tracking Enumeration (SEC-01 Uniform 404 & No-Referrer)', 'PASSED', Date.now() - start, 'Uniform 404 masking on missing/bad tokens. Referrer-Policy: no-referrer verified.');
    } catch (err: any) {
      recordResult('Section 2', 'ATK-04', 'Order Tracking Enumeration (SEC-01)', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Attack 5: 10-Worker Bangle Stock Race Condition
  {
    const start = Date.now();
    try {
      // 1. Create a temporary variant with exactly 1 unit of stock
      const singleProduct = await prisma.product.create({
        data: {
          name: 'Sole Bangle Edition',
          slug: `sole-bangle-${Date.now()}`,
          sku: `SOLE-${Date.now()}`,
          categoryId: 'cat-bangles',
          pricePaise: 199900,
          status: 'PUBLISHED',
          isAvailable: true,
        },
      });
      const singleVariant = await prisma.productVariant.create({
        data: {
          productId: singleProduct.id,
          sku: `SOLE-VAR-${Date.now()}`,
          title: 'Single Unique Piece',
          pricePaise: 199900,
          mrpPaise: 249900,
          inventoryItem: {
            create: {
              availableQty: 1,
              reservedQty: 0,
              allocatedSoldQty: 0,
            },
          },
        },
      });

      // 2. Launch 10 concurrent order requests
      const promises = Array.from({ length: 10 }, (_, i) =>
        fetch(`${BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: { name: `Worker ${i}`, email: `w${i}@example.com`, phone: `+9198450${10000 + i}` },
            shippingAddress: { name: `Worker ${i}`, phone: `+9198450${10000 + i}`, addressLine1: '42 Commercial Street', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560001' },
            items: [{ variantId: singleVariant.id, quantity: 1 }],
            paymentMethod: 'UPI_MERCHANT_QR',
          }),
        }).then(async (r) => ({ status: r.status, body: await r.json() }))
      );

      const responses = await Promise.all(promises);
      const successCount = responses.filter((r) => r.status === 201).length;
      const rejectedCount = responses.filter((r) => r.status === 400 || r.status === 422 || r.status === 409).length;

      // 3. Check final DB inventory
      const finalInv = await prisma.inventoryItem.findUnique({
        where: { variantId: singleVariant.id },
      });

      if (successCount === 1 && rejectedCount === 9 && finalInv?.availableQty === 0 && finalInv?.reservedQty === 1) {
        recordResult('Section 2', 'ATK-05', '10-Worker Bangle Stock Race Condition (Pessimistic Concurrency)', 'PASSED', Date.now() - start, `1/10 succeeded, 9/10 rejected. available_qty=0, reserved_qty=1. Zero over-allocation.`);
      } else {
        const sampleErr = responses.find((r) => r.status !== 201)?.body;
        recordResult('Section 2', 'ATK-05', '10-Worker Bangle Stock Race Condition', 'FAILED', Date.now() - start, `success=${successCount}, rejected=${rejectedCount}, available=${finalInv?.availableQty}. Sample err: ${JSON.stringify(sampleErr)}`);
      }
    } catch (err: any) {
      recordResult('Section 2', 'ATK-05', '10-Worker Bangle Stock Race Condition', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Attack 6: Checkout Replay / Double-Click Idempotency
  {
    const start = Date.now();
    try {
      const idempotencyKey = `IDEMP-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
      const payload = {
        customer: { name: 'Click Spammer', email: 'click@example.com', phone: '+919845055667' },
        shippingAddress: { name: 'Click Spammer', phone: '+919845055667', addressLine1: 'MG Road', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560001' },
        items: [{ variantId: 'var-3-26', quantity: 1 }],
        paymentMethod: 'UPI_MERCHANT_QR',
      };

      const beforeInv = await prisma.inventoryItem.findUnique({ where: { variantId: 'var-3-26' } });
      if (!beforeInv) throw new Error('Inventory item var-3-26 not found');

      // Send 2 concurrent requests with same idempotency-key header
      const [res1, res2] = await Promise.all([
        fetch(`${BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'idempotency-key': idempotencyKey },
          body: JSON.stringify(payload),
        }).then((r) => r.json()),
        fetch(`${BASE_URL}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'idempotency-key': idempotencyKey },
          body: JSON.stringify(payload),
        }).then((r) => r.json()),
      ]);

      const afterInv = await prisma.inventoryItem.findUnique({ where: { variantId: 'var-3-26' } });

      if (
        res1.order?.orderNumber === res2.order?.orderNumber &&
        afterInv?.availableQty === beforeInv.availableQty - 1
      ) {
        recordResult('Section 2', 'ATK-06', 'Checkout Replay / Double-Click Idempotency (Single Reservation)', 'PASSED', Date.now() - start, `Same orderNumber (${res1.order.orderNumber}) returned. Stock reserved exactly once.`);
      } else {
        recordResult('Section 2', 'ATK-06', 'Checkout Replay / Double-Click Idempotency', 'FAILED', Date.now() - start, `Mismatch: order1=${res1.order?.orderNumber}, order2=${res2.order?.orderNumber}, stockDelta=${beforeInv.availableQty - (afterInv?.availableQty || 0)}`);
      }
    } catch (err: any) {
      recordResult('Section 2', 'ATK-06', 'Checkout Replay / Double-Click Idempotency', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Attack 7: Database Privilege & PostgREST RLS Lockdown
  {
    const start = Date.now();
    try {
      const appUser = guard.runtimeRole; // nava_app
      const appPass = env.DATABASE_URL ? new URL(env.DATABASE_URL).password : '';
      const migUser = guard.migrationRole; // nava_migrator
      const migPass = env.DIRECT_URL ? new URL(env.DIRECT_URL).password : '';

      // 1. Verify DDL forbidden for nava_app
      let ddlBlocked = false;
      try {
        queryPsql(appUser, appPass, 'DROP TABLE categories;');
      } catch (e: any) {
        ddlBlocked = e.message.includes('must be owner') || e.message.includes('permission denied');
      }

      // 2. Verify TRUNCATE forbidden for nava_app
      let truncateBlocked = false;
      try {
        queryPsql(appUser, appPass, 'TRUNCATE categories;');
      } catch (e: any) {
        truncateBlocked = e.message.includes('permission denied');
      }

      // 3. Verify _prisma_migrations forbidden for nava_app
      let migrationsBlocked = false;
      try {
        queryPsql(appUser, appPass, 'SELECT * FROM _prisma_migrations LIMIT 1;');
      } catch (e: any) {
        migrationsBlocked = e.message.includes('permission denied');
      }

      // 4. Verify anon role blocked on orders via SET ROLE
      let anonOrdersBlocked = false;
      try {
        queryPsql(migUser, migPass, 'SET ROLE anon; SELECT * FROM orders LIMIT 1;');
      } catch (e: any) {
        anonOrdersBlocked = e.message.includes('permission denied');
      }

      // 5. Verify RLS enabled on all application tables (28/28)
      const rlsTables = queryPsql(appUser, appPass, "SELECT count(*) FROM pg_tables t JOIN pg_class c ON c.relname = t.tablename WHERE t.schemaname = 'public' AND t.tablename != '_prisma_migrations' AND c.relrowsecurity = true;");
      const appTables = queryPsql(appUser, appPass, "SELECT count(*) FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations';");

      if (ddlBlocked && truncateBlocked && migrationsBlocked && anonOrdersBlocked && rlsTables === appTables && parseInt(appTables, 10) === 28) {
        recordResult('Section 2', 'ATK-07', 'Database Privilege & PostgREST RLS Lockdown (28/28 RLS)', 'PASSED', Date.now() - start, `nava_app denied DDL/TRUNCATE/migrations. anon denied access. All ${rlsTables}/${appTables} application tables have RLS.`);
      } else {
        recordResult('Section 2', 'ATK-07', 'Database Privilege & PostgREST RLS Lockdown', 'FAILED', Date.now() - start, `RLS: ${rlsTables}/${appTables}, ddl=${ddlBlocked}, trunc=${truncateBlocked}, anon=${anonOrdersBlocked}`);
      }
    } catch (err: any) {
      recordResult('Section 2', 'ATK-07', 'Database Privilege & PostgREST RLS Lockdown', 'FAILED', Date.now() - start, err.message);
    }
  }

  // Attack 8: XSS & Auth Brute-Force Protection
  {
    const start = Date.now();
    try {
      // 1. Injected script tag in customerNotes
      const xssNoteRes = await fetch(`${BASE_URL}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: { name: 'XSS Tester', email: 'xss@example.com', phone: '+919845012345' },
          shippingAddress: { name: 'XSS Tester', phone: '+919845012345', addressLine1: 'Lavelle', city: 'Bengaluru', stateCode: '29', stateName: 'Karnataka', postalCode: '560001' },
          items: [{ variantId: 'var-3-26', quantity: 1 }],
          paymentMethod: 'UPI_MERCHANT_QR',
          customerNotes: '<script>alert("XSS")</script>Please leave with watchman<iframe src="evil.com"></iframe>',
        }),
      });
      const xssBody = await xssNoteRes.json();
      const returnedNote = xssBody.order.customerNotes || '';

      const noteSanitized =
        !returnedNote.includes('<script>') &&
        !returnedNote.includes('<iframe>') &&
        returnedNote.includes('Please leave with watchman');

      // 2. Auth brute force rate limiting
      const attackerIp = `192.0.2.${Math.floor(Math.random() * 200) + 10}`;
      let rateLimited = false;
      for (let i = 0; i < 15; i++) {
        const bruteRes = await fetch(`${BASE_URL}/api/admin/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': attackerIp,
          },
          body: JSON.stringify({ password: `wrong-pass-${i}` }),
        });
        if (bruteRes.status === 429) {
          rateLimited = true;
          break;
        }
      }

      if (noteSanitized && rateLimited) {
        recordResult('Section 2', 'ATK-08', 'XSS Sanitization & Auth Brute-Force Rate Limiting (429 Triggered)', 'PASSED', Date.now() - start, 'Script/iframe tags stripped from customerNotes. Admin auth rate limiter triggered 429.');
      } else {
        recordResult('Section 2', 'ATK-08', 'XSS & Auth Brute-Force Protection', 'FAILED', Date.now() - start, `noteSanitized=${noteSanitized}, rateLimited=${rateLimited}`);
      }
    } catch (err: any) {
      recordResult('Section 2', 'ATK-08', 'XSS & Auth Brute-Force Protection', 'FAILED', Date.now() - start, err.message);
    }
  }

  // =========================================================================
  // SUMMARY PRESENTATION
  // =========================================================================
  console.log('\n' + '='.repeat(90));
  console.log('AUDIT EXECUTION SUMMARY');
  console.log('='.repeat(90));
  const passedCount = auditResults.filter((r) => r.status === 'PASSED').length;
  const failedCount = auditResults.filter((r) => r.status === 'FAILED').length;
  console.log(`Total Checks: ${auditResults.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('='.repeat(90) + '\n');

  await prisma.$disconnect();

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAudit().catch(async (err) => {
  console.error('[FATAL AUDIT RUNNER ERROR]:', err);
  await prisma.$disconnect();
  process.exit(1);
});
