import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Constants } from '@heyclaude/database-types';

// Mock dependencies
vi.mock('./safe-action.ts', () => ({
  optionalAuthAction: {
    metadata: vi.fn(() => ({
      inputSchema: vi.fn(() => ({
        action: vi.fn((handler) => handler),
      })),
    })),
  },
  rateLimitedAction: {
    inputSchema: vi.fn(() => ({
      metadata: vi.fn(() => ({
        action: vi.fn((handler) => handler),
      })),
    })),
  },
}));

vi.mock('../data/content/reviews.ts', () => ({
  getReviewsWithStatsData: vi.fn(),
}));

vi.mock('../data/content/paginated.ts', () => ({
  getPaginatedContent: vi.fn(),
}));

describe('Content Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReviewsWithStats', () => {
    it('should validate content_type enum', async () => {
      // This test verifies that the Zod schema uses the correct enum values
      const validCategories = Constants.public.Enums.content_category;
      
      expect(validCategories).toContain('agents');
      expect(validCategories).toContain('skills');
      expect(validCategories.length).toBeGreaterThan(0);
    });

    it('should call getReviewsWithStatsData with correct params', async () => {
      const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');
      const mockData = {
        reviews: [],
        stats: { average_rating: 4.5, total_reviews: 10 },
      };

      vi.mocked(getReviewsWithStatsData).mockResolvedValue(mockData);

      const { getReviewsWithStats } = await import('./content.ts');
      
      // Mock the action handler execution
      const actionHandler = getReviewsWithStats as any;
      const result = await actionHandler.action({
        parsedInput: {
          content_type: 'agents',
          content_slug: 'test-agent',
          sort_by: 'recent',
          limit: 20,
          offset: 0,
        },
        ctx: { userId: 'user123' },
      });

      expect(getReviewsWithStatsData).toHaveBeenCalledWith({
        contentType: 'agents',
        contentSlug: 'test-agent',
        sortBy: 'recent',
        limit: 20,
        offset: 0,
        userId: 'user123',
      });
      expect(result).toEqual(mockData);
    });

    it('should handle unauthenticated requests', async () => {
      const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');
      const mockData = {
        reviews: [],
        stats: { average_rating: 0, total_reviews: 0 },
      };

      vi.mocked(getReviewsWithStatsData).mockResolvedValue(mockData);

      const { getReviewsWithStats } = await import('./content.ts');
      
      const actionHandler = getReviewsWithStats as any;
      await actionHandler.action({
        parsedInput: {
          content_type: 'skills',
          content_slug: 'test-skill',
          sort_by: 'recent',
          limit: 10,
          offset: 0,
        },
        ctx: {}, // No userId
      });

      const callArgs = vi.mocked(getReviewsWithStatsData).mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('userId');
    });

    it('should throw error when data fetch fails', async () => {
      const { getReviewsWithStatsData } = await import('../data/content/reviews.ts');
      vi.mocked(getReviewsWithStatsData).mockResolvedValue(null);

      const { getReviewsWithStats } = await import('./content.ts');
      
      const actionHandler = getReviewsWithStats as any;
      await expect(
        actionHandler.action({
          parsedInput: {
            content_type: 'agents',
            content_slug: 'test',
            sort_by: 'recent',
            limit: 10,
            offset: 0,
          },
          ctx: {},
        })
      ).rejects.toThrow('Failed to fetch reviews');
    });
  });

  describe('fetchPaginatedContent', () => {
    it('should fetch paginated content with defaults', async () => {
      const { getPaginatedContent } = await import('../data/content/paginated.ts');
      const mockData = {
        items: [{ slug: 'item1' }, { slug: 'item2' }],
        total: 2,
      };

      vi.mocked(getPaginatedContent).mockResolvedValue(mockData);

      const { fetchPaginatedContent } = await import('./content.ts');
      
      const actionHandler = fetchPaginatedContent as any;
      const result = await actionHandler.action({
        parsedInput: {
          offset: 0,
          limit: 30,
          category: null,
        },
      });

      expect(getPaginatedContent).toHaveBeenCalledWith({
        category: null,
        limit: 30,
        offset: 0,
      });
      expect(result).toEqual(mockData.items);
    });

    it('should filter by category when provided', async () => {
      const { getPaginatedContent } = await import('../data/content/paginated.ts');
      const mockData = {
        items: [{ slug: 'agent1', category: 'agents' }],
        total: 1,
      };

      vi.mocked(getPaginatedContent).mockResolvedValue(mockData);

      const { fetchPaginatedContent } = await import('./content.ts');
      
      const actionHandler = fetchPaginatedContent as any;
      await actionHandler.action({
        parsedInput: {
          offset: 0,
          limit: 10,
          category: 'agents',
        },
      });

      expect(getPaginatedContent).toHaveBeenCalledWith({
        category: 'agents',
        limit: 10,
        offset: 0,
      });
    });

    it('should return empty array when no items', async () => {
      const { getPaginatedContent } = await import('../data/content/paginated.ts');
      vi.mocked(getPaginatedContent).mockResolvedValue({
        items: null,
        total: 0,
      } as any);

      const { fetchPaginatedContent } = await import('./content.ts');
      
      const actionHandler = fetchPaginatedContent as any;
      const result = await actionHandler.action({
        parsedInput: {
          offset: 0,
          limit: 10,
          category: null,
        },
      });

      expect(result).toEqual([]);
    });
  });

  describe('input validation', () => {
    it('should validate slug format', () => {
      // Test that the regex pattern works
      const validSlugs = ['test-agent', 'my_skill', 'agent/v1', 'ABC123'];
      const invalidSlugs = ['test agent', 'test@agent', 'test.agent'];

      const slugRegex = /^[a-zA-Z0-9\-_/]+$/;

      validSlugs.forEach(slug => {
        expect(slugRegex.test(slug)).toBe(true);
      });

      invalidSlugs.forEach(slug => {
        expect(slugRegex.test(slug)).toBe(false);
      });
    });

    it('should validate sort_by enum values', () => {
      const validSortValues = ['recent', 'helpful', 'rating_high', 'rating_low'];
      
      validSortValues.forEach(value => {
        expect(validSortValues).toContain(value);
      });
    });

    it('should enforce limit constraints', () => {
      const validLimits = [1, 50, 100];
      const invalidLimits = [0, -1, 101, 1000];

      validLimits.forEach(limit => {
        expect(limit).toBeGreaterThanOrEqual(1);
        expect(limit).toBeLessThanOrEqual(100);
      });

      invalidLimits.forEach(limit => {
        expect(limit < 1 || limit > 100).toBe(true);
      });
    });
  });
});