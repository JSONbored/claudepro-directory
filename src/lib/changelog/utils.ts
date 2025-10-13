/**
 * Changelog Utility Functions
 *
 * Helper functions for working with changelog entries.
 * Provides formatting, URL generation, and data transformation utilities.
 *
 * Production Standards:
 * - Pure functions (no side effects)
 * - Type-safe with TypeScript
 * - Proper error handling
 * - JSDoc comments for all exports
 */

import { APP_CONFIG } from '@/src/lib/constants';

/**
 * Format changelog date for display
 *
 * Converts ISO date (YYYY-MM-DD) to human-readable format.
 *
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns Formatted date string (e.g., "October 6, 2025")
 *
 * @example
 * formatChangelogDate("2025-10-06")
 * // Returns: "October 6, 2025"
 */
export function formatChangelogDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return isoDate; // Fallback to original if parsing fails
  }
}

/**
 * Format changelog date for display (short format)
 *
 * Converts ISO date (YYYY-MM-DD) to abbreviated format.
 *
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns Short formatted date (e.g., "Oct 6, 2025")
 *
 * @example
 * formatChangelogDateShort("2025-10-06")
 * // Returns: "Oct 6, 2025"
 */
export function formatChangelogDateShort(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoDate; // Fallback to original if parsing fails
  }
}

/**
 * Format changelog date for RSS/Atom feeds (RFC 822)
 *
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns RFC 822 formatted date (e.g., "Mon, 06 Oct 2025 00:00:00 GMT")
 *
 * @example
 * formatChangelogDateRFC822("2025-10-06")
 * // Returns: "Mon, 06 Oct 2025 00:00:00 GMT"
 */
export function formatChangelogDateRFC822(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toUTCString();
  } catch {
    return new Date().toUTCString(); // Fallback to current date
  }
}

/**
 * Format changelog date for Atom feeds (ISO 8601)
 *
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns ISO 8601 formatted date with timezone (e.g., "2025-10-06T00:00:00.000Z")
 *
 * @example
 * formatChangelogDateISO8601("2025-10-06")
 * // Returns: "2025-10-06T00:00:00.000Z"
 */
export function formatChangelogDateISO8601(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toISOString();
  } catch {
    return new Date().toISOString(); // Fallback to current date
  }
}

/**
 * Get relative time from changelog date (e.g., "2 days ago")
 *
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns Relative time string
 *
 * @example
 * getRelativeTime("2025-10-06")
 * // Returns: "2 days ago" (if today is Oct 8)
 */
export function getRelativeTime(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }
    if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    }
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  } catch {
    return isoDate; // Fallback to original date
  }
}

/**
 * Generate changelog entry URL
 *
 * @param slug - Entry slug
 * @returns Full URL to changelog entry
 *
 * @example
 * getChangelogUrl("2025-10-06-automated-submission-tracking")
 * // Returns: "https://claudepro.directory/changelog/2025-10-06-automated-submission-tracking"
 */
export function getChangelogUrl(slug: string): string {
  return `${APP_CONFIG.url}/changelog/${slug}`;
}

/**
 * Generate changelog entry path (for internal routing)
 *
 * @param slug - Entry slug
 * @returns Relative path to changelog entry
 *
 * @example
 * getChangelogPath("2025-10-06-automated-submission-tracking")
 * // Returns: "/changelog/2025-10-06-automated-submission-tracking"
 */
export function getChangelogPath(slug: string): string {
  return `/changelog/${slug}`;
}

/**
 * Extract year from changelog date
 *
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns Year as number
 *
 * @example
 * getChangelogYear("2025-10-06")
 * // Returns: 2025
 */
export function getChangelogYear(isoDate: string): number {
  try {
    const date = new Date(isoDate);
    return date.getFullYear();
  } catch {
    return new Date().getFullYear(); // Fallback to current year
  }
}

/**
 * Extract month name from changelog date
 *
 * @param isoDate - ISO date string (YYYY-MM-DD)
 * @returns Month name (e.g., "October")
 *
 * @example
 * getChangelogMonth("2025-10-06")
 * // Returns: "October"
 */
export function getChangelogMonth(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', { month: 'long' });
  } catch {
    return 'Unknown'; // Fallback
  }
}

/**
 * Truncate changelog content for previews
 *
 * @param content - Full markdown content
 * @param maxLength - Maximum length (default: 150 characters)
 * @returns Truncated content with ellipsis
 *
 * @example
 * truncateChangelogContent("Very long content...", 20)
 * // Returns: "Very long content..."
 */
export function truncateChangelogContent(content: string, maxLength = 150): string {
  if (content.length <= maxLength) return content;
  return `${content.slice(0, maxLength).trim()}...`;
}

/**
 * Count total items across all categories in an entry
 *
 * @param categories - Changelog categories object
 * @returns Total number of items
 *
 * @example
 * countChangelogItems(entry.categories)
 * // Returns: 15 (if 5 Added + 3 Fixed + 7 Changed)
 */
export function countChangelogItems(categories: {
  Added: Array<{ content: string }>;
  Changed: Array<{ content: string }>;
  Deprecated: Array<{ content: string }>;
  Removed: Array<{ content: string }>;
  Fixed: Array<{ content: string }>;
  Security: Array<{ content: string }>;
}): number {
  return (
    categories.Added.length +
    categories.Changed.length +
    categories.Deprecated.length +
    categories.Removed.length +
    categories.Fixed.length +
    categories.Security.length
  );
}

