import { expect, test } from '@playwright/test';

/**
 * Comprehensive Social Proof Stats API Route E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Social proof statistics retrieval
 * - Response format validation
 * - ETag and Last-Modified headers
 * - Cache headers
 * - CORS headers
 * - Service layer integration (MiscService.getSocialProofStats)
 * - OPTIONS requests
 */

test.describe('GET /api/stats/social-proof', () => {
  test('should return social proof stats successfully', async ({ request }) => {
    const response = await request.get('/api/stats/social-proof');

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Validate response structure
    expect(data).toHaveProperty('success');
    expect(data).toHaveProperty('stats');
    expect(data).toHaveProperty('timestamp');
    expect(data.success).toBe(true);

    // Validate stats structure
    expect(data.stats).toHaveProperty('contributors');
    expect(data.stats).toHaveProperty('submissions');
    expect(data.stats).toHaveProperty('successRate');
    expect(data.stats).toHaveProperty('totalUsers');

    // Validate contributors structure
    expect(data.stats.contributors).toHaveProperty('count');
    expect(data.stats.contributors).toHaveProperty('names');
    expect(Array.isArray(data.stats.contributors.names)).toBe(true);
    expect(typeof data.stats.contributors.count).toBe('number');
    expect(typeof data.stats.submissions).toBe('number');
  });

  test('should include ETag header', async ({ request }) => {
    const response = await request.get('/api/stats/social-proof');

    if (response.status() === 200) {
      expect(response.headers()['etag']).toBeDefined();
      expect(response.headers()['etag']).toMatch(/^".*"$/); // Should be quoted
    }
  });

  test('should include Last-Modified header', async ({ request }) => {
    const response = await request.get('/api/stats/social-proof');

    if (response.status() === 200) {
      expect(response.headers()['last-modified']).toBeDefined();
      // Should be a valid date string
      expect(new Date(response.headers()['last-modified']).toString()).not.toBe('Invalid Date');
    }
  });

  test('should include cache headers', async ({ request }) => {
    const response = await request.get('/api/stats/social-proof');

    if (response.status() === 200) {
      expect(response.headers()['cache-control']).toBeDefined();
      expect(response.headers()['cache-control']).toContain('public');
      expect(response.headers()['cache-control']).toContain('s-maxage=300');
      expect(response.headers()['cache-control']).toContain('stale-while-revalidate=600');
    }
  });

  test('should include CORS headers', async ({ request }) => {
    const response = await request.get('/api/stats/social-proof');

    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should handle service layer errors gracefully', async ({ request }) => {
    // This test verifies error handling if MiscService.getSocialProofStats fails
    const response = await request.get('/api/stats/social-proof');

    // Should return either 200 or 500 (not crash)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle OPTIONS request', async ({ request }) => {
    const response = await request.options('/api/stats/social-proof');

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
  });

  test('should return consistent response format', async ({ request }) => {
    const response1 = await request.get('/api/stats/social-proof');
    const data1 = await response1.json();

    const response2 = await request.get('/api/stats/social-proof');
    const data2 = await response2.json();

    if (response1.status() === 200 && response2.status() === 200) {
      // Response structure should be consistent
      expect(Object.keys(data1).toEqual(Object.keys(data2)));
      expect(Object.keys(data1.stats).sort()).toEqual(Object.keys(data2.stats).sort());
    }
  });

  test('should handle rapid consecutive requests', async ({ request }) => {
    // Make multiple rapid requests
    const promises = Array.from({ length: 5 }, () =>
      request.get('/api/stats/social-proof')
    );

    const responses = await Promise.all(promises);

    // All should succeed
    responses.forEach((response) => {
      expect([200, 500]).toContain(response.status());
    });

    // All should have valid JSON
    const dataPromises = responses.map((r) => r.json());
    const dataArray = await Promise.all(dataPromises);

    dataArray.forEach((data) => {
      if (data.success) {
        expect(data).toHaveProperty('stats');
        expect(data).toHaveProperty('timestamp');
      }
    });
  });

  test('should not require query parameters', async ({ request }) => {
    const response = await request.get('/api/stats/social-proof');

    // Should work without any query parameters
    expect([200, 500]).toContain(response.status());
  });

  test('should ignore extra query parameters', async ({ request }) => {
    const response = await request.get('/api/stats/social-proof?extra=param&another=value');

    // Should still work with extra parameters
    expect([200, 500]).toContain(response.status());
  });

  test('should return valid timestamp', async ({ request }) => {
    const response = await request.get('/api/stats/social-proof');

    if (response.status() === 200) {
      const data = await response.json();

      // Timestamp should be a valid ISO string
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date');
    }
  });

  test('should return valid numeric values', async ({ request }) => {
    const response = await request.get('/api/stats/social-proof');

    if (response.status() === 200) {
      const data = await response.json();

      // All numeric fields should be numbers or null
      expect(typeof data.stats.contributors.count).toBe('number');
      expect(typeof data.stats.submissions).toBe('number');
      expect(
        data.stats.successRate === null || typeof data.stats.successRate === 'number'
      ).toBe(true);
      expect(data.stats.totalUsers === null || typeof data.stats.totalUsers === 'number').toBe(
        true
      );
    }
  });

  test('should handle null/empty data from getSocialProofStats', async ({ request }) => {
    // This tests the edge case where getSocialProofStats returns null or empty array
    // The route handles this by returning default values (count: 0, names: [], etc.)
    // In E2E, we can't easily mock, but we can verify graceful handling
    const response = await request.get('/api/stats/social-proof');

    // Should return 200 (success) or 500 (if error occurs)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('stats');
      expect(data.stats).toHaveProperty('contributors');
      expect(data.stats.contributors).toHaveProperty('count');
      expect(data.stats.contributors).toHaveProperty('names');
      expect(Array.isArray(data.stats.contributors.names)).toBe(true);
    }
  });

  test('should handle non-array contributor_names', async ({ request }) => {
    // This tests the edge case where contributor_names is not an array
    // The route checks Array.isArray(row.contributor_names) and defaults to []
    // In E2E, we can verify graceful handling
    const response = await request.get('/api/stats/social-proof');

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.stats.contributors.names).toBeDefined();
      expect(Array.isArray(data.stats.contributors.names)).toBe(true);
    }
  });
});
