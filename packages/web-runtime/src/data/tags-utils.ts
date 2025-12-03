/**
 * Tag Utility Functions
 *
 * Pure utility functions for formatting tags.
 * These are NOT server actions - they're simple string manipulation utilities
 * that can be used in both client and server components.
 */

/**
 * Format tag for display (capitalize words, replace hyphens with spaces)
 * @example
 * formatTagForDisplay('react-hooks') // "React Hooks"
 */
export function formatTagForDisplay(tag: string): string {
  return tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format tag for URL (lowercase, hyphenated)
 * @example
 * formatTagForUrl('React Hooks') // "react-hooks"
 */
export function formatTagForUrl(tag: string): string {
  return tag.toLowerCase().replaceAll(/\s+/g, '-');
}
