/**
 * Content Highlight Utilities
 *
 * Pure utility functions for content analysis. These functions work with DisplayableContent
 * types and are used for:
 * - Extracting published dates from content items
 * - Determining if content is "new" based on cutoff dates
 * - Identifying top trending items (uses database ordering, no client-side calculations)
 *
 * Architecture:
 * - Pure functions with no side effects
 * - Type-safe with DisplayableContent union type
 * - Defensive null/undefined handling
 * - No dependencies on app-specific code
 * - Database-first: All trending calculations done in database, UI just uses ordering
 *
 * Usage:
 * ```typescript
 * import { getItemPublishedDate, isNewSince, getTrendingSlugs } from '@heyclaude/web-runtime/utils/content-highlights';
 *
 * const publishedDate = getItemPublishedDate(item);
 * const isNew = isNewSince(item, weekStartDate);
 * const trendingSlugs = getTrendingSlugs(items, 3); // Items must be pre-sorted by database
 * ```
 */

import type { DisplayableContent } from '../types/component.types.ts';

/**
 * Parse a date value from various formats
 * Handles Date objects, ISO strings, and invalid values gracefully
 */
function parseDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
}

/**
 * Extract published date from a content item
 *
 * Checks multiple date fields in priority order:
 * 1. date_added
 * 2. published_at
 * 3. created_at
 * 4. updated_at
 *
 * Returns the first valid date found, or null if none exist.
 *
 * @param item - Content item to extract date from
 * @returns Date object or null if no valid date found
 */
export function getItemPublishedDate(item: DisplayableContent): Date | null {
  const candidates: unknown[] = [];

  if ('date_added' in item) candidates.push(item.date_added);
  if ('published_at' in item) candidates.push(item.published_at);
  if ('created_at' in item) candidates.push(item.created_at);
  if ('updated_at' in item) candidates.push(item.updated_at);

  for (const candidate of candidates) {
    const parsed = parseDate(candidate);
    if (parsed) return parsed;
  }

  return null;
}

/**
 * Check if a content item is "new" since a cutoff date
 *
 * @param item - Content item to check
 * @param cutoff - Cutoff date (items published on or after this date are "new")
 * @returns true if item is new, false otherwise
 */
export function isNewSince(item: DisplayableContent, cutoff: Date | null): boolean {
  if (!cutoff) return false;
  const publishedAt = getItemPublishedDate(item);
  return Boolean(publishedAt && publishedAt.getTime() >= cutoff.getTime());
}

/**
 * Get top N trending content slugs
 *
 * Uses database-calculated trending scores. Items from get_homepage_optimized
 * are already ordered by trending_score from the materialized view, so we use
 * position (first N items) as the trending indicator.
 *
 * All trending data comes from the database materialized view with proper
 * time-windowed metrics (views_7d, copies_7d, velocity_7d, etc.).
 *
 * @param items - Array of content items to analyze (pre-sorted by trending_score from database)
 * @param topN - Number of top items to return (default: 3)
 * @returns Set of slugs for top trending items
 */
export function getTrendingSlugs(items: readonly DisplayableContent[], topN = 3): Set<string> {
  // Defensive check: ensure items is not null/undefined before accessing .length
  if (!items?.length || topN <= 0) {
    return new Set();
  }

  // Items are already sorted by database trending_score - use position
  // All data comes from database via data layer, so we can trust the ordering
  return new Set(
    items
      .slice(0, topN)
      .map((item) => {
        const slug = typeof item.slug === 'string' ? item.slug : null;
        return slug;
      })
      .filter((slug): slug is string => slug !== null)
  );
}
