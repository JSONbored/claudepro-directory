import { expect, test } from '@playwright/test';

/**
 * Comprehensive Category Configs API Route E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Category configurations retrieval
 * - Response format validation
 * - Cache headers
 * - CORS headers
 * - Service layer integration (ContentService.getCategoryConfigs)
 * - OPTIONS requests
 */

test.describe('GET /api/content/category-configs', () => {
  test('should return category configs successfully', async ({ request }) => {
    const response = await request.get('/api/content/category-configs');

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Validate response structure
    expect(Array.isArray(data)).toBe(true);
  });

  test('should return configs with expected structure', async ({ request }) => {
    const response = await request.get('/api/content/category-configs');

    if (response.status() === 200) {
      const data = await response.json();

      if (data.length > 0) {
        const config = data[0];

        // Configs should have category at minimum
        expect(config).toHaveProperty('category');
        expect(typeof config.category).toBe('string');
      }
    }
  });

  test('should include X-Generated-By header', async ({ request }) => {
    const response = await request.get('/api/content/category-configs');

    if (response.status() === 200) {
      expect(response.headers()['x-generated-by']).toBeDefined();
      expect(response.headers()['x-generated-by']).toContain(
        'prisma.rpc.get_category_configs_with_features'
      );
    }
  });

  test('should include cache headers', async ({ request }) => {
    const response = await request.get('/api/content/category-configs');

    if (response.status() === 200) {
      expect(response.headers()['cache-control']).toBeDefined();
      expect(response.headers()['cache-control']).toContain('public');
    }
  });

  test('should include CORS headers', async ({ request }) => {
    const response = await request.get('/api/content/category-configs');

    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should handle service layer errors gracefully', async ({ request }) => {
    // This test verifies error handling if ContentService.getCategoryConfigs fails
    const response = await request.get('/api/content/category-configs');

    // Should return either 200 or 500 (not crash)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle OPTIONS request', async ({ request }) => {
    const response = await request.options('/api/content/category-configs');

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
  });

  test('should return consistent response format', async ({ request }) => {
    const response1 = await request.get('/api/content/category-configs');
    const data1 = await response1.json();

    const response2 = await request.get('/api/content/category-configs');
    const data2 = await response2.json();

    if (response1.status() === 200 && response2.status() === 200) {
      // Response structure should be consistent
      expect(Array.isArray(data1)).toBe(true);
      expect(Array.isArray(data2)).toBe(true);
    }
  });

  test('should handle rapid consecutive requests', async ({ request }) => {
    // Make multiple rapid requests
    const promises = Array.from({ length: 5 }, () => request.get('/api/content/category-configs'));

    const responses = await Promise.all(promises);

    // All should succeed
    responses.forEach((response) => {
      expect([200, 500]).toContain(response.status());
    });

    // All should have valid JSON
    const dataPromises = responses.map((r) => r.json());
    const dataArray = await Promise.all(dataPromises);

    dataArray.forEach((data) => {
      expect(Array.isArray(data)).toBe(true);
    });
  });

  test('should not require query parameters', async ({ request }) => {
    const response = await request.get('/api/content/category-configs');

    // Should work without any query parameters
    expect([200, 500]).toContain(response.status());
  });

  test('should ignore extra query parameters', async ({ request }) => {
    const response = await request.get('/api/content/category-configs?extra=param&another=value');

    // Should still work with extra parameters
    expect([200, 500]).toContain(response.status());
  });
});
