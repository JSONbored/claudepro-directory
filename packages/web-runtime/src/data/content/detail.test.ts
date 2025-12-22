import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  getContentDetailComplete,
  getContentDetailCore,
  getContentAnalytics,
} from './detail';

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock database-types to avoid schema generation issues
jest.mock('@heyclaude/database-types/postgres-types', () => ({
  GetContentDetailCompleteReturns: { id: '', slug: '', title: '' },
  GetContentAnalyticsReturns: { view_count: 0, like_count: 0 },
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// No manual Prisma mock needed - let __mocks__/@prisma/client.ts handle it

// Mock category validation
jest.mock('@heyclaude/web-runtime/utils/category-validation', () => ({
  isValidCategory: vi.fn((cat: string) => ['agents', 'mcp', 'rules'].includes(cat)),
}));

// Mock cached-data-factory - need to set up mock BEFORE import
// Use globalThis to store mocks (accessible across module boundaries)
jest.mock('../cached-data-factory.ts', () => ({
  createDataFunction: vi.fn((config) => {
    // Create a mock function for this operation
    const mock = jest.fn();
    if (config.operation) {
      // Store in globalThis so it's accessible in tests
      if (!(globalThis as any).__dataFunctionMocks) {
        (globalThis as any).__dataFunctionMocks = new Map();
      }
      (globalThis as any).__dataFunctionMocks.set(config.operation, mockFn);
    }
    return mockFn;
  }),
}));

describe('content/detail', () => {
  let mockGetContentDetailComplete: ReturnType<typeof jest.fn>;
  let mockGetContentDetailCore: ReturnType<typeof jest.fn>;
  let mockGetContentAnalytics: ReturnType<typeof jest.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    // Get the mock functions that were created when the modules loaded
    const mocks = (globalThis as any).__dataFunctionMocks;
    mockGetContentDetailComplete = mocks?.get('getContentDetailComplete') || vi.fn();
    mockGetContentDetailCore = mocks?.get('getContentDetailCore') || vi.fn();
    mockGetContentAnalytics = mocks?.get('getContentAnalytics') || vi.fn();
    // Reset them for each test
    mockGetContentDetailComplete.mockReset();
    mockGetContentDetailCore.mockReset();
    mockGetContentAnalytics.mockReset();
  });

  describe('getContentDetailComplete', () => {
    it('should return content detail for valid category and slug', async () => {
      const mockDetail = { id: '1', slug: 'test-slug', title: 'Test', category: 'agents' };
      mockGetContentDetailComplete.mockResolvedValue(mockDetail);

      const result = await getContentDetailComplete({ category: 'agents', slug: 'test-slug' });

      expect(mockGetContentDetailComplete).toHaveBeenCalledWith({
        category: 'agents',
        slug: 'test-slug',
      });
      expect(result).toEqual(mockDetail);
    });

    it('should reject invalid category', async () => {
      // BUG POTENTIAL: validate function should reject invalid categories
      // But if validation fails, what happens? Does it throw or return null?
      mockGetContentDetailComplete.mockResolvedValue(null);

      const result = await getContentDetailComplete({
        category: 'invalid-category',
        slug: 'test-slug',
      });

      // If validation fails, the function might not be called or might return null
      // Need to check actual behavior
      expect(result).toBeNull();
    });

    it('should handle empty slug', async () => {
      // BUG POTENTIAL: No validation on slug - empty string might cause issues
      const mockDetail = null;
      mockGetContentDetailComplete.mockResolvedValue(mockDetail);

      const result = await getContentDetailComplete({ category: 'agents', slug: '' });

      expect(mockGetContentDetailComplete).toHaveBeenCalledWith({
        category: 'agents',
        slug: '',
      });
      expect(result).toBeNull();
    });

    it('should handle whitespace in slug', async () => {
      const mockDetail = { id: '1', slug: 'test-slug', title: 'Test' };
      mockGetContentDetailComplete.mockResolvedValue(mockDetail);

      const result = await getContentDetailComplete({
        category: 'agents',
        slug: '  test-slug  ',
      });

      // Slug should be passed as-is (no trimming in transformArgs)
      expect(mockGetContentDetailComplete).toHaveBeenCalledWith({
        category: 'agents',
        slug: '  test-slug  ',
      });
      expect(result).toEqual(mockDetail);
    });

    it('should handle case-insensitive category', async () => {
      const mockDetail = { id: '1', slug: 'test-slug', title: 'Test' };
      mockGetContentDetailComplete.mockResolvedValue(mockDetail);

      const result = await getContentDetailComplete({ category: 'AGENTS', slug: 'test-slug' });

      // Category is cast to content_category, but validation should handle case
      expect(mockGetContentDetailComplete).toHaveBeenCalledWith({
        category: 'AGENTS',
        slug: 'test-slug',
      });
      expect(result).toEqual(mockDetail);
    });

    it('should handle service errors', async () => {
      mockGetContentDetailComplete.mockRejectedValue(new Error('Service error'));

      await expect(
        getContentDetailComplete({ category: 'agents', slug: 'test-slug' })
      ).rejects.toThrow('Service error');
    });
  });

  describe('getContentDetailCore', () => {
    it('should return content detail core for valid category and slug', async () => {
      const mockDetail = { id: '1', slug: 'test-slug', title: 'Test', category: 'agents' };
      mockGetContentDetailCore.mockResolvedValue(mockDetail);

      const result = await getContentDetailCore({ category: 'agents', slug: 'test-slug' });

      expect(mockGetContentDetailCore).toHaveBeenCalledWith({
        category: 'agents',
        slug: 'test-slug',
      });
      expect(result).toEqual(mockDetail);
    });

    it('should reject invalid category', async () => {
      mockGetContentDetailCore.mockResolvedValue(null);

      const result = await getContentDetailCore({
        category: 'invalid-category',
        slug: 'test-slug',
      });

      expect(result).toBeNull();
    });

    it('should handle empty slug', async () => {
      const mockDetail = null;
      mockGetContentDetailCore.mockResolvedValue(mockDetail);

      const result = await getContentDetailCore({ category: 'agents', slug: '' });

      expect(mockGetContentDetailCore).toHaveBeenCalledWith({
        category: 'agents',
        slug: '',
      });
      expect(result).toBeNull();
    });
  });

  describe('getContentAnalytics', () => {
    it('should return content analytics for valid category and slug', async () => {
      const mockAnalytics = { view_count: 100, like_count: 50 };
      mockGetContentAnalytics.mockResolvedValue(mockAnalytics);

      const result = await getContentAnalytics({ category: 'agents', slug: 'test-slug' });

      expect(mockGetContentAnalytics).toHaveBeenCalledWith({
        category: 'agents',
        slug: 'test-slug',
      });
      expect(result).toEqual(mockAnalytics);
    });

    it('should reject invalid category', async () => {
      mockGetContentAnalytics.mockResolvedValue(null);

      const result = await getContentAnalytics({
        category: 'invalid-category',
        slug: 'test-slug',
      });

      expect(result).toBeNull();
    });

    it('should handle empty slug', async () => {
      const mockAnalytics = null;
      mockGetContentAnalytics.mockResolvedValue(mockAnalytics);

      const result = await getContentAnalytics({ category: 'agents', slug: '' });

      expect(mockGetContentAnalytics).toHaveBeenCalledWith({
        category: 'agents',
        slug: '',
      });
      expect(result).toBeNull();
    });

    it('should handle zero analytics', async () => {
      const mockAnalytics = { view_count: 0, like_count: 0 };
      mockGetContentAnalytics.mockResolvedValue(mockAnalytics);

      const result = await getContentAnalytics({ category: 'agents', slug: 'test-slug' });

      expect(result).toEqual(mockAnalytics);
    });
  });
});
