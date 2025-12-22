import { describe, expect, it, jest } from '@jest/globals';
import { getRelatedContent, type RelatedContentInput } from './related';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock category validation
jest.mock('@heyclaude/web-runtime/utils/category-validation', () => ({
  isValidCategory: vi.fn((cat: string) => ['agents', 'mcp', 'rules'].includes(cat)),
}));

// Mock cached-data-factory
jest.mock('../cached-data-factory', () => ({
  createDataFunction: vi.fn((config: any) => {
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    return vi.fn().mockResolvedValue({ items: [] });
  }),
}));

describe('related content data functions', () => {
  describe('getRelatedContent', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getRelatedContent');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('content');
      expect(config?.methodName).toBe('getRelatedContent');
      expect(config?.operation).toBe('getRelatedContent');
      expect(config?.validate).toBeDefined();
      expect(config?.transformArgs).toBeDefined();
      expect(config?.transformResult).toBeDefined();
    });

    it('should validate category', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getRelatedContent');
      const validate = config?.validate;
      
      expect(validate({ currentCategory: 'agents', currentPath: '/agents/test' })).toBe(true);
      expect(validate({ currentCategory: 'invalid', currentPath: '/invalid/test' })).toBe(false);
    });

    it('should transform args correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getRelatedContent');
      const transformArgs = config?.transformArgs;
      
      const input: RelatedContentInput = {
        currentCategory: 'agents',
        currentPath: '/agents/test-slug',
        currentTags: ['tag1', 'tag2'],
        exclude: ['exclude1'],
        limit: 5,
      };
      
      const result = transformArgs(input);
      expect(result).toEqual({
        p_category: 'agents',
        p_slug: 'test-slug',
        p_tags: ['tag1', 'tag2'],
        p_exclude_slugs: ['exclude1'],
        p_limit: 5,
      });
    });

    it('should transform result correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getRelatedContent');
      const transformResult = config?.transformResult;
      
      const mockResult = [
        { title: 'Item 1', slug: 'item-1', category: 'agents' },
        { title: null, slug: 'item-2', category: 'agents' }, // Should be filtered
        { title: 'Item 3', slug: 'item-3', category: 'mcp' },
      ];
      
      const result = transformResult(mockResult);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].title).toBe('Item 1');
    });
  });
});

