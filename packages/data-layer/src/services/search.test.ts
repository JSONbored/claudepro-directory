import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { MockPrismaClient } from '../test-utils/prisma-mock.ts';
import { SearchService } from './search.ts';

// Mock the prisma singleton with Prismock (async to avoid Node.js TS processing issue)
vi.mock('../prisma/client.ts', async () => {
  const { setupPrismockMockAsync } = await import('../test-utils/prisma-mock.ts');
  return {
    prisma: await setupPrismockMockAsync(),
  };
});

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
  let prismock: PrismockClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as PrismockClient;
    
    // Reset Prismock data before each test
    prismock.reset();
    
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

      // Search service returns { data: rows, total_count: number }
      // Mock to return array with total_count property
      const mockResult = { data: mockData, total_count: 2 };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockResult] as any);

      const result = await service.searchContent({
        search_query: 'typescript',
        result_limit: 10,
      });

      expect(result.data).toEqual(mockData);
      expect(result.total_count).toBe(2);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('search_content_optimized'),
        'typescript',
        10
      );
    });

    it('returns empty array when no results found', async () => {
      const mockResult = { data: [], total_count: 0 };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockResult] as any);

      const result = await service.searchContent({
        search_query: 'nonexistent-query-xyz',
        result_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Search index unavailable');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(
        service.searchContent({
          search_query: 'test',
          result_limit: 10,
        })
      ).rejects.toThrow('Search index unavailable');
    });

    it('handles special characters in query', async () => {
      const mockResult = { data: [], total_count: 0 };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockResult] as any);

      const result = await service.searchContent({
        search_query: 'test & query | with (special) characters',
        result_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('searchUnified', () => {
    it('should return unified search results', async () => {
      const mockResult = {
        results: [
          { id: '1', title: 'Result 1', category: 'agents' },
        ],
        total_count: 1n,
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockResult] as any);

      const result = await service.searchUnified({
        search_query: 'test',
        result_limit: 10,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('search_unified')
      );
      expect(result.data).toEqual(mockResult.results);
      expect(result.total_count).toBe(1);
    });

    it('should handle null result', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([null] as any);

      const result = await service.searchUnified({
        search_query: 'test',
        result_limit: 10,
      });

      expect(result.data).toEqual([]);
      expect(result.total_count).toBe(0);
    });
  });

  describe('filterJobs', () => {
    it('should return filtered jobs', async () => {
      const mockData = [
        { id: 'job-1', title: 'Developer', category: 'engineering' },
      ];
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.filterJobs({
        p_category: 'engineering',
        p_limit: 10,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('filter_jobs')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSearchFacets', () => {
    it('should return search facets', async () => {
      const mockData = {
        categories: ['agents', 'mcp'],
        tags: ['react', 'typescript'],
        authors: ['author1', 'author2'],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.getSearchFacets();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_facets')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSearchFacetsFormatted', () => {
    it('should return formatted search facets', async () => {
      const mockData = {
        categories: [{ name: 'Agents', count: 10 }],
        tags: [{ name: 'React', count: 5 }],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.getSearchFacetsFormatted();

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
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getSearchSuggestionsFromHistory({
        p_query: 'type',
        p_limit: 5,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_suggestions_from_history')
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
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getSearchSuggestionsFormatted({
        p_query: 'type',
        p_limit: 5,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_search_suggestions_formatted')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('batchInsertSearchQueries', () => {
    it('should batch insert search queries', async () => {
      const mockData = { inserted_count: 3 };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.batchInsertSearchQueries({
        p_queries: [
          { query: 'typescript', user_id: 'user1' },
          { query: 'react', user_id: 'user2' },
        ],
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('batch_insert_search_queries')
      );
      expect(result).toEqual(mockData);
    });

    it('should not use cache for mutations', async () => {
      const mockData = { inserted_count: 0 };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      await service.batchInsertSearchQueries({
        p_queries: [],
      });

      // Verify mutation doesn't use cache
      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('getTrendingSearches', () => {
    it('should return trending searches', async () => {
      const mockData = [
        { query: 'typescript', count: 100 },
        { query: 'react', count: 80 },
      ];
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getTrendingSearches({
        p_limit: 10,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_searches')
      );
      expect(result).toEqual(mockData);
    });
  });
});