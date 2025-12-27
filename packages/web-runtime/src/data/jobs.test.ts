import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getFilteredJobs, buildFilterJobsArgs } from './jobs';
import type { JobsFilterOptions } from './jobs';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { FilterJobsReturns } from '@heyclaude/database-types/postgres-types';

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
import { clearRequestCache, getRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock type guards - path must match the import in jobs.ts (../utils/type-guards.ts)
// These are stateless validation functions, so simple implementations are sufficient
jest.mock('../utils/type-guards.ts', () => ({
  isValidJobCategory: jest.fn((cat: string) => ['engineering', 'design', 'product'].includes(cat)),
  isValidJobType: jest.fn((type: string) => ['full-time', 'part-time', 'contract'].includes(type)),
  isValidExperienceLevel: jest.fn((level: string) => ['entry', 'mid', 'senior'].includes(level)),
}));

// Mock pulse (imported from ../pulse.ts in jobs.ts)
jest.mock('../pulse.ts', () => ({
  pulseJobSearch: jest.fn(() => Promise.resolve()),
}));

// Mock logger
jest.mock('../logger.ts', () => ({
  logger: {
    child: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    })),
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock normalizeError - path matches import in jobs.ts
jest.mock('@heyclaude/shared-runtime', () => ({
  normalizeError: jest.fn((error, message) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message || String(error));
  }),
}));

// Don't mock createDataFunction - use real implementation
// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts

/**
 * Jobs Data Functions Test Suite
 *
 * Tests getFilteredJobs data function → SearchService → database flow.
 * Uses Prismocker for in-memory database and getRequestCache() for cache verification.
 *
 * @group Jobs
 * @group DataFunctions
 * @group Integration
 */
