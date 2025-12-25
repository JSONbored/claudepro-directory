/**
 * Integration Tests for MCP Tool Handlers
 *
 * Tests tool handlers with real services (ContentService, TrendingService, SearchService)
 * using Prismocker to verify end-to-end integration including caching behavior.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

import { handleGetRecent } from '@heyclaude/mcp-server/tools/recent';
import { handleGetFeatured } from '@heyclaude/mcp-server/tools/featured';
import { handleListCategories } from '@heyclaude/mcp-server/tools/categories';
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
// These are integration tests that verify the full stack: tool → service → Prisma → cache

describe('MCP Tool Handlers Integration Tests', () => {
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

    // 5. Set fixed time for date calculations
    jest.setSystemTime(new Date('2024-12-15T00:00:00Z'));

    // 6. Prismocker doesn't support $queryRawUnsafe, so we add it as a mock function
    queryRawUnsafeSpy = jest.fn().mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // 7. Ensure Prismocker models are initialized
    void prismocker.content;
    void prismocker.category_configs;
    void prismocker.v_content_list_slim;

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

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Tool Handler → Service → Prisma Integration', () => {
    it('should integrate getRecent with TrendingService.getRecentContent', async () => {
      // Seed data using Prismocker's setData method
      const mockRecentData = [
        {
          id: 'content-integration-1',
          slug: 'integration-item',
          title: 'Integration Item',
          display_title: null,
          category: 'agents' as const,
          description: 'Integration test description',
          tags: ['integration', 'test'],
          author: 'Test Author',
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

      // Call tool handler (uses real TrendingService with Prismocker)
      const result = await handleGetRecent({ limit: 20 }, context);

      // Verify tool handler processed service results correctly
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Integration Item');
      expect(result._meta.items).toHaveLength(1);
      expect(result._meta.items[0].slug).toBe('integration-item');
      expect(result._meta.items[0].title).toBe('Integration Item');

      // Verify service was called (logger should have logged)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'getRecent completed successfully',
        expect.objectContaining({
          tool: 'getRecent',
          resultCount: 1,
        })
      );
    });

    it('should integrate listCategories with ContentService.getCategoryConfigs and SearchService.getSearchFacets', async () => {
      // Seed data for getCategoryConfigs
      const mockCategoryConfigs = [
        {
          category: 'agents' as const,
          title: 'AI Agents',
          description: 'AI agent configurations',
          icon_name: 'robot',
          plural_title: null,
          keywords: null,
          meta_description: null,
          search_placeholder: null,
          empty_state_message: null,
          url_slug: null,
          content_loader: null,
          config_format: null,
          primary_action_type: null,
          primary_action_label: null,
          primary_action_config: null,
          validation_config: null,
          generation_config: null,
          schema_name: null,
          api_schema: null,
          metadata_fields: null,
          badges: null,
          sections: null,
          show_on_homepage: true,
          color_scheme: null,
          display_config: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockCategoryConfigs);
      }

      // Mock RPC call for getSearchFacets
      const mockFacetsArray = [{ category: 'agents', content_count: 10 }];
      queryRawUnsafeSpy.mockResolvedValue(mockFacetsArray);

      // Call tool handler (uses real ContentService and SearchService with Prismocker)
      const result = await handleListCategories({}, context);

      // Verify tool handler processed service results correctly
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('AI Agents (agents): 10 items');
      expect(result._meta.categories).toHaveLength(1);
      expect(result._meta.categories[0]).toEqual({
        name: 'AI Agents',
        slug: 'agents',
        description: 'AI agent configurations',
        count: 10,
        icon: 'robot',
      });

      // Verify services were called (logger should have logged)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'listCategories completed successfully',
        expect.objectContaining({
          tool: 'listCategories',
          categoryCount: 1,
        })
      );
    });

    it('should integrate getFeatured with ContentService and TrendingService', async () => {
      // Seed data for getRecentContent (TrendingService)
      const mockRecentData = [
        {
          id: 'content-featured-1',
          slug: 'featured-recent',
          title: 'Featured Recent',
          display_title: null,
          category: 'agents' as const,
          description: 'Recent description',
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

      // Mock views for getContentPaginatedSlim (ContentService)
      const findManyMock = jest.fn().mockResolvedValue([] as any);
      const countMock = jest.fn().mockResolvedValue(0 as any);
      (prismocker.v_content_list_slim as any).findMany = findManyMock;
      (prismocker.v_content_list_slim as any).count = countMock;

      // Mock RPC call for getTrendingContent (TrendingService)
      queryRawUnsafeSpy.mockResolvedValue([]);

      // Call tool handler (uses real ContentService and TrendingService with Prismocker)
      const result = await handleGetFeatured({ limit: 6 }, context);

      // Verify tool handler processed service results correctly
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result._meta.hero).toBeDefined();
      expect(result._meta.latest).toBeDefined();
      expect(result._meta.popular).toBeDefined();

      // Verify services were called (logger should have logged)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'getFeatured completed successfully',
        expect.objectContaining({
          tool: 'getFeatured',
        })
      );
    });
  });

  describe('Cross-Tool Cache Integration', () => {
    it('should share cache across multiple tool calls in same request context', async () => {
      // Seed data for getRecentContent
      const mockRecentData = [
        {
          id: 'content-shared-1',
          slug: 'shared-item',
          title: 'Shared Item',
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

      // Seed data for getCategoryConfigs
      const mockCategoryConfigs = [
        {
          category: 'agents' as const,
          title: 'AI Agents',
          description: 'AI agent configurations',
          icon_name: 'robot',
          plural_title: null,
          keywords: null,
          meta_description: null,
          search_placeholder: null,
          empty_state_message: null,
          url_slug: null,
          content_loader: null,
          config_format: null,
          primary_action_type: null,
          primary_action_label: null,
          primary_action_config: null,
          validation_config: null,
          generation_config: null,
          schema_name: null,
          api_schema: null,
          metadata_fields: null,
          badges: null,
          sections: null,
          show_on_homepage: true,
          color_scheme: null,
          display_config: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('category_configs', mockCategoryConfigs);
      }

      // Mock RPC calls
      queryRawUnsafeSpy.mockResolvedValue([{ category: 'agents', content_count: 1 }]);

      // First tool call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await handleGetRecent({ limit: 20 }, context);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second tool call (different tool, but may use same service methods)
      const result2 = await handleListCategories({}, context);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify both tools work
      expect(result1._meta.items).toHaveLength(1);
      expect(result2._meta.categories).toHaveLength(1);

      // Verify cache was used (cache size should increase after first call)
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      // Cache may increase further with second call (different service methods)
      expect(cacheAfterSecond).toBeGreaterThanOrEqual(cacheAfterFirst);
    });

    it('should cache getRecentContent results and reuse across multiple getRecent calls', async () => {
      // Seed data
      const mockRecentData = [
        {
          id: 'content-cache-shared-1',
          slug: 'cached-shared',
          title: 'Cached Shared',
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

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await handleGetRecent({ limit: 20 }, context);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args - should use cache
      const result2 = await handleGetRecent({ limit: 20 }, context);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle service errors and propagate to tool handler', async () => {
      // Override findMany to throw an error
      const findManyMock = jest.fn().mockRejectedValue(new Error('Service error') as any);
      (prismocker.content as any).findMany = findManyMock;

      // Tool handler should catch and log the error
      await expect(handleGetRecent({ limit: 20 }, context)).rejects.toThrow('Service error');

      // Verify error was logged by tool handler
      expect(mockLogger.error).toHaveBeenCalledWith(
        'getRecent tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'getRecent',
        })
      );
    });

    it('should handle partial service failures gracefully (Promise.allSettled)', async () => {
      // Seed data for getRecentContent (will succeed)
      const mockRecentData = [
        {
          id: 'content-partial-1',
          slug: 'partial-item',
          title: 'Partial Item',
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

      // Mock views to fail (getContentPaginatedSlim will fail)
      const findManyMock = jest.fn().mockRejectedValue(new Error('View query failed') as any);
      const countMock = jest.fn().mockResolvedValue(0 as any);
      (prismocker.v_content_list_slim as any).findMany = findManyMock;
      (prismocker.v_content_list_slim as any).count = countMock;

      // Mock RPC to fail (getTrendingContent will fail)
      queryRawUnsafeSpy.mockRejectedValue(new Error('RPC failed') as any);

      // getFeatured uses Promise.allSettled, so it should handle failures gracefully
      const result = await handleGetFeatured({ limit: 6 }, context);

      // Should still return results from successful service calls
      expect(result._meta.latest).toBeDefined();
      // Failed calls should result in empty arrays
      expect(result._meta.hero).toEqual([]);
      expect(result._meta.popular).toEqual([]);
    });
  });
});
