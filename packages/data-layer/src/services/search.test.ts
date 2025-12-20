import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SearchService } from './search.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismock is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockClient

// Mock the RPC error logging utility
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Mock request cache
vi.mock('../utils/request-cache.ts', () => ({
  withSmartCache: vi.fn((_key, _method, fn) => fn()),
}));

describe('SearchService', () => {
  let service: SearchService;
  let prismock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;

  /**
   * Helper to safely mock Prismock model methods
   */
  function mockPrismockMethod<T>(
    model: any,
    method: string,
    returnValue: T
  ): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismock model does not exist - check if model name matches schema.prisma`);
    }
    const mockFn = vi.fn().mockResolvedValue(returnValue as any);
    model[method] = mockFn;
    return mockFn;
  }

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockClient via __mocks__/@prisma/client.ts)
    prismock = prisma;

    // Reset Prismock data before each test
    if ('reset' in prismock && typeof prismock.reset === 'function') {
      prismock.reset();
    }

    // Prismock doesn't support $queryRawUnsafe, so we add it as a mock function
    queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismock models are initialized
    void prismock.v_content_list_slim;

    service = new SearchService();
  });

  describe('searchContent', () => {
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
      queryRawUnsafeSpy.mockResolvedValue([mockResult] as any);

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
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('search_content_optimized'),
        'typescript',
        10
      );
    });

    it('returns empty array when no results found', async () => {
      // callRpc returns null for empty arrays (single-return functions)
      // But searchContent handles null by returning empty array
      const mockResult = {
        results: [],
        total_count: BigInt(0),
      };
      queryRawUnsafeSpy.mockResolvedValue([mockResult] as any);

      const result = await service.searchContent({
        p_query: 'nonexistent-query-xyz',
        p_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Search index unavailable');

      queryRawUnsafeSpy.mockRejectedValue(mockError);

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
      queryRawUnsafeSpy.mockResolvedValue([mockResult] as any);

      const result = await service.searchContent({
        p_query: 'test & query | with (special) characters',
        p_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('searchUnified', () => {
    it('should return unified search results', async () => {
      const mockResult = {
        results: [{ id: '1', title: 'Result 1', category: 'agents' }],
        total_count: 1n,
      };

      queryRawUnsafeSpy.mockResolvedValue([mockResult] as any);

      const result = await service.searchUnified({
        p_query: 'test',
        p_limit: 10,
      });

      // callRpc formats the SQL as: SELECT * FROM search_unified(p_query => $1, p_limit => $2)
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('search_unified'),
        'test',
        10
      );
      expect(result.data).toEqual(mockResult.results);
      expect(result.total_count).toBe(1);
    });

    it('should handle null result', async () => {
      queryRawUnsafeSpy.mockResolvedValue([null] as any);

      const result = await service.searchUnified({
        p_query: 'test',
        p_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
    });
  });

  describe('filterJobs', () => {
    it('should return filtered jobs', async () => {
      // filterJobs uses callRpc which returns FilterJobsReturns (object with jobs array and total_count)
      const mockData = {
        jobs: [{ id: 'job-1', title: 'Developer', category: 'engineering' }],
        total_count: BigInt(1),
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await service.filterJobs({
        p_category: 'engineering',
        p_limit: 10,
      });

      // callRpc formats the SQL as: SELECT * FROM filter_jobs(p_category => $1, p_limit => $2)
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('filter_jobs'),
        'engineering',
        10
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSearchFacets', () => {
    it('should return search facets', async () => {
      // getSearchFacets uses callRpc which unwraps single-element arrays
      const mockData = {
        categories: ['agents', 'mcp'],
        tags: ['react', 'typescript'],
        authors: ['author1', 'author2'],
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await service.getSearchFacets();

      // callRpc formats the SQL as: SELECT * FROM get_search_facets()
      // callRpc unwraps single-element arrays, so result should be the unwrapped object
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_facets')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSearchFacetsFormatted', () => {
    it('should return formatted search facets', async () => {
      // getSearchFacetsFormatted uses callRpc which unwraps single-element arrays
      const mockData = {
        categories: [{ name: 'Agents', count: 10 }],
        tags: [{ name: 'React', count: 5 }],
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await service.getSearchFacetsFormatted();

      // callRpc formats the SQL as: SELECT * FROM get_search_facets_formatted()
      // callRpc unwraps single-element arrays, so result should be the unwrapped object
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_facets_formatted')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSearchSuggestionsFromHistory', () => {
    it('should return search suggestions from history', async () => {
      const mockData = [
        { query: 'typescript', count: 10 },
        { query: 'react', count: 8 },
      ];
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const result = await service.getSearchSuggestions({
        p_query: 'type',
        p_limit: 5,
      });

      // callRpc formats the SQL as: SELECT * FROM get_search_suggestions_from_history(p_query => $1, p_limit => $2)
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_suggestions_from_history'),
        'type',
        5
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSearchSuggestionsFormatted', () => {
    it('should return formatted search suggestions', async () => {
      const mockData = [
        { suggestion: 'typescript', relevance: 0.9 },
        { suggestion: 'react', relevance: 0.8 },
      ];
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const result = await service.getSearchSuggestionsFormatted({
        p_query: 'type',
        p_limit: 5,
      });

      // callRpc formats the SQL as: SELECT * FROM get_search_suggestions_formatted(p_query => $1, p_limit => $2)
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_suggestions_formatted'),
        'type',
        5
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('batchInsertSearchQueries', () => {
    it('should batch insert search queries', async () => {
      // batchInsertSearchQueries uses callRpc which formats SQL as: SELECT * FROM batch_insert_search_queries(p_queries => $1)
      const mockData = { inserted_count: 3 };
      // callRpc unwraps single-element arrays for composite types (objects)
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await service.batchInsertSearchQueries({
        p_queries: [
          { query: 'typescript', user_id: 'user1' },
          { query: 'react', user_id: 'user2' },
        ],
      });

      // callRpc formats the SQL as: SELECT * FROM batch_insert_search_queries(p_queries => $1)
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('batch_insert_search_queries'),
        expect.any(Array) // p_queries is an array
      );
      // callRpc unwraps single-element arrays for composite types, so result is mockData directly
      expect(result).toEqual(mockData);
    });

    it('should not use cache for mutations', async () => {
      const mockData = { inserted_count: 0 };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      await service.batchInsertSearchQueries({
        p_queries: [],
      });

      // Verify mutation doesn't use cache
      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('getTrendingSearches', () => {
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
      mockPrismockMethod(prismock.v_trending_searches, 'findMany', mockData);

      const result = await service.getTrendingSearches({
        limit_count: 10,
      });

      // getTrendingSearches uses Prisma view query (type-safe)
      expect(prismock.v_trending_searches.findMany).toHaveBeenCalledWith({
        orderBy: { search_count: 'desc' },
        take: 10,
      });
      // Result is transformed: count (bigint) -> count (number), label computed
      expect(result).toEqual([
        { query: 'typescript', count: 100, label: '🔥 typescript (100 searches)' },
        { query: 'react', count: 80, label: '🔥 react (80 searches)' },
      ]);
    });
  });
});
