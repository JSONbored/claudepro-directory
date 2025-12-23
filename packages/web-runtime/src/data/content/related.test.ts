import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { getRelatedContent, type RelatedContentInput } from './related';
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

// Don't mock createDataFunction - use real implementation
// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts

// Don't mock category validation - use real implementation

describe('related content data functions', () => {
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

    // 5. Set up $queryRawUnsafe for RPC testing (getRelatedContent uses RPC)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  describe('getRelatedContent', () => {
    it('should be a function', () => {
      expect(typeof getRelatedContent).toBe('function');
    });

    it('should return related content for valid category and path', async () => {
      // getRelatedContent uses RPC (get_related_content)
      const mockRpcResult = [
        {
          title: 'Related Item 1',
          slug: 'related-1',
          category: 'agents',
        },
        {
          title: 'Related Item 2',
          slug: 'related-2',
          category: 'agents',
        },
      ];

      // get_related_content returns SETOF, so $queryRawUnsafe returns array of rows directly
      // callRpc with _content in name treats it as array return type, returns array directly
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockRpcResult as any);

      const result = await getRelatedContent({
        currentCategory: 'agents',
        currentPath: '/agents/test-slug',
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('items');
      expect(result?.items.length).toBe(2);
      expect(result?.items[0]).toMatchObject({
        title: 'Related Item 1',
        slug: 'related-1',
        category: 'agents',
      });

      // Verify RPC was called with correct arguments
      // callRpc passes positional arguments in object key insertion order from transformArgs:
      // p_category, p_exclude_slugs, p_limit, p_slug, p_tags
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_related_content'),
        'agents', // p_category (first in insertion order)
        [], // p_exclude_slugs (second)
        5, // p_limit (third)
        'test-slug', // p_slug (fourth, extracted from currentPath)
        [] // p_tags (fifth, empty array)
      );
    });

    it('should transform args correctly with all options', async () => {
      const mockRpcResult = [
        {
          title: 'Related Item 1',
          slug: 'related-1',
          category: 'agents',
        },
      ];

      // get_related_content returns SETOF, so $queryRawUnsafe returns array of rows directly
      // callRpc with _content in name treats it as array return type, returns array directly
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockRpcResult as any);

      const input: RelatedContentInput = {
        currentCategory: 'agents',
        currentPath: '/agents/test-slug',
        currentTags: ['tag1', 'tag2'],
        exclude: ['exclude1'],
        limit: 5,
      };

      await getRelatedContent(input);

      // Verify RPC was called with transformed arguments
      // Arguments are in object key insertion order: p_category, p_exclude_slugs, p_limit, p_slug, p_tags
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_related_content'),
        'agents', // p_category (first)
        ['exclude1'], // p_exclude_slugs (second)
        5, // p_limit (third)
        'test-slug', // p_slug (fourth, extracted from currentPath)
        ['tag1', 'tag2'] // p_tags (fifth)
      );
    });

    it('should filter out items without title, slug, or category', async () => {
      // transformResult filters out items without title, slug, or category
      const mockRpcResult = [
        {
          title: 'Valid Item',
          slug: 'valid-item',
          category: 'agents',
        },
        {
          title: null, // Should be filtered
          slug: 'item-2',
          category: 'agents',
        },
        {
          title: 'Item 3',
          slug: null, // Should be filtered
          category: 'agents',
        },
        {
          title: 'Item 4',
          slug: 'item-4',
          category: null, // Should be filtered
        },
        {
          title: 'Valid Item 2',
          slug: 'valid-item-2',
          category: 'mcp',
        },
      ];

      // get_related_content returns SETOF, so $queryRawUnsafe returns array of rows directly
      // callRpc with _content in name treats it as array return type, returns array directly
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockRpcResult as any);

      const result = await getRelatedContent({
        currentCategory: 'agents',
        currentPath: '/agents/test-slug',
      });

      expect(result).toBeDefined();
      // transformResult filters out items without title, slug, or category
      // RPC result is wrapped in array by callRpc, so mock should return [mockRpcResult]
      expect(result?.items.length).toBe(2); // Only valid items (2 out of 5)
      expect(result?.items[0]).toMatchObject({
        title: 'Valid Item',
        slug: 'valid-item',
        category: 'agents',
      });
      expect(result?.items[1]).toMatchObject({
        title: 'Valid Item 2',
        slug: 'valid-item-2',
        category: 'mcp',
      });
    });

    it('should reject invalid category', async () => {
      // Invalid category should fail validation and return null (not throw)
      const result = await getRelatedContent({
        currentCategory: 'invalid-category',
        currentPath: '/invalid/test-slug',
      });

      expect(result).toBeNull();
      // Should not call the service
      expect(prismocker.$queryRawUnsafe).not.toHaveBeenCalled();
    });

    it('should handle empty path', async () => {
      const mockRpcResult: any[] = [];

      // get_related_content returns SETOF, so $queryRawUnsafe returns array of rows directly
      // callRpc with _content in name treats it as array return type, returns array directly
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockRpcResult as any);

      const result = await getRelatedContent({
        currentCategory: 'agents',
        currentPath: '',
        limit: 5,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('items');
      // Empty path should extract empty slug
      // Arguments are in object key insertion order: p_category, p_exclude_slugs, p_limit, p_slug, p_tags
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_related_content'),
        'agents', // p_category (first)
        [], // p_exclude_slugs (second)
        5, // p_limit (third)
        '', // p_slug (fourth, empty string from empty path)
        [] // p_tags (fifth)
      );
    });

    it('should handle service errors gracefully', async () => {
      // getRelatedContent has onError handler that returns { items: [] }
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(
        new Error('Service error')
      );

      // createDataFunction returns null on error by default (throwOnError is false)
      // But getRelatedContent has onError handler, so it should return { items: [] }
      const result = await getRelatedContent({
        currentCategory: 'agents',
        currentPath: '/agents/test-slug',
      });

      // onError handler returns { items: [] }
      expect(result).toMatchObject({ items: [] });
    });

    it('should use default limit when not provided', async () => {
      const mockRpcResult = [
        {
          title: 'Item 1',
          slug: 'item-1',
          category: 'agents',
        },
      ];

      // get_related_content returns SETOF, so $queryRawUnsafe returns array of rows directly
      // callRpc with _content in name treats it as array return type, returns array directly
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockRpcResult as any);

      await getRelatedContent({
        currentCategory: 'agents',
        currentPath: '/agents/test-slug',
        // limit not provided, should default to 3
      });

      // Arguments are in object key insertion order: p_category, p_exclude_slugs, p_limit, p_slug, p_tags
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_related_content'),
        'agents', // p_category (first)
        [], // p_exclude_slugs (second)
        3, // p_limit (third, default limit)
        'test-slug', // p_slug (fourth)
        [] // p_tags (fifth)
      );
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      // getRelatedContent uses createDataFunction which uses withSmartCache via service
      const mockRpcResult = [
        {
          title: 'Cached Item',
          slug: 'cached-item',
          category: 'agents',
        },
      ];

      // get_related_content returns SETOF, so $queryRawUnsafe returns array of rows directly
      // callRpc with _content in name treats it as array return type, returns array directly
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockRpcResult as any);

      // First call - should populate cache
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getRelatedContent({
        currentCategory: 'agents',
        currentPath: '/agents/test-slug',
      });
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call - should use cache
      const result2 = await getRelatedContent({
        currentCategory: 'agents',
        currentPath: '/agents/test-slug',
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