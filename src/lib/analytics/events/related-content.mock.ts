/**
 * Related Content Analytics Events - Storybook Mock Implementation
 *
 * This file provides a no-op mock implementation of related content analytics
 * for Storybook component isolation.
 *
 * **Conditional Import Resolution:**
 * - Storybook environment: Uses this mock file (via package.json imports config)
 * - Production environment: Uses real related-content.ts file
 *
 * @see package.json "imports" field for conditional mapping configuration
 * @see src/lib/analytics/events/related-content.ts for production implementation
 */

/**
 * Mock: Track related content view event
 */
export const trackRelatedContentView = (
  _sourcePage: string,
  _itemsShown: number,
  _cacheHit: boolean
): void => {};

/**
 * Mock: Track related content click event
 */
export const trackRelatedContentClick = (
  _sourcePage: string,
  _targetPage: string,
  _position: number,
  _matchScore: number,
  _matchType = 'unknown'
): void => {};
