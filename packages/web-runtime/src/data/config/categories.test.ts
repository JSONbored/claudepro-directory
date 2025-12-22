import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  getHomepageFeaturedCategories,
  getHomepageTabCategories,
} from './categories';

// Mock server-only
jest.mock('server-only', () => ({}));

// Mock build-time
jest.mock('../../build-time.ts', () => ({
  isBuildTime: vi.fn(() => false),
}));

// Mock static configs
const mockHomepageConfig = {
  'homepage.featured_categories': ['agents', 'mcp', 'rules'],
  'homepage.tab_categories': ['agents', 'mcp', 'rules', 'skills'],
};

jest.mock('../../config/static-configs.ts', () => ({
  getHomepageConfigBundle: vi.fn(() => ({
    homepageConfig: mockHomepageConfig,
  })),
}));

// Mock logger
jest.mock('../../logger.ts', () => ({
  logger: {
    child: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    })),
  },
}));

describe('categories config', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHomepageFeaturedCategories', () => {
    it('should return featured categories from config', () => {
      const categories = getHomepageFeaturedCategories();
      expect(categories).toEqual(['agents', 'mcp', 'rules']);
    });

    it('should return empty array at build time', async () => {
      const { isBuildTime } = await import('../../build-time.ts');
      jest.mocked(isBuildTime).mockReturnValueOnce(true);

      const categories = getHomepageFeaturedCategories();
      expect(categories).toEqual([]);
    });

    it('should filter invalid category values', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.featured_categories': ['agents', 'invalid-category', 'mcp'],
        },
      } as any);

      const categories = getHomepageFeaturedCategories();
      // Should filter out 'invalid-category' and only return valid categories
      expect(categories).toContain('agents');
      expect(categories).toContain('mcp');
      expect(categories).not.toContain('invalid-category');
    });

    it('should return empty array when config is not an array', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.featured_categories': null,
        },
      } as any);

      const categories = getHomepageFeaturedCategories();
      expect(categories).toEqual([]);
    });

    it('should handle undefined config key', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          // 'homepage.featured_categories' is missing
        },
      } as any);

      const categories = getHomepageFeaturedCategories();
      expect(categories).toEqual([]);
    });

    it('should handle empty array', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.featured_categories': [],
        },
      } as any);

      const categories = getHomepageFeaturedCategories();
      expect(categories).toEqual([]);
    });

    it('should handle non-array values (string)', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.featured_categories': 'not-an-array',
        },
      } as any);

      const categories = getHomepageFeaturedCategories();
      expect(categories).toEqual([]);
    });

    it('should handle non-array values (object)', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.featured_categories': { not: 'an array' },
        },
      } as any);

      const categories = getHomepageFeaturedCategories();
      expect(categories).toEqual([]);
    });
  });

  describe('getHomepageTabCategories', () => {
    it('should return tab categories from config', () => {
      const categories = getHomepageTabCategories();
      expect(categories).toEqual(['agents', 'mcp', 'rules', 'skills']);
    });

    it('should return empty array at build time', async () => {
      const { isBuildTime } = await import('../../build-time.ts');
      jest.mocked(isBuildTime).mockReturnValueOnce(true);

      const categories = getHomepageTabCategories();
      expect(categories).toEqual([]);
    });

    it('should convert non-string values to strings', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.tab_categories': ['agents', 123, 'mcp'],
        },
      } as any);

      const categories = getHomepageTabCategories();
      expect(categories).toEqual(['agents', '123', 'mcp']);
    });

    it('should return empty array when config is not an array', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.tab_categories': null,
        },
      } as any);

      const categories = getHomepageTabCategories();
      expect(categories).toEqual([]);
    });

    it('should handle undefined config key', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          // 'homepage.tab_categories' is missing
        },
      } as any);

      const categories = getHomepageTabCategories();
      // BUG POTENTIAL: If config key is undefined, config['homepage.tab_categories'] is undefined
      // Then Array.isArray(undefined) is false, so it should return []
      expect(categories).toEqual([]);
    });

    it('should handle empty array', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.tab_categories': [],
        },
      } as any);

      const categories = getHomepageTabCategories();
      expect(categories).toEqual([]);
    });

    it('should handle non-array values (string)', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.tab_categories': 'not-an-array',
        },
      } as any);

      const categories = getHomepageTabCategories();
      expect(categories).toEqual([]);
    });

    it('should handle non-array values (object)', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.tab_categories': { not: 'an array' },
        },
      } as any);

      const categories = getHomepageTabCategories();
      expect(categories).toEqual([]);
    });

    it('should handle null values in array', async () => {
      const { getHomepageConfigBundle } = await import('../../config/static-configs.ts');
      jest.mocked(getHomepageConfigBundle).mockReturnValueOnce({
        homepageConfig: {
          'homepage.tab_categories': ['agents', null, 'mcp', undefined],
        },
      } as any);

      const categories = getHomepageTabCategories();
      expect(categories).toEqual(['agents', 'null', 'mcp', 'undefined']);
    });
  });
});
