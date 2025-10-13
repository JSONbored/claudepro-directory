/**
 * Centralized Umami Events Configuration
 * Single source of truth for all analytics event names and configuration
 *
 * Split Architecture for Bundle Size Optimization:
 * - events.constants.ts: EVENTS const (~160 lines, no dependencies)
 * - events.config.ts (this file): EVENT_CONFIG, EVENT_CATEGORIES (~780 lines)
 * - event-payloads.types.ts: EventPayloads interface type definitions (~725 lines, types-only)
 *
 * This split reduces bundle size by ~8-12KB for components that only need event names.
 * Type definitions are stripped at runtime, so they add 0KB to production bundles.
 *
 * Import Cycle Prevention:
 * - events.constants.ts contains ONLY the EVENTS object with no imports
 * - This file imports and re-exports EVENTS from events.constants.ts
 * - event-payloads.types.ts imports from events.constants.ts (breaking the cycle)
 *
 * To add new events:
 * 1. Add event definition to EVENTS object in events.constants.ts
 * 2. Add payload type to EventPayloads interface in event-payloads.types.ts
 * 3. Add event configuration to EVENT_CONFIG below
 * 4. Use trackEvent() from tracker.ts anywhere in the app
 *
 * @module lib/analytics/events.config
 */

import { EVENTS, type EventName } from './events.constants';

// Re-export for backward compatibility - components import from this file
export { EVENTS, type EventName };

/**
 * Event payload type definitions moved to event-payloads.types.ts
 * to reduce bundle size for components that only need event names.
 *
 * Import from: '@/src/lib/analytics/event-payloads.types'
 */

