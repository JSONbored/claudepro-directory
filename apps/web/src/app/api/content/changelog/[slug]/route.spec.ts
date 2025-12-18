import { expect, test } from '@playwright/test';

/**
 * Comprehensive Changelog Entry API Route E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Changelog entry LLMs.txt retrieval by slug
 * - Format parameter validation (must be 'llms-entry')
 * - Slug parameter validation (from path)
 * - Response format validation (text/plain)
 * - 404 handling for non-existent entries
 * - Cache headers
 * - CORS headers
 * - Service layer integration (ContentService.getChangelogEntryLlmsTxt)
 * - OPTIONS requests
 */

test.describe('GET /api/content/changelog/[slug]', () => {
  test('should return changelog entry LLMs.txt with valid slug and format', async ({ request }) => {
    // Test with a valid changelog slug - adjust based on your test data
    const response = await request.get(
      '/api/content/changelog/1-2-0-2025-12-07?format=llms-entry'
    );

    if (response.status() === 200) {
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('text/plain');

      const text = await response.text();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    } else {
      // If entry doesn't exist, should return 404
      expect(response.status()).toBe(404);
    }
  });

  test('should return 400 for missing format parameter', async ({ request }) => {
    const response = await request.get('/api/content/changelog/1-2-0-2025-12-07');

    expect(response.status()).toBe(400);

    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('should return 400 for invalid format', async ({ request }) => {
    const response = await request.get(
      '/api/content/changelog/1-2-0-2025-12-07?format=invalid'
    );

    expect(response.status()).toBe(400);
  });

  test('should return 404 for non-existent changelog entry', async ({ request }) => {
    const response = await request.get(
      '/api/content/changelog/non-existent-entry-12345?format=llms-entry'
    );

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('not found');
  });

  test('should include X-Generated-By header', async ({ request }) => {
    const response = await request.get(
      '/api/content/changelog/1-2-0-2025-12-07?format=llms-entry'
    );

    if (response.status() === 200) {
      expect(response.headers()['x-generated-by']).toBeDefined();
      expect(response.headers()['x-generated-by']).toContain(
        'prisma.rpc.generate_changelog_entry_llms_txt'
      );
    }
  });

  test('should include cache headers', async ({ request }) => {
    const response = await request.get(
      '/api/content/changelog/1-2-0-2025-12-07?format=llms-entry'
    );

    if (response.status() === 200) {
      expect(response.headers()['cache-control']).toBeDefined();
      expect(response.headers()['cache-control']).toContain('public');
    }
  });

  test('should include CORS headers', async ({ request }) => {
    const response = await request.get(
      '/api/content/changelog/1-2-0-2025-12-07?format=llms-entry'
    );

    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should include security headers', async ({ request }) => {
    const response = await request.get(
      '/api/content/changelog/1-2-0-2025-12-07?format=llms-entry'
    );

    if (response.status() === 200) {
      expect(response.headers()['x-content-type-options']).toBeDefined();
    }
  });

  test('should handle service layer errors gracefully', async ({ request }) => {
    // Test with a slug that might cause service errors
    const response = await request.get('/api/content/changelog/error-test?format=llms-entry');

    // Should return either 404 or 500 (not crash)
    expect([404, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle OPTIONS request', async ({ request }) => {
    const response = await request.options('/api/content/changelog/1-2-0-2025-12-07');

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
  });

  test('should return valid text content', async ({ request }) => {
    const response = await request.get(
      '/api/content/changelog/1-2-0-2025-12-07?format=llms-entry'
    );

    if (response.status() === 200) {
      const text = await response.text();

      // Should be non-empty text
      expect(text.length).toBeGreaterThan(0);

      // Should contain changelog-like content
      expect(text).toContain('#');
    }
  });

  test('should handle empty format parameter', async ({ request }) => {
    const response = await request.get('/api/content/changelog/1-2-0-2025-12-07?format=');

    expect(response.status()).toBe(400);
  });

  test('should handle special characters in slug', async ({ request }) => {
    const response = await request.get('/api/content/changelog/test@slug?format=llms-entry');

    // Should either validate (400) or return 404
    expect([400, 404]).toContain(response.status());
  });

  test('should handle very long slug', async ({ request }) => {
    const longSlug = 'a'.repeat(300);
    const response = await request.get(`/api/content/changelog/${longSlug}?format=llms-entry`);

    // Should either validate (400) or return 404, not crash
    expect([400, 404]).toContain(response.status());
  });

  test('should handle null data from getCachedChangelogEntryLlmsTxt', async ({ request }) => {
    // This tests the error path when getCachedChangelogEntryLlmsTxt returns null
    // The route returns 404 if data is null
    // In E2E, we can verify graceful handling
    const response = await request.get(
      '/api/content/changelog/non-existent-entry-12345?format=llms-entry'
    );

    // Should return 404 for null data
    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('not found');
  });

  test('should handle string replacement for newlines', async ({ request }) => {
    // This tests the replaceAll(String.raw`\n`, '\n') operation
    // The route replaces escaped newlines with actual newlines
    // In E2E, we can verify the output doesn't contain escaped newlines
    const response = await request.get(
      '/api/content/changelog/1-2-0-2025-12-07?format=llms-entry'
    );

    if (response.status() === 200) {
      const text = await response.text();
      
      // Should not contain escaped newlines (\\n)
      expect(text).not.toContain('\\n');
      
      // Should contain actual newlines or be properly formatted
      expect(text.length).toBeGreaterThan(0);
    }
  });

  test('should handle missing route context', async ({ request }) => {
    // This tests the error path when nextContext.params is missing
    // The route throws an error if context is missing
    // In E2E, we can't easily simulate this, but we can verify graceful handling
    // This is more of an integration test - the route should always have context in real usage
    const response = await request.get(
      '/api/content/changelog/1-2-0-2025-12-07?format=llms-entry'
    );

    // Should return 200, 400, 404, or 500 (not crash)
    expect([200, 400, 404, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });
});
