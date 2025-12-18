import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PrismockClient } from 'prismock';
import { ChangelogService } from './changelog.ts';

// Mock the prisma singleton with Prismock
vi.mock('../prisma/client.ts', () => {
  const { setupPrismockMock } = require('../test-utils/prisma-mock.ts');
  return {
    prisma: setupPrismockMock(),
  };
});

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
  let prismock: PrismockClient;

  beforeEach(async () => {
    // Get the mocked prisma instance (Prismock)
    const { prisma } = await import('../prisma/client.ts');
    prismock = prisma as PrismockClient;

    // Reset Prismock data before each test
    prismock.reset();

    changelogService = new ChangelogService();
  });

  describe('getChangelogOverview', () => {
    it('should return changelog overview on success', async () => {
      const mockData = {
        entries: [],
        total_count: 0,
      };

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await changelogService.getChangelogOverview({
        p_limit: 10,
        p_offset: 0,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_overview')
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error when RPC fails', async () => {
      const mockError = new Error('Database error');

      vi.mocked(prismock.$queryRawUnsafe).mockRejectedValue(mockError);

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

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await changelogService.getChangelogDetail({
        p_slug: '1-2-0-2025-12-07',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_detail')
      );
      expect(result).toEqual(mockData);
    });

    it('should handle null data gracefully', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

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

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([mockData] as any);

      const result = await changelogService.getChangelogWithCategoryStats({
        p_limit: 10,
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_with_category_stats')
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

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await changelogService.upsertChangelogEntry({
        p_version: '1.2.0',
        p_date: '2025-12-07',
        p_content: 'Test content',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('upsert_changelog_entry')
      );
      expect(result).toEqual(mockData[0]);
    });

    it('should return null when entry not found', async () => {
      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue([] as any);

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

      vi.mocked(prismock.$queryRawUnsafe).mockResolvedValue(mockData as any);

      const result = await changelogService.syncChangelogEntry({
        p_version: '1.2.0',
        p_date: '2025-12-07',
        p_content: 'Test content',
      });

      expect(prismock.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('sync_changelog_entry')
      );
      expect(result).toEqual(mockData[0]);
    });
  });

  describe('getPublishedChangelogSlugs', () => {
    it('should return published changelog slugs', async () => {
      const mockData = [
        { slug: '1-2-0-2025-12-07' },
        { slug: '1-1-0-2025-12-01' },
      ];

      // This uses Prisma directly, not RPC
      vi.mocked(prismock.changelog_entries.findMany).mockResolvedValue(
        mockData as any
      );

      const { withSmartCache } = await import('../utils/request-cache.ts');
      vi.mocked(withSmartCache).mockImplementation((_key, _method, fn) => fn());

      const result = await changelogService.getPublishedChangelogSlugs(10);

      expect(prismock.changelog_entries.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { published: true },
          select: { slug: true },
          orderBy: { date: 'desc' },
          take: 10,
        })
      );
      expect(result).toEqual(['1-2-0-2025-12-07', '1-1-0-2025-12-01']);
    });
  });
});
