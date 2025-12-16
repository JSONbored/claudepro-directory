import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismockClient } from 'prismock';
import { TrendingService } from './trending.ts';

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

describe('TrendingService', () => {
  let service: TrendingService;
  let prismock: PrismockClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as PrismockClient;
    
    // Reset Prismock data before each test
    prismock.reset();
    
    service = new TrendingService();
  });

  describe('getTrendingContent', () => {
    it('returns trending content on success', async () => {
      const mockData = [
        {
          id: 'content-1',
          title: 'Popular Agent',
          slug: 'popular-agent',
          category: 'agents' as const,
          view_count: 1500,
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'content-2',
          title: 'Hot Skill',
          slug: 'hot-skill',
          category: 'skills' as const,
          view_count: 1200,
          created_at: '2024-01-02T00:00:00Z',
        },
      ];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getTrendingContent({
        p_category: null,
        p_limit: 10,
      });

      expect(result).toEqual(mockData);
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_content'),
        null,
        10
      );
    });

    it('returns empty array when no trending content', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

      const result = await service.getTrendingContent({
        p_category: null,
        p_limit: 10,
      });

      expect(result).toEqual([]);
    });

    it('handles category filtering', async () => {
      const mockData = [{ id: 'content-1', category: 'agents' as const }];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      // Test with category filter
      await service.getTrendingContent({ p_category: 'agents', p_limit: 5 });
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_content'),
        'agents',
        5
      );

      // Test without category filter
      await service.getTrendingContent({ p_category: null, p_limit: 5 });
      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_content'),
        null,
        5
      );
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Database error');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

      await expect(
        service.getTrendingContent({
          p_category: null,
          p_limit: 10,
        })
      ).rejects.toThrow('Database error');
    });

    it('returns results sorted by trending score from materialized view', async () => {
      const mockData = [
        { id: '1', category: 'agents' as const, slug: 'item-1' },
        { id: '2', category: 'agents' as const, slug: 'item-2' },
        { id: '3', category: 'agents' as const, slug: 'item-3' },
      ];

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getTrendingContent({
        p_category: null,
        p_limit: 10,
      });

      // Results are pre-sorted by database (trending_score DESC)
      expect(result).toEqual(mockData);
      expect(result).toHaveLength(3);
    });
  });
});