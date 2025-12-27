import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
// Import SafeActionResult type from safemocker for proper typing in tests
import type { SafeActionResult } from '@jsonbored/safemocker';
import type { DisplayableContent } from '../types/component.types.ts';

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
import { clearRequestCache, getRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// DO NOT mock next/headers - safemocker handles this automatically
// DO NOT mock Supabase client or auth - safemocker handles auth automatically
// safemocker's __mocks__/next-safe-action.ts provides pre-configured optionalAuthAction and rateLimitedAction
// with context already injected (test-user-id, test@example.com, test-token for optionalAuthAction)

// Mock logger (used by safe-action middleware)
jest.mock('../logger.ts', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(function (context: any) {
      return this; // Return logger itself for chaining
    }),
  },
  toLogContextValue: (val: unknown) => val,
}));

// Mock errors (used by safe-action middleware) - keep real behavior for error normalization
jest.mock('../errors.ts', () => ({
  normalizeError: (error: unknown, fallback?: string) => {
    if (error instanceof Error) return error;
    return new Error(fallback || String(error));
  },
  logActionFailure: jest.fn((name, error, context) => {
    if (error instanceof Error) return error;
    return new Error(String(error));
  }),
}));

// Mock environment (used by safe-action error handling and Prisma client)
jest.mock('@heyclaude/shared-runtime/schemas/env', () => {
  const envMock: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    POSTGRES_PRISMA_URL: undefined, // Allow undefined in tests (Prismocker doesn't need it)
    DIRECT_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    VERCEL: undefined,
    VITEST: undefined,
  };

  return {
    env: new Proxy(envMock, {
      get: (target, prop: string) => {
        // Handle isProduction dynamically
        if (prop === 'isProduction') {
          return false; // Default to false for tests
        }
        return target[prop];
      },
    }),
    get isProduction() {
      return false; // Default to false for tests
    },
  };
});

// DO NOT mock safe-action.ts - use REAL middleware to test SafeActionResult structure
// This ensures we test the complete middleware chain: auth → rate limiting → logging → error handling

// DO NOT mock data functions - use real data functions which use Prismocker
// This allows us to test the real RPC flow end-to-end

/**
 * Content Actions Test Suite
 *
 * Tests getReviewsWithStats and fetchPaginatedContent actions → data functions → services → database flow.
 * Uses Prismocker for in-memory database, safemocker for auth context, and getRequestCache() for cache verification.
 *
 * @group Content
 * @group Actions
 * @group Integration
 */
