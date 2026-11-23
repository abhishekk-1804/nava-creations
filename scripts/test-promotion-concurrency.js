/**
 * Promotion Concurrency & Over-Redemption Test
 */

const { PromotionService } = require('../apps/web/lib/promotion-service');

async function testPromotions() {
  console.log('=== PROMOTION CONCURRENCY TEST ===');
  PromotionService.resetForTesting();

  // Create coupon with strictly 2 redemptions limit
  const coupon = await PromotionService.createCoupon({
    code: 'FLASH2',
    description: 'Flash sale coupon with 2 uses only',
    type: 'FLAT_AMOUNT',
    value: 10000,
    minOrderPaise: 50000,
    usageLimit: 2,
  });
  console.log(`Created test coupon: ${coupon.code} (usageLimit: ${coupon.usageLimit})`);

  // Concurrently attempt to increment usage 5 times
  const attempts = 5;
  const results = await Promise.all(
    Array.from({ length: attempts }, async (_, i) => {
      try {
        await PromotionService.incrementUsage('FLASH2');
        return { index: i, success: true };
      } catch (err) {
        return { index: i, success: false, error: err.message };
      }
    })
  );

  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);

  console.log(`Redemption Attempts: 5 | Successful: ${successes.length} | Blocked: ${failures.length}`);
  const finalCoupon = await PromotionService.getCouponByCode('FLASH2');
  console.log(`Final usage count: ${finalCoupon.usageCount} (limit: ${finalCoupon.usageLimit})`);

  if (finalCoupon.usageCount > finalCoupon.usageLimit) {
    throw new Error('OVER-REDEMPTION VIOLATION: Coupon was redeemed beyond its usage limit!');
  }
  console.log('[PASS] Promotion over-redemption successfully prevented.');
}

testPromotions().catch((err) => {
  console.error('PROMOTION TEST FAILED:', err.message);
  process.exit(1);
});
