/**
 * Related Content Analytics Events
 * Feature-specific event tracking for related content functionality
 *
 * **Database-First Architecture:**
 * - Event configuration loaded from analytics_events table
 * - Event names are plain strings (database-driven)
 * - Uses consolidated events (Umami best practices)
 */

import { trackEvent } from '@/src/lib/analytics/tracker';

/**
 * Track related content section view with consolidated analytics
 *
 * UPDATED: Uses generic 'related_viewed' event with category payload
 */
export const trackRelatedContentView = (
  sourcePage: string,
  itemsShown: number,
  cacheHit: boolean
): void => {
  // Extract category from source page path (e.g., "/agents/api-builder" -> "agents")
  const pathParts = sourcePage.split('/').filter(Boolean);
  const sourceCategory = pathParts[0] || 'unknown';
  const sourceSlug = pathParts[1] || 'unknown';

  // Consolidated event with typed data
  trackEvent('related_viewed', {
    category: sourceCategory,
    slug: sourceSlug,
    impressionCount: itemsShown, // NUMBER (not string)
    ...(cacheHit && { loadTimeMs: 0 }), // Only include if cache hit
  });
};

/**
 * Track related content click with consolidated analytics
 *
 * UPDATED: Uses generic 'related_clicked' event with category payload
 */
export const trackRelatedContentClick = (
  sourcePage: string,
  targetPage: string,
  position: number,
  matchScore: number
): void => {
  // Extract categories from paths
  const sourcePathParts = sourcePage.split('/').filter(Boolean);
  const targetPathParts = targetPage.split('/').filter(Boolean);
  const sourceCategory = sourcePathParts[0] || 'unknown';
  const sourceSlug = sourcePathParts[1] || 'unknown';
  const targetCategory = targetPathParts[0] || 'unknown';
  const targetSlug = targetPathParts[1] || 'unknown';

  // Consolidated event with typed data
  trackEvent('related_clicked', {
    category: sourceCategory,
    slug: sourceSlug,
    targetCategory,
    targetSlug,
    position, // NUMBER (not string)
    impressionCount: Math.round(matchScore * 100), // NUMBER (normalized to integer)
  });
};
