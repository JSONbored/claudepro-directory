/**
 * Tests for getRecent Tool Handler
 *
 * Comprehensive tests for the tool that retrieves recent content.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient
// No need to explicitly mock @prisma/client - Jest uses __mocks__ automatically

import { handleGetRecent } from '@heyclaude/mcp-server/tools/recent';
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

describe('getRecent Tool Handler', () => {
  let prismocker: PrismaClient;
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

    // 5. Set fixed time for date calculations (Jest supports setSystemTime)
    jest.setSystemTime(new Date('2024-12-15T00:00:00Z'));

    // 6. Ensure Prismocker models are initialized (lazy-loaded, so access to trigger initialization)
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

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return recent content without category filter', async () => {
    // Seed data using Prismocker's setData method (with type check for safety)
    const mockRecentData = [
      {
        id: 'content-1',
        slug: 'recent-item',
        title: 'Recent Item',
        display_title: null,
        category: 'agents' as const,
        description: 'Recent description',
        tags: ['recent'],
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

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Recently Added Content');
    expect(result.content[0].text).toContain('Recent Item');
    expect(result._meta.items).toHaveLength(1);
    expect(result._meta.items[0].slug).toBe('recent-item');
    expect(result._meta.items[0].title).toBe('Recent Item');
    expect(result._meta.items[0].category).toBe('agents');
    expect(result._meta.category).toBe('all');
    expect(result._meta.count).toBe(1);
    expect(result._meta.limit).toBe(20);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'getRecent completed successfully',
      expect.objectContaining({
        tool: 'getRecent',
        resultCount: 1,
      })
    );
  });

  it('should return recent content with category filter', async () => {
    // Seed data using Prismocker's setData method
    const mockRecentData = [
      {
        id: 'content-2',
        slug: 'recent-agent',
        title: 'Recent Agent',
        display_title: null,
        category: 'agents' as const,
        description: 'Agent description',
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

    const result = await handleGetRecent({ category: 'agents', limit: 10 }, context);

    expect(result._meta.items[0].category).toBe('agents');
    expect(result._meta.category).toBe('agents');
    expect(result.content[0].text).toContain('in agents');
  });

  it('should return empty results when no recent content found', async () => {
    // Seed empty data
    if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
      (prismocker as any).setData('content', []);
    }

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result.content[0].text).toContain('No recent content found');
    expect(result._meta.items).toHaveLength(0);
    expect(result._meta.count).toBe(0);
    expect(result._meta.pagination.total).toBe(0);
    expect(result._meta.pagination.hasMore).toBe(false);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'getRecent completed with no results',
      expect.objectContaining({
        tool: 'getRecent',
        resultCount: 0,
      })
    );
  });

  it('should format relative dates correctly (Today)', async () => {
    const today = new Date('2024-12-15T12:00:00Z');
    jest.setSystemTime(today);

    // Seed data using Prismocker's setData method
    const mockRecentData = [
      {
        id: 'content-3',
        slug: 'today-item',
        title: 'Today Item',
        display_title: null,
        category: 'agents' as const,
        description: 'Description',
        tags: [],
        author: 'Author',
        date_added: today,
        created_at: today,
        updated_at: today,
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

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result.content[0].text).toContain('Today');
  });

  it('should format relative dates correctly (Yesterday)', async () => {
    const today = new Date('2024-12-15T00:00:00Z');
    const yesterday = new Date('2024-12-14T00:00:00Z');
    jest.setSystemTime(today);

    // Seed data using Prismocker's setData method
    const mockRecentData = [
      {
        id: 'content-4',
        slug: 'yesterday-item',
        title: 'Yesterday Item',
        display_title: null,
        category: 'agents' as const,
        description: 'Description',
        tags: [],
        author: 'Author',
        date_added: yesterday,
        created_at: yesterday,
        updated_at: yesterday,
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

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result.content[0].text).toContain('Yesterday');
  });

  it('should format relative dates correctly (days ago)', async () => {
    const today = new Date('2024-12-15T00:00:00Z');
    const threeDaysAgo = new Date('2024-12-12T00:00:00Z');
    jest.setSystemTime(today);

    // Seed data using Prismocker's setData method
    const mockRecentData = [
      {
        id: 'content-5',
        slug: 'days-ago-item',
        title: 'Days Ago Item',
        display_title: null,
        category: 'agents' as const,
        description: 'Description',
        tags: [],
        author: 'Author',
        date_added: threeDaysAgo,
        created_at: threeDaysAgo,
        updated_at: threeDaysAgo,
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

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result.content[0].text).toContain('3 days ago');
  });

  it('should truncate descriptions to 150 characters', async () => {
    const longDescription = 'a'.repeat(200);
    // Seed data using Prismocker's setData method
    const mockRecentData = [
      {
        id: 'content-6',
        slug: 'long-desc',
        title: 'Long Description',
        display_title: null,
        category: 'agents' as const,
        description: longDescription,
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

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result._meta.items[0].description.length).toBe(150);
  });

  it('should use display_title when available', async () => {
    // Seed data using Prismocker's setData method
    const mockRecentData = [
      {
        id: 'content-7',
        slug: 'display-title',
        title: 'Title',
        display_title: 'Display Title',
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

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result._meta.items[0].title).toBe('Display Title');
  });

  it('should handle missing optional fields gracefully', async () => {
    // Seed data using Prismocker's setData method
    const mockRecentData = [
      {
        id: 'content-8',
        slug: 'minimal-item',
        title: null,
        display_title: null,
        category: 'agents' as const,
        description: null,
        tags: null,
        author: null,
        date_added: null,
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

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result._meta.items[0].title).toBe('');
    expect(result._meta.items[0].description).toBe('');
    expect(result._meta.items[0].tags).toEqual([]);
    expect(result._meta.items[0].author).toBe('Unknown');
    expect(result._meta.items[0].dateAdded).toBeNull();
  });

  it('should handle database errors', async () => {
    // Override findMany to throw an error using Prismocker's Proxy set handler
    // Use type assertion to bypass TypeScript's strict typing for error testing
    const findManyMock = jest.fn().mockRejectedValue(new Error('Database error') as any);
    (prismocker.content as any).findMany = findManyMock;

    await expect(handleGetRecent({ limit: 20 }, context)).rejects.toThrow('Database error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'getRecent tool error',
      expect.any(Error),
      expect.objectContaining({
        tool: 'getRecent',
      })
    );
  });

  it('should limit tags to 5 in text summary', async () => {
    // Seed data using Prismocker's setData method
    const mockRecentData = [
      {
        id: 'content-9',
        slug: 'many-tags',
        title: 'Many Tags',
        display_title: null,
        category: 'agents' as const,
        description: 'Description',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'],
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

    const result = await handleGetRecent({ limit: 20 }, context);

    // Tags in _meta should include all tags
    expect(result._meta.items[0].tags).toHaveLength(7);
    // But text summary should only show first 5
    const tagsInText = result.content[0].text.match(/Tags: (.+)/)?.[1];
    expect(tagsInText?.split(', ').length).toBeLessThanOrEqual(5);
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    // Seed data using Prismocker's setData method
    const mockRecentData = [
      {
        id: 'content-cache-1',
        slug: 'cached-item',
        title: 'Cached Item',
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

    // Second call - should use cache
    const result2 = await handleGetRecent({ limit: 20 }, context);
    const cacheAfterSecond = getRequestCache().getStats().size;

    // Verify results are the same (indicating cache was used)
    expect(result1).toEqual(result2);

    // ✅ GOOD: Verify cache size increased after first call, stayed same after second
    expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
    expect(cacheAfterSecond).toBe(cacheAfterFirst);
  });
});
