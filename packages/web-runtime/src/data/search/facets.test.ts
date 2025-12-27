import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getSearchFacets, getPopularSearches, type SearchFacetAggregate } from './facets';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { GetSearchFacetsReturns } from '@heyclaude/database-types/postgres-types';
import type { GetTrendingSearchesReturns } from '@heyclaude/data-layer';

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock category validation to use real implementation via moduleNameMapper
// Don't mock - use real isValidCategory function

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
// Path: packages/web-runtime/src/data/search -> packages/data-layer/src/utils = ../../../../data-layer/src/utils
import {
  clearRequestCache,
  getRequestCache,
} from '../../../../data-layer/src/utils/request-cache.ts';

// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts

// Don't mock logger - use real implementation
// ERROR logs for validation failures are expected and correct behavior
// Don't mock normalizeError - use real implementation
// Don't mock createDataFunction - use real implementation with Prismocker

/**
 * Search Facets Data Functions Test Suite
 *
 * Tests getSearchFacets and getPopularSearches data functions → SearchService → database flow.
 * Uses Prismocker for in-memory database and getRequestCache() for cache verification.
 *
 * @group Search
 * @group DataFunctions
 * @group Integration
 */
describe('search/facets', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for getSearchFacets (uses RPC via callRpc)
    // getSearchFacets uses SearchService.getSearchFacets which uses callRpc('get_search_facets')
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);
  });

  describe('getSearchFacets', () => {
    it('should return search facets with transformed result', async () => {
      // getSearchFacets uses SearchService.getSearchFacets which uses callRpc('get_search_facets')
      // callRpc uses $queryRawUnsafe and expects array of rows
      const mockRpcResult: GetSearchFacetsReturns = [
        {
          category: 'agents',
          content_count: 10,
          authors: ['Author 1'],
          all_tags: ['tag1', 'tag2'],
          all_authors_aggregated: ['Author 1', 'Author 2'],
          all_categories_aggregated: ['agents', 'mcp'],
          all_tags_aggregated: ['tag1', 'tag2', 'tag3'],
        },
        {
          category: 'mcp',
          content_count: 5,
          authors: ['Author 3'],
          all_tags: ['tag4'],
          all_authors_aggregated: ['Author 1', 'Author 2', 'Author 3'],
          all_categories_aggregated: ['agents', 'mcp'],
          all_tags_aggregated: ['tag1', 'tag2', 'tag3', 'tag4'],
        },
      ];

      // Mock $queryRawUnsafe to return RPC result
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(
        mockRpcResult as any
      );

      const result = await getSearchFacets();

      expect(result).toHaveProperty('authors');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('facets');
      expect(result).toHaveProperty('tags');
      expect(Array.isArray(result.facets)).toBe(true);

      // Verify aggregated arrays (from first row's aggregated fields)
      // The code uses the first row's aggregated arrays, so expect the first row's aggregated values
      expect(result.authors).toEqual(['Author 1', 'Author 2']);
      expect(result.categories).toEqual(['agents', 'mcp']);
      expect(result.tags).toEqual(['tag1', 'tag2', 'tag3']);

      // Verify facets array (one per row)
      expect(result.facets).toHaveLength(2);
      expect(result.facets[0]).toHaveProperty('category', 'agents');
      expect(result.facets[0]).toHaveProperty('contentCount', 10);
      expect(result.facets[0]).toHaveProperty('authors', ['Author 1']);
      expect(result.facets[0]).toHaveProperty('tags', ['tag1', 'tag2']);
      expect(result.facets[1]).toHaveProperty('category', 'mcp');
      expect(result.facets[1]).toHaveProperty('contentCount', 5);
    });

    it('should handle empty results', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([]);

      const result = await getSearchFacets();

      expect(result).toEqual({
        authors: [],
        categories: [],
        facets: [],
        tags: [],
      });
    });

    it('should filter invalid categories', async () => {
      // Include invalid category that should be filtered out
      // callRpc returns arrays directly for 'search' functions that return arrays
      const mockRpcResult: GetSearchFacetsReturns = [
        {
          category: 'agents',
          content_count: 10,
          authors: ['Author 1'],
          all_tags: ['tag1'],
          all_authors_aggregated: ['Author 1'],
          all_categories_aggregated: ['agents', 'invalid_category' as any],
          all_tags_aggregated: ['tag1'],
        },
      ];

      // Mock $queryRawUnsafe - callRpc will return the array directly (doesn't unwrap arrays of objects)
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(
        mockRpcResult as any
      );

      const result = await getSearchFacets();

      // Should only include valid categories (invalid_category should be filtered by isValidCategory)
      expect(result.categories).toEqual(['agents']);
      expect(result.categories).not.toContain('invalid_category');
    });

    it('should filter non-string values from arrays', async () => {
      const mockRpcResult: GetSearchFacetsReturns = [
        {
          category: 'agents',
          content_count: 10,
          authors: ['Author 1', null as any, 123 as any],
          all_tags: ['tag1', null as any],
          all_authors_aggregated: ['Author 1', null as any, 123 as any],
          all_categories_aggregated: ['agents'],
          all_tags_aggregated: ['tag1', null as any],
        },
      ];

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(
        mockRpcResult as any
      );

      const result = await getSearchFacets();

      // Should filter out null and non-string values
      expect(result.facets[0].authors).toEqual(['Author 1']);
      expect(result.facets[0].tags).toEqual(['tag1']);
      expect(result.authors).toEqual(['Author 1']);
      expect(result.tags).toEqual(['tag1']);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockRpcResult: GetSearchFacetsReturns = [
        {
          category: 'agents',
          content_count: 10,
          authors: ['Author 1'],
          all_tags: ['tag1'],
          all_authors_aggregated: ['Author 1'],
          all_categories_aggregated: ['agents'],
          all_tags_aggregated: ['tag1'],
        },
      ];

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(
        mockRpcResult as any
      );

      const cache = getRequestCache();
      const cacheBefore = cache.getStats().size;

      // First call - should populate cache
      const result1 = await getSearchFacets();
      const cacheAfterFirst = cache.getStats().size;

      // Second call - should use cache
      const result2 = await getSearchFacets();
      const cacheAfterSecond = cache.getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);

      // Verify $queryRawUnsafe was only called once (cached on second call)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });
  });

  describe('getPopularSearches', () => {
    it('should return popular searches with transformed result', async () => {
      // getPopularSearches uses SearchService.getTrendingSearches which uses v_trending_searches view
      // Seed Prismocker with v_trending_searches data
      const mockTrendingSearches = [
        createTrendingSearch({
          search_query: 'test query',
          search_count: 100,
        }),
        createTrendingSearch({
          search_query: 'another query',
          search_count: 50,
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_trending_searches', mockTrendingSearches as any);
      }

      const result = await getPopularSearches(10);

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('query', 'test query');
      expect(result[0]).toHaveProperty('count', 100);
      expect(result[0]).toHaveProperty('label', '🔥 test query (100 searches)');
      expect(result[1]).toHaveProperty('query', 'another query');
      expect(result[1]).toHaveProperty('count', 50);
      expect(result[1]).toHaveProperty('label', '🔥 another query (50 searches)');
    });

    it('should respect limit parameter', async () => {
      const mockTrendingSearches = [
        createTrendingSearch({ search_query: 'query1', search_count: 100 }),
        createTrendingSearch({ search_query: 'query2', search_count: 90 }),
        createTrendingSearch({ search_query: 'query3', search_count: 80 }),
        createTrendingSearch({ search_query: 'query4', search_count: 70 }),
        createTrendingSearch({ search_query: 'query5', search_count: 60 }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_trending_searches', mockTrendingSearches as any);
      }

      // Request limit of 3
      const result = await getPopularSearches(3);

      expect(result).toHaveLength(3);
      expect(result[0].query).toBe('query1');
      expect(result[1].query).toBe('query2');
      expect(result[2].query).toBe('query3');
    });

    it('should handle empty results', async () => {
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_trending_searches', []);
      }

      const result = await getPopularSearches(10);

      expect(result).toEqual([]);
    });

    it('should order by search_count desc', async () => {
      const mockTrendingSearches = [
        createTrendingSearch({ search_query: 'low', search_count: 10 }),
        createTrendingSearch({ search_query: 'high', search_count: 100 }),
        createTrendingSearch({ search_query: 'medium', search_count: 50 }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_trending_searches', mockTrendingSearches as any);
      }

      const result = await getPopularSearches(10);

      // Should be ordered by search_count desc
      expect(result[0].count).toBe(100);
      expect(result[1].count).toBe(50);
      expect(result[2].count).toBe(10);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockTrendingSearches = [
        createTrendingSearch({ search_query: 'test query', search_count: 100 }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_trending_searches', mockTrendingSearches as any);
      }

      const cache = getRequestCache();
      const cacheBefore = cache.getStats().size;

      // First call - should populate cache
      const result1 = await getPopularSearches(10);
      const cacheAfterFirst = cache.getStats().size;

      // Second call - should use cache
      const result2 = await getPopularSearches(10);
      const cacheAfterSecond = cache.getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
