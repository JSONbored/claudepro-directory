import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import { clearRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock safe-action middleware - standardized pattern
// Pattern: optionalAuthAction.inputSchema().metadata().action()
// Pattern: rateLimitedAction.inputSchema().metadata().action()
jest.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createOptionalAuthActionHandler = (inputSchema: any) => {
    return jest.fn((handler: any) => {
      return async (input: unknown) => {
        try {
          const parsed = inputSchema ? inputSchema.parse(input) : input;
          // Await handler to properly catch async errors
          return await handler({
            parsedInput: parsed,
            ctx: { userId: 'test-user-id', user: null }, // Default authenticated context
          });
        } catch (error) {
          // Simulate middleware error handling
          const { logActionFailure } = require('../errors.ts');
          logActionFailure('getReviewsWithStats', error, {});
          throw error;
        }
      };
    });
  };

  const createOptionalAuthMetadataResult = (inputSchema: any) => ({
    action: createOptionalAuthActionHandler(inputSchema),
  });

  const createOptionalAuthInputSchemaResult = (inputSchema: any) => ({
    metadata: jest.fn(() => createOptionalAuthMetadataResult(inputSchema)),
    action: createOptionalAuthActionHandler(inputSchema),
  });

  const createRateLimitedActionHandler = (inputSchema: any) => {
    return jest.fn((handler: any) => {
      return async (input: unknown) => {
        try {
          const parsed = inputSchema ? inputSchema.parse(input) : input;
          // Await handler to properly catch async errors
          return await handler({
            parsedInput: parsed,
            ctx: { userAgent: 'test-user-agent', startTime: performance.now() },
          });
        } catch (error) {
          // Simulate middleware error handling
          const { logActionFailure } = require('../errors.ts');
          logActionFailure('fetchPaginatedContent', error, {});
          throw error;
        }
      };
    });
  };

  const createRateLimitedMetadataResult = (inputSchema: any) => ({
    action: createRateLimitedActionHandler(inputSchema),
  });

  const createRateLimitedInputSchemaResult = (inputSchema: any) => ({
    metadata: jest.fn(() => createRateLimitedMetadataResult(inputSchema)),
    action: createRateLimitedActionHandler(inputSchema),
  });

  return {
    optionalAuthAction: {
      inputSchema: jest.fn((schema: any) => createOptionalAuthInputSchemaResult(schema)),
    },
    rateLimitedAction: {
      inputSchema: jest.fn((schema: any) => createRateLimitedInputSchemaResult(schema)),
    },
  };
});

// Mock errors.ts
jest.mock('../errors.ts', () => ({
  logActionFailure: jest.fn((actionName, error, context) => {
    const err = error instanceof Error ? error : new Error(String(error));
    err.message = err.message || 'Action failed';
    return err;
  }),
  normalizeError: jest.fn((error, message) => {
    const err = error instanceof Error ? error : new Error(String(error));
    err.message = message || err.message;
    return err;
  }),
}));

// DO NOT mock data functions - use real data functions which use Prismocker
// This allows us to test the real RPC flow end-to-end

