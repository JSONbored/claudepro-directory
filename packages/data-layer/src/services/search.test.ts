import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismockClient } from 'prismock';
import { SearchService } from './search.ts';

// Mock the prisma singleton with Prismock
vi.mock('../prisma/client.ts', () => {
  const { setupPrismockMock } = require('../test-utils/prisma-mock.ts');
  return {
    prisma: setupPrismockMock(),
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
});