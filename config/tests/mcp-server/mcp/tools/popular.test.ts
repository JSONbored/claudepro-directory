/**
 * Tests for getPopular Tool Handler
 *
 * Comprehensive tests for the tool that retrieves popular content.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient
// No need to explicitly mock @prisma/client - Jest uses __mocks__ automatically

import { handleGetPopular } from '@heyclaude/mcp-server/tools/popular';
import { createMockLogger, createMockEnv, createMockUser, createMockToken, createMockKvCache } from '../../fixtures/test-utils.js';
import type { ToolContext } from '@heyclaude/mcp-server/types/runtime';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Import real cache utilities for proper cache testing
import { clearRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// DO NOT mock request-cache.ts - use real implementation
// Cache is cleared in beforeEach for test isolation
// This allows us to test business logic with fresh cache (each test starts with empty cache)

describe('getPopular Tool Handler', () => {
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

  it('should return popular content without category filter', async () => {
    const mockPopularData = [
      {
        slug: 'popular-item-1',
        title: 'Popular Item 1',
        category: 'agents',
        description: 'Popular description 1',
        tags: ['popular'],
        author: 'Author 1',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 100,
        bookmark_count: 10,
      },
      {
        slug: 'popular-item-2',
        title: 'Popular Item 2',
        category: 'skills',
        description: 'Popular description 2',
        tags: ['trending'],
        author: 'Author 2',
        date_added: new Date('2024-01-02T00:00:00Z'),
        view_count: 200,
        bookmark_count: 20,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => mockPopularData);

    const result = await handleGetPopular({ limit: 20 }, context);

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Popular Content');
    expect(result.content[0].text).toContain('Popular Item 1');
    expect(result.content[0].text).toContain('Popular Item 2');
    expect(result._meta.items.length).toBe(2);
    expect(result._meta.items[0].slug).toBe('popular-item-1');
    expect(result._meta.items[0].title).toBe('Popular Item 1');
    expect(result._meta.items[0].category).toBe('agents');
    expect(result._meta.items[0].stats.views).toBe(100);
    expect(result._meta.items[0].stats.bookmarks).toBe(10);
    expect(result._meta.items[1].slug).toBe('popular-item-2');
    expect(result._meta.items[1].title).toBe('Popular Item 2');
    expect(result._meta.category).toBe('all');
    expect(result._meta.count).toBe(2);
    expect(result._meta.limit).toBe(20);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'getPopular completed successfully',
      expect.objectContaining({
        tool: 'getPopular',
        resultCount: expect.any(Number),
      })
    );
  });

  it('should return popular content with category filter', async () => {
    const mockPopularData = [
      {
        slug: 'popular-agent',
        title: 'Popular Agent',
        category: 'agents',
        description: 'Agent description',
        tags: [],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 200,
        bookmark_count: 20,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    const mockData = [
      ...mockPopularData,
      {
        slug: 'another-agent',
        title: 'Another Agent',
        category: 'agents',
        description: 'Another description',
        tags: [],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 150,
        bookmark_count: 15,
      },
    ];
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => mockData);

    const result = await handleGetPopular({ category: 'agents', limit: 10 }, context);

    expect(result._meta.items[0].category).toBe('agents');
    expect(result._meta.category).toBe('agents');
    expect(result.content[0].text).toContain('in agents');
  });

  it('should return empty results when no popular content found', async () => {
    // Empty array should be returned as-is by callRpc for array-return functions
    queryRawUnsafeSpy.mockReset();
    queryRawUnsafeSpy.mockImplementation(async () => []);

    const result = await handleGetPopular({ limit: 20 }, context);

    expect(result.content[0].text).toContain('No popular content found');
    expect(result._meta.items).toHaveLength(0);
    expect(result._meta.count).toBe(0);
    expect(result._meta.pagination.total).toBe(0);
    expect(result._meta.pagination.hasMore).toBe(false);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'getPopular completed with no results',
      expect.objectContaining({
        tool: 'getPopular',
        resultCount: 0,
      })
    );
  });

  it('should truncate descriptions to 150 characters', async () => {
    const longDescription = 'a'.repeat(200);
    const mockPopularData = [
      {
        slug: 'long-desc',
        title: 'Long Description',
        category: 'agents',
        description: longDescription,
        tags: [],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 10,
        bookmark_count: 0,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    const mockData = [
      ...mockPopularData,
      {
        slug: 'another-item',
        title: 'Another Item',
        category: 'agents',
        description: 'a'.repeat(100),
        tags: [],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 5,
        bookmark_count: 0,
      },
    ];
    queryRawUnsafeSpy.mockImplementation(async () => mockData);

    const result = await handleGetPopular({ limit: 20 }, context);

    expect(result._meta.items[0].description.length).toBe(150);
    expect(result._meta.items[0].wasTruncated).toBe(true);
  });

  it('should handle missing optional fields gracefully', async () => {
    const mockPopularData = [
      {
        slug: 'minimal-item',
        title: null,
        category: 'agents',
        description: null,
        tags: null,
        author: null,
        date_added: null,
        view_count: null,
        bookmark_count: null,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    const mockData = [
      ...mockPopularData,
      {
        slug: 'another-item',
        title: 'Another Item',
        category: 'agents',
        description: 'a'.repeat(100),
        tags: [],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 5,
        bookmark_count: 0,
      },
    ];
    queryRawUnsafeSpy.mockImplementation(async () => mockData);

    const result = await handleGetPopular({ limit: 20 }, context);

    expect(result._meta.items[0].title).toBe('Untitled');
    expect(result._meta.items[0].description).toBe('');
    expect(result._meta.items[0].tags).toEqual([]);
    expect(result._meta.items[0].author).toBe('Unknown');
    expect(result._meta.items[0].dateAdded).toBeNull();
    expect(result._meta.items[0].stats.views).toBe(0);
    expect(result._meta.items[0].stats.bookmarks).toBe(0);
  });

  it('should handle database errors', async () => {
    queryRawUnsafeSpy.mockImplementation(async () => {
      throw new Error('Database error');
    });

    await expect(handleGetPopular({ limit: 20 }, context)).rejects.toThrow('Database error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'getPopular tool error',
      expect.any(Error),
      expect.objectContaining({
        tool: 'getPopular',
      })
    );
  });

  it('should log duration correctly', async () => {
    // Empty array should be returned as-is by callRpc for array-return functions
    queryRawUnsafeSpy.mockImplementation(async () => []);

    await handleGetPopular({ limit: 20 }, context);

    expect(mockLogger.info).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        tool: 'getPopular',
        duration_ms: expect.any(Number),
      })
    );
  });

  it('should format text summary with views and bookmarks', async () => {
    const mockPopularData = [
      {
        slug: 'highly-viewed',
        title: 'Highly Viewed',
        category: 'agents',
        description: 'Description',
        tags: [],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 500,
        bookmark_count: 50,
      },
    ];

    // Return array with multiple elements to prevent callRpc from unwrapping
    const mockData = [
      ...mockPopularData,
      {
        slug: 'another-item',
        title: 'Another Item',
        category: 'agents',
        description: 'a'.repeat(100),
        tags: [],
        author: 'Author',
        date_added: new Date('2024-01-01T00:00:00Z'),
        view_count: 5,
        bookmark_count: 0,
      },
    ];
    queryRawUnsafeSpy.mockImplementation(async () => mockData);

    const result = await handleGetPopular({ limit: 20 }, context);

    expect(result.content[0].text).toContain('👀 500 views');
    expect(result.content[0].text).toContain('50 bookmarks');
  });
});

