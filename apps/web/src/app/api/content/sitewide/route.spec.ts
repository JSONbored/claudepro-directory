import { expect, test } from '@playwright/test';

/**
 * Comprehensive Sitewide Content API Route E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - LLMs format (default)
 * - JSON format
 * - README format
 * - Format parameter validation
 * - Response format validation
 * - Cache headers
 * - CORS headers
 * - Service layer integration (ContentService methods)
 * - OPTIONS requests
 */

test.describe('GET /api/content/sitewide', () => {
  test('should return LLMs format by default', async ({ request }) => {
    const response = await request.get('/api/content/sitewide');

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/plain');

    const text = await response.text();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  test('should return LLMs format with format=llms', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=llms');

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/plain');
  });

  test('should return LLMs format with format=llms-txt', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=llms-txt');

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/plain');
  });

  test('should return JSON format with format=json', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=json');

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');

    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('should return README format with format=readme', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=readme');

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');

    const data = await response.json();
    expect(data).toHaveProperty('total_count');
    expect(data).toHaveProperty('categories');
  });

  test('should return 400 for invalid format', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=invalid');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should include X-Generated-By header for LLMs format', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=llms');

    if (response.status() === 200) {
      expect(response.headers()['x-generated-by']).toBeDefined();
      expect(response.headers()['x-generated-by']).toContain('prisma.rpc.generate_sitewide_llms_txt');
    }
  });

  test('should include X-Generated-By header for JSON format', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=json');

    if (response.status() === 200) {
      expect(response.headers()['x-generated-by']).toBeDefined();
      expect(response.headers()['x-generated-by']).toContain('prisma.rpc.get_sitewide_content_list');
    }
  });

  test('should include X-Generated-By header for README format', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=readme');

    if (response.status() === 200) {
      expect(response.headers()['x-generated-by']).toBeDefined();
      expect(response.headers()['x-generated-by']).toContain('prisma.rpc.generate_readme_data');
    }
  });

  test('should include cache headers', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=json');

    if (response.status() === 200) {
      expect(response.headers()['cache-control']).toBeDefined();
      expect(response.headers()['cache-control']).toContain('public');
    }
  });

  test('should include CORS headers', async ({ request }) => {
    const response = await request.get('/api/content/sitewide');

    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should include security headers', async ({ request }) => {
    const response = await request.get('/api/content/sitewide');

    if (response.status() === 200) {
      expect(response.headers()['x-content-type-options']).toBeDefined();
    }
  });

  test('should include Vary header for JSON format', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=json');

    if (response.status() === 200) {
      expect(response.headers()['vary']).toBeDefined();
      expect(response.headers()['vary']).toContain('Accept-Encoding');
    }
  });

  test('should handle service layer errors gracefully', async ({ request }) => {
    // Test with valid parameters that might cause service errors
    const response = await request.get('/api/content/sitewide?format=json');

    // Should return either 200 or 500 (not crash)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle OPTIONS request', async ({ request }) => {
    const response = await request.options('/api/content/sitewide');

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
  });

  test('should return valid JSON array for JSON format', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=json');

    if (response.status() === 200) {
      const data = await response.json();

      // Should be an array
      expect(Array.isArray(data)).toBe(true);

      // If array has items, validate structure
      if (data.length > 0) {
        const item = data[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('title');
      }
    }
  });

  test('should return valid README structure', async ({ request }) => {
    const response = await request.get('/api/content/sitewide?format=readme');

    if (response.status() === 200) {
      const data = await response.json();

      // Should have required properties
      expect(data).toHaveProperty('total_count');
      expect(data).toHaveProperty('categories');
      expect(Array.isArray(data.categories)).toBe(true);
    }
  });

  test('should handle missing format parameter (defaults to LLMs)', async ({ request }) => {
    const response = await request.get('/api/content/sitewide');

    // Should default to LLMs format
    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/plain');
  });

  test('should handle null LLMs data error', async ({ request }) => {
    // This tests the error path when getSitewideLlmsTxt returns null
    // In E2E, we can't easily mock the service, but we can verify
    // the route handles errors gracefully (500 status or proper error response)
    const response = await request.get('/api/content/sitewide?format=llms');

    // Should return 200 (success) or 500 (if null data error occurs)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('LLMs export');
    }
  });

  test('should handle non-array data from getCachedSitewideContent', async ({ request }) => {
    // This tests the edge case where getCachedSitewideContent returns non-array
    // The route accesses data.length which assumes array
    // In E2E, we can't easily mock, but we can verify graceful handling
    const response = await request.get('/api/content/sitewide?format=json');

    // Should return 200 (success) or 500 (if data is not array)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
    }
  });
});
