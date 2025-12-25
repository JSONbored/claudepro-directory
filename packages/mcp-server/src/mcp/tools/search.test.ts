/**
 * Tests for searchContent Tool Handler
 *
 * Tests the tool that searches content with filters and pagination.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient
// No need to explicitly mock @prisma/client - Jest uses __mocks__ automatically

import { handleSearchContent } from '@heyclaude/mcp-server/tools/search';
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
// Cache is cleared in beforeEach for test isolation
// This allows us to test business logic with fresh cache (each test starts with empty cache)

describe('searchContent Tool Handler', () => {
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

  it('should return empty results for query with no matches', async () => {
    // Mock SearchService.searchContent to return empty results
    queryRawUnsafeSpy.mockResolvedValue([]);

    const result = await handleSearchContent(
      {
        query: 'nonexistent query',
        page: 1,
        limit: 20,
      },
      context
    );

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('No results found');
    expect(result._meta.items).toHaveLength(0);
    expect(result._meta.pagination.total).toBe(0);
    expect(result._meta.pagination.page).toBe(1);
    expect(result._meta.pagination.limit).toBe(20);
    expect(result._meta.pagination.totalPages).toBe(0);
    expect(result._meta.pagination.hasNext).toBe(false);
    expect(result._meta.pagination.hasPrev).toBe(false);
    expect(result._meta.pagination.hasMore).toBe(false);
    expect(result._meta.usageHints).toContain('Try broadening your search query');
    expect(mockLogger.info).toHaveBeenCalledWith(
      'searchContent completed with no results',
      expect.objectContaining({
        tool: 'searchContent',
        query: 'nonexistent query',
        resultCount: 0,
      })
    );
  });

  it('should return search results for query with matches', async () => {
    const mockSearchResults = [
      {
        slug: 'test-content',
        title: 'Test Content',
        category: 'agents',
        description: 'Test description',
        tags: ['test', 'example'],
        author: 'Test Author',
        created_at: '2024-01-01T00:00:00Z',
        highlighted_content: null,
        search_rank: 1.0,
      },
    ];

    // Mock SearchService.searchUnified - callRpc unwraps single-element arrays for composite types
    // So $queryRawUnsafe returns [{ results: [...], total_count: ... }] and callRpc unwraps it
    queryRawUnsafeSpy.mockResolvedValue([
      {
        results: mockSearchResults,
        total_count: 1,
      },
    ]);

    const result = await handleSearchContent(
      {
        query: 'test',
        page: 1,
        limit: 20,
      },
      context
    );

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Test Content');
    expect(result._meta.items).toHaveLength(1);
    expect(result._meta.items[0].slug).toBe('test-content');
    expect(result._meta.items[0].title).toBe('Test Content');
    expect(result._meta.items[0].category).toBe('agents');
    expect(result._meta.items[0].description).toBe('Test description');
    expect(result._meta.items[0].tags).toEqual(['test', 'example']);
    expect(result._meta.items[0].author).toBe('Test Author');
    expect(result._meta.pagination.total).toBe(1);
    expect(result._meta.pagination.page).toBe(1);
    expect(result._meta.pagination.limit).toBe(20);
    expect(result._meta.pagination.totalPages).toBe(1);
    expect(result._meta.pagination.hasNext).toBe(false);
    expect(result._meta.pagination.hasPrev).toBe(false);
    expect(result._meta.pagination.hasMore).toBe(false);
  });

  it('should handle search with category filter', async () => {
    const mockSearchResults = [
      {
        slug: 'agent-content',
        title: 'Agent Content',
        category: 'agents',
        description: 'Agent description',
        tags: ['agent'],
        author: 'Author',
        created_at: '2024-01-01T00:00:00Z',
        highlighted_content: null,
        search_rank: 1.0,
      },
    ];

    // Mock SearchService.searchContent - callRpc unwraps single-element arrays for composite types
    queryRawUnsafeSpy.mockResolvedValue([
      {
        results: mockSearchResults,
        total_count: 1,
      },
    ]);

    const result = await handleSearchContent(
      {
        query: 'agent',
        category: 'agents',
        page: 1,
        limit: 20,
      },
      context
    );

    expect(result._meta.items).toHaveLength(1);
    expect(result._meta.items[0].category).toBe('agents');
    // callRpc creates SQL like: SELECT * FROM search_content_optimized(p_query => $1, ...)
    // Check that the SQL query contains the function name
    const calls = queryRawUnsafeSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0][0]).toContain('search_content_optimized');
  });

  it('should handle search with tags filter', async () => {
    const mockSearchResults = [
      {
        slug: 'tagged-content',
        title: 'Tagged Content',
        category: 'agents',
        description: 'Tagged description',
        tags: ['react', 'typescript'],
        author: 'Author',
        created_at: '2024-01-01T00:00:00Z',
        highlighted_content: null,
        search_rank: 1.0,
      },
    ];

    // Mock SearchService.searchContent - callRpc unwraps single-element arrays for composite types
    queryRawUnsafeSpy.mockResolvedValue([
      {
        results: mockSearchResults,
        total_count: 1,
      },
    ]);

    const result = await handleSearchContent(
      {
        query: 'react',
        tags: ['react', 'typescript'],
        page: 1,
        limit: 20,
      },
      context
    );

    expect(result._meta.items).toHaveLength(1);
    expect(result._meta.items[0].tags).toContain('react');
    expect(result._meta.items[0].tags).toContain('typescript');
  });

  it('should handle pagination correctly', async () => {
    // For pagination test, return a full page of results (limit=20) with total_count indicating more results exist
    // This simulates page 2 where we've already seen 20 items, and there are 50 total
    // hasNext is true when results.length === limit (full page) AND page * limit < total
    const mockSearchResults = Array.from({ length: 20 }, (_, i) => ({
      slug: `page2-item-${i + 1}`,
      title: `Page 2 Item ${i + 1}`,
      category: 'agents' as const,
      description: `Description ${i + 1}`,
      tags: [],
      author: 'Author',
      created_at: '2024-01-01T00:00:00Z',
      highlighted_content: null,
      search_rank: 1.0,
    }));

    queryRawUnsafeSpy.mockResolvedValueOnce([
      {
        results: mockSearchResults,
        total_count: 50, // Total indicates there are 50 items total
      },
    ]);

    const result = await handleSearchContent(
      {
        query: 'pagination-test', // Use unique query to avoid cache hits
        page: 2,
        limit: 20,
      },
      context
    );

    // Pagination should reflect total_count
    expect(result._meta.pagination.page).toBe(2);
    expect(result._meta.pagination.limit).toBe(20);
    expect(result._meta.pagination.total).toBe(50); // Uses total_count
    expect(result._meta.pagination.totalPages).toBe(3); // 50 / 20 = 2.5, rounded up to 3
    // hasNext is true when we got a full page (20 items) AND page * limit < total (2 * 20 = 40 < 50)
    expect(result._meta.pagination.hasNext).toBe(true);
    expect(result._meta.pagination.hasPrev).toBe(true); // page 2 > 1
    expect(result._meta.pagination.hasMore).toBe(true); // More results available
  });

  it('should handle search errors properly', async () => {
    const mockError = new Error('Database error');
    queryRawUnsafeSpy.mockRejectedValueOnce(mockError);

    // normalizeError preserves the original error message, so we expect the original error
    await expect(
      handleSearchContent(
        {
          query: 'error-test', // Use unique query to avoid cache hits
          page: 1,
          limit: 20,
        },
        context
      )
    ).rejects.toThrow('Database error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      'searchContent tool error',
      expect.any(Error),
      expect.objectContaining({ tool: 'searchContent' })
    );
  });

  it('should truncate long descriptions', async () => {
    // Reset mock to ensure clean state
    jest.clearAllMocks();

    const longDescription = 'a'.repeat(500); // Very long description (500 chars)
    const mockSearchResults = [
      {
        slug: 'long-content',
        title: 'Long Content',
        category: 'agents',
        description: longDescription, // 500 chars - should be truncated to 200
        tags: [],
        author: 'Author',
        created_at: '2024-01-01T00:00:00Z',
        highlighted_content: null,
        search_rank: 1.0,
      },
    ];

    // Explicitly set up mock for this test
    queryRawUnsafeSpy.mockResolvedValueOnce([
      {
        results: mockSearchResults,
        total_count: 1,
      },
    ]);

    const result = await handleSearchContent(
      {
        query: 'truncation-test', // Use unique query to avoid cache hits
        page: 1,
        limit: 20,
      },
      context
    );

    // Verify the mock was called with the correct query
    expect(queryRawUnsafeSpy).toHaveBeenCalled();

    // Description should be truncated to 200 chars
    expect(result._meta.items[0].description.length).toBe(200);
    // wasTruncated should be true because original was 500 chars
    expect(result._meta.items[0].wasTruncated).toBe(true);
    // Verify it's actually truncated (first 200 chars of 'a'.repeat(500))
    expect(result._meta.items[0].description).toBe('a'.repeat(200));
  });

  it('should cache results on duplicate calls (caching test)', async () => {
    const mockSearchResults = [
      {
        slug: 'test-content',
        title: 'Test Content',
        category: 'agents',
        description: 'Test description',
        tags: ['test', 'example'],
        author: 'Test Author',
        created_at: '2024-01-01T00:00:00Z',
        highlighted_content: null,
        search_rank: 1.0,
      },
    ];

    queryRawUnsafeSpy.mockResolvedValue([
      {
        results: mockSearchResults,
        total_count: 1,
      },
    ]);

    // First call
    const cacheBefore = getRequestCache().getStats().size;
    const result1 = await handleSearchContent(
      {
        query: 'cache-test',
        page: 1,
        limit: 20,
      },
      context
    );
    const cacheAfterFirst = getRequestCache().getStats().size;

    // Second call with same parameters
    const result2 = await handleSearchContent(
      {
        query: 'cache-test',
        page: 1,
        limit: 20,
      },
      context
    );
    const cacheAfterSecond = getRequestCache().getStats().size;

    // Verify cache worked
    expect(result1).toEqual(result2);
    expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
    expect(cacheAfterSecond).toBe(cacheAfterFirst);
  });
});
