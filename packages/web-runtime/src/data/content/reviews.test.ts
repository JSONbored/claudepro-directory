import { describe, expect, it, vi } from 'vitest';
import { getReviewsWithStatsData, type ReviewsWithStatsParameters } from './reviews';
import type { content_category } from '@prisma/client';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock cached-data-factory
vi.mock('../cached-data-factory', () => ({
  createDataFunction: vi.fn((config: any) => {
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    return vi.fn().mockResolvedValue(null);
  }),
}));

describe('reviews data functions', () => {
  describe('getReviewsWithStatsData', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getReviewsWithStatsData');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('content');
      expect(config?.methodName).toBe('getReviewsWithStats');
      expect(config?.operation).toBe('getReviewsWithStatsData');
    });

    it('should transform args correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getReviewsWithStatsData');
      const transformArgs = config?.transformArgs;
      
      const params: ReviewsWithStatsParameters = {
        contentSlug: 'test-slug',
        contentType: 'agents' as content_category,
        limit: 10,
        offset: 5,
        sortBy: 'helpful',
        userId: 'user-id',
      };
      
      const result = transformArgs(params);
      expect(result).toEqual({
        p_content_slug: 'test-slug',
        p_content_type: 'agents',
        p_limit: 10,
        p_offset: 5,
        p_sort_by: 'helpful',
        p_user_id: 'user-id',
      });
    });

    it('should handle optional parameters', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getReviewsWithStatsData');
      const transformArgs = config?.transformArgs;
      
      const params: ReviewsWithStatsParameters = {
        contentSlug: 'test-slug',
        contentType: 'agents' as content_category,
      };
      
      const result = transformArgs(params);
      expect(result).toEqual({
        p_content_slug: 'test-slug',
        p_content_type: 'agents',
      });
      expect(result).not.toHaveProperty('p_limit');
      expect(result).not.toHaveProperty('p_offset');
      expect(result).not.toHaveProperty('p_sort_by');
      expect(result).not.toHaveProperty('p_user_id');
    });
  });
});

