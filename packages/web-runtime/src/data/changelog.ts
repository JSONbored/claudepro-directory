import 'server-only';
import { ChangelogService } from '@heyclaude/data-layer';
import { type changelog, type changelog_category, type Prisma } from '@heyclaude/data-layer/prisma';
import type { ChangelogOverviewEntry, GetChangelogOverviewReturns } from '@heyclaude/database-types/postgres-types';
import { cacheLife, cacheTag } from 'next/cache';

import { normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';

import { QUERY_LIMITS } from './config/constants.ts';
import './changelog.shared.ts';

// Export shared utils
export * from './changelog.shared.ts';

const CHANGELOG_TAG = 'changelog';

function createEmptyOverview(
  limit: number,
  offset = 0
): GetChangelogOverviewReturns {
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
 * @param options
 * @param options.category
 * @param options.featuredOnly
 * @param options.limit
 * @param options.offset
 * @param options.publishedOnly
 */
export async function getChangelogOverview(
  options: {
    category?: changelog_category;
    featuredOnly?: boolean;
    limit?: number;
    offset?: number;
    publishedOnly?: boolean;
  } = {}
): Promise<GetChangelogOverviewReturns> {
  'use cache';

  const { category, featuredOnly = false, limit = 50, offset = 0, publishedOnly = true } = options;

  // Configure cache - use 'hours' profile for changelog overview (changes hourly)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag(CHANGELOG_TAG);
  if (category) {
    cacheTag(`changelog-category-${category}`);
  }

  const reqLogger = logger.child({
    module: 'data/changelog',
    operation: 'getChangelogOverview',
  });

  try {
    const service = new ChangelogService();
    const result = await service.getChangelogOverview({
      ...(category ? { p_category: category } : {}),
      p_featured_only: featuredOnly,
      p_limit: limit,
      p_offset: offset,
      p_published_only: publishedOnly,
    });

    reqLogger.info(
      {
        ...(category ? { category } : {}),
        entryCount: result.entries?.length ?? 0,
        featuredOnly,
        limit,
        offset,
        publishedOnly,
      },
      'getChangelogOverview: fetched successfully'
    );

    return result;
  } catch (error) {
    const normalized = normalizeError(error, 'getChangelogOverview failed');
    reqLogger.error(
      {
        err: normalized,
        ...(category ? { category } : {}),
        featuredOnly,
        limit,
        offset,
        publishedOnly,
      },
      'getChangelogOverview: failed'
    );
    return createEmptyOverview(limit, offset);
  }
}

/**
 * Get changelog entry by slug
 * Uses 'use cache' to cache changelog entries. This data is public and same for all users.
 * Changelog entries change periodically, so we use the 'hours' cacheLife profile.
 * @param slug
 */
export async function getChangelogEntryBySlug(slug: string): Promise<changelog | null> {
  'use cache';

  // Configure cache - use 'hours' profile for changelog entries (changes every 2 hours)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag(CHANGELOG_TAG);
  cacheTag(`changelog-${slug}`);

  const reqLogger = logger.child({
    module: 'data/changelog',
    operation: 'getChangelogEntryBySlug',
  });

  try {
    const service = new ChangelogService();
    const result = await service.getChangelogDetail({ p_slug: slug });

    if (!result.entry) {
      reqLogger.info({ slug }, 'getChangelogEntryBySlug: entry not found');
      return null;
    }

    const entry = result.entry;
    // Convert RPC return data (string dates) to Prisma types (Date objects)
    // RPC returns: { created_at: string, updated_at: string, release_date: string, ... }
    // Prisma expects: { created_at: Date, updated_at: Date, release_date: Date, ... }
    // Convert RPC return data (string dates) to Prisma types (Date objects)
    // RPC returns: { created_at: string, updated_at: string, release_date: string, ... }
    // Prisma expects: { created_at: Date, updated_at: Date, release_date: Date, ... }
    // Also: contributors and keywords are String[] in Prisma (not nullable)
    // Note: RPC return type (changelog_detail_entry) doesn't have contributors field
    const normalizedEntry: changelog = {
      canonical_url: null,
      changes: (entry.changes ?? {}) as Prisma.JsonValue,
      commit_count: null,
      content: entry.content ?? '',
      contributors: [], // RPC doesn't return contributors, use empty array
      created_at: new Date(entry.created_at ?? ''),
      description: entry.description,
      featured: entry.featured ?? false,
      git_commit_sha: null,
      id: entry.id ?? '',
      json_ld: null,
      keywords: Array.isArray(entry.keywords) ? entry.keywords : [],
      metadata: (entry.metadata ?? null) as Prisma.JsonValue | null,
      og_image: null,
      og_type: null,
      published: entry.published ?? false,
      raw_content: entry.raw_content ?? '',
      release_date: entry.release_date ? new Date(entry.release_date) : new Date(),
      robots_follow: null,
      robots_index: null,
      seo_description: null,
      seo_title: null,
      slug: entry.slug ?? '',
      source: null,
      title: entry.title ?? '',
      tldr: entry.tldr,
      twitter_card: null,
      updated_at: new Date(entry.updated_at ?? ''),
    };

    reqLogger.info(
      { hasEntry: Boolean(normalizedEntry), slug },
      'getChangelogEntryBySlug: fetched successfully'
    );

    return normalizedEntry;
  } catch (error) {
    const normalized = normalizeError(error, 'getChangelogEntryBySlug failed');
    reqLogger.error({ err: normalized, slug }, 'getChangelogEntryBySlug: failed');
    return null;
  }
}

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

  return {
    entries: overview.entries ?? [],
    hasMore: overview.pagination?.has_more ?? false,
    limit: overview.pagination?.limit ?? 0,
    offset: overview.pagination?.offset ?? 0,
    total: overview.pagination?.total ?? 0,
  };
}

function normalizeChangelogEntry(
  entry: changelog | ChangelogOverviewEntry
): Omit<changelog, 'contributors' | 'keywords'> & {
  contributors: string[];
  keywords: string[];
} {
  // Convert RPC return data (string dates) to Prisma types (Date objects) if needed
  // If entry is from RPC (CompositeType), dates are strings; if from Prisma, dates are Date objects
  const created_at =
    entry.created_at instanceof Date
      ? entry.created_at
      : new Date((entry.created_at as string) ?? '');
  const updated_at =
    entry.updated_at instanceof Date
      ? entry.updated_at
      : new Date((entry.updated_at as string) ?? '');
  const release_date =
    entry.release_date instanceof Date
      ? entry.release_date
      : entry.release_date
        ? new Date(entry.release_date)
        : new Date();

  // Handle contributors and keywords - ensure they're arrays (Prisma requires String[], not null)
  // Note: RPC CompositeTypes (changelog_overview_entry) don't have contributors field
  const contributors =
    'contributors' in entry && Array.isArray(entry.contributors) ? entry.contributors : [];
  const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];

  const fullEntry: changelog = {
    ...entry,
    canonical_url: null,
    changes: (entry.changes ?? {}) as Prisma.JsonValue,
    commit_count: null,
    content: entry.content ?? '',
    contributors,
    created_at,
    git_commit_sha: null,
    json_ld: null,
    keywords,
    og_image: null,
    og_type: null,
    release_date,
    robots_follow: null,
    robots_index: null,
    seo_description: 'seo_description' in entry ? entry.seo_description : null,
    seo_title: 'seo_title' in entry ? entry.seo_title : null,
    source: null,
    twitter_card: null,
    updated_at,
  } as changelog;

  return {
    ...fullEntry,
    contributors,
    keywords,
  };
}

