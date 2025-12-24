import { describe, expect, it, jest } from '@jest/globals';
import { getHomepageData } from './homepage';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock cached-data-factory
jest.mock('../cached-data-factory', () => ({
  createDataFunction: jest.fn((config: any) => {
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    return jest.fn().mockResolvedValue(null);
  }),
}));

describe('homepage data functions', () => {
  describe('getHomepageData', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getHomepageData');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('content');
      expect(config?.methodName).toBe('getHomepageOptimized');
      expect(config?.operation).toBe('getHomepageData');
    });

    it('should transform args correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getHomepageData');
      const transformArgs = config?.transformArgs;
      
      expect(transformArgs(['category1', 'category2'])).toEqual({
        p_category_ids: ['category1', 'category2'],
        p_limit: 6,
      });
    });

    it('should create stable log context with sorted category IDs', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getHomepageData');
      const logContext = config?.logContext;
      
      const result1 = logContext(['b', 'a', 'c']);
      const result2 = logContext(['a', 'b', 'c']);
      
      // Both should have same sorted categoryIds string
      expect(result1.categoryIds).toBe('a,b,c');
      expect(result2.categoryIds).toBe('a,b,c');
      expect(result1.categoryCount).toBe(3);
    });
  });
});

