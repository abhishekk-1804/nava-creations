import { test, expect } from '@playwright/test';

test.describe('NAVA CREATIONS — Phase 3 Supabase Auth & Route Protection Verification', () => {
  test('1. Unauthenticated visit to /account is protected by Middleware and redirects to /login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('http://localhost:3000/account');
    await expect(page).toHaveURL(/http:\/\/localhost:3000\/login\?redirect=%2Faccount/);
    await expect(page.locator('text=Customer Account Login')).toBeVisible();
  });

  test('2. Unauthenticated visit to /admin is protected by Middleware and redirects to /admin/login', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('http://localhost:3000/admin');
    await expect(page).toHaveURL(/http:\/\/localhost:3000\/admin\/login\?redirect=%2Fadmin/);
    await expect(page.locator('text=Studio Administration Portal')).toBeVisible();
  });

  test('3. Auth Callback route handler (/auth/callback) exists and redirects safely', async ({ request }) => {
    // Missing code redirects to /login?error=missing_auth_code
    const res = await request.get('http://localhost:3000/auth/callback', {
      maxRedirects: 0,
    });
    expect([302, 307]).toContain(res.status());
    const location = res.headers()['location'] || '';
    expect(location).toContain('/login?error=missing_auth_code');
  });

  test('4. Customer Login UI (/login) renders unified Email/Phone + Password form, Google OAuth, and Studio Admin link', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('http://localhost:3000/login');

    // Verify Sign In heading
    await expect(page.locator('h2:has-text("Sign In")')).toBeVisible();

    // Verify Email Address or Mobile Number input
    const identifierInput = page.locator('input[name="identifier"]');
    await expect(identifierInput).toBeVisible();

    // Verify Password input
    const passwordInput = page.locator('input[name="password"]');
    await expect(passwordInput).toBeVisible();

    // Verify Sign In submit button
    const submitBtn = page.locator('button[type="submit"]:has-text("Sign In")');
    await expect(submitBtn).toBeVisible();

    // Verify Google button exists
    const googleBtn = page.locator('button:has-text("Continue with Google")');
    await expect(googleBtn).toBeVisible();

    // Verify Studio Admin Login link
    const adminLink = page.locator('a[href="/admin/login"]');
    await expect(adminLink).toBeVisible();

    // Test form submission with credentials
    await identifierInput.fill('customer@nava-creations.in');
    await passwordInput.fill('Password123!');
    await submitBtn.click();

    await expect(page).toHaveURL('http://localhost:3000/account', { timeout: 10000 });
  });

  test('5. Authenticated customer visiting /login is automatically redirected to /account', async ({ page }) => {
    // Login as seeded customer
    await page.goto('http://localhost:3000/login');
    await page.click('button:has-text("Prototype Mode: Instant Seed Login")');
    await expect(page).toHaveURL('http://localhost:3000/account', { timeout: 10000 });

    // Now visit /login again while authenticated
    await page.goto('http://localhost:3000/login');
    // Middleware / client should redirect directly to /account
    await expect(page).toHaveURL('http://localhost:3000/account', { timeout: 10000 });
  });

  test('6. Admin Login (/admin/login) authenticates with credentials and redirects to /admin', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('http://localhost:3000/admin/login');

    await expect(page.locator('text=Studio Administration Portal')).toBeVisible();

    // Use seed admin credentials
    await page.click('button:has-text("Use Seed Admin")');
    await page.click('button[type="submit"]:has-text("Authenticate Studio Session")');

    // Should redirect to /admin
    await expect(page).toHaveURL('http://localhost:3000/admin', { timeout: 10000 });
    await expect(page.locator('h1').first()).toBeVisible();
  });
});