describe('jobs', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test
    clearRequestCache();

    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Use Prismocker's Proxy set handler to override $queryRawUnsafe for RPC calls
    (prismocker as any).$queryRawUnsafe = jest.fn<() => Promise<any[]>>().mockResolvedValue([]);

    jest.clearAllMocks();
  });

  describe('buildFilterJobsArgs', () => {
    it('should build args with search query', () => {
      const result = buildFilterJobsArgs({ searchQuery: 'developer' });
      expect(result).toHaveProperty('p_search_query', 'developer');
    });

    it('should build args with valid category', () => {
      const result = buildFilterJobsArgs({ category: 'engineering' });
      expect(result).toHaveProperty('p_category', 'engineering');
    });

    it('should ignore category "all"', () => {
      const result = buildFilterJobsArgs({ category: 'all' });
      expect(result).not.toHaveProperty('p_category');
    });

    it('should ignore invalid category', () => {
      const result = buildFilterJobsArgs({ category: 'invalid-category' });
      expect(result).not.toHaveProperty('p_category');
    });

    it('should build args with valid employment type', () => {
      const result = buildFilterJobsArgs({ employment: 'full-time' });
      expect(result).toHaveProperty('p_employment_type', 'full-time');
    });

    it('should ignore employment "any"', () => {
      const result = buildFilterJobsArgs({ employment: 'any' });
      expect(result).not.toHaveProperty('p_employment_type');
    });

    it('should build args with valid experience level', () => {
      const result = buildFilterJobsArgs({ experience: 'senior' });
      expect(result).toHaveProperty('p_experience_level', 'senior');
    });

    it('should ignore experience "any"', () => {
      const result = buildFilterJobsArgs({ experience: 'any' });
      expect(result).not.toHaveProperty('p_experience_level');
    });

    it('should build args with remote flag', () => {
      const result = buildFilterJobsArgs({ remote: true });
      expect(result).toHaveProperty('p_remote_only', true);
    });

    it('should build args with limit and offset', () => {
      const result = buildFilterJobsArgs({ limit: 20, offset: 10 });
      expect(result).toHaveProperty('p_limit', 20);
      expect(result).toHaveProperty('p_offset', 10);
    });

    it('should handle undefined values', () => {
      const result = buildFilterJobsArgs({});
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle zero limit', () => {
      const result = buildFilterJobsArgs({ limit: 0 });
      expect(result).toHaveProperty('p_limit', 0);
    });

    it('should handle negative offset', () => {
      // BUG POTENTIAL: Negative offset might cause issues
      const result = buildFilterJobsArgs({ offset: -10 });
      expect(result).toHaveProperty('p_offset', -10);
    });
  });

  describe('getFilteredJobs', () => {
    it('should return jobs list when no filters', async () => {
      // getFilteredJobs calls getJobsListCached which calls SearchService.filterJobs
      // filterJobs uses callRpc which calls $queryRawUnsafe
      const mockRpcResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      const result = await getFilteredJobs({});

      // Default limit is 30 (QUERY_LIMITS.pagination.default), offset defaults to 0
      // callRpc builds query: SELECT * FROM filter_jobs(p_limit => $1, p_offset => $2)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('filter_jobs'),
        expect.anything(), // p_limit value
        expect.anything() // p_offset value
      );
      expect(result).toMatchObject({
        hits: [],
        pagination: { total: 0 },
      });
    });

    it('should use cached list when all filters are default values', async () => {
      const mockRpcResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      const result = await getFilteredJobs({
        category: 'all',
        employment: 'any',
        experience: 'any',
      });

      // Should use getJobsListCached (no filters path) - same as no filters
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toMatchObject({
        hits: [],
        pagination: { total: 0 },
      });
    });

    it('should use filtered cache when search query provided', async () => {
      const mockRpcResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      const result = await getFilteredJobs({ searchQuery: 'developer' });

      // Should use getFilteredJobsCached (has filters path)
      // callRpc builds query: SELECT * FROM filter_jobs(p_search_query => $1)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('filter_jobs'),
        expect.anything() // p_search_query value
      );
      expect(result).toMatchObject({
        hits: [],
        pagination: { total: 0 },
      });
    });

    it('should use filtered cache when category provided', async () => {
      const mockRpcResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      const result = await getFilteredJobs({ category: 'engineering' });

      // Should use getFilteredJobsCached (has filters path)
      // callRpc builds query: SELECT * FROM filter_jobs(p_category => $1)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('filter_jobs'),
        expect.anything() // p_category value
      );
      expect(result).toMatchObject({
        hits: [],
        pagination: { total: 0 },
      });
    });

    it('should return null on error', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
        new Error('Service error')
      );

      const result = await getFilteredJobs({});

      expect(result).toBeNull();
    });

    it('should use default limit when limit is undefined', async () => {
      const mockRpcResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      const result = await getFilteredJobs({ limit: undefined });

      // Should use default limit of 30
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toMatchObject({
        hits: [],
        pagination: { total: 0 },
      });
    });

    it('should handle undefined offset in no-filters case', async () => {
      const mockRpcResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      const result = await getFilteredJobs({ offset: undefined });

      // Should use default offset of 0
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalled();
      expect(result).toMatchObject({
        hits: [],
        pagination: { total: 0 },
      });
    });

    /**
     * Cache test: Verifies request-scoped caching using getRequestCache().getStats().size.
     */
    it('should cache results on duplicate calls (caching test)', async () => {
      const mockRpcResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockRpcResult,
      ] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getFilteredJobs({});
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getFilteredJobs({});
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });

    it('should cache filtered results separately from unfiltered results', async () => {
      const mockUnfilteredResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };
      const mockFilteredResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>)
        .mockResolvedValueOnce([mockUnfilteredResult] as any)
        .mockResolvedValueOnce([mockFilteredResult] as any);

      // First call - no filters
      const result1 = await getFilteredJobs({});
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);

      // Second call - with filters (different cache key)
      const result2 = await getFilteredJobs({ category: 'engineering' });
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(2);

      // Third call - same as first (should use cache)
      const result3 = await getFilteredJobs({});
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(2); // Still 2, cached

      // Fourth call - same as second (should use cache)
      const result4 = await getFilteredJobs({ category: 'engineering' });
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(2); // Still 2, cached

      expect(result1).toEqual(result3);
      expect(result2).toEqual(result4);
    });
  });
});
