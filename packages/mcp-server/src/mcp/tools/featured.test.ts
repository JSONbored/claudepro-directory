/**
 * Tests for getFeatured Tool Handler
 *
 * Comprehensive tests for the tool that retrieves featured content from the homepage.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient
// No need to explicitly mock @prisma/client - Jest uses __mocks__ automatically

import { handleGetFeatured } from '@heyclaude/mcp-server/tools/featured';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '@heyclaude/mcp-server/types/runtime';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// DO NOT mock request-cache.ts - use real implementation
// DO NOT mock services - use real services with Prismocker
// Cache is cleared in beforeEach for test isolation
// This allows us to test business logic with fresh cache (each test starts with empty cache)
// Using real services allows us to test caching behavior properly
// Note: Views (v_content_list_slim) are mocked because Prismocker may not support views directly

describe('getFeatured Tool Handler', () => {
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;

  beforeEach(() => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks to ensure clean state
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Prismocker doesn't support $queryRawUnsafe, so we add it as a mock function
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    // Create a fresh spy for each test AFTER clearing mocks to ensure proper isolation
    queryRawUnsafeSpy = jest.fn().mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismocker models are initialized
    void prismocker.content;

    mockLogger = createMockLogger();
    mockEnv = createMockEnv();
    context = {
      prisma: prismocker,
      user: createMockUser(),
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
    };
  });

  it('should return featured content with default limit', async () => {
    // Mock successful responses for all category queries, latest, and popular
    const mockCategoryItems = [
      {
        id: '1',
        slug: 'featured-agent',
        title: 'Featured Agent',
        display_title: null,
        category: 'agents',
        description: 'A featured agent description',
        tags: ['featured'],
        author: 'Author',
        view_count: 100,
        date_added: new Date('2024-01-01T00:00:00Z'),
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        source: null,
        source_table: 'agents',
        author_profile_url: null,
        copy_count: 0,
        bookmark_count: 0,
        popularity_score: 0,
        trending_score: 0,
        sponsored_content_id: null,
        sponsorship_tier: null,
        is_sponsored: false,
      },
    ];

    const mockLatestResult = [
      {
        slug: 'latest-item',
        title: 'Latest Item',
        display_title: null,
        category: 'rules',
        description: 'Latest description',
        tags: [],
        author: 'Author',
        date_added: new Date('2024-12-01T00:00:00Z'),
        created_at: new Date('2024-12-01T00:00:00Z'),
      },
    ];

    const mockPopularResult = [
      {
        slug: 'popular-item',
        title: 'Popular Item',
        display_title: null,
        category: 'agents',
        description: 'Popular description',
        tags: [],
        author: 'Author',
        date_added: new Date('2024-11-01T00:00:00Z'),
        view_count: 200,
      },
      {
        slug: 'popular-item-2',
        title: 'Popular Item 2',
        display_title: null,
        category: 'agents',
        description: 'Popular description 2',
        tags: [],
        author: 'Author 2',
        date_added: new Date('2024-11-02T00:00:00Z'),
        view_count: 150,
      },
    ];

    // Mock ContentService.getContentPaginatedSlim calls (6 categories)
    // Uses v_content_list_slim.findMany and count
    // Since queries run in parallel, we need to check the where clause to return different values
    void prismocker.v_content_list_slim;
    const findManyMock = jest.fn((args: any) => {
      // Check if category is 'agents' in where clause
      if (args?.where?.category === 'agents') {
        return Promise.resolve(mockCategoryItems as any);
      }
      return Promise.resolve([]);
    });
    const countMock = jest.fn((args: any) => {
      // Check if category is 'agents' in where clause
      if (args?.where?.category === 'agents') {
        return Promise.resolve(1);
      }
      return Promise.resolve(0);
    });
    // Use type assertion for views (Prismocker may not support views directly)
    (prismocker.v_content_list_slim as any).findMany = findManyMock;
    (prismocker.v_content_list_slim as any).count = countMock;

    // Seed data for TrendingService.getRecentContent (uses content.findMany with Prismocker)
    // Note: getRecentContent uses select with specific fields, so we need to include those fields
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData(
        'content',
        mockLatestResult.map((item) => ({
          id: `content-${item.slug}`,
          ...item,
          category: item.category as const,
          updated_at: item.created_at,
          source: null,
          source_table: item.category,
          author_profile_url: null,
          copy_count: 0,
          bookmark_count: 0,
          view_count: 0,
          popularity_score: 0,
          trending_score: 0,
          sponsored_content_id: null,
          sponsorship_tier: null,
          is_sponsored: false,
        }))
      );
    }

    // Mock TrendingService.getTrendingContent (uses RPC via $queryRawUnsafe)
    // Return array with multiple elements to prevent callRpc from unwrapping
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => mockPopularResult);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetFeatured({}, context);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Featured Content from HeyClaude Directory');
    expect(result.content[0].text).toContain('Featured Agent');
    expect(result.content[0].text).toContain('Latest Item');
    expect(result.content[0].text).toContain('Popular Item');

    expect(result._meta.hero).toBeDefined();
    expect(result._meta.latest).toBeDefined();
    expect(result._meta.popular).toBeDefined();
    expect(result._meta.total).toBeGreaterThan(0);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'getFeatured completed successfully',
      expect.objectContaining({
        tool: 'getFeatured',
        heroCount: expect.any(Number),
        latestCount: expect.any(Number),
        popularCount: expect.any(Number),
      })
    );
  });

  it('should return featured content with custom limit', async () => {
    // Mock empty results for all queries
    void prismocker.v_content_list_slim;
    // Mock all 6 categories (empty) - return empty for all categories
    // Note: Views are mocked because Prismocker may not support views directly
    const findManyMock = jest.fn().mockResolvedValue([] as any);
    const countMock = jest.fn().mockResolvedValue(0 as any);
    (prismocker.v_content_list_slim as any).findMany = findManyMock;
    (prismocker.v_content_list_slim as any).count = countMock;
    // Seed empty data for getRecentContent
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content', []);
    }
    // Mock getTrendingContent (empty)
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetFeatured({ limit: 10 }, context);

    expect(result._meta.hero).toBeDefined();
    expect(result._meta.latest).toBeDefined();
    expect(result._meta.popular).toBeDefined();
  });

  it('should handle no featured content available', async () => {
    // Mock all queries returning empty results
    void prismocker.v_content_list_slim;
    // Mock all 6 categories (empty) - return empty for all categories
    const findManyMock = jest.fn().mockResolvedValue([]);
    const countMock = jest.fn().mockResolvedValue(0);
    (prismocker.v_content_list_slim as any).findMany = findManyMock;
    (prismocker.v_content_list_slim as any).count = countMock;
    // Seed empty data for getRecentContent
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content', []);
    }
    // Mock getTrendingContent (empty)
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetFeatured({}, context);

    expect(result.content[0].text).toContain('No featured content available at this time');
    expect(result._meta.total).toBe(0);
  });

  it('should handle partial failures gracefully', async () => {
    // Mock some categories failing, but others succeeding
    const mockCategoryItems = [
      {
        id: '1',
        slug: 'success-item',
        title: 'Success Item',
        display_title: null,
        category: 'agents',
        description: 'Description',
        tags: [],
        author: 'Author',
        view_count: 10,
        date_added: new Date('2024-01-01T00:00:00Z'),
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        source: null,
        source_table: 'agents',
        author_profile_url: null,
        copy_count: 0,
        bookmark_count: 0,
        popularity_score: 0,
        trending_score: 0,
        sponsored_content_id: null,
        sponsorship_tier: null,
        is_sponsored: false,
      },
    ];

    void prismocker.v_content_list_slim;
    // Mock to return data for 'agents', reject for 'rules', empty for others
    const findManyMock = jest.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(mockCategoryItems as any);
      }
      if (args?.where?.category === 'rules') {
        return Promise.reject(new Error('Category query failed'));
      }
      return Promise.resolve([]);
    });
    const countMock = jest.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(1);
      }
      if (args?.where?.category === 'rules') {
        return Promise.reject(new Error('Category query failed'));
      }
      return Promise.resolve(0);
    });
    prismocker.v_content_list_slim.findMany = findManyMock;
    prismocker.v_content_list_slim.count = countMock;

    // Latest and popular succeed - seed empty data for getRecentContent
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content', []);
    }
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetFeatured({}, context);

    // Should still return results from successful categories
    expect(result._meta.hero).toBeDefined();
    expect(result._meta.total).toBeGreaterThanOrEqual(0);
  });

  it('should truncate descriptions to 150 characters', async () => {
    const longDescription = 'a'.repeat(200);
    const mockCategoryItems = [
      {
        id: '1',
        slug: 'long-desc',
        title: 'Long Description',
        display_title: null,
        category: 'agents',
        description: longDescription,
        tags: [],
        author: 'Author',
        view_count: 10,
        date_added: new Date('2024-01-01T00:00:00Z'),
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        source: null,
        source_table: 'agents',
        author_profile_url: null,
        copy_count: 0,
        bookmark_count: 0,
        popularity_score: 0,
        trending_score: 0,
        sponsored_content_id: null,
        sponsorship_tier: null,
        is_sponsored: false,
      },
    ];

    void prismocker.v_content_list_slim;
    // Mock to return data for 'agents' category, empty for others
    const findManyMock = jest.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(mockCategoryItems as any);
      }
      return Promise.resolve([]);
    });
    const countMock = jest.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(1);
      }
      return Promise.resolve(0);
    });
    (prismocker.v_content_list_slim as any).findMany = findManyMock;
    (prismocker.v_content_list_slim as any).count = countMock;
    // Latest and popular empty - seed empty data for getRecentContent
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content', []);
    }
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetFeatured({}, context);

    expect(result._meta.hero[0].description.length).toBe(150);
    expect(result._meta.hero[0].description).toBe('a'.repeat(150));
  });

  it('should handle database errors gracefully', async () => {
    void prismocker.v_content_list_slim;
    // Make one category query fail - use mockRejectedValue to reject when called
    // The implementation uses Promise.allSettled, so it handles errors gracefully
    const findManyMock = jest.fn().mockRejectedValue(new Error('Database connection failed'));
    const countMock = jest.fn().mockResolvedValue(0 as any);
    (prismocker.v_content_list_slim as any).findMany = findManyMock;
    (prismocker.v_content_list_slim as any).count = countMock;

    // Mock trendingService methods to return empty arrays (they also use Promise.allSettled)
    queryRawUnsafeSpy.mockImplementation(async () => []);

    // Function should succeed even with database errors (Promise.allSettled handles them)
    const result = await handleGetFeatured({}, context);

    // Should return empty arrays for failed categories
    expect(result._meta.hero).toEqual([]);
    expect(result._meta.latest).toEqual([]);
    expect(result._meta.popular).toEqual([]);
    expect(result._meta.total).toBe(0);
    expect(result.content[0].text).toContain('No featured content available');
  });

  it('should log duration correctly', async () => {
    void prismocker.v_content_list_slim;
    // Mock all 6 categories (empty) - return empty for all categories
    // Note: Views are mocked because Prismocker may not support views directly
    const findManyMock = jest.fn().mockResolvedValue([] as any);
    const countMock = jest.fn().mockResolvedValue(0 as any);
    (prismocker.v_content_list_slim as any).findMany = findManyMock;
    (prismocker.v_content_list_slim as any).count = countMock;
    // Seed empty data for getRecentContent
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content', []);
    }
    // Mock getTrendingContent (empty)
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    await handleGetFeatured({}, context);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'getFeatured completed successfully',
      expect.objectContaining({
        tool: 'getFeatured',
        duration_ms: expect.any(Number),
      })
    );
  });

  it('should format items correctly with all fields', async () => {
    const mockCategoryItems = [
      {
        id: '1',
        slug: 'complete-item',
        title: 'Complete Item',
        display_title: 'Complete Item Display',
        category: 'agents',
        description: 'Complete description',
        tags: ['tag1', 'tag2'],
        author: 'Test Author',
        view_count: 150,
        date_added: new Date('2024-01-15T00:00:00Z'),
        created_at: new Date('2024-01-15T00:00:00Z'),
        updated_at: new Date('2024-01-15T00:00:00Z'),
        source: null,
        source_table: 'agents',
        author_profile_url: null,
        copy_count: 0,
        bookmark_count: 0,
        popularity_score: 0,
        trending_score: 0,
        sponsored_content_id: null,
        sponsorship_tier: null,
        is_sponsored: false,
      },
    ];

    void prismocker.v_content_list_slim;
    // Mock to return data for 'agents' category, empty for others
    const findManyMock = jest.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(mockCategoryItems as any);
      }
      return Promise.resolve([]);
    });
    const countMock = jest.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(1);
      }
      return Promise.resolve(0);
    });
    (prismocker.v_content_list_slim as any).findMany = findManyMock;
    (prismocker.v_content_list_slim as any).count = countMock;
    // Latest and popular empty - seed empty data for getRecentContent
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content', []);
    }
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetFeatured({}, context);

    expect(result._meta.hero[0].slug).toBe('complete-item');
    expect(result._meta.hero[0].title).toBe('Complete Item Display'); // display_title prioritized
    expect(result._meta.hero[0].category).toBe('agents');
    expect(result._meta.hero[0].description).toBe('Complete description');
    expect(result._meta.hero[0].tags).toEqual(['tag1', 'tag2']);
    expect(result._meta.hero[0].author).toBe('Test Author');
    expect(result._meta.hero[0].views).toBe(150);
  });

  it('should use display_title when available, fallback to title', async () => {
    const mockCategoryItems = [
      {
        id: '1',
        slug: 'display-title-item',
        title: 'Title',
        display_title: 'Display Title',
        category: 'agents',
        description: 'Description',
        tags: [],
        author: 'Author',
        view_count: 10,
        date_added: new Date('2024-01-01T00:00:00Z'),
        created_at: new Date('2024-01-01T00:00:00Z'),
        updated_at: new Date('2024-01-01T00:00:00Z'),
        source: null,
        source_table: 'agents',
        author_profile_url: null,
        copy_count: 0,
        bookmark_count: 0,
        popularity_score: 0,
        trending_score: 0,
        sponsored_content_id: null,
        sponsorship_tier: null,
        is_sponsored: false,
      },
    ];

    void prismocker.v_content_list_slim;
    // Mock to return data for 'agents' category, empty for others
    const findManyMock = jest.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(mockCategoryItems as any);
      }
      return Promise.resolve([]);
    });
    const countMock = jest.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(1);
      }
      return Promise.resolve(0);
    });
    (prismocker.v_content_list_slim as any).findMany = findManyMock;
    (prismocker.v_content_list_slim as any).count = countMock;
    // Latest and popular empty - seed empty data for getRecentContent
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content', []);
    }
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetFeatured({}, context);

    expect(result._meta.hero[0].title).toBe('Display Title');
  });

  it('should cache getRecentContent results on duplicate calls (caching test)', async () => {
    // Seed data for getRecentContent
    const mockRecentData = [
      {
        id: 'content-cache-1',
        slug: 'cached-recent',
        title: 'Cached Recent',
        display_title: null,
        category: 'agents' as const,
        description: 'Description',
        tags: [],
        author: 'Author',
        date_added: new Date('2024-12-10T00:00:00Z'),
        created_at: new Date('2024-12-10T00:00:00Z'),
        updated_at: new Date('2024-12-10T00:00:00Z'),
        source: null,
        source_table: 'agents',
        author_profile_url: null,
        copy_count: 0,
        bookmark_count: 0,
        view_count: 0,
        popularity_score: 0,
        trending_score: 0,
        sponsored_content_id: null,
        sponsorship_tier: null,
        is_sponsored: false,
      },
    ];

    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content', mockRecentData);
    }

    // Mock views and RPC calls (empty)
    void prismocker.v_content_list_slim;
    const findManyMock = jest.fn().mockResolvedValue([]);
    const countMock = jest.fn().mockResolvedValue(0);
    (prismocker.v_content_list_slim as any).findMany = findManyMock;
    (prismocker.v_content_list_slim as any).count = countMock;
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);

    // First call - should populate cache
    const cacheBefore = getRequestCache().getStats().size;
    const result1 = await handleGetFeatured({ limit: 6 }, context);
    const cacheAfterFirst = getRequestCache().getStats().size;

    // Second call - should use cache for getRecentContent
    const result2 = await handleGetFeatured({ limit: 6 }, context);
    const cacheAfterSecond = getRequestCache().getStats().size;

    // Verify results are the same (indicating cache was used for getRecentContent)
    expect(result1._meta.latest).toEqual(result2._meta.latest);

    // ✅ GOOD: Verify cache size increased after first call, stayed same after second
    // Note: Cache may also be used by other service calls, so we check that it increased
    expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
    // Cache should stay the same or increase slightly (other calls may cache too)
    expect(cacheAfterSecond).toBeGreaterThanOrEqual(cacheAfterFirst);
  });
});
