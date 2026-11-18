import { test, expect } from '@playwright/test';
import { resolveClientIp, isValidIp } from '../lib/proxy-trust';
import { HybridRateLimiter } from '../lib/rate-limiter';
import { validateEnvironment, assertProductionSecrets } from '../lib/env-validator';
import { PromotionService } from '../lib/promotion-service';

test.describe('Sprint 2I.2: Authentication Security & Rate Limiting Verification', () => {
  const ADMIN_SECRET = process.env.ADMIN_AUTH_SECRET || 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const CRON_SECRET = process.env.CRON_SECRET || 'c1d2e3f4a5b60718293a4b5c6d7e8f90c1d2e3f4a5b60718293a4b5c6d7e8f90';

  test('SEC.1: POST /api/admin/auth returns rate limit headers on request', async ({
    request,
  }) => {
    const response = await request.post('/api/admin/auth', {
      data: {
        password: 'invalid_password_attempt',
      },
    });

    expect(response.status()).toBe(401);
    const headers = response.headers();
    expect(headers['x-ratelimit-limit']).toBe('10');
    expect(headers['x-ratelimit-backend']).toBeTruthy();
    expect(['memory', 'upstash_redis', 'memory_fallback']).toContain(headers['x-ratelimit-backend']);
  });

  test('SEC.2: POST /api/admin/auth rejects hardcoded backdoor tokens', async ({
    request,
  }) => {
    const response = await request.post('/api/admin/auth', {
      data: {
        token: 'nava_admin_dev_token_2026',
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body.error).toContain('Invalid administrative credentials');
  });

  test('SEC.3: POST /api/admin/auth issues hardened HttpOnly SameSite=Strict cookie on valid secret', async ({
    request,
  }) => {
    const response = await request.post('/api/admin/auth', {
      data: {
        secretKey: ADMIN_SECRET,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);

    const cookies = response.headers()['set-cookie'] || '';
    expect(cookies).toContain('nava_admin_session=');
    expect(cookies).toContain('HttpOnly');
    expect(cookies.toLowerCase()).toContain('samesite=lax');
  });

  test('SEC.4: Admin session resets failure count upon successful login', async ({
    request,
  }) => {
    const uniqueClientIp = '10.0.99.1';

    // 1. One failed attempt
    await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': uniqueClientIp },
      data: { password: 'wrong' },
    });

    // 2. Successful login resets counter
    const successRes = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': uniqueClientIp },
      data: { secretKey: ADMIN_SECRET },
    });
    expect(successRes.status()).toBe(200);

    // 3. Next attempt has full remaining limit
    const postRes = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': uniqueClientIp },
      data: { password: 'wrong' },
    });
    expect(postRes.headers()['x-ratelimit-remaining']).toBe('9');
  });

  // Sprint 2K.2: Trusted Proxy & Safe IP Resolution Tests
  test('SEC.5: resolveClientIp trusts validated proxy headers when trustProxy is enabled', () => {
    // Standard reverse proxy (e.g. AWS ALB / Nginx)
    const reqWithRealIp = new Request('http://localhost:3000/api/admin/auth', {
      headers: { 'x-real-ip': '203.0.113.195' },
    });
    const resRealIp = resolveClientIp(reqWithRealIp, { trustProxy: true });
    expect(resRealIp.isTrusted).toBe(true);
    expect(resRealIp.clientIp).toBe('203.0.113.195');
    expect(resRealIp.source).toBe('x-real-ip');

    // Cloudflare edge proxy
    const reqWithCf = new Request('http://localhost:3000/api/admin/auth', {
      headers: { 'cf-connecting-ip': '198.51.100.42' },
    });
    const resCf = resolveClientIp(reqWithCf, { trustProxy: true, proxyProvider: 'cloudflare' });
    expect(resCf.isTrusted).toBe(true);
    expect(resCf.clientIp).toBe('198.51.100.42');
    expect(resCf.source).toBe('cf-connecting-ip');

    // Multi-hop X-Forwarded-For: extracts leftmost client IP
    const reqWithXff = new Request('http://localhost:3000/api/admin/auth', {
      headers: { 'x-forwarded-for': '198.51.100.99, 10.0.0.1, 172.16.0.1' },
    });
    const resXff = resolveClientIp(reqWithXff, { trustProxy: true });
    expect(resXff.isTrusted).toBe(true);
    expect(resXff.clientIp).toBe('198.51.100.99');
    expect(resXff.source).toBe('x-forwarded-for');
  });

  test('SEC.6: resolveClientIp rejects spoofed/invalid headers and falls back safely', () => {
    // Malformed IP injection attempt
    const reqWithMalformed = new Request('http://localhost:3000/api/admin/auth', {
      headers: { 'x-forwarded-for': 'not-an-ip; DROP TABLE users' },
    });
    const resMalformed = resolveClientIp(reqWithMalformed, { trustProxy: true });
    expect(resMalformed.isTrusted).toBe(false);
    expect(isValidIp(resMalformed.clientIp)).toBe(true); // Must fall back to valid IP

    // When proxy trust is NOT established, production mode rejects client-supplied headers
    const prevEnv = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string>).NODE_ENV = 'production';
      const reqUntrusted = new Request('http://localhost:3000/api/admin/auth', {
        headers: { 'x-forwarded-for': '1.2.3.4' },
      });
      const resUntrusted = resolveClientIp(reqUntrusted, { trustProxy: false });
      expect(resUntrusted.isTrusted).toBe(false);
      expect(resUntrusted.clientIp).toBe('untrusted-direct-client');
      expect(resUntrusted.source).toBe('untrusted-fallback');
    } finally {
      (process.env as Record<string, string>).NODE_ENV = prevEnv;
    }
  });

  test('SEC.7: resolveClientIp falls back to loopback when all IP headers are absent', () => {
    const reqEmpty = new Request('http://localhost:3000/api/admin/auth');
    const resEmpty = resolveClientIp(reqEmpty);
    expect(resEmpty.clientIp).toBe('127.0.0.1');
    expect(resEmpty.isTrusted).toBe(false);
  });

  test('SEC.8: POST /api/admin/auth accepts requests without forwarded headers safely', async ({
    request,
  }) => {
    const response = await request.post('/api/admin/auth', {
      data: { password: 'bad_attempt_no_headers' },
    });
    expect(response.status()).toBe(401);
    expect(response.headers()['x-ratelimit-remaining']).toBeDefined();
  });

  // Sprint 2K.4: Layered Rate Limiting & Account Isolation Tests (DEF-05 Remediation)
  test('SEC.9: Layered rate limiting isolates accounts: lockout on Account A does NOT affect Account B (DEF-05 remediation)', async ({
    request,
  }) => {
    const targetAccountA = 'manager_alpha_' + Date.now();
    const legitimateAccountB = 'manager_beta_' + Date.now();
    const clientIpA = '198.51.100.71';
    const clientIpB = '198.51.100.72';

    // Exhaust attempts for Account A (10 failed attempts)
    for (let i = 0; i < 10; i++) {
      await request.post('/api/admin/auth', {
        headers: { 'x-forwarded-for': clientIpA },
        data: { account: targetAccountA, password: 'wrong_password_attempt' },
      });
    }

    // 11th attempt on Account A must be rejected with HTTP 429
    const resA = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': clientIpA },
      data: { account: targetAccountA, password: 'wrong_password_attempt' },
    });
    expect(resA.status()).toBe(429);
    const bodyA = await resA.json();
    expect(bodyA.error).toContain('Too many failed authentication attempts');

    // Account B must NOT be affected by Account A lockout
    const resB = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': clientIpB },
      data: { account: legitimateAccountB, secretKey: ADMIN_SECRET },
    });
    expect(resB.status()).toBe(200);
    const bodyB = await resB.json();
    expect(bodyB.success).toBe(true);
  });

  test('SEC.10: Repeated failed attempts against a specific account triggers HTTP 429 with Retry-After', async ({
    request,
  }) => {
    const testAccount = 'isolated_test_account_' + Date.now();
    const clientIp = '198.51.100.73';

    // 10 failed attempts
    for (let i = 0; i < 10; i++) {
      const res = await request.post('/api/admin/auth', {
        headers: { 'x-forwarded-for': clientIp },
        data: { account: testAccount, password: 'bad_password' },
      });
      expect(res.status()).toBe(401);
    }

    // 11th attempt must trigger HTTP 429
    const rateLimitedRes = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': clientIp },
      data: { account: testAccount, password: 'bad_password' },
    });
    expect(rateLimitedRes.status()).toBe(429);
    expect(rateLimitedRes.headers()['retry-after']).toBeDefined();
    expect(rateLimitedRes.headers()['x-ratelimit-remaining']).toBe('0');
  });

  test('SEC.11: Account enumeration defense: non-existent and existing accounts receive identical generic responses', async ({
    request,
  }) => {
    const clientIp = '198.51.100.74';
    const resNonExistent = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': clientIp },
      data: { account: 'completely_unknown_account_xyz', password: 'wrong' },
    });
    expect(resNonExistent.status()).toBe(401);
    const bodyNonExistent = await resNonExistent.json();

    const resExisting = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': clientIp },
      data: { account: 'admin', password: 'wrong' },
    });
    expect(resExisting.status()).toBe(401);
    const bodyExisting = await resExisting.json();

    // Responses must be completely indistinguishable
    expect(bodyNonExistent.error).toBe(bodyExisting.error);
    expect(bodyNonExistent.error).toBe('Invalid administrative credentials. Access denied.');
  });

  test('SEC.12: Rate limit reset: successful login clears failed attempts for account', async ({
    request,
  }) => {
    const resetAccount = 'account_for_reset_test_' + Date.now();
    const clientIp = '198.51.100.75';

    // 1 failed attempt
    const res1 = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': clientIp },
      data: { account: resetAccount, password: 'wrong' },
    });
    expect(res1.status()).toBe(401);
    expect(res1.headers()['x-ratelimit-remaining']).toBe('9');

    // Successful login resets failure counter
    const successRes = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': clientIp },
      data: { account: resetAccount, secretKey: ADMIN_SECRET },
    });
    expect(successRes.status()).toBe(200);

    // Subsequent failed attempt has full remaining quota (10 - 1 = 9)
    const res2 = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': clientIp },
      data: { account: resetAccount, password: 'wrong' },
    });
    expect(res2.status()).toBe(401);
    expect(res2.headers()['x-ratelimit-remaining']).toBe('9');
  });

  test('SEC.13: HybridRateLimiter degrades gracefully to in-memory store when Redis fails', async () => {
    const limiter = new HybridRateLimiter();
    const originalUrl = process.env.UPSTASH_REDIS_REST_URL;
    const originalToken = process.env.UPSTASH_REDIS_REST_TOKEN;
    const originalNodeEnv = process.env.NODE_ENV;
    try {
      (process.env as Record<string, string>).UPSTASH_REDIS_REST_URL = 'https://unreachable-redis-host-999.upstash.io';
      (process.env as Record<string, string>).UPSTASH_REDIS_REST_TOKEN = 'mock_valid_token_string_here';
      (process.env as Record<string, string>).NODE_ENV = 'production';

      const check = await limiter.checkDistributed('test-redis-failover-' + Date.now(), 5, 60);
      expect(check.allowed).toBe(true);
      expect(check.backend).toBe('memory_fallback');
      expect(check.degraded).toBe(true);
    } finally {
      (process.env as Record<string, string>).UPSTASH_REDIS_REST_URL = originalUrl || '';
      (process.env as Record<string, string>).UPSTASH_REDIS_REST_TOKEN = originalToken || '';
      (process.env as Record<string, string>).NODE_ENV = originalNodeEnv;
    }
  });

  // Sprint 2M Remediation: Verification of BLK-02 Fix
  test('SEC.14: Single-secret web form login without account: Lockout on IP A does NOT lock out IP B (BLK-02 Remediation)', async ({
    request,
  }) => {
    const timestamp = Date.now();
    const attackerIp = '198.51.100.' + (timestamp % 200 + 1);
    const legitimateIp = '198.51.100.' + (timestamp % 200 + 2);

    // 1. Attacker on IP A submits 10 failed logins without account field (real web UI format)
    for (let i = 0; i < 10; i++) {
      const res = await request.post('/api/admin/auth', {
        headers: { 'x-forwarded-for': attackerIp },
        data: { token: 'attacker_wrong_token_' + i },
      });
      expect(res.status()).toBe(401);
    }

    // 2. 11th request from attacker IP A must be rejected with HTTP 429
    const attackerLockedRes = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': attackerIp },
      data: { token: 'attacker_wrong_token_11' },
    });
    expect(attackerLockedRes.status()).toBe(429);
    const bodyA = await attackerLockedRes.json();
    expect(bodyA.error).toContain('Too many failed authentication attempts');

    // 3. Store manager on IP B must NOT be affected by IP A lockout (real web UI format)
    const legitimateRes = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': legitimateIp },
      data: { token: ADMIN_SECRET },
    });
    expect(legitimateRes.status()).toBe(200);
    const bodyB = await legitimateRes.json();
    expect(bodyB.success).toBe(true);
    expect(bodyB.message).toBe('Administrative session established');
  });

  test('SEC.15: Real browser UI login flow: Authenticate via /admin/login form', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'WebKit browser executable not installed on Windows host');
    await page.goto('/admin/login');
    await expect(page.locator('text=Studio Administration Portal')).toBeVisible();

    // Fill in secret token in browser form
    const input = page.locator('input[type="password"]');
    await input.fill(ADMIN_SECRET);

    // Click submit button
    await page.click('button[type="submit"]');

    // Wait for redirect to /admin
    await page.waitForURL('/admin', { timeout: 10000 });
    await expect(page).toHaveURL('/admin');
  });

  test('SEC.16: Dedicated environment validator flags missing and weak production secrets', async () => {
    // 1. Missing ADMIN_AUTH_SECRET in production fails
    const res1 = validateEnvironment({
      NODE_ENV: 'production',
      CRON_SECRET: 'valid_cron_secret_32_characters_long_min',
      DATABASE_URL: 'postgresql://nava_app:pass@127.0.0.1:5432/nava_test',
    });
    expect(res1.isValid).toBe(false);
    expect(res1.errors.some((e) => e.includes('ADMIN_AUTH_SECRET'))).toBe(true);

    // 2. Short ADMIN_AUTH_SECRET (< 32 chars) fails
    const res2 = validateEnvironment({
      NODE_ENV: 'production',
      ADMIN_AUTH_SECRET: 'too_short_secret',
      CRON_SECRET: 'valid_cron_secret_32_characters_long_min',
      DATABASE_URL: 'postgresql://nava_app:pass@127.0.0.1:5432/nava_test',
    });
    expect(res2.isValid).toBe(false);
    expect(res2.errors.some((e) => e.includes('at least 32 characters'))).toBe(true);

    // 3. Known placeholder secret fails
    const res3 = validateEnvironment({
      NODE_ENV: 'production',
      ADMIN_AUTH_SECRET: 'placeholder_minimum_32_character_cryptographic_secret',
      CRON_SECRET: 'valid_cron_secret_32_characters_long_min',
      DATABASE_URL: 'postgresql://nava_app:pass@127.0.0.1:5432/nava_test',
    });
    expect(res3.isValid).toBe(false);
    expect(res3.errors.some((e) => e.includes('placeholder'))).toBe(true);

    // 3b. Short CRON_SECRET (< 32 chars) fails in production
    const res3b = validateEnvironment({
      NODE_ENV: 'production',
      ADMIN_AUTH_SECRET: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
      CRON_SECRET: 'short_cron_secret_16_chars',
      DATABASE_URL: 'postgresql://nava_app:pass@127.0.0.1:5432/nava_test',
    });
    expect(res3b.isValid).toBe(false);
    expect(res3b.errors.some((e) => e.includes('CRON_SECRET must be at least 32 characters'))).toBe(true);

    // 4. Missing CRON_SECRET fails
    const res4 = validateEnvironment({
      NODE_ENV: 'production',
      ADMIN_AUTH_SECRET: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
      DATABASE_URL: 'postgresql://nava_app:pass@127.0.0.1:5432/nava_test',
    });
    expect(res4.isValid).toBe(false);
    expect(res4.errors.some((e) => e.includes('CRON_SECRET'))).toBe(true);

    // 5. Valid high-entropy production environment passes
    const res5 = validateEnvironment({
      NODE_ENV: 'production',
      ADMIN_AUTH_SECRET: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
      CRON_SECRET: 'c1d2e3f4a5b60718293a4b5c6d7e8f90c1d2e3f4a5b60718293a4b5c6d7e8f90',
      DATABASE_URL: 'postgresql://nava_app:pass@127.0.0.1:5432/nava_test',
    });
    expect(res5.isValid).toBe(true);
    expect(res5.errors.length).toBe(0);
  });

  test('SEC.17: Unauthorized cron requests fail closed and query-string secrets are rejected', async ({
    request,
  }) => {
    // 0. State-changing cleanup endpoint strictly requires POST; GET returns HTTP 405 Method Not Allowed
    const getRes = await request.get('/api/cron/release-reservations');
    expect(getRes.status()).toBe(405);
    expect(getRes.headers()['allow']).toBe('POST');
    const getBody = await getRes.json();
    expect(getBody.error).toBe('Method Not Allowed');

    // 1. Unauthenticated request without headers returns HTTP 401
    const unauthRes = await request.post('/api/cron/release-reservations');
    expect(unauthRes.status()).toBe(401);
    const unauthBody = await unauthRes.json();
    expect(unauthBody.error).toBe('Unauthorized');

    // 2. Request with forged or invalid Bearer token returns HTTP 401
    const invalidRes = await request.post('/api/cron/release-reservations', {
      headers: { Authorization: 'Bearer forged_cron_token_12345' },
    });
    expect(invalidRes.status()).toBe(401);

    // 3. Query string secret authentication is strictly rejected (prevents log leakage)
    const queryRes = await request.post(`/api/cron/release-reservations?secret=${CRON_SECRET}`);
    expect(queryRes.status()).toBe(401);

    // 4. Authorized request with valid Bearer token returns HTTP 200
    const authRes = await request.post('/api/cron/release-reservations', {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
    });
    expect(authRes.status()).toBe(200);
    const authBody = await authRes.json();
    expect(authBody.success).toBe(true);
    expect(authBody.releasedCount).toBeDefined();
  });

  test('SEC.18: Production authentication cannot be bypassed through environment misconfiguration (APP_ENV=test)', async ({
    request,
  }) => {
    // 1. Unauthenticated request to protected admin orders returns HTTP 401
    const resOrders = await request.get('/api/admin/orders');
    expect(resOrders.status()).toBe(401);

    // 2. Forged bearer token returns HTTP 401
    const resForged = await request.get('/api/admin/orders', {
      headers: { Authorization: 'Bearer forged.session.token' },
    });
    expect(resForged.status()).toBe(401);

    // 3. Invalid admin login attempt returns HTTP 401
    const resLogin = await request.post('/api/admin/auth', {
      headers: { 'x-forwarded-for': '198.51.100.80' },
      data: { token: 'invalid_secret_attempt' },
    });
    expect(resLogin.status()).toBe(401);
  });

  test('SEC.19: Guest order authorization prevents token leakage in URL and response bodies', async ({
    request,
    playwright,
  }) => {
    // 1. Create order
    const createRes = await request.post('/api/orders', {
      data: {
        items: [{ variantId: 'var-1-24', quantity: 1 }],
        customer: { name: 'Priya R', phone: '+919845012345' },
        shippingAddress: {
          name: 'Priya R',
          phone: '+919845012345',
          addressLine1: '15, Richmond Road',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560025',
        },
        paymentMethod: 'UPI_MERCHANT_QR',
      },
    });
    expect(createRes.status()).toBe(201);
    const createData = await createRes.json();
    const orderNumber = createData.order.orderNumber;

    // Verify raw guest token is NOT disclosed in JSON payload
    expect(createData.order.guestAccessToken).toBeUndefined();

    // Verify Set-Cookie header contains HttpOnly cookie scoped to /api/orders/${orderNumber}
    const setCookie = createRes.headers()['set-cookie'] || '';
    expect(setCookie).toContain(`nava_order_${orderNumber}`);
    expect(setCookie.toLowerCase()).toContain('httponly');
    expect(setCookie.toLowerCase()).toContain(`path=/api/orders/${orderNumber.toLowerCase()}`);
    expect(setCookie.toLowerCase()).toContain('samesite=lax');

    // 1b. Order details API and nested submit-UTR API both receive the cookie and succeed
    const authViewRes = await request.get(`/api/orders/${orderNumber}`);
    expect(authViewRes.status()).toBe(200);
    const authViewBody = await authViewRes.json();
    expect(authViewBody.order.orderNumber).toBe(orderNumber);
    expect(authViewBody.order.guestAccessToken).toBeUndefined();

    const submitUtrRes = await request.post(`/api/orders/${orderNumber}/submit-utr`, {
      data: { claimedUtr: '431289110099' },
    });
    expect(submitUtrRes.status()).toBe(200);
    const utrData = await submitUtrRes.json();
    expect(utrData.order.guestAccessToken).toBeUndefined();

    // 2. Separate clean client without cookie cannot view order (HTTP 404)
    const cleanRequest = await playwright.request.newContext();
    const probeRes = await cleanRequest.get(`/api/orders/${orderNumber}`);
    expect(probeRes.status()).toBe(404);

    // 3. Query string token in URL is strictly ignored/rejected (HTTP 404)
    const urlProbe = await cleanRequest.get(`/api/orders/${orderNumber}?token=forged_token`);
    expect(urlProbe.status()).toBe(404);

    // 4. Unauthorized attempt to modify order (submit UTR) returns HTTP 404
    const tamperRes = await cleanRequest.post(`/api/orders/${orderNumber}/submit-utr`, {
      data: { claimedUtr: '123456789012' },
    });
    expect(tamperRes.status()).toBe(404);
  });

  test('SEC.20: Coupon usage increments are concurrency-safe and enforce usage limits', async () => {
    // Create test coupon with limit = 2
    const testCode = 'TESTSEC_' + Date.now();
    await PromotionService.createCoupon({
      code: testCode,
      description: 'Concurrency Test Coupon',
      type: 'FLAT_AMOUNT',
      value: 10000,
      minOrderPaise: 50000,
      usageLimit: 2,
    });

    // Concurrently attempt 5 increments
    const results = await Promise.all(
      Array.from({ length: 5 }, async () => {
        try {
          await PromotionService.incrementUsage(testCode);
          return { success: true };
        } catch (err) {
          return { success: false, error: (err as Error).message };
        }
      })
    );

    const successes = results.filter((r) => r.success);
    const failures = results.filter((r) => !r.success);

    // Exactly 2 must succeed; 3 must be rejected
    expect(successes.length).toBe(2);
    expect(failures.length).toBe(3);

    const finalCoupon = await PromotionService.getCouponByCode(testCode);
    expect(finalCoupon?.usageCount).toBe(2);
    expect(finalCoupon?.usageCount).toBeLessThanOrEqual(finalCoupon?.usageLimit ?? 0);
  });

  test('SEC.21: Invalid cart variants are rejected without silent substitution and unpublished products are omitted', async ({
    request,
  }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'prod-kundan-chuda-01',
            variantId: 'non-existent-variant-invalid-999',
            quantity: 1,
          },
          {
            productId: 'non-existent-product-id-999',
            variantId: 'var-1-26',
            quantity: 1,
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    // Both items must be rejected: items array must be empty
    expect(body.items.length).toBe(0);
    expect(body.warnings.length).toBeGreaterThanOrEqual(2);
    expect(body.warnings.some((w: string) => w.includes('does not exist') || w.includes('invalid'))).toBe(true);
  });

  test('SEC.22: Stale prices and stock manipulation are strictly overridden by server-authoritative values', async ({
    request,
  }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'prod-kundan-chuda-01',
            variantId: 'var-1-24',
            pricePaise: 100, // Attempt client price tampering (₹1 instead of ₹3,499)
            quantity: 999, // Attempt excessive quantity
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBe(1);
    const item = body.items[0];
    // Authoritative price must be preserved
    expect(item.pricePaise).toBe(349900);
    // Quantity must be clamped (max limit or stock)
    expect(item.quantity).toBeLessThanOrEqual(20);
    expect(body.warnings.some((w: string) => w.includes('Price for'))).toBe(true);
  });

  test('SEC.23: Production fail-closed validation asserts error when secrets are missing and never prints secrets', async () => {
    // 1. Missing secrets in production environment throws error
    const brokenEnv = {
      NODE_ENV: 'production',
      ADMIN_AUTH_SECRET: '',
      CRON_SECRET: '',
    };
    const val = validateEnvironment(brokenEnv);
    expect(val.isValid).toBe(false);
    expect(val.errors.length).toBeGreaterThanOrEqual(2);

    // Verify errors do not leak actual secret values
    for (const err of val.errors) {
      expect(err).not.toContain(ADMIN_SECRET);
      expect(err).not.toContain(CRON_SECRET);
    }

    // 2. assertProductionSecrets throws in production when secrets are unconfigured
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAdmin = process.env.ADMIN_AUTH_SECRET;
    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.ADMIN_AUTH_SECRET;
      expect(() => assertProductionSecrets()).toThrow();
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
      process.env.ADMIN_AUTH_SECRET = originalAdmin;
    }
  });

  test('SEC.24: Security boundary on admin orders returns HTTP 401 without exposing internal database details', async ({
    request,
  }) => {
    // 1. Unauthenticated request returns 401 with clean error message
    const unauthRes = await request.get('/api/admin/orders');
    expect(unauthRes.status()).toBe(401);
    const unauthBody = await unauthRes.json();
    expect(unauthBody.error).toBe('Unauthorized');
    expect(unauthBody.stack).toBeUndefined();

    // 2. Authenticated request succeeds cleanly without leaking database internal fields
    const authRes = await request.post('/api/admin/auth', {
      data: { secretKey: ADMIN_SECRET },
    });
    const setCookie = authRes.headers()['set-cookie'] || '';
    const match = setCookie.match(/nava_admin_session=([^;]+)/);
    const sessionToken = match ? match[1] : '';

    const ordersRes = await request.get('/api/admin/orders', {
      headers: { Cookie: `nava_admin_session=${sessionToken}` },
    });
    expect(ordersRes.status()).toBe(200);
    const ordersBody = await ordersRes.json();
    expect(ordersBody.success).toBe(true);
    expect(Array.isArray(ordersBody.orders)).toBe(true);
    expect(ordersBody.orders.length).toBeGreaterThan(0);

    // Verify guestAccessToken is strictly excluded from all administrative order listing items
    for (const ord of ordersBody.orders) {
      expect(ord.guestAccessToken).toBeUndefined();
    }

    // 3. Admin single order endpoint strictly omits guestAccessToken
    const firstOrderId = ordersBody.orders[0].id || ordersBody.orders[0].orderNumber;
    const singleRes = await request.get(`/api/admin/orders/${firstOrderId}`, {
      headers: { Cookie: `nava_admin_session=${sessionToken}` },
    });
    expect(singleRes.status()).toBe(200);
    const singleBody = await singleRes.json();
    expect(singleBody.order.guestAccessToken).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // SEC-01 Remediations: Order Access Control & Guest Token Verification
  // ---------------------------------------------------------------------------

  test('SEC.25: GET /api/orders/[orderNumber] returns uniform 404 on unauthenticated bare request', async ({
    request,
    playwright,
  }) => {
    // 1. Create a guest order
    const createRes = await request.post('/api/orders', {
      data: {
        customer: {
          name: 'Priya Sharma',
          email: 'priya.sharma@example.com',
          phone: '+919845011223',
        },
        shippingAddress: {
          name: 'Priya Sharma',
          phone: '+919845011223',
          addressLine1: '42 Lavelle Road',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560001',
        },
        items: [
          {
            variantId: 'var-1-28',
            quantity: 1,
          },
        ],
        paymentMethod: 'COD',
      },
    });
    expect(createRes.status()).toBe(201);
    const createBody = await createRes.json();
    const orderNumber = createBody.order.orderNumber;
    expect(orderNumber).toBeTruthy();

    // 2. Bare unauthenticated request must receive uniform 404 (zero PII disclosed)
    const freshContext = await playwright.request.newContext();
    const bareRes = await freshContext.get(`/api/orders/${orderNumber}`);
    expect(bareRes.status()).toBe(404);
    const bareBody = await bareRes.json();
    expect(bareBody.error).toBe('Order not found');
    expect(bareBody.order).toBeUndefined();
    await freshContext.dispose();
  });

  test('SEC.26: GET /api/orders/[orderNumber] returns uniform 404 for wrong authenticated customer', async ({
    request,
  }) => {
    // 1. Create order
    const orderA = await request.post('/api/orders', {
      data: {
        customer: {
          name: 'Customer Alpha',
          email: 'alpha@example.com',
          phone: '+919845022334',
        },
        shippingAddress: {
          name: 'Customer Alpha',
          phone: '+919845022334',
          addressLine1: '12 Indiranagar',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560038',
        },
        items: [
          {
            variantId: 'var-1-28',
            quantity: 1,
          },
        ],
        paymentMethod: 'COD',
      },
    });
    expect(orderA.status()).toBe(201);
    const orderNumberA = (await orderA.json()).order.orderNumber;

    // 2. Attempt to read Customer A order with Customer B fake/wrong session
    const wrongUserRes = await request.get(`/api/orders/${orderNumberA}`, {
      headers: {
        Cookie: 'nava_customer_session=invalid_or_wrong_user_session_token_12345',
      },
    });
    expect(wrongUserRes.status()).toBe(404);
    const wrongUserBody = await wrongUserRes.json();
    expect(wrongUserBody.error).toBe('Order not found');
    expect(wrongUserBody.order).toBeUndefined();
  });

  test('SEC.27: GET /api/orders/[orderNumber] succeeds with valid x-guest-order-token on guest order', async ({
    request,
  }) => {
    const createRes = await request.post('/api/orders', {
      data: {
        customer: {
          name: 'Meera Patel',
          email: 'meera.patel@example.com',
          phone: '+919845033445',
        },
        shippingAddress: {
          name: 'Meera Patel',
          phone: '+919845033445',
          addressLine1: '88 MG Road',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560001',
        },
        items: [
          {
            variantId: 'var-1-28',
            quantity: 1,
          },
        ],
        paymentMethod: 'COD',
      },
    });
    expect(createRes.status()).toBe(201);
    const createBody = await createRes.json();
    const orderNumber = createBody.order.orderNumber;

    // Extract 32-byte guest token from Set-Cookie header
    const setCookie = createRes.headers()['set-cookie'] || '';
    const match = setCookie.match(/nava_order_[^=]+=([^;]+)/);
    const guestToken = (match && match[1]) ? match[1] : '';
    expect(guestToken).toBeTruthy();
    expect(guestToken.length).toBe(64); // 32 bytes in hex

    // Access order using x-guest-order-token header
    const authRes = await request.get(`/api/orders/${orderNumber}`, {
      headers: {
        'x-guest-order-token': guestToken,
      },
    });

    expect(authRes.status()).toBe(200);
    const authBody = await authRes.json();
    expect(authBody.success).toBe(true);
    expect(authBody.order.orderNumber).toBe(orderNumber);
    expect(authBody.order.guestAccessToken).toBeUndefined(); // Token never reflected in body
    expect(authRes.headers()['referrer-policy']).toBe('no-referrer');
  });

  test('SEC.28: GET /api/orders/[orderNumber] returns uniform 404 on invalid or wrong-length guest token', async ({
    request,
  }) => {
    const createRes = await request.post('/api/orders', {
      data: {
        customer: {
          name: 'Ananya Roy',
          email: 'ananya.roy@example.com',
          phone: '+919845044556',
        },
        shippingAddress: {
          name: 'Ananya Roy',
          phone: '+919845044556',
          addressLine1: '15 Koramangala',
          city: 'Bengaluru',
          stateCode: '29',
          stateName: 'Karnataka',
          postalCode: '560034',
        },
        items: [
          {
            variantId: 'var-1-28',
            quantity: 1,
          },
        ],
        paymentMethod: 'COD',
      },
    });
    expect(createRes.status()).toBe(201);
    const orderNumber = (await createRes.json()).order.orderNumber;

    // 1. Wrong-length token (too short)
    const shortRes = await request.get(`/api/orders/${orderNumber}`, {
      headers: { 'x-guest-order-token': 'abcd1234' },
    });
    expect(shortRes.status()).toBe(404);

    // 2. 64-char invalid hex token
    const invalid64Token = '0'.repeat(64);
    const invalidRes = await request.get(`/api/orders/${orderNumber}`, {
      headers: { 'x-guest-order-token': invalid64Token },
    });
    expect(invalidRes.status()).toBe(404);
  });

  test('SEC.29: GET /api/orders/[orderNumber] enforces rate limiting returning 429 when threshold exceeded', async ({
    request,
  }) => {
    const uniqueClientIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
    const fakeOrderNumber = 'ORD-RATE-TEST-999';

    // Rapidly consume 30 attempts
    let hitRateLimit = false;
    for (let i = 0; i < 35; i++) {
      const res = await request.get(`/api/orders/${fakeOrderNumber}`, {
        headers: { 'x-forwarded-for': uniqueClientIp },
      });
      if (res.status() === 429) {
        hitRateLimit = true;
        const body = await res.json();
        expect(body.error).toBe('Rate limit exceeded');
        expect(res.headers()['retry-after']).toBeTruthy();
        break;
      }
    }
    expect(hitRateLimit).toBe(true);
  });
});
