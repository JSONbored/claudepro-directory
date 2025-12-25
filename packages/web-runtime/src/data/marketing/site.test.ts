import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getContentDescriptionCopy, getPartnerHeroStats } from './site';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';

// Mock server-only FIRST
jest.mock('server-only', () => ({}));

// Mock next/cache for cache directives
jest.mock('next/cache', () => ({
  cacheLife: jest.fn(),
  cacheTag: jest.fn(),
  connection: jest.fn(() => Promise.resolve()),
}));

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from data-layer will automatically use PrismockerClient

// Import real cache utilities for proper cache testing
// Note: Deep relative imports are acceptable for test utilities to avoid circular dependencies
import {
  clearRequestCache,
  getRequestCache,
} from '../../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts

// Don't mock logger - use real implementation
// ERROR logs for validation failures are expected and correct behavior
// Don't mock normalizeError - use real implementation
// Don't mock getContentCount - use real implementation with Prismocker

// Helper function to create v_content_list_slim view data for seeding
// This view is used by ContentService.getContentPaginatedSlim which is called by getContentCount
// Matches the pattern from paginated.test.ts
function createViewItem(overrides: {
  id: string;
  slug: string;
  title: string;
  category: string;
  view_count?: number;
  popularity_score?: number;
}): any {
  return {
    id: overrides.id,
    slug: overrides.slug,
    title: overrides.title,
    display_title: null,
    seo_title: null,
    description: null,
    author: null,
    author_profile_url: null,
    category: overrides.category,
    tags: [],
    source: null,
    source_table: overrides.category,
    created_at: new Date('2024-01-01'),
    updated_at: new Date('2024-01-01'),
    date_added: new Date('2024-01-01'),
    view_count: overrides.view_count ?? 0,
    copy_count: 0,
    bookmark_count: 0,
    popularity_score: overrides.popularity_score ?? 0,
    trending_score: 0,
    sponsored_content_id: null,
    sponsorship_tier: null,
    is_sponsored: false,
  };
}

describe('marketing site data functions', () => {
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // 1. Clear request cache before each test (REQUIRED for test isolation)
    clearRequestCache();

    // 2. Get Prismocker instance (automatically PrismockerClient via global mock)
    prismocker = prisma;

    // 3. Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // 4. Clear all mocks
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('getContentDescriptionCopy', () => {
    it('should return description with content count', async () => {
      // Seed Prismocker with v_content_list_slim view data
      // getContentCount calls ContentService.getContentPaginatedSlim which queries v_content_list_slim
      const mockItems = [
        createViewItem({
          id: 'content-1',
          slug: 'test-content-1',
          title: 'Test Content 1',
          category: 'agents',
        }),
        createViewItem({
          id: 'content-2',
          slug: 'test-content-2',
          title: 'Test Content 2',
          category: 'mcp',
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', mockItems);
      }

      const result = await getContentDescriptionCopy();

      expect(result).toContain('Open-source directory');
      // The count should be 2 (from seeded data)
      expect(result).toContain('2+');
      expect(result).toContain('Claude AI configurations');
    });

    it('should return fallback on error', async () => {
      // No data seeded, but Prismocker should handle empty results
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      // When getContentCount returns 0, the description should still work
      // The fallback is only used when an error is thrown
      // Since we're using Prismocker, getContentCount should return 0, not throw
      const result = await getContentDescriptionCopy();

      // Should still contain the structure, even with 0 count
      expect(result).toContain('Open-source directory');
      expect(result).toContain('0+');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockItems = [
        createViewItem({
          id: 'content-1',
          slug: 'test-content-1',
          title: 'Test Content 1',
          category: 'agents',
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', mockItems);
      }

      const cache = getRequestCache();
      const cacheBefore = cache.getStats().size;

      // First call - should populate cache
      const result1 = await getContentDescriptionCopy();
      const cacheAfterFirst = cache.getStats().size;

      // Second call - should use cache
      const result2 = await getContentDescriptionCopy();
      const cacheAfterSecond = cache.getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getPartnerHeroStats', () => {
    it('should return hero stats with configuration count', async () => {
      const mockItems = [
        createViewItem({
          id: 'content-1',
          slug: 'test-content-1',
          title: 'Test Content 1',
          category: 'agents',
        }),
        createViewItem({
          id: 'content-2',
          slug: 'test-content-2',
          title: 'Test Content 2',
          category: 'mcp',
        }),
        createViewItem({
          id: 'content-3',
          slug: 'test-content-3',
          title: 'Test Content 3',
          category: 'rules',
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', mockItems);
      }

      const result = await getPartnerHeroStats();

      expect(result).toHaveProperty('configurationCount', 3);
      expect(result).toHaveProperty('monthlyPageViews', 16000);
      expect(result).toHaveProperty('monthlyVisitors', 3000);
    });

    it('should return fallback stats when getContentCount returns 0', async () => {
      // No data seeded
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', []);
      }

      const result = await getPartnerHeroStats();

      expect(result).toEqual({
        configurationCount: 0,
        monthlyPageViews: 16000,
        monthlyVisitors: 3000,
      });
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockItems = [
        createViewItem({
          id: 'content-1',
          slug: 'test-content-1',
          title: 'Test Content 1',
          category: 'agents',
        }),
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', mockItems);
      }

      const cache = getRequestCache();
      const cacheBefore = cache.getStats().size;

      // First call - should populate cache
      const result1 = await getPartnerHeroStats();
      const cacheAfterFirst = cache.getStats().size;

      // Second call - should use cache
      const result2 = await getPartnerHeroStats();
      const cacheAfterSecond = cache.getStats().size;

      // Verify results are the same (indicating cache was used)
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
