/**
 * Featured Service Calculator Tests
 * SHA-3152: Tests for unified featured content service (calculation functions)
 *
 * Tests for the multi-factor featured content scoring algorithm.
 * This is BUSINESS-CRITICAL - determines which content gets featured weekly.
 *
 * Algorithm Components:
 * - Trending Score (40%): 24h growth rate from Redis
 * - Rating Score (30%): User ratings (requires 3+ ratings)
 * - Engagement Score (20%): Bookmarks, copies, comments, views
 * - Freshness Score (10%): Content age (newer = higher)
 *
 * Coverage:
 * - Multi-factor scoring calculations
 * - Redis view count integration
 * - Database engagement metrics
 * - Edge cases (zero views, missing data, Redis errors)
 *
 * @see src/lib/services/featured.service.ts
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import {
  calculateFeaturedForCategory,
  featuredService,
} from '@/src/lib/services/featured.service';

// Mock dependencies
vi.mock('@/src/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock('@/src/lib/redis', () => ({
  statsRedis: {
    getDailyViewCounts: vi.fn(),
    getViewCounts: vi.fn(),
  },
}));

vi.mock('@/src/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { logger } from '@/src/lib/logger';
import { statsRedis } from '@/src/lib/redis';
import { createClient } from '@/src/lib/supabase/server';

// Test data factory
function createMockContentItem(
  slug: string,
  dateAdded: string,
  overrides?: Partial<UnifiedContentItem>
): UnifiedContentItem {
  return {
    slug,
    dateAdded,
    category: 'mcp',
    title: `Test Item ${slug}`,
    description: 'Test description',
    author: { name: 'Test Author', email: 'test@example.com' },
    tags: [],
    license: 'MIT',
    ...overrides,
  } as UnifiedContentItem;
}

describe('featuredService', () => {
  let mockSupabase: {
    from: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: [],
            error: null,
          }),
        }),
        insert: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        order: vi.fn().mockReturnValue({
          data: [],
          error: null,
        }),
      }),
    };

    vi.mocked(createClient).mockResolvedValue(mockSupabase as never);

    // Mock Redis with default empty responses
    vi.mocked(statsRedis.getDailyViewCounts).mockResolvedValue({});
    vi.mocked(statsRedis.getViewCounts).mockResolvedValue({});

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Week Calculations', () => {
    it('gets current week start (Monday)', () => {
      const weekStart = featuredService.getCurrentWeekStart();

      expect(weekStart.getDay()).toBe(1); // Monday
      expect(weekStart.getHours()).toBe(0);
      expect(weekStart.getMinutes()).toBe(0);
      expect(weekStart.getSeconds()).toBe(0);
      expect(weekStart.getMilliseconds()).toBe(0);
    });

    it('calculates week end (Sunday) from week start', () => {
      const weekStart = new Date('2025-01-06T00:00:00'); // Monday (local time)
      weekStart.setHours(0, 0, 0, 0); // Ensure midnight
      const weekEnd = featuredService.getWeekEnd(weekStart);

      // Week end should be 6 days later
      const daysDiff = Math.floor(
        (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysDiff).toBe(6);

      // Should be end of day
      expect(weekEnd.getHours()).toBe(23);
      expect(weekEnd.getMinutes()).toBe(59);
      expect(weekEnd.getSeconds()).toBe(59);
      expect(weekEnd.getMilliseconds()).toBe(999);
    });

    it('handles week start on Sunday', () => {
      // Manually set date to Sunday for testing
      const sunday = new Date('2025-01-05'); // Sunday
      const mockedDate = new Date(sunday);

      vi.useFakeTimers();
      vi.setSystemTime(mockedDate);

      const weekStart = featuredService.getCurrentWeekStart();

      // Should return previous Monday (Dec 30)
      expect(weekStart.getDay()).toBe(1);
      expect(weekStart.getDate()).toBe(30);

      vi.useRealTimers();
    });

    it('handles week start on different weekdays', () => {
      const testDates = [
        '2025-01-06T12:00:00Z', // Monday
        '2025-01-07T12:00:00Z', // Tuesday
        '2025-01-08T12:00:00Z', // Wednesday
        '2025-01-09T12:00:00Z', // Thursday
        '2025-01-10T12:00:00Z', // Friday
        '2025-01-11T12:00:00Z', // Saturday
      ];

      vi.useFakeTimers();

      for (const date of testDates) {
        vi.setSystemTime(new Date(date));
        const weekStart = featuredService.getCurrentWeekStart();
        // All should return Monday (day 1)
        expect(weekStart.getDay()).toBe(1);
      }

      vi.useRealTimers();
    });
  });

  describe('Multi-Factor Scoring', () => {
    it('calculates scores for high-performing content', async () => {
      // Need multiple items for percentile calculation
      const items = [
        createMockContentItem('high-performer', new Date(Date.now() - 86400000).toISOString()),
        createMockContentItem('low-performer', new Date(Date.now() - 86400000).toISOString()),
      ];

      // Mock high performance metrics
      vi.mocked(statsRedis.getDailyViewCounts).mockImplementation(
        async (_items: unknown, date: string) => {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          if (date === today) {
            return { 'mcp:high-performer': 200 }; // Today: 200 views
          }
          if (date === yesterday) {
            return { 'mcp:high-performer': 100 }; // Yesterday: 100 views
          }
          return {};
        }
      );

      vi.mocked(statsRedis.getViewCounts).mockResolvedValue({
        'mcp:high-performer': 1000,
        'mcp:low-performer': 10,
      });

      // Mock bookmarks
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { content_slug: 'high-performer', content_type: 'mcp' },
              { content_slug: 'high-performer', content_type: 'mcp' },
              { content_slug: 'high-performer', content_type: 'mcp' },
            ],
            error: null,
          }),
        }),
      });

      const results = await calculateFeaturedForCategory('mcp', items);

      expect(results).toHaveLength(2);
      const item = results.find((r) => r?.slug === 'high-performer');

      // High growth rate (100% = 100 views increase)
      // Sigmoid function returns exactly 50 for 100% growth
      expect(item?.trendingScore).toBeGreaterThanOrEqual(45);
      expect(item?.trendingScore).toBeLessThanOrEqual(55);

      // No ratings = 0 rating score
      expect(item?.ratingScore).toBe(0);

      // Good engagement (3 bookmarks + 1000 views)
      expect(item?.engagementScore).toBeGreaterThan(0);

      // Fresh content (1 day old)
      expect(item?.freshnessScore).toBeGreaterThan(90);

      // Final score should be weighted average
      expect(item?.finalScore).toBeGreaterThan(0);

      // Metadata should be populated
      expect(item?.calculationMetadata).toEqual({
        views: 1000,
        growthRate: 100,
        rating: undefined,
        engagement: { bookmarks: 3, copies: 0, comments: 0, views: 1000 },
        daysOld: expect.any(Number),
      });
    });

    it('calculates scores for low-performing content', async () => {
      const items = [
        createMockContentItem('low-performer', new Date(Date.now() - 86400000 * 60).toISOString()),
      ];

      // Mock low performance metrics
      vi.mocked(statsRedis.getDailyViewCounts).mockResolvedValue({});
      vi.mocked(statsRedis.getViewCounts).mockResolvedValue({
        'mcp:low-performer': 10, // Only 10 views
      });

      // Mock no bookmarks
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const results = await calculateFeaturedForCategory('mcp', items);

      expect(results).toHaveLength(1);
      const item = results[0];

      // No growth = low trending score
      expect(item?.trendingScore).toBeLessThan(50);

      // No ratings = 0 rating score
      expect(item?.ratingScore).toBe(0);

      // Low engagement (no bookmarks, few views)
      expect(item?.engagementScore).toBeLessThan(50);

      // Old content (60 days) = 0 freshness score
      expect(item?.freshnessScore).toBe(0);

      // Final score should be low
      expect(item?.finalScore).toBeLessThan(50);
    });

    it('sorts items by final score descending', async () => {
      const now = Date.now();
      const items = [
        createMockContentItem('low', new Date(now - 86400000 * 60).toISOString()),
        createMockContentItem('high', new Date(now - 86400000).toISOString()),
        createMockContentItem('medium', new Date(now - 86400000 * 30).toISOString()),
      ];

      // Mock varied metrics
      vi.mocked(statsRedis.getViewCounts).mockResolvedValue({
        'mcp:high': 1000,
        'mcp:medium': 500,
        'mcp:low': 100,
      });

      vi.mocked(statsRedis.getDailyViewCounts).mockImplementation(
        async (_items: unknown, date: string) => {
          const today = new Date().toISOString().split('T')[0];
          if (date === today) {
            return {
              'mcp:high': 100,
              'mcp:medium': 50,
              'mcp:low': 10,
            };
          }
          return {};
        }
      );

      const results = await calculateFeaturedForCategory('mcp', items);

      expect(results).toHaveLength(3);
      expect(results[0]?.slug).toBe('high');
      expect(results[1]?.slug).toBe('medium');
      expect(results[2]?.slug).toBe('low');

      // Scores should be descending
      expect(results[0]?.finalScore).toBeGreaterThan(results[1]?.finalScore ?? 0);
      expect(results[1]?.finalScore).toBeGreaterThan(results[2]?.finalScore ?? 0);
    });

    it('respects limit option', async () => {
      const items = Array.from({ length: 20 }, (_, i) =>
        createMockContentItem(`item-${i}`, new Date().toISOString())
      );

      const results = await calculateFeaturedForCategory('mcp', items, { limit: 5 });

      expect(results).toHaveLength(5);
    });

    it('uses default limit of 10', async () => {
      const items = Array.from({ length: 20 }, (_, i) =>
        createMockContentItem(`item-${i}`, new Date().toISOString())
      );

      const results = await calculateFeaturedForCategory('mcp', items);

      expect(results).toHaveLength(10);
    });
  });

  describe('Trending Score Calculation', () => {
    it('calculates trending score for zero growth', async () => {
      const items = [createMockContentItem('zero-growth', new Date().toISOString())];

      vi.mocked(statsRedis.getDailyViewCounts).mockImplementation(
        async (_items: unknown, date: string) => {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          if (date === today || date === yesterday) {
            return { 'mcp:zero-growth': 100 };
          }
          return {};
        }
      );

      const results = await calculateFeaturedForCategory('mcp', items);

      // Zero growth = around 50 score (sigmoid midpoint)
      expect(results[0]?.trendingScore).toBeGreaterThan(0);
      expect(results[0]?.trendingScore).toBeLessThan(60);
      expect(results[0]?.calculationMetadata.growthRate).toBe(0);
    });

    it('calculates trending score for high growth', async () => {
      const items = [createMockContentItem('high-growth', new Date().toISOString())];

      vi.mocked(statsRedis.getDailyViewCounts).mockImplementation(
        async (_items: unknown, date: string) => {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          if (date === today) {
            return { 'mcp:high-growth': 600 }; // 500% growth
          }
          if (date === yesterday) {
            return { 'mcp:high-growth': 100 };
          }
          return {};
        }
      );

      const results = await calculateFeaturedForCategory('mcp', items);

      // 500% growth = high score
      expect(results[0]?.trendingScore).toBeGreaterThan(80);
      expect(results[0]?.calculationMetadata.growthRate).toBe(500);
    });

    it('handles new content with views today but none yesterday', async () => {
      const items = [createMockContentItem('new-content', new Date().toISOString())];

      vi.mocked(statsRedis.getDailyViewCounts).mockImplementation(
        async (_items: unknown, date: string) => {
          const today = new Date().toISOString().split('T')[0];
          if (date === today) {
            return { 'mcp:new-content': 50 };
          }
          return {}; // No views yesterday
        }
      );

      const results = await calculateFeaturedForCategory('mcp', items);

      // New content with views = 100% growth rate
      expect(results[0]?.calculationMetadata.growthRate).toBe(100);
      // Sigmoid function returns exactly 50 for 100% growth
      expect(results[0]?.trendingScore).toBeGreaterThanOrEqual(45);
      expect(results[0]?.trendingScore).toBeLessThanOrEqual(55);
    });
  });

  describe('Engagement Score Calculation', () => {
    it('calculates engagement from bookmarks', async () => {
      // Need multiple items for percentile calculation
      const items = [
        createMockContentItem('bookmarked', new Date().toISOString()),
        createMockContentItem('no-bookmarks', new Date().toISOString()),
      ];

      // Mock 10 bookmarks for first item
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: Array.from({ length: 10 }, () => ({
              content_slug: 'bookmarked',
              content_type: 'mcp',
            })),
            error: null,
          }),
        }),
      });

      vi.mocked(statsRedis.getViewCounts).mockResolvedValue({
        'mcp:bookmarked': 100,
        'mcp:no-bookmarks': 10,
      });

      const results = await calculateFeaturedForCategory('mcp', items);

      const bookmarkedItem = results.find((r) => r?.slug === 'bookmarked');
      expect(bookmarkedItem?.calculationMetadata.engagement.bookmarks).toBe(10);
      expect(bookmarkedItem?.engagementScore).toBeGreaterThan(0);
    });

    it('handles items with no engagement', async () => {
      const items = [createMockContentItem('no-engagement', new Date().toISOString())];

      vi.mocked(statsRedis.getViewCounts).mockResolvedValue({});

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const results = await calculateFeaturedForCategory('mcp', items);

      expect(results[0]?.calculationMetadata.engagement).toEqual({
        bookmarks: 0,
        copies: 0,
        comments: 0,
        views: 0,
      });
      expect(results[0]?.engagementScore).toBe(0);
    });
  });

  describe('Freshness Score Calculation', () => {
    it('gives high score to brand new content', async () => {
      const items = [createMockContentItem('brand-new', new Date().toISOString())];

      const results = await calculateFeaturedForCategory('mcp', items);

      // Brand new = 100 freshness score
      expect(results[0]?.freshnessScore).toBeGreaterThanOrEqual(98);
    });

    it('gives low score to old content', async () => {
      const sixtyDaysAgo = new Date(Date.now() - 86400000 * 60).toISOString();
      const items = [createMockContentItem('old', sixtyDaysAgo)];

      const results = await calculateFeaturedForCategory('mcp', items);

      // 60 days old = 0 freshness score (50+ days = 0)
      expect(results[0]?.freshnessScore).toBe(0);
    });

    it('gives medium score to moderately aged content', async () => {
      const twentyFiveDaysAgo = new Date(Date.now() - 86400000 * 25).toISOString();
      const items = [createMockContentItem('medium-age', twentyFiveDaysAgo)];

      const results = await calculateFeaturedForCategory('mcp', items);

      // 25 days old = 50 freshness score (100 - 25*2)
      expect(results[0]?.freshnessScore).toBeGreaterThanOrEqual(48);
      expect(results[0]?.freshnessScore).toBeLessThanOrEqual(52);
    });
  });

  describe('Error Handling', () => {
    it('handles Redis errors gracefully', async () => {
      const items = [createMockContentItem('redis-error', new Date().toISOString())];

      vi.mocked(statsRedis.getDailyViewCounts).mockRejectedValue(
        new Error('Redis connection failed')
      );
      vi.mocked(statsRedis.getViewCounts).mockRejectedValue(new Error('Redis connection failed'));

      // Should not throw - continues with empty data
      const results = await calculateFeaturedForCategory('mcp', items);

      expect(results).toHaveLength(1);
      expect(logger.error).toHaveBeenCalledWith(
        'Redis error in featured calculator',
        expect.any(String)
      );

      // Should use fallback scoring (zero views/growth)
      expect(results[0]?.calculationMetadata.views).toBe(0);
      expect(results[0]?.calculationMetadata.growthRate).toBe(0);
    });

    it('handles Supabase errors gracefully', async () => {
      const items = [createMockContentItem('supabase-error', new Date().toISOString())];

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }),
      });

      // Should not throw - continues with empty bookmarks
      const results = await calculateFeaturedForCategory('mcp', items);

      expect(results).toHaveLength(1);
      expect(results[0]?.calculationMetadata.engagement.bookmarks).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty items array', async () => {
      const results = await calculateFeaturedForCategory('mcp', []);

      expect(results).toHaveLength(0);
    });

    it('handles items with missing dateAdded', async () => {
      const items = [
        createMockContentItem('missing-date', new Date().toISOString(), {
          dateAdded: undefined,
        }),
      ];

      const results = await calculateFeaturedForCategory('mcp', items);

      expect(results).toHaveLength(1);
      // Should use current date as fallback
      expect(results[0]?.freshnessScore).toBeGreaterThan(90);
    });

    it('validates options with schema', async () => {
      const items = [createMockContentItem('test', new Date().toISOString())];

      // Invalid limit (too high)
      await expect(calculateFeaturedForCategory('mcp', items, { limit: 100 })).rejects.toThrow();

      // Invalid limit (negative)
      await expect(calculateFeaturedForCategory('mcp', items, { limit: -1 })).rejects.toThrow();

      // Invalid minRatingCount (negative)
      await expect(
        calculateFeaturedForCategory('mcp', items, { minRatingCount: -1 })
      ).rejects.toThrow();
    });

    it('handles very large item counts', async () => {
      const items = Array.from({ length: 1000 }, (_, i) =>
        createMockContentItem(`item-${i}`, new Date().toISOString())
      );

      const results = await calculateFeaturedForCategory('mcp', items, { limit: 10 });

      expect(results).toHaveLength(10);
      expect(logger.info).toHaveBeenCalledWith(
        'Calculating featured mcp',
        expect.objectContaining({
          itemCount: 1000,
          limit: 10,
        })
      );
    });
  });

  describe('Real-World Scenarios', () => {
    it('simulates weekly featured calculation for popular MCP server', async () => {
      const popularMcp = createMockContentItem(
        'popular-mcp',
        new Date(Date.now() - 86400000 * 7).toISOString()
      );

      const averageMcp = createMockContentItem(
        'average-mcp',
        new Date(Date.now() - 86400000 * 14).toISOString()
      );

      const newMcp = createMockContentItem(
        'new-mcp',
        new Date(Date.now() - 86400000).toISOString()
      );

      const items = [popularMcp, averageMcp, newMcp];

      // Mock popular MCP metrics
      vi.mocked(statsRedis.getViewCounts).mockResolvedValue({
        'mcp:popular-mcp': 5000,
        'mcp:average-mcp': 1000,
        'mcp:new-mcp': 200,
      });

      vi.mocked(statsRedis.getDailyViewCounts).mockImplementation(
        async (_items: unknown, date: string) => {
          const today = new Date().toISOString().split('T')[0];
          const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

          if (date === today) {
            return {
              'mcp:popular-mcp': 300,
              'mcp:average-mcp': 60,
              'mcp:new-mcp': 100,
            };
          }
          if (date === yesterday) {
            return {
              'mcp:popular-mcp': 200,
              'mcp:average-mcp': 50,
              'mcp:new-mcp': 50,
            };
          }
          return {};
        }
      );

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [
              { content_slug: 'popular-mcp', content_type: 'mcp' },
              { content_slug: 'popular-mcp', content_type: 'mcp' },
              { content_slug: 'popular-mcp', content_type: 'mcp' },
              { content_slug: 'popular-mcp', content_type: 'mcp' },
              { content_slug: 'popular-mcp', content_type: 'mcp' },
              { content_slug: 'average-mcp', content_type: 'mcp' },
              { content_slug: 'new-mcp', content_type: 'mcp' },
            ],
            error: null,
          }),
        }),
      });

      const results = await calculateFeaturedForCategory('mcp', items);

      expect(results).toHaveLength(3);

      // Popular MCP should rank first (high engagement + good growth + decent freshness)
      expect(results[0]?.slug).toBe('popular-mcp');
      expect(results[0]?.finalScore).toBeGreaterThan(results[1]?.finalScore ?? 0);
    });
  });
});
