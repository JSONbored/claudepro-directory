/**
 * Changelog Utilities - URL generation and category filtering for changelog entries
 *
 * Note: Date formatting functions have been consolidated to use `formatDate()` and `formatRelativeDate()`
 * from `@heyclaude/web-runtime/data` for consistency and to prevent hydration mismatches.
 */

import type { changelog_category } from '../types/client-safe-enums.ts';
import { formatDate, formatRelativeDate } from '../data.ts';
import { APP_CONFIG } from '../data/config/constants.ts';

/**
 * Format a changelog date using the long format (e.g., "January 15, 2024").
 *
 * Uses the consolidated `formatDate()` function from `@heyclaude/web-runtime/data`
 * which provides deterministic UTC-based formatting to prevent hydration mismatches.
 *
 * @param isoDate - Date string or Date object to format
 * @returns Formatted date string in long format (e.g., "January 15, 2024")
 *
 * @example
 * ```ts
 * formatChangelogDate('2024-01-15')
 * // Returns: "January 15, 2024"
 * ```
 */
/**
 * Format a changelog date using the long format (e.g., "January 15, 2024").
 *
 * Uses the consolidated `formatDate()` function from `@heyclaude/web-runtime/data`
 * which provides deterministic UTC-based formatting to prevent hydration mismatches.
 *
 * @param isoDate - Date string or Date object to format
 * @returns Formatted date string in long format (e.g., "January 15, 2024")
 *
 * @example
 * ```ts
 * formatChangelogDate('2024-01-15')
 * // Returns: "January 15, 2024"
 * ```
 */
export function formatChangelogDate(isoDate: string | Date): string {
  return formatDate(isoDate, 'long');
}

/**
 * Format a changelog date using the short format (e.g., "Jan 15, 2024").
 *
 * Uses the consolidated `formatDate()` function from `@heyclaude/web-runtime/data`
 * which provides deterministic UTC-based formatting to prevent hydration mismatches.
 *
 * @param isoDate - Date string or Date object to format
 * @returns Formatted date string in short format (e.g., "Jan 15, 2024")
 *
 * @example
 * ```ts
 * formatChangelogDateShort('2024-01-15')
 * // Returns: "Jan 15, 2024"
 * ```
 */
export function formatChangelogDateShort(isoDate: string | Date): string {
  return formatDate(isoDate, 'short');
}

/**
 * Format a changelog date as ISO 8601 string (e.g., "2024-01-15").
 *
 * Uses the consolidated `formatDate()` function from `@heyclaude/web-runtime/data`
 * which provides deterministic UTC-based formatting to prevent hydration mismatches.
 *
 * @param isoDate - Date string or Date object to format
 * @returns ISO 8601 date string (e.g., "2024-01-15")
 *
 * @example
 * ```ts
 * formatChangelogDateISO8601(new Date('2024-01-15'))
 * // Returns: "2024-01-15"
 * ```
 */
export function formatChangelogDateISO8601(isoDate: string | Date): string {
  return formatDate(isoDate, 'iso');
}

/**
 * Get relative time string for changelog entries (e.g., "2 days ago", "Today").
 *
 * Uses the consolidated `formatRelativeDate()` function from `@heyclaude/web-runtime/data`
 * with 'simple' style for changelog-specific formatting.
 *
 * @param isoDate - ISO date string to format
 * @returns Relative time string (e.g., "Today", "Yesterday", "2 days ago", "3 weeks ago")
 *
 * @example
 * ```ts
 * getRelativeTime('2024-01-13T00:00:00Z')
 * // Returns: "2 days ago" (if today is 2024-01-15)
 * ```
 */
export function getRelativeTime(isoDate: string): string {
  return formatRelativeDate(isoDate, { style: 'simple' });
}

/**
 * Generate the full URL for a changelog entry.
 *
 * @param slug - Changelog entry slug identifier
 * @returns Full URL to the changelog entry (e.g., "https://example.com/changelog/my-feature")
 *
 * @example
 * ```ts
 * getChangelogUrl('my-feature')
 * // Returns: "https://example.com/changelog/my-feature"
 * ```
 */
export function getChangelogUrl(slug: string): string {
  return `${APP_CONFIG.url}/changelog/${slug}`;
}

/**
 * Generate the path (relative URL) for a changelog entry.
 *
 * @param slug - Changelog entry slug identifier
 * @returns Relative path to the changelog entry (e.g., "/changelog/my-feature")
 *
 * @example
 * ```ts
 * getChangelogPath('my-feature')
 * // Returns: "/changelog/my-feature"
 * ```
 */
export function getChangelogPath(slug: string): string {
  return `/changelog/${slug}`;
}

/**
 * Extract non-empty changelog categories from a changes object.
 *
 * Filters out empty category arrays and returns only categories that have entries.
 * Used to display category badges only for categories that have changes.
 *
 * @param categories - Changes object with category arrays (e.g., { Added: [...], Changed: [...] })
 * @returns Array of changelog category names that have non-empty arrays
 *
 * @example
 * ```ts
 * getNonEmptyCategories({ Added: ['Feature 1'], Changed: [], Fixed: ['Bug 1'] })
 * // Returns: ['Added', 'Fixed']
 * ```
 */
export function getNonEmptyCategories(categories: unknown): changelog_category[] {
  const nonEmpty: changelog_category[] = [];

  const cats = categories as Record<string, unknown>;
  if (!cats) return nonEmpty;

  // Return database category names directly (Added, Changed, Fixed, etc.)
  if (Array.isArray(cats['Added']) && cats['Added'].length > 0) nonEmpty.push('Added');
  if (Array.isArray(cats['Changed']) && cats['Changed'].length > 0) nonEmpty.push('Changed');
  if (Array.isArray(cats['Deprecated']) && cats['Deprecated'].length > 0)
    nonEmpty.push('Deprecated');
  if (Array.isArray(cats['Removed']) && cats['Removed'].length > 0) nonEmpty.push('Removed');
  if (Array.isArray(cats['Fixed']) && cats['Fixed'].length > 0) nonEmpty.push('Fixed');
  if (Array.isArray(cats['Security']) && cats['Security'].length > 0) nonEmpty.push('Security');

  return nonEmpty;
}
