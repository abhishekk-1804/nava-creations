import { test, expect } from '@playwright/test';

test.describe('Platform Baseline Smoke Tests', () => {
  test('liveness probe returns HTTP 200 and alive status', async ({ request }) => {
    const response = await request.get('/api/health/liveness');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('alive');
    expect(body.service).toBe('nava-creations-web');
    expect(typeof body.uptimeSeconds).toBe('number');
  });

  test('home page renders storefront with brand typography and navigation', async ({ page }) => {
    await page.goto('/');
    
    // Verify hero heading and brand wordmark
    await expect(page.locator('h1')).toContainText('Timeless Artistry in Every Bangle.');
    await expect(page.getByRole('link', { name: 'NAVA Creations • Bengaluru' }).first()).toBeVisible();

    // Verify navigation and system health link in footer
    await expect(page.getByRole('link', { name: 'Shop All' }).first()).toBeVisible();
    const healthLink = page.locator('a[href="/api/health"]').first();
    await expect(healthLink).toBeVisible();
  });

  test('readiness probe returns health status and database connectivity', async ({ request }) => {
    const response = await request.get('/api/health/readiness');
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body.service).toBe('nava-creations-web');
    if (response.status() === 200) {
      expect(body.status).toBe('ready');
      expect(body.checks.database).toBe('connected');
    } else {
      expect(body.status).toBe('not_ready');
      expect(['unconfigured', 'disconnected']).toContain(body.checks.database);
      expect(body.error).toBeTruthy();
    }
  });

  test('aggregate health probe returns valid health status', async ({ request }) => {
    const response = await request.get('/api/health');
    expect([200, 503]).toContain(response.status());

    const body = await response.json();
    expect(body.service).toBe('nava-creations-web');
    expect(body.checks.process).toBe('alive');
    if (response.status() === 200) {
      expect(body.status).toBe('healthy');
      expect(body.checks.database).toBe('connected');
    } else {
      expect(body.status).toBe('unhealthy');
      expect(['unconfigured', 'disconnected']).toContain(body.checks.database);
    }
  });
});
