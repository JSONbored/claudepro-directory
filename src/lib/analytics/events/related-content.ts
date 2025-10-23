/**
 * Related Content Analytics Events
 * Feature-specific event tracking for related content functionality
 *
 * UPDATED: Migrated to consolidated events (Umami best practices)
 * - Before: 22 events (11 RELATED_VIEW_ON_{category} + 11 RELATED_CLICK_FROM_{category})
 * - After: 2 events (RELATED_VIEWED + RELATED_CLICKED) with category payload
 */

import { trackEvent } from '#lib/analytics/tracker';
import { EVENTS } from '@/src/lib/analytics/events.constants';

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

  // NEW: Consolidated event with typed data
  trackEvent(EVENTS.RELATED_VIEWED, {
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

  // NEW: Consolidated event with typed data
  trackEvent(EVENTS.RELATED_CLICKED, {
    category: sourceCategory,
    slug: sourceSlug,
    targetCategory,
    targetSlug,
    position, // NUMBER (not string)
    impressionCount: Math.round(matchScore * 100), // NUMBER (normalized to integer)
  });
};
