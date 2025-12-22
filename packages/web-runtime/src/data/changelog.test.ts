import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  getChangelog,
  getChangelogOverview,
  getChangelogEntryBySlug,
  getPublishedChangelogSlugs,
} from './changelog';
import { prisma } from '@heyclaude/data-layer/prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { GetChangelogOverviewReturns } from '@heyclaude/database-types/postgres-types';

// Mock server-only
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
import { clearRequestCache, getRequestCache } from '../../../data-layer/src/utils/request-cache.ts';

// Mock RPC error logging utility
jest.mock('../../../data-layer/src/utils/rpc-error-logging.ts', () => ({
  logRpcError: jest.fn(),
}));

// Mock logger
jest.mock('../logger.ts', () => ({
  logger: {
    child: jest.fn(() => ({
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock normalizeError
jest.mock('../errors.ts', () => ({
  normalizeError: jest.fn((error: unknown, message?: string) => {
    if (error instanceof Error) {
      return error;
    }
    return new Error(message || (typeof error === 'string' ? error : 'Unknown error'));
  }),
}));

// Mock constants
jest.mock('./config/constants', () => ({
  QUERY_LIMITS: {
    changelog: {
      default: 50,
    },
  },
}));

// Don't mock createDataFunction - use real implementation
// Don't mock service-factory - use real implementation
// Services will use Prismocker via __mocks__/@prisma/client.ts
// ChangelogService uses RPC calls via $queryRawUnsafe

describe('changelog data functions', () => {
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

    jest.clearAllMocks();

    // Set up $queryRawUnsafe for RPC testing (ChangelogService uses RPC)
    // Use Prismocker's Proxy set handler to override $queryRawUnsafe
    prismocker.$queryRawUnsafe = jest.fn().mockResolvedValue([]);
  });

  describe('getChangelogOverview', () => {
    it('should return changelog overview on success', async () => {
      const mockData: GetChangelogOverviewReturns = {
        entries: [
          {
            id: 'entry-1',
            slug: 'test-entry',
            title: 'Test Entry',
            release_date: '2024-01-01',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            featured: false,
            published: true,
            content: 'Test content',
            raw_content: 'Test raw content',
            description: null,
            tldr: null,
            keywords: [],
            changes: {},
            metadata: null,
            contributors: [],
            canonical_url: null,
            commit_count: null,
            git_commit_sha: null,
            json_ld: null,
            og_image: null,
            og_type: null,
            robots_follow: null,
            robots_index: null,
            seo_description: null,
            seo_title: null,
            source: null,
            twitter_card: null,
          },
        ],
        featured: [],
        metadata: {
          category_counts: {},
          date_range: { earliest: '2024-01-01', latest: '2024-01-01' },
          total_entries: 1,
        },
        pagination: {
          has_more: false,
          limit: 50,
          offset: 0,
          total: 1,
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockData] as any);

      const result = await getChangelogOverview({
        limit: 50,
        offset: 0,
        publishedOnly: true,
      });

      // $queryRawUnsafe is called with (query, ...argValues)
      // Arguments are passed in object key insertion order: p_featured_only, p_limit, p_offset, p_published_only
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_overview'),
        false, // p_featured_only (from transformArgs, default false)
        50, // p_limit
        0, // p_offset
        true // p_published_only
      );
      expect(result).toEqual(mockData);
    });

    it('should return empty overview on error', async () => {
      // When RPC fails, createDataFunction's onError handler should return empty overview
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(new Error('Database error'));

      const result = await getChangelogOverview({
        limit: 50,
        offset: 0,
      });

      // Should return empty overview from onError handler
      expect(result).toEqual({
        entries: [],
        featured: [],
        metadata: {
          category_counts: {},
          date_range: { earliest: '', latest: '' },
          total_entries: 0,
        },
        pagination: {
          has_more: false,
          limit: 50,
          offset: 0,
          total: 0,
        },
      });
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockData: GetChangelogOverviewReturns = {
        entries: [],
        featured: [],
        metadata: {
          category_counts: {},
          date_range: { earliest: '', latest: '' },
          total_entries: 0,
        },
        pagination: {
          has_more: false,
          limit: 50,
          offset: 0,
          total: 0,
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockData] as any);

      const args = {
        limit: 50,
        offset: 0,
        publishedOnly: true,
      };

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getChangelogOverview(args);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same args
      const result2 = await getChangelogOverview(args);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);

      // Verify $queryRawUnsafe was only called once (cached on second call)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });

    it('should handle category filter', async () => {
      const mockData: GetChangelogOverviewReturns = {
        entries: [],
        featured: [],
        metadata: {
          category_counts: {},
          date_range: { earliest: '', latest: '' },
          total_entries: 0,
        },
        pagination: {
          has_more: false,
          limit: 50,
          offset: 0,
          total: 0,
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockData] as any);

      await getChangelogOverview({
        category: 'features',
        limit: 50,
        offset: 0,
      });

      // Should include category in RPC call
      // Arguments are passed in object key insertion order: p_category, p_featured_only, p_limit, p_offset, p_published_only
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_overview'),
        expect.anything(), // p_category (when provided)
        expect.anything(), // p_featured_only
        expect.anything(), // p_limit
        expect.anything(), // p_offset
        expect.anything() // p_published_only
      );
    });
  });

  describe('getChangelogEntryBySlug', () => {
    it('should return changelog entry on success', async () => {
      const mockRpcResult = {
        entry: {
          id: 'entry-1',
          slug: 'test-slug',
          title: 'Test Entry',
          content: 'Test content',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          release_date: '2024-01-01T00:00:00Z',
          featured: true,
          published: true,
          keywords: ['test', 'changelog'],
          changes: { added: ['feature1'] },
          metadata: { version: '1.0.0' },
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      const result = await getChangelogEntryBySlug('test-slug');

      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledWith(
        expect.stringContaining('get_changelog_detail'),
        'test-slug' // p_slug
      );
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', 'entry-1');
      expect(result).toHaveProperty('slug', 'test-slug');
      expect(result).toHaveProperty('title', 'Test Entry');
      expect(result?.created_at).toBeInstanceOf(Date);
    });

    it('should return null when entry is missing', async () => {
      // Empty array means no entry found
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([] as any);

      const result = await getChangelogEntryBySlug('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when entry field is missing', async () => {
      // RPC returns result but entry field is missing
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([{}] as any);

      const result = await getChangelogEntryBySlug('test-slug');

      expect(result).toBeNull();
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      const mockRpcResult = {
        entry: {
          id: 'entry-1',
          slug: 'test-slug',
          title: 'Test Entry',
          content: 'Test content',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
          release_date: '2024-01-01T00:00:00Z',
          featured: true,
          published: true,
          keywords: [],
          changes: {},
          metadata: null,
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockRpcResult] as any);

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getChangelogEntryBySlug('test-slug');
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same slug
      const result2 = await getChangelogEntryBySlug('test-slug');
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);
      expect(result1).toBeDefined();

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);

      // Verify $queryRawUnsafe was only called once (cached on second call)
      expect(prismocker.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });
  });

  describe('getChangelog', () => {
    it('should return changelog data with correct structure', async () => {
      const mockOverview: GetChangelogOverviewReturns = {
        entries: [
          {
            id: 'entry-1',
            slug: 'test-entry',
            title: 'Test Entry',
            release_date: '2024-01-01',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            featured: false,
            published: true,
            content: 'Test content',
            raw_content: 'Test raw content',
            description: null,
            tldr: null,
            keywords: [],
            changes: {},
            metadata: null,
            contributors: [],
            canonical_url: null,
            commit_count: null,
            git_commit_sha: null,
            json_ld: null,
            og_image: null,
            og_type: null,
            robots_follow: null,
            robots_index: null,
            seo_description: null,
            seo_title: null,
            source: null,
            twitter_card: null,
          },
        ],
        featured: [],
        metadata: {
          category_counts: {},
          date_range: { earliest: '2024-01-01', latest: '2024-01-01' },
          total_entries: 1,
        },
        pagination: {
          has_more: false,
          limit: 50,
          offset: 0,
          total: 1,
        },
      };

      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockResolvedValue([mockOverview] as any);

      const result = await getChangelog();

      expect(result).toEqual({
        entries: mockOverview.entries,
        hasMore: false,
        limit: 50,
        offset: 0,
        total: 1,
      });
    });

    it('should return empty data when overview is null', async () => {
      // When RPC fails, getChangelogOverview returns empty overview, not null
      // But we test the case where it could theoretically be null
      (prismocker.$queryRawUnsafe as ReturnType<typeof jest.fn>).mockRejectedValue(new Error('Database error'));

      const result = await getChangelog();

      // Should return empty structure when overview fails
      // onError handler uses the limit from options (defaults to QUERY_LIMITS.changelog.default = 50)
      expect(result).toEqual({
        entries: [],
        hasMore: false,
        limit: 50, // Default limit from QUERY_LIMITS.changelog.default
        offset: 0,
        total: 0,
      });
    });
  });

  describe('getPublishedChangelogSlugs', () => {
    it('should return published changelog slugs on success', async () => {
      // getPublishedChangelogSlugs uses Prisma directly (prisma.changelog.findMany), not RPC
      const mockChangelogEntries = [
        {
          id: 'entry-1',
          slug: 'slug-1',
          published: true,
          release_date: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          title: 'Entry 1',
          content: 'Content 1',
          raw_content: 'Raw content 1',
          featured: false,
          description: null,
          tldr: null,
          keywords: [],
          changes: {},
          metadata: null,
          contributors: [],
          canonical_url: null,
          commit_count: null,
          git_commit_sha: null,
          json_ld: null,
          og_image: null,
          og_type: null,
          robots_follow: null,
          robots_index: null,
          seo_description: null,
          seo_title: null,
          source: null,
          twitter_card: null,
        },
        {
          id: 'entry-2',
          slug: 'slug-2',
          published: true,
          release_date: new Date('2024-01-02'),
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02'),
          title: 'Entry 2',
          content: 'Content 2',
          raw_content: 'Raw content 2',
          featured: false,
          description: null,
          tldr: null,
          keywords: [],
          changes: {},
          metadata: null,
          contributors: [],
          canonical_url: null,
          commit_count: null,
          git_commit_sha: null,
          json_ld: null,
          og_image: null,
          og_type: null,
          robots_follow: null,
          robots_index: null,
          seo_description: null,
          seo_title: null,
          source: null,
          twitter_card: null,
        },
        {
          id: 'entry-3',
          slug: 'slug-3',
          published: true,
          release_date: new Date('2024-01-03'),
          created_at: new Date('2024-01-03'),
          updated_at: new Date('2024-01-03'),
          title: 'Entry 3',
          content: 'Content 3',
          raw_content: 'Raw content 3',
          featured: false,
          description: null,
          tldr: null,
          keywords: [],
          changes: {},
          metadata: null,
          contributors: [],
          canonical_url: null,
          commit_count: null,
          git_commit_sha: null,
          json_ld: null,
          og_image: null,
          og_type: null,
          robots_follow: null,
          robots_index: null,
          seo_description: null,
          seo_title: null,
          source: null,
          twitter_card: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('changelog', mockChangelogEntries);
      }

      const result = await getPublishedChangelogSlugs(100);

      // Should return slugs in descending release_date order (newest first)
      expect(result).toEqual(['slug-3', 'slug-2', 'slug-1']);
    });

    it('should return empty array when no published entries', async () => {
      // Seed with unpublished entries
      const mockChangelogEntries = [
        {
          id: 'entry-1',
          slug: 'slug-1',
          published: false, // Not published
          release_date: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          title: 'Entry 1',
          content: 'Content 1',
          raw_content: 'Raw content 1',
          featured: false,
          description: null,
          tldr: null,
          keywords: [],
          changes: {},
          metadata: null,
          contributors: [],
          canonical_url: null,
          commit_count: null,
          git_commit_sha: null,
          json_ld: null,
          og_image: null,
          og_type: null,
          robots_follow: null,
          robots_index: null,
          seo_description: null,
          seo_title: null,
          source: null,
          twitter_card: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('changelog', mockChangelogEntries);
      }

      const result = await getPublishedChangelogSlugs(100);

      // Should return empty array (no published entries)
      expect(result).toEqual([]);
    });

    it('should cache results on duplicate calls (caching test)', async () => {
      // getPublishedChangelogSlugs uses Prisma directly, not RPC
      const mockChangelogEntries = [
        {
          id: 'entry-1',
          slug: 'slug-1',
          published: true,
          release_date: new Date('2024-01-01'),
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-01'),
          title: 'Entry 1',
          content: 'Content 1',
          raw_content: 'Raw content 1',
          featured: false,
          description: null,
          tldr: null,
          keywords: [],
          changes: {},
          metadata: null,
          contributors: [],
          canonical_url: null,
          commit_count: null,
          git_commit_sha: null,
          json_ld: null,
          og_image: null,
          og_type: null,
          robots_follow: null,
          robots_index: null,
          seo_description: null,
          seo_title: null,
          source: null,
          twitter_card: null,
        },
        {
          id: 'entry-2',
          slug: 'slug-2',
          published: true,
          release_date: new Date('2024-01-02'),
          created_at: new Date('2024-01-02'),
          updated_at: new Date('2024-01-02'),
          title: 'Entry 2',
          content: 'Content 2',
          raw_content: 'Raw content 2',
          featured: false,
          description: null,
          tldr: null,
          keywords: [],
          changes: {},
          metadata: null,
          contributors: [],
          canonical_url: null,
          commit_count: null,
          git_commit_sha: null,
          json_ld: null,
          og_image: null,
          og_type: null,
          robots_follow: null,
          robots_index: null,
          seo_description: null,
          seo_title: null,
          source: null,
          twitter_card: null,
        },
      ];

      if ('setData' in prismocker && typeof (prismocker as any).setData === 'function') {
        (prismocker as any).setData('changelog', mockChangelogEntries);
      }

      // First call
      const cacheBefore = getRequestCache().getStats().size;
      const result1 = await getPublishedChangelogSlugs(100);
      const cacheAfterFirst = getRequestCache().getStats().size;

      // Second call with same limit
      const result2 = await getPublishedChangelogSlugs(100);
      const cacheAfterSecond = getRequestCache().getStats().size;

      // Verify results are the same
      expect(result1).toEqual(result2);
      expect(result1).toEqual(['slug-2', 'slug-1']); // Descending order

      // Cache should increase after first call, stay same after second
      expect(cacheAfterFirst).toBeGreaterThan(cacheBefore);
      expect(cacheAfterSecond).toBe(cacheAfterFirst);
    });
  });
});
