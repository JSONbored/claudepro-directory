/**
 * Tag Utility Functions
 *
 * Pure utility functions for tag formatting.
 * These are safe for both client and server use.
 */

/**
 * Format tag for display (capitalize words, replace hyphens with spaces)
 * @example formatTagForDisplay('web-development') => 'Web Development'
 */
export function formatTagForDisplay(tag: string): string {
  return tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format tag for URL (lowercase, hyphenated)
 * @example formatTagForUrl('Web Development') => 'web-development'
 */
export function formatTagForUrl(tag: string): string {
  return tag.toLowerCase().replaceAll(/\s+/g, '-');
}
