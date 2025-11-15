/** Changelog entries loader via get_changelog_entries() RPC with edge-layer caching */

import { z } from 'zod';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import type { Tables } from '@/src/types/database.types';
import type { GetChangelogEntriesReturn } from '@/src/types/database-overrides';

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

// Use database type directly - no custom extensions
export type ChangelogEntry = Tables<'changelog'>;

// Validated changes type (for runtime use after parsing)
export type ChangelogChanges = z.infer<typeof changesSchema>;

export type ChangelogCategory =
  | 'Added'
  | 'Changed'
  | 'Deprecated'
  | 'Removed'
  | 'Fixed'
  | 'Security';

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

function createEmptyResult(limit: number, offset = 0): GetChangelogEntriesReturn {
  return {
    entries: [],
    total: 0,
    limit,
    offset,
    hasMore: false,
  };
}

export async function getChangelog(): Promise<GetChangelogEntriesReturn> {
  const limit = 1000;
  return fetchCachedRpc<GetChangelogEntriesReturn>(
    {
      p_published_only: true,
      p_limit: limit,
    },
    {
      rpcName: 'get_changelog_entries',
      tags: [CHANGELOG_TAG],
      ttlKey: CHANGELOG_TTL_KEY,
      keySuffix: 'published-1000',
      fallback: createEmptyResult(limit),
      logMeta: { publishedOnly: true, limit },
    }
  );
}

export async function getAllChangelogEntries(): Promise<ChangelogEntry[]> {
  const limit = 10000;
  const result = await fetchCachedRpc<GetChangelogEntriesReturn>(
    {
      p_published_only: false,
      p_limit: limit,
    },
    {
      rpcName: 'get_changelog_entries',
      tags: [CHANGELOG_TAG],
      ttlKey: CHANGELOG_TTL_KEY,
      keySuffix: 'all',
      fallback: createEmptyResult(limit),
      logMeta: { publishedOnly: false, limit },
    }
  );

  return result.entries || [];
}

export async function getChangelogEntryBySlug(slug: string): Promise<ChangelogEntry | null> {
  return fetchCachedRpc<ChangelogEntry | null>(
    { p_slug: slug },
    {
      rpcName: 'get_changelog_entry_by_slug',
      tags: [CHANGELOG_TAG, `changelog-${slug}`],
      ttlKey: CHANGELOG_DETAIL_TTL_KEY,
      keySuffix: slug,
      fallback: null,
      logMeta: { slug },
    }
  );
}

export async function getRecentChangelogEntries(limit = 5): Promise<ChangelogEntry[]> {
  const result = await fetchCachedRpc<GetChangelogEntriesReturn>(
    {
      p_published_only: true,
      p_limit: limit,
    },
    {
      rpcName: 'get_changelog_entries',
      tags: [CHANGELOG_TAG],
      ttlKey: CHANGELOG_TTL_KEY,
      keySuffix: `recent-${limit}`,
      fallback: createEmptyResult(limit),
      logMeta: { publishedOnly: true, limit, label: 'recent' },
    }
  );

  return result.entries || [];
}

export async function getChangelogEntriesByCategory(category: string): Promise<ChangelogEntry[]> {
  const limit = 1000;
  const result = await fetchCachedRpc<GetChangelogEntriesReturn>(
    {
      p_category: category,
      p_published_only: true,
      p_limit: limit,
    },
    {
      rpcName: 'get_changelog_entries',
      tags: [CHANGELOG_TAG, `changelog-category-${category}`],
      ttlKey: CHANGELOG_TTL_KEY,
      keySuffix: `category-${category}`,
      fallback: createEmptyResult(limit),
      logMeta: { category, publishedOnly: true, limit },
    }
  );

  return result.entries || [];
}

export async function getFeaturedChangelogEntries(limit = 3): Promise<ChangelogEntry[]> {
  const result = await fetchCachedRpc<{ entries: ChangelogEntry[] }>(
    {
      p_published_only: true,
      p_featured_only: true,
      p_limit: limit,
    },
    {
      rpcName: 'get_changelog_entries',
      tags: [CHANGELOG_TAG],
      ttlKey: CHANGELOG_TTL_KEY,
      keySuffix: `featured-${limit}`,
      fallback: { entries: [] },
      logMeta: { featuredOnly: true, limit },
    }
  );

  return result.entries || [];
}

export async function getChangelogMetadata() {
  return fetchCachedRpc<unknown>(
    {},
    {
      rpcName: 'get_changelog_metadata',
      tags: [CHANGELOG_TAG],
      ttlKey: CHANGELOG_TTL_KEY,
      keySuffix: 'metadata',
      fallback: null,
    }
  );
}
