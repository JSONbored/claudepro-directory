/**
 * Tests for getTrending Tool Handler
 *
 * Comprehensive tests for the tool that retrieves trending content.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient
// No need to explicitly mock @prisma/client - Jest uses __mocks__ automatically

import { handleGetTrending } from '@heyclaude/mcp-server/tools/trending';
import { createMockLogger, createMockEnv, createMockUser, createMockToken, createMockKvCache } from '../../fixtures/test-utils.js';
import type { ToolContext } from '@heyclaude/mcp-server/types/runtime';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Import real cache utilities for proper cache testing
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// DO NOT mock request-cache.ts - use real implementation
// Cache is cleared in beforeEach for test isolation
// This allows us to test business logic with fresh cache (each test starts with empty cache)

describe('getTrending Tool Handler', () => {
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

  it('should return trending content without category filter', async () => {
    const mockTrendingData = [
      {
        slug: 'trending-item',
        title: 'Trending Item',
        display_title: null,
        category: 'agents',
        description: 'Trending description',
        tags: ['trending'],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 1000,
      },
      {
        slug: 'trending-item-2',
        title: 'Trending Item 2',
        display_title: null,
        category: 'agents',
        description: 'Trending description 2',
        tags: ['trending'],
        author: 'Author 2',
        date_added: new Date('2024-01-02T00:00:00Z'),
        view_count: 500,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => mockTrendingData);

    const result = await handleGetTrending({ limit: 20 }, context);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Trending Content');
    expect(result.content[0].text).toContain('Trending Item');
    expect(result._meta.items).toHaveLength(2);
    // Find items by slug to be robust
    const item1 = result._meta.items.find(item => item.slug === 'trending-item');
    const item2 = result._meta.items.find(item => item.slug === 'trending-item-2');
    expect(item1).toBeDefined();
    expect(item2).toBeDefined();
    expect(item1!.title).toBe('Trending Item');
    expect(item1!.category).toBe('agents');
    expect(item1!.views).toBe(1000);
    expect(result._meta.category).toBe('all');
    expect(result._meta.count).toBe(2);
    expect(result._meta.limit).toBe(20);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'getTrending completed successfully',
      expect.objectContaining({
        tool: 'getTrending',
        resultCount: 2,
      })
    );
  });

  it('should return trending content with category filter', async () => {
    const mockTrendingData = [
      {
        slug: 'trending-agent',
        title: 'Trending Agent',
        display_title: null,
        category: 'agents',
        description: 'Agent description',
        tags: [],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 500,
      },
      {
        slug: 'trending-agent-2',
        title: 'Trending Agent 2',
        display_title: null,
        category: 'agents',
        description: 'Agent description 2',
        tags: [],
        author: 'Author 2',
        date_added: new Date('2024-01-02T00:00:00Z'),
        view_count: 300,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => mockTrendingData);
    // Re-attach spy to prismocker after reset to ensure it's used
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetTrending({ category: 'agents', limit: 10 }, context);

    expect(result._meta.items[0].category).toBe('agents');
    expect(result._meta.category).toBe('agents');
    expect(result.content[0].text).toContain('in agents');
  });

  it('should return empty results when no trending content found', async () => {
    // Empty array should be returned as-is by callRpc for array-return functions
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);
    // Re-attach spy to prismocker after reset to ensure it's used
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetTrending({ limit: 20 }, context);

    expect(result.content[0].text).toContain('No trending content found');
    expect(result._meta.items).toHaveLength(0);
    expect(result._meta.count).toBe(0);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'getTrending completed with no results',
      expect.objectContaining({
        tool: 'getTrending',
        resultCount: 0,
      })
    );
  });

  it('should truncate descriptions to 150 characters', async () => {
    const longDescription = 'a'.repeat(200);
    const mockTrendingData = [
      {
        slug: 'long-desc',
        title: 'Long Description',
        display_title: null,
        category: 'agents',
        description: longDescription,
        tags: [],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 10,
      },
      {
        slug: 'long-desc-2',
        title: 'Long Description 2',
        display_title: null,
        category: 'agents',
        description: 'Short description',
        tags: [],
        author: 'Author 2',
        date_added: new Date('2024-01-02T00:00:00Z'),
        view_count: 5,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => mockTrendingData);
    // Re-attach spy to prismocker after reset to ensure it's used
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetTrending({ limit: 20 }, context);

    // Check that we have 2 items
    expect(result._meta.items).toHaveLength(2);
    // Find the item with long description by slug (more robust than index)
    const longDescItem = result._meta.items.find(item => item.slug === 'long-desc');
    expect(longDescItem).toBeDefined();
    expect(longDescItem!.description.length).toBe(150);
  });

  it('should handle missing optional fields gracefully', async () => {
    const mockTrendingData = [
      {
        slug: 'minimal-item',
        title: null,
        display_title: null,
        category: 'agents',
        description: null,
        tags: null,
        author: null,
        date_added: null,
        view_count: null,
      },
      {
        slug: 'minimal-item-2',
        title: 'Item 2',
        display_title: null,
        category: 'agents',
        description: 'Description 2',
        tags: [],
        author: 'Author 2',
        date_added: new Date('2024-01-02T00:00:00Z'),
        view_count: 10,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => mockTrendingData);
    // Re-attach spy to prismocker after reset to ensure it's used
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetTrending({ limit: 20 }, context);

    // Check that we have 2 items
    expect(result._meta.items).toHaveLength(2);
    // First item should have null fields (minimal item)
    expect(result._meta.items[0].title).toBe('Untitled');
    expect(result._meta.items[0].description).toBe('');
    expect(result._meta.items[0].tags).toEqual([]);
    expect(result._meta.items[0].author).toBe('Unknown');
    expect(result._meta.items[0].dateAdded).toBeNull();
    expect(result._meta.items[0].views).toBe(0);
    expect(result._meta.items[0].slug).toBe('minimal-item');
  });

  it('should use display_title when available, fallback to title', async () => {
    const mockTrendingData = [
      {
        slug: 'display-title',
        title: 'Title',
        display_title: 'Display Title',
        category: 'agents',
        description: 'Description',
        tags: [],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 10,
      },
      {
        slug: 'display-title-2',
        title: 'Title 2',
        display_title: null,
        category: 'agents',
        description: 'Description 2',
        tags: [],
        author: 'Author 2',
        date_added: new Date('2024-01-02T00:00:00Z'),
        view_count: 5,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => mockTrendingData);
    // Re-attach spy to prismocker after reset to ensure it's used
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetTrending({ limit: 20 }, context);

    // Check that we have 2 items
    expect(result._meta.items).toHaveLength(2);
    // First item should use display_title when available
    expect(result._meta.items[0].title).toBe('Display Title');
    expect(result._meta.items[0].slug).toBe('display-title');
  });

  it('should format text summary with views and tags', async () => {
    const mockTrendingData = [
      {
        slug: 'highly-viewed',
        title: 'Highly Viewed',
        display_title: null,
        category: 'agents',
        description: 'Description',
        tags: ['tag1', 'tag2', 'tag3'],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 5000,
      },
      {
        slug: 'highly-viewed-2',
        title: 'Highly Viewed 2',
        display_title: null,
        category: 'agents',
        description: 'Description 2',
        tags: ['tag4', 'tag5'],
        author: 'Author 2',
        date_added: new Date('2024-01-02T00:00:00Z'),
        view_count: 3000,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => mockTrendingData);
    // Re-attach spy to prismocker after reset to ensure it's used
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    const result = await handleGetTrending({ limit: 20 }, context);

    // Check that we have 2 items
    expect(result._meta.items).toHaveLength(2);
    // First item should have high view count
    expect(result._meta.items[0].views).toBe(5000);
    expect(result._meta.items[0].slug).toBe('highly-viewed');
    expect(result.content[0].text).toContain('Views: 5000');
    expect(result.content[0].text).toContain('Tags:');
    // Should show first 3 tags
    expect(result.content[0].text).toContain('tag1');
  });

  it('should handle database errors', async () => {
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => {
      throw new Error('Database error');
    });
    // Re-attach spy to prismocker after reset to ensure it's used
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    await expect(handleGetTrending({ limit: 20 }, context)).rejects.toThrow('Database error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'getTrending tool error',
      expect.any(Error),
      expect.objectContaining({
        tool: 'getTrending',
      })
    );
  });

  it('should log duration correctly', async () => {
    // Empty array should be returned as-is by callRpc for array-return functions
    queryRawUnsafeSpy.mockImplementation(async () => []);

    await handleGetTrending({ limit: 20 }, context);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        tool: 'getTrending',
        duration_ms: expect.any(Number),
      })
    );
  });
});

