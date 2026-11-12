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

  test('readiness probe returns HTTP 503 and not_ready status in unconfigured/offline database environment', async ({ request }) => {
    const response = await request.get('/api/health/readiness');
    // In unconfigured/offline database environments, the probe must strictly return HTTP 503 Service Unavailable
    expect(response.status()).toBe(503);

    const body = await response.json();
    expect(body.status).toBe('not_ready');
    expect(body.service).toBe('nava-creations-web');
    expect(['unconfigured', 'disconnected']).toContain(body.checks.database);
    expect(body.error).toBeTruthy();
  });

  test('aggregate health probe returns HTTP 503 and unhealthy status in unconfigured/offline database environment', async ({ request }) => {
    const response = await request.get('/api/health');
    // When DB is unconfigured or offline, aggregate health must strictly return HTTP 503
    expect(response.status()).toBe(503);

    const body = await response.json();
    expect(body.status).toBe('unhealthy');
    expect(['unconfigured', 'disconnected']).toContain(body.checks.database);
    expect(body.checks.process).toBe('alive');
  });
});
