/** Changelog entries loader via get_changelog_entries() RPC */

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
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

export const getChangelog = cache(async () => {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();
        const { data, error } = await supabase.rpc('get_changelog_entries', {
          p_published_only: true,
          p_limit: 1000,
        });

        if (error) throw error;

        const result = data as GetChangelogEntriesReturn;
        return result;
      } catch (error) {
        logger.error(
          'Failed to load changelog',
          error instanceof Error ? error : new Error(String(error))
        );
        return { entries: [], total: 0, limit: 1000, offset: 0, hasMore: false };
      }
    },
    ['changelog-entries'],
    {
      revalidate: 3600, // 1 hour
      tags: ['changelog'],
    }
  )();
});

export const getAllChangelogEntries = cache(async (): Promise<ChangelogEntry[]> => {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();
        const { data, error } = await supabase.rpc('get_changelog_entries', {
          p_published_only: false,
          p_limit: 10000,
        });

        if (error) throw error;

        const result = data as GetChangelogEntriesReturn;
        return result.entries || [];
      } catch (error) {
        logger.error(
          'Failed to load changelog entries',
          error instanceof Error ? error : new Error(String(error))
        );
        return [];
      }
    },
    ['changelog-entries-all'],
    {
      revalidate: 3600, // 1 hour
      tags: ['changelog'],
    }
  )();
});

export const getChangelogEntryBySlug = cache(
  async (slug: string): Promise<ChangelogEntry | null> => {
    return unstable_cache(
      async () => {
        try {
          const supabase = createAnonClient();
          const { data, error } = await supabase.rpc('get_changelog_entry_by_slug', {
            p_slug: slug,
          });

          if (error) throw error;
          return (data as ChangelogEntry) || null;
        } catch (error) {
          logger.error(
            `Failed to load changelog entry: ${slug}`,
            error instanceof Error ? error : new Error(String(error))
          );
          return null;
        }
      },
      [`changelog-entry-${slug}`],
      {
        revalidate: 3600, // 1 hour
        tags: ['changelog', `changelog-${slug}`],
      }
    )();
  }
);

export const getRecentChangelogEntries = cache(async (limit = 5): Promise<ChangelogEntry[]> => {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();
        const { data, error } = await supabase.rpc('get_changelog_entries', {
          p_published_only: true,
          p_limit: limit,
        });

        if (error) throw error;

        const result = data as GetChangelogEntriesReturn;
        return result.entries || [];
      } catch (error) {
        logger.error(
          `Failed to load recent changelog entries (limit: ${limit})`,
          error instanceof Error ? error : new Error(String(error))
        );
        return [];
      }
    },
    [`changelog-recent-${limit}`],
    {
      revalidate: 3600, // 1 hour
      tags: ['changelog'],
    }
  )();
});

export const getChangelogEntriesByCategory = cache(
  async (category: string): Promise<ChangelogEntry[]> => {
    return unstable_cache(
      async () => {
        try {
          const supabase = createAnonClient();
          const { data, error } = await supabase.rpc('get_changelog_entries', {
            p_category: category,
            p_published_only: true,
            p_limit: 1000,
          });

          if (error) throw error;

          const result = data as GetChangelogEntriesReturn;
          return result.entries || [];
        } catch (error) {
          logger.error(
            `Failed to filter changelog entries by category: ${category}`,
            error instanceof Error ? error : new Error(String(error))
          );
          return [];
        }
      },
      [`changelog-category-${category}`],
      {
        revalidate: 3600, // 1 hour
        tags: ['changelog', `changelog-category-${category}`],
      }
    )();
  }
);

export const getFeaturedChangelogEntries = cache(async (limit = 3): Promise<ChangelogEntry[]> => {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc('get_changelog_entries', {
      p_published_only: true,
      p_featured_only: true,
      p_limit: limit,
    });

    if (error) throw error;

    const result = data as { entries: ChangelogEntry[] };
    return result.entries || [];
  } catch (error) {
    logger.error(
      `Failed to load featured changelog entries (limit: ${limit})`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
});

export const getChangelogMetadata = cache(async () => {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc('get_changelog_metadata');

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error(
      'Failed to load changelog metadata',
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
});
