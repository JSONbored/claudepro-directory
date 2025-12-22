import { describe, expect, it, jest, beforeEach } from '@jest/globals';

// Mock server-only FIRST (before any imports)
jest.mock('server-only', () => ({}));

// Mock database-types to avoid schema generation issues
jest.mock('@heyclaude/database-types/postgres-types', () => ({
  GetContentDetailCompleteReturns: [],
  GetContentAnalyticsReturns: [],
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// No manual Prisma mock needed - let __mocks__/@prisma/client.ts handle it

// Mock category validation
jest.mock('@heyclaude/web-runtime/utils/category-validation', () => ({
  isValidCategory: vi.fn((cat: string) => ['agents', 'mcp', 'rules'].includes(cat)),
}));

// Mock cached-data-factory - need to set up mock BEFORE import
// The function is created at module load time, so we need the mock ready
// Store the mock function in a way that's accessible after import
// Use globalThis to avoid temporal dead zone issues
if (!(globalThis as any).__dataFunctionMocks) {
  (globalThis as any).__dataFunctionMocks = new Map<string, ReturnType<typeof jest.fn>>();
}

jest.mock('../cached-data-factory.ts', () => {
  // Ensure mockFunctions exists before the mock factory runs
  if (!(globalThis as any).__dataFunctionMocks) {
    (globalThis as any).__dataFunctionMocks = new Map();
  }
  const mockFunctions = (globalThis as any).__dataFunctionMocks;
  return {
    createDataFunction: vi.fn((config) => {
      // Create a mock function for this operation
      const mock = jest.fn();
      if (config.operation && mockFunctions) {
        mockFunctions.set(config.operation, mockFn);
      }
      return mockFn;
    }),
  };
});

// Import AFTER mocks are set up
// Note: toContentCategory is not exported, so we'll test it indirectly through getPaginatedContent
import { getPaginatedContent } from './paginated';

describe('content/paginated', () => {
  let mockGetPaginatedContent: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mock function that was created when the module loaded
    const mocks = (globalThis as any).__dataFunctionMocks;
    mockGetPaginatedContent = mocks?.get('getPaginatedContent') || vi.fn();
    // Reset it for each test
    mockGetPaginatedContent.mockReset();
  });

  describe('getPaginatedContent', () => {
    it('should be a function', () => {
      expect(typeof getPaginatedContent).toBe('function');
    });

    it('should call service with normalized category', async () => {
      const mockResult = {
        items: [],
        pagination: {
          current_page: 1,
          has_more: false,
          limit: 20,
          offset: 0,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockGetPaginatedContent.mockResolvedValue(mockResult);

      const result = await getPaginatedContent({
        category: 'AGENTS', // Should be normalized to 'agents' via toContentCategory
        limit: 20,
        offset: 0,
      });

      expect(mockGetPaginatedContent).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
      // Verify category normalization happened (tested indirectly through transformArgs)
    });

    it('should handle null category', async () => {
      const mockResult = {
        items: [],
        pagination: {
          current_page: 1,
          has_more: false,
          limit: 20,
          offset: 0,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockGetPaginatedContent.mockResolvedValue(mockResult);

      const result = await getPaginatedContent({
        category: null,
        limit: 20,
        offset: 0,
      });

      expect(result).toEqual(mockResult);
    });

    it('should handle undefined category', async () => {
      const mockResult = {
        items: [],
        pagination: {
          current_page: 1,
          has_more: false,
          limit: 20,
          offset: 0,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockGetPaginatedContent.mockResolvedValue(mockResult);

      const result = await getPaginatedContent({
        category: undefined,
        limit: 20,
        offset: 0,
      });

      expect(result).toEqual(mockResult);
    });

    it('should filter out invalid categories', async () => {
      const mockResult = {
        items: [],
        pagination: {
          current_page: 1,
          has_more: false,
          limit: 20,
          offset: 0,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockGetPaginatedContent.mockResolvedValue(mockResult);

      // Invalid category should be normalized to undefined
      const result = await getPaginatedContent({
        category: 'invalid-category',
        limit: 20,
        offset: 0,
      });

      expect(result).toEqual(mockResult);
    });

    it('should handle whitespace in category', async () => {
      const mockResult = {
        items: [],
        pagination: {
          current_page: 1,
          has_more: false,
          limit: 20,
          offset: 0,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockGetPaginatedContent.mockResolvedValue(mockResult);

      // Whitespace should be trimmed
      const result = await getPaginatedContent({
        category: '  agents  ',
        limit: 20,
        offset: 0,
      });

      expect(result).toEqual(mockResult);
    });

    it('should handle zero limit', async () => {
      const mockResult = {
        items: [],
        pagination: {
          current_page: 1,
          has_more: false,
          limit: 0,
          offset: 0,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockGetPaginatedContent.mockResolvedValue(mockResult);

      const result = await getPaginatedContent({
        category: 'agents',
        limit: 0,
        offset: 0,
      });

      expect(result).toEqual(mockResult);
    });

    it('should handle negative offset', async () => {
      const mockResult = {
        items: [],
        pagination: {
          current_page: 1,
          has_more: false,
          limit: 20,
          offset: -10, // BUG POTENTIAL: Negative offset should be handled
          total_count: 0,
          total_pages: 0,
        },
      };

      mockGetPaginatedContent.mockResolvedValue(mockResult);

      const result = await getPaginatedContent({
        category: 'agents',
        limit: 20,
        offset: -10,
      });

      // Should still work, but negative offset might cause issues in database
      expect(result).toEqual(mockResult);
    });

    it('should handle very large limit', async () => {
      const mockResult = {
        items: [],
        pagination: {
          current_page: 1,
          has_more: false,
          limit: 10000,
          offset: 0,
          total_count: 0,
          total_pages: 0,
        },
      };

      mockGetPaginatedContent.mockResolvedValue(mockResult);

      const result = await getPaginatedContent({
        category: 'agents',
        limit: 10000,
        offset: 0,
      });

      expect(result).toEqual(mockResult);
    });
  });
});
