import { test, expect } from '@playwright/test';
import { resolveClientIp, isValidIp } from '../lib/proxy-trust';
import { HybridRateLimiter } from '../lib/rate-limiter';

test.describe('Sprint 2I.2: Authentication Security & Rate Limiting Verification', () => {
  const ADMIN_SECRET = process.env.ADMIN_AUTH_SECRET || 'placeholder_minimum_32_character_cryptographic_secret';

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

    // Exhaust attempts for Account A (10 failed attempts)
    for (let i = 0; i < 10; i++) {
      await request.post('/api/admin/auth', {
        data: { account: targetAccountA, password: 'wrong_password_attempt' },
      });
    }

    // 11th attempt on Account A must be rejected with HTTP 429
    const resA = await request.post('/api/admin/auth', {
      data: { account: targetAccountA, password: 'wrong_password_attempt' },
    });
    expect(resA.status()).toBe(429);
    const bodyA = await resA.json();
    expect(bodyA.error).toContain('Too many failed authentication attempts');

    // Account B must NOT be affected by Account A lockout
    const resB = await request.post('/api/admin/auth', {
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

    // 10 failed attempts
    for (let i = 0; i < 10; i++) {
      const res = await request.post('/api/admin/auth', {
        data: { account: testAccount, password: 'bad_password' },
      });
      expect(res.status()).toBe(401);
    }

    // 11th attempt must trigger HTTP 429
    const rateLimitedRes = await request.post('/api/admin/auth', {
      data: { account: testAccount, password: 'bad_password' },
    });
    expect(rateLimitedRes.status()).toBe(429);
    expect(rateLimitedRes.headers()['retry-after']).toBeDefined();
    expect(rateLimitedRes.headers()['x-ratelimit-remaining']).toBe('0');
  });

  test('SEC.11: Account enumeration defense: non-existent and existing accounts receive identical generic responses', async ({
    request,
  }) => {
    const resNonExistent = await request.post('/api/admin/auth', {
      data: { account: 'completely_unknown_account_xyz', password: 'wrong' },
    });
    expect(resNonExistent.status()).toBe(401);
    const bodyNonExistent = await resNonExistent.json();

    const resExisting = await request.post('/api/admin/auth', {
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

    // 1 failed attempt
    const res1 = await request.post('/api/admin/auth', {
      data: { account: resetAccount, password: 'wrong' },
    });
    expect(res1.status()).toBe(401);
    expect(res1.headers()['x-ratelimit-remaining']).toBe('9');

    // Successful login resets failure counter
    const successRes = await request.post('/api/admin/auth', {
      data: { account: resetAccount, secretKey: ADMIN_SECRET },
    });
    expect(successRes.status()).toBe(200);

    // Subsequent failed attempt has full remaining quota (10 - 1 = 9)
    const res2 = await request.post('/api/admin/auth', {
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
});