/**
 * Get non-empty categories from an entry
 *
 * @param categories - Changelog categories object
 * @returns Array of category names that have items
 *
 * @example
 * getNonEmptyCategories(entry.categories)
 * // Returns: ["Added", "Fixed", "Changed"]
 */
export function getNonEmptyCategories(categories: {
  Added: Array<{ content: string }>;
  Changed: Array<{ content: string }>;
  Deprecated: Array<{ content: string }>;
  Removed: Array<{ content: string }>;
  Fixed: Array<{ content: string }>;
  Security: Array<{ content: string }>;
}): Array<'Added' | 'Changed' | 'Deprecated' | 'Removed' | 'Fixed' | 'Security'> {
  const nonEmpty: Array<'Added' | 'Changed' | 'Deprecated' | 'Removed' | 'Fixed' | 'Security'> = [];

  if (categories.Added.length > 0) nonEmpty.push('Added');
  if (categories.Changed.length > 0) nonEmpty.push('Changed');
  if (categories.Deprecated.length > 0) nonEmpty.push('Deprecated');
  if (categories.Removed.length > 0) nonEmpty.push('Removed');
  if (categories.Fixed.length > 0) nonEmpty.push('Fixed');
  if (categories.Security.length > 0) nonEmpty.push('Security');

  return nonEmpty;
}

/**
 * Changelog slug length constraints
 * Total format: YYYY-MM-DD-title (10 chars for date + 1 hyphen + title)
 */
const CHANGELOG_TITLE_MIN_LENGTH = 3;
const CHANGELOG_TITLE_MAX_LENGTH = 80; // Allow up to 80 chars for title part
const CHANGELOG_SLUG_MAX_LENGTH = 100; // Total slug length (date + title)

/**
 * Validation error types for changelog slug generation
 */
export class ChangelogSlugValidationError extends Error {
  constructor(
    message: string,
    public readonly code: 'EMPTY' | 'INVALID_DATE' | 'TOO_SHORT' | 'TOO_LONG' | 'INVALID'
  ) {
    super(message);
    this.name = 'ChangelogSlugValidationError';
  }
}

/**
 * Validate date format (YYYY-MM-DD)
 */
function isValidDateFormat(date: string): boolean {
  // Check format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  // Validate it's a real date
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !Number.isNaN(parsedDate.getTime());
}

/**
 * Generate slug from date and title with comprehensive validation
 *
 * @param date - ISO date string (YYYY-MM-DD)
 * @param title - Entry title
 * @returns URL-safe slug in format: YYYY-MM-DD-title-slug
 * @throws {ChangelogSlugValidationError} If validation fails
 *
 * Validation rules:
 * - Date format: YYYY-MM-DD (must be valid date)
 * - Title length: 3-80 characters (after slug generation)
 * - Total slug length: ≤ 100 characters
 * - Format: lowercase alphanumeric + hyphens
 *
 * @example
 * generateSlug("2025-10-06", "Automated Submission Tracking")
 * // Returns: "2025-10-06-automated-submission-tracking"
 *
 * generateSlug("2025-13-45", "Invalid Date")
 * // Throws: ChangelogSlugValidationError (invalid date)
 *
 * generateSlug("2025-10-06", "AB")
 * // Throws: ChangelogSlugValidationError (title too short)
 */
export function generateSlug(date: string, title: string): string {
  // Validate date format
  if (!(date && isValidDateFormat(date))) {
    throw new ChangelogSlugValidationError(
      `Invalid date format: "${date}" (expected YYYY-MM-DD)`,
      'INVALID_DATE'
    );
  }

  // Validate title is not empty
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new ChangelogSlugValidationError('Changelog title cannot be empty', 'EMPTY');
  }

  // Generate title slug
  const titleSlug = trimmedTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens

  // Validate title slug is not empty after sanitization
  if (!titleSlug) {
    throw new ChangelogSlugValidationError(
      `Title slug cannot be generated from input: "${trimmedTitle}" (contains no valid characters)`,
      'INVALID'
    );
  }

  // Validate minimum title slug length
  if (titleSlug.length < CHANGELOG_TITLE_MIN_LENGTH) {
    throw new ChangelogSlugValidationError(
      `Title slug must be at least ${CHANGELOG_TITLE_MIN_LENGTH} characters (got: "${titleSlug}", length: ${titleSlug.length})`,
      'TOO_SHORT'
    );
  }

  // Truncate title slug if too long (respecting total slug length)
  const maxTitleLength = Math.min(
    CHANGELOG_TITLE_MAX_LENGTH,
    CHANGELOG_SLUG_MAX_LENGTH - date.length - 1 // -1 for hyphen separator
  );
  const truncatedTitleSlug = titleSlug.slice(0, maxTitleLength);

  // Generate final slug
  const slug = `${date}-${truncatedTitleSlug}`;

  // Validate total slug length (should always pass due to truncation, but verify)
  if (slug.length > CHANGELOG_SLUG_MAX_LENGTH) {
    throw new ChangelogSlugValidationError(
      `Changelog slug must be at most ${CHANGELOG_SLUG_MAX_LENGTH} characters (got length: ${slug.length})`,
      'TOO_LONG'
    );
  }

  return slug;
}