// Event categories for grouping and permissions
export const EVENT_CATEGORIES = {
  CONTENT: [
    EVENTS.CONTENT_VIEW,
    EVENTS.CONTENT_VIEW_AGENT,
    EVENTS.CONTENT_VIEW_MCP,
    EVENTS.CONTENT_VIEW_COMMAND,
    EVENTS.CONTENT_VIEW_RULE,
    EVENTS.CONTENT_VIEW_HOOK,
    EVENTS.CONTENT_VIEW_STATUSLINE,
    EVENTS.CONTENT_VIEW_COLLECTION,
    EVENTS.RELATED_CONTENT_VIEW,
    EVENTS.RELATED_CONTENT_CLICK,
    EVENTS.RELATED_CONTENT_IMPRESSION,
    EVENTS.CAROUSEL_NAVIGATION,
  ],
  JOURNEY: [EVENTS.CONTENT_JOURNEY, EVENTS.SESSION_START, EVENTS.SESSION_DEPTH],
  PERFORMANCE: [
    EVENTS.PERFORMANCE_METRIC,
    EVENTS.CACHE_PERFORMANCE,
    EVENTS.API_LATENCY,
    EVENTS.PAGE_LOAD_TIME,
  ],
  INTERACTION: [
    EVENTS.COPY_CODE,
    EVENTS.COPY_CODE_AGENT,
    EVENTS.COPY_CODE_MCP,
    EVENTS.COPY_CODE_COMMAND,
    EVENTS.COPY_CODE_RULE,
    EVENTS.COPY_CODE_HOOK,
    EVENTS.COPY_CODE_STATUSLINE,
    EVENTS.COPY_CODE_GUIDE,
    EVENTS.COPY_CODE_OTHER,
    EVENTS.COPY_MARKDOWN,
    EVENTS.COPY_MARKDOWN_AGENT,
    EVENTS.COPY_MARKDOWN_MCP,
    EVENTS.COPY_MARKDOWN_COMMAND,
    EVENTS.COPY_MARKDOWN_RULE,
    EVENTS.COPY_MARKDOWN_HOOK,
    EVENTS.COPY_MARKDOWN_STATUSLINE,
    EVENTS.COPY_MARKDOWN_COLLECTION,
    EVENTS.COPY_MARKDOWN_OTHER,
    EVENTS.DOWNLOAD_RESOURCE,
    EVENTS.DOWNLOAD_MARKDOWN,
    EVENTS.DOWNLOAD_MARKDOWN_AGENT,
    EVENTS.DOWNLOAD_MARKDOWN_MCP,
    EVENTS.DOWNLOAD_MARKDOWN_COMMAND,
    EVENTS.DOWNLOAD_MARKDOWN_RULE,
    EVENTS.DOWNLOAD_MARKDOWN_HOOK,
    EVENTS.DOWNLOAD_MARKDOWN_STATUSLINE,
    EVENTS.DOWNLOAD_MARKDOWN_COLLECTION,
    EVENTS.DOWNLOAD_MARKDOWN_OTHER,
    EVENTS.SHARE_CONTENT,
    EVENTS.FEEDBACK_SUBMITTED,
    EVENTS.EMAIL_CAPTURED,
    EVENTS.EMAIL_MODAL_SHOWN,
    EVENTS.EMAIL_MODAL_DISMISSED,
    EVENTS.EMAIL_SUBSCRIBED_FOOTER,
    EVENTS.EMAIL_SUBSCRIBED_INLINE,
    EVENTS.EMAIL_SUBSCRIBED_POST_COPY,
    EVENTS.EMAIL_SUBSCRIBED_HOMEPAGE,
    EVENTS.EMAIL_SUBSCRIBED_MODAL,
    EVENTS.EMAIL_SUBSCRIBED_CONTENT_PAGE,
  ],
  ERROR: [EVENTS.ERROR_OCCURRED, EVENTS.NOT_FOUND, EVENTS.API_ERROR],
  FEATURE: [
    EVENTS.MCP_INSTALLED,
    EVENTS.AGENT_ACTIVATED,
    EVENTS.COMMAND_EXECUTED,
    EVENTS.RULE_APPLIED,
    EVENTS.HOOK_TRIGGERED,
  ],
  NAVIGATION: [
    EVENTS.TAB_SWITCHED,
    EVENTS.FILTER_TOGGLED,
    EVENTS.SORT_CHANGED,
    EVENTS.PAGINATION_CLICKED,
  ],
  PERSONALIZATION: [
    EVENTS.PERSONALIZATION_AFFINITY_CALCULATED,
    EVENTS.PERSONALIZATION_RECOMMENDATION_SHOWN,
    EVENTS.PERSONALIZATION_RECOMMENDATION_CLICKED,
    EVENTS.PERSONALIZATION_SIMILAR_CONFIG_CLICKED,
    EVENTS.PERSONALIZATION_FOR_YOU_VIEWED,
    EVENTS.PERSONALIZATION_USAGE_RECOMMENDATION_SHOWN,
  ],
} as const;

// Event configuration with metadata
export const EVENT_CONFIG: Record<
  EventName,
  {
    description: string;
    category: keyof typeof EVENT_CATEGORIES;
    enabled: boolean;
    sampleRate?: number; // For high-volume events, sample at this rate (0-1)
    debugOnly?: boolean; // Only track in development
  }