export async function getAllChangelogEntries(): Promise<
  Array<
    Omit<changelog, 'contributors' | 'keywords'> & {
      contributors: string[];
      keywords: string[];
    }
  >
> {
  // OPTIMIZATION: Use max limit constant for admin/export scenario (getAllChangelogEntries)
  const limit = QUERY_LIMITS.changelog.max;
  const overview = await getChangelogOverview({
    limit,
    offset: 0,
    publishedOnly: false,
  });

  return (overview.entries ?? []).map((entry) => normalizeChangelogEntry(entry));
}

export async function getRecentChangelogEntries(limit = 5): Promise<
  Array<
    Omit<changelog, 'contributors' | 'keywords'> & {
      contributors: string[];
      keywords: string[];
    }
  >
> {
  const overview = await getChangelogOverview({
    limit,
    offset: 0,
    publishedOnly: true,
  });

  return (overview.entries ?? []).map((entry) => normalizeChangelogEntry(entry));
}

export async function getChangelogEntriesByCategory(category: changelog_category): Promise<
  Array<
    Omit<changelog, 'contributors' | 'keywords'> & {
      contributors: string[];
      keywords: string[];
    }
  >
> {
  // OPTIMIZATION: Use configurable limit instead of hardcoded 1000
  const limit = QUERY_LIMITS.changelog.default;
  const overview = await getChangelogOverview({
    category,
    limit,
    offset: 0,
    publishedOnly: true,
  });

  return (overview.entries ?? []).map((entry) => normalizeChangelogEntry(entry));
}

export async function getFeaturedChangelogEntries(limit = 3): Promise<
  Array<
    Omit<changelog, 'contributors' | 'keywords'> & {
      contributors: string[];
      keywords: string[];
    }
  >
> {
  const overview = await getChangelogOverview({
    featuredOnly: true,
    limit,
    offset: 0,
    publishedOnly: true,
  });

  return (overview.featured ?? []).map((entry) => normalizeChangelogEntry(entry));
}

export async function getChangelogMetadata() {
  const overview = await getChangelogOverview({ limit: 1, offset: 0 });
  const metadata = overview.metadata;
  if (!metadata) {
    return {
      categoryCounts: {},
      dateRange: { earliest: '', latest: '' },
      totalEntries: 0,
    };
  }
  const categoryCounts =
    metadata.category_counts == null ? {} : (metadata.category_counts as Record<string, number>);

  return {
    categoryCounts,
    dateRange: {
      earliest: metadata.date_range?.earliest ?? '',
      latest: metadata.date_range?.latest ?? '',
    },
    totalEntries: metadata.total_entries ?? 0,
  };
}
