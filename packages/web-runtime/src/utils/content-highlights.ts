/**
 * Content Highlight Utilities
 *
 * Pure utility functions for content analysis and trending calculations.
 * These functions work with DisplayableContent types and are used for:
 * - Extracting published dates from content items
 * - Determining if content is "new" based on cutoff dates
 * - Calculating trending scores and identifying top trending items
 *
 * Architecture:
 * - Pure functions with no side effects
 * - Type-safe with DisplayableContent union type
 * - Defensive null/undefined handling
 * - No dependencies on app-specific code
 *
 * Usage:
 * ```typescript
 * import { getItemPublishedDate, isNewSince, getTrendingSlugs } from '@heyclaude/web-runtime/utils/content-highlights';
 *
 * const publishedDate = getItemPublishedDate(item);
 * const isNew = isNewSince(item, weekStartDate);
 * const trendingSlugs = getTrendingSlugs(items, 3);
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
 * Calculate trending score for a content item
 *
 * Uses weighted formula:
 * - Views: 50% weight
 * - Copies: 35% weight
 * - Ratings: 15% weight
 *
 * @param item - Content item to score
 * @returns Numeric score (higher = more trending)
 */
function getTrendingScore(item: DisplayableContent): number {
  const views = 'view_count' in item && typeof item.view_count === 'number' ? item.view_count : 0;
  const copies = 'copy_count' in item && typeof item.copy_count === 'number' ? item.copy_count : 0;
  const rating =
    'rating_count' in item && typeof item.rating_count === 'number' ? item.rating_count : 0;

  return views * 0.5 + copies * 0.35 + rating * 0.15;
}

/**
 * Get top N trending content slugs
 *
 * Calculates trending scores for all items, sorts by score,
 * and returns the slugs of the top N items.
 *
 * @param items - Array of content items to analyze
 * @param topN - Number of top items to return (default: 3)
 * @returns Set of slugs for top trending items
 */
export function getTrendingSlugs(items: readonly DisplayableContent[], topN = 3): Set<string> {
  // Defensive check: ensure items is not null/undefined before accessing .length
  if (!items?.length || topN <= 0) {
    return new Set();
  }

  const scored = items
    .map((item) => ({
      slug: typeof item.slug === 'string' ? item.slug : null,
      score: getTrendingScore(item),
    }))
    .filter((entry) => entry.slug && entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);

  return new Set(scored.map((entry) => entry.slug as string));
}
