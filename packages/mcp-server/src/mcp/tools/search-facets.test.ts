/**
 * Tests for getSearchFacets Tool Handler
 *
 * Tests the tool that retrieves available search facets (categories, tags, authors).
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleGetSearchFacets } from './search-facets.js';
import {
  createMockLogger,
  createMockEnv,
  createMockUser,
  createMockToken,
  createMockKvCache,
} from '../../__tests__/test-utils.ts';
import type { ToolContext } from '../../types/runtime.js';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';

describe('getSearchFacets Tool Handler', () => {
  let prismocker: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof jest.fn>;
  let mockLogger: ReturnType<typeof createMockLogger>;
  let mockEnv: ReturnType<typeof createMockEnv>;
  let context: ToolContext;

  beforeEach(() => {
    clearRequestCache();

    prismocker = prisma;
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    jest.clearAllMocks();
    jest.resetAllMocks();

    queryRawUnsafeSpy = jest.fn().mockImplementation(async () => []);
    (prismocker as any).$queryRawUnsafe = queryRawUnsafeSpy;

    mockLogger = createMockLogger();
    mockEnv = createMockEnv();
    context = {
      prisma: prismocker,
      user: createMockUser() as any,
      token: createMockToken().access_token,
      env: mockEnv as any,
      logger: mockLogger,
      kvCache: createMockKvCache(),
    };
  });

  describe('Unit Tests', () => {
    it('should return facets with correct structure', async () => {
      const mockFacets = [
        {
          category: 'agents',
          content_count: 10,
          all_tags: ['ai', 'automation', 'tools'],
          authors: ['author1', 'author2'],
        },
        {
          category: 'mcp',
          content_count: 5,
          all_tags: ['mcp', 'server'],
          authors: ['author3'],
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockFacets);

      const result = await handleGetSearchFacets(context);

      expect(result._meta.facets).toHaveLength(2);
      expect(result._meta.facets[0]?.category).toBe('agents');
      expect(result._meta.facets[0]?.contentCount).toBe(10);
      expect(result._meta.facets[0]?.tags).toEqual(['ai', 'automation', 'tools']);
      expect(result._meta.facets[0]?.authors).toEqual(['author1', 'author2']);
      expect(result._meta.facets[1]?.category).toBe('mcp');
      expect(result._meta.facets[1]?.contentCount).toBe(5);
    });

    it('should calculate summary statistics correctly', async () => {
      const mockFacets = [
        {
          category: 'agents',
          content_count: 10,
          all_tags: ['ai', 'automation'],
          authors: ['author1'],
        },
        {
          category: 'mcp',
          content_count: 5,
          all_tags: ['mcp', 'ai'], // 'ai' is duplicate
          authors: ['author1', 'author2'], // 'author1' is duplicate
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockFacets);

      const result = await handleGetSearchFacets(context);

      expect(result._meta.summary.totalCategories).toBe(2);
      expect(result._meta.summary.totalContent).toBe(15);
      expect(result._meta.summary.totalTags).toBe(3); // ai, automation, mcp (unique)
      expect(result._meta.summary.totalAuthors).toBe(2); // author1, author2 (unique)
    });

    it('should handle null values gracefully', async () => {
      const mockFacets = [
        {
          category: null,
          content_count: null,
          all_tags: null,
          authors: null,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockFacets);

      const result = await handleGetSearchFacets(context);

      expect(result._meta.facets[0]?.category).toBe('unknown');
      expect(result._meta.facets[0]?.contentCount).toBe(0);
      expect(result._meta.facets[0]?.tags).toEqual([]);
      expect(result._meta.facets[0]?.authors).toEqual([]);
    });

    it('should filter out non-string tags and authors', async () => {
      const mockFacets = [
        {
          category: 'agents',
          content_count: 10,
          all_tags: ['ai', 123, 'automation', null, 'tools'], // Mixed types
          authors: ['author1', 456, 'author2'], // Mixed types
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockFacets);

      const result = await handleGetSearchFacets(context);

      expect(result._meta.facets[0]?.tags).toEqual(['ai', 'automation', 'tools']);
      expect(result._meta.facets[0]?.authors).toEqual(['author1', 'author2']);
    });

    it('should format text summary correctly', async () => {
      const mockFacets = [
        {
          category: 'agents',
          content_count: 10,
          all_tags: ['ai', 'automation'],
          authors: ['author1'],
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockFacets);

      const result = await handleGetSearchFacets(context);

      expect(result.content[0]?.text).toContain('Available search facets');
      expect(result.content[0]?.text).toContain('Categories:');
      expect(result.content[0]?.text).toContain('Tags:');
      expect(result.content[0]?.text).toContain('Authors:');
      expect(result.content[0]?.text).toContain('By Category:');
      expect(result.content[0]?.text).toContain('agents: 10 items');
    });

    it('should handle empty results', async () => {
      queryRawUnsafeSpy.mockResolvedValue([]);

      const result = await handleGetSearchFacets(context);

      expect(result._meta.facets).toHaveLength(0);
      expect(result._meta.summary.totalCategories).toBe(0);
      expect(result._meta.summary.totalContent).toBe(0);
      expect(result._meta.summary.totalTags).toBe(0);
      expect(result._meta.summary.totalAuthors).toBe(0);
    });

    it('should log errors when SearchService fails', async () => {
      const error = new Error('Database connection failed');
      queryRawUnsafeSpy.mockRejectedValue(error);

      await expect(handleGetSearchFacets(context)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'getSearchFacets tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'getSearchFacets',
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should call SearchService.getSearchFacets', async () => {
      queryRawUnsafeSpy.mockResolvedValue([]);

      await handleGetSearchFacets(context);

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_search_facets'),
        expect.any(Object)
      );
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockFacets = [
        {
          category: 'agents',
          content_count: 10,
          all_tags: ['ai'],
          authors: ['author1'],
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockFacets);

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await handleGetSearchFacets(context);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call
      const result2 = await handleGetSearchFacets(context);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify cache worked
      expect(result1).toEqual(result2);
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('should log successful completion', async () => {
      const mockFacets = [
        {
          category: 'agents',
          content_count: 10,
          all_tags: ['ai'],
          authors: ['author1'],
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockFacets);

      await handleGetSearchFacets(context);

      expect(mockLogger.info).toHaveBeenCalledWith(
        'getSearchFacets completed successfully',
        expect.objectContaining({
          tool: 'getSearchFacets',
          totalCategories: 1,
          totalContent: 10,
          totalTags: 1,
          totalAuthors: 1,
          duration_ms: expect.any(Number),
        })
      );
    });
  });
});
