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
 * Helper to consume parameters and satisfy linters without underscore prefixes
 */
function noop(..._args: unknown[]): void {
  // Intentionally empty - consumes parameters to satisfy TypeScript/Biome
}

/**
 * Mock: Track related content view event
 */
export const trackRelatedContentView = (
  sourcePage: string,
  itemsShown: number,
  cacheHit: boolean
): void => {
  // No-op mock for Storybook - real implementation in related-content.ts
  noop(sourcePage, itemsShown, cacheHit);
};

/**
 * Mock: Track related content click event
 */
export const trackRelatedContentClick = (
  sourcePage: string,
  targetPage: string,
  position: number,
  matchScore: number,
  matchType = 'unknown'
): void => {
  // No-op mock for Storybook - real implementation in related-content.ts
  noop(sourcePage, targetPage, position, matchScore, matchType);
};
