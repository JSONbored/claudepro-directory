/**
 * Tests for getRecent Tool Handler
 *
 * Comprehensive tests for the tool that retrieves recent content.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock @prisma/client to use PrismockerClient from __mocks__/@prisma/client.ts
// This must be called before any imports that use PrismaClient
// Vitest will hoist this call to the top of the file
vi.mock('@prisma/client');

import { handleGetRecent } from '../../../../../packages/mcp-server/src/mcp/tools/recent.js';
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

describe('getRecent Tool Handler', () => {
  let prismocker: PrismaClient;
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
      // PrismockerClient models are lazy-loaded, so try to access the model to trigger initialization
      // If it still doesn't exist, throw an error
      throw new Error(`Prismocker model does not exist - check if model name matches schema.prisma. PrismockerClient may not be properly initialized.`);
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

    // Ensure Prismocker models are initialized (lazy-loaded, so access to trigger initialization)
    // This ensures models are available after reset
    if (prismocker.content) {
      // Model exists, no action needed
    }

    // Clear all mocks to ensure clean state
    mockClearRequestCache();
    vi.clearAllMocks();
    vi.resetAllMocks();
    mockWithSmartCache.mockClear();
    vi.setSystemTime(new Date('2024-12-15T00:00:00Z')); // Set fixed time for date calculations

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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return recent content without category filter', async () => {
    const mockRecentData = [
      {
        slug: 'recent-item',
        title: 'Recent Item',
        display_title: null,
        category: 'agents',
        description: 'Recent description',
        tags: ['recent'],
        author: 'Author',
        date_added: new Date('2024-12-10T00:00:00Z'),
        created_at: new Date('2024-12-10T00:00:00Z'),
      },
    ];

    mockPrismockerMethod(prismocker.content, 'findMany', mockRecentData);

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
    const mockRecentData = [
      {
        slug: 'recent-agent',
        title: 'Recent Agent',
        display_title: null,
        category: 'agents',
        description: 'Agent description',
        tags: [],
        author: 'Author',
        date_added: new Date('2024-12-10T00:00:00Z'),
        created_at: new Date('2024-12-10T00:00:00Z'),
      },
    ];

    mockPrismockerMethod(prismocker.content, 'findMany', mockRecentData);

    const result = await handleGetRecent({ category: 'agents', limit: 10 }, context);

    expect(result._meta.items[0].category).toBe('agents');
    expect(result._meta.category).toBe('agents');
    expect(result.content[0].text).toContain('in agents');
  });

  it('should return empty results when no recent content found', async () => {
    mockPrismockerMethod(prismocker.content, 'findMany', []);

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
    vi.setSystemTime(today);

    const mockRecentData = [
      {
        slug: 'today-item',
        title: 'Today Item',
        display_title: null,
        category: 'agents',
        description: 'Description',
        tags: [],
        author: 'Author',
        date_added: today,
        created_at: today,
      },
    ];

    mockPrismockerMethod(prismocker.content, 'findMany', mockRecentData);

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result.content[0].text).toContain('Today');
  });

  it('should format relative dates correctly (Yesterday)', async () => {
    const today = new Date('2024-12-15T00:00:00Z');
    const yesterday = new Date('2024-12-14T00:00:00Z');
    vi.setSystemTime(today);

    const mockRecentData = [
      {
        slug: 'yesterday-item',
        title: 'Yesterday Item',
        display_title: null,
        category: 'agents',
        description: 'Description',
        tags: [],
        author: 'Author',
        date_added: yesterday,
        created_at: yesterday,
      },
    ];

    mockPrismockerMethod(prismocker.content, 'findMany', mockRecentData);

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result.content[0].text).toContain('Yesterday');
  });

  it('should format relative dates correctly (days ago)', async () => {
    const today = new Date('2024-12-15T00:00:00Z');
    const threeDaysAgo = new Date('2024-12-12T00:00:00Z');
    vi.setSystemTime(today);

    const mockRecentData = [
      {
        slug: 'days-ago-item',
        title: 'Days Ago Item',
        display_title: null,
        category: 'agents',
        description: 'Description',
        tags: [],
        author: 'Author',
        date_added: threeDaysAgo,
        created_at: threeDaysAgo,
      },
    ];

    mockPrismockerMethod(prismocker.content, 'findMany', mockRecentData);

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result.content[0].text).toContain('3 days ago');
  });

  it('should truncate descriptions to 150 characters', async () => {
    const longDescription = 'a'.repeat(200);
    const mockRecentData = [
      {
        slug: 'long-desc',
        title: 'Long Description',
        display_title: null,
        category: 'agents',
        description: longDescription,
        tags: [],
        author: 'Author',
        date_added: new Date('2024-12-10T00:00:00Z'),
        created_at: new Date('2024-12-10T00:00:00Z'),
      },
    ];

    mockPrismockerMethod(prismocker.content, 'findMany', mockRecentData);

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result._meta.items[0].description.length).toBe(150);
  });

  it('should use display_title when available', async () => {
    const mockRecentData = [
      {
        slug: 'display-title',
        title: 'Title',
        display_title: 'Display Title',
        category: 'agents',
        description: 'Description',
        tags: [],
        author: 'Author',
        date_added: new Date('2024-12-10T00:00:00Z'),
        created_at: new Date('2024-12-10T00:00:00Z'),
      },
    ];

    mockPrismockerMethod(prismocker.content, 'findMany', mockRecentData);

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result._meta.items[0].title).toBe('Display Title');
  });

  it('should handle missing optional fields gracefully', async () => {
    const mockRecentData = [
      {
        slug: 'minimal-item',
        title: null,
        display_title: null,
        category: 'agents',
        description: null,
        tags: null,
        author: null,
        date_added: null,
        created_at: new Date('2024-12-10T00:00:00Z'),
      },
    ];

    mockPrismockerMethod(prismocker.content, 'findMany', mockRecentData);

    const result = await handleGetRecent({ limit: 20 }, context);

    expect(result._meta.items[0].title).toBe('');
    expect(result._meta.items[0].description).toBe('');
    expect(result._meta.items[0].tags).toEqual([]);
    expect(result._meta.items[0].author).toBe('Unknown');
    expect(result._meta.items[0].dateAdded).toBeNull();
  });

  it('should handle database errors', async () => {
    const findManyMock = mockPrismockerMethod(prismocker.content, 'findMany', Promise.reject(new Error('Database error')));

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
    const mockRecentData = [
      {
        slug: 'many-tags',
        title: 'Many Tags',
        display_title: null,
        category: 'agents',
        description: 'Description',
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6', 'tag7'],
        author: 'Author',
        date_added: new Date('2024-12-10T00:00:00Z'),
        created_at: new Date('2024-12-10T00:00:00Z'),
      },
    ];

    mockPrismockerMethod(prismocker.content, 'findMany', mockRecentData);

    const result = await handleGetRecent({ limit: 20 }, context);

    // Tags in _meta should include all tags
    expect(result._meta.items[0].tags).toHaveLength(7);
    // But text summary should only show first 5
    const tagsInText = result.content[0].text.match(/Tags: (.+)/)?.[1];
    expect(tagsInText?.split(', ').length).toBeLessThanOrEqual(5);
  });
});

