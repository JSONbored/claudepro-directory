/**
 * Changelog Loader - Database-First (zero caching ceremony)
 */

import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/src/types/database.types';

type ChangelogEntryRow = Tables<'changelog_entries'>;

export type ChangelogCategory =
  | 'Added'
  | 'Changed'
  | 'Deprecated'
  | 'Removed'
  | 'Fixed'
  | 'Security';

export interface ChangelogEntry {
  date: string;
  title: string;
  slug: string;
  tldr?: string;
  categories: {
    Added: Array<{ content: string }>;
    Changed: Array<{ content: string }>;
    Deprecated: Array<{ content: string }>;
    Removed: Array<{ content: string }>;
    Fixed: Array<{ content: string }>;
    Security: Array<{ content: string }>;
  };
  content: string;
  rawContent: string;
  description?: string;
  keywords?: string[];
  published: boolean;
  featured: boolean;
  [key: string]: unknown;
}

export interface ChangelogMetadata {
  totalEntries: number;
  latestEntry?: ChangelogEntry;
  dateRange?: {
    earliest: string;
    latest: string;
  };
  categoryCounts: {
    Added: number;
    Changed: number;
    Deprecated: number;
    Removed: number;
    Fixed: number;
    Security: number;
  };
}

export interface ParsedChangelog {
  entries: ChangelogEntry[];
  metadata: ChangelogMetadata;
}

function transformRow(row: ChangelogEntryRow): ChangelogEntry {
  const changes = row.changes as {
    Added?: Array<{ content: string }>;
    Changed?: Array<{ content: string }>;
    Deprecated?: Array<{ content: string }>;
    Removed?: Array<{ content: string }>;
    Fixed?: Array<{ content: string }>;
    Security?: Array<{ content: string }>;
  };

  return {
    date: row.release_date,
    title: row.title,
    slug: row.slug,
    tldr: row.tldr || undefined,
    categories: {
      Added: changes.Added || [],
      Changed: changes.Changed || [],
      Deprecated: changes.Deprecated || [],
      Removed: changes.Removed || [],
      Fixed: changes.Fixed || [],
      Security: changes.Security || [],
    },
    content: row.content,
    rawContent: row.raw_content,
    description: row.description || undefined,
    keywords: row.keywords || undefined,
    published: row.published,
    featured: row.featured,
  };
}

export async function getChangelog(): Promise<ParsedChangelog> {
  try {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('changelog_entries')
      .select('*')
      .eq('published', true)
      .order('release_date', { ascending: false });

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return {
        entries: [],
        metadata: {
          totalEntries: 0,
          latestEntry: undefined,
          dateRange: undefined,
          categoryCounts: {
            Added: 0,
            Changed: 0,
            Deprecated: 0,
            Removed: 0,
            Fixed: 0,
            Security: 0,
          },
        },
      };
    }

    const entries = rows.map(transformRow);

    const categoryCounts = {
      Added: 0,
      Changed: 0,
      Deprecated: 0,
      Removed: 0,
      Fixed: 0,
      Security: 0,
    };

    for (const entry of entries) {
      if (entry.categories.Added.length > 0) categoryCounts.Added++;
      if (entry.categories.Changed.length > 0) categoryCounts.Changed++;
      if (entry.categories.Deprecated.length > 0) categoryCounts.Deprecated++;
      if (entry.categories.Removed.length > 0) categoryCounts.Removed++;
      if (entry.categories.Fixed.length > 0) categoryCounts.Fixed++;
      if (entry.categories.Security.length > 0) categoryCounts.Security++;
    }

    const metadata: ChangelogMetadata = {
      totalEntries: entries.length,
      latestEntry: entries[0],
      dateRange: {
        earliest: entries[entries.length - 1].date,
        latest: entries[0].date,
      },
      categoryCounts,
    };

    return { entries, metadata };
  } catch (error) {
    logger.error(
      'Failed to load full changelog',
      error instanceof Error ? error : new Error(String(error))
    );

    // Return empty changelog as fallback
    return {
      entries: [],
      metadata: {
        totalEntries: 0,
        latestEntry: undefined,
        dateRange: undefined,
        categoryCounts: {
          Added: 0,
          Changed: 0,
          Deprecated: 0,
          Removed: 0,
          Fixed: 0,
          Security: 0,
        },
      },
    };
  }
}

export async function getAllChangelogEntries(): Promise<ChangelogEntry[]> {
  try {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('changelog_entries')
      .select('*')
      .eq('published', true)
      .order('release_date', { ascending: false });

    if (error) throw error;

    return rows ? rows.map(transformRow) : [];
  } catch (error) {
    logger.error(
      'Failed to load changelog entries',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

export async function getChangelogEntryBySlug(slug: string): Promise<ChangelogEntry | undefined> {
  try {
    const supabase = await createClient();

    const { data: row, error } = await supabase
      .from('changelog_entries')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return undefined;
      }
      throw error;
    }

    return row ? transformRow(row) : undefined;
  } catch (error) {
    logger.error(
      `Failed to load changelog entry: ${slug}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return undefined;
  }
}

export async function getRecentChangelogEntries(limit = 5): Promise<ChangelogEntry[]> {
  try {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('changelog_entries')
      .select('*')
      .eq('published', true)
      .order('release_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return rows ? rows.map(transformRow) : [];
  } catch (error) {
    logger.error(
      `Failed to load recent changelog entries (limit: ${limit})`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

export async function getChangelogEntriesByCategory(
  category: 'Added' | 'Changed' | 'Deprecated' | 'Removed' | 'Fixed' | 'Security'
): Promise<ChangelogEntry[]> {
  try {
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('changelog_entries')
      .select('*')
      .eq('published', true)
      .filter('changes', 'cs', `{"${category}": []}`)
      .order('release_date', { ascending: false });

    if (error) throw error;

    const entries = rows ? rows.map(transformRow) : [];
    return entries.filter((entry) => entry.categories[category].length > 0);
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
    const supabase = await createClient();

    const { data: rows, error } = await supabase
      .from('changelog_entries')
      .select('*')
      .eq('published', true)
      .eq('featured', true)
      .order('release_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return rows ? rows.map(transformRow) : [];
  } catch (error) {
    logger.error(
      `Failed to load featured changelog entries (limit: ${limit})`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}
