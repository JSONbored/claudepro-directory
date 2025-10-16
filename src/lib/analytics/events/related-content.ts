/**
 * Related Content Analytics Events
 * Feature-specific event tracking for related content functionality
 * Refactored to use centralized tracker with source-specific events
 */

import type { EventName } from '@/src/lib/analytics/events.constants';
import { EVENTS } from '@/src/lib/analytics/events.constants';
import { trackEvent } from '@/src/lib/analytics/tracker';

/**
 * Get source-specific related content view event based on category
 */
function getRelatedViewEvent(sourceCategory: string): EventName {
  const eventMap: Record<string, EventName> = {
    agents: EVENTS.RELATED_VIEW_ON_AGENT,
    mcp: EVENTS.RELATED_VIEW_ON_MCP,
    'mcp-servers': EVENTS.RELATED_VIEW_ON_MCP,
    commands: EVENTS.RELATED_VIEW_ON_COMMAND,
    rules: EVENTS.RELATED_VIEW_ON_RULE,
    hooks: EVENTS.RELATED_VIEW_ON_HOOK,
    statuslines: EVENTS.RELATED_VIEW_ON_STATUSLINE,
    collections: EVENTS.RELATED_VIEW_ON_COLLECTION,
    guides: EVENTS.RELATED_VIEW_ON_GUIDE,
    tutorials: EVENTS.RELATED_VIEW_ON_GUIDE,
    comparisons: EVENTS.RELATED_VIEW_ON_GUIDE,
    workflows: EVENTS.RELATED_VIEW_ON_GUIDE,
    'use-cases': EVENTS.RELATED_VIEW_ON_GUIDE,
    troubleshooting: EVENTS.RELATED_VIEW_ON_GUIDE,
    docs: EVENTS.RELATED_VIEW_ON_GUIDE,
  };
  return eventMap[sourceCategory] || EVENTS.RELATED_VIEW_ON_AGENT; // Fallback to agent
}

/**
 * Get source-specific related content click event based on category
 */
function getRelatedClickEvent(sourceCategory: string): EventName {
  const eventMap: Record<string, EventName> = {
    agents: EVENTS.RELATED_CLICK_FROM_AGENT,
    mcp: EVENTS.RELATED_CLICK_FROM_MCP,
    'mcp-servers': EVENTS.RELATED_CLICK_FROM_MCP,
    commands: EVENTS.RELATED_CLICK_FROM_COMMAND,
    rules: EVENTS.RELATED_CLICK_FROM_RULE,
    hooks: EVENTS.RELATED_CLICK_FROM_HOOK,
    statuslines: EVENTS.RELATED_CLICK_FROM_STATUSLINE,
    collections: EVENTS.RELATED_CLICK_FROM_COLLECTION,
    guides: EVENTS.RELATED_CLICK_FROM_GUIDE,
    tutorials: EVENTS.RELATED_CLICK_FROM_GUIDE,
    comparisons: EVENTS.RELATED_CLICK_FROM_GUIDE,
    workflows: EVENTS.RELATED_CLICK_FROM_GUIDE,
    'use-cases': EVENTS.RELATED_CLICK_FROM_GUIDE,
    troubleshooting: EVENTS.RELATED_CLICK_FROM_GUIDE,
    docs: EVENTS.RELATED_CLICK_FROM_GUIDE,
  };
  return eventMap[sourceCategory] || EVENTS.RELATED_CLICK_FROM_AGENT; // Fallback to agent
}

/**
 * Track related content section view with source-specific analytics
 */
export const trackRelatedContentView = (
  sourcePage: string,
  itemsShown: number,
  cacheHit: boolean
): void => {
  // Extract category from source page path (e.g., "/agents/api-builder" -> "agents")
  const pathParts = sourcePage.split('/').filter(Boolean);
  const sourceCategory = pathParts[0] || 'unknown';
  const eventName = getRelatedViewEvent(sourceCategory);

  trackEvent(eventName, {
    items_shown: itemsShown,
    cache_hit: cacheHit,
  });
};

/**
 * Track related content click with source-specific analytics
 */
export const trackRelatedContentClick = (
  sourcePage: string,
  targetPage: string,
  position: number,
  matchScore: number,
  matchType = 'unknown'
): void => {
  // Extract categories from paths
  const sourcePathParts = sourcePage.split('/').filter(Boolean);
  const targetPathParts = targetPage.split('/').filter(Boolean);
  const sourceCategory = sourcePathParts[0] || 'unknown';
  const targetCategory = targetPathParts[0] || 'unknown';
  const targetSlug = targetPathParts[1] || 'unknown';

  const eventName = getRelatedClickEvent(sourceCategory);

  trackEvent(eventName, {
    target_slug: targetSlug,
    target_category: targetCategory,
    position,
    match_score: Math.round(matchScore * 100) / 100, // Round to 2 decimals
    match_type: matchType,
  });
};
