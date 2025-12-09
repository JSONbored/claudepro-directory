import 'server-only';
import { ChangelogService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';

import { logger } from '../logger.ts';

import { QUERY_LIMITS } from './config/constants.ts';
import './changelog.shared.ts';

// Export shared utils
export * from './changelog.shared.ts';

const CHANGELOG_TAG = 'changelog';

function createEmptyOverview(
  limit: number,
  offset = 0
): Database['public']['Functions']['get_changelog_overview']['Returns'] {
  return {
    entries: [],
    metadata: {
      total_entries: 0,
      date_range: { earliest: '', latest: '' },
      category_counts: {},
    },
    featured: [],
    pagination: {
      total: 0,
      limit,
      offset,
      has_more: false,
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
    category?: Database['public']['Enums']['changelog_category'];
    featuredOnly?: boolean;
    limit?: number;
    offset?: number;
    publishedOnly?: boolean;
  } = {}
): Promise<Database['public']['Functions']['get_changelog_overview']['Returns']> {
  'use cache';

  const { category, publishedOnly = true, featuredOnly = false, limit = 50, offset = 0 } = options;

  const { isBuildTime } = await import('../build-time.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'hours' profile for changelog overview (changes hourly)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag(CHANGELOG_TAG);
  if (category) {
    cacheTag(`changelog-category-${category}`);
  }

  const reqLogger = logger.child({
    operation: 'getChangelogOverview',
    module: 'data/changelog',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new ChangelogService(client).getChangelogOverview({
      ...(category ? { p_category: category } : {}),
      p_published_only: publishedOnly,
      p_featured_only: featuredOnly,
      p_limit: limit,
      p_offset: offset,
    });

    reqLogger.info(
      {
        ...(category ? { category } : {}),
        publishedOnly,
        featuredOnly,
        limit,
        offset,
        entryCount: result.entries?.length ?? 0,
      },
      'getChangelogOverview: fetched successfully'
    );

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error(
      {
        err: errorForLogging,
        ...(category ? { category } : {}),
        publishedOnly,
        featuredOnly,
        limit,
        offset,
      },
      'getChangelogOverview: failed'
    );
    return createEmptyOverview(limit, offset);
  }
}

/**
 * Get changelog entry by slug
 * Uses 'use cache' to cache changelog entries. This data is public and same for all users.
 */
/**
 * Get changelog entry by slug
 * Uses 'use cache' to cache changelog entries. This data is public and same for all users.
 * Changelog entries change periodically, so we use the 'hours' cacheLife profile.
 * @param slug
 */
export async function getChangelogEntryBySlug(
  slug: string
): Promise<Database['public']['Tables']['changelog']['Row'] | null> {
  'use cache';

  const { isBuildTime } = await import('../build-time.ts');
  const { createSupabaseAnonClient } = await import('../supabase/server-anon.ts');

  // Configure cache - use 'hours' profile for changelog entries (changes every 2 hours)
  cacheLife('hours'); // 1hr stale, 15min revalidate, 1 day expire
  cacheTag(CHANGELOG_TAG);
  cacheTag(`changelog-${slug}`);

  const reqLogger = logger.child({
    operation: 'getChangelogEntryBySlug',
    module: 'data/changelog',
  });

  try {
    // Use admin client during build for better performance, anon client at runtime
    let client;
    if (isBuildTime()) {
      const { createSupabaseAdminClient } = await import('../supabase/admin.ts');
      client = createSupabaseAdminClient();
    } else {
      client = createSupabaseAnonClient();
    }

    const result = await new ChangelogService(client).getChangelogDetail({ p_slug: slug });

    if (!result.entry) {
      reqLogger.info({ slug }, 'getChangelogEntryBySlug: entry not found');
      return null;
    }

    const entry = result.entry;
    const normalizedEntry = {
      id: entry.id ?? '',
      slug: entry.slug ?? '',
      title: entry.title ?? '',
      tldr: entry.tldr,
      description: entry.description,
      content: entry.content ?? '',
      raw_content: entry.raw_content ?? '',
      release_date: entry.release_date ?? '',
      featured: entry.featured ?? false,
      published: entry.published ?? false,
      keywords: entry.keywords,
      metadata: entry.metadata,
      changes: entry.changes ?? {},
      created_at: entry.created_at ?? '',
      updated_at: entry.updated_at ?? '',
      canonical_url: null,
      commit_count: null,
      contributors: null,
      git_commit_sha: null,
      json_ld: null,
      og_image: null,
      og_type: null,
      robots_follow: null,
      robots_index: null,
      source: null,
      twitter_card: null,
    } as Database['public']['Tables']['changelog']['Row'];

    reqLogger.info(
      { slug, hasEntry: Boolean(normalizedEntry) },
      'getChangelogEntryBySlug: fetched successfully'
    );

    return normalizedEntry;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error({ err: errorForLogging, slug }, 'getChangelogEntryBySlug: failed');
    return null;
  }
}

export async function getChangelog(): Promise<{
  entries: Database['public']['Functions']['get_changelog_overview']['Returns']['entries'];
  hasMore: boolean;
  limit: number;
  offset: number;
  total: number;
}> {
  // OPTIMIZATION: Use configurable limit instead of hardcoded 1000
  const limit = QUERY_LIMITS.changelog.default;
  const overview = await getChangelogOverview({
    publishedOnly: true,
    limit,
    offset: 0,
  });

  return {
    entries: overview.entries ?? [],
    total: overview.pagination?.total ?? 0,
    limit: overview.pagination?.limit ?? 0,
    offset: overview.pagination?.offset ?? 0,
    hasMore: overview.pagination?.has_more ?? false,
  };
}

function normalizeChangelogEntry(
  entry:
    | Database['public']['CompositeTypes']['changelog_overview_entry']
    | Database['public']['Tables']['changelog']['Row']
): Omit<Database['public']['Tables']['changelog']['Row'], 'contributors' | 'keywords'> & {
  contributors: string[];
  keywords: string[];
} {
  const fullEntry: Database['public']['Tables']['changelog']['Row'] = {
    ...entry,
    canonical_url: null,
    commit_count: null,
    contributors: null,
    git_commit_sha: null,
    json_ld: null,
    og_image: null,
    og_type: null,
    robots_follow: null,
    robots_index: null,
    source: null,
    twitter_card: null,
    content: entry.content ?? '',
    changes: entry.changes ?? {},
    created_at: entry.created_at ?? '',
    updated_at: entry.updated_at ?? '',
  } as Database['public']['Tables']['changelog']['Row'];

  return {
    ...fullEntry,
    contributors: Array.isArray(fullEntry.contributors) ? fullEntry.contributors : [],
    keywords: Array.isArray(fullEntry.keywords) ? fullEntry.keywords : [],
  };
}

export async function getAllChangelogEntries(): Promise<
  Array<
    Omit<Database['public']['Tables']['changelog']['Row'], 'contributors' | 'keywords'> & {
      contributors: string[];
      keywords: string[];
    }
  >
> {
  // OPTIMIZATION: Use max limit constant for admin/export scenario (getAllChangelogEntries)
  const limit = QUERY_LIMITS.changelog.max;
  const overview = await getChangelogOverview({
    publishedOnly: false,
    limit,
    offset: 0,
  });

  return (overview.entries ?? []).map((entry) => normalizeChangelogEntry(entry));
}

export async function getRecentChangelogEntries(limit = 5): Promise<
  Array<
    Omit<Database['public']['Tables']['changelog']['Row'], 'contributors' | 'keywords'> & {
      contributors: string[];
      keywords: string[];
    }
  >
> {
  const overview = await getChangelogOverview({
    publishedOnly: true,
    limit,
    offset: 0,
  });

  return (overview.entries ?? []).map((entry) => normalizeChangelogEntry(entry));
}

export async function getChangelogEntriesByCategory(
  category: Database['public']['Enums']['changelog_category']
): Promise<
  Array<
    Omit<Database['public']['Tables']['changelog']['Row'], 'contributors' | 'keywords'> & {
      contributors: string[];
      keywords: string[];
    }
  >
> {
  // OPTIMIZATION: Use configurable limit instead of hardcoded 1000
  const limit = QUERY_LIMITS.changelog.default;
  const overview = await getChangelogOverview({
    category,
    publishedOnly: true,
    limit,
    offset: 0,
  });

  return (overview.entries ?? []).map((entry) => normalizeChangelogEntry(entry));
}

export async function getFeaturedChangelogEntries(limit = 3): Promise<
  Array<
    Omit<Database['public']['Tables']['changelog']['Row'], 'contributors' | 'keywords'> & {
      contributors: string[];
      keywords: string[];
    }
  >
> {
  const overview = await getChangelogOverview({
    publishedOnly: true,
    featuredOnly: true,
    limit,
    offset: 0,
  });

  return (overview.featured ?? []).map((entry) => normalizeChangelogEntry(entry));
}

export async function getChangelogMetadata() {
  const overview = await getChangelogOverview({ limit: 1, offset: 0 });
  const metadata = overview.metadata;
  if (!metadata) {
    return {
      totalEntries: 0,
      dateRange: { earliest: '', latest: '' },
      categoryCounts: {},
    };
  }
  const categoryCounts =
    metadata.category_counts == null ? {} : (metadata.category_counts as Record<string, number>);

  return {
    totalEntries: metadata.total_entries ?? 0,
    dateRange: {
      earliest: metadata.date_range?.earliest ?? '',
      latest: metadata.date_range?.latest ?? '',
    },
    categoryCounts,
  };
}
