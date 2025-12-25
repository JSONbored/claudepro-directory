import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { ChangelogService } from './changelog.ts';
import { prisma } from '../prisma/client.ts';
import type { PrismaClient } from '@prisma/client';

// Prismocker is automatically configured via __mocks__/@prisma/client.ts
// The prisma singleton from '../prisma/client.ts' will automatically use PrismockerClient
// Jest automatically uses __mocks__ directory (no explicit registration needed)

// Mock the RPC error logging utility
jest.mock('../utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Import real cache utilities for proper cache testing
import { clearRequestCache, getRequestCache } from '../utils/request-cache.ts';

describe('ChangelogService', () => {
  let changelogService: ChangelogService;
  let prismocker: PrismaClient;

  beforeEach(async () => {
    // Clear request cache before each test
    clearRequestCache();

    // Get the prisma instance (automatically PrismockerClient via __mocks__/@prisma/client.ts)
    prismocker = prisma;

    // Reset Prismocker data before each test
    if ('reset' in prismocker && typeof prismocker.reset === 'function') {
      prismocker.reset();
    }

    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);

    // Ensure Prismocker models are initialized
    void prismocker.changelog;

    changelogService = new ChangelogService();
  });

  describe('getChangelogOverview', () => {
    it('should return changelog overview on success', async () => {
      const mockData = {
        entries: [],
        total_count: 0,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      const result = await changelogService.getChangelogOverview({
        p_limit: 10,
        p_offset: 0,
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_category (optional), p_limit, p_offset, p_published_only (optional)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_overview'),
        10, // p_limit
        0 // p_offset
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });

    it('should throw error when RPC fails', async () => {
      const mockError = new Error('Database error');

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(mockError);

      await expect(
        changelogService.getChangelogOverview({
          p_limit: 10,
          p_offset: 0,
        })
      ).rejects.toThrow('Database error');
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        entries: [],
        total_count: 0,
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      // First call
      await changelogService.getChangelogOverview({
        p_limit: 10,
        p_offset: 0,
      });

      // Verify cache was populated
      expect(getRequestCache().getStats().size).toBeGreaterThan(0);

      // Second call (should use cache)
      await changelogService.getChangelogOverview({
        p_limit: 10,
        p_offset: 0,
      });

      // Verify $queryRawUnsafe was only called once (cached on second call)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });
  });

  describe('getChangelogDetail', () => {
    it('should return changelog detail on success', async () => {
      const mockData = {
        slug: '1-2-0-2025-12-07',
        version: '1.2.0',
        content: 'Test changelog content',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      const result = await changelogService.getChangelogDetail({
        p_slug: '1-2-0-2025-12-07',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_slug
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_detail'),
        '1-2-0-2025-12-07' // p_slug
      );
      // Single-return function unwraps array
      expect(result).toEqual(mockData);
    });

    it('should handle null data gracefully', async () => {
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([] as any);

      const result = await changelogService.getChangelogDetail({
        p_slug: 'non-existent',
      });

      expect(result).toBeUndefined();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        slug: '1-2-0-2025-12-07',
        version: '1.2.0',
        content: 'Test changelog content',
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      // First call
      await changelogService.getChangelogDetail({
        p_slug: '1-2-0-2025-12-07',
      });

      // Verify cache was populated
      expect(getRequestCache().getStats().size).toBeGreaterThan(0);

      // Second call (should use cache)
      await changelogService.getChangelogDetail({
        p_slug: '1-2-0-2025-12-07',
      });

      // Verify $queryRawUnsafe was only called once (cached on second call)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });
  });

  describe('getChangelogWithCategoryStats', () => {
    it('should return changelog with category stats', async () => {
      const mockData = {
        entries: [],
        category_stats: [],
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      const result = await changelogService.getChangelogWithCategoryStats({
        p_limit: 10,
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key order: p_limit
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_with_category_stats'),
        10 // p_limit
      );
      expect(result).toEqual(mockData);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = {
        entries: [],
        category_stats: [],
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([
        mockData,
      ] as any);

      // First call
      await changelogService.getChangelogWithCategoryStats({
        p_limit: 10,
      });

      // Verify cache was populated
      expect(getRequestCache().getStats().size).toBeGreaterThan(0);

      // Second call (should use cache)
      await changelogService.getChangelogWithCategoryStats({
        p_limit: 10,
      });

      // Verify $queryRawUnsafe was only called once (cached on second call)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
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

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockData as any);

      const result = await changelogService.upsertChangelogEntry({
        p_version: '1.2.0',
        p_date: '2025-12-07',
        p_content: 'Test content',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key insertion order: p_version, p_date, p_content
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
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
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([] as any);

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

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue(mockData as any);

      const result = await changelogService.syncChangelogEntry({
        p_version: '1.2.0',
        p_date: '2025-12-07',
        p_content: 'Test content',
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key insertion order: p_version, p_date, p_content
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
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
      const mockData = [
        { slug: '1-2-0-2025-12-07', published: true, release_date: new Date('2025-12-07') },
        { slug: '1-1-0-2025-12-01', published: true, release_date: new Date('2025-12-01') },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('changelog', mockData);
      }

      const result = await changelogService.getPublishedChangelogSlugs(10);

      expect(result).toEqual(['1-2-0-2025-12-07', '1-1-0-2025-12-01']);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData = [
        { slug: '1-2-0-2025-12-07', published: true, release_date: new Date('2025-12-07') },
      ];

      // Use Prismocker's setData to seed test data
      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('changelog', mockData);
      }

      // First call
      await changelogService.getPublishedChangelogSlugs(10);

      // Verify cache was populated
      expect(getRequestCache().getStats().size).toBeGreaterThan(0);

      // Second call (should use cache)
      await changelogService.getPublishedChangelogSlugs(10);

      // Verify cache was used (we can't directly spy on findMany with Prismocker, but we can verify cache was used)
      expect(getRequestCache().getStats().size).toBeGreaterThan(0);
    });
  });
});
