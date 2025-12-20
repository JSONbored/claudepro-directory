import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getFilteredJobs, buildFilterJobsArgs } from './jobs';
import type { JobsFilterOptions } from './jobs';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock type guards - create mocks that can be reset in beforeEach
// Use globalThis to avoid temporal dead zone issues
if (!(globalThis as any).__typeGuardMocks) {
  (globalThis as any).__typeGuardMocks = {
    isValidJobCategory: vi.fn((cat: string) => ['engineering', 'design', 'product'].includes(cat)),
    isValidJobType: vi.fn((type: string) => ['full-time', 'part-time', 'contract'].includes(type)),
    isValidExperienceLevel: vi.fn((level: string) => ['entry', 'mid', 'senior'].includes(level)),
  };
}

// Mock type guards - path must match the import in jobs.ts (../utils/type-guards.ts)
vi.mock('../utils/type-guards.ts', () => {
  const mocks = (globalThis as any).__typeGuardMocks;
  if (!mocks) {
    // Fallback if mocks weren't initialized
    return {
      isValidJobCategory: vi.fn((cat: string) => ['engineering', 'design', 'product'].includes(cat)),
      isValidJobType: vi.fn((type: string) => ['full-time', 'part-time', 'contract'].includes(type)),
      isValidExperienceLevel: vi.fn((level: string) => ['entry', 'mid', 'senior'].includes(level)),
    };
  }
  return {
    isValidJobCategory: mocks.isValidJobCategory,
    isValidJobType: mocks.isValidJobType,
    isValidExperienceLevel: mocks.isValidExperienceLevel,
  };
});

// Mock service factory
const mockSearchService = {
  filterJobs: vi.fn(),
};

vi.mock('./service-factory.ts', () => ({
  getService: vi.fn(async (serviceKey: string) => {
    if (serviceKey === 'search') {
      return mockSearchService;
    }
    throw new Error(`Unknown service: ${serviceKey}`);
  }),
}));

// Mock cached-data-factory - use Map pattern to avoid temporal dead zone
if (!(globalThis as any).__jobsMocks) {
  (globalThis as any).__jobsMocks = new Map<string, ReturnType<typeof vi.fn>>();
}

vi.mock('./cached-data-factory.ts', () => {
  // Ensure mockFunctions exists before the mock factory runs
  if (!(globalThis as any).__jobsMocks) {
    (globalThis as any).__jobsMocks = new Map();
  }
  const mockFunctions = (globalThis as any).__jobsMocks;
  return {
    createDataFunction: vi.fn((config) => {
      // Create a mock function for this operation and store it
      const mockFn = vi.fn();
      if (config.operation && mockFunctions) {
        mockFunctions.set(config.operation, mockFn);
      }
      return mockFn;
    }),
  };
});

// Mock pulse
vi.mock('./pulse.ts', () => ({
  pulseJobSearch: vi.fn(() => Promise.resolve()),
}));

// Mock logger
vi.mock('../logger.ts', () => ({
  logger: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    })),
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock normalizeError, requireEnvVar, and createPinoConfig
vi.mock('@heyclaude/shared-runtime', () => ({
  normalizeError: vi.fn((error, message) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message || String(error));
  }),
  requireEnvVar: vi.fn((name: string) => {
    // Return mock env var values for testing
    const mockEnvVars: Record<string, string> = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_ANON_KEY: 'test-anon-key',
    };
    return mockEnvVars[name] || `mock-${name}`;
  }),
  createPinoConfig: vi.fn(() => ({
    level: 'info',
    transport: undefined,
  })),
}));

