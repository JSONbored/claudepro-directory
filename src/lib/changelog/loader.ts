/** Changelog entries loader via get_changelog_entries() RPC with edge-layer caching */

import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
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
export type ChangelogEntry = Tables<'changelog_entries'>;

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

export async function getChangelog(): Promise<GetChangelogEntriesReturn> {
  try {
    const data = await cachedRPCWithDedupe<GetChangelogEntriesReturn>(
      'get_changelog_entries',
      {
        p_published_only: true,
        p_limit: 1000,
      },
      {
        tags: ['changelog'],
        ttlConfigKey: 'cache.changelog_list.ttl_seconds',
        keySuffix: 'published-1000',
      }
    );

    return (data || {
      entries: [],
      total: 0,
      limit: 1000,
      offset: 0,
      hasMore: false,
    }) as GetChangelogEntriesReturn;
  } catch (error) {
    logger.error(
      'Failed to load changelog',
      error instanceof Error ? error : new Error(String(error))
    );
    return { entries: [], total: 0, limit: 1000, offset: 0, hasMore: false };
  }
}

export async function getAllChangelogEntries(): Promise<ChangelogEntry[]> {
  try {
    const data = await cachedRPCWithDedupe<GetChangelogEntriesReturn>(
      'get_changelog_entries',
      {
        p_published_only: false,
        p_limit: 10000,
      },
      {
        tags: ['changelog'],
        ttlConfigKey: 'cache.changelog_list.ttl_seconds',
        keySuffix: 'all',
      }
    );

    const result = data as GetChangelogEntriesReturn;
    return result.entries || [];
  } catch (error) {
    logger.error(
      'Failed to load changelog entries',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

export async function getChangelogEntryBySlug(slug: string): Promise<ChangelogEntry | null> {
  try {
    const data = await cachedRPCWithDedupe<ChangelogEntry>(
      'get_changelog_entry_by_slug',
      { p_slug: slug },
      {
        tags: ['changelog', `changelog-${slug}`],
        ttlConfigKey: 'cache.changelog_detail.ttl_seconds',
        keySuffix: slug,
      }
    );

    return (data as ChangelogEntry) || null;
  } catch (error) {
    logger.error(
      `Failed to load changelog entry: ${slug}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

export async function getRecentChangelogEntries(limit = 5): Promise<ChangelogEntry[]> {
  try {
    const data = await cachedRPCWithDedupe<GetChangelogEntriesReturn>(
      'get_changelog_entries',
      {
        p_published_only: true,
        p_limit: limit,
      },
      {
        tags: ['changelog'],
        ttlConfigKey: 'cache.changelog_list.ttl_seconds',
        keySuffix: `recent-${limit}`,
      }
    );

    const result = data as GetChangelogEntriesReturn;
    return result.entries || [];
  } catch (error) {
    logger.error(
      `Failed to load recent changelog entries (limit: ${limit})`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

export async function getChangelogEntriesByCategory(category: string): Promise<ChangelogEntry[]> {
  try {
    const data = await cachedRPCWithDedupe<GetChangelogEntriesReturn>(
      'get_changelog_entries',
      {
        p_category: category,
        p_published_only: true,
        p_limit: 1000,
      },
      {
        tags: ['changelog', `changelog-category-${category}`],
        ttlConfigKey: 'cache.changelog_list.ttl_seconds',
        keySuffix: `category-${category}`,
      }
    );

    const result = data as GetChangelogEntriesReturn;
    return result.entries || [];
  } catch (error) {
    logger.error(
      `Failed to filter changelog entries by category: ${category}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

export async function getFeaturedChangelogEntries(limit = 3): Promise<ChangelogEntry[]> {
  try {
    const data = await cachedRPCWithDedupe<{ entries: ChangelogEntry[] }>(
      'get_changelog_entries',
      {
        p_published_only: true,
        p_featured_only: true,
        p_limit: limit,
      },
      {
        tags: ['changelog'],
        ttlConfigKey: 'cache.changelog_list.ttl_seconds',
        keySuffix: `featured-${limit}`,
      }
    );

    const result = data as { entries: ChangelogEntry[] };
    return result.entries || [];
  } catch (error) {
    logger.error(
      `Failed to load featured changelog entries (limit: ${limit})`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

export async function getChangelogMetadata() {
  try {
    const data = await cachedRPCWithDedupe<unknown>(
      'get_changelog_metadata',
      {},
      {
        tags: ['changelog'],
        ttlConfigKey: 'cache.changelog_list.ttl_seconds',
        keySuffix: 'metadata',
      }
    );

    return data;
  } catch (error) {
    logger.error(
      'Failed to load changelog metadata',
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}
