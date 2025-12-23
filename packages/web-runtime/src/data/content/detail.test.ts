import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  getContentDetailComplete,
  getContentDetailCore,
  getContentAnalytics,
} from './detail';
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
import { clearRequestCache, getRequestCache } from '../../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility (if needed)
// Note: Deep relative import needed for jest.mock() to work correctly
jest.mock('../../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Don't mock category validation - use real implementation

// Don't mock createDataFunction - use real implementation
// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts

describe('content/detail', () => {
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

    // 5. Set up $queryRawUnsafe for RPC testing (getContentDetailComplete and getContentAnalytics use RPC)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  describe('getContentDetailComplete', () => {
    it('should return content detail for valid category and slug', async () => {
      // getContentDetailComplete uses ContentService.getContentDetailComplete which uses RPC
      const mockDetail = {
        id: '1',
        slug: 'test-slug',
        title: 'Test',
        category: 'agents' as const,
        description: 'Test description',
        author: 'Test Author',
        author_profile_url: null,
        date_added: '2024-01-01T00:00:00Z',
        tags: [],
        features: [],
        use_cases: [],
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        view_count: 0,
        bookmark_count: 0,
        review_count: 0,
        copy_count: 0,
        use_count: 0,
        keywords: [],
        content_votes: [],
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockDetail] as any);

      const result = await getContentDetailComplete({ category: 'agents', slug: 'test-slug' });

      // $queryRawUnsafe is called with positional arguments (callRpc passes ...argValues)
      // Arguments are in object key insertion order: p_category, p_slug
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_content_detail_complete'),
        'agents', // p_category (first in insertion order)
        'test-slug' // p_slug
      );
      expect(result).toMatchObject({ id: '1', slug: 'test-slug', title: 'Test' });
    });

    it('should reject invalid category', async () => {
      // Invalid category should fail validation and return null (not throw)
      const result = await getContentDetailComplete({ category: 'invalid-category', slug: 'test-slug' });
      expect(result).toBeNull();
      // Should not call the service
      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('should handle empty slug', async () => {
      // Empty slug should still call the service (no validation on slug)
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([null] as any);

      const result = await getContentDetailComplete({ category: 'agents', slug: '' });

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_content_detail_complete'),
        'agents', // p_category
        '' // p_slug (empty string)
      );
      // RPC returns null when content not found
      expect(result).toBeNull();
    });

    it('should handle service errors', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
        new Error('Service error')
      );

      // createDataFunction returns null on error by default (throwOnError is false)
      const result = await getContentDetailComplete({ category: 'agents', slug: 'test-slug' });
      expect(result).toBeNull();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockDetail = {
        id: '1',
        slug: 'test-slug',
        title: 'Test',
        category: 'agents' as const,
        description: 'Test description',
        author: 'Test Author',
        author_profile_url: null,
        date_added: '2024-01-01T00:00:00Z',
        tags: [],
        features: [],
        use_cases: [],
        metadata: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        view_count: 0,
        bookmark_count: 0,
        review_count: 0,
        copy_count: 0,
        use_count: 0,
        keywords: [],
        content_votes: [],
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockDetail] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getContentDetailComplete({ category: 'agents', slug: 'test-slug' });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getContentDetailComplete({ category: 'agents', slug: 'test-slug' });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getContentDetailCore', () => {
    it('should return content detail core for valid category and slug', async () => {
      // getContentDetailCore uses ContentService.getContentDetailCore which uses direct Prisma
      // Seed content table using Prismocker
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            id: '1',
            slug: 'test-slug',
            category: 'agents',
            title: 'Test',
            display_title: 'Test',
            seo_title: 'Test',
            description: 'Test description',
            author: 'Test Author',
            author_profile_url: null,
            date_added: new Date('2024-01-01'),
            tags: [],
            content: null,
            source: null,
            documentation_url: null,
            features: [],
            use_cases: [],
            examples: null,
            metadata: {},
            popularity_score: null,
            created_at: new Date('2024-01-01'),
            updated_at: new Date('2024-01-01'),
          },
        ]);
      }

      const result = await getContentDetailCore({ category: 'agents', slug: 'test-slug' });

      // getContentDetailCore returns an object with content and collection_items properties
      expect(result).toMatchObject({
        content: {
          id: '1',
          slug: 'test-slug',
          category: 'agents',
          title: 'Test',
        },
        collection_items: [],
      });
    });

    it('should reject invalid category', async () => {
      // Invalid category should fail validation and return null (not throw)
      const result = await getContentDetailCore({ category: 'invalid-category', slug: 'test-slug' });
      expect(result).toBeNull();
      // Should not call Prisma (validation fails before service call)
    });

    it('should return null when content not found', async () => {
      // Seed empty content table
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', []);
      }

      const result = await getContentDetailCore({ category: 'agents', slug: 'non-existent' });

      expect(result).toBeNull();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      // Seed content table
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('content', [
          {
            id: '1',
            slug: 'test-slug',
            category: 'agents',
            title: 'Test',
            display_title: 'Test',
            seo_title: 'Test',
            description: 'Test description',
            author: 'Test Author',
            author_profile_url: null,
            date_added: new Date('2024-01-01'),
            tags: [],
            content: null,
            source: null,
            documentation_url: null,
            features: [],
            use_cases: [],
            examples: null,
            metadata: {},
            popularity_score: null,
            created_at: new Date('2024-01-01'),
            updated_at: new Date('2024-01-01'),
          },
        ]);
      }

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getContentDetailCore({ category: 'agents', slug: 'test-slug' });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getContentDetailCore({ category: 'agents', slug: 'test-slug' });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });

  describe('getContentAnalytics', () => {
    it('should return content analytics for valid category and slug', async () => {
      // getContentAnalytics uses ContentService.getContentAnalytics which uses RPC
      const mockAnalytics = {
        content_id: '1',
        views_7d: 100,
        views_30d: 500,
        copies_7d: 10,
        copies_30d: 50,
        bookmarks_7d: 5,
        bookmarks_30d: 25,
        views_prev_7d: 80,
        velocity_7d: 1.25,
        last_calculated_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockAnalytics,
      ] as any);

      const result = await getContentAnalytics({ category: 'agents', slug: 'test-slug' });

      // $queryRawUnsafe is called with positional arguments (callRpc passes ...argValues)
      // Arguments are in object key insertion order: p_category, p_slug
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_content_analytics'),
        'agents', // p_category (first in insertion order)
        'test-slug' // p_slug
      );
      expect(result).toMatchObject({
        views_7d: 100,
        views_30d: 500,
        copies_7d: 10,
        copies_30d: 50,
      });
    });

    it('should reject invalid category', async () => {
      // Invalid category should fail validation and return null (not throw)
      const result = await getContentAnalytics({ category: 'invalid-category', slug: 'test-slug' });
      expect(result).toBeNull();
      // Should not call the service
      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('should return null when analytics not found', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([null] as any);

      const result = await getContentAnalytics({ category: 'agents', slug: 'non-existent' });

      expect(result).toBeNull();
    });

    it('should handle zero analytics', async () => {
      const mockAnalytics = {
        content_id: '1',
        views_7d: 0,
        views_30d: 0,
        copies_7d: 0,
        copies_30d: 0,
        bookmarks_7d: 0,
        bookmarks_30d: 0,
        views_prev_7d: 0,
        velocity_7d: 0,
        last_calculated_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockAnalytics,
      ] as any);

      const result = await getContentAnalytics({ category: 'agents', slug: 'test-slug' });

      expect(result).toMatchObject({
        views_7d: 0,
        views_30d: 0,
        copies_7d: 0,
        copies_30d: 0,
      });
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockAnalytics = {
        content_id: '1',
        views_7d: 100,
        views_30d: 500,
        copies_7d: 10,
        copies_30d: 50,
        bookmarks_7d: 5,
        bookmarks_30d: 25,
        views_prev_7d: 80,
        velocity_7d: 1.25,
        last_calculated_at: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockAnalytics,
      ] as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getContentAnalytics({ category: 'agents', slug: 'test-slug' });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getContentAnalytics({ category: 'agents', slug: 'test-slug' });
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);

      // Verify cache size increased after first call, stayed same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
