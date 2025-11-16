/** Changelog entries loader via get_changelog_overview() and get_changelog_detail() RPCs with edge-layer caching */

import { z } from 'zod';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import type {
  ChangelogCategory,
  GetGetChangelogDetailReturn,
  GetGetChangelogOverviewReturn,
  Tables,
} from '@/src/types/database-overrides';

// Zod schema for changelog entry changes structure (JSONB validation)
const changeItemSchema = z.object({
  content: z.string(),
});

const changesSchema = z.object({
  Added: z.array(changeItemSchema).optional(),
  Changed: z.array(changeItemSchema).optional(),
  Fixed: z.array(changeItemSchema).optional(),
  Removed: z.array(changeItemSchema).optional(),
  Deprecated: z.array(changeItemSchema).optional(),
  Security: z.array(changeItemSchema).optional(),
});

// Validated changes type (for runtime use after parsing)
export type ChangelogChanges = z.infer<typeof changesSchema>;

// Re-export from database-overrides.ts for convenience
export type { ChangelogCategory } from '@/src/types/database-overrides';

// Helper to safely parse changes JSONB field
export function parseChangelogChanges(changes: unknown): ChangelogChanges {
  try {
    return changesSchema.parse(changes);
  } catch (error) {
    logger.error(
      'Failed to parse changelog changes',
      error instanceof Error ? error : new Error(String(error))
    );
    return {}; // Return empty object if parsing fails
  }
}

const CHANGELOG_TAG = 'changelog';
const CHANGELOG_TTL_KEY = 'cache.changelog.ttl_seconds';
const CHANGELOG_DETAIL_TTL_KEY = 'cache.changelog_detail.ttl_seconds';

function createEmptyOverview(limit: number, offset = 0): GetGetChangelogOverviewReturn {
  return {
    entries: [],
    metadata: {
      totalEntries: 0,
      dateRange: { earliest: '', latest: '' },
      categoryCounts: {},
    },
    featured: [],
    pagination: {
      total: 0,
      limit,
      offset,
      hasMore: false,
    },
  };
}

/**
 * Get changelog overview with entries, metadata, and featured entries
 * Optimized single RPC call that replaces get_changelog_entries + get_changelog_metadata
 */
export async function getChangelogOverview(
  options: {
    category?: ChangelogCategory;
    publishedOnly?: boolean;
    featuredOnly?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<GetGetChangelogOverviewReturn> {
  const { category, publishedOnly = true, featuredOnly = false, limit = 50, offset = 0 } = options;

  return fetchCachedRpc<'get_changelog_overview', GetGetChangelogOverviewReturn>(
    {
      ...(category ? { p_category: category } : {}),
      p_published_only: publishedOnly,
      p_featured_only: featuredOnly,
      p_limit: limit,
      p_offset: offset,
    },
    {
      rpcName: 'get_changelog_overview',
      tags: [CHANGELOG_TAG, ...(category ? [`changelog-category-${category}`] : [])],
      ttlKey: CHANGELOG_TTL_KEY,
      keySuffix: category
        ? `category-${category}-${limit}-${offset}`
        : `overview-${limit}-${offset}`,
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
}

/**
 * Get changelog entry by slug with categories built from JSONB
 * Optimized single RPC call that replaces get_changelog_entry_by_slug
 */
export async function getChangelogEntryBySlug(slug: string): Promise<Tables<'changelog'> | null> {
  const result = await fetchCachedRpc<'get_changelog_detail', GetGetChangelogDetailReturn>(
    { p_slug: slug },
    {
      rpcName: 'get_changelog_detail',
      tags: [CHANGELOG_TAG, `changelog-${slug}`],
      ttlKey: CHANGELOG_DETAIL_TTL_KEY,
      keySuffix: slug,
      fallback: { entry: null },
      logMeta: { slug },
    }
  );

  if (!result.entry) return null;

  // Map RPC return to full Tables<'changelog'> structure
  return {
    ...result.entry,
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
    content: result.entry.content ?? '',
    changes: result.entry.changes,
  } as unknown as Tables<'changelog'>;
}

/**
 * @deprecated Use getChangelogOverview() instead
 * Get paginated changelog entries (backward compatibility)
 */
export async function getChangelog(): Promise<{
  entries: GetGetChangelogOverviewReturn['entries'];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}> {
  const limit = 1000;
  const overview = await getChangelogOverview({
    publishedOnly: true,
    limit,
    offset: 0,
  });

  // Convert to old format for backward compatibility
  return {
    entries: overview.entries,
    total: overview.pagination.total,
    limit: overview.pagination.limit,
    offset: overview.pagination.offset,
    hasMore: overview.pagination.hasMore,
  };
}

/**
 * Get all changelog entries (for static generation)
 */
export async function getAllChangelogEntries(): Promise<Tables<'changelog'>[]> {
  const limit = 10000;
  const overview = await getChangelogOverview({
    publishedOnly: false,
    limit,
    offset: 0,
  });

  return overview.entries;
}

/**
 * Get recent changelog entries
 */
export async function getRecentChangelogEntries(limit = 5): Promise<Tables<'changelog'>[]> {
  const overview = await getChangelogOverview({
    publishedOnly: true,
    limit,
    offset: 0,
  });

  return overview.entries;
}

/**
 * Get changelog entries by category
 */
export async function getChangelogEntriesByCategory(
  category: ChangelogCategory
): Promise<Tables<'changelog'>[]> {
  const limit = 1000;
  const overview = await getChangelogOverview({
    category,
    publishedOnly: true,
    limit,
    offset: 0,
  });

  return overview.entries;
}

/**
 * Get featured changelog entries
 */
export async function getFeaturedChangelogEntries(limit = 3): Promise<Tables<'changelog'>[]> {
  const overview = await getChangelogOverview({
    publishedOnly: true,
    featuredOnly: true,
    limit,
    offset: 0,
  });

  return overview.featured;
}

/**
 * @deprecated Use getChangelogOverview().metadata instead
 * Get changelog metadata (backward compatibility)
 */
export async function getChangelogMetadata() {
  const overview = await getChangelogOverview({ limit: 1, offset: 0 });
  return overview.metadata;
}
