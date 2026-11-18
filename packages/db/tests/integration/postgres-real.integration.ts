/**
 * Real PostgreSQL 16 Integration Test Suite
 * 
 * Strict E-Commerce & Database Verification Standard (Sprint 2N):
 * - Zero mocks: Uses real PrismaClient queries against a live PostgreSQL 16 database.
 * - Tests ACID transactions, relational integrity, unique constraints, and concurrency.
 * - If no live PostgreSQL instance is reachable, reports each test as BLOCKED.
 */

import { PrismaClient } from '@prisma/client';

export interface TestResult {
  name: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED' | 'SKIPPED';
  durationMs: number;
  error?: string;
  details?: string;
}

export async function runPostgresIntegrationSuite(): Promise<{
  connected: boolean;
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  results: TestResult[];
}> {
  console.log('='.repeat(75));
  console.log('NAVA CREATIONS — PostgreSQL 16 Real-Engine Integration Test Suite');
  console.log('='.repeat(75));

  const dbUrl = process.env.DATABASE_URL;
  const isPlaceholder =
    !dbUrl ||
    dbUrl.trim() === '' ||
    dbUrl.includes('placeholder') ||
    dbUrl.includes('user:password') ||
    dbUrl.includes('USER:PASSWORD');

  const results: TestResult[] = [];

  // Helper to record blocked test
  const recordBlocked = (name: string, reason: string) => {
    results.push({
      name,
      status: 'BLOCKED',
      durationMs: 0,
      details: reason,
    });
    console.log(`[-] ${name.padEnd(50)} [BLOCKED] — ${reason}`);
  };

  if (isPlaceholder) {
    console.log('\n[PRE-CHECK] Database connection string is unconfigured / placeholder.');
    console.log('No live PostgreSQL 16 engine is currently provisioned.');
    console.log('Per Sprint 2N rules: Zero mocks substituted. Marking tests as BLOCKED.\n');

    const testNames = [
      '1. Product creation and retrieval',
      '2. Product variant management',
      '3. Inventory updates and safety stock',
      '4. Concurrent reservation of the final stock item',
      '5. Duplicate transaction reference rejection (Unique Constraint)',
      '6. Enquiry persistence and status filtering',
      '7. Order creation and cancellation lifecycle',
      '8. Payment verification and ledger audit tracking',
      '9. Partial and full refund consistency',
      '10. Transaction rollback on unhandled error',
    ];

    for (const name of testNames) {
      recordBlocked(name, 'Requires live PostgreSQL 16 instance (DATABASE_URL)');
    }

    console.log('='.repeat(75));
    return {
      connected: false,
      total: testNames.length,
      passed: 0,
      failed: 0,
      blocked: testNames.length,
      results,
    };
  }

  // Live database connection branch
  const prisma = new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });

  try {
    const probeStart = Date.now();
    await Promise.race([
      prisma.$queryRaw`SELECT 1 as connected`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out after 3000ms')), 3000)),
    ]);
    console.log(`\n[PRE-CHECK] Connected to PostgreSQL 16 in ${Date.now() - probeStart}ms. Executing tests...\n`);

    // Helper test runner
    const runTest = async (name: string, fn: () => Promise<void>) => {
      const start = Date.now();
      try {
        await fn();
        const duration = Date.now() - start;
        results.push({ name, status: 'PASSED', durationMs: duration });
        console.log(`[✓] ${name.padEnd(50)} [PASSED] (${duration}ms)`);
      } catch (err) {
        const duration = Date.now() - start;
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push({ name, status: 'FAILED', durationMs: duration, error: errMsg });
        console.error(`[✗] ${name.padEnd(50)} [FAILED] (${duration}ms): ${errMsg}`);
      }
    };

    // Test 1: Product creation and retrieval
    await runTest('1. Product creation and retrieval', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Integration Test Bangles ' + Date.now(),
          slug: 'test-bangles-' + Date.now(),
        },
      });
      const product = await prisma.product.create({
        data: {
          name: 'Royal Heritage Kada ' + Date.now(),
          slug: 'royal-heritage-kada-' + Date.now(),
          pricePaise: 12500000, // ₹1,25,000.00
          categoryId: category.id,
        },
      });
      const retrieved = await prisma.product.findUnique({
        where: { id: product.id },
        include: { category: true },
      });
      if (!retrieved || retrieved.pricePaise !== 12500000) {
        throw new Error('Retrieved product did not match persisted values');
      }
    });

    // Test 2: Product variant management
    await runTest('2. Product variant management', async () => {
      const category = await prisma.category.create({
        data: { name: 'Variants Cat ' + Date.now(), slug: 'variants-cat-' + Date.now() },
      });
      const product = await prisma.product.create({
        data: { name: 'Variant Choker ' + Date.now(), slug: 'variant-choker-' + Date.now(), categoryId: category.id },
      });
      const variant = await prisma.productVariant.create({
        data: {
          productId: product.id,
          sku: 'SKU-TEST-' + Date.now(),
          title: 'Size 2.4 - 22K Yellow Gold',
          pricePaise: 4500000,
          mrpPaise: 5000000,
          size: '2.4',
        },
      });
      const variants = await prisma.productVariant.findMany({ where: { productId: product.id } });
      if (variants.length !== 1 || variants[0].sku !== variant.sku) {
        throw new Error('Variant relation lookup failed');
      }
    });

    // Test 3: Inventory updates and safety stock
    await runTest('3. Inventory updates and safety stock', async () => {
      const category = await prisma.category.create({
        data: { name: 'Inv Cat ' + Date.now(), slug: 'inv-cat-' + Date.now() },
      });
      const product = await prisma.product.create({
        data: { name: 'Inv Product ' + Date.now(), slug: 'inv-product-' + Date.now(), categoryId: category.id },
      });
      const variant = await prisma.productVariant.create({
        data: { productId: product.id, sku: 'SKU-INV-' + Date.now(), title: 'Single Piece', pricePaise: 100000, mrpPaise: 100000 },
      });
      const inv = await prisma.inventoryItem.create({
        data: { variantId: variant.id, availableQty: 5, reservedQty: 0, safetyStock: 1 },
      });
      const updated = await prisma.inventoryItem.update({
        where: { id: inv.id },
        data: { availableQty: 4, reservedQty: 1 },
      });
      if (updated.availableQty !== 4 || updated.reservedQty !== 1) {
        throw new Error('Inventory update failed');
      }
    });

    // Test 4: 10-Worker Variant Stock Concurrency & Idempotent Single-Release
    await runTest('4. 10-Worker Variant Stock Concurrency & Idempotent Single-Release', async () => {
      const runId = Date.now().toString(36);
      const category = await prisma.category.create({
        data: { name: 'Conc Cat ' + runId, slug: 'conc-cat-' + runId },
      });
      const product = await prisma.product.create({
        data: { name: 'Royal Antique Bangle ' + runId, slug: 'royal-bangle-' + runId, categoryId: category.id },
      });
      const variant = await prisma.productVariant.create({
        data: { productId: product.id, sku: 'SKU-CONC-' + runId, title: 'Size 2.6 Handcrafted Bangle', pricePaise: 149900, mrpPaise: 199900, size: '2.6' },
      });
      const inv = await prisma.inventoryItem.create({
        data: { variantId: variant.id, availableQty: 1, reservedQty: 0, safetyStock: 0, allocatedSoldQty: 0 },
      });

      // 10 concurrent reservation workers competing for available_qty = 1
      const workers = Array.from({ length: 10 }, (_, i) => async () => {
        return prisma.$transaction(async (tx) => {
          // Serialized row-level lock on inventory_items
          const [lockedItem] = await tx.$queryRaw<Array<{ id: string; available_qty: number; reserved_qty: number }>>`
            SELECT id, available_qty, reserved_qty
            FROM inventory_items
            WHERE variant_id = ${variant.id}
            FOR UPDATE;
          `;
          if (!lockedItem || lockedItem.available_qty < 1) {
            throw new Error('HELD_STOCK_UNAVAILABLE');
          }

          await tx.$executeRaw`
            UPDATE inventory_items
            SET available_qty = available_qty - 1, reserved_qty = reserved_qty + 1
            WHERE variant_id = ${variant.id};
          `;

          const res = await tx.inventoryReservation.create({
            data: {
              status: 'PENDING',
              expiresAt: new Date(Date.now() + 15 * 60 * 1000),
            },
          });
          return { workerId: i, reservationId: res.id };
        });
      });

      const settlements = await Promise.allSettled(workers.map((w) => w()));
      const fulfilled = settlements.filter((s): s is PromiseFulfilledResult<{ workerId: number; reservationId: string }> => s.status === 'fulfilled');
      const rejected = settlements.filter((s): s is PromiseRejectedResult => s.status === 'rejected');

      if (fulfilled.length !== 1 || rejected.length !== 9) {
        throw new Error(`Concurrency violation: Expected exactly 1 fulfilled and 9 rejected, got ${fulfilled.length} fulfilled and ${rejected.length} rejected`);
      }

      for (const rej of rejected) {
        const msg = rej.reason instanceof Error ? rej.reason.message : String(rej.reason);
        if (!msg.includes('HELD_STOCK_UNAVAILABLE')) {
          throw new Error(`Expected rejection reason HELD_STOCK_UNAVAILABLE, got: ${msg}`);
        }
      }

      // Assert post-concurrency database state: available_qty = 0, reserved_qty = 1
      const postInv = await prisma.inventoryItem.findUnique({ where: { id: inv.id } });
      if (!postInv || postInv.availableQty !== 0 || postInv.reservedQty !== 1) {
        throw new Error(`Post-concurrency stock mismatch: expected available=0, reserved=1, got available=${postInv?.availableQty}, reserved=${postInv?.reservedQty}`);
      }

      // Test Expiry & Single-Release
      const winningReservationId = fulfilled[0].value.reservationId;
      // Single release transaction
      await prisma.$transaction(async (tx) => {
        const rowsUpdated = await tx.$executeRaw`
          UPDATE inventory_reservations
          SET status = 'EXPIRED'::"ReservationStatus"
          WHERE id = ${winningReservationId} AND status = 'PENDING'::"ReservationStatus";
        `;
        if (rowsUpdated === 1) {
          await tx.$executeRaw`
            UPDATE inventory_items
            SET available_qty = available_qty + 1, reserved_qty = reserved_qty - 1
            WHERE variant_id = ${variant.id};
          `;
        }
      });

      const releasedInv = await prisma.inventoryItem.findUnique({ where: { id: inv.id } });
      if (!releasedInv || releasedInv.availableQty !== 1 || releasedInv.reservedQty !== 0) {
        throw new Error(`Release stock mismatch: expected available=1, reserved=0, got available=${releasedInv?.availableQty}, reserved=${releasedInv?.reservedQty}`);
      }

      // Idempotent duplicate release attempt (must not double-increment available_qty)
      await prisma.$transaction(async (tx) => {
        const rowsUpdated2 = await tx.$executeRaw`
          UPDATE inventory_reservations
          SET status = 'EXPIRED'::"ReservationStatus"
          WHERE id = ${winningReservationId} AND status = 'PENDING'::"ReservationStatus";
        `;
        if (rowsUpdated2 === 1) {
          await tx.$executeRaw`
            UPDATE inventory_items
            SET available_qty = available_qty + 1, reserved_qty = reserved_qty - 1
            WHERE variant_id = ${variant.id};
          `;
        }
      });

      const idempotentInv = await prisma.inventoryItem.findUnique({ where: { id: inv.id } });
      if (!idempotentInv || idempotentInv.availableQty !== 1 || idempotentInv.reservedQty !== 0) {
        throw new Error(`Idempotent release violation: available_qty was double-incremented to ${idempotentInv?.availableQty}!`);
      }
    });

    // Test 5: UTR Canonical Format & Partial Unique Index (payments_claimed_utr_active_unique)
    await runTest('5. UTR Canonical Format & Partial Unique Index (payments_claimed_utr_active_unique)', async () => {
      const runId = Date.now().toString(36);
      const order1 = await prisma.order.create({
        data: {
          orderNumber: 'ORD-UTR1-' + runId,
          totalPaise: 500000,
          subtotalPaise: 500000,
          shippingAddress: {},
          billingAddress: {},
        },
      });
      const order2 = await prisma.order.create({
        data: {
          orderNumber: 'ORD-UTR2-' + runId,
          totalPaise: 500000,
          subtotalPaise: 500000,
          shippingAddress: {},
          billingAddress: {},
        },
      });

      // 1. Rejects invalid formats via CHECK constraint (error 23514)
      let formatRejected = false;
      try {
        await prisma.$executeRaw`
          INSERT INTO payments (id, order_id, amount_paise, payment_reference, status, claimed_utr, updated_at)
          VALUES (gen_random_uuid()::text, ${order1.id}, 500000, ${'PAY-INV-' + runId}, 'AWAITING_VERIFICATION'::"PaymentStatus", 'invalid@utr', NOW());
        `;
      } catch (err: unknown) {
        const msg = String(err);
        if (msg.includes('23514') || msg.includes('payments_claimed_utr_format_check')) {
          formatRejected = true;
        }
      }
      if (!formatRejected) {
        throw new Error('Database permitted invalid UTR format ("invalid@utr") bypassing CHECK constraint!');
      }

      // 2. Blocks concurrent duplicate active claims (error 23505)
      const validUtr = 'U' + Date.now().toString().slice(-9) + Math.floor(10 + Math.random() * 90);
      const pay1 = await prisma.payment.create({
        data: {
          orderId: order1.id,
          paymentReference: 'PAY-ACT1-' + runId,
          amountPaise: 500000,
          status: 'AWAITING_VERIFICATION',
          claimedUtr: validUtr,
        },
      });

      let duplicateActiveBlocked = false;
      try {
        await prisma.payment.create({
          data: {
            orderId: order2.id,
            paymentReference: 'PAY-ACT2-' + runId,
            amountPaise: 500000,
            status: 'AWAITING_VERIFICATION',
            claimedUtr: validUtr, // Duplicate active claim
          },
        });
      } catch (err: unknown) {
        const msg = String(err);
        if (msg.includes('23505') || msg.includes('payments_claimed_utr_active_unique') || (err && typeof err === 'object' && 'code' in err && err.code === 'P2002')) {
          duplicateActiveBlocked = true;
        }
      }
      if (!duplicateActiveBlocked) {
        throw new Error('Database permitted duplicate active claimed_utr on partial unique index!');
      }

      // 3. Permits re-submission after an admin marks a claim REJECTED
      await prisma.payment.update({
        where: { id: pay1.id },
        data: { status: 'REJECTED', verificationNotes: 'Admin verified invalid UTR with bank' },
      });

      // Now order2 can claim the same UTR because pay1 is REJECTED
      const pay2 = await prisma.payment.create({
        data: {
          orderId: order2.id,
          paymentReference: 'PAY-ACT2-RESUBMIT-' + runId,
          amountPaise: 500000,
          status: 'AWAITING_VERIFICATION',
          claimedUtr: validUtr, // Re-submitted successfully!
        },
      });

      if (!pay2 || pay2.claimedUtr !== validUtr || pay2.status !== 'AWAITING_VERIFICATION') {
        throw new Error('Re-submission of UTR after rejection failed!');
      }
    });

    // Test 6: Enquiry persistence and status filtering
    await runTest('6. Enquiry persistence and status filtering', async () => {
      const enquiryNum = 'ENQ-' + Date.now();
      const enquiry = await prisma.enquiry.create({
        data: {
          enquiryNumber: enquiryNum,
          name: 'Shruti Rao',
          phone: '+91 98450 12345',
          email: 'shruti@example.com',
          eventType: 'Bridal Muhurtham',
          notes: 'Looking for 22K Lakshmi Temple Choker set in antique finish.',
          status: 'NEW',
        },
      });
      const fetched = await prisma.enquiry.findUnique({ where: { id: enquiry.id } });
      if (!fetched || fetched.status !== 'NEW' || fetched.enquiryNumber !== enquiryNum) {
        throw new Error('Enquiry persistence or field retrieval mismatch');
      }
    });

    // Test 7: Order creation and cancellation lifecycle
    await runTest('7. Order creation and cancellation lifecycle', async () => {
      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-LIFE-' + Date.now(),
          status: 'PENDING_PAYMENT',
          paymentMethod: 'UPI_MERCHANT_QR',
          totalPaise: 18000000,
          subtotalPaise: 18000000,
          shippingAddress: { city: 'Bengaluru', pincode: '560001' },
          billingAddress: { city: 'Bengaluru', pincode: '560001' },
        },
      });
      const cancelled = await prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });
      if (cancelled.status !== 'CANCELLED') {
        throw new Error('Order cancellation transition failed');
      }
    });

    // Test 8: Payment verification and ledger audit tracking
    await runTest('8. Payment verification and ledger audit tracking', async () => {
      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-VERIFY-' + Date.now(),
          status: 'AWAITING_PAYMENT_VERIFICATION',
          totalPaise: 8500000,
          subtotalPaise: 8500000,
          shippingAddress: {},
          billingAddress: {},
        },
      });
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          paymentReference: 'PAY-VERIFY-' + Date.now(),
          amountPaise: 8500000,
          status: 'AWAITING_VERIFICATION',
          claimedUtr: '8888' + Date.now().toString().slice(-8),
        },
      });
      const verifiedAt = new Date();
      const verified = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'VERIFIED',
          verifiedTransactionId: 'UTR-' + Date.now(),
          verifiedByUserId: 'usr_admin_blr',
          verifiedAt,
          verificationNotes: 'Matched against ICICI Bank Current Account statement',
        },
      });
      if (verified.status !== 'VERIFIED' || !verified.verifiedAt || !verified.verifiedTransactionId) {
        throw new Error('Payment verification audit fields were not recorded');
      }
    });

    // Test 9: Partial and full refund consistency
    await runTest('9. Partial and full refund consistency', async () => {
      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-RFND-' + Date.now(),
          totalPaise: 1000000,
          subtotalPaise: 1000000,
          shippingAddress: {},
          billingAddress: {},
        },
      });
      const payment = await prisma.payment.create({
        data: {
          orderId: order.id,
          paymentReference: 'PAY-RFND-' + Date.now(),
          amountPaise: 1000000,
          status: 'VERIFIED',
        },
      });
      // Partial refund 1: ₹3,000 (300000 paise)
      const r1 = await prisma.refund.create({
        data: {
          paymentId: payment.id,
          orderId: order.id,
          amountPaise: 300000,
          status: 'PROCESSED',
          idempotencyKey: 'rfnd_key_1_' + Date.now(),
        },
      });
      // Partial refund 2: ₹7,000 (700000 paise) -> completes full refund
      const r2 = await prisma.refund.create({
        data: {
          paymentId: payment.id,
          orderId: order.id,
          amountPaise: 700000,
          status: 'PROCESSED',
          idempotencyKey: 'rfnd_key_2_' + Date.now(),
        },
      });
      const allRefunds = await prisma.refund.findMany({ where: { paymentId: payment.id } });
      const totalRefunded = allRefunds.reduce((acc, r) => acc + r.amountPaise, 0);
      if (totalRefunded !== payment.amountPaise) {
        throw new Error(`Refund total mismatch: expected ${payment.amountPaise}, got ${totalRefunded}`);
      }
    });

    // Test 10: Transaction rollback on unhandled error
    await runTest('10. Transaction rollback on unhandled error', async () => {
      const orderNum = 'ORD-ROLLBACK-' + Date.now();
      try {
        await prisma.$transaction(async (tx) => {
          await tx.order.create({
            data: {
              orderNumber: orderNum,
              totalPaise: 200000,
              subtotalPaise: 200000,
              shippingAddress: {},
              billingAddress: {},
            },
          });
          throw new Error('Simulated failure triggering rollback');
        });
      } catch (_expectedError) {
        // Expected rollback
      }

      const orderCheck = await prisma.order.findUnique({ where: { orderNumber: orderNum } });
      if (orderCheck !== null) {
        throw new Error('Transaction rollback failed: uncommitted order persisted in database!');
      }
    });

    // Test 11: Atomic Promotion Rollback CTE & Parity Rollback
    await runTest('11. Atomic Promotion Rollback CTE & Parity Rollback', async () => {
      const runId = Date.now().toString(36);
      const couponCode = 'PROMO-' + runId.toUpperCase();
      const coupon = await prisma.coupon.create({
        data: {
          code: couponCode,
          description: 'Flash sale coupon for CTE test',
          type: 'FLAT_AMOUNT',
          value: 20000,
          usageLimit: 5,
          usageCount: 2,
        },
      });

      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-PROMO-' + runId,
          totalPaise: 800000,
          subtotalPaise: 1000000,
          discountPaise: 200000,
          status: 'PENDING_PAYMENT',
          couponId: coupon.id,
          shippingAddress: {},
          billingAddress: {},
        },
      });

      // Valid data-modifying CTE (No CREATE TEMP TABLE ... AS UPDATE)
      const cteQuery = async (orderId: string) => {
        return prisma.$queryRaw<Array<{ id: string; usage_count: number; delta: number }>>`
          WITH transitioned AS (
            UPDATE orders
            SET status = 'CANCELLED'::"OrderStatus", updated_at = NOW()
            WHERE id = ${orderId} AND status != 'CANCELLED'::"OrderStatus"
            RETURNING coupon_id
          ),
          aggregated AS (
            SELECT coupon_id AS promotion_id, COUNT(*)::int AS delta
            FROM transitioned
            WHERE coupon_id IS NOT NULL
            GROUP BY coupon_id
          )
          UPDATE coupons c
          SET usage_count = c.usage_count - a.delta,
              updated_at = NOW()
          FROM aggregated a
          WHERE c.id = a.promotion_id
            AND c.usage_count >= a.delta
          RETURNING c.id, c.usage_count, a.delta;
        `;
      };

      // Execution 1: First cancellation decrements coupon usage count exactly once
      const res1 = await cteQuery(order.id);
      if (res1.length !== 1 || res1[0].usage_count !== 1 || res1[0].delta !== 1) {
        throw new Error(`CTE execution 1 failed: expected delta=1, usage_count=1, got: ${JSON.stringify(res1)}`);
      }

      const c1 = await prisma.coupon.findUnique({ where: { id: coupon.id } });
      if (c1?.usageCount !== 1) {
        throw new Error(`Coupon usage count was not decremented to 1 (got: ${c1?.usageCount})`);
      }

      // Execution 2: Retrying cancellation on already-cancelled order is idempotent (delta = 0, no-op)
      const res2 = await cteQuery(order.id);
      if (res2.length !== 0) {
        throw new Error(`CTE execution 2 (idempotency) failed: expected 0 rows affected, got: ${JSON.stringify(res2)}`);
      }

      const c2 = await prisma.coupon.findUnique({ where: { id: coupon.id } });
      if (c2?.usageCount !== 1) {
        throw new Error(`Double-decrement violation: coupon usage count changed to ${c2?.usageCount}`);
      }

      // Parity Rollback Assertion: Transaction rolls back if promotion usage_count < delta or missing
      let parityRollbackSucceeded = false;
      const order2 = await prisma.order.create({
        data: {
          orderNumber: 'ORD-PROMO-PARITY-' + runId,
          totalPaise: 500000,
          subtotalPaise: 500000,
          status: 'PENDING_PAYMENT',
          couponId: coupon.id,
          shippingAddress: {},
          billingAddress: {},
        },
      });

      // Set coupon usage count to 0 so delta (1) > usage_count (0)
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usageCount: 0 } });

      try {
        await prisma.$transaction(async (tx) => {
          const res = await tx.$queryRaw<Array<{ id: string; usage_count: number; delta: number }>>`
            WITH transitioned AS (
              UPDATE orders
              SET status = 'CANCELLED'::"OrderStatus", updated_at = NOW()
              WHERE id = ${order2.id} AND status != 'CANCELLED'::"OrderStatus"
              RETURNING coupon_id
            ),
            aggregated AS (
              SELECT coupon_id AS promotion_id, COUNT(*)::int AS delta
              FROM transitioned
              WHERE coupon_id IS NOT NULL
              GROUP BY coupon_id
            )
            UPDATE coupons c
            SET usage_count = c.usage_count - a.delta,
                updated_at = NOW()
            FROM aggregated a
            WHERE c.id = a.promotion_id
              AND c.usage_count >= a.delta
            RETURNING c.id, c.usage_count, a.delta;
          `;
          // Parity assertion: if order had coupon but zero coupon rows updated, abort transaction
          if (res.length === 0) {
            throw new Error('PROMOTION_PARITY_ROLLBACK: coupon usage_count insufficient to decrement');
          }
        });
      } catch (err: unknown) {
        if (String(err).includes('PROMOTION_PARITY_ROLLBACK')) {
          parityRollbackSucceeded = true;
        }
      }

      if (!parityRollbackSucceeded) {
        throw new Error('Transaction parity assertion failed to abort transaction!');
      }

      // Confirm order2 remains PENDING_PAYMENT due to transaction rollback
      const order2Check = await prisma.order.findUnique({ where: { id: order2.id } });
      if (order2Check?.status !== 'PENDING_PAYMENT') {
        throw new Error(`Parity rollback failed: order status was committed as ${order2Check?.status}`);
      }
    });

    const passedCount = results.filter((r) => r.status === 'PASSED').length;
    const failedCount = results.filter((r) => r.status === 'FAILED').length;
    console.log('\n' + '='.repeat(75));
    console.log(`Results: ${passedCount} passed, ${failedCount} failed of ${results.length} tests`);
    console.log('='.repeat(75));

    return {
      connected: true,
      total: results.length,
      passed: passedCount,
      failed: failedCount,
      blocked: 0,
      results,
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Direct execution harness
if ((typeof require !== 'undefined' && require.main === module) || process.argv[1]?.includes('postgres-real.integration')) {
  runPostgresIntegrationSuite()
    .then((summary) => {
      if (summary.failed > 0) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error('Fatal execution error:', err);
      process.exit(1);
    });
}
