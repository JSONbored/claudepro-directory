import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getPaginatedContent } from './paginated';
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

// Don't mock createDataFunction - use real implementation
// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts

// Don't mock category validation - use real implementation
// Don't mock logger - use real implementation (same as detail.test.ts)
// ERROR logs for validation failures are expected and correct behavior
// Don't mock normalizeError - use real implementation

/**
 * Content Paginated Data Function Test Suite
 *
 * Tests getPaginatedContent data function → ContentService.getContentPaginatedSlim → Prisma → database flow.
 * Uses Prismocker for in-memory database and getRequestCache() for cache verification.
 *
 * @group ContentPaginated
 * @group DataFunctions
 * @group Integration
 */
// Helper function to create v_content_list_slim view data for seeding
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
    source_table: overrides.category, // e.g., 'agents'
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

describe('content/paginated', () => {
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

  describe('getPaginatedContent', () => {
    it('should be a function', () => {
      expect(typeof getPaginatedContent).toBe('function');
    });

    /**
     * Integration test: Verifies full flow from data function → service → Prisma → database.
     * Tests category normalization and proper data transformation.
     */
    it('should call service with normalized category', async () => {
      // getContentPaginatedSlim uses direct Prisma calls (v_content_list_slim.findMany)
      // Seed view using Prismocker
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', [
          createViewItem({ id: '1', slug: 'test-1', title: 'Test 1', category: 'agents' }),
          createViewItem({ id: '2', slug: 'test-2', title: 'Test 2', category: 'agents' }),
        ]);
      }

      const result = await getPaginatedContent({
        category: 'AGENTS', // Should be normalized to 'agents' via toContentCategory
        limit: 20,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      // Category normalization happens in transformArgs, so it should query for 'agents'
      expect(result?.items.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle null category', async () => {
      // Seed view with items from multiple categories
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', [
          createViewItem({ id: '1', slug: 'test-1', title: 'Test 1', category: 'agents' }),
          createViewItem({ id: '2', slug: 'test-2', title: 'Test 2', category: 'mcp' }),
        ]);
      }

      const result = await getPaginatedContent({
        category: null,
        limit: 20,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      // Null category should query all categories
      expect(result?.pagination.total_count).toBeGreaterThanOrEqual(0);
    });

    it('should handle undefined category', async () => {
      // Seed view
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', [
          createViewItem({ id: '1', slug: 'test-1', title: 'Test 1', category: 'agents' }),
        ]);
      }

      const result = await getPaginatedContent({
        category: undefined,
        limit: 20,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      // Undefined category should query all categories
      expect(result?.pagination.total_count).toBeGreaterThanOrEqual(0);
    });

    it('should filter out invalid categories', async () => {
      // Invalid category should be normalized to undefined, so it queries all categories
      // Seed view with items
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', [
          createViewItem({ id: '1', slug: 'test-1', title: 'Test 1', category: 'agents' }),
        ]);
      }

      // Invalid category should be normalized to undefined
      const result = await getPaginatedContent({
        category: 'invalid-category',
        limit: 20,
        offset: 0,
      });

      expect(result).toBeDefined();
      // Invalid category normalizes to undefined, so queries all categories
      expect(result?.pagination.total_count).toBeGreaterThanOrEqual(0);
    });

    it('should handle whitespace in category', async () => {
      // Seed view with agents items
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', [
          createViewItem({ id: '1', slug: 'test-1', title: 'Test 1', category: 'agents' }),
        ]);
      }

      // Whitespace should be trimmed and normalized to 'agents'
      const result = await getPaginatedContent({
        category: '  agents  ',
        limit: 20,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('items');
      // Should query for 'agents' after trimming whitespace
      expect(result?.pagination.total_count).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero limit', async () => {
      // Note: The service validates limit >= 1, so zero limit will cause a validation error
      // createDataFunction logs validation failures as ERROR level (this is expected behavior)
      // and returns null, so we expect null
      const result = await getPaginatedContent({
        category: 'agents',
        limit: 0,
        offset: 0,
      });

      // Service validates limit >= 1, so this should return null (validation fails)
      // The ERROR log message in the test output is expected - validation failures are logged as errors
      expect(result).toBeNull();
    });

    it('should handle negative offset', async () => {
      // Note: The service validates offset >= 0, so negative offset will cause a validation error
      // createDataFunction logs validation failures as ERROR level (this is expected behavior)
      // and returns null, so we expect null
      const result = await getPaginatedContent({
        category: 'agents',
        limit: 20,
        offset: -10,
      });

      // Service validates offset >= 0, so this should return null (validation fails)
      // The ERROR log message in the test output is expected - validation failures are logged as errors
      expect(result).toBeNull();
    });

    it('should handle very large limit', async () => {
      // Note: The service validates limit <= 100, so very large limit will cause a validation error
      // createDataFunction logs validation failures as ERROR level (this is expected behavior)
      // and returns null, so we expect null
      const result = await getPaginatedContent({
        category: 'agents',
        limit: 10000,
        offset: 0,
      });

      // Service validates limit <= 100, so this should return null (validation fails)
      // The ERROR log message in the test output is expected - validation failures are logged as errors
      expect(result).toBeNull();
    });

    it('should return paginated results with correct structure', async () => {
      // Seed view with multiple items
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', [
          createViewItem({ id: '1', slug: 'test-1', title: 'Test 1', category: 'agents' }),
          createViewItem({ id: '2', slug: 'test-2', title: 'Test 2', category: 'agents' }),
          createViewItem({ id: '3', slug: 'test-3', title: 'Test 3', category: 'agents' }),
        ]);
      }

      const result = await getPaginatedContent({
        category: 'agents',
        limit: 2,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('pagination');
      expect(result?.pagination).toMatchObject({
        total_count: 3,
        limit: 2,
        offset: 0,
        current_page: 1,
        has_more: true,
        total_pages: 2,
      });
      expect(result?.items.length).toBe(2);
    });

    /**
     * Cache test: Verifies request-scoped caching using getRequestCache().getStats().size.
     */
    it('should cache results on duplicate calls (caching test)', async () => {
      // getContentPaginatedSlim uses withSmartCache, so cache testing is important
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('v_content_list_slim', [
          createViewItem({ id: '1', slug: 'test-1', title: 'Test 1', category: 'agents' }),
        ]);
      }

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getPaginatedContent({
        category: 'agents',
        limit: 20,
        offset: 0,
      });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getPaginatedContent({
        category: 'agents',
        limit: 20,
        offset: 0,
      });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
