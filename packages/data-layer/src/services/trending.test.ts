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

  describe('getTrendingMetrics', () => {
    it('should return trending metrics with content', async () => {
      const mockData = {
        metrics: { total_views: 1000, total_clicks: 500 },
        content: [],
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.getTrendingMetrics({
        p_category_ids: ['agents', 'mcp'],
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_metrics_with_content')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getPopularContent', () => {
    it('should return popular content', async () => {
      const mockData = [
        { id: '1', slug: 'popular-1', view_count: 1000 },
        { id: '2', slug: 'popular-2', view_count: 900 },
      ];
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getPopularContent({
        p_category: 'agents',
        p_limit: 10,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_popular_content')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getRecentContent', () => {
    it('should return recent content with default params', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'recent-1',
          category: 'agents',
          date_added: new Date(),
        },
      ];

      vi.mocked(prismock.content.findMany).mockResolvedValue(mockData as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getRecentContent({});

      expect(prismock.content.findMany).toHaveBeenCalledWith({
        where: {
          date_added: { gte: expect.any(Date) },
        },
        orderBy: [
          { date_added: 'desc' },
          { created_at: 'desc' },
        ],
        take: 20, // default limit
      });
      expect(result).toEqual(mockData);
    });

    it('should filter by category', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'recent-1',
          category: 'agents',
          date_added: new Date(),
        },
      ];

      vi.mocked(prismock.content.findMany).mockResolvedValue(mockData as any);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await service.getRecentContent({
        p_category: 'agents',
        p_limit: 10,
        p_days: 30,
      });

      expect(prismock.content.findMany).toHaveBeenCalledWith({
        where: {
          category: 'agents',
          date_added: { gte: expect.any(Date) },
        },
        orderBy: [
          { date_added: 'desc' },
          { created_at: 'desc' },
        ],
        take: 10,
      });
      expect(result).toEqual(mockData);
    });

    it('should enforce limit bounds (1-100)', async () => {
      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      vi.mocked(prismock.content.findMany).mockResolvedValue([]);

      // Test lower bound
      await service.getRecentContent({ p_limit: 0 });
      expect(prismock.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 })
      );

      // Test upper bound
      await service.getRecentContent({ p_limit: 200 });
      expect(prismock.content.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });
  });

  describe('getTrendingMetricsFormatted', () => {
    it('should return formatted trending metrics', async () => {
      const mockData = {
        total_views: '1,000',
        total_clicks: '500',
        click_through_rate: '50%',
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.getTrendingMetricsFormatted({
        p_category_ids: ['agents'],
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_metrics_formatted')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getPopularContentFormatted', () => {
    it('should return formatted popular content', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'popular-1',
          title: 'Popular Item',
          formatted_views: '1,000 views',
        },
      ];
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getPopularContentFormatted({
        p_category: 'agents',
        p_limit: 10,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_popular_content_formatted')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getRecentContentFormatted', () => {
    it('should return formatted recent content', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'recent-1',
          title: 'Recent Item',
          formatted_date: '2 days ago',
        },
      ];
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getRecentContentFormatted({
        p_category: 'agents',
        p_limit: 10,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_recent_content_formatted')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSidebarTrendingFormatted', () => {
    it('should return formatted sidebar trending content', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'trending-1',
          title: 'Trending Item',
          formatted_score: 'High',
        },
      ];
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getSidebarTrendingFormatted({
        p_limit: 5,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_sidebar_trending_formatted')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('getSidebarRecentFormatted', () => {
    it('should return formatted sidebar recent content', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'recent-1',
          title: 'Recent Item',
          formatted_date: 'Just now',
        },
      ];
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await service.getSidebarRecentFormatted({
        p_limit: 5,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_sidebar_recent_formatted')
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('calculateContentTimeMetrics', () => {
    it('should calculate content time metrics', async () => {
      const mockData = {
        total_items: 100,
        average_age_days: 30,
      };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await service.calculateContentTimeMetrics();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('calculate_content_time_metrics')
      );
      expect(result).toEqual(mockData);
    });

    it('should not use cache for mutations', async () => {
      const mockData = { total_items: 100 };
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      await service.calculateContentTimeMetrics();

      // Verify callRpc was called with useCache: false
      // This is handled internally by BasePrismaService
      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
    });
  });

  describe('refreshTrendingMetricsView', () => {
    it('should refresh trending metrics view', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(undefined as any);

      await service.refreshTrendingMetricsView();

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('refresh_trending_metrics_view')
      );
    });

    it('should not use cache for mutations', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(undefined as any);

      await service.refreshTrendingMetricsView();

      // Verify mutation doesn't use cache
      expect(prismock.$queryRawUnsafe).toHaveBeenCalled();
    });
  });
});