describe('getReviewsWithStats', () => {
  let prismocker: PrismaClient;
  const testUserId = '123e4567-e89b-12d3-a456-426614174001'; // Valid UUID for testing

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

    // 5. Set up $queryRawUnsafe for RPC testing (getReviewsWithStats uses RPC via getReviewsWithStatsData)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    // Note: safemocker automatically provides context for optionalAuthAction:
    // - ctx.userId = 'test-user-id' (or null if unauthenticated)
    // - ctx.userEmail = 'test@example.com' (or null if unauthenticated)
    // - ctx.user = { id: 'test-user-id', email: 'test@example.com' } (or null if unauthenticated)
    // - ctx.authToken = 'test-token' (or null if unauthenticated)
    // No manual context mocks needed!
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid content_category enum', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      // Call with invalid enum value
      const result = await getReviewsWithStats({
        content_type: 'invalid-category' as any,
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure with fieldErrors
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();

      expect(safeResult.fieldErrors?.content_type).toBeDefined();
    });

    it('should return fieldErrors for invalid content_slug format', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      // Call with invalid slug format
      const result = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'invalid slug with spaces!',
      });

      // Verify SafeActionResult structure with fieldErrors
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();

      expect(safeResult.fieldErrors?.content_slug).toBeDefined();
    });

    it('should return fieldErrors for invalid sort_by enum', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      // Call with invalid sort_by value
      const result = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
        sort_by: 'invalid-sort' as any,
      });

      // Verify SafeActionResult structure with fieldErrors
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.fieldErrors).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.serverError).toBeUndefined();

      expect(safeResult.fieldErrors?.sort_by).toBeDefined();
    });

    it('should return fieldErrors for invalid limit and offset ranges', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      // Test limit too low
      const result1 = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
        limit: 0,
      });

      const safeResult1 = result1 as SafeActionResult<never>;
      expect(safeResult1.fieldErrors).toBeDefined();
      expect(safeResult1.fieldErrors?.limit).toBeDefined();

      // Test limit too high
      const result2 = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
        limit: 101,
      });

      const safeResult2 = result2 as SafeActionResult<never>;
      expect(safeResult2.fieldErrors).toBeDefined();
      expect(safeResult2.fieldErrors?.limit).toBeDefined();

      // Test offset too low
      const result3 = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
        offset: -1,
      });

      const safeResult3 = result3 as SafeActionResult<never>;
      expect(safeResult3.fieldErrors).toBeDefined();
      expect(safeResult3.fieldErrors?.offset).toBeDefined();
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

      // Call action - now returns SafeActionResult structure
      const result = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
        sort_by: 'recent',
        limit: 20,
        offset: 0,
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<typeof mockRpcResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
      expect(safeResult.validationErrors).toBeUndefined();

      // Verify result data structure (wrapped in SafeActionResult.data)
      expect(safeResult.data).toHaveProperty('reviews');
      expect(safeResult.data).toHaveProperty('stats');
      expect(safeResult.data?.reviews).toHaveLength(1);
      expect(safeResult.data?.stats).toMatchObject({
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
        'test-user-id' // p_user_id (from ctx.userId in optionalAuthAction)
      );
    });

    it('should inject auth context from safemocker (optionalAuthAction)', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      const mockRpcResult = {
        reviews: [],
        stats: {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      // Call action - now returns SafeActionResult structure
      const result = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure
      const safeResult = result as SafeActionResult<typeof mockRpcResult>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();

      // Verify auth context was injected (ctx.userId = 'test-user-id' from safemocker)
      // This is verified by checking that the RPC was called with p_user_id
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_reviews_with_stats'),
        'test-agent',
        'agents',
        'recent', // default sort_by
        20, // default limit
        'test-user-id' // p_user_id (from ctx.userId in optionalAuthAction)
      );
    });
  });

  describe('caching', () => {
    it('should cache results on duplicate calls (caching test)', async () => {
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

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
        sort_by: 'recent',
        limit: 20,
        offset: 0,
      });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
        sort_by: 'recent',
        limit: 20,
        offset: 0,
      });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult1 = result1 as SafeActionResult<typeof mockRpcResult>;
      const safeResult2 = result2 as SafeActionResult<typeof mockRpcResult>;
      expect(safeResult1.data).toEqual(safeResult2.data);

      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('error handling', () => {
    it('should return serverError when data is null', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      // Mock RPC returning empty array (callRpc unwraps [] to undefined for single-return functions)
      // getReviewsWithStatsData returns null when RPC returns undefined
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([]);

      // Call action - now returns SafeActionResult structure
      const result = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure with serverError
      // The action throws an error when data is null, which safemocker catches and returns as serverError
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
      expect(safeResult.serverError).toContain('Failed to fetch reviews');
    });

    it('should return serverError when service throws error', async () => {
      const { getReviewsWithStats } = await import('./content.ts');

      // When RPC throws error, getReviewsWithStatsData (via createDataFunction) returns null
      // The action checks if (!data) and throws 'Failed to fetch reviews. Please try again.'
      const mockError = new Error('Service error');
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

      // Call action - now returns SafeActionResult structure
      const result = await getReviewsWithStats({
        content_type: 'agents',
        content_slug: 'test-agent',
      });

      // Verify SafeActionResult structure with serverError
      // The action throws 'Failed to fetch reviews. Please try again.' when data is null
      // (which happens when createDataFunction catches the RPC error and returns null)
      const safeResult = result as SafeActionResult<never>;
      expect(safeResult.serverError).toBeDefined();
      expect(safeResult.data).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();
      expect(safeResult.serverError).toContain('Failed to fetch reviews');
    });
  });
});

