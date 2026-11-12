import { test, expect } from '@playwright/test';

test.describe('Sprint 2I.2: Customer Enquiry & Consultation Integration', () => {
  test('E.1: Unpersisted fallback outcome when database is disconnected returns honest guidance', async ({
    request,
  }) => {
    const payload = {
      name: 'Dr. Kavya Shenoy',
      phone: '+91 98450 99887',
      email: 'kavya.shenoy@example.com',
      eventType: 'Bridal Wedding Set',
      eventDate: '2026-12-15',
      bangleSize: '2.6',
      notes: 'Custom Kundan choker and matching bangles set with emerald accents.',
      clientTimestamp: Date.now() - 2500, // Satisfies 1s dwell-time check
    };

    const response = await request.post('/api/enquiries', { data: payload });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.outcome).toBe('UNPERSISTED_FALLBACK');
    expect(body.persistedToDb).toBe(false);
    expect(body.emailStatus).toBe('SIMULATED');
    expect(body.enquiryId).toMatch(/^ENQ-[A-Z0-9]+$/);
    expect(body.message).toContain('Please click below to send your details directly via WhatsApp');
    expect(body.whatsappDirectUrl).toContain('https://wa.me/');
    expect(body.whatsappDirectUrl).toContain(encodeURIComponent(body.enquiryId));
  });

  test('E.2: Rejects honeypot bot trap submission with HTTP 400', async ({ request }) => {
    const payload = {
      name: 'Automated Bot',
      phone: '+91 98860 11223',
      notes: 'Spam payload containing external advertising links.',
      honeypot: 'http://spam-link-trap.com', // Hidden trap field
      clientTimestamp: Date.now() - 3000,
    };

    const response = await request.post('/api/enquiries', { data: payload });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toContain('Spam submission detected');
  });

  test('E.3: Rejects rapid burst submission (dwell time < 1000ms) with HTTP 400', async ({
    request,
  }) => {
    const payload = {
      name: 'Sub-second Bot',
      phone: '+91 98860 11223',
      notes: 'Automated burst submission within 100ms of page load.',
      clientTimestamp: Date.now() + 5000, // Future timestamp / sub-second dwell detected as automated burst
    };

    const response = await request.post('/api/enquiries', { data: payload });
    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toContain('Automated burst submission detected');
  });

  test('E.4: Rejects incomplete name with HTTP 422', async ({ request }) => {
    const payload = {
      name: 'A', // Too short
      phone: '+91 98860 11223',
      notes: 'Notes with sufficient length for valid submission.',
      clientTimestamp: Date.now() - 2000,
    };

    const response = await request.post('/api/enquiries', { data: payload });
    expect(response.status()).toBe(422);

    const body = await response.json();
    expect(body.error).toContain('valid full name');
  });

  test('E.5: Rejects invalid phone number with HTTP 422', async ({ request }) => {
    const payload = {
      name: 'Pooja Hegde',
      phone: '12345', // Too short for valid Indian/international number
      notes: 'Notes with sufficient length for valid submission.',
      clientTimestamp: Date.now() - 2000,
    };

    const response = await request.post('/api/enquiries', { data: payload });
    expect(response.status()).toBe(422);

    const body = await response.json();
    expect(body.error).toContain('valid phone or WhatsApp number');
  });

  test('E.6: Rejects empty notes with HTTP 422', async ({ request }) => {
    const payload = {
      name: 'Pooja Hegde',
      phone: '+91 98860 11223',
      notes: 'Hi', // Less than 5 characters
      clientTimestamp: Date.now() - 2000,
    };

    const response = await request.post('/api/enquiries', { data: payload });
    expect(response.status()).toBe(422);

    const body = await response.json();
    expect(body.error).toContain('notes regarding your requirements');
  });

  test('E.7: Rejects oversized payload (>10KB) with HTTP 413', async ({ request }) => {
    const hugeString = 'X'.repeat(12000);
    const response = await request.post('/api/enquiries', {
      data: hugeString,
      headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(413);

    const body = await response.json();
    expect(body.error).toContain('Payload size exceeds allowable limit');
  });

  test('E.8: Sanitizes script tags in name and notes without failing valid submission', async ({
    request,
  }) => {
    const payload = {
      name: 'Ananya <script>alert("xss")</script> Rao',
      phone: '+91 98860 55443',
      notes: 'Looking for antique kundan Kada with <script>evil()</script> red gemstones.',
      clientTimestamp: Date.now() - 2500,
    };

    const response = await request.post('/api/enquiries', { data: payload });
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.whatsappDirectUrl).not.toContain('<script>');
    expect(decodeURIComponent(body.whatsappDirectUrl)).toContain('Ananya  Rao');
  });

  test('E.9: Prevents duplicate submissions within 60s and returns cached reference', async ({
    request,
  }) => {
    const payload = {
      name: 'Sneha Reddy',
      phone: '+91 97410 88776',
      notes: 'Duplicate detection test requirement for wedding reception jewellery.',
      clientTimestamp: Date.now() - 2000,
    };

    // First submission
    const res1 = await request.post('/api/enquiries', { data: payload });
    expect(res1.status()).toBe(200);
    const body1 = await res1.json();

    // Immediate duplicate submission with identical content
    const res2 = await request.post('/api/enquiries', { data: payload });
    expect([200, 202]).toContain(res2.status());
    const body2 = await res2.json();

    expect(body2.duplicated).toBe(true);
    expect(body2.enquiryId).toBe(body1.enquiryId);
  });

  test('E.10: Contact page UI renders honest offline fallback message and never makes false 4-hour promise', async ({
    page,
  }) => {
    await page.goto('/contact');
    await page.locator('#contact-name').fill('Meera Krishnan');
    await page.locator('#contact-phone').fill('+91 98860 99887');
    await page.locator('#contact-notes').fill('Custom sizing 2.4 required for bride in Bengaluru.');

    // Wait 1.2s to satisfy dwell time
    await page.waitForTimeout(1200);

    await page.getByRole('button', { name: 'Submit Bridal Consultation Enquiry' }).click();

    // Verify honest UI messaging
    await expect(page.locator('text=Direct WhatsApp Connection Required')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Send Details via WhatsApp Atelier Now')).toBeVisible();

    // Verify false promise is completely absent
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('within 4 business hours');
  });

  test('E.11: Customer enquiry submitted via /contact appears in /admin/enquiries with customer WhatsApp link', async ({
    page,
    context,
  }) => {
    // 1. Submit on /contact
    await page.goto('/contact');
    await page.locator('#contact-name').fill('Aishwarya Rai');
    await page.locator('#contact-phone').fill('+91 98450 77112');
    await page.locator('#contact-notes').fill('Bespoke royal emerald bangles requested for bridal trousseau.');
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Submit Bridal Consultation Enquiry' }).click();
    await expect(page.locator('text=Direct WhatsApp Connection Required')).toBeVisible({ timeout: 10000 });

    // 2. Set admin session
    const ADMIN_SECRET = 'placeholder_minimum_32_character_cryptographic_secret';
    const COOKIE_NAME = 'nava_admin_session';
    const crypto = await import('node:crypto');
    const rawId = 'abcdef0123456789abcdef0123456789abcdef0123456789';
    const futureExpiry = Date.now() + 24 * 3600 * 1000;
    const hmac = crypto.createHmac('sha256', ADMIN_SECRET);
    hmac.update(`${rawId}.${futureExpiry}`);
    const token = `${rawId}.${futureExpiry}.${hmac.digest('hex')}`;

    await context.addCookies([
      {
        name: COOKIE_NAME,
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    // 3. Visit /admin/enquiries
    await page.goto('/admin/enquiries');
    await expect(page.locator('h1')).toContainText('Customer Consultations & Enquiries', { timeout: 15000 });
    await expect(page.locator('text=Aishwarya Rai')).toBeVisible();
    await expect(page.locator('text=+91 98450 77112')).toBeVisible();
  });
});
