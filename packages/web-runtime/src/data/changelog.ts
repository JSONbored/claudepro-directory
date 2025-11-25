import 'server-only';

import type { Database } from '@heyclaude/database-types';
import { fetchCached } from '../cache/fetch-cached.ts';
import { ChangelogService } from '@heyclaude/data-layer';
import { QUERY_LIMITS } from './config/constants.ts';
import './changelog.shared.ts';

// Export shared utils
export * from './changelog.shared.ts';

const CHANGELOG_TAG = 'changelog';
const CHANGELOG_TTL_KEY = 'cache.changelog.ttl_seconds';
const CHANGELOG_DETAIL_TTL_KEY = 'cache.changelog_detail.ttl_seconds';

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

export async function getChangelogOverview(
  options: {
    category?: Database['public']['Enums']['changelog_category'];
    publishedOnly?: boolean;
    featuredOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Database['public']['Functions']['get_changelog_overview']['Returns']> {
  const { category, publishedOnly = true, featuredOnly = false, limit = 50, offset = 0 } = options;

  const result = await fetchCached(
    (client) => new ChangelogService(client).getChangelogOverview({
        ...(category ? { p_category: category } : {}),
        p_published_only: publishedOnly,
        p_featured_only: featuredOnly,
        p_limit: limit,
        p_offset: offset
    }),
    {
      keyParts: category ? ['changelog', category, limit, offset] : ['changelog', 'overview', limit, offset],
      tags: [CHANGELOG_TAG, ...(category ? [`changelog-category-${category}`] : [])],
      ttlKey: CHANGELOG_TTL_KEY,
      fallback: createEmptyOverview(limit, offset),
      logMeta: {
        ...(category ? { category } : {}),
        publishedOnly,
        featuredOnly,
        limit,
        offset,
      },
    }
  );
  
  return result ?? createEmptyOverview(limit, offset);
}

export async function getChangelogEntryBySlug(
  slug: string
): Promise<Database['public']['Tables']['changelog']['Row'] | null> {
  const result = await fetchCached(
    (client) => new ChangelogService(client).getChangelogDetail({ p_slug: slug }),
    {
      keyParts: ['changelog-detail', slug],
      tags: [CHANGELOG_TAG, `changelog-${slug}`],
      ttlKey: CHANGELOG_DETAIL_TTL_KEY,
      fallback: { entry: null },
      logMeta: { slug },
    }
  );

  if (!result.entry) return null;

  const entry = result.entry;
  return {
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
}

export async function getChangelog(): Promise<{
  entries: Database['public']['Functions']['get_changelog_overview']['Returns']['entries'];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
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
    | Database['public']['Tables']['changelog']['Row']
    | Database['public']['CompositeTypes']['changelog_overview_entry']
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

  return (overview.entries ?? []).map(normalizeChangelogEntry);
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

  return (overview.entries ?? []).map(normalizeChangelogEntry);
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

  return (overview.entries ?? []).map(normalizeChangelogEntry);
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

  return (overview.featured ?? []).map(normalizeChangelogEntry);
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
  return {
    totalEntries: metadata.total_entries ?? 0,
    dateRange: {
      earliest: metadata.date_range?.earliest ?? '',
      latest: metadata.date_range?.latest ?? '',
    },
    categoryCounts: (metadata.category_counts as Record<string, number>) ?? {},
  };
}
