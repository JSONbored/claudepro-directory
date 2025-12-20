import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock server-only first
vi.mock('server-only', () => ({}));

// Mock category validation
vi.mock('@heyclaude/web-runtime/utils/category-validation', () => ({
  isValidCategory: vi.fn((cat: string) => ['agents', 'mcp', 'rules'].includes(cat)),
}));

// Mock service factory and data-layer
const mockSearchService = {
  getSearchFacets: vi.fn(),
  getTrendingSearches: vi.fn(),
};

vi.mock('../service-factory.ts', () => ({
  getService: vi.fn(async (serviceKey: string) => {
    if (serviceKey === 'search') {
      return mockSearchService;
    }
    throw new Error(`Unknown service: ${serviceKey}`);
  }),
}));

// Mock cached-data-factory - use Map pattern like paginated.test.ts
// Store mock functions in a Map that's accessible after import
if (!(globalThis as any).__facetsMocks) {
  (globalThis as any).__facetsMocks = new Map<string, ReturnType<typeof vi.fn>>();
}

vi.mock('../cached-data-factory.ts', () => {
  // Ensure mockFunctions exists before the mock factory runs
  if (!(globalThis as any).__facetsMocks) {
    (globalThis as any).__facetsMocks = new Map();
  }
  const mockFunctions = (globalThis as any).__facetsMocks;
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

// Import after mocks are set up
import { getSearchFacets, getPopularSearches, type SearchFacetAggregate } from './facets';
import type { GetTrendingSearchesReturns } from '@heyclaude/data-layer';
import type { GetSearchFacetsReturns } from '@heyclaude/database-types/postgres-types';

describe('search/facets', () => {
  let mockGetSearchFacets: ReturnType<typeof vi.fn>;
  let mockGetPopularSearches: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mock functions that were created when the module loaded
    const mocks = (globalThis as any).__facetsMocks;
    mockGetSearchFacets = mocks?.get('getSearchFacets') || vi.fn();
    mockGetPopularSearches = mocks?.get('getPopularSearches') || vi.fn();
    // Reset them for each test
    mockGetSearchFacets.mockReset();
    mockGetPopularSearches.mockReset();
  });

  describe('getSearchFacets', () => {
    it('should be a function', () => {
      expect(typeof getSearchFacets).toBe('function');
    });

    it('should call the underlying service method and transform result', async () => {
      const mockRpcResult: GetSearchFacetsReturns = [
        {
          category: 'agents',
          content_count: 10,
          authors: ['Author 1'],
          all_tags: ['tag1', 'tag2'],
          all_authors_aggregated: ['Author 1', 'Author 2'],
          all_categories_aggregated: ['agents', 'mcp'],
          all_tags_aggregated: ['tag1', 'tag2', 'tag3'],
        },
      ];

      const expectedResult: SearchFacetAggregate = {
        authors: ['Author 1', 'Author 2'],
        categories: ['agents', 'mcp'],
        facets: [
          {
            authors: ['Author 1'],
            category: 'agents',
            contentCount: 10,
            tags: ['tag1', 'tag2'],
          },
        ],
        tags: ['tag1', 'tag2', 'tag3'],
      };

      mockGetSearchFacets.mockResolvedValue(expectedResult);

      const result = await getSearchFacets();

      expect(mockGetSearchFacets).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
      expect(result).toHaveProperty('authors');
      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('facets');
      expect(result).toHaveProperty('tags');
      expect(Array.isArray(result.facets)).toBe(true);
    });

    it('should handle empty results', async () => {
      mockGetSearchFacets.mockResolvedValue({
        authors: [],
        categories: [],
        facets: [],
        tags: [],
      });

      const result = await getSearchFacets();

      expect(result).toEqual({
        authors: [],
        categories: [],
        facets: [],
        tags: [],
      });
    });
  });

  describe('getPopularSearches', () => {
    it('should be a function', () => {
      expect(typeof getPopularSearches).toBe('function');
    });

    it('should call the underlying service method with transformed args', async () => {
      const mockResult: GetTrendingSearchesReturns = [
        { query: 'test query', count: 100, label: '🔥 test query (100 searches)' },
        { query: 'another query', count: 50, label: '🔥 another query (50 searches)' },
      ];

      mockGetPopularSearches.mockResolvedValue(mockResult);

      const result = await getPopularSearches(10);

      expect(mockGetPopularSearches).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
    });

    it('should handle empty results', async () => {
      mockGetPopularSearches.mockResolvedValue([]);

      const result = await getPopularSearches(5);

      expect(result).toEqual([]);
    });
  });
});
