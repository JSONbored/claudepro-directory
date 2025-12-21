import { describe, expect, it, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import { getChangelog, getChangelogOverview, getChangelogEntryBySlug, getPublishedChangelogSlugs } from './changelog';
import { createDataFunction } from './cached-data-factory';
import { QUERY_LIMITS } from './config/constants';
import type { changelog_category } from '@prisma/client';
import type { GetChangelogOverviewReturns } from '@heyclaude/database-types/postgres-types';

// Mock server-only
vi.mock('server-only', () => ({}));

// Mock cached-data-factory - use inline factory to avoid hoisting issues
vi.mock('./cached-data-factory', () => ({
  createDataFunction: vi.fn((config: any) => {
    // Store config for testing
    if (!(globalThis as any).__dataFunctionConfigs) {
      (globalThis as any).__dataFunctionConfigs = new Map();
    }
    (globalThis as any).__dataFunctionConfigs.set(config.operation, config);
    // Return a mock function that returns null by default
    return vi.fn().mockResolvedValue(null);
  }),
}));

// Mock constants
vi.mock('./config/constants', () => ({
  QUERY_LIMITS: {
    changelog: {
      default: 50,
    },
  },
}));

describe('changelog data functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getChangelogOverview', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getChangelogOverview');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('changelog');
      expect(config?.methodName).toBe('getChangelogOverview');
      expect(config?.operation).toBe('getChangelogOverview');
    });
  });

  describe('getChangelogEntryBySlug', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getChangelogEntryBySlug');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('changelog');
      expect(config?.methodName).toBe('getChangelogDetail');
      expect(config?.operation).toBe('getChangelogEntryBySlug');
      expect(config?.transformArgs).toBeDefined();
      expect(config?.transformResult).toBeDefined();
    });

    it('should transform slug to RPC args', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getChangelogEntryBySlug');
      const transformArgs = config?.transformArgs;
      expect(transformArgs('test-slug')).toEqual({ p_slug: 'test-slug' });
    });

    it('should transform result correctly', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getChangelogEntryBySlug');
      const transformResult = config?.transformResult;
      
      // Test with valid entry
      const mockResult = {
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
      
      const result = transformResult(mockResult);
      expect(result).toBeDefined();
      expect(result).toHaveProperty('id', 'entry-1');
      expect(result).toHaveProperty('slug', 'test-slug');
      expect(result).toHaveProperty('title', 'Test Entry');
      expect(result).toHaveProperty('created_at');
      expect(result?.created_at).toBeInstanceOf(Date);
    });

    it('should return null when entry is missing', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getChangelogEntryBySlug');
      const transformResult = config?.transformResult;
      
      expect(transformResult(null)).toBeNull();
      expect(transformResult({})).toBeNull();
      expect(transformResult({ entry: null })).toBeNull();
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

      // Mock getChangelogOverview
      const changelogModule = await import('./changelog');
      vi.spyOn(changelogModule, 'getChangelogOverview').mockResolvedValue(mockOverview);

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
      const changelogModule = await import('./changelog');
      vi.spyOn(changelogModule, 'getChangelogOverview').mockResolvedValue(null);

      const result = await getChangelog();

      expect(result).toEqual({
        entries: [],
        hasMore: false,
        limit: 0,
        offset: 0,
        total: 0,
      });
    });
  });

  describe('getPublishedChangelogSlugs', () => {
    it('should be created with correct configuration', () => {
      const configs = (globalThis as any).__dataFunctionConfigs;
      const config = configs?.get('getPublishedChangelogSlugs');
      expect(config).toBeDefined();
      expect(config?.serviceKey).toBe('changelog');
      expect(config?.methodName).toBe('getPublishedChangelogSlugs');
      expect(config?.operation).toBe('getPublishedChangelogSlugs');
      expect(config?.onError).toBeDefined();
      expect(config?.onError()).toEqual([]);
    });
  });
});