> = {
  [EVENTS.CONTENT_VIEW]: {
    description: 'User views content detail page (legacy)',
    category: 'CONTENT',
    enabled: false, // Deprecated in favor of content-specific events
  },
  [EVENTS.CONTENT_VIEW_AGENT]: {
    description: 'User views agent detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.CONTENT_VIEW_MCP]: {
    description: 'User views MCP server detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.CONTENT_VIEW_COMMAND]: {
    description: 'User views command detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.CONTENT_VIEW_RULE]: {
    description: 'User views rule detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.CONTENT_VIEW_HOOK]: {
    description: 'User views hook detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.CONTENT_VIEW_STATUSLINE]: {
    description: 'User views statusline detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.CONTENT_VIEW_COLLECTION]: {
    description: 'User views collection detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CONTENT_VIEW]: {
    description: 'User views related content section (legacy)',
    category: 'CONTENT',
    enabled: false, // Deprecated in favor of source-specific events
  },
  [EVENTS.RELATED_CONTENT_CLICK]: {
    description: 'User clicks on related content item (legacy)',
    category: 'CONTENT',
    enabled: false, // Deprecated in favor of source-specific events
  },
  [EVENTS.RELATED_VIEW_ON_AGENT]: {
    description: 'Related content viewed on agent detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_VIEW_ON_MCP]: {
    description: 'Related content viewed on MCP server detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_VIEW_ON_COMMAND]: {
    description: 'Related content viewed on command detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_VIEW_ON_RULE]: {
    description: 'Related content viewed on rule detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_VIEW_ON_HOOK]: {
    description: 'Related content viewed on hook detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_VIEW_ON_STATUSLINE]: {
    description: 'Related content viewed on statusline detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_VIEW_ON_COLLECTION]: {
    description: 'Related content viewed on collection detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_VIEW_ON_GUIDE]: {
    description: 'Related content viewed on guide detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CLICK_FROM_AGENT]: {
    description: 'User clicks related content from agent detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CLICK_FROM_MCP]: {
    description: 'User clicks related content from MCP server detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CLICK_FROM_COMMAND]: {
    description: 'User clicks related content from command detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CLICK_FROM_RULE]: {
    description: 'User clicks related content from rule detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CLICK_FROM_HOOK]: {
    description: 'User clicks related content from hook detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CLICK_FROM_STATUSLINE]: {
    description: 'User clicks related content from statusline detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CLICK_FROM_COLLECTION]: {
    description: 'User clicks related content from collection detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CLICK_FROM_GUIDE]: {
    description: 'User clicks related content from guide detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CONTENT_IMPRESSION]: {
    description: 'Related content items shown to user',
    category: 'CONTENT',
    enabled: true,
    sampleRate: 0.5, // Sample 50% to reduce volume
  },
  [EVENTS.CAROUSEL_NAVIGATION]: {
    description: 'User navigates carousel',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.CONTENT_JOURNEY]: {
    description: 'User navigates between content',
    category: 'JOURNEY',
    enabled: true,
  },
  [EVENTS.SESSION_START]: {
    description: 'New user session starts',
    category: 'JOURNEY',
    enabled: true,
  },
  [EVENTS.SESSION_DEPTH]: {
    description: 'Session engagement metrics',
    category: 'JOURNEY',
    enabled: true,
  },
  [EVENTS.PERFORMANCE_METRIC]: {
    description: 'Performance measurement (Core Web Vitals)',
    category: 'PERFORMANCE',
    enabled: true,
    sampleRate: 0.2, // Sample 20% of sessions to track Web Vitals
  },
  [EVENTS.CACHE_PERFORMANCE]: {
    description: 'Cache hit/miss metrics',
    category: 'PERFORMANCE',
    enabled: true,
    sampleRate: 0.1, // Sample 10% in production
  },
  [EVENTS.API_LATENCY]: {
    description: 'API response times',
    category: 'PERFORMANCE',
    enabled: true,
    sampleRate: 0.1,
  },
  [EVENTS.PAGE_LOAD_TIME]: {
    description: 'Page load performance',
    category: 'PERFORMANCE',
    enabled: true,
  },
  [EVENTS.ALGORITHM_PERFORMANCE]: {
    description: 'Content algorithm effectiveness',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.SEARCH_PERFORMED]: {
    description: 'User performs search (legacy)',
    category: 'INTERACTION',
    enabled: false, // Deprecated in favor of context-specific search events
  },
  [EVENTS.SEARCH_GLOBAL]: {
    description: 'User performs global search across all content types',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.SEARCH_AGENTS]: {
    description: 'User searches within agents section',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.SEARCH_MCP]: {
    description: 'User searches within MCP servers section',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.SEARCH_COMMANDS]: {
    description: 'User searches within commands section',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.SEARCH_RULES]: {
    description: 'User searches within rules section',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.SEARCH_HOOKS]: {
    description: 'User searches within hooks section',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.SEARCH_STATUSLINES]: {
    description: 'User searches within statuslines section',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.SEARCH_COLLECTIONS]: {
    description: 'User searches within collections section',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.SEARCH_GUIDES]: {
    description: 'User searches within guides section',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.FILTER_APPLIED]: {
    description: 'User applies filter',
    category: 'NAVIGATION',
    enabled: true,
  },
  [EVENTS.COPY_CODE]: {
    description: 'User copies code/command (legacy)',
    category: 'INTERACTION',
    enabled: false, // Deprecated in favor of content-specific events
  },
  [EVENTS.COPY_CODE_AGENT]: {
    description: 'User copies code from agent detail page',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_CODE_MCP]: {
    description: 'User copies code from MCP server detail page',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_CODE_COMMAND]: {
    description: 'User copies code from command detail page',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_CODE_RULE]: {
    description: 'User copies code from rule detail page',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_CODE_HOOK]: {
    description: 'User copies code from hook detail page',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_CODE_STATUSLINE]: {
    description: 'User copies code from statusline detail page',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_CODE_GUIDE]: {
    description: 'User copies code from guide/documentation',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_CODE_OTHER]: {
    description: 'User copies code from other pages',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_MARKDOWN]: {
    description: 'User copies content as markdown (legacy)',
    category: 'INTERACTION',
    enabled: false, // Deprecated in favor of content-specific events
  },
  [EVENTS.COPY_MARKDOWN_AGENT]: {
    description: 'User copies agent as markdown',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_MARKDOWN_MCP]: {
    description: 'User copies MCP server as markdown',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_MARKDOWN_COMMAND]: {
    description: 'User copies command as markdown',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_MARKDOWN_RULE]: {
    description: 'User copies rule as markdown',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_MARKDOWN_HOOK]: {
    description: 'User copies hook as markdown',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_MARKDOWN_STATUSLINE]: {
    description: 'User copies statusline as markdown',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_MARKDOWN_COLLECTION]: {
    description: 'User copies collection as markdown',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_MARKDOWN_OTHER]: {
    description: 'User copies content as markdown from other pages',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_RESOURCE]: {
    description: 'User downloads resource',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_MARKDOWN]: {
    description: 'User downloads content as markdown file (legacy)',
    category: 'INTERACTION',
    enabled: false, // Deprecated in favor of content-specific events
  },
  [EVENTS.DOWNLOAD_MARKDOWN_AGENT]: {
    description: 'User downloads agent as markdown file',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_MARKDOWN_MCP]: {
    description: 'User downloads MCP server as markdown file',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_MARKDOWN_COMMAND]: {
    description: 'User downloads command as markdown file',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_MARKDOWN_RULE]: {
    description: 'User downloads rule as markdown file',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_MARKDOWN_HOOK]: {
    description: 'User downloads hook as markdown file',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_MARKDOWN_STATUSLINE]: {
    description: 'User downloads statusline as markdown file',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_MARKDOWN_COLLECTION]: {
    description: 'User downloads collection as markdown file',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_MARKDOWN_OTHER]: {
    description: 'User downloads content as markdown file from other pages',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.SHARE_CONTENT]: {
    description: 'User shares content',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.FEEDBACK_SUBMITTED]: {
    description: 'User submits feedback',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.ERROR_OCCURRED]: {
    description: 'Error occurred',
    category: 'ERROR',
    enabled: true,
  },
  [EVENTS.NOT_FOUND]: {
    description: '404 page accessed',
    category: 'ERROR',
    enabled: true,
  },
  [EVENTS.API_ERROR]: {
    description: 'API error occurred',
    category: 'ERROR',
    enabled: true,
  },
  [EVENTS.MCP_INSTALLED]: {
    description: 'MCP server installed',
    category: 'FEATURE',
    enabled: true,
  },
  [EVENTS.AGENT_ACTIVATED]: {
    description: 'Agent activated',
    category: 'FEATURE',
    enabled: true,
  },
  [EVENTS.COMMAND_EXECUTED]: {
    description: 'Command executed',
    category: 'FEATURE',
    enabled: true,
  },
  [EVENTS.RULE_APPLIED]: {
    description: 'Rule applied',
    category: 'FEATURE',
    enabled: true,
  },
  [EVENTS.HOOK_TRIGGERED]: {
    description: 'Hook triggered',
    category: 'FEATURE',
    enabled: true,
  },
  [EVENTS.TAB_SWITCHED]: {
    description: 'Tab switched',
    category: 'NAVIGATION',
    enabled: true,
  },
  [EVENTS.FILTER_TOGGLED]: {
    description: 'Filter toggled',
    category: 'NAVIGATION',
    enabled: true,
  },
  [EVENTS.SORT_CHANGED]: {
    description: 'Sort order changed',
    category: 'NAVIGATION',
    enabled: true,
  },
  [EVENTS.PAGINATION_CLICKED]: {
    description: 'Pagination used',
    category: 'NAVIGATION',
    enabled: true,
  },
  [EVENTS.EMAIL_CAPTURED]: {
    description: 'User email captured for newsletter',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.EMAIL_MODAL_SHOWN]: {
    description: 'Email capture modal displayed to user',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.EMAIL_MODAL_DISMISSED]: {
    description: 'User dismissed email capture modal',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.EMAIL_SUBSCRIBED_FOOTER]: {
    description: 'User subscribed via sticky footer bar',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.EMAIL_SUBSCRIBED_INLINE]: {
    description: 'User subscribed via inline CTA',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.EMAIL_SUBSCRIBED_POST_COPY]: {
    description: 'User subscribed via post-copy modal',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.EMAIL_SUBSCRIBED_HOMEPAGE]: {
    description: 'User subscribed from homepage',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.EMAIL_SUBSCRIBED_MODAL]: {
    description: 'User subscribed via modal',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.EMAIL_SUBSCRIBED_CONTENT_PAGE]: {
    description: 'User subscribed from content detail page',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.PERSONALIZATION_AFFINITY_CALCULATED]: {
    description: 'User affinity score calculated',
    category: 'PERSONALIZATION',
    enabled: true,
    sampleRate: 0.1, // Sample 10% (high volume)
  },
  [EVENTS.PERSONALIZATION_RECOMMENDATION_SHOWN]: {
    description: 'Personalized recommendation displayed',
    category: 'PERSONALIZATION',
    enabled: true,
  },
  [EVENTS.PERSONALIZATION_RECOMMENDATION_CLICKED]: {
    description: 'User clicked personalized recommendation',
    category: 'PERSONALIZATION',
    enabled: true,
  },
  [EVENTS.PERSONALIZATION_SIMILAR_CONFIG_CLICKED]: {
    description: 'User clicked similar config suggestion',
    category: 'PERSONALIZATION',
    enabled: true,
  },
  [EVENTS.PERSONALIZATION_FOR_YOU_VIEWED]: {
    description: 'User viewed For You feed',
    category: 'PERSONALIZATION',
    enabled: true,
  },
  [EVENTS.PERSONALIZATION_USAGE_RECOMMENDATION_SHOWN]: {
    description: 'Usage-based recommendation displayed',
    category: 'PERSONALIZATION',
    enabled: true,
  },
};

/**
 * Type helper for event payloads
 *
 * Re-export from event-payloads.types.ts for convenience.
 * Components using this should import directly from event-payloads.types.ts
 * to avoid pulling in the full EVENT_CONFIG.
 */
export type { EventPayload, EventPayloads } from './event-payloads.types';
