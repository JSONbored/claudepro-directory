/**
 * Related Content Analytics Events
 * Feature-specific event tracking for related content functionality
 */

// Simple event tracking using existing Umami setup
export const trackRelatedContentView = (
  sourcePage: string,
  itemsShown: number,
  cacheHit: boolean
): void => {
  if (window?.umami) {
    window.umami.track('related_content_view', {
      source_page: sourcePage,
      items_shown: itemsShown,
      cache_hit: cacheHit,
    });
  }
};

export const trackRelatedContentClick = (
  sourcePage: string,
  targetPage: string,
  position: number,
  matchScore: number
): void => {
  if (window?.umami) {
    window.umami.track('related_content_click', {
      source_page: sourcePage,
      target_page: targetPage,
      position,
      match_score: Math.round(matchScore * 100) / 100, // Round to 2 decimals
    });
  }
};
