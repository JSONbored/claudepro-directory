import { describe, expect, it, vi, beforeEach } from 'vitest';
import { ChangelogService } from './changelog.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismock is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockClient

// Mock the RPC error logging utility
vi.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: vi.fn(),
}));

// Mock request cache
vi.mock('../utils/request-cache.ts', () => ({
  withSmartCache: vi.fn((_key, _method, fn) => fn()),
}));

describe('ChangelogService', () => {
  let changelogService: ChangelogService;
  let prismock: PrismaClient;
  let queryRawUnsafeSpy: ReturnType<typeof vi.fn>;

  /**
   * Helper to safely mock Prismock model methods
   */
  function mockPrismockMethod<T>(
    model: any,
    method: string,
    returnValue: T
  ): ReturnType<typeof vi.fn> {
    if (!model) {
      throw new Error(`Prismock model does not exist - check if model name matches schema.prisma`);
    }
    const mockFn = vi.fn().mockResolvedValue(returnValue as any);
    model[method] = mockFn;
    return mockFn;
  }

  beforeEach(async () => {
    // Get the prisma instance (automatically PrismockClient via __mocks__/@prisma/client.ts)
    prismock = prisma;

    // Reset Prismock data before each test
    if ('reset' in prismock && typeof prismock.reset === 'function') {
      prismock.reset();
    }

    // Prismock doesn't support $queryRawUnsafe, so we add it as a mock function
    queryRawUnsafeSpy = vi.fn().mockResolvedValue([]);
    (prismock as any).$queryRawUnsafe = queryRawUnsafeSpy;

    // Ensure Prismock models are initialized
    void prismock.changelog;

    changelogService = new ChangelogService();
  });

  describe('getChangelogOverview', () => {
    it('should return changelog overview on success', async () => {
      const mockData = {
        entries: [],
        total_count: 0,
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await changelogService.getChangelogOverview({
        p_limit: 10,
        p_offset: 0,
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category (optional), p_limit, p_offset, p_published_only (optional)
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_overview'),
        10, // p_limit
        0 // p_offset
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });

    it('should throw error when RPC fails', async () => {
      const mockError = new Error('Database error');

      queryRawUnsafeSpy.mockRejectedValue(mockError);

      await expect(
        changelogService.getChangelogOverview({
          p_limit: 10,
          p_offset: 0,
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('getChangelogDetail', () => {
    it('should return changelog detail on success', async () => {
      const mockData = {
        slug: '1-2-0-2025-12-07',
        version: '1.2.0',
        content: 'Test changelog content',
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await changelogService.getChangelogDetail({
        p_slug: '1-2-0-2025-12-07',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_slug
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_detail'),
        '1-2-0-2025-12-07' // p_slug
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });

    it('should handle null data gracefully', async () => {
      queryRawUnsafeSpy.mockResolvedValue([] as any);

      const result = await changelogService.getChangelogDetail({
        p_slug: 'non-existent',
      });

      expect(result).toBeUndefined();
    });
  });

  describe('getChangelogWithCategoryStats', () => {
    it('should return changelog with category stats', async () => {
      const mockData = {
        entries: [],
        category_stats: [],
      };

      queryRawUnsafeSpy.mockResolvedValue([mockData] as any);

      const result = await changelogService.getChangelogWithCategoryStats({
        p_limit: 10,
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_limit
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_with_category_stats'),
        10 // p_limit
      );
      expect(result).toEqual(mockData);
    });
  });

  describe('upsertChangelogEntry', () => {
    it('should upsert changelog entry (mutation, no cache)', async () => {
      const mockData = [
        {
          id: 'entry-123',
          slug: '1-2-0-2025-12-07',
          version: '1.2.0',
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const result = await changelogService.upsertChangelogEntry({
        p_version: '1.2.0',
        p_date: '2025-12-07',
        p_content: 'Test content',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key insertion order: p_version, p_date, p_content
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('upsert_changelog_entry'),
        '1.2.0', // p_version (first in insertion order)
        '2025-12-07', // p_date
        'Test content' // p_content
      );
      // RPC returns TABLE(...) which is an array, callRpc with returnType: 'array' keeps it as array
      // Service then unwraps first element
      expect(result).toEqual(mockData[0]);
    });

    it('should return null when entry not found', async () => {
      queryRawUnsafeSpy.mockResolvedValue([] as any);

      const result = await changelogService.upsertChangelogEntry({
        p_version: '1.2.0',
        p_date: '2025-12-07',
        p_content: 'Test content',
      });

      expect(result).toBeNull();
    });
  });

  describe('syncChangelogEntry', () => {
    it('should sync changelog entry (mutation, no cache)', async () => {
      const mockData = [
        {
          id: 'entry-123',
          slug: '1-2-0-2025-12-07',
        },
      ];

      queryRawUnsafeSpy.mockResolvedValue(mockData as any);

      const result = await changelogService.syncChangelogEntry({
        p_version: '1.2.0',
        p_date: '2025-12-07',
        p_content: 'Test content',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key insertion order: p_version, p_date, p_content
      expect(queryRawUnsafeSpy).toHaveBeenCalledWith(
        expect.stringContaining('sync_changelog_entry'),
        '1.2.0', // p_version (first in insertion order)
        '2025-12-07', // p_date
        'Test content' // p_content
      );
      // RPC returns TABLE(...) which is an array, callRpc with returnType: 'array' keeps it as array
      // Service then unwraps first element
      expect(result).toEqual(mockData[0]);
    });
  });

  describe('getPublishedChangelogSlugs', () => {
    it('should return published changelog slugs', async () => {
      const mockData = [{ slug: '1-2-0-2025-12-07' }, { slug: '1-1-0-2025-12-01' }];

      // This uses Prisma directly, not RPC
      mockPrismockMethod(prismock.changelog, 'findMany', mockData);

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await changelogService.getPublishedChangelogSlugs(10);

      expect(prismock.changelog.findMany).toHaveBeenCalledWith({
        where: { published: true },
        select: { slug: true },
        orderBy: { release_date: 'desc' },
        take: 10,
      });
      expect(result).toEqual(['1-2-0-2025-12-07', '1-1-0-2025-12-01']);
    });
  });
});
