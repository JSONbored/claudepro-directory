import 'server-only';
import { type GetChangelogOverviewReturns } from '@heyclaude/database-types/postgres-types';
import { Prisma } from '@prisma/client';
import { type changelog_category } from '@prisma/client';

import { createDataFunction } from './cached-data-factory.ts';
import { QUERY_LIMITS } from './config/constants.ts';
import './changelog.shared.ts';
type changelogModel = Prisma.changelogGetPayload<{}>;
type JsonValue = Prisma.JsonValue;

// Export shared utils
export * from './changelog.shared.ts';

function createEmptyOverview(limit: number, offset = 0): GetChangelogOverviewReturns {
  return {
    entries: [],
    featured: [],
    metadata: {
      category_counts: {},
      date_range: { earliest: '', latest: '' },
      total_entries: 0,
    },
    pagination: {
      has_more: false,
      limit,
      offset,
      total: 0,
    },
  };
}

/**
 * Get changelog overview
 * Uses 'use cache' to cache changelog overview. This data is public and same for all users.
 */
export const getChangelogOverview = createDataFunction<
  {
    category?: changelog_category;
    featuredOnly?: boolean;
    limit?: number;
    offset?: number;
    publishedOnly?: boolean;
  },
  GetChangelogOverviewReturns
>({
  logContext: (options) => ({
    ...(options.category ? { category: options.category } : {}),
    featuredOnly: options.featuredOnly ?? false,
    limit: options.limit ?? 50,
    offset: options.offset ?? 0,
    publishedOnly: options.publishedOnly ?? true,
  }),
  methodName: 'getChangelogOverview',
  module: 'data/changelog',
  onError: (_, options) => createEmptyOverview(options.limit ?? 50, options.offset ?? 0),
  operation: 'getChangelogOverview',
  serviceKey: 'changelog',
  transformArgs: (options) => ({
    ...(options.category ? { p_category: options.category } : {}),
    p_featured_only: options.featuredOnly ?? false,
    p_limit: options.limit ?? 50,
    p_offset: options.offset ?? 0,
    p_published_only: options.publishedOnly ?? true,
  }),
});

/**
 * Get changelog entry by slug
 * Uses 'use cache' to cache changelog entries. This data is public and same for all users.
 * Changelog entries change periodically, so we use the 'long' cacheLife profile.
 */
export const getChangelogEntryBySlug = createDataFunction<string, changelogModel | null>({
  methodName: 'getChangelogDetail',
  module: 'data/changelog',
  operation: 'getChangelogEntryBySlug',
  serviceKey: 'changelog',
  transformArgs: (slug) => ({ p_slug: slug }),
  transformResult: (result) => {
    const detailResult = result as null | { entry?: unknown };
    if (!detailResult?.entry) {
      return null;
    }

    const entry = detailResult.entry as {
      changes?: unknown;
      content?: string;
      created_at?: string;
      description?: string;
      featured?: boolean;
      id?: string;
      keywords?: string[];
      metadata?: unknown;
      published?: boolean;
      raw_content?: string;
      release_date?: string;
      slug?: string;
      title?: string;
      tldr?: string;
      updated_at?: string;
    };

    // Convert RPC return data (string dates) to Prisma types (Date objects)
    const normalizedEntry: changelogModel = {
      canonical_url: null,
      changes: (entry.changes ?? {}) as JsonValue,
      commit_count: null,
      content: entry.content ?? '',
      contributors: [], // RPC doesn't return contributors, use empty array
      created_at: new Date(entry.created_at ?? ''),
      description: entry.description ?? null,
      featured: entry.featured ?? false,
      git_commit_sha: null,
      id: entry.id ?? '',
      json_ld: null,
      keywords: Array.isArray(entry.keywords) ? entry.keywords : [],
      metadata: (entry.metadata ?? null) as JsonValue | null,
      og_image: null,
      og_type: null,
      published: entry.published ?? false,
      raw_content: entry.raw_content ?? '',
      // Use release_date if provided, otherwise fallback to created_at (eliminates new Date() call)
      release_date: entry.release_date
        ? new Date(entry.release_date)
        : entry.created_at
          ? new Date(entry.created_at)
          : new Date('1970-01-01'), // Fixed epoch fallback if both missing
      robots_follow: null,
      robots_index: null,
      seo_description: null,
      seo_title: null,
      slug: entry.slug ?? '',
      source: null,
      title: entry.title ?? '',
      tldr: entry.tldr ?? null,
      twitter_card: null,
      updated_at: new Date(entry.updated_at ?? ''),
    };

    return normalizedEntry;
  },
});

export async function getChangelog(): Promise<{
  entries: GetChangelogOverviewReturns['entries'];
  hasMore: boolean;
  limit: number;
  offset: number;
  total: number;
}> {
  // OPTIMIZATION: Use configurable limit instead of hardcoded 1000
  const limit = QUERY_LIMITS.changelog.default;
  const overview = await getChangelogOverview({
    limit,
    offset: 0,
    publishedOnly: true,
  });

  if (!overview) {
    return {
      entries: [],
      hasMore: false,
      limit: 0,
      offset: 0,
      total: 0,
    };
  }

  return {
    entries: overview.entries ?? [],
    hasMore: overview.pagination?.has_more ?? false,
    limit: overview.pagination?.limit ?? 0,
    offset: overview.pagination?.offset ?? 0,
    total: overview.pagination?.total ?? 0,
  };
}

/**
 * Get published changelog slugs for static generation
 *
 * OPTIMIZATION: Uses Prisma directly instead of RPC for better performance.
 * Only fetches slugs needed for generateStaticParams, avoiding unnecessary data processing.
 */
export const getPublishedChangelogSlugs = createDataFunction<number, string[]>({
  logContext: (limit) => ({ limit }),
  methodName: 'getPublishedChangelogSlugs',
  module: 'data/changelog',
  onError: () => [], // Return empty array on error
  operation: 'getPublishedChangelogSlugs',
  serviceKey: 'changelog',
});
