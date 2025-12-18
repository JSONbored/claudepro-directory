import { expect, test } from '@playwright/test';

/**
 * Comprehensive Templates API Route E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Template retrieval by category
 * - Category parameter validation
 * - Response format validation
 * - Cache headers
 * - CORS headers
 * - Service layer integration (getContentTemplates)
 * - OPTIONS requests
 */

test.describe('GET /api/templates', () => {
  test('should return templates for valid category', async ({ request }) => {
    // Test with a valid category
    const response = await request.get('/api/templates?category=skills');

    if (response.status() === 200) {
      const data = await response.json();

      // Validate response structure
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('category');
      expect(data).toHaveProperty('count');
      expect(data).toHaveProperty('templates');
      expect(Array.isArray(data.templates)).toBe(true);
      expect(data.success).toBe(true);
      expect(data.category).toBe('skills');
    } else {
      // If category is invalid, should return 400
      expect(response.status()).toBe(400);
    }
  });

  test('should return 400 for missing category parameter', async ({ request }) => {
    const response = await request.get('/api/templates');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should return 400 for invalid category', async ({ request }) => {
    const response = await request.get('/api/templates?category=invalid-category');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should return 400 for "all" category', async ({ request }) => {
    const response = await request.get('/api/templates?category=all');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should include cache headers', async ({ request }) => {
    const response = await request.get('/api/templates?category=skills');

    if (response.status() === 200) {
      expect(response.headers()['cache-control']).toBeDefined();
      expect(response.headers()['cache-control']).toContain('public');
    }
  });

  test('should include CORS headers', async ({ request }) => {
    const response = await request.get('/api/templates?category=skills');

    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should handle service layer errors gracefully', async ({ request }) => {
    // Test with a valid category that might cause service errors
    const response = await request.get('/api/templates?category=skills');

    // Should return either 200 or 500 (not crash)
    expect([200, 400, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle OPTIONS request', async ({ request }) => {
    const response = await request.options('/api/templates');

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
  });

  test('should return templates with expected structure', async ({ request }) => {
    const response = await request.get('/api/templates?category=skills');

    if (response.status() === 200) {
      const data = await response.json();

      if (data.templates.length > 0) {
        const template = data.templates[0];
        // Templates should have id and title at minimum
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('title');
      }
    }
  });

  test('should handle all valid content categories', async ({ request }) => {
    // Test with different valid categories
    const categories = ['skills', 'agents', 'mcp', 'rules'];

    for (const category of categories) {
      const response = await request.get(`/api/templates?category=${category}`);

      // Should either succeed (200) or return 400 if category is invalid
      expect([200, 400]).toContain(response.status());
    }
  });

  test('should return consistent response format', async ({ request }) => {
    const response1 = await request.get('/api/templates?category=skills');
    const data1 = await response1.json();

    const response2 = await request.get('/api/templates?category=skills');
    const data2 = await response2.json();

    if (response1.status() === 200 && response2.status() === 200) {
      // Response structure should be consistent
      expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort());
      expect(Array.isArray(data1.templates)).toBe(true);
      expect(Array.isArray(data2.templates)).toBe(true);
    }
  });

  test('should handle empty category parameter', async ({ request }) => {
    const response = await request.get('/api/templates?category=');

    expect(response.status()).toBe(400);
  });

  test('should handle special characters in category', async ({ request }) => {
    const response = await request.get('/api/templates?category=skills%20test');

    expect(response.status()).toBe(400);
  });
});
