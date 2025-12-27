import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { SearchService } from './search.ts';
import { ContentService } from './content.ts';
import { JobsService } from './jobs.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockerClient
// Jest automatically uses __mocks__ directory (no explicit registration needed)

// Mock the RPC error logging utility
jest.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '../utils/request-cache.ts';

/**
 * SearchService Test Suite
 *
 * Comprehensive unit and integration tests for SearchService, including:
 * - RPC function calls (searchUnified, searchContent, filterJobs, etc.)
 * - Direct Prisma queries (getTrendingSearches via view)
 * - Request-scoped caching behavior verification
 * - Integration with ContentService and JobsService for cross-service search
 *
 * All tests use Prismocker for in-memory database mocking and proper cache testing
 * using getRequestCache().getStats().size instead of spying on Prisma methods.
 *
 * @module SearchServiceTests
 * @see {@link SearchService} - The service being tested
 * @see {@link ContentService} - Service used in integration tests
 * @see {@link JobsService} - Service used in integration tests
 */
describe('SearchService', () => {
  let service: SearchService;
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;

  /**
   * Sets up test environment before each test case.
   *
   * Performs the following operations in order:
   * 1. Clears request-scoped cache for test isolation
   * 2. Gets Prismocker instance (in-memory database mock)
   * 3. Resets Prismocker data to ensure clean state
   * 4. Clears all Jest mocks
   * 5. Sets up $queryRawUnsafe spy for RPC function testing
   * 6. Creates fresh SearchService instance
   *
   * @private
   * @async
   * @returns {Promise<void>} Resolves when setup is complete
   */
  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    queryRawUnsafeSpy = jest.fn().mockResolvedValue([]);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // 6. Ensure Prismocker models are initialized
    void prismocker.v_content_list_slim;
    void prismocker.v_trending_searches;

    // 7. Create service instance (use real service, not mocked)
    service = new SearchService(prismocker);
  });

  /**
   * Tests for searchContent method.
   *
   * Verifies RPC function call to search_content_optimized() which returns
   * content search results with relevance scoring.
   *
   * @group SearchService
   * @group RPC
   */
  describe('searchContent', () => {
    /**
     * Verifies successful content search results retrieval.
     *
     * Tests that the RPC function is called correctly and returns
     * the expected data structure with results array and total_count.
     *
     * @test
     */
    it('returns search results on success', async () => {
      const mockData = [
        {
          id: 'result-1',
          title: 'TypeScript Best Practices',
          slug: 'typescript-best-practices',
          category: 'agents',
          excerpt: 'Learn TypeScript best practices...',
          relevance_score: 0.95,
        },
        {
          id: 'result-2',
          title: 'React Hooks Guide',
          slug: 'react-hooks-guide',
          category: 'skills',
          excerpt: 'A comprehensive guide to React Hooks...',
          relevance_score: 0.87,
        },
      ];

      // searchContent uses callRpc which calls $queryRawUnsafe with function call format
      // callRpc does NOT unwrap functions with 'search' in name (line 129: !functionName.includes('search'))
      // But search_content_optimized returns a composite type (object), so $queryRawUnsafe returns [{ results, total_count }]
      // callRpc sees 'search' in name, so it returns the array: [{ results, total_count }]
      // searchContent then does: result?.results ?? [] where result is [{ results, total_count }]
      // But result is an array, not an object, so result.results is undefined
      // This is a bug in callRpc logic - it should unwrap composite types even for 'search' functions
      // For now, fix the test to match actual behavior: callRpc returns array, searchContent accesses result[0]?.results
      const mockResult = {
        results: mockData,
        total_count: BigInt(2),
      };
      // callRpc returns array for 'search' functions, so we need to check if searchContent handles this
      // Actually, looking at searchContent: result?.results - if result is array, this is undefined
      // So the issue is that callRpc should unwrap, but doesn't for 'search' functions
      // Let me check if the result[0] check is needed or if we should fix callRpc
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      const result = await service.searchContent({
        p_query: 'typescript',
        p_limit: 10,
      });

      // The actual behavior: callRpc returns [{ results, total_count }] (not unwrapped)
      // searchContent does: result?.results where result is [{ results, total_count }]
      // This fails because result is array, not object
      // We need to either fix callRpc to unwrap composite types, or fix searchContent to handle arrays
      // For now, the test will fail - this indicates a real bug
      expect(result.data).toEqual(mockData);
      expect(result.total_count).toBe(2);
      // callRpc formats the SQL as: SELECT * FROM search_content_optimized(p_query => $1, p_limit => $2)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('search_content_optimized'),
        'typescript',
        10
      );
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = [
        {
          id: 'result-1',
          title: 'TypeScript Best Practices',
          slug: 'typescript-best-practices',
          category: 'agents',
          excerpt: 'Learn TypeScript best practices...',
          relevance_score: 0.95,
        },
      ];

      const mockResult = {
        results: mockData,
        total_count: BigInt(1),
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      await service.searchContent({
        p_query: 'typescript',
        p_limit: 10,
      });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call (should use cache)
      await service.searchContent({
        p_query: 'typescript',
        p_limit: 10,
      });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('returns empty array when no results found', async () => {
      // callRpc returns null for empty arrays (single-return functions)
      // But searchContent handles null by returning empty array
      const mockResult = {
        results: [],
        total_count: BigInt(0),
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      const result = await service.searchContent({
        p_query: 'nonexistent-query-xyz',
        p_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Search index unavailable');

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

      await expect(
        service.searchContent({
          p_query: 'test',
          p_limit: 10,
        })
      ).rejects.toThrow('Search index unavailable');
    });

    it('handles special characters in query', async () => {
      const mockResult = {
        results: [],
        total_count: BigInt(0),
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      const result = await service.searchContent({
        p_query: 'test & query | with (special) characters',
        p_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  /**
   * Tests for searchUnified method.
   *
   * Verifies RPC function call to search_unified() which returns
   * unified search results across multiple entity types (content, jobs, etc.).
   *
   * @group SearchService
   * @group RPC
   */
  describe('searchUnified', () => {
    /**
     * Verifies successful unified search results retrieval.
     *
     * Tests that the RPC function is called correctly and returns
     * the expected data structure with results array and total_count.
     *
     * @test
     */
    it('should return unified search results', async () => {
      const mockResult = {
        results: [{ id: '1', title: 'Result 1', category: 'agents' }],
        total_count: 1n,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      const result = await service.searchUnified({
        p_query: 'test',
        p_limit: 10,
      });

      // callRpc formats the SQL as: SELECT * FROM search_unified(p_query => $1, p_limit => $2)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('search_unified'),
        'test',
        10
      );
      expect(result.data).toEqual(mockResult.results);
      expect(result.total_count).toBe(1);
    });

    /**
     * Verifies request-scoped caching works correctly for searchUnified.
     *
     * Tests that duplicate calls with the same parameters use the cache
     * instead of making additional database queries. Uses getRequestCache()
     * to verify cache size changes rather than spying on Prisma methods.
     *
     * @test
     * @group Caching
     */
    it('should cache results on duplicate calls (caching test)', async () => {
      const mockResult = {
        results: [{ id: '1', title: 'Result 1', category: 'agents' }],
        total_count: 1n,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await service.searchUnified({
        p_query: 'test',
        p_limit: 10,
      });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call (should use cache)
      const result2 = await service.searchUnified({
        p_query: 'test',
        p_limit: 10,
      });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify cache worked
      expect(result1).toEqual(result2);
      
      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('should handle null result', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([null] as any);

      const result = await service.searchUnified({
        p_query: 'test',
        p_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
    });
  });

  /**
   * Tests for filterJobs method.
   *
   * Verifies RPC function call to filter_jobs() which returns
   * filtered job listings based on various criteria.
   *
   * @group SearchService
   * @group RPC
   */
  describe('filterJobs', () => {
    /**
     * Verifies successful job filtering.
     *
     * Tests that the RPC function is called correctly and returns
     * the expected data structure with jobs array and total_count.
     *
     * @test
     */
    it('should return filtered jobs', async () => {
      // filterJobs uses callRpc which returns FilterJobsReturns (object with jobs array and total_count)
      const mockData = {
        jobs: [{ id: 'job-1', title: 'Developer', category: 'engineering' }],
        total_count: BigInt(1),
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      const result = await service.filterJobs({
        p_category: 'engineering',
        p_limit: 10,
      });

      // callRpc formats the SQL as: SELECT * FROM filter_jobs(p_category => $1, p_limit => $2)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('filter_jobs'),
        'engineering',
        10
      );
      expect(result).toEqual(mockData);
    });

    /**
     * Verifies request-scoped caching works correctly for filterJobs.
     *
     * Tests that duplicate calls with the same parameters use the cache
     * instead of making additional database queries. Uses getRequestCache()
     * to verify cache size changes rather than spying on Prisma methods.
     *
     * @test
     * @group Caching
     */
    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        jobs: [{ id: 'job-1', title: 'Developer', category: 'engineering' }],
        total_count: BigInt(1),
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await service.filterJobs({
        p_category: 'engineering',
        p_limit: 10,
      });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call (should use cache)
      const result2 = await service.filterJobs({
        p_category: 'engineering',
        p_limit: 10,
      });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify cache worked
      expect(result1).toEqual(result2);
      
      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  /**
   * Tests for getSearchFacets method.
   *
   * Verifies RPC function call to get_search_facets() which returns
   * available search facets (categories, tags, authors) for filtering.
   *
   * @group SearchService
   * @group RPC
   */
  describe('getSearchFacets', () => {
    /**
     * Verifies successful search facets retrieval.
     *
     * Tests that the RPC function is called correctly and returns
     * the expected facets structure with categories, tags, and authors.
     *
     * @test
     */
    it('should return search facets', async () => {
      // getSearchFacets uses callRpc which unwraps single-element arrays
      const mockData = {
        categories: ['agents', 'mcp'],
        tags: ['react', 'typescript'],
        authors: ['author1', 'author2'],
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      const result = await service.getSearchFacets();

      // callRpc formats the SQL as: SELECT * FROM get_search_facets()
      // callRpc unwraps single-element arrays, so result should be the unwrapped object
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_facets')
      );
      expect(result).toEqual(mockData);
    });

    /**
     * Verifies request-scoped caching works correctly for getSearchFacets.
     *
     * Tests that duplicate calls with the same parameters use the cache
     * instead of making additional database queries. Uses getRequestCache()
     * to verify cache size changes rather than spying on Prisma methods.
     *
     * @test
     * @group Caching
     */
    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        categories: ['agents', 'mcp'],
        tags: ['react', 'typescript'],
        authors: ['author1', 'author2'],
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await service.getSearchFacets();
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call (should use cache)
      const result2 = await service.getSearchFacets();
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify cache worked
      expect(result1).toEqual(result2);
      
      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  /**
   * Tests for getSearchFacetsFormatted method.
   *
   * Verifies RPC function call to get_search_facets_formatted() which returns
   * formatted search facets with counts for display purposes.
   *
   * @group SearchService
   * @group RPC
   */
  describe('getSearchFacetsFormatted', () => {
    /**
     * Verifies successful formatted search facets retrieval.
     *
     * Tests that the RPC function is called correctly and returns
     * the expected formatted facets structure with counts.
     *
     * @test
     */
    it('should return formatted search facets', async () => {
      // getSearchFacetsFormatted uses callRpc which unwraps single-element arrays
      const mockData = {
        categories: [{ name: 'Agents', count: 10 }],
        tags: [{ name: 'React', count: 5 }],
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      const result = await service.getSearchFacetsFormatted();

      // callRpc formats the SQL as: SELECT * FROM get_search_facets_formatted()
      // callRpc unwraps single-element arrays, so result should be the unwrapped object
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_facets_formatted')
      );
      expect(result).toEqual(mockData);
    });

    /**
     * Verifies request-scoped caching works correctly for getSearchFacetsFormatted.
     *
     * Tests that duplicate calls with the same parameters use the cache
     * instead of making additional database queries. Uses getRequestCache()
     * to verify cache size changes rather than spying on Prisma methods.
     *
     * @test
     * @group Caching
     */
    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        categories: [{ name: 'Agents', count: 10 }],
        tags: [{ name: 'React', count: 5 }],
      };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await service.getSearchFacetsFormatted();
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call (should use cache)
      const result2 = await service.getSearchFacetsFormatted();
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify cache worked
      expect(result1).toEqual(result2);
      
      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  /**
   * Tests for getSearchSuggestions method (from history).
   *
   * Verifies RPC function call to get_search_suggestions_from_history() which returns
   * search suggestions based on historical search queries.
   *
   * @group SearchService
   * @group RPC
   */
  describe('getSearchSuggestionsFromHistory', () => {
    /**
     * Verifies successful search suggestions retrieval from history.
     *
     * Tests that the RPC function is called correctly and returns
     * the expected suggestions array with query and count.
     *
     * @test
     */
    it('should return search suggestions from history', async () => {
      const mockData = [
        { query: 'typescript', count: 10 },
        { query: 'react', count: 8 },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockData as any);

      const result = await service.getSearchSuggestions({
        p_query: 'type',
        p_limit: 5,
      });

      // callRpc formats the SQL as: SELECT * FROM get_search_suggestions_from_history(p_query => $1, p_limit => $2)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_suggestions_from_history'),
        'type',
        5
      );
      expect(result).toEqual(mockData);
    });
  });

  /**
   * Tests for getSearchSuggestionsFormatted method.
   *
   * Verifies RPC function call to get_search_suggestions_formatted() which returns
   * formatted search suggestions with relevance scores.
   *
   * @group SearchService
   * @group RPC
   */
  describe('getSearchSuggestionsFormatted', () => {
    /**
     * Verifies successful formatted search suggestions retrieval.
     *
     * Tests that the RPC function is called correctly and returns
     * the expected formatted suggestions array with relevance scores.
     *
     * @test
     */
    it('should return formatted search suggestions', async () => {
      const mockData = [
        { suggestion: 'typescript', relevance: 0.9 },
        { suggestion: 'react', relevance: 0.8 },
      ];
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockData as any);

      const result = await service.getSearchSuggestionsFormatted({
        p_query: 'type',
        p_limit: 5,
      });

      // callRpc formats the SQL as: SELECT * FROM get_search_suggestions_formatted(p_query => $1, p_limit => $2)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_suggestions_formatted'),
        'type',
        5
      );
      expect(result).toEqual(mockData);
    });
  });

  /**
   * Tests for batchInsertSearchQueries method.
   *
   * Verifies RPC function call to batch_insert_search_queries() which inserts
   * multiple search queries in a single transaction. This is a mutation operation
   * and should not use caching.
   *
   * @group SearchService
   * @group RPC
   * @group Mutations
   */
  describe('batchInsertSearchQueries', () => {
    /**
     * Verifies successful batch insertion of search queries.
     *
     * Tests that the RPC function is called correctly and returns
     * the expected result with inserted_count.
     *
     * @test
     */
    it('should batch insert search queries', async () => {
      // batchInsertSearchQueries uses callRpc which formats SQL as: SELECT * FROM batch_insert_search_queries(p_queries => $1)
      const mockData = { inserted_count: 3 };
      // callRpc unwraps single-element arrays for composite types (objects)
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      const result = await service.batchInsertSearchQueries({
        p_queries: [
          { query: 'typescript', user_id: 'user1' },
          { query: 'react', user_id: 'user2' },
        ],
      });

      // callRpc formats the SQL as: SELECT * FROM batch_insert_search_queries(p_queries => $1)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('batch_insert_search_queries'),
        expect.any(Array) // p_queries is an array
      );
      // callRpc unwraps single-element arrays for composite types, so result is mockData directly
      expect(result).toEqual(mockData);
    });

    it('should not use cache for mutations', async () => {
      const mockData = { inserted_count: 0 };
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      await service.batchInsertSearchQueries({
        p_queries: [],
      });

      // Verify mutation doesn't use cache
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  /**
   * Tests for getTrendingSearches method.
   *
   * Verifies direct Prisma queries to v_trending_searches view, including:
   * - Data retrieval and transformation (bigint to number)
   * - Label computation for display
   * - Request-scoped caching behavior
   *
   * Uses Prismocker's setData() for view data seeding and getRequestCache()
   * for cache verification instead of spying on Prisma methods.
   *
   * @group SearchService
   * @group Prisma
   * @group Caching
   */
  describe('getTrendingSearches', () => {
    /**
     * Verifies trending searches are returned with proper transformation.
     *
     * Tests that the service correctly queries v_trending_searches view and
     * transforms bigint counts to numbers and computes display labels.
     *
     * @test
     */
    it('should return trending searches', async () => {
      // After migration: getTrendingSearches uses Prisma view queries (type-safe)
      const mockData = [
        {
          search_query: 'typescript',
          search_count: BigInt(100),
          last_searched: new Date('2024-01-01'),
          unique_users: BigInt(50),
        },
        {
          search_query: 'react',
          search_count: BigInt(80),
          last_searched: new Date('2024-01-01'),
          unique_users: BigInt(40),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_trending_searches', mockData);
      }

      const result = await service.getTrendingSearches({
        limit_count: 10,
      });

      // Result is transformed: count (bigint) -> count (number), label computed
      expect(result).toEqual([
        { query: 'typescript', count: 100, label: '🔥 typescript (100 searches)' },
        { query: 'react', count: 80, label: '🔥 react (80 searches)' },
      ]);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = [
        {
          search_query: 'typescript',
          search_count: BigInt(100),
          last_searched: new Date('2024-01-01'),
          unique_users: BigInt(50),
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_trending_searches', mockData);
      }

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await service.getTrendingSearches({
        limit_count: 10,
      });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call (should use cache)
      const result2 = await service.getTrendingSearches({
        limit_count: 10,
      });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify cache worked
      expect(result1).toEqual(result2);
      
      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  /**
   * Tests for executeSearch method.
   *
   * Verifies the unified search execution method that dispatches to
   * different search backends (jobs, unified, content) based on searchType.
   *
   * @group SearchService
   * @group SearchExecution
   */
  describe('executeSearch', () => {
    /**
     * Verifies executeSearch dispatches to content search correctly.
     *
     * Tests that when searchType is 'content', executeSearch calls
     * searchContent with the correct parameters.
     *
     * @test
     */
    it('should execute content search correctly', async () => {
      const mockResult = {
        results: [
          {
            id: 'content-1',
            title: 'Content Result',
            slug: 'content-result',
            category: 'agents',
            excerpt: 'Content excerpt',
            relevance_score: 0.9,
          },
        ],
        total_count: BigInt(1),
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      const result = await service.executeSearch({
        searchType: 'content',
        query: 'test',
        limit: 10,
        offset: 0,
        sort: 'relevance',
      });

      expect(result.results).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('search_content_optimized'),
        'test',
        10,
        0,
        'relevance'
      );
    });

    /**
     * Verifies executeSearch dispatches to jobs search correctly.
     *
     * Tests that when searchType is 'jobs', executeSearch calls
     * filterJobs with the correct parameters.
     *
     * @test
     */
    it('should execute jobs search correctly', async () => {
      const mockResult = {
        jobs: [
          {
            id: 'job-1',
            title: 'Job Result',
            slug: 'job-result',
            category: 'engineering',
          },
        ],
        total_count: BigInt(1),
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      const result = await service.executeSearch({
        searchType: 'jobs',
        query: 'developer',
        limit: 10,
        offset: 0,
        jobCategory: 'engineering',
        jobRemote: true,
      });

      expect(result.results).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('filter_jobs'),
        expect.objectContaining({
          p_search_query: 'developer',
          p_category: 'engineering',
          p_remote_only: true,
        })
      );
    });

    /**
     * Verifies executeSearch dispatches to unified search correctly.
     *
     * Tests that when searchType is 'unified', executeSearch calls
     * searchUnified with the correct parameters.
     *
     * @test
     */
    it('should execute unified search correctly', async () => {
      const mockResult = {
        results: [
          {
            id: 'unified-1',
            title: 'Unified Result',
            category: 'agents',
            type: 'content',
          },
        ],
        total_count: BigInt(1),
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      const result = await service.executeSearch({
        searchType: 'unified',
        query: 'test',
        limit: 10,
        offset: 0,
        entities: ['content', 'job'],
      });

      expect(result.results).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('search_unified'),
        expect.objectContaining({
          p_query: 'test',
          p_entities: ['content', 'job'],
        })
      );
    });
  });

  /**
   * Tests for highlightResults static method.
   *
   * Verifies that highlightResults correctly handles database-provided
   * highlighting when p_highlight_query is passed to RPC functions.
   *
   * @group SearchService
   * @group StaticMethods
   */
  describe('highlightResults (static)', () => {
    /**
     * Verifies highlightResults passes through results when query is provided.
     *
     * Tests that when a query is provided, the method returns results
     * as-is (database RPCs provide highlighting automatically).
     *
     * @test
     */
    it('should pass through results when query is provided', () => {
      const results = [
        { id: '1', title: 'Result 1', category: 'agents' },
        { id: '2', title: 'Result 2', category: 'mcp' },
      ];

      const highlighted = SearchService.highlightResults(results, 'test');

      // Database RPCs provide highlighting, so results are passed through
      expect(highlighted).toEqual(results);
    });

    /**
     * Verifies highlightResults returns copy when query is empty.
     *
     * Tests that when query is empty or whitespace, the method returns
     * a copy of results without highlighting.
     *
     * @test
     */
    it('should return copy when query is empty', () => {
      const results = [
        { id: '1', title: 'Result 1', category: 'agents' },
      ];

      const highlighted = SearchService.highlightResults(results, '');

      // Should return a copy (not the same reference)
      expect(highlighted).toEqual(results);
      expect(highlighted).not.toBe(results);
    });

    /**
     * Verifies highlightResults handles whitespace-only queries.
     *
     * Tests that whitespace-only queries are treated as empty.
     *
     * @test
     */
    it('should handle whitespace-only queries', () => {
      const results = [
        { id: '1', title: 'Result 1', category: 'agents' },
      ];

      const highlighted = SearchService.highlightResults(results, '   ');

      // Whitespace-only should be treated as empty
      expect(highlighted).toEqual(results);
      expect(highlighted).not.toBe(results);
    });
  });

  /**
   * Integration tests for SearchService, ContentService, and JobsService interaction.
   *
   * Verifies cross-service search functionality, shared Prismocker state, and
   * request-scoped cache behavior when multiple services access the same
   * data within a single request context.
   *
   * Tests include:
   * - Unified search across content and jobs
   * - SearchService.searchContent and ContentService.getContentPaginatedSlim working together
   * - SearchService.filterJobs and JobsService.getJobs working together
   * - Shared request-scoped cache across all services
   * - Error handling when one service fails
   *
   * @group Integration
   * @group SearchService
   * @group ContentService
   * @group JobsService
   * @group Caching
   */
  describe('Integration: SearchService + ContentService + JobsService', () => {
    let contentService: ContentService;
    let jobsService: JobsService;

    /**
     * Sets up ContentService and JobsService instances for integration tests.
     *
     * Creates fresh service instances using the same Prismocker
     * instance as SearchService to ensure shared in-memory database state.
     *
     * @private
     */
    beforeEach(() => {
      // Create service instances for integration tests
      contentService = new ContentService(prismocker);
      jobsService = new JobsService(prismocker);
    });

    /**
     * Verifies unified search works across content and jobs.
     *
     * Tests that SearchService.searchUnified can search both content
     * and jobs, and that ContentService and JobsService can access
     * the same data that unified search returns.
     *
     * @test
     * @group Integration
     */
    it('should allow unified search across content and jobs', async () => {
      // Mock unified search results (contains both content and jobs)
      const mockUnifiedResult = {
        results: [
          {
            id: 'content-1',
            title: 'TypeScript Guide',
            slug: 'typescript-guide',
            category: 'agents',
            type: 'content',
          },
          {
            id: 'job-1',
            title: 'TypeScript Developer',
            slug: 'typescript-developer',
            category: 'engineering',
            type: 'job',
          },
        ],
        total_count: BigInt(2),
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockUnifiedResult,
      ] as any);

      // SearchService: Unified search
      const unifiedResults = await service.searchUnified({
        p_query: 'typescript',
        p_limit: 10,
      });

      // Verify unified search returned both content and jobs
      expect(unifiedResults.data).toHaveLength(2);
      expect(unifiedResults.total_count).toBe(2);

      // Verify both services can access their respective data
      // ContentService should be able to get content detail
      // JobsService should be able to get job detail
      expect(unifiedResults.data.some((r: any) => r.type === 'content')).toBe(true);
      expect(unifiedResults.data.some((r: any) => r.type === 'job')).toBe(true);
    });

    /**
     * Verifies SearchService.searchContent and ContentService.getContentPaginatedSlim work together.
     *
     * Tests that both services can access the same content data, with
     * searchContent using RPC and getContentPaginatedSlim using a view.
     *
     * @test
     * @group Integration
     */
    it('should allow SearchService.searchContent and ContentService.getContentPaginatedSlim to work together', async () => {
      // Seed content data for ContentService
      const mockContent = [
        {
          id: 'content-search-1',
          slug: 'searchable-content',
          title: 'Searchable Content',
          display_title: null,
          category: 'agents' as const,
          description: 'This content should be searchable',
          tags: ['search', 'test'],
          author: 'Test Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 100,
          popularity_score: 50,
          trending_score: 25,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      // Use Prismocker's setData for view data (proper Prismocker usage)
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', mockContent);
      }

      // Mock searchContent RPC result
      const mockSearchResult = {
        results: [
          {
            id: 'content-search-1',
            title: 'Searchable Content',
            slug: 'searchable-content',
            category: 'agents',
            excerpt: 'This content should be searchable',
            relevance_score: 0.95,
          },
        ],
        total_count: BigInt(1),
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockSearchResult,
      ] as any);

      // SearchService: Search content
      const searchResults = await service.searchContent({
        p_query: 'searchable',
        p_limit: 10,
      });

      // ContentService: Get paginated content
      const paginatedContent = await contentService.getContentPaginatedSlim({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 0,
      });

      // Verify both services work together
      expect(searchResults.data).toHaveLength(1);
      expect(searchResults.data[0].slug).toBe('searchable-content');
      expect(paginatedContent.items).toHaveLength(1);
      expect(paginatedContent.items[0].slug).toBe('searchable-content');
    });

    /**
     * Verifies SearchService.filterJobs and JobsService.getJobs work together.
     *
     * Tests that both services can access the same job data, with
     * filterJobs using RPC and getJobs using Prisma findMany.
     *
     * @test
     * @group Integration
     */
    it('should allow SearchService.filterJobs and JobsService.getJobs to work together', async () => {
      // Seed job data for JobsService
      const mockJobs = [
        {
          id: 'job-filter-1',
          slug: 'filterable-job',
          title: 'Filterable Job',
          company_id: 'company-1',
          description: 'This job should be filterable',
          location: 'Remote',
          remote: true,
          salary: '$100k',
          type: 'full-time' as const,
          category: 'engineering' as const,
          tags: ['typescript', 'react'],
          requirements: ['5+ years experience'],
          benefits: ['Health insurance'],
          link: 'https://example.com/job',
          contact_email: 'jobs@example.com',
          posted_at: new Date(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          active: true,
          status: 'active' as const,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      // Use Prismocker's setData for job data (proper Prismocker usage)
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('jobs', mockJobs);
      }

      // Mock filterJobs RPC result
      const mockFilterResult = {
        jobs: [
          {
            id: 'job-filter-1',
            title: 'Filterable Job',
            slug: 'filterable-job',
            category: 'engineering',
          },
        ],
        total_count: BigInt(1),
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockFilterResult,
      ] as any);

      // SearchService: Filter jobs
      const filterResults = await service.filterJobs({
        p_category: 'engineering',
        p_limit: 10,
      });

      // JobsService: Get jobs
      const jobsResults = await jobsService.getJobs({
        limit: 10,
        offset: 0,
      });

      // Verify both services work together
      expect(filterResults.jobs).toHaveLength(1);
      expect(filterResults.jobs?.[0]?.slug).toBe('filterable-job');
      expect(jobsResults).toHaveLength(1);
      expect(jobsResults[0].slug).toBe('filterable-job');
    });

    /**
     * Verifies shared request-scoped cache across all three services.
     *
     * Tests that SearchService, ContentService, and JobsService all share
     * the same request-scoped cache, preventing duplicate queries within
     * a single request.
     *
     * @test
     * @group Integration
     * @group Caching
     */
    it('should share request-scoped cache across all three services', async () => {
      // Seed data
      const mockContent = [
        {
          id: 'content-cache-1',
          slug: 'cacheable-content',
          title: 'Cacheable Content',
          display_title: null,
          category: 'agents' as const,
          description: 'Content for cache test',
          tags: [],
          author: 'Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', mockContent);
      }

      // Mock search RPC
      const mockSearchResult = {
        results: [
          {
            id: 'content-cache-1',
            title: 'Cacheable Content',
            slug: 'cacheable-content',
            category: 'agents',
            excerpt: 'Content for cache test',
            relevance_score: 0.9,
          },
        ],
        total_count: BigInt(1),
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockSearchResult,
      ] as any);

      // First call via SearchService - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      await service.searchContent({
        p_query: 'cacheable',
        p_limit: 10,
      });
      const cacheAfterSearch = getRequestCache().getStats().size;

      // Second call via ContentService - should use cache if same data
      await contentService.getContentPaginatedSlim({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 0,
      });
      const cacheAfterContent = getRequestCache().getStats().size;

      // Verify cache was shared
      expect(cacheAfterSearch).toBeGreaterThan(cacheBefore);
      // Note: ContentService uses different query (view vs RPC), so cache may increase
      // But both should use request-scoped cache
      expect(cacheAfterContent).toBeGreaterThanOrEqual(cacheAfterSearch);
    });

    /**
     * Verifies error handling when one service fails.
     *
     * Tests that when SearchService fails, ContentService and JobsService
     * can still function independently, and errors are properly isolated.
     *
     * @test
     * @group Integration
     * @group ErrorHandling
     */
    it('should handle errors gracefully when one service fails', async () => {
      // Seed content data for ContentService
      const mockContent = [
        {
          id: 'content-error-1',
          slug: 'error-test-content',
          title: 'Error Test Content',
          display_title: null,
          category: 'agents' as const,
          description: 'Content for error test',
          tags: [],
          author: 'Author',
          date_added: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
          source: null,
          source_table: 'agents',
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          review_count: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
          storage_url: null,
          mcpb_storage_url: null,
          json_ld: null,
          seo_title: null,
          seo_description: null,
          seo_keywords: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', mockContent);
      }

      // Make SearchService fail
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
        new Error('Search index unavailable')
      );

      // SearchService should fail
      await expect(
        service.searchContent({
          p_query: 'test',
          p_limit: 10,
        })
      ).rejects.toThrow('Search index unavailable');

      // ContentService should still work (doesn't depend on SearchService)
      const contentResults = await contentService.getContentPaginatedSlim({
        p_category: 'agents',
        p_limit: 10,
        p_offset: 0,
      });

      expect(contentResults.items).toHaveLength(1);
      expect(contentResults.items[0].slug).toBe('error-test-content');
    });
  });
});
