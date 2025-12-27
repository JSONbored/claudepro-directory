import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getHomepageData } from './homepage';
import { ContentService } from '@heyclaude/data-layer';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { clearRequestCache, getRequestCache } from '@heyclaude/data-layer/utils/request-cache';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock RPC error logging utility
jest.mock('@heyclaude/data-layer/utils/rpc-error-logging', () => ({
  logRpcError: jest.fn(),
}));

// Mock service-factory to return real ContentService with Prismocker
jest.mock('../service-factory', () => {
  let contentServiceInstance: ContentService | null = null;
  return {
    getService: jest.fn(async (serviceKey: string) => {
      if (serviceKey === 'content') {
        if (!contentServiceInstance) {
          const { ContentService } = await import('@heyclaude/data-layer');
          contentServiceInstance = new ContentService(prisma);
        }
        return contentServiceInstance;
      }
      throw new Error(`Unknown service: ${serviceKey}`);
    }),
  };
});

/**
 * Homepage Data Functions Test Suite
 *
 * Comprehensive unit and integration tests for getHomepageData, including:
 * - Data function configuration (serviceKey, methodName, transformArgs, logContext)
 * - Full integration flow: data function → ContentService → RPC → database
 * - Request-scoped caching behavior verification
 * - Error handling and edge cases
 *
 * All tests use Prismocker for in-memory database mocking and proper cache testing
 * using getRequestCache().getStats().size instead of spying on Prisma methods.
 *
 * @module HomepageDataTests
 * @see {@link getHomepageData} - The data function being tested
 * @see {@link ContentService} - Service used in integration tests
 */
