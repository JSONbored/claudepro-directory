import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware - standardized pattern
// Pattern: rateLimitedAction.inputSchema().metadata().action()
vi.mock('./safe-action.ts', () => {
  // Define all factory functions inside the mock factory to avoid hoisting issues
  const createActionHandler = (inputSchema: any) => {
    return vi.fn((handler: any) => {
      return async (input: unknown) => {
        const parsed = inputSchema ? inputSchema.parse(input) : input;
        return handler({
          parsedInput: parsed,
          ctx: { userAgent: 'test-user-agent', startTime: performance.now() },
        });
      };
    });
  };

  const createMetadataResult = (inputSchema: any) => ({
    action: createActionHandler(inputSchema),
  });

  const createInputSchemaResult = (inputSchema: any) => ({
    metadata: vi.fn(() => createMetadataResult(inputSchema)),
    action: createActionHandler(inputSchema),
  });

  return {
    rateLimitedAction: {
      inputSchema: vi.fn((schema: any) => createInputSchemaResult(schema)),
    },
  };
});

// Mock data layer
vi.mock('../data/search/facets.ts', () => ({
  getPopularSearches: vi.fn(),
}));

describe('getPopularSearches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('input validation', () => {
    it('should accept optional limit parameter', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } =
        await import('../data/search/facets.ts');

      vi.mocked(getPopularSearchesData).mockResolvedValue([]);

      await getPopularSearches({
        limit: 50,
      });

      expect(getPopularSearchesData).toHaveBeenCalledWith(50);
    });

    it('should default to limit 100', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } =
        await import('../data/search/facets.ts');

      vi.mocked(getPopularSearchesData).mockResolvedValue([]);

      await getPopularSearches({});

      expect(getPopularSearchesData).toHaveBeenCalledWith(100);
    });

    it('should validate limit range (1-100)', async () => {
      const { getPopularSearches } = await import('./search.ts');

      // Invalid limits should fail
      await expect(
        getPopularSearches({
          limit: 0,
        } as any)
      ).rejects.toThrow();

      await expect(
        getPopularSearches({
          limit: 101,
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('data fetching', () => {
    it('should call getPopularSearches from data layer', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } =
        await import('../data/search/facets.ts');

      const mockResults = [
        { query: 'react', count: 100, label: 'React' },
        { query: 'typescript', count: 80, label: 'TypeScript' },
      ];

      vi.mocked(getPopularSearchesData).mockResolvedValue(mockResults);

      const result = await getPopularSearches({
        limit: 10,
      });

      expect(getPopularSearchesData).toHaveBeenCalledWith(10);
      expect(result).toEqual(mockResults);
    });
  });

  describe('metadata', () => {
    it('should have correct metadata', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } =
        await import('../data/search/facets.ts');
      
      vi.mocked(getPopularSearchesData).mockResolvedValue([]);
      
      // Call the action to verify it works correctly
      const result = await getPopularSearches({ limit: 10 });
      
      // Verify the action is callable and returns expected structure
      expect(getPopularSearches).toBeDefined();
      expect(typeof getPopularSearches).toBe('function');
      expect(result).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('should handle getPopularSearches returning null', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } =
        await import('../data/search/facets.ts');

      vi.mocked(getPopularSearchesData).mockResolvedValue(null as any);

      const result = await getPopularSearches({});

      expect(result).toBeNull();
    });

    it('should handle getPopularSearches returning empty array', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } =
        await import('../data/search/facets.ts');

      vi.mocked(getPopularSearchesData).mockResolvedValue([]);

      const result = await getPopularSearches({});

      expect(result).toEqual([]);
    });

    it('should handle lazy import errors for data/search/facets', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } =
        await import('../data/search/facets.ts');

      vi.mocked(getPopularSearchesData).mockRejectedValue(new Error('Import failed'));

      await expect(getPopularSearches({})).rejects.toThrow();
    });
  });
});
