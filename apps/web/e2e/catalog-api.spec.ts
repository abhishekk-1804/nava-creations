import { test, expect } from '@playwright/test';

test.describe('Catalog Storefront & Admin API Integration Tests', () => {
  test.describe('Public Storefront Read Endpoints', () => {
    test('GET /api/catalog/products returns valid structured catalogue response (HTTP 200)', async ({
      request,
    }) => {
      const response = await request.get('/api/catalog/products?page=1&limit=10');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('items');
      expect(body).toHaveProperty('total');
      expect(body).toHaveProperty('page', 1);
      expect(body).toHaveProperty('limit', 10);
      expect(Array.isArray(body.items)).toBe(true);
      expect(body.items.length).toBeGreaterThan(0);
    });

    test('GET /api/catalog/categories returns structured categories (HTTP 200)', async ({
      request,
    }) => {
      const response = await request.get('/api/catalog/categories');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('categories');
      expect(Array.isArray(body.categories)).toBe(true);
      expect(body.categories.length).toBeGreaterThan(0);
    });

    test('GET /api/catalog/collections returns structured collections (HTTP 200)', async ({
      request,
    }) => {
      const response = await request.get('/api/catalog/collections');
      expect(response.status()).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('collections');
      expect(Array.isArray(body.collections)).toBe(true);
      expect(body.collections.length).toBeGreaterThan(0);
    });

    test('GET /api/catalog/products/[slug] returns 404 for non-existent item', async ({
      request,
    }) => {
      const response = await request.get('/api/catalog/products/non-existent-bangle-xyz');
      expect(response.status()).toBe(404);

      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  test.describe('Admin Operations Security Boundary', () => {
    test('POST /api/admin/catalog/products without auth returns HTTP 401 Unauthorized', async ({
      request,
    }) => {
      const response = await request.post('/api/admin/catalog/products', {
        data: {
          name: 'Unauthorized Bangle Insertion',
          pricePaise: 150000,
          categoryId: 'dummy-id',
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('Unauthorized');
    });

    test('POST /api/admin/catalog/products with forged bearer token returns HTTP 401 Unauthorized', async ({
      request,
    }) => {
      const response = await request.post('/api/admin/catalog/products', {
        headers: {
          Authorization: 'Bearer invalid_forged_cryptographic_token_12345',
        },
        data: {
          name: 'Forged Token Insertion',
          pricePaise: 150000,
          categoryId: 'dummy-id',
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('Unauthorized');
    });

    test('PUT /api/admin/catalog/products/[id] without auth returns HTTP 401 Unauthorized', async ({
      request,
    }) => {
      const response = await request.put('/api/admin/catalog/products/sample-product-uuid', {
        data: {
          name: 'Unauthorized Price Alteration',
          pricePaise: 100,
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('Unauthorized');
    });

    test('DELETE /api/admin/catalog/products/[id] without auth returns HTTP 401 Unauthorized', async ({
      request,
    }) => {
      const response = await request.delete('/api/admin/catalog/products/sample-product-uuid');

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('Unauthorized');
    });

    test('POST /api/admin/inventory/[variantId] without auth returns HTTP 401 Unauthorized', async ({
      request,
    }) => {
      const response = await request.post('/api/admin/inventory/sample-variant-uuid', {
        data: {
          availableQty: 9999,
        },
      });

      expect(response.status()).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('Unauthorized');
    });
  });
});
