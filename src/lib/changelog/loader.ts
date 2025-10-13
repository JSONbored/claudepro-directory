/**
 * Changelog Content Loader
 *
 * High-level API for loading changelog entries with Redis caching.
 * Provides a simple interface for pages and components to access changelog data.
 *
 * Architecture:
 * - Redis cache-aside pattern with 1-hour TTL
 * - Falls back to parser on cache miss
 * - Automatic cache invalidation on build
 * - Type-safe with Zod validation
 *
 * Performance:
 * - Cache hit: ~0.1-1ms
 * - Cache miss: ~10-20ms (parser + cache write)
 * - TTL: 3600s (1 hour) - balances freshness and performance
 *
 * Production Standards:
 * - Async/await for all operations
 * - Comprehensive error handling with fallbacks
 * - Proper logging for debugging
 * - Type-safe return values
 */

import { contentCache } from '@/src/lib/cache';
import { logger } from '@/src/lib/logger';
import type { ChangelogEntry, ParsedChangelog } from '@/src/lib/schemas/changelog.schema';
import {
  getAllChangelogEntries as parseAllEntries,
  parseChangelog,
  getChangelogEntryBySlug as parseEntryBySlug,
} from './parser';

/**
 * Cache TTL configuration
 * 1 hour cache - balances freshness (manual changelog updates) with performance
 */
const CHANGELOG_CACHE_TTL = 3600; // 1 hour in seconds

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
        logger.debug('Parsing full CHANGELOG.md (cache miss)');
        return await parseChangelog();
      },
      CHANGELOG_CACHE_TTL
    );
  } catch (error) {
    logger.error(
      'Failed to load full changelog',
      error instanceof Error ? error : new Error(String(error))
    );

    // Fallback: try to parse directly without cache
    try {
      return await parseChangelog();
    } catch (fallbackError) {
      logger.error(
        'Critical: Changelog parser failed',
        fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
      );

      // Return empty changelog as last resort
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
        logger.debug('Parsing changelog entries (cache miss)');
        return await parseAllEntries();
      },
      CHANGELOG_CACHE_TTL
    );
  } catch (error) {
    logger.error(
      'Failed to load changelog entries',
      error instanceof Error ? error : new Error(String(error))
    );

    // Fallback: try to parse directly
    try {
      return await parseAllEntries();
    } catch (fallbackError) {
      logger.error(
        'Critical: Changelog entry parser failed',
        fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
      );
      return [];
    }
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
        logger.debug(`Parsing changelog entry for slug: ${slug} (cache miss)`);
        return await parseEntryBySlug(slug);
      },
      CHANGELOG_CACHE_TTL
    );
  } catch (error) {
    logger.error(
      `Failed to load changelog entry: ${slug}`,
      error instanceof Error ? error : new Error(String(error))
    );

    // Fallback: try to parse directly
    try {
      return await parseEntryBySlug(slug);
    } catch (fallbackError) {
      logger.error(
        `Critical: Changelog entry parser failed for slug: ${slug}`,
        fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
      );
      return undefined;
    }
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
        const allEntries = await parseAllEntries();
        return allEntries.slice(0, limit);
      },
      CHANGELOG_CACHE_TTL
    );
  } catch (error) {
    logger.error(
      `Failed to load recent changelog entries (limit: ${limit})`,
      error instanceof Error ? error : new Error(String(error))
    );

    // Fallback: try to parse directly
    try {
      const allEntries = await parseAllEntries();
      return allEntries.slice(0, limit);
    } catch (fallbackError) {
      logger.error(
        'Critical: Recent changelog entries parser failed',
        fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
      );
      return [];
    }
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
        const allEntries = await parseAllEntries();
        return allEntries.filter((entry) => entry.categories[category].length > 0);
      },
      CHANGELOG_CACHE_TTL
    );
  } catch (error) {
    logger.error(
      `Failed to filter changelog entries by category: ${category}`,
      error instanceof Error ? error : new Error(String(error))
    );

    // Fallback: try to parse and filter directly
    try {
      const allEntries = await parseAllEntries();
      return allEntries.filter((entry) => entry.categories[category].length > 0);
    } catch (fallbackError) {
      logger.error(
        `Critical: Category filter parser failed for: ${category}`,
        fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError))
      );
      return [];
    }
  }
}

/**
 * Invalidate all changelog caches
 *
 * Call this when CHANGELOG.md is updated to force cache refresh.
 * Typically used in build scripts or webhook handlers.
 *
 * @example
 * // In a build script or webhook handler
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
