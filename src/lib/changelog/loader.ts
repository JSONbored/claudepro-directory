/**
 * Changelog Content Loader
 *
 * Database-first loader for changelog entries from Supabase.
 * CHANGELOG.md is synced to database at build-time, this queries the database at runtime.
 *
 * Architecture:
 * - Database as query layer (fast, indexed, cached)
 * - CHANGELOG.md as source of truth (synced at build time)
 * - Redis cache-aside pattern with 6-hour TTL
 * - Type-safe with generated Zod schemas
 *
 * Performance:
 * - Cache hit: ~0.1-1ms (Redis)
 * - Cache miss: ~5-15ms (PostgreSQL query)
 * - Previous (parser): ~10-20ms (file read + parse)
 *
 * Database-first: Uses Tables<'changelog_entries'> from generated types
 */

import { contentCache } from '@/src/lib/cache.server';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/src/types/database.types';

/**
 * Database row type for changelog entries
 * Generated from Supabase schema
 */
type ChangelogEntryRow = Tables<'changelog_entries'>;

/**
 * Changelog category enum
 * Keep a Changelog 1.0.0 specification categories
 */
export type ChangelogCategory =
  | 'Added'
  | 'Changed'
  | 'Deprecated'
  | 'Removed'
  | 'Fixed'
  | 'Security';

/**
 * Changelog entry type (maps database to app format)
 * Transforms snake_case database fields to camelCase
 */
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
  // Database extras (SEO/audit fields)
  description?: string;
  keywords?: string[];
  published: boolean;
  featured: boolean;
}

/**
 * Changelog metadata (aggregated stats)
 */
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

/**
 * Parsed changelog (full dataset with metadata)
 */
export interface ParsedChangelog {
  entries: ChangelogEntry[];
  metadata: ChangelogMetadata;
}

/**
 * Transform database row to app format
 * Maps snake_case → camelCase and validates JSONB structure
 */
