/** Changelog entries loader via get_changelog_overview() and get_changelog_detail() RPCs with edge-layer caching */

import { z } from 'zod';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';
import { Constants } from '@/src/types/database.types';

// Zod schema for changelog entry changes structure (JSONB validation)
const changeItemSchema = z.object({
  content: z.string(),
});

// Build schema dynamically from database enum to ensure consistency
// Use explicit keys to preserve literal types for TypeScript inference
const changesSchema = z
  .object({
    Added: z.array(changeItemSchema).optional(),
    Changed: z.array(changeItemSchema).optional(),
    Fixed: z.array(changeItemSchema).optional(),
    Removed: z.array(changeItemSchema).optional(),
    Deprecated: z.array(changeItemSchema).optional(),
    Security: z.array(changeItemSchema).optional(),
  })
  .refine(
    (data) => {
      // Validate that all keys are valid changelog category enum values
      const validCategories = Constants.public.Enums.changelog_category;
      const dataKeys = Object.keys(data);
      return dataKeys.every((key) =>
        validCategories.includes(key as Database['public']['Enums']['changelog_category'])
      );
    },
    { message: 'Invalid changelog category in changes object' }
  );

// Validated changes type (for runtime use after parsing)
export type ChangelogChanges = z.infer<typeof changesSchema>;

// Helper to safely parse changes JSONB field
export function parseChangelogChanges(changes: unknown): ChangelogChanges {
  try {
    return changesSchema.parse(changes);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to parse changelog changes');
    logger.error('Failed to parse changelog changes', normalized);
    return {}; // Return empty object if parsing fails
  }
}

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

/**
 * Get changelog overview with entries, metadata, and featured entries
 * Optimized single RPC call that replaces get_changelog_entries + get_changelog_metadata
 */
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

  return fetchCachedRpc<
    'get_changelog_overview',
    Database['public']['Functions']['get_changelog_overview']['Returns']
  >(
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
export async function getChangelogEntryBySlug(
  slug: string
): Promise<Database['public']['Tables']['changelog']['Row'] | null> {
  const result = await fetchCachedRpc<
    'get_changelog_detail',
    Database['public']['Functions']['get_changelog_detail']['Returns']
  >(
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

  // Map RPC return to full changelog row structure
  // contributors and keywords are already text[] in database (may be null)
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

/**
 * @deprecated Use getChangelogOverview() instead
 * Get paginated changelog entries (backward compatibility)
 */
export async function getChangelog(): Promise<{
  entries: Database['public']['Functions']['get_changelog_overview']['Returns']['entries'];
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
    entries: overview.entries ?? [],
    total: overview.pagination?.total ?? 0,
    limit: overview.pagination?.limit ?? 0,
    offset: overview.pagination?.offset ?? 0,
    hasMore: overview.pagination?.has_more ?? false,
  };
}

/**
 * Transform changelog entry to ensure contributors and keywords are arrays (never null)
 * Accepts both full changelog row and changelog_overview_entry (subset)
 * Note: contributors and keywords are already text[] in database, but may be null
 */
function normalizeChangelogEntry(
  entry:
    | Database['public']['Tables']['changelog']['Row']
    | Database['public']['CompositeTypes']['changelog_overview_entry']
): Omit<Database['public']['Tables']['changelog']['Row'], 'contributors' | 'keywords'> & {
  contributors: string[];
  keywords: string[];
} {
  // Map changelog_overview_entry to full changelog row structure
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

/**
 * Get all changelog entries (for static generation)
 */
export async function getAllChangelogEntries(): Promise<
  Array<
    Omit<Database['public']['Tables']['changelog']['Row'], 'contributors' | 'keywords'> & {
      contributors: string[];
      keywords: string[];
    }
  >
> {
  const limit = 10000;
  const overview = await getChangelogOverview({
    publishedOnly: false,
    limit,
    offset: 0,
  });

  return (overview.entries ?? []).map(normalizeChangelogEntry);
}

/**
 * Get recent changelog entries
 */
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

/**
 * Get changelog entries by category
 */
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
  const limit = 1000;
  const overview = await getChangelogOverview({
    category,
    publishedOnly: true,
    limit,
    offset: 0,
  });

  return (overview.entries ?? []).map(normalizeChangelogEntry);
}

/**
 * Get featured changelog entries
 */
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

/**
 * @deprecated Use getChangelogOverview().metadata instead
 * Get changelog metadata (backward compatibility)
 */
export async function getChangelogMetadata() {
  const overview = await getChangelogOverview({ limit: 1, offset: 0 });
  // Map to old format for backward compatibility
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
