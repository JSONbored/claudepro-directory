/**
 * Tests for getSearchSuggestions Tool Handler
 *
 * Tests the tool that retrieves search suggestions based on query history.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { handleGetSearchSuggestions } from './search-suggestions.js';
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

describe('getSearchSuggestions Tool Handler', () => {
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
    it('should return suggestions with correct structure', async () => {
      const mockSuggestions = [
        {
          suggestion: 'ai agents',
          search_count: 10,
        },
        {
          suggestion: 'mcp servers',
          search_count: 5,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockSuggestions);

      const result = await handleGetSearchSuggestions(
        {
          query: 'ai',
          limit: 10,
        },
        context
      );

      expect(result._meta.suggestions).toHaveLength(2);
      expect(result._meta.suggestions[0]?.text).toBe('ai agents');
      expect(result._meta.suggestions[0]?.searchCount).toBe(10);
      expect(result._meta.suggestions[0]?.isPopular).toBe(true); // >= 2
      expect(result._meta.suggestions[1]?.text).toBe('mcp servers');
      expect(result._meta.suggestions[1]?.searchCount).toBe(5);
      expect(result._meta.suggestions[1]?.isPopular).toBe(true);
    });

    it('should mark suggestions as popular when searchCount >= 2', async () => {
      const mockSuggestions = [
        {
          suggestion: 'popular query',
          search_count: 2,
        },
        {
          suggestion: 'unpopular query',
          search_count: 1,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockSuggestions);

      const result = await handleGetSearchSuggestions(
        {
          query: 'query',
          limit: 10,
        },
        context
      );

      expect(result._meta.suggestions[0]?.isPopular).toBe(true);
      expect(result._meta.suggestions[1]?.isPopular).toBe(false);
    });

    it('should filter out empty suggestions', async () => {
      const mockSuggestions = [
        {
          suggestion: 'valid suggestion',
          search_count: 5,
        },
        {
          suggestion: '   ', // Whitespace only
          search_count: 3,
        },
        {
          suggestion: '', // Empty
          search_count: 2,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockSuggestions);

      const result = await handleGetSearchSuggestions(
        {
          query: 'suggestion',
          limit: 10,
        },
        context
      );

      expect(result._meta.suggestions).toHaveLength(1);
      expect(result._meta.suggestions[0]?.text).toBe('valid suggestion');
    });

    it('should handle null values gracefully', async () => {
      const mockSuggestions = [
        {
          suggestion: null,
          search_count: null,
        },
        {
          suggestion: 'valid',
          search_count: 5,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockSuggestions);

      const result = await handleGetSearchSuggestions(
        {
          query: 'query',
          limit: 10,
        },
        context
      );

      expect(result._meta.suggestions).toHaveLength(1);
      expect(result._meta.suggestions[0]?.text).toBe('valid');
      expect(result._meta.suggestions[0]?.searchCount).toBe(5);
    });

    it('should format text summary correctly', async () => {
      const mockSuggestions = [
        {
          suggestion: 'ai agents',
          search_count: 10,
        },
        {
          suggestion: 'mcp servers',
          search_count: 5,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockSuggestions);

      const result = await handleGetSearchSuggestions(
        {
          query: 'ai',
          limit: 10,
        },
        context
      );

      expect(result.content[0]?.text).toContain('Found 2 search suggestions');
      expect(result.content[0]?.text).toContain('ai agents');
      expect(result.content[0]?.text).toContain('mcp servers');
      expect(result.content[0]?.text).toContain('(popular)');
      expect(result.content[0]?.text).toContain('searched 10 times');
    });

    it('should show no results message when empty', async () => {
      queryRawUnsafeSpy.mockResolvedValue([]);

      const result = await handleGetSearchSuggestions(
        {
          query: 'nonexistent',
          limit: 10,
        },
        context
      );

      expect(result._meta.suggestions).toHaveLength(0);
      expect(result.content[0]?.text).toContain('No search suggestions found');
      expect(result.content[0]?.text).toContain('Try a different query');
    });

    it('should validate query length (min 2 characters)', async () => {
      await expect(
        handleGetSearchSuggestions(
          {
            query: 'a', // Too short
            limit: 10,
          },
          context
        )
      ).rejects.toThrow('Query must be at least 2 characters long');
    });

    it('should validate limit range (1-20)', async () => {
      await expect(
        handleGetSearchSuggestions(
          {
            query: 'valid query',
            limit: 0, // Too low
          },
          context
        )
      ).rejects.toThrow('Limit must be between 1 and 20');

      await expect(
        handleGetSearchSuggestions(
          {
            query: 'valid query',
            limit: 21, // Too high
          },
          context
        )
      ).rejects.toThrow('Limit must be between 1 and 20');
    });

    it('should use default limit when not provided', async () => {
      queryRawUnsafeSpy.mockResolvedValue([]);

      await handleGetSearchSuggestions(
        {
          query: 'test',
        },
        context
      );

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_search_suggestions'),
        expect.objectContaining({
          p_query: 'test',
          p_limit: 10, // Default
        })
      );
    });

    it('should sanitize query input', async () => {
      queryRawUnsafeSpy.mockResolvedValue([]);

      await handleGetSearchSuggestions(
        {
          query: '  test query  ', // Has whitespace
          limit: 10,
        },
        context
      );

      // Query should be sanitized (trimmed)
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_search_suggestions'),
        expect.objectContaining({
          p_query: 'test query', // Trimmed
        })
      );
    });

    it('should log errors when SearchService fails', async () => {
      const error = new Error('Database connection failed');
      queryRawUnsafeSpy.mockRejectedValue(error);

      await expect(
        handleGetSearchSuggestions(
          {
            query: 'test',
            limit: 10,
          },
          context
        )
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'getSearchSuggestions tool error',
        expect.any(Error),
        expect.objectContaining({
          tool: 'getSearchSuggestions',
          query: 'test',
          limit: 10,
        })
      );
    });
  });

  describe('Integration Tests', () => {
    it('should call SearchService.getSearchSuggestions with correct parameters', async () => {
      queryRawUnsafeSpy.mockResolvedValue([]);

      await handleGetSearchSuggestions(
        {
          query: 'test query',
          limit: 5,
        },
        context
      );

      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_search_suggestions'),
        expect.objectContaining({
          p_query: 'test query',
          p_limit: 5,
        })
      );
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockSuggestions = [
        {
          suggestion: 'test suggestion',
          search_count: 5,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockSuggestions);

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await handleGetSearchSuggestions(
        {
          query: 'test',
          limit: 10,
        },
        context
      );
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same parameters
      const result2 = await handleGetSearchSuggestions(
        {
          query: 'test',
          limit: 10,
        },
        context
      );
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify cache worked
      expect(result1).toEqual(result2);
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('should log successful completion', async () => {
      const mockSuggestions = [
        {
          suggestion: 'test suggestion',
          search_count: 5,
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockSuggestions);

      await handleGetSearchSuggestions(
        {
          query: 'test',
          limit: 10,
        },
        context
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        'getSearchSuggestions completed successfully',
        expect.objectContaining({
          tool: 'getSearchSuggestions',
          query: 'test',
          limit: 10,
          resultCount: 1,
          duration_ms: expect.any(Number),
        })
      );
    });
  });
});
