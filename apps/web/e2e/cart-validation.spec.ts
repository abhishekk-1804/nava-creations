import { test, expect } from '@playwright/test';

test.describe('Sprint 2H Phase E: Server-Authoritative Cart Validation Edge Cases', () => {
  // 1. Normal valid cart
  test('E.1: Normal valid cart recalculates subtotal and confirms validity', async ({ request }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'prod-kundan-chuda-01',
            variantId: 'var-1-26',
            quantity: 2,
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.isValid).toBe(true);
    expect(body.items.length).toBe(1);
    expect(body.items[0].pricePaise).toBe(349900);
    expect(body.subtotalPaise).toBe(699800);
    expect(body.warnings.length).toBe(0);
  });

  // 2. Manipulated client price is ignored
  test('E.2: Client-manipulated price is ignored; server price is authoritative', async ({ request }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'prod-kundan-chuda-01',
            variantId: 'var-1-26',
            quantity: 1,
            pricePaise: 100, // Attacker tries to pass ₹1
            unitPricePaise: 100,
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items[0].pricePaise).toBe(349900); // Authoritative ₹3,499
    expect(body.subtotalPaise).toBe(349900);
  });

  // 3. Invalid product ID
  test('E.3: Non-existent product ID generates warning and is omitted', async ({ request }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'non-existent-product-id-99999',
            variantId: 'var-unknown',
            quantity: 1,
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.isValid).toBe(false);
    expect(body.items.length).toBe(0);
    expect(body.subtotalPaise).toBe(0);
    expect(body.warnings.some((w: string) => w.includes('not available'))).toBe(true);
  });

  // 4. Invalid variant ID
  test('E.4: Non-existent variant ID falls back to default variant with warning', async ({ request }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'prod-kundan-chuda-01',
            variantId: 'non-existent-variant-999',
            quantity: 1,
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items.length).toBe(1);
    expect(body.warnings.some((w: string) => w.includes('does not exist'))).toBe(true);
  });

  // 5. Zero quantity
  test('E.5: Zero quantity is rejected with validation warning', async ({ request }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'prod-kundan-chuda-01',
            variantId: 'var-1-26',
            quantity: 0,
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.isValid).toBe(false);
    expect(body.items.length).toBe(0);
    expect(body.warnings.some((w: string) => w.includes('positive integer'))).toBe(true);
  });

  // 6. Negative quantity
  test('E.6: Negative quantity is rejected with validation warning', async ({ request }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'prod-kundan-chuda-01',
            variantId: 'var-1-26',
            quantity: -5,
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.isValid).toBe(false);
    expect(body.items.length).toBe(0);
    expect(body.subtotalPaise).toBe(0);
    expect(body.warnings.some((w: string) => w.includes('positive integer'))).toBe(true);
  });

  // 7. Excessive quantity (> 20)
  test('E.7: Excessive quantity is clamped to 20 with warning notice', async ({ request }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'prod-kundan-chuda-01',
            variantId: 'var-1-26',
            quantity: 100,
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.items[0].quantity).toBeLessThanOrEqual(20);
    expect(body.warnings.some((w: string) => w.includes('exceeded the maximum limit'))).toBe(true);
  });

  // 8. Out of stock / stock limit clamping
  test('E.8: Exceeding variant available stock clamps quantity with warning', async ({ request }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'prod-kundan-chuda-01',
            variantId: 'var-1-26', // Available stock is 8 in catalogue
            quantity: 50,
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    // Clamped to available stock (8)
    expect(body.items[0].quantity).toBe(8);
    expect(body.warnings.some((w: string) => w.includes('available workshop stock'))).toBe(true);
  });

  // 9. Unpublished / Draft product
  test('E.9: Unpublished product is rejected with warning', async ({ request }) => {
    const res = await request.post('/api/cart/validate', {
      data: {
        items: [
          {
            productId: 'draft-unapproved-sample',
            variantId: 'var-draft-1',
            quantity: 1,
          },
        ],
      },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.isValid).toBe(false);
    expect(body.items.length).toBe(0);
    expect(body.warnings.some((w: string) => w.includes('not available in the published catalogue'))).toBe(true);
  });
});