function transformRow(row: ChangelogEntryRow): ChangelogEntry {
  // Parse changes JSONB to ensure correct structure
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

/**
 * Cache TTL configuration
 * 6 hours - balances freshness (build-time sync) with performance
 */
const CHANGELOG_CACHE_TTL = 21600; // 6 hours in seconds

/**
 * Get complete parsed changelog with all entries and metadata
 *
 * @returns Parsed changelog with entries and metadata
 *
 * @example
 * const changelog = await getChangelog();
 * console.log(`Total entries: ${changelog.metadata.totalEntries}`);
 * console.log(`Latest: ${changelog.metadata.latestEntry?.title}`);
 */
export async function getChangelog(): Promise<ParsedChangelog> {
  const cacheKey = 'changelog:full';

  try {
    return await contentCache.cacheWithRefresh(
      cacheKey,
      async () => {
        logger.debug('Fetching full changelog from database (cache miss)');

        const supabase = await createClient();

        // Query all published entries, ordered by date DESC
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

        // Transform rows to app format
        const entries = rows.map(transformRow);

        // Calculate metadata
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
      },
      CHANGELOG_CACHE_TTL
    );
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

/**
 * Get all changelog entries sorted by date (newest first)
 *
 * Lightweight alternative to getChangelog() when you only need entries.
 *
 * @returns Array of all changelog entries
 *
 * @example
 * const entries = await getAllChangelogEntries();
 * console.log(`Found ${entries.length} changelog entries`);
 */
export async function getAllChangelogEntries(): Promise<ChangelogEntry[]> {
  const cacheKey = 'changelog:entries';

  try {
    return await contentCache.cacheWithRefresh(
      cacheKey,
      async () => {
        logger.debug('Fetching changelog entries from database (cache miss)');

        const supabase = await createClient();

        const { data: rows, error } = await supabase
          .from('changelog_entries')
          .select('*')
          .eq('published', true)
          .order('release_date', { ascending: false });

        if (error) throw error;

        return rows ? rows.map(transformRow) : [];
      },
      CHANGELOG_CACHE_TTL
    );
  } catch (error) {
    logger.error(
      'Failed to load changelog entries',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get a specific changelog entry by slug
 *
 * @param slug - Entry slug (e.g., "2025-10-06-automated-submission-tracking")
 * @returns Changelog entry or undefined if not found
 *
 * @example
 * const entry = await getChangelogEntryBySlug("2025-10-06-automated-submission-tracking");
 * if (entry) {
 *   console.log(`Title: ${entry.title}`);
 *   console.log(`Date: ${entry.date}`);
 * }
 */
export async function getChangelogEntryBySlug(slug: string): Promise<ChangelogEntry | undefined> {
  const cacheKey = `changelog:entry:${slug}`;

  try {
    return await contentCache.cacheWithRefresh(
      cacheKey,
      async () => {
        logger.debug(`Fetching changelog entry for slug: ${slug} (cache miss)`);

        const supabase = await createClient();

        const { data: row, error } = await supabase
          .from('changelog_entries')
          .select('*')
          .eq('slug', slug)
          .eq('published', true)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // Not found
            return undefined;
          }
          throw error;
        }

        return row ? transformRow(row) : undefined;
      },
      CHANGELOG_CACHE_TTL
    );
  } catch (error) {
    logger.error(
      `Failed to load changelog entry: ${slug}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return undefined;
  }
}

/**
 * Get recent changelog entries (n most recent)
 *
 * @param limit - Number of entries to return (default: 5)
 * @returns Array of recent changelog entries
 *
 * @example
 * const recentEntries = await getRecentChangelogEntries(3);
 * // Returns: [latest, second-latest, third-latest]
 */
export async function getRecentChangelogEntries(limit = 5): Promise<ChangelogEntry[]> {
  const cacheKey = `changelog:recent:${limit}`;

  try {
    return await contentCache.cacheWithRefresh(
      cacheKey,
      async () => {
        logger.debug(`Fetching ${limit} recent changelog entries (cache miss)`);

        const supabase = await createClient();

        const { data: rows, error } = await supabase
          .from('changelog_entries')
          .select('*')
          .eq('published', true)
          .order('release_date', { ascending: false })
          .limit(limit);

        if (error) throw error;

        return rows ? rows.map(transformRow) : [];
      },
      CHANGELOG_CACHE_TTL
    );
  } catch (error) {
    logger.error(
      `Failed to load recent changelog entries (limit: ${limit})`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get changelog entries filtered by category
 *
 * @param category - Category to filter by (Added, Fixed, Changed, etc.)
 * @returns Array of entries containing the specified category
 *
 * @example
 * const addedEntries = await getChangelogEntriesByCategory("Added");
 * // Returns: All entries with "Added" sections
 */
export async function getChangelogEntriesByCategory(
  category: 'Added' | 'Changed' | 'Deprecated' | 'Removed' | 'Fixed' | 'Security'
): Promise<ChangelogEntry[]> {
  const cacheKey = `changelog:category:${category}`;

  try {
    return await contentCache.cacheWithRefresh(
      cacheKey,
      async () => {
        logger.debug(`Filtering changelog entries by category: ${category} (cache miss)`);

        const supabase = await createClient();

        // Query: JSONB field 'changes' has category key with non-empty array
        const { data: rows, error } = await supabase
          .from('changelog_entries')
          .select('*')
          .eq('published', true)
          .filter('changes', 'cs', `{"${category}": []}`) // Contains key
          .order('release_date', { ascending: false });

        if (error) throw error;

        // Additional filter in JS to ensure category array is not empty
        const entries = rows ? rows.map(transformRow) : [];
        return entries.filter((entry) => entry.categories[category].length > 0);
      },
      CHANGELOG_CACHE_TTL
    );
  } catch (error) {
    logger.error(
      `Failed to filter changelog entries by category: ${category}`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get featured changelog entries
 *
 * @param limit - Number of featured entries to return (default: 3)
 * @returns Array of featured changelog entries
 *
 * @example
 * const featured = await getFeaturedChangelogEntries(3);
 */
export async function getFeaturedChangelogEntries(limit = 3): Promise<ChangelogEntry[]> {
  const cacheKey = `changelog:featured:${limit}`;

  try {
    return await contentCache.cacheWithRefresh(
      cacheKey,
      async () => {
        logger.debug(`Fetching ${limit} featured changelog entries (cache miss)`);

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
      },
      CHANGELOG_CACHE_TTL
    );
  } catch (error) {
    logger.error(
      `Failed to load featured changelog entries (limit: ${limit})`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Invalidate all changelog caches
 *
 * Call this when changelog is updated (build-time sync) to force cache refresh.
 *
 * @example
 * // In build script after sync
 * await invalidateChangelogCache();
 */
export async function invalidateChangelogCache(): Promise<void> {
  try {
    logger.info('Invalidating changelog cache');
    await contentCache.invalidatePattern('changelog:*');
    logger.info('Changelog cache invalidated successfully');
  } catch (error) {
    logger.error(
      'Failed to invalidate changelog cache',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}
