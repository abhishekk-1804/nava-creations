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

    // Test 4: Concurrent reservation of the final stock item
    await runTest('4. Concurrent reservation of the final stock item', async () => {
      const category = await prisma.category.create({
        data: { name: 'Conc Cat ' + Date.now(), slug: 'conc-cat-' + Date.now() },
      });
      const product = await prisma.product.create({
        data: { name: 'Final Piece Set ' + Date.now(), slug: 'final-piece-' + Date.now(), categoryId: category.id },
      });
      const variant = await prisma.productVariant.create({
        data: { productId: product.id, sku: 'SKU-CONC-' + Date.now(), title: 'Last Available', pricePaise: 100000, mrpPaise: 100000 },
      });
      await prisma.inventoryItem.create({
        data: { variantId: variant.id, availableQty: 1, reservedQty: 0 },
      });

      // Transaction A attempts to claim the last item
      const txA = prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findUnique({ where: { variantId: variant.id } });
        if (!item || item.availableQty < 1) throw new Error('Out of stock in Tx A');
        return tx.inventoryItem.update({
          where: { variantId: variant.id },
          data: { availableQty: { decrement: 1 }, reservedQty: { increment: 1 } },
        });
      });

      // Transaction B attempts to claim simultaneously
      const txB = prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findUnique({ where: { variantId: variant.id } });
        if (!item || item.availableQty < 1) throw new Error('Out of stock in Tx B');
        return tx.inventoryItem.update({
          where: { variantId: variant.id },
          data: { availableQty: { decrement: 1 }, reservedQty: { increment: 1 } },
        });
      });

      const [resA, resB] = await Promise.allSettled([txA, txB]);
      const successes = [resA, resB].filter((r) => r.status === 'fulfilled');
      const failures = [resA, resB].filter((r) => r.status === 'rejected');

      if (successes.length !== 1 || failures.length !== 1) {
        throw new Error(`Concurrency violation: Expected exactly 1 success and 1 failure, got ${successes.length} successes`);
      }
    });

    // Test 5: Duplicate transaction reference rejection (Unique Constraint)
    await runTest('5. Duplicate transaction reference rejection (Unique Constraint)', async () => {
      const order = await prisma.order.create({
        data: {
          orderNumber: 'ORD-DUP-' + Date.now(),
          totalPaise: 500000,
          subtotalPaise: 500000,
          shippingAddress: {},
          billingAddress: {},
        },
      });
      const uniqueRef = 'BANK-REF-' + Date.now();
      await prisma.payment.create({
        data: {
          orderId: order.id,
          paymentReference: 'PAY-1-' + Date.now(),
          amountPaise: 500000,
          status: 'VERIFIED',
          verifiedTransactionId: uniqueRef,
        },
      });

      let duplicateRejected = false;
      try {
        await prisma.payment.create({
          data: {
            orderId: order.id,
            paymentReference: 'PAY-2-' + Date.now(),
            amountPaise: 500000,
            status: 'VERIFIED',
            verifiedTransactionId: uniqueRef, // Duplicate unique reference!
          },
        });
      } catch (err: unknown) {
        // Prisma P2002 error code is unique constraint violation
        if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
          duplicateRejected = true;
        }
      }

      if (!duplicateRejected) {
        throw new Error('Database permitted duplicate verifiedTransactionId on unique column!');
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
          claimedUtr: '123456789012',
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
if (require.main === module || process.argv[1]?.includes('postgres-real.integration')) {
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
