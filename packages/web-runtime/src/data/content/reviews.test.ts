import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getReviewsWithStatsData, type ReviewsWithStatsParameters } from './reviews';
import type { content_category } from '@prisma/client';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import {
  clearRequestCache,
  getRequestCache,
} from '../../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Don't mock createDataFunction - use real implementation
// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts

describe('reviews data functions', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (getReviewsWithStats uses RPC)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  describe('getReviewsWithStatsData', () => {
    it('should be a function', () => {
      expect(typeof getReviewsWithStatsData).toBe('function');
    });

    it('should return reviews with stats for valid parameters', async () => {
      // getReviewsWithStats uses RPC (get_reviews_with_stats)
      const mockRpcResult = {
        reviews: [
          {
            id: 'review-1',
            user_id: 'user-1',
            content_slug: 'test-slug',
            content_type: 'agents',
            rating: 5,
            comment: 'Great!',
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
      // callRpc unwraps single-element arrays for composite types
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      const result = await getReviewsWithStatsData({
        contentSlug: 'test-slug',
        contentType: 'agents',
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('reviews');
      expect(result).toHaveProperty('stats');
      expect(result?.reviews).toHaveLength(1);
      expect(result?.stats).toMatchObject({
        average_rating: 4.5,
        total_reviews: 10,
      });

      // Verify RPC was called with correct arguments
      // Arguments are in object key insertion order from transformArgs
      // transformArgs uses conditional spread: ...(params.limit ? { p_limit: params.limit } : {})
      // So only truthy optional params are included
      // In this test: p_content_slug, p_content_type, p_limit (10 is truthy) are provided
      // p_offset is 0 (falsy), so it's not included
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_reviews_with_stats'),
        'test-slug', // p_content_slug (first, always present)
        'agents', // p_content_type (second, always present)
        10 // p_limit (third, provided and truthy)
        // p_offset (0) is falsy, so not included in object, not passed as argument
      );
    });

    it('should transform args correctly with all parameters', async () => {
      const mockRpcResult = {
        reviews: [],
        stats: {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: {},
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      const params: ReviewsWithStatsParameters = {
        contentSlug: 'test-slug',
        contentType: 'agents' as content_category,
        limit: 10,
        offset: 5,
        sortBy: 'helpful',
        userId: 'user-id',
      };

      await getReviewsWithStatsData(params);

      // Verify RPC was called with transformed arguments
      // Arguments are in object key insertion order from transformArgs:
      // p_content_slug, p_content_type, p_sort_by (if provided), p_limit (if provided), p_offset (if provided), p_user_id (if provided)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_reviews_with_stats'),
        'test-slug', // p_content_slug (first)
        'agents', // p_content_type (second)
        'helpful', // p_sort_by (third, if provided)
        10, // p_limit (fourth, if provided)
        5, // p_offset (fifth, if provided)
        'user-id' // p_user_id (sixth, if provided)
      );
    });

    it('should handle optional parameters', async () => {
      const mockRpcResult = {
        reviews: [],
        stats: {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: {},
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      const params: ReviewsWithStatsParameters = {
        contentSlug: 'test-slug',
        contentType: 'agents' as content_category,
        // Optional parameters not provided
      };

      await getReviewsWithStatsData(params);

      // Only required parameters should be passed
      // Arguments are in object key insertion order: p_content_slug, p_content_type (only these two)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_reviews_with_stats'),
        'test-slug', // p_content_slug (first)
        'agents' // p_content_type (second)
        // Optional parameters not in object if not provided, so they won't be in argValues
      );
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      // getReviewsWithStats uses createDataFunction which uses withSmartCache via service
      const mockRpcResult = {
        reviews: [
          {
            id: 'review-1',
            user_id: 'user-1',
            content_slug: 'test-slug',
            content_type: 'agents',
            rating: 5,
            comment: 'Great!',
            helpful_count: 10,
            created_at: new Date('2024-01-01'),
          },
        ],
        stats: {
          average_rating: 5,
          total_reviews: 1,
          rating_distribution: { 5: 1 },
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getReviewsWithStatsData({
        contentSlug: 'test-slug',
        contentType: 'agents',
      });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getReviewsWithStatsData({
        contentSlug: 'test-slug',
        contentType: 'agents',
      });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