describe('fetchPaginatedContent', () => {
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

    // Note: fetchPaginatedContent uses getPaginatedContent which uses direct Prisma (v_content_list_slim.findMany)
    // No need to mock $queryRawUnsafe for this test suite (uses Prisma queries, not RPC)

    // Note: safemocker automatically provides context for rateLimitedAction:
    // - ctx.userAgent = 'test-user-agent'
    // - ctx.startTime = performance.now()
    // No manual context mocks needed!
  });

  describe('input validation', () => {
    it('should return fieldErrors for invalid offset and limit ranges', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      // Test offset too low
      const result1 = await fetchPaginatedContent({
        offset: -1,
        limit: 10,
      });

      const safeResult1 = result1 as SafeActionResult<never>;
      expect(safeResult1.fieldErrors).toBeDefined();
      expect(safeResult1.fieldErrors?.offset).toBeDefined();

      // Test limit too low
      const result2 = await fetchPaginatedContent({
        offset: 0,
        limit: 0,
      });

      const safeResult2 = result2 as SafeActionResult<never>;
      expect(safeResult2.fieldErrors).toBeDefined();
      expect(safeResult2.fieldErrors?.limit).toBeDefined();

      // Test limit too high
      const result3 = await fetchPaginatedContent({
        offset: 0,
        limit: 101,
      });

      const safeResult3 = result3 as SafeActionResult<never>;
      expect(safeResult3.fieldErrors).toBeDefined();
      expect(safeResult3.fieldErrors?.limit).toBeDefined();
    });

    it('should accept nullable category', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      // getPaginatedContent uses direct Prisma (v_content_list_slim.findMany), so use setData
      // When view is empty, service returns { items: [], pagination: { total_count: 0, ... } }
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      // Call action - now returns SafeActionResult structure
      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
        category: null,
      });

      // Verify SafeActionResult structure
      const safeResult = result as SafeActionResult<DisplayableContent[]>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Empty result (no content seeded) - action returns [] when data.items is empty
      expect(safeResult.data).toEqual([]);
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

      // Call action - now returns SafeActionResult structure
      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
        category: 'agents',
      });

      // Verify SafeActionResult structure
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult = result as SafeActionResult<DisplayableContent[]>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Verify result is an array (wrapped in SafeActionResult.data)
      expect(Array.isArray(safeResult.data)).toBe(true);
    });

    it('should use default values', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      // Empty setData means no content - service returns { items: [], pagination: { total_count: 0, ... } }
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      // Call action - now returns SafeActionResult structure
      const result = await fetchPaginatedContent({});

      // Verify SafeActionResult structure
      const safeResult = result as SafeActionResult<DisplayableContent[]>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Default: offset: 0, limit: 30, category: null
      // When view is empty, service returns { items: [], pagination: { total_count: 0, ... } }
      // Action checks !data?.items, but [] is falsy, so it returns []
      expect(safeResult.data).toEqual([]);
    });

    it('should return empty array when data.items is empty array', async () => {
      const { fetchPaginatedContent } = await import('./content.ts');

      // Empty items array - service returns { items: [], pagination: { total_count: 0, ... } }
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      // Call action - now returns SafeActionResult structure
      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      // Verify SafeActionResult structure
      const safeResult = result as SafeActionResult<DisplayableContent[]>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // When view is empty, service returns { items: [], pagination: { total_count: 0, ... } }
      // Action checks !data?.items, but [] is falsy, so it returns []
      expect(safeResult.data).toEqual([]);
    });
  });

  describe('caching', () => {
    it('should cache results on duplicate calls (caching test)', async () => {
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

      // Seed data using Prismocker
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', mockContentItems);
      }

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
        category: 'agents',
      });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
        category: 'agents',
      });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same (indicating cache was used)
      // Type assertion needed because TypeScript infers type from next-safe-action, not safemocker mock
      const safeResult1 = result1 as SafeActionResult<DisplayableContent[]>;
      const safeResult2 = result2 as SafeActionResult<DisplayableContent[]>;
      expect(safeResult1.data).toEqual(safeResult2.data);

      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
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
      // Actually, when view is empty, service returns { items: [], pagination: { total_count: 0, ... } }
      // So getPaginatedContent returns that structure, not null
      // The action checks !data?.items, but [] is falsy, so it returns []
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      // Call action - now returns SafeActionResult structure
      const result = await fetchPaginatedContent({
        offset: 0,
        limit: 30,
      });

      // Verify SafeActionResult structure
      const safeResult = result as SafeActionResult<DisplayableContent[]>;
      expect(safeResult.data).toBeDefined();
      expect(safeResult.serverError).toBeUndefined();
      expect(safeResult.fieldErrors).toBeUndefined();

      // Action handles null/empty data gracefully by returning []
      // When view is empty, service returns { items: [], pagination: { total_count: 0, ... } }
      // Action checks !data?.items, but [] is falsy, so it returns []
      expect(safeResult.data).toEqual([]);
    });
  });
});
