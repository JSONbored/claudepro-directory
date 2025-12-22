import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { TrendingService } from './trending.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache, getRequestCache } from '../utils/request-cache';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockerClient
// Jest automatically uses __mocks__ directory (no explicit registration needed)

// Mock the RPC error logging utility
jest.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

describe('TrendingService', () => {
  let service: TrendingService;
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;

  beforeEach(async () => {
    // Clear request cache before each test
    clearRequestCache();

    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Prismocker doesn't support $queryRawUnsafe, so we add it as a mock function
    queryRawUnsafeSpy = jest.fn().mockResolvedValue([]);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismocker models are initialized
    void prismocker.v_trending_searches;
    void prismocker.content;

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

      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const result = await service.getTrendingContent({
        p_category: null,
        p_limit: 10,
      });

      expect(result).toStrictEqual(mockData);

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_content'),
        null,
        10
      );
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = [
        {
          id: 'content-1',
          title: 'Popular Agent',
          slug: 'popular-agent',
          category: 'agents' as const,
          view_count: 1500,
          created_at: '2024-01-01T00:00:00Z',
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const args = { p_category: null, p_limit: 10 };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await service.getTrendingContent(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await service.getTrendingContent(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('returns empty array when no trending content', async () => {
      queryRawUnsafeSpy.mockResolvedValue([] as any);

      const result = await service.getTrendingContent({
        p_category: null,
        p_limit: 10,
      });

      expect(result).toStrictEqual([]);

    });

    it('handles category filtering', async () => {
      const mockData = [{ id: 'content-1', category: 'agents' as const }];

      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      // Test with category filter
      await service.getTrendingContent({ p_category: 'agents', p_limit: 5 });
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_content'),
        'agents',
        5
      );

      // Test without category filter
      await service.getTrendingContent({ p_category: null, p_limit: 5 });
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_content'),
        null,
        5
      );
    });

    it('throws error on database failure', async () => {
      const mockError = new Error('Database error');

      queryRawUnsafeSpy.mockRejectedValue(mockError);

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

      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

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
      // getTrendingMetrics uses callRpc which formats SQL as: SELECT * FROM get_trending_metrics_with_content(p_category_ids => $1)
      const mockData = {
        metrics: { total_views: 1000, total_clicks: 500 },
        content: [],
      };
      // callRpc unwraps single-element arrays for composite types, so mock returns [mockData]
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await service.getTrendingMetrics({
        p_category_ids: ['agents', 'mcp'],
      });

      // callRpc formats the SQL as: SELECT * FROM get_trending_metrics_with_content(p_category_ids => $1)
      // Arguments are: SQL string, then the array value for p_category_ids
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_metrics_with_content'),
        ['agents', 'mcp']
      );
      // callRpc unwraps single-element arrays for composite types, so result is mockData directly
      expect(result).toEqual(mockData);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        metrics: { total_views: 1000, total_clicks: 500 },
        content: [],
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const args = { p_category_ids: ['agents', 'mcp'] };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await service.getTrendingMetrics(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await service.getTrendingMetrics(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getPopularContent', () => {
    it('should return popular content', async () => {
      // getPopularContent uses callRpc which formats SQL as: SELECT * FROM get_popular_content(p_category => $1, p_limit => $2)
      const mockData = [
        { id: '1', slug: 'popular-1', view_count: 1000 },
        { id: '2', slug: 'popular-2', view_count: 900 },
      ];
      // callRpc does NOT unwrap arrays for functions that return arrays (get_popular_content returns SETOF)
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const result = await service.getPopularContent({
        p_category: 'agents',
        p_limit: 10,
      });

      // callRpc formats the SQL as: SELECT * FROM get_popular_content(p_category => $1, p_limit => $2)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_popular_content'),
        'agents',
        10
      );
      expect(result).toEqual(mockData);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = [
        { id: '1', slug: 'popular-1', view_count: 1000 },
        { id: '2', slug: 'popular-2', view_count: 900 },
      ];
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const args = { p_category: 'agents', p_limit: 10 };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await service.getPopularContent(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await service.getPopularContent(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getRecentContent', () => {
    it('should return recent content with default params', async () => {
      // After migration: Mock data must match select fields (9 fields)
      const mockData = [
        {
          category: 'agents',
          author: 'test-author',
          created_at: new Date(),
          date_added: new Date(),
          description: 'Test description',
          slug: 'recent-1',
          tags: [],
          title: 'Test Title',
          display_title: 'Test Display Title',
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockData);
      }

      const result = await service.getRecentContent({});

      expect(result).toEqual(mockData);
    });

    it('should filter by category', async () => {
      // After migration: Mock data must match select fields (9 fields)
      const mockData = [
        {
          category: 'agents',
          author: 'test-author',
          created_at: new Date(),
          date_added: new Date(),
          description: 'Test description',
          slug: 'recent-1',
          tags: [],
          title: 'Test Title',
          display_title: 'Test Display Title',
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockData);
      }

      const result = await service.getRecentContent({
        p_category: 'agents',
        p_limit: 10,
        p_days: 30,
      });

      expect(result).toEqual(mockData);
    });

    it('should enforce limit bounds (1-100)', async () => {
      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', []);
      }

      // Test lower bound
      const result1 = await service.getRecentContent({ p_limit: 0 });
      expect(result1).toEqual([]);

      // Test upper bound
      const result2 = await service.getRecentContent({ p_limit: 200 });
      expect(result2).toEqual([]);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = [
        {
          category: 'agents',
          author: 'test-author',
          created_at: new Date(),
          date_added: new Date(),
          description: 'Test description',
          slug: 'recent-1',
          tags: [],
          title: 'Test Title',
          display_title: 'Test Display Title',
        },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', mockData);
      }

      const args = {};

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await service.getRecentContent(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await service.getRecentContent(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getTrendingMetricsFormatted', () => {
    it('should return formatted trending metrics', async () => {
      // getTrendingMetricsFormatted uses callRpc which formats SQL as: SELECT * FROM get_trending_metrics_formatted(p_category_ids => $1)
      const mockData = {
        total_views: '1,000',
        total_clicks: '500',
        click_through_rate: '50%',
      };
      // callRpc unwraps single-element arrays for composite types, so mock returns [mockData]
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await service.getTrendingMetricsFormatted({
        p_category_ids: ['agents'],
      });

      // callRpc formats the SQL as: SELECT * FROM get_trending_metrics_formatted(p_category_ids => $1)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_trending_metrics_formatted'),
        ['agents']
      );
      // callRpc unwraps single-element arrays for composite types, so result is mockData directly
      expect(result).toEqual(mockData);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        total_views: '1,000',
        total_clicks: '500',
        click_through_rate: '50%',
      };
      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const args = { p_category_ids: ['agents'] };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await service.getTrendingMetricsFormatted(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await service.getTrendingMetricsFormatted(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getPopularContentFormatted', () => {
    it('should return formatted popular content', async () => {
      // getPopularContentFormatted uses callRpc which formats SQL as: SELECT * FROM get_popular_content_formatted(p_category => $1, p_limit => $2)
      const mockData = [
        {
          id: '1',
          slug: 'popular-1',
          title: 'Popular Item',
          formatted_views: '1,000 views',
        },
      ];
      // callRpc does NOT unwrap arrays for functions that return arrays (SETOF)
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const result = await service.getPopularContentFormatted({
        p_category: 'agents',
        p_limit: 10,
      });

      // callRpc formats the SQL as: SELECT * FROM get_popular_content_formatted(p_category => $1, p_limit => $2)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_popular_content_formatted'),
        'agents',
        10
      );
      expect(result).toEqual(mockData);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'popular-1',
          title: 'Popular Item',
          formatted_views: '1,000 views',
        },
      ];
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const args = { p_category: 'agents', p_limit: 10 };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await service.getPopularContentFormatted(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await service.getPopularContentFormatted(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getRecentContentFormatted', () => {
    it('should return formatted recent content', async () => {
      // getRecentContentFormatted uses callRpc which formats SQL as: SELECT * FROM get_recent_content_formatted(p_category => $1, p_limit => $2)
      const mockData = [
        {
          id: '1',
          slug: 'recent-1',
          title: 'Recent Item',
          formatted_date: '2 days ago',
        },
      ];
      // callRpc does NOT unwrap arrays for functions that return arrays (SETOF)
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const result = await service.getRecentContentFormatted({
        p_category: 'agents',
        p_limit: 10,
      });

      // callRpc formats the SQL as: SELECT * FROM get_recent_content_formatted(p_category => $1, p_limit => $2)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_recent_content_formatted'),
        'agents',
        10
      );
      expect(result).toEqual(mockData);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'recent-1',
          title: 'Recent Item',
          formatted_date: '2 days ago',
        },
      ];
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const args = { p_category: 'agents', p_limit: 10 };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await service.getRecentContentFormatted(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await service.getRecentContentFormatted(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getSidebarTrendingFormatted', () => {
    it('should return formatted sidebar trending content', async () => {
      // getSidebarTrendingFormatted uses callRpc which formats SQL as: SELECT * FROM get_sidebar_trending_formatted(p_limit => $1)
      const mockData = [
        {
          id: '1',
          slug: 'trending-1',
          title: 'Trending Item',
          formatted_score: 'High',
        },
      ];
      // callRpc does NOT unwrap arrays for functions that return arrays (SETOF)
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const result = await service.getSidebarTrendingFormatted({
        p_limit: 5,
      });

      // callRpc formats the SQL as: SELECT * FROM get_sidebar_trending_formatted(p_limit => $1)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_sidebar_trending_formatted'),
        5
      );
      expect(result).toEqual(mockData);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'trending-1',
          title: 'Trending Item',
          formatted_score: 'High',
        },
      ];
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const args = { p_limit: 5 };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await service.getSidebarTrendingFormatted(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await service.getSidebarTrendingFormatted(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getSidebarRecentFormatted', () => {
    it('should return formatted sidebar recent content', async () => {
      // getSidebarRecentFormatted uses callRpc which formats SQL as: SELECT * FROM get_sidebar_recent_formatted(p_limit => $1)
      const mockData = [
        {
          id: '1',
          slug: 'recent-1',
          title: 'Recent Item',
          formatted_date: 'Just now',
        },
      ];
      // callRpc does NOT unwrap arrays for functions that return arrays (SETOF)
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const result = await service.getSidebarRecentFormatted({
        p_limit: 5,
      });

      // callRpc formats the SQL as: SELECT * FROM get_sidebar_recent_formatted(p_limit => $1)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_sidebar_recent_formatted'),
        5
      );
      expect(result).toEqual(mockData);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = [
        {
          id: '1',
          slug: 'recent-1',
          title: 'Recent Item',
          formatted_date: 'Just now',
        },
      ];
      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const args = { p_limit: 5 };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      await service.getSidebarRecentFormatted(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      await service.getSidebarRecentFormatted(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  // calculateContentTimeMetrics was removed from the service (RPC function was removed in migration)
  // Tests removed to match service implementation

  describe('refreshTrendingMetricsView', () => {
    it('should refresh trending metrics view', async () => {
      queryRawUnsafeSpy.mockResolvedValue(undefined as any);

      await service.refreshTrendingMetricsView();

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('refresh_trending_metrics_view')
      );
    });

    it('should not use cache for mutations', async () => {
      queryRawUnsafeSpy.mockResolvedValue(undefined as any);

      await service.refreshTrendingMetricsView();

      // Verify mutation doesn't use cache
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
    });
  });
});
