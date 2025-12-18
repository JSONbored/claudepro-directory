import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock safe-action middleware
vi.mock('./safe-action.ts', () => {
  const createActionMock = (schema: any) => ({
    action: vi.fn((handler) => {
      return async (input: unknown) => {
        const parsed = schema.parse(input);
        return handler({ parsedInput: parsed, ctx: {} });
      };
    }),
  });

  return {
    rateLimitedAction: {
      inputSchema: vi.fn((schema) => ({
        metadata: vi.fn(() => createActionMock(schema)),
      })),
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
      const { getPopularSearches: getPopularSearchesData } = await import('../data/search/facets.ts');

      vi.mocked(getPopularSearchesData).mockResolvedValue([]);

      await getPopularSearches({
        limit: 50,
      });

      expect(getPopularSearchesData).toHaveBeenCalledWith(50);
    });

    it('should default to limit 100', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } = await import('../data/search/facets.ts');

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
      const { getPopularSearches: getPopularSearchesData } = await import('../data/search/facets.ts');

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
      const { rateLimitedAction } = await import('./safe-action.ts');

      // Verify metadata is set (indirectly through action chain)
      expect(rateLimitedAction.inputSchema).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle getPopularSearches returning null', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } = await import('../data/search/facets.ts');

      vi.mocked(getPopularSearchesData).mockResolvedValue(null as any);

      const result = await getPopularSearches({});

      expect(result).toBeNull();
    });

    it('should handle getPopularSearches returning empty array', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } = await import('../data/search/facets.ts');

      vi.mocked(getPopularSearchesData).mockResolvedValue([]);

      const result = await getPopularSearches({});

      expect(result).toEqual([]);
    });

    it('should handle lazy import errors for data/search/facets', async () => {
      const { getPopularSearches } = await import('./search.ts');
      const { getPopularSearches: getPopularSearchesData } = await import('../data/search/facets.ts');

      vi.mocked(getPopularSearchesData).mockRejectedValue(new Error('Import failed'));

      await expect(
        getPopularSearches({})
      ).rejects.toThrow();
    });
  });
});
