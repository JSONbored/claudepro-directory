/**
 * Tests for getFeatured Tool Handler
 *
 * Comprehensive tests for the tool that retrieves featured content from the homepage.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @prisma/client to use PrismockerClient from __mocks__/@prisma/client.ts
// This must be called before any imports that use PrismaClient
// Vitest will hoist this call to the top of the file
vi.mock('@prisma/client');

import { handleGetFeatured } from '../../../../../packages/mcp-server/src/mcp/tools/featured.js';
import { createMockLogger, createMockEnv, createMockUser, createMockToken, createMockKvCache } from '../../fixtures/test-utils.js';
import type { ToolContext } from '../../../../../packages/mcp-server/src/types/runtime.js';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Mock request cache to completely bypass caching
// Services import using relative paths (../utils/request-cache.ts), so we need to mock the actual file path
const { mockWithSmartCache, mockClearRequestCache } = vi.hoisted(() => {
  return {
    mockWithSmartCache: vi.fn((_rpcName: string, _methodName: string, rpcCall: () => Promise<unknown>) => {
      // Always call the RPC directly, never cache
      return rpcCall();
    }),
    mockClearRequestCache: vi.fn(() => {
      // Clear function - no-op since we're bypassing caching entirely
    }),
  };
});

// Mock the actual file path that services import from (relative path from service files)
// This matches the pattern used in other data-layer service tests
vi.mock('../../../../../packages/data-layer/src/utils/request-cache.ts', () => ({
  withSmartCache: mockWithSmartCache,
  withRequestCache: vi.fn((_rpcName: string, rpcCall: () => Promise<unknown>) => rpcCall()),
  clearRequestCache: mockClearRequestCache,
  getRequestCache: vi.fn(() => ({
    get: vi.fn(() => null),
    set: vi.fn(),
    clear: vi.fn(),
  })),
}));

describe('getFeatured Tool Handler', () => {
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;

  /**
   * Helper to safely mock Prismocker model methods
   */
  function mockPrismockerMethod<T>(
    model: any,
    method: string,
    returnValue: T
  ): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismocker model does not exist - check if model name matches schema.prisma`);
    }
    const mockFn = vi.fn().mockResolvedValue(returnValue as any);
    model[method] = mockFn;
    return mockFn;
  }

  beforeEach(() => {
    // Use the prisma singleton (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test (must be before clearAllMocks)
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks to ensure clean state
    mockClearRequestCache();
    vi.clearAllMocks();
    vi.resetAllMocks();
    mockWithSmartCache.mockClear();

    // Prismocker doesn't support $queryRawUnsafe, so we add it as a mock function
    // Create a fresh spy for each test AFTER clearing mocks to ensure proper isolation
    queryRawUnsafeSpy = vi.fn().mockImplementation(async () => []);
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
    const findManyMock = vi.fn((args: any) => {
      // Check if category is 'agents' in where clause
      if (args?.where?.category === 'agents') {
        return Promise.resolve(mockCategoryItems as any);
      }
      return Promise.resolve([]);
    });
    const countMock = vi.fn((args: any) => {
      // Check if category is 'agents' in where clause
      if (args?.where?.category === 'agents') {
        return Promise.resolve(1);
      }
      return Promise.resolve(0);
    });
    prismocker.v_content_list_slim.findMany = findManyMock;
    prismocker.v_content_list_slim.count = countMock;

    // Mock TrendingService.getRecentContent (uses content.findMany)
    mockPrismockerMethod(prismocker.content, 'findMany', mockLatestResult);

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
    mockPrismockerMethod(prismocker.v_content_list_slim, 'findMany', []);
    mockPrismockerMethod(prismocker.v_content_list_slim, 'count', 0);
    // Mock getRecentContent (empty)
    mockPrismockerMethod(prismocker.content, 'findMany', []);
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
    mockPrismockerMethod(prismocker.v_content_list_slim, 'findMany', []);
    mockPrismockerMethod(prismocker.v_content_list_slim, 'count', 0);
    // Mock getRecentContent (empty)
    mockPrismockerMethod(prismocker.content, 'findMany', []);
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
    const findManyMock = vi.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(mockCategoryItems as any);
      }
      if (args?.where?.category === 'rules') {
        return Promise.reject(new Error('Category query failed'));
      }
      return Promise.resolve([]);
    });
    const countMock = vi.fn((args: any) => {
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

    // Latest and popular succeed
    mockPrismockerMethod(prismocker.content, 'findMany', []);
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
    const findManyMock = vi.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(mockCategoryItems as any);
      }
      return Promise.resolve([]);
    });
    const countMock = vi.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(1);
      }
      return Promise.resolve(0);
    });
    prismocker.v_content_list_slim.findMany = findManyMock;
    prismocker.v_content_list_slim.count = countMock;
    // Latest and popular empty
    mockPrismockerMethod(prismocker.content, 'findMany', []);
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
    const findManyMock = vi.fn().mockRejectedValue(new Error('Database connection failed'));
    const countMock = vi.fn().mockResolvedValue(0);
    prismocker.v_content_list_slim.findMany = findManyMock;
    prismocker.v_content_list_slim.count = countMock;

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
    mockPrismockerMethod(prismocker.v_content_list_slim, 'findMany', []);
    mockPrismockerMethod(prismocker.v_content_list_slim, 'count', 0);
    // Mock getRecentContent (empty)
    mockPrismockerMethod(prismocker.content, 'findMany', []);
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
    const findManyMock = vi.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(mockCategoryItems as any);
      }
      return Promise.resolve([]);
    });
    const countMock = vi.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(1);
      }
      return Promise.resolve(0);
    });
    prismocker.v_content_list_slim.findMany = findManyMock;
    prismocker.v_content_list_slim.count = countMock;
    // Latest and popular empty
    mockPrismockerMethod(prismocker.content, 'findMany', []);
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
    const findManyMock = vi.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(mockCategoryItems as any);
      }
      return Promise.resolve([]);
    });
    const countMock = vi.fn((args: any) => {
      if (args?.where?.category === 'agents') {
        return Promise.resolve(1);
      }
      return Promise.resolve(0);
    });
    prismocker.v_content_list_slim.findMany = findManyMock;
    prismocker.v_content_list_slim.count = countMock;
    // Latest and popular empty
    mockPrismockerMethod(prismocker.content, 'findMany', []);
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetFeatured({}, context);

    expect(result._meta.hero[0].title).toBe('Display Title');
  });
});