describe('jobs', () => {
  let mockGetJobsListCached: ReturnType<typeof vi.fn>;
  let mockGetFilteredJobsCached: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Get the mock functions that were created when the module loaded
    const mocks = (globalThis as any).__jobsMocks;
    mockGetJobsListCached = mocks?.get('getJobsListCached') || vi.fn();
    mockGetFilteredJobsCached = mocks?.get('getFilteredJobsCached') || vi.fn();
    // Reset them for each test (but don't clear all mocks - that would clear the validation mocks)
    mockGetJobsListCached.mockReset();
    mockGetFilteredJobsCached.mockReset();
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
    it('should use cached list when no filters', async () => {
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockGetJobsListCached.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({});

      // Default limit is 30 (QUERY_LIMITS.pagination.default), offset defaults to 0
      expect(mockGetJobsListCached).toHaveBeenCalledWith({ limit: 30, offset: 0 });
      expect(result).toEqual(mockResult);
    });

    it('should use cached list when all filters are default values', async () => {
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockGetJobsListCached.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({
        category: 'all',
        employment: 'any',
        experience: 'any',
      });

      expect(mockGetJobsListCached).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should use filtered cache when search query provided', async () => {
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockGetFilteredJobsCached.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({ searchQuery: 'developer' });

      expect(mockGetFilteredJobsCached).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should use filtered cache when category provided', async () => {
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockGetFilteredJobsCached.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({ category: 'engineering' });

      expect(mockGetFilteredJobsCached).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should bypass cache when noCache=true', async () => {
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockSearchService.filterJobs.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({ searchQuery: 'developer' }, true);

      expect(mockSearchService.filterJobs).toHaveBeenCalled();
      expect(mockGetFilteredJobsCached).not.toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should handle empty string search query', async () => {
      // BUG POTENTIAL: Empty string might be treated as a filter
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockGetJobsListCached.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({ searchQuery: '' });

      // Empty string should not trigger filtered search
      expect(mockGetJobsListCached).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should handle whitespace-only search query', async () => {
      // Whitespace-only is treated as a filter (searchQuery !== '')
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockGetFilteredJobsCached.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({ searchQuery: '   ' });

      // Whitespace-only triggers filtered search (hasFilters = true)
      expect(mockGetFilteredJobsCached).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should return null on cached list error', async () => {
      mockGetJobsListCached.mockRejectedValue(new Error('Service error'));

      const result = await getFilteredJobs({});

      expect(result).toBeNull();
    });

    it('should return null on filtered cache error', async () => {
      mockGetFilteredJobsCached.mockRejectedValue(new Error('Service error'));

      const result = await getFilteredJobs({ searchQuery: 'developer' });

      expect(result).toBeNull();
    });

    it('should return null on noCache direct service error', async () => {
      mockSearchService.filterJobs.mockRejectedValue(new Error('Service error'));

      const result = await getFilteredJobs({ searchQuery: 'developer' }, true);

      expect(result).toBeNull();
    });

    it('should use default limit when limit is undefined', async () => {
      // FIXED: Now uses QUERY_LIMITS.pagination.default (30) instead of 0
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockGetJobsListCached.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({ limit: undefined });

      expect(mockGetJobsListCached).toHaveBeenCalledWith({ limit: 30, offset: 0 });
      expect(result).toEqual(mockResult);
    });

    it('should handle undefined offset in no-filters case', async () => {
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockGetJobsListCached.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({ offset: undefined });

      // Default limit is 30, offset defaults to 0
      expect(mockGetJobsListCached).toHaveBeenCalledWith({ limit: 30, offset: 0 });
      expect(result).toEqual(mockResult);
    });

    it('should handle negative limit', async () => {
      // BUG POTENTIAL: Negative limit might cause issues
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockGetJobsListCached.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({ limit: -10 });

      expect(mockGetJobsListCached).toHaveBeenCalledWith({ limit: -10, offset: 0 });
      expect(result).toEqual(mockResult);
    });

    it('should handle negative offset', async () => {
      // BUG POTENTIAL: Negative offset might cause issues
      const mockResult = { hits: [], pagination: { total: 0 } };
      mockGetJobsListCached.mockResolvedValue(mockResult);

      const result = await getFilteredJobs({ offset: -10 });

      // Default limit is 30, offset is -10
      expect(mockGetJobsListCached).toHaveBeenCalledWith({ limit: 30, offset: -10 });
      expect(result).toEqual(mockResult);
    });
  });
});
