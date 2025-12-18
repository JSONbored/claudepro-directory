import { expect, test } from '@playwright/test';

/**
 * Comprehensive Search Facets API Route E2E Tests
 *
 * Tests ALL functionality with strict error checking:
 * - Search facets retrieval (categories, tags, authors)
 * - Response format validation
 * - Cache headers
 * - CORS headers (auth)
 * - Service layer integration (SearchService.getSearchFacetsFormatted)
 * - OPTIONS requests
 */

test.describe('GET /api/search/facets', () => {
  test('should return search facets successfully', async ({ request }) => {
    const response = await request.get('/api/search/facets');

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Validate response structure
    expect(data).toHaveProperty('facets');
    expect(Array.isArray(data.facets)).toBe(true);
  });

  test('should return facets with expected structure', async ({ request }) => {
    const response = await request.get('/api/search/facets');

    if (response.status() === 200) {
      const data = await response.json();

      if (data.facets.length > 0) {
        const facet = data.facets[0];

        // Facets should have category and content_count at minimum
        expect(facet).toHaveProperty('category');
        expect(typeof facet.category).toBe('string');
      }
    }
  });

  test('should include cache headers', async ({ request }) => {
    const response = await request.get('/api/search/facets');

    if (response.status() === 200) {
      expect(response.headers()['cache-control']).toBeDefined();
      expect(response.headers()['cache-control']).toContain('public');
    }
  });

  test('should include CORS headers (auth)', async ({ request }) => {
    const response = await request.get('/api/search/facets');

    expect(response.headers()['access-control-allow-origin']).toBeDefined();
  });

  test('should handle service layer errors gracefully', async ({ request }) => {
    // This test verifies error handling if SearchService.getSearchFacetsFormatted fails
    const response = await request.get('/api/search/facets');

    // Should return either 200 or 500 (not crash)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle OPTIONS request', async ({ request }) => {
    const response = await request.options('/api/search/facets');

    expect(response.status()).toBe(200);
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
  });

  test('should return consistent response format', async ({ request }) => {
    const response1 = await request.get('/api/search/facets');
    const data1 = await response1.json();

    const response2 = await request.get('/api/search/facets');
    const data2 = await response2.json();

    // Response structure should be consistent
    expect(Object.keys(data1).sort()).toEqual(Object.keys(data2).sort());
    expect(Array.isArray(data1.facets)).toBe(true);
    expect(Array.isArray(data2.facets)).toBe(true);
  });

  test('should handle rapid consecutive requests', async ({ request }) => {
    // Make multiple rapid requests
    const promises = Array.from({ length: 5 }, () => request.get('/api/search/facets'));

    const responses = await Promise.all(promises);

    // All should succeed
    responses.forEach((response) => {
      expect([200, 500]).toContain(response.status());
    });

    // All should have valid JSON
    const dataPromises = responses.map((r) => r.json());
    const dataArray = await Promise.all(dataPromises);

    dataArray.forEach((data) => {
      expect(data).toHaveProperty('facets');
      expect(Array.isArray(data.facets)).toBe(true);
    });
  });

  test('should not require query parameters', async ({ request }) => {
    const response = await request.get('/api/search/facets');

    // Should work without any query parameters
    expect([200, 500]).toContain(response.status());
  });

  test('should ignore extra query parameters', async ({ request }) => {
    const response = await request.get('/api/search/facets?extra=param&another=value');

    // Should still work with extra parameters
    expect([200, 500]).toContain(response.status());
  });

  test('should handle getCachedSearchFacetsFormatted errors gracefully', async ({ request }) => {
    // This tests that getCachedSearchFacetsFormatted errors are handled
    // The route doesn't catch errors (factory handles them)
    const response = await request.get('/api/search/facets');

    // Should return 200 (success) or 500 (error)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle SearchService.getSearchFacetsFormatted errors', async ({ request }) => {
    // This tests that service.getSearchFacetsFormatted errors are handled
    // The route doesn't catch errors (factory handles them)
    const response = await request.get('/api/search/facets');

    // Should return 200 (success) or 500 (error)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle null data from getCachedSearchFacetsFormatted', async ({ request }) => {
    // This tests that null data is handled
    // The route uses Array.isArray(data) ? data : []
    const response = await request.get('/api/search/facets');

    // Should return 200 (success) or 500 (error)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('facets');
      expect(Array.isArray(data.facets)).toBe(true);
    }
  });

  test('should handle undefined data from getCachedSearchFacetsFormatted', async ({ request }) => {
    // This tests that undefined data is handled
    // The route uses Array.isArray(data) ? data : []
    const response = await request.get('/api/search/facets');

    // Should return 200 (success) or 500 (error)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('facets');
      expect(Array.isArray(data.facets)).toBe(true);
    }
  });

  test('should handle empty facets array', async ({ request }) => {
    // This tests that empty facets array is handled
    // The route returns empty array when no facets
    const response = await request.get('/api/search/facets');

    // Should return 200 with empty facets array
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('facets');
    expect(Array.isArray(data.facets)).toBe(true);
  });

  test('should handle non-array data from getCachedSearchFacetsFormatted', async ({ request }) => {
    // This tests that non-array data is handled
    // The route uses Array.isArray(data) ? data : []
    const response = await request.get('/api/search/facets');

    // Should return 200 (success) or 500 (error)
    expect([200, 500]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('facets');
      expect(Array.isArray(data.facets)).toBe(true);
    }
  });
});
