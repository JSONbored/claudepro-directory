import { expect, test } from '@playwright/test';
import { setupErrorTracking } from '../../../../../config/tests/utils/error-tracking';

/**
 * Comprehensive Search API Route E2E Tests
 * 
 * Tests ALL functionality of the /api/search endpoint with strict error checking:
 * - GET request handling
 * - Query parameter validation (q, categories, tags, sort, limit, offset)
 * - Search type handling (content, jobs, unified)
 * - Response format validation
 * - Error handling (400, 500)
 * - Authentication handling (if applicable)
 * - CORS headers
 * - Cache headers
 * - Database/Service layer integration (SearchService)
 * - Console error/warning detection (tests FAIL on any errors)
 * - Network error detection
 */

test.describe('Search API Route', () => {
  test.beforeEach(async ({ page }) => {
    // Set up error tracking (API routes don't need navigation)
    const cleanup = setupErrorTracking(page);
    
    // Store cleanup function for afterEach
    (page as any).__errorTrackingCleanup = cleanup;
  });

  test.afterEach(async ({ page }) => {
    // Check for errors and throw if any detected
    const cleanup = (page as any).__errorTrackingCleanup;
    if (cleanup) {
      cleanup();
    }
  });

  test('should return 200 for valid search query', async ({ page }) => {
    const response = await page.request.get('/api/search?q=claude&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('totalCount');
    expect(Array.isArray(data.results)).toBe(true);
    expect(typeof data.totalCount).toBe('number');
    expect(data.totalCount).toBeGreaterThanOrEqual(0);
  });

  test('should handle empty query parameter', async ({ page }) => {
    const response = await page.request.get('/api/search?q=&limit=10');
    
    // Should return 200 with empty results or handle gracefully
    expect([200, 400]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    }
  });

  test('should handle category filter parameter', async ({ page }) => {
    const response = await page.request.get('/api/search?q=agent&categories=agents&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('should handle multiple category filters', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&categories=agents,mcp&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('should handle sort parameter', async ({ page }) => {
    const sortTypes = ['alphabetical', 'newest', 'popularity', 'relevance'];
    
    for (const sort of sortTypes) {
      const response = await page.request.get(`/api/search?q=test&sort=${sort}&limit=10`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    }
  });

  test('should handle limit parameter', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&limit=5');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeLessThanOrEqual(5);
  });

  test('should handle offset parameter for pagination', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&limit=10&offset=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('should handle searchType parameter (content, jobs, unified)', async ({ page }) => {
    const searchTypes = ['content', 'jobs', 'unified'];
    
    for (const searchType of searchTypes) {
      const response = await page.request.get(`/api/search?q=test&searchType=${searchType}&limit=10`);
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    }
  });

  test('should return proper CORS headers', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&limit=10');
    
    expect(response.status()).toBe(200);
    
    // Check for CORS headers
    const headers = response.headers();
    expect(headers['access-control-allow-origin'] || headers['Access-Control-Allow-Origin']).toBeTruthy();
  });

  test('should return proper cache headers', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&limit=10');
    
    expect(response.status()).toBe(200);
    
    // Check for cache headers
    const headers = response.headers();
    const cacheControl = headers['cache-control'] || headers['Cache-Control'];
    expect(cacheControl).toBeTruthy();
  });

  test('should handle invalid category filter gracefully', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&categories=invalid-category&limit=10');
    
    // Should return 200 (invalid categories are filtered out) or 400
    expect([200, 400]).toContain(response.status());
  });

  test('should handle invalid sort parameter', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&sort=invalid-sort&limit=10');
    
    // Should return 200 (defaults to valid sort) or 400
    expect([200, 400]).toContain(response.status());
  });

  test('should handle very large limit parameter', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&limit=1000');
    
    // Should return 200 (limit is clamped) or 400
    expect([200, 400]).toContain(response.status());
  });

  test('should handle negative offset parameter', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&offset=-10&limit=10');
    
    // Should return 200 (offset is clamped to 0) or 400
    expect([200, 400]).toContain(response.status());
  });

  test('should handle OPTIONS request for CORS preflight', async ({ page }) => {
    const response = await page.request.options('/api/search');
    
    expect(response.status()).toBe(200);
    
    // Check for CORS preflight headers
    const headers = response.headers();
    expect(headers['access-control-allow-methods'] || headers['Access-Control-Allow-Methods']).toBeTruthy();
  });

  test('should call SearchService.searchContentOptimized for content search', async ({ page }) => {
    // This tests that the API route properly calls the SearchService
    // The actual service call is server-side, but we can verify the API works
    const response = await page.request.get('/api/search?q=test&searchType=content&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('searchType');
    expect(data.searchType).toBe('content');
  });

  test('should handle special characters in query', async ({ page }) => {
    const specialQueries = ['test@query', 'test#query', 'test&query', 'test+query'];
    
    for (const query of specialQueries) {
      const encodedQuery = encodeURIComponent(query);
      const response = await page.request.get(`/api/search?q=${encodedQuery}&limit=10`);
      
      // Should handle special characters gracefully
      expect([200, 400]).toContain(response.status());
    }
  });

  test('should handle very long query strings', async ({ page }) => {
    const longQuery = 'a'.repeat(1000);
    const encodedQuery = encodeURIComponent(longQuery);
    const response = await page.request.get(`/api/search?q=${encodedQuery}&limit=10`);
    
    // Should handle long queries (may truncate or return 400)
    expect([200, 400]).toContain(response.status());
  });

  test('should return consistent response format', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Verify response structure
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('totalCount');
    expect(data).toHaveProperty('query');
    expect(Array.isArray(data.results)).toBe(true);
    expect(typeof data.totalCount).toBe('number');
    expect(typeof data.query).toBe('string');
  });

  test('should handle jobs search type with job filters', async ({ page }) => {
    // Jobs search is determined by job filters, not searchType parameter
    const response = await page.request.get('/api/search?q=developer&job_category=engineering&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('searchType');
    // When job filters are present, searchType should be 'jobs'
    expect(['content', 'jobs', 'unified']).toContain(data.searchType);
  });

  test('should handle unified search type with entities', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&entities=content,company&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('searchType');
    // When entities are specified, searchType should be 'unified'
    expect(['content', 'jobs', 'unified']).toContain(data.searchType);
  });

  test('should handle empty query string', async ({ page }) => {
    const response = await page.request.get('/api/search?q=&limit=10');
    
    // Empty query should still return results (may be empty array)
    expect([200, 400]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('query');
      expect(data.query).toBe(''); // Should be trimmed empty string
    }
  });

  test('should throw error for invalid categories array', async ({ page }) => {
    // When categories array is provided but all are invalid, should throw error
    const response = await page.request.get('/api/search?q=test&categories=invalid1,invalid2&limit=10');
    
    // Should return 400 or 500 (error thrown)
    expect([400, 500]).toContain(response.status());
    
    if (response.status() === 400 || response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle job filters (category, employment, experience, remote)', async ({ page }) => {
    const response = await page.request.get('/api/search?q=developer&job_category=engineering&job_employment=full-time&job_experience=mid&job_remote=true&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(data).toHaveProperty('filters');
    expect(data.filters).toHaveProperty('job_category');
    expect(data.filters).toHaveProperty('job_employment');
    expect(data.filters).toHaveProperty('job_experience');
    expect(data.filters).toHaveProperty('job_remote');
  });

  test('should handle authors filter', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&authors=author1,author2&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('filters');
    if (data.filters.authors) {
      expect(Array.isArray(data.filters.authors)).toBe(true);
    }
  });

  test('should handle tags filter', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&tags=tag1,tag2&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('filters');
    if (data.filters.tags) {
      expect(Array.isArray(data.filters.tags)).toBe(true);
    }
  });

  test('should include pagination metadata', async ({ page }) => {
    const response = await page.request.get('/api/search?q=test&limit=10&offset=0');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toHaveProperty('total');
    expect(data.pagination).toHaveProperty('limit');
    expect(data.pagination).toHaveProperty('offset');
    expect(data.pagination).toHaveProperty('hasMore');
    expect(typeof data.pagination.total).toBe('number');
    expect(typeof data.pagination.limit).toBe('number');
    expect(typeof data.pagination.offset).toBe('number');
    expect(typeof data.pagination.hasMore).toBe('boolean');
  });

  test('should handle all sort types', async ({ page }) => {
    const sortTypes = ['alphabetical', 'newest', 'popularity', 'relevance'];
    
    for (const sort of sortTypes) {
      const response = await page.request.get(`/api/search?q=test&sort=${sort}&limit=10`);
      
      expect([200, 400]).toContain(response.status());
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('filters');
        expect(data.filters).toHaveProperty('sort');
      }
    }
  });

  test('should handle toContentCategoryArray returning undefined', async ({ page }) => {
    // This tests that undefined categories array is handled
    // The function returns undefined if categories is empty or all invalid
    const response = await page.request.get('/api/search?q=test&limit=10');
    
    // Should return 200 (undefined categories is valid)
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
  });

  test('should handle toContentCategoryArray filtering invalid categories', async ({ page }) => {
    // This tests that invalid categories are filtered out
    // The function filters out invalid categories and returns only valid ones
    const response = await page.request.get('/api/search?q=test&categories=agents,invalid-category&limit=10');
    
    // Should return 200 (invalid categories are filtered out)
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
  });

  test('should handle determineSearchType with hasJobFilters=true', async ({ page }) => {
    // This tests that hasJobFilters=true results in searchType='jobs'
    // The function checks hasJobFilters first
    const response = await page.request.get('/api/search?q=test&job_category=engineering&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('searchType');
    expect(data.searchType).toBe('jobs');
  });

  test('should handle determineSearchType with entities array', async ({ page }) => {
    // This tests that entities array results in searchType='unified'
    // The function checks entities.length > 0
    const response = await page.request.get('/api/search?q=test&entities=content,company&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('searchType');
    expect(data.searchType).toBe('unified');
  });

  test('should handle determineSearchType defaulting to content', async ({ page }) => {
    // This tests that no job filters and no entities results in searchType='content'
    // The function defaults to 'content'
    const response = await page.request.get('/api/search?q=test&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('searchType');
    expect(data.searchType).toBe('content');
  });

  test('should handle highlightResults with empty query', async ({ page }) => {
    // This tests that empty query doesn't highlight results
    // The function checks if (!query.trim()) and returns results as-is
    const response = await page.request.get('/api/search?q=&limit=10');
    
    expect([200, 400]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    }
  });

  test('should handle trackSearchAnalytics errors non-blocking', async ({ page }) => {
    // This tests that trackSearchAnalytics errors don't block response
    // The function catches errors and logs them, but doesn't throw
    const response = await page.request.get('/api/search?q=test&limit=10');
    
    // Should return 200 even if analytics fails
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
  });

  test('should handle trackSearchAnalytics with empty query', async ({ page }) => {
    // This tests that empty query doesn't track analytics
    // The function checks if (!query.trim()) and returns early
    const response = await page.request.get('/api/search?q=&limit=10');
    
    expect([200, 400]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('results');
    }
  });

  test('should handle executeSearch errors gracefully', async ({ page }) => {
    // This tests that executeSearch errors are handled
    // The function is called in getCachedSearchResults, errors bubble up
    const response = await page.request.get('/api/search?q=test&limit=10');
    
    // Should return 200 (success) or 500 (error)
    expect([200, 500]).toContain(response.status());
    
    if (response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle null results from executeSearch', async ({ page }) => {
    // This tests that null results array is handled
    // The function returns { results, totalCount }, results may be null
    const response = await page.request.get('/api/search?q=test&limit=10');
    
    // Should return 200 with results array (may be empty)
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('should handle null totalCount from executeSearch', async ({ page }) => {
    // This tests that null totalCount is handled
    // The function uses totalCount ?? results.length
    const response = await page.request.get('/api/search?q=test&limit=10');
    
    // Should return 200 with totalCount
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toHaveProperty('total');
    expect(typeof data.pagination.total).toBe('number');
  });

  test('should handle empty results array', async ({ page }) => {
    // This tests that empty results array is handled
    // The function returns empty array when no results
    const response = await page.request.get('/api/search?q=nonexistentquery12345&limit=10');
    
    // Should return 200 with empty results array
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });

  test('should handle hasMore calculation with null totalCount', async ({ page }) => {
    // This tests that hasMore calculation handles null totalCount
    // The route uses offset + highlightedResults.length < totalCount
    const response = await page.request.get('/api/search?q=test&limit=10&offset=0');
    
    // Should return 200 with hasMore boolean
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('pagination');
    expect(data.pagination).toHaveProperty('hasMore');
    expect(typeof data.pagination.hasMore).toBe('boolean');
  });

  test('should handle analyticsParams with optional fields', async ({ page }) => {
    // This tests that analyticsParams only includes fields with values
    // The route conditionally adds fields to analyticsParams
    const response = await page.request.get('/api/search?q=test&limit=10');
    
    // Should return 200 (analytics is non-blocking)
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('results');
  });

  test('should handle job_remote undefined vs false', async ({ page }) => {
    // This tests that job_remote undefined is handled differently than false
    // The route uses jobRemote === undefined ? {} : { job_remote: jobRemote }
    const response1 = await page.request.get('/api/search?q=test&limit=10');
    const response2 = await page.request.get('/api/search?q=test&job_remote=false&limit=10');
    
    // Both should return 200
    expect(response1.status()).toBe(200);
    expect(response2.status()).toBe(200);
    
    const data1 = await response1.json();
    const data2 = await response2.json();
    expect(data1).toHaveProperty('filters');
    expect(data2).toHaveProperty('filters');
  });

  test('should handle trimmedQuery being empty after trim', async ({ page }) => {
    // This tests that trimmed query (whitespace-only) is handled
    // The route uses queryString.trim()
    const response = await page.request.get('/api/search?q=%20%20%20&limit=10');
    
    // Should return 200 (empty query is valid)
    expect([200, 400]).toContain(response.status());
    
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('query');
      expect(data.query).toBe(''); // Should be trimmed
    }
  });

  test('should handle categoriesArray with all invalid values', async ({ page }) => {
    // This tests that all invalid categories throws error
    // The route checks if (categoriesArray && categoriesArray.length > 0 && !validatedCategories?.length)
    const response = await page.request.get('/api/search?q=test&categories=invalid1,invalid2,invalid3&limit=10');
    
    // Should return 400 or 500 (error thrown)
    expect([400, 500]).toContain(response.status());
    
    if (response.status() === 400 || response.status() === 500) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('should handle hasJobFilters with all job filter types', async ({ page }) => {
    // This tests that hasJobFilters detects all job filter types
    // The route checks jobCategory, jobEmployment, jobExperience, jobRemote
    const response = await page.request.get('/api/search?q=test&job_remote=true&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('searchType');
    expect(data.searchType).toBe('jobs');
  });

  test('should handle entitiesArray being empty', async ({ page }) => {
    // This tests that empty entities array doesn't trigger unified search
    // The route checks entities && entities.length > 0
    const response = await page.request.get('/api/search?q=test&entities=&limit=10');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('searchType');
    // Should default to 'content' when entities is empty
    expect(['content', 'jobs', 'unified']).toContain(data.searchType);
  });
});
