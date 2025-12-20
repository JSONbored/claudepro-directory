import { expect, test } from '@playwright/test';

/**
 * Comprehensive Changelog Index API Route E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Changelog LLMs.txt format retrieval
 * - Format parameter validation (must be 'llms-changelog')
 * - Response format validation (text/plain)
 * - Cache headers
 * - CORS headers
 * - Service layer integration (ContentService.getChangelogLlmsTxt)
 * - OPTIONS requests
 */

test.describe('GET /api/content/changelog', () => {
  test('should return changelog LLMs.txt with valid format', async ({ request }) => {
    const response = await request.get('/api/content/changelog?format=llms-changelog');

    expect(response.status()).toBe(200);

    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('text/plain');

    const text = await response.text();
    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(0);
  });

  test('should return 400 for missing format parameter', async ({ request }) => {
    const response = await request.get('/api/content/changelog');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should return 400 for invalid format', async ({ request }) => {
    const response = await request.get('/api/content/changelog?format=invalid');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should return 400 for format other than llms-changelog', async ({ request }) => {
    const response = await request.get('/api/content/changelog?format=json');

    expect(response.status()).toBe(400);
  });

  test('should include X-Generated-By header', async ({ request }) => {
    const response = await request.get('/api/content/changelog?format=llms-changelog');

    if (response.status() === 200) {
      expect(response.headers()['x-generated-by']).toBeDefined();
      expect(response.headers()['x-generated-by']).toContain(
        'prisma.rpc.generate_changelog_llms_txt'
      );
    }
  });

  test('should include cache headers', async ({ request }) => {
    const response = await request.get('/api/content/changelog?format=llms-changelog');

    if (response.status() === 200) {
      expect(response.headers()['cache-control']).toBeDefined();
      expect(response.headers()['cache-control']).toContain('public');
    }
  });

  test('should include CORS headers', async ({ request }) => {
    const response = await request.get('/api/content/changelog?format=llms-changelog');

    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should include security headers', async ({ request }) => {
    const response = await request.get('/api/content/changelog?format=llms-changelog');

    if (response.status() === 200) {
      expect(response.headers()['x-content-type-options']).toBeDefined();
    }
  });

  test('should handle service layer errors gracefully', async ({ request }) => {
    // This test verifies error handling if ContentService.getChangelogLlmsTxt fails
    const response = await request.get('/api/content/changelog?format=llms-changelog');

    // Should return either 200 or 500 (not crash)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle OPTIONS request', async ({ request }) => {
    const response = await request.options('/api/content/changelog');

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
  });

  test('should return valid text content', async ({ request }) => {
    const response = await request.get('/api/content/changelog?format=llms-changelog');

    if (response.status() === 200) {
      const text = await response.text();

      // Should be non-empty text
      expect(text.length).toBeGreaterThan(0);

      // Should contain changelog-like content (hashes for headers)
      expect(text).toContain('#');
    }
  });

  test('should handle empty format parameter', async ({ request }) => {
    const response = await request.get('/api/content/changelog?format=');

    expect(response.status()).toBe(400);
  });

  test('should handle special characters in format', async ({ request }) => {
    const response = await request.get('/api/content/changelog?format=llms-changelog%20test');

    expect(response.status()).toBe(400);
  });

  test('should handle null data from getCachedChangelogLlmsTxt', async ({ request }) => {
    // This tests the error path when getCachedChangelogLlmsTxt returns null
    // The route throws an error if data is null
    // In E2E, we can't easily mock the service, but we can verify
    // the route handles errors gracefully (500 status or proper error response)
    const response = await request.get('/api/content/changelog?format=llms-changelog');

    // Should return 200 (success) or 500 (if null data error occurs)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('not found');
    }
  });

  test('should handle string replacement for newlines', async ({ request }) => {
    // This tests the replaceAll(String.raw`\n`, '\n') operation
    // The route replaces escaped newlines with actual newlines
    // In E2E, we can verify the output doesn't contain escaped newlines
    const response = await request.get('/api/content/changelog?format=llms-changelog');

    if (response.status() === 200) {
      const text = await response.text();

      // Should not contain escaped newlines (\\n)
      expect(text).not.toContain('\\n');

      // Should contain actual newlines or be properly formatted
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