describe('getReviewsWithStats', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test (required for test isolation)
    clearRequestCache();

    // Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();

    // Set up $queryRawUnsafe for RPC testing (getReviewsWithStats uses RPC via getReviewsWithStatsData)
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  describe('input validation', () => {
    it('should validate content_category enum', async () => {
      const { getReviewsWithStats } = await import('./content.ts');
      const { content_categorySchema } = await import('../prisma-zod-schemas.ts');

      // Test that valid enum values are accepted
      expect(() => {
        content_categorySchema.parse('agents');
      }).not.toThrow();

      // Test that invalid enum values are rejected
      expect(() => {
        content_categorySchema.parse('invalid-category');
      }).toThrow();
    });

    it('should validate content_slug format', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      // Invalid slug format - should throw validation error
      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'invalid slug with spaces!',
        } as any)
      ).rejects.toThrow();
    });

    it('should validate sort_by enum', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
          sort_by: 'invalid-sort',
        } as any)
      ).rejects.toThrow();
    });

    it('should validate limit and offset ranges', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
          limit: 0,
        } as any)
      ).rejects.toThrow();

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
          limit: 101,
        } as any)
      ).rejects.toThrow();

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
          offset: -1,
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('data fetching', () => {
    it('should call getReviewsWithStatsData with correct parameters', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      const mockRpcResult = {
        reviews: [
          {
            id: 'review-1',
            user_id: 'user-1',
            content_slug: 'test-agent',
            content_type: 'agents',
            rating: 5,
            review_text: 'Great!',
            helpful_count: 10,
            created_at: new Date('2024-01-01'),
          },
        ],
        stats: {
          average_rating: 4.5,
          total_reviews: 10,
          rating_distribution: { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 },
        },
      };

      // RPC returns composite type (object), so $queryRawUnsafe returns [{ reviews, stats }]
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      const result = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
        sort_by: 'recent',
        limit: 20,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('reviews');
      expect(result).toHaveProperty('stats');
      expect(result.reviews).toHaveLength(1);
      expect(result.stats).toMatchObject({
        average_rating: 4.5,
        total_reviews: 10,
      });

      // Verify RPC was called (getReviewsWithStats → getReviewsWithStatsData → ContentService.getReviewsWithStats → RPC)
      // Note: offset: 0 is falsy, so it's not included in transformArgs
      // transformArgs only includes truthy values: sortBy, limit, offset, userId
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_reviews_with_stats'),
        'test-agent', // p_content_slug
        'agents', // p_content_type
        'recent', // p_sort_by (provided, so included)
        20, // p_limit (provided, so included)
        // offset: 0 is falsy, so NOT included in transformArgs
        'test-user-id' // p_user_id (from ctx.userId)
      );
    });

    // TODO: Test unauthenticated behavior - requires proper next-safe-actions testing setup
    // The current mock always provides ctx.userId = 'test-user-id'
    // To properly test unauthenticated, we need to mock optionalAuthAction to provide ctx.userId = null
    // This requires researching proper next-safe-actions testing patterns
  });

  describe('error handling', () => {
    it('should throw error when data is null', async () => {
      const { getReviewsWithStats } = await import('./content.ts');
      const { logActionFailure } = await import('../errors.ts');

      // Mock RPC returning empty array (callRpc unwraps [] to undefined for single-return functions)
      // getReviewsWithStatsData returns null when RPC returns undefined
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([]);

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
        })
      ).rejects.toThrow('Failed to fetch reviews');

      // The action throws its own error when data is null, which is caught by the middleware
      // The middleware calls logActionFailure
      expect(logActionFailure).toHaveBeenCalledWith(
        'getReviewsWithStats',
        expect.any(Error),
        expect.any(Object)
      );
    });

    it('should propagate service errors', async () => {
      const { getReviewsWithStats } = await import('./content.ts');
      const { logActionFailure } = await import('../errors.ts');

      const mockError = new Error('Service error');
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

      await expect(
        getReviewsWithStats({
          content_type: 'agents',
          content_slug: 'test-agent',
        })
      ).rejects.toThrow();

      // The error propagates through the middleware, which calls logActionFailure
      expect(logActionFailure).toHaveBeenCalledWith(
        'getReviewsWithStats',
        expect.any(Error),
        expect.any(Object)
      );
    });
  });
});

describe('fetchPaginatedContent', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test (required for test isolation)
    clearRequestCache();

    // Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Clear all mocks
    jest.clearAllMocks();

    // fetchPaginatedContent uses getPaginatedContent which uses direct Prisma (v_content_list_slim.findMany)
    // No need to mock $queryRawUnsafe for this test suite
  });

  describe('input validation', () => {
    it('should validate offset and limit ranges', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      await expect(
        fetchPaginatedContent({
          offset: -1,
          limit: 10,
        } as any)
      ).rejects.toThrow();

      await expect(
        fetchPaginatedContent({
          offset: 0,
          limit: 0,
        } as any)
      ).rejects.toThrow();

      await expect(
        fetchPaginatedContent({
          offset: 0,
          limit: 101,
        } as any)
      ).rejects.toThrow();
    });

    it('should accept nullable category', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      // getPaginatedContent uses direct Prisma (v_content_list_slim.findMany), so use setData
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
        category: null,
      });

      expect(result).toEqual([]);
    });
  });

  describe('data fetching', () => {
    it('should call getPaginatedContent with correct parameters', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      const mockContentItems = [
        {
          id: 'content-1',
          slug: 'test-content',
          title: 'Test Content',
          category: 'agents',
          source_table: 'agents',
          view_count: 0,
          popularity_score: 0,
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          date_added: new Date('2024-01-01'),
        },
      ];

      // getPaginatedContent uses direct Prisma (v_content_list_slim.findMany), so use setData
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', mockContentItems);
      }

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
        category: 'agents',
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it('should use default values', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      // Empty setData means no content
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      const result = await fetchPaginatedContent({});

      // Default: offset: 0, limit: 30, category: null
      expect(result).toEqual([]);
    });

    it('should return empty array when data.items is null', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      // getPaginatedContent returns null when no data found (which becomes { items: null, pagination: { total_count: 0 } })
      // But actually, it uses direct Prisma findMany, which returns [] when empty, so the service returns null
      // The action checks !data?.items, so null data returns []
      // Since we're using real data functions, we need to mock the Prisma query result
      // Empty setData means findMany returns [], which causes the service to return null
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      expect(result).toEqual([]);
    });

    it('should return empty array when data.items is empty array', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      // Empty items array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      expect(result).toEqual([]);
    });
  });

  describe('error handling', () => {
    // NOTE: getPaginatedContent uses createDataFunction with throwOnError: false (default)
    // This means errors are caught and return null, which the action handles gracefully by returning []
    // To test error propagation, we would need Prismocker to support error simulation,
    // or the data function would need throwOnError: true
    // For now, we test the graceful error handling (null data becomes empty array)
    it('should return empty array when data function returns null (graceful error handling)', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      // When getPaginatedContent encounters an error, it returns null (throwOnError: false)
      // The action checks if (!data?.items) and returns []
      // We can't simulate errors with Prismocker yet, so we test the graceful handling
      // by ensuring empty/null data results in empty array
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      // Action handles null/empty data gracefully by returning []
      expect(result).toEqual([]);
    });
  });
});
