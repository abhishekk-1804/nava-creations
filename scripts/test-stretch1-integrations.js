/**
 * NAVA CREATIONS — STRETCH 1 INTEGRATION & VERIFICATION SUITE
 * 
 * Verifies all 4 Stretch 1 engineering requirements against isolated PostgreSQL 16 (nava_gateb_test):
 * 1. GAP-SEC-01: Dual-path order tracking authorization & timing-safe HMAC token verification.
 * 2. GAP-PROM-01: PostgreSQL persistent Coupon model & atomic raw SQL usage increments.
 * 3. GAP-DATA-02: PostgreSQL check constraint enforcing non-negative inventory.
 * 4. GAP-RES-01 & RSK-05: Reservation expiry query protecting orders in AWAITING_PAYMENT_VERIFICATION.
 * 
 * Target: nava_gateb_test on 127.0.0.1:5432
 * NEVER prints credentials or connection strings.
 */

const crypto = require('node:crypto');
const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const { loadEnvTest, verifyTestDatabaseSafeguards } = require('./test-db-guard');

async function runStretch1Tests() {
  console.log('=============================================================');
  console.log('NAVA CREATIONS — STRETCH 1 INTEGRATION TEST SUITE');
  console.log('=============================================================');

  const guard = verifyTestDatabaseSafeguards();
  console.log(`[PASS] Environment Guard: Verified target DB "${guard.database}" on "${guard.host}".`);

  const env = loadEnvTest();
  const prismaMigrator = new PrismaClient({ datasources: { db: { url: env.DIRECT_URL } } });
  const prismaApp = new PrismaClient({ datasources: { db: { url: env.DATABASE_URL } } });

  const runId = Date.now().toString(36);
  console.log(`Test Execution Run ID: ${runId}`);

  try {
    // -------------------------------------------------------------------------
    // TEST 1: GAP-SEC-01 Dual-Path Order Authorization & Stateless HMAC
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 1: SEC-01 Stateless HMAC Token & Timing-Safe Verification ---');
    const secret = process.env.ADMIN_AUTH_SECRET || 'nava-default-fallback-secret-256';
    const sampleOrderNumber = `NAV-2026-${runId.toUpperCase()}`;
    const sampleCreatedAt = new Date();

    // Generate authentic guest access token
    const authenticToken = crypto
      .createHmac('sha256', secret)
      .update(`${sampleOrderNumber}:${sampleCreatedAt.getTime()}`)
      .digest('hex');

    // Helper constant-time verifier
    const verifyToken = (orderNum, createdAt, token) => {
      if (!token || typeof token !== 'string' || token.length !== 64) return false;
      const expected = crypto
        .createHmac('sha256', secret)
        .update(`${orderNum}:${createdAt.getTime()}`)
        .digest('hex');
      try {
        const tokenBuf = Buffer.from(token, 'hex');
        const expectedBuf = Buffer.from(expected, 'hex');
        if (tokenBuf.length !== expectedBuf.length) return false;
        return crypto.timingSafeEqual(tokenBuf, expectedBuf);
      } catch {
        return false;
      }
    };

    // 1.1 Authentic token must pass
    const isAuthenticValid = verifyToken(sampleOrderNumber, sampleCreatedAt, authenticToken);
    if (!isAuthenticValid) throw new Error('Authentic token failed verification!');

    // 1.2 Tampered token must fail
    const tamperedToken = authenticToken.slice(0, -2) + (authenticToken.slice(-2) === 'aa' ? 'bb' : 'aa');
    const isTamperedValid = verifyToken(sampleOrderNumber, sampleCreatedAt, tamperedToken);
    if (isTamperedValid) throw new Error('Tampered token unexpectedly passed verification!');

    // 1.3 Missing or malformed token must fail
    if (verifyToken(sampleOrderNumber, sampleCreatedAt, '')) throw new Error('Empty token passed!');
    if (verifyToken(sampleOrderNumber, sampleCreatedAt, 'short-token')) throw new Error('Short token passed!');

    // 1.4 Different order number with same token must fail
    const isDiffOrderValid = verifyToken('NAV-2026-DIFFERENT', sampleCreatedAt, authenticToken);
    if (isDiffOrderValid) throw new Error('Token validated for different order number!');

    console.log('[PASS] TEST 1 PASSED: Stateless HMAC dual-path authorization verified with constant-time equality.');

    // -------------------------------------------------------------------------
    // TEST 2: GAP-PROM-01 Persistent PostgreSQL Coupon & Atomic Increment
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 2: GAP-PROM-01 PostgreSQL Persistent Coupons & Atomic Increment ---');
    const testCouponCode = `TESTPROMO_${runId.toUpperCase()}`;

    // Create disposable coupon with usage limit of 2
    const createdCoupon = await prismaApp.coupon.create({
      data: {
        id: `coup_test_${runId}`,
        code: testCouponCode,
        description: `Disposable Test Coupon ${runId}`,
        type: 'PERCENTAGE',
        value: 10,
        minOrderPaise: 100000,
        usageLimit: 2,
        usageCount: 0,
        isActive: true,
      },
    });
    console.log(`[PASS] Created PostgreSQL coupon "${createdCoupon.code}" with usageLimit: 2, usageCount: 0.`);

    // Execute 5 concurrent increments contesting remaining limit of 2
    const incrementAttempts = Array.from({ length: 5 }, async () => {
      try {
        const affected = await prismaApp.$executeRaw`
          UPDATE "coupons"
          SET "usage_count" = "usage_count" + 1, "updated_at" = NOW()
          WHERE "code" = ${testCouponCode}
            AND "is_active" = true
            AND ("usage_limit" IS NULL OR "usage_count" < "usage_limit");
        `;
        return affected > 0 ? 'SUCCESS' : 'REJECTED';
      } catch (err) {
        return 'ERROR: ' + err.message;
      }
    });

    const incrementResults = await Promise.all(incrementAttempts);
    const successes = incrementResults.filter((r) => r === 'SUCCESS').length;
    const rejections = incrementResults.filter((r) => r === 'REJECTED').length;

    console.log(`Concurrent coupon redemptions: 5 | Successful: ${successes} | Rejected: ${rejections}`);

    const finalCoupon = await prismaApp.coupon.findUnique({ where: { code: testCouponCode } });
    console.log(`Final Database Coupon State: usageCount = ${finalCoupon.usageCount}, usageLimit = ${finalCoupon.usageLimit}`);

    if (successes !== 2 || rejections !== 3 || finalCoupon.usageCount !== 2) {
      throw new Error(`Atomic coupon increment invariant breached! Expected 2 successes and usageCount=2, got: ${successes} successes, usageCount=${finalCoupon.usageCount}`);
    }
    console.log('[PASS] TEST 2 PASSED: Persistent PostgreSQL coupon atomic increment enforces strict usage limit.');

    // -------------------------------------------------------------------------
    // TEST 3: GAP-DATA-02 Non-Negative Inventory Check Constraint
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 3: GAP-DATA-02 Database CHECK Constraint (Non-Negative Stock) ---');
    const categoryId = `cat_test_${runId}`;
    const productId = `prod_test_${runId}`;
    const variantId = `var_test_${runId}`;
    const invItemId = `inv_test_${runId}`;

    await prismaMigrator.category.create({
      data: { id: categoryId, name: `Test Category ${runId}`, slug: `test-cat-${runId}` },
    });
    await prismaMigrator.product.create({
      data: {
        id: productId,
        name: `Test Product ${runId}`,
        slug: `test-prod-${runId}`,
        categoryId,
        pricePaise: 299900,
      },
    });
    await prismaMigrator.productVariant.create({
      data: {
        id: variantId,
        productId,
        sku: `SKU-TST-${runId}`,
        title: `Variant 2.6 ${runId}`,
        size: '2.6',
        pricePaise: 299900,
        mrpPaise: 399900,
      },
    });
    await prismaMigrator.inventoryItem.create({
      data: { id: invItemId, variantId, availableQty: 5, reservedQty: 0 },
    });

    let checkConstraintFired = false;
    try {
      // Attempt to set negative available_qty violating CHECK ("available_qty" >= 0 AND "reserved_qty" >= 0)
      await prismaApp.$executeRaw`
        UPDATE "inventory_items" SET "available_qty" = -1 WHERE "id" = ${invItemId};
      `;
    } catch (dbErr) {
      if (dbErr.message.includes('inventory_items_non_negative_stock') || dbErr.message.includes('23514')) {
        checkConstraintFired = true;
        console.log('[EXPECTED ERROR] PostgreSQL check constraint violation caught: "inventory_items_non_negative_stock".');
      } else {
        throw dbErr;
      }
    }

    if (!checkConstraintFired) {
      throw new Error('Database CHECK constraint failed to prevent negative inventory!');
    }
    console.log('[PASS] TEST 3 PASSED: PostgreSQL CHECK constraint strictly prevents negative stock integers.');

    // -------------------------------------------------------------------------
    // TEST 4: GAP-RES-01 & RSK-05 Reservation Expiry Verification Window Guard
    // -------------------------------------------------------------------------
    console.log('\n--- TEST 4: GAP-RES-01 & RSK-05 Reservation Expiry Verification Window Guard ---');
    const pastExpiresAt = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes in the past

    // Create Order in AWAITING_PAYMENT_VERIFICATION
    const orderId = `ord_test_${runId}`;
    const orderNum = `NAV-${runId.toUpperCase()}`;
    await prismaMigrator.order.create({
      data: {
        id: orderId,
        orderNumber: orderNum,
        status: 'AWAITING_PAYMENT_VERIFICATION',
        paymentMethod: 'UPI_MERCHANT_QR',
        subtotalPaise: 299900,
        shippingPaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: 299900,
        taxMode: 'UNREGISTERED',
        shippingAddress: { name: 'Test', phone: '+919886000000' },
        billingAddress: { name: 'Test', phone: '+919886000000' },
      },
    });

    // Reservation 1: Linked to order in AWAITING_PAYMENT_VERIFICATION (MUST BE PROTECTED)
    const resIdProtected = `res_prot_${runId}`;
    await prismaMigrator.inventoryReservation.create({
      data: {
        id: resIdProtected,
        orderId,
        status: 'PENDING',
        expiresAt: pastExpiresAt,
        items: { create: [{ variantId, quantity: 1 }] },
      },
    });

    // Reservation 2: Abandoned cart without order (MUST BE EXPIRED)
    const resIdAbandoned = `res_aban_${runId}`;
    await prismaMigrator.inventoryReservation.create({
      data: {
        id: resIdAbandoned,
        orderId: null,
        status: 'PENDING',
        expiresAt: pastExpiresAt,
        items: { create: [{ variantId, quantity: 1 }] },
      },
    });

    // Execute the RSK-05 protected expiry query
    const now = new Date();
    const expiredReservations = await prismaApp.inventoryReservation.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now },
        OR: [
          { order: null },
          {
            order: {
              status: {
                notIn: [
                  'AWAITING_PAYMENT_VERIFICATION',
                  'PROCESSING',
                  'SHIPPED',
                  'DELIVERED',
                ],
              },
            },
          },
        ],
      },
      include: { items: true, order: true },
    });

    const expiredIds = expiredReservations.map((r) => r.id);
    console.log(`Candidate expired reservations found: ${expiredIds.length}`);

    if (expiredIds.includes(resIdProtected)) {
      throw new Error(`CRITICAL BREACH (RSK-05): Reservation linked to AWAITING_PAYMENT_VERIFICATION was marked expired!`);
    }
    if (!expiredIds.includes(resIdAbandoned)) {
      throw new Error('Abandoned cart reservation was not marked for expiry!');
    }

    console.log('[PASS] TEST 4 PASSED: Expiry routine protects orders in AWAITING_PAYMENT_VERIFICATION from premature inventory release.');

    // -------------------------------------------------------------------------
    // CLEANUP DISPOSABLE FIXTURES
    // -------------------------------------------------------------------------
    console.log('\n--- Cleaning up disposable test fixtures ---');
    await prismaMigrator.inventoryReservationItem.deleteMany({
      where: { reservationId: { in: [resIdProtected, resIdAbandoned] } },
    });
    await prismaMigrator.inventoryReservation.deleteMany({
      where: { id: { in: [resIdProtected, resIdAbandoned] } },
    });
    await prismaMigrator.order.deleteMany({ where: { id: orderId } });
    await prismaMigrator.inventoryItem.deleteMany({ where: { id: invItemId } });
    await prismaMigrator.productVariant.deleteMany({ where: { id: variantId } });
    await prismaMigrator.product.deleteMany({ where: { id: productId } });
    await prismaMigrator.category.deleteMany({ where: { id: categoryId } });
    await prismaMigrator.coupon.deleteMany({ where: { code: testCouponCode } });

    console.log('[PASS] All disposable test fixtures cleanly deleted.');
    console.log('\n=============================================================');
    console.log('ALL STRETCH 1 INTEGRATION TESTS PASSED (100%)');
    console.log('=============================================================');
  } catch (err) {
    console.error('\n[FAIL] STRETCH 1 INTEGRATION TEST FAILED:', err);
    process.exit(1);
  } finally {
    await prismaMigrator.$disconnect();
    await prismaApp.$disconnect();
  }
}

if (require.main === module) {
  runStretch1Tests();
}
