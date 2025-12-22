import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getFilteredJobs, buildFilterJobsArgs } from './jobs';
import type { JobsFilterOptions } from './jobs';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import { SearchService } from '@heyclaude/data-layer/services/search.ts';
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
import { clearRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock type guards - create mocks that can be reset in beforeEach
// Use globalThis to avoid temporal dead zone issues
if (!(globalThis as any).__typeGuardMocks) {
  (globalThis as any).__typeGuardMocks = {
    isValidJobCategory: jest.fn((cat: string) => ['engineering', 'design', 'product'].includes(cat)),
    isValidJobType: jest.fn((type: string) => ['full-time', 'part-time', 'contract'].includes(type)),
    isValidExperienceLevel: jest.fn((level: string) => ['entry', 'mid', 'senior'].includes(level)),
  };
}

// Mock type guards - path must match the import in jobs.ts (../utils/type-guards.ts)
jest.mock('../utils/type-guards.ts', () => {
  const mocks = (globalThis as any).__typeGuardMocks;
  if (!mocks) {
    // Fallback if mocks weren't initialized
    return {
      isValidJobCategory: jest.fn((cat: string) => ['engineering', 'design', 'product'].includes(cat)),
      isValidJobType: jest.fn((type: string) => ['full-time', 'part-time', 'contract'].includes(type)),
      isValidExperienceLevel: jest.fn((level: string) => ['entry', 'mid', 'senior'].includes(level)),
    };
  }
  return {
    isValidJobCategory: mocks.isValidJobCategory,
    isValidJobType: mocks.isValidJobType,
    isValidExperienceLevel: mocks.isValidExperienceLevel,
  };
});

// Mock pulse
jest.mock('./pulse.ts', () => ({
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

// Mock normalizeError
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

describe('jobs', () => {
  let prismocker: PrismaClient;
  let searchService: SearchService;
  let filterJobsSpy: ReturnType<typeof jest.SpyInstance>;

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
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);

    jest.clearAllMocks();

    // Create real SearchService instance for spying
    searchService = new SearchService();
    filterJobsSpy = jest.spyOn(searchService, 'filterJobs');

    // Mock getService to return our spied service instance
    const { getService } = await import('./service-factory.ts');
    jest.spyOn(await import('./service-factory.ts'), 'getService').mockResolvedValue(searchService as any);

    // Re-setup validation mocks (restore their implementations)
    const typeGuardMocks = (globalThis as any).__typeGuardMocks;
    if (typeGuardMocks) {
      typeGuardMocks.isValidJobCategory.mockImplementation((cat: string) => ['engineering', 'design', 'product'].includes(cat));
      typeGuardMocks.isValidJobType.mockImplementation((type: string) => ['full-time', 'part-time', 'contract'].includes(type));
      typeGuardMocks.isValidExperienceLevel.mockImplementation((level: string) => ['entry', 'mid', 'senior'].includes(level));
    }
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
      // Ensure mock is set up - the mock should return true for 'senior'
      const typeGuardMocks = (globalThis as any).__typeGuardMocks;
      if (typeGuardMocks?.isValidExperienceLevel) {
        typeGuardMocks.isValidExperienceLevel.mockReturnValue(true);
      }
      
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

      filterJobsSpy.mockResolvedValue(mockRpcResult);

      const result = await getFilteredJobs({});

      // Default limit is 30 (QUERY_LIMITS.pagination.default), offset defaults to 0
      expect(filterJobsSpy).toHaveBeenCalledWith({
        p_limit: 30,
        p_offset: 0,
      });
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

      filterJobsSpy.mockResolvedValue(mockRpcResult);

      const result = await getFilteredJobs({
        category: 'all',
        employment: 'any',
        experience: 'any',
      });

      // Should use getJobsListCached (no filters path)
      expect(filterJobsSpy).toHaveBeenCalledWith({
        p_limit: 30,
        p_offset: 0,
      });
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

      filterJobsSpy.mockResolvedValue(mockRpcResult);

      const result = await getFilteredJobs({ searchQuery: 'developer' });

      // Should use getFilteredJobsCached (has filters path)
      expect(filterJobsSpy).toHaveBeenCalledWith({
        p_search_query: 'developer',
        p_limit: undefined,
        p_offset: undefined,
      });
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

      filterJobsSpy.mockResolvedValue(mockRpcResult);

      const result = await getFilteredJobs({ category: 'engineering' });

      // Should use getFilteredJobsCached (has filters path)
      expect(filterJobsSpy).toHaveBeenCalledWith({
        p_category: 'engineering',
        p_limit: undefined,
        p_offset: undefined,
      });
      expect(result).toMatchObject({
        hits: [],
        pagination: { total: 0 },
      });
    });

    it('should return null on error', async () => {
      filterJobsSpy.mockRejectedValue(new Error('Service error'));

      const result = await getFilteredJobs({});

      expect(result).toBeNull();
    });

    it('should use default limit when limit is undefined', async () => {
      const mockRpcResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };

      filterJobsSpy.mockResolvedValue(mockRpcResult);

      const result = await getFilteredJobs({ limit: undefined });

      // Should use default limit of 30
      expect(filterJobsSpy).toHaveBeenCalledWith({
        p_limit: 30,
        p_offset: 0,
      });
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

      filterJobsSpy.mockResolvedValue(mockRpcResult);

      const result = await getFilteredJobs({ offset: undefined });

      // Should use default offset of 0
      expect(filterJobsSpy).toHaveBeenCalledWith({
        p_limit: 30,
        p_offset: 0,
      });
      expect(result).toMatchObject({
        hits: [],
        pagination: { total: 0 },
      });
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      // getFilteredJobs uses createDataFunction which uses withSmartCache
      // Services use withSmartCache which caches RPC calls
      const mockRpcResult: FilterJobsReturns = {
        hits: [],
        pagination: { total: 0, limit: 30, offset: 0 },
      };

      filterJobsSpy.mockResolvedValue(mockRpcResult);

      // First call - should hit service and populate cache
      const result1 = await getFilteredJobs({});
      const firstCallCount = filterJobsSpy.mock.calls.length;

      // Second call - should hit cache (no service call)
      const result2 = await getFilteredJobs({});
      const secondCallCount = filterJobsSpy.mock.calls.length;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);
      
      // Verify filterJobs was only called once (cached on second call)
      expect(secondCallCount).toBe(firstCallCount);
      expect(secondCallCount).toBe(1);
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

      filterJobsSpy
        .mockResolvedValueOnce(mockUnfilteredResult)
        .mockResolvedValueOnce(mockFilteredResult);

      // First call - no filters
      const result1 = await getFilteredJobs({});
      expect(filterJobsSpy).toHaveBeenCalledTimes(1);

      // Second call - with filters (different cache key)
      const result2 = await getFilteredJobs({ category: 'engineering' });
      expect(filterJobsSpy).toHaveBeenCalledTimes(2);

      // Third call - same as first (should use cache)
      const result3 = await getFilteredJobs({});
      expect(filterJobsSpy).toHaveBeenCalledTimes(2); // Still 2, cached

      // Fourth call - same as second (should use cache)
      const result4 = await getFilteredJobs({ category: 'engineering' });
      expect(filterJobsSpy).toHaveBeenCalledTimes(2); // Still 2, cached

      expect(result1).toEqual(result3);
      expect(result2).toEqual(result4);
    });
  });
});