describe('homepage data functions', () => {
  let prismocker: PrismaClient;

  /**
   * Sets up test environment before each test case.
   *
   * Performs the following operations in order:
   * 1. Clears request-scoped cache for test isolation
   * 2. Gets Prismocker instance (in-memory database mock)
   * 3. Resets Prismocker data to ensure clean state
   * 4. Clears all Jest mocks
   * 5. Sets up $queryRawUnsafe spy for RPC function testing
   *
   * @private
   * @async
   * @returns {Promise<void>} Resolves when setup is complete
   */
  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();

    // 5. Set up $queryRawUnsafe for RPC testing (if needed)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    (prismocker as any).$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  /**
   * Tests for getHomepageData configuration.
   *
   * Verifies that the data function is created with correct configuration,
   * including serviceKey, methodName, transformArgs, and logContext.
   *
   * @group HomepageData
   * @group Configuration
   */
  describe('getHomepageData', () => {
    /**
     * Verifies data function is created and callable.
     *
     * Tests that getHomepageData is a function that can be called.
     *
     * @test
     */
    it('should be created and callable', () => {
      // The function is created at module load time
      // We can verify it exists and is callable
      expect(typeof getHomepageData).toBe('function');
    });

    /**
     * Verifies argument transformation works correctly.
     *
     * Tests that categoryIds array is transformed to RPC arguments
     * with p_category_ids and p_limit.
     *
     * @test
     */
    it('should transform args correctly', async () => {
      const categoryIds = ['agents', 'mcp'] as const;
      const mockResult = {
        content: {
          agents: [],
          mcp: [],
        },
        member_count: 100,
        featured_jobs: [],
      };

      // Mock RPC result
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      // Call data function
      const result = await getHomepageData(categoryIds);

      // Verify RPC was called with transformed args
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_homepage_optimized'),
        expect.objectContaining({
          p_category_ids: ['agents', 'mcp'],
          p_limit: 6,
        })
      );

      // Verify result
      expect(result).toBeDefined();
    });

    /**
     * Verifies log context creates stable cache keys with sorted category IDs.
     *
     * Tests that logContext function sorts category IDs to ensure
     * stable cache keys regardless of input order.
     *
     * @test
     */
    it('should create stable log context with sorted category IDs', async () => {
      const categoryIds1 = ['b', 'a', 'c'] as const;
      const categoryIds2 = ['a', 'b', 'c'] as const;
      const mockResult = {
        content: {
          a: [],
          b: [],
          c: [],
        },
        member_count: 100,
        featured_jobs: [],
      };

      // Mock RPC result
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);

      // Call data function with different order
      await getHomepageData(categoryIds1);
      const firstCall = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls[0];

      // Reset and call again with sorted order
      jest.clearAllMocks();
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockResult,
      ] as any);
      await getHomepageData(categoryIds2);
      const secondCall = (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mock.calls[0];

      // Both calls should use the same args (sorted category IDs)
      expect(firstCall[1]).toEqual(secondCall[1]);
    });
  });

  /**
   * Integration tests for getHomepageData full flow.
   *
   * Verifies the complete data flow: data function → ContentService → RPC → database,
   * including:
   * - Data function calls ContentService.getHomepageOptimized
   * - ContentService calls RPC get_homepage_optimized
   * - RPC result is properly transformed and returned
   * - Request-scoped caching works correctly
   * - Error handling works properly
   *
   * @group Integration
   * @group HomepageData
   * @group ContentService
   * @group Caching
   */
  describe('Integration: getHomepageData → ContentService → Database', () => {
    /**
     * Verifies full integration flow from data function to database.
     *
     * Tests that getHomepageData correctly:
     * 1. Calls ContentService.getHomepageOptimized with transformed args
     * 2. ContentService calls RPC get_homepage_optimized
     * 3. RPC result is properly returned
     *
     * @test
     * @group Integration
     */
    it('should execute full flow: getHomepageData → ContentService → RPC → database', async () => {
      const categoryIds = ['agents', 'mcp', 'rules'] as const;
      const mockHomepageResult = {
        content: {
          agents: [
            {
              id: 'content-1',
              slug: 'agent-1',
              title: 'Agent 1',
              category: 'agents',
            },
          ],
          mcp: [
            {
              id: 'content-2',
              slug: 'mcp-1',
              title: 'MCP 1',
              category: 'mcp',
            },
          ],
          rules: [],
        },
        member_count: 150,
        featured_jobs: [
          {
            id: 'job-1',
            title: 'Featured Job',
            company_name: 'Company',
          },
        ],
      };

      // Mock RPC result
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockHomepageResult,
      ] as any);

      // Call data function
      const result = await getHomepageData(categoryIds);

      // Verify RPC was called with correct args
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_homepage_optimized'),
        expect.objectContaining({
          p_category_ids: ['agents', 'mcp', 'rules'],
          p_limit: 6,
        })
      );

      // Verify result structure
      expect(result).toBeDefined();
      expect(result).toMatchObject({
        content: expect.objectContaining({
          agents: expect.any(Array),
          mcp: expect.any(Array),
          rules: expect.any(Array),
        }),
        member_count: 150,
        featured_jobs: expect.any(Array),
      });
    });

    /**
     * Verifies request-scoped caching works correctly for getHomepageData.
     *
     * Tests that duplicate calls with the same parameters use the cache
     * instead of making additional database queries. Uses getRequestCache()
     * to verify cache size changes rather than spying on Prisma methods.
     *
     * @test
     * @group Integration
     * @group Caching
     */
    it('should cache results on duplicate calls (caching test)', async () => {
      const categoryIds = ['agents'] as const;
      const mockHomepageResult = {
        content: {
          agents: [
            {
              id: 'content-1',
              slug: 'agent-1',
              title: 'Agent 1',
              category: 'agents',
            },
          ],
        },
        member_count: 100,
        featured_jobs: [],
      };

      // Mock RPC result
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockHomepageResult,
      ] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getHomepageData(categoryIds);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call (should use cache)
      const result2 = await getHomepageData(categoryIds);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify cache worked
      expect(result1).toEqual(result2);

      // ✅ GOOD: Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);

      // Verify RPC was only called once (second call used cache)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });

    /**
     * Verifies error handling when RPC fails.
     *
     * Tests that getHomepageData properly handles errors from ContentService
     * and returns null (default behavior for data functions).
     *
     * @test
     * @group Integration
     * @group ErrorHandling
     */
    it('should handle RPC errors gracefully', async () => {
      const categoryIds = ['agents'] as const;

      // Mock RPC to throw error
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
        new Error('Database connection failed')
      );

      // Call data function - should handle error and return null
      const result = await getHomepageData(categoryIds);

      // Verify result is null (default error handling)
      expect(result).toBeNull();
    });

    /**
     * Verifies data function works with empty category IDs.
     *
     * Tests that getHomepageData handles empty category arrays correctly
     * and still calls the RPC with empty array.
     *
     * @test
     * @group Integration
     * @group EdgeCases
     */
    it('should handle empty category IDs array', async () => {
      const categoryIds = [] as const;
      const mockHomepageResult = {
        content: {},
        member_count: 0,
        featured_jobs: [],
      };

      // Mock RPC result
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockHomepageResult,
      ] as any);

      // Call data function
      const result = await getHomepageData(categoryIds);

      // Verify RPC was called with empty array
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_homepage_optimized'),
        expect.objectContaining({
          p_category_ids: [],
          p_limit: 6,
        })
      );

      // Verify result
      expect(result).toBeDefined();
      expect(result?.content).toEqual({});
    });

    /**
     * Verifies data function works with large category IDs arrays.
     *
     * Tests that getHomepageData handles large arrays of category IDs
     * correctly and transforms them properly.
     *
     * @test
     * @group Integration
     * @group EdgeCases
     */
    it('should handle large category IDs arrays', async () => {
      const categoryIds = [
        'agents',
        'mcp',
        'rules',
        'skills',
        'tools',
        'templates',
        'workflows',
        'integrations',
      ] as const;
      const mockHomepageResult = {
        content: {
          agents: [],
          mcp: [],
          rules: [],
          skills: [],
          tools: [],
          templates: [],
          workflows: [],
          integrations: [],
        },
        member_count: 200,
        featured_jobs: [],
      };

      // Mock RPC result
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockHomepageResult,
      ] as any);

      // Call data function
      const result = await getHomepageData(categoryIds);

      // Verify RPC was called with all category IDs
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_homepage_optimized'),
        expect.objectContaining({
          p_category_ids: expect.arrayContaining([
            'agents',
            'mcp',
            'rules',
            'skills',
            'tools',
            'templates',
            'workflows',
            'integrations',
          ]),
          p_limit: 6,
        })
      );

      // Verify result
      expect(result).toBeDefined();
      expect(result?.member_count).toBe(200);
    });
  });
});
