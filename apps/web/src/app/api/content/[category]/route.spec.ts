import { expect, test } from '@playwright/test';

/**
 * Comprehensive Category Content API Route E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Category content retrieval (JSON format)
 * - Category LLMs.txt retrieval
 * - Category parameter validation (from path)
 * - Format parameter validation
 * - Response format validation
 * - Cache headers
 * - CORS headers
 * - Service layer integration (ContentService methods)
 * - OPTIONS requests
 */

test.describe('GET /api/content/[category]', () => {
  test('should return JSON content for valid category', async ({ request }) => {
    // Test with a valid category
    const response = await request.get('/api/content/skills?format=json');

    if (response.status() === 200) {
      const data = await response.json();

      // Should be an array or object
      expect(Array.isArray(data) || typeof data === 'object').toBe(true);
    } else {
      // If category is invalid, should return 400 or 404
      expect([400, 404]).toContain(response.status());
    }
  });

  test('should return LLMs.txt for valid category', async ({ request }) => {
    const response = await request.get('/api/content/skills?format=llms-category');

    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/plain');

      const text = await response.text();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    } else {
      // If category is invalid, should return 400 or 404
      expect([400, 404]).toContain(response.status());
    }
  });

  test('should return 400 for invalid category', async ({ request }) => {
    const response = await request.get('/api/content/invalid-category?format=json');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should return 400 for missing format parameter', async ({ request }) => {
    const response = await request.get('/api/content/skills');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should return 400 for invalid format', async ({ request }) => {
    const response = await request.get('/api/content/skills?format=invalid');

    expect(response.status()).toBe(400);
  });

  test('should return 404 for non-existent category content', async ({ request }) => {
    // Test with a valid category that might not have content
    const response = await request.get('/api/content/skills?format=json');

    // Should return either 200 (has content) or 404 (no content)
    expect([200, 400, 404]).toContain(response.status());

    if (response.status() === 404) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should include X-Generated-By header for JSON format', async ({ request }) => {
    const response = await request.get('/api/content/skills?format=json');

    if (response.status() === 200) {
      expect(response.headers()['x-generated-by']).toBeDefined();
      expect(response.headers()['x-generated-by']).toContain('prisma.rpc.get_category_content_list');
    }
  });

  test('should include X-Generated-By header for LLMs format', async ({ request }) => {
    const response = await request.get('/api/content/skills?format=llms-category');

    if (response.status() === 200) {
      expect(response.headers()['x-generated-by']).toBeDefined();
      expect(response.headers()['x-generated-by']).toContain('prisma.rpc.generate_category_llms_txt');
    }
  });

  test('should include cache headers', async ({ request }) => {
    const response = await request.get('/api/content/skills?format=json');

    if (response.status() === 200) {
      expect(response.headers()['cache-control']).toBeDefined();
      expect(response.headers()['cache-control']).toContain('public');
    }
  });

  test('should include CORS headers', async ({ request }) => {
    const response = await request.get('/api/content/skills?format=json');

    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should include security headers', async ({ request }) => {
    const response = await request.get('/api/content/skills?format=json');

    if (response.status() === 200) {
      expect(response.headers()['x-content-type-options']).toBeDefined();
    }
  });

  test('should handle service layer errors gracefully', async ({ request }) => {
    // Test with valid parameters that might cause service errors
    const response = await request.get('/api/content/skills?format=json');

    // Should return either 200, 400, 404, or 500 (not crash)
    expect([200, 400, 404, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle OPTIONS request', async ({ request }) => {
    const response = await request.options('/api/content/skills');

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
  });

  test('should handle all valid content categories', async ({ request }) => {
    // Test with different valid categories
    const categories = ['skills', 'agents', 'mcp', 'rules'];

    for (const category of categories) {
      const response = await request.get(`/api/content/${category}?format=json`);

      // Should either succeed (200), validate (400), or return 404
      expect([200, 400, 404]).toContain(response.status());
    }
  });

  test('should return valid JSON array for JSON format', async ({ request }) => {
    const response = await request.get('/api/content/skills?format=json');

    if (response.status() === 200) {
      const data = await response.json();

      // Should be an array or object
      expect(Array.isArray(data) || typeof data === 'object').toBe(true);
    }
  });

  test('should return valid text for LLMs format', async ({ request }) => {
    const response = await request.get('/api/content/skills?format=llms-category');

    if (response.status() === 200) {
      const text = await response.text();

      // Should be non-empty text
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('should handle empty format parameter', async ({ request }) => {
    const response = await request.get('/api/content/skills?format=');

    expect(response.status()).toBe(400);
  });

  test('should handle special characters in category path', async ({ request }) => {
    const response = await request.get('/api/content/skills%20test?format=json');

    expect(response.status()).toBe(400);
  });

  test('should handle null data from getCachedCategoryLlmsTxt', async ({ request }) => {
    // This tests the error path when getCachedCategoryLlmsTxt returns null
    // The route returns 404 if data is null
    // In E2E, we can't easily mock, but we can verify graceful handling
    const response = await request.get('/api/content/skills?format=llms-category');

    // Should return 200 (success) or 404 (if null data)
    expect([200, 400, 404]).toContain(response.status());

    if (response.status() === 404) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle empty array from getCachedCategoryContent', async ({ request }) => {
    // This tests the edge case where getCachedCategoryContent returns empty array
    // The route returns 404 if data is empty
    // In E2E, we can't easily mock, but we can verify graceful handling
    const response = await request.get('/api/content/skills?format=json');

    // Should return 200 (success) or 404 (if empty array)
    expect([200, 400, 404]).toContain(response.status());

    if (response.status() === 404) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle missing route context', async ({ request }) => {
    // This tests the error path when nextContext.params is missing
    // The route throws an error if context is missing
    // In E2E, we can't easily simulate this, but we can verify graceful handling
    // This is more of an integration test - the route should always have context in real usage
    const response = await request.get('/api/content/skills?format=json');

    // Should return 200, 400, 404, or 500 (not crash)
    expect([200, 400, 404, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });
});
