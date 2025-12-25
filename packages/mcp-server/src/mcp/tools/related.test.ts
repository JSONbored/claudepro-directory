/**
 * Tests for getRelatedContent Tool Handler
 *
 * Tests the tool that retrieves related content for a given slug and category.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleGetRelatedContent } from './related.js';
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

describe('getRelatedContent Tool Handler', () => {
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
    it('should return empty result when no related content found', async () => {
      queryRawUnsafeSpy.mockResolvedValue([]);

      const result = await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'agents',
          limit: 5,
        },
        context
      );

      expect(result._meta.count).toBe(0);
      expect(result._meta.items).toHaveLength(0);
      expect(result._meta.source.slug).toBe('test-slug');
      expect(result._meta.source.category).toBe('agents');
      expect(result._meta.limit).toBe(5);
      expect(result.content[0]?.text).toContain('No related content found');
    });

    it('should format related content correctly', async () => {
      const mockRelatedContent = [
        {
          slug: 'related-1',
          title: 'Related Content 1',
          category: 'agents',
          description: 'Description of related content 1',
          tags: ['ai', 'automation'],
          score: 0.95,
        },
        {
          slug: 'related-2',
          title: 'Related Content 2',
          category: 'agents',
          description: 'Description of related content 2',
          tags: ['ai', 'tools'],
          score: 0.85,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockRelatedContent);

      const result = await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'agents',
          limit: 5,
        },
        context
      );

      expect(result._meta.count).toBe(2);
      expect(result._meta.items).toHaveLength(2);
      expect(result._meta.items[0]?.slug).toBe('related-1');
      expect(result._meta.items[0]?.title).toBe('Related Content 1');
      expect(result._meta.items[0]?.relevanceScore).toBe(0.95);
      expect(result._meta.items[1]?.slug).toBe('related-2');
      expect(result._meta.items[1]?.relevanceScore).toBe(0.85);
      expect(result.content[0]?.text).toContain('Related Content');
      expect(result.content[0]?.text).toContain('Relevance: 0.95');
      expect(result.content[0]?.text).toContain('Relevance: 0.85');
    });

    it('should truncate long descriptions to 150 characters', async () => {
      const longDescription = 'a'.repeat(200);
      const mockRelatedContent = [
        {
          slug: 'related-1',
          title: 'Related Content 1',
          category: 'agents',
          description: longDescription,
          tags: ['ai'],
          score: 0.95,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockRelatedContent);

      const result = await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'agents',
          limit: 5,
        },
        context
      );

      expect(result._meta.items[0]?.description.length).toBe(150);
      expect(result.content[0]?.text).toContain('...');
    });

    it('should handle missing optional fields gracefully', async () => {
      const mockRelatedContent = [
        {
          slug: 'related-1',
          title: 'Related Content 1',
          category: 'agents',
          description: null,
          tags: null,
          score: null,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockRelatedContent);

      const result = await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'agents',
          limit: 5,
        },
        context
      );

      expect(result._meta.items[0]?.description).toBe('');
      expect(result._meta.items[0]?.tags).toEqual([]);
      expect(result._meta.items[0]?.relevanceScore).toBe(0);
    });

    it('should respect limit parameter', async () => {
      const mockRelatedContent = Array.from({ length: 10 }, (_, i) => ({
        slug: `related-${i}`,
        title: `Related Content ${i}`,
        category: 'agents',
        description: 'Description',
        tags: ['ai'],
        score: 0.9 - i * 0.01,
      }));

      queryRawUnsafeSpy.mockResolvedValue(mockRelatedContent);

      const result = await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'agents',
          limit: 3,
        },
        context
      );

      // RPC should return only limit items, but we verify the limit is passed correctly
      expect(result._meta.limit).toBe(3);
    });

    it('should log errors when ContentService fails', async () => {
      const error = new Error('Database connection failed');
      queryRawUnsafeSpy.mockRejectedValue(error);

      await expect(
        handleGetRelatedContent(
          {
            slug: 'test-slug',
            category: 'agents',
            limit: 5,
          },
          context
        )
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'ContentService.getRelatedContent failed',
        expect.any(Error),
        expect.objectContaining({
          tool: 'getRelatedContent',
          args: expect.objectContaining({
            p_category: 'agents',
            p_slug: 'test-slug',
            p_limit: 5,
          }),
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should call RPC with correct parameters', async () => {
      queryRawUnsafeSpy.mockResolvedValue([]);

      await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'agents',
          limit: 5,
        },
        context
      );

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_related_content'),
        expect.objectContaining({
          p_category: 'agents',
          p_slug: 'test-slug',
          p_tags: [],
          p_limit: 5,
          p_exclude_slugs: [],
        })
      );
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockRelatedContent = [
        {
          slug: 'related-1',
          title: 'Related Content 1',
          category: 'agents',
          description: 'Description',
          tags: ['ai'],
          score: 0.95,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockRelatedContent);

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'agents',
          limit: 5,
        },
        context
      );
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same parameters
      const result2 = await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'agents',
          limit: 5,
        },
        context
      );
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify cache worked
      expect(result1).toEqual(result2);
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('should handle different categories correctly', async () => {
      queryRawUnsafeSpy.mockResolvedValue([]);

      await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'mcp',
          limit: 5,
        },
        context
      );

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_related_content'),
        expect.objectContaining({
          p_category: 'mcp',
          p_slug: 'test-slug',
        })
      );
    });

    it('should include pagination metadata', async () => {
      const mockRelatedContent = [
        {
          slug: 'related-1',
          title: 'Related Content 1',
          category: 'agents',
          description: 'Description',
          tags: ['ai'],
          score: 0.95,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockRelatedContent);

      const result = await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'agents',
          limit: 5,
        },
        context
      );

      expect(result._meta.pagination).toBeDefined();
      expect(result._meta.pagination.total).toBe(1);
      expect(result._meta.pagination.limit).toBe(5);
      expect(result._meta.pagination.hasMore).toBe(false);
    });

    it('should log successful completion', async () => {
      const mockRelatedContent = [
        {
          slug: 'related-1',
          title: 'Related Content 1',
          category: 'agents',
          description: 'Description',
          tags: ['ai'],
          score: 0.95,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockRelatedContent);

      await handleGetRelatedContent(
        {
          slug: 'test-slug',
          category: 'agents',
          limit: 5,
        },
        context
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'getRelatedContent completed successfully',
        expect.objectContaining({
          tool: 'getRelatedContent',
          slug: 'test-slug',
          category: 'agents',
          resultCount: 1,
          duration_ms: expect.any(Number),
        })
      );
    });
  });
});
