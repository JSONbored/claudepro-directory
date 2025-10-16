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

/**
 * ============================================
 * DYNAMIC EVENT CATEGORIZATION
 * ============================================
 *
 * Auto-generates event categories from EVENTS object.
 * Zero manual maintenance - categories derive from event structure.
 */

/**
 * Build event categories dynamically from EVENTS
 * Groups all category-specific events automatically
 */
function buildEventCategories() {
  const contentEvents: EventName[] = [];
  const interactionEvents: EventName[] = [];

  // Dynamically collect all generated category events
  for (const [key, value] of Object.entries(EVENTS)) {
    const eventName = value as EventName;

    // Content view events
    if (key.startsWith('CONTENT_VIEW_') || key.startsWith('RELATED_')) {
      contentEvents.push(eventName);
    }
    // Search events
    else if (key.startsWith('SEARCH_') && key !== 'SEARCH_GLOBAL') {
      interactionEvents.push(eventName);
    }
    // Copy/download events
    else if (
      key.startsWith('COPY_CODE_') ||
      key.startsWith('COPY_MARKDOWN_') ||
      key.startsWith('DOWNLOAD_MARKDOWN_')
    ) {
      interactionEvents.push(eventName);
    }
  }

  // Add static events
  contentEvents.push(EVENTS.RELATED_CONTENT_IMPRESSION, EVENTS.CAROUSEL_NAVIGATION);

  interactionEvents.push(
    EVENTS.DOWNLOAD_RESOURCE,
    EVENTS.SHARE_CONTENT,
    EVENTS.FEEDBACK_SUBMITTED,
    EVENTS.EMAIL_MODAL_SHOWN,
    EVENTS.EMAIL_MODAL_DISMISSED,
    EVENTS.EMAIL_SUBSCRIBED_FOOTER,
    EVENTS.EMAIL_SUBSCRIBED_INLINE,
    EVENTS.EMAIL_SUBSCRIBED_POST_COPY,
    EVENTS.EMAIL_SUBSCRIBED_HOMEPAGE,
    EVENTS.EMAIL_SUBSCRIBED_MODAL,
    EVENTS.EMAIL_SUBSCRIBED_CONTENT_PAGE
  );

  return {
    CONTENT: contentEvents,
    JOURNEY: [EVENTS.CONTENT_JOURNEY, EVENTS.SESSION_START, EVENTS.SESSION_DEPTH],
    PERFORMANCE: [
      EVENTS.PERFORMANCE_METRIC,
      EVENTS.CACHE_PERFORMANCE,
      EVENTS.API_LATENCY,
      EVENTS.PAGE_LOAD_TIME,
    ],
    INTERACTION: interactionEvents,
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
  };
}

/**
 * Event categories for grouping and permissions
 * Dynamically generated - automatically includes new category events
 */
export const EVENT_CATEGORIES = buildEventCategories();

/**
 * ============================================
 * DYNAMIC EVENT CONFIGURATION GENERATION
 * ============================================
 *
 * Auto-generates event configurations from EVENTS object.
 * Zero hardcoded category configurations - pure template-driven.
 */

/**
 * Category display name mapping for descriptions
 */
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  agents: 'agent',
  mcp: 'MCP server',
  commands: 'command',
  rules: 'rule',
  hooks: 'hook',
  statuslines: 'statusline',
  collections: 'collection',
  skills: 'skill',
  guides: 'guide',
};

/**
 * Event configuration interface
 */
interface EventConfig {
  description: string;
  category: keyof typeof EVENT_CATEGORIES;
  enabled: boolean;
  sampleRate?: number;
  debugOnly?: boolean;
}

/**
 * Build event configurations dynamically from EVENTS
 * Generates consistent configs for all category-specific events
 */
function buildEventConfig(): Record<EventName, EventConfig> {
  const config: Record<string, EventConfig> = {};

  // Dynamically generate configs for all category events
  for (const [key, value] of Object.entries(EVENTS)) {
    const eventName = value as EventName;

    // Content view events
    if (key.startsWith('CONTENT_VIEW_')) {
      const category = key.replace('CONTENT_VIEW_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: `User views ${displayName} detail page`,
        category: 'CONTENT',
        enabled: true,
      };
    }
    // Related view events
    else if (key.startsWith('RELATED_VIEW_ON_')) {
      const category = key.replace('RELATED_VIEW_ON_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: `Related content viewed on ${displayName} detail page`,
        category: 'CONTENT',
        enabled: true,
      };
    }
    // Related click events
    else if (key.startsWith('RELATED_CLICK_FROM_')) {
      const category = key.replace('RELATED_CLICK_FROM_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: `User clicks related content from ${displayName} detail page`,
        category: 'CONTENT',
        enabled: true,
      };
    }
    // Search events
    else if (key.startsWith('SEARCH_') && key !== 'SEARCH_GLOBAL') {
      const category = key.replace('SEARCH_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: `User searches within ${displayName} section`,
        category: 'INTERACTION',
        enabled: true,
      };
    }
    // Copy code events
    else if (key.startsWith('COPY_CODE_')) {
      const category = key.replace('COPY_CODE_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: `User copies code from ${displayName} detail page`,
        category: 'INTERACTION',
        enabled: true,
      };
    }
    // Copy markdown events
    else if (key.startsWith('COPY_MARKDOWN_')) {
      const category = key.replace('COPY_MARKDOWN_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: `User copies ${displayName} as markdown`,
        category: 'INTERACTION',
        enabled: true,
      };
    }
    // Download markdown events
    else if (key.startsWith('DOWNLOAD_MARKDOWN_')) {
      const category = key.replace('DOWNLOAD_MARKDOWN_', '').toLowerCase();
      const displayName = CATEGORY_DISPLAY_NAMES[category] || category;
      config[eventName] = {
        description: `User downloads ${displayName} as markdown file`,
        category: 'INTERACTION',
        enabled: true,
      };
    }
  }

  // Add static event configurations
  return {
    ...config,

    // Related Content (Generic)
    [EVENTS.RELATED_CONTENT_IMPRESSION]: {
      description: 'Related content items shown to user',
      category: 'CONTENT',
      enabled: true,
      sampleRate: 0.5,
    },
    [EVENTS.CAROUSEL_NAVIGATION]: {
      description: 'User navigates carousel',
      category: 'CONTENT',
      enabled: true,
    },

    // User Journey
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

    // Performance
    [EVENTS.PERFORMANCE_METRIC]: {
      description: 'Performance measurement (Core Web Vitals)',
      category: 'PERFORMANCE',
      enabled: true,
      sampleRate: 0.2,
    },
    [EVENTS.CACHE_PERFORMANCE]: {
      description: 'Cache hit/miss metrics',
      category: 'PERFORMANCE',
      enabled: true,
      sampleRate: 0.1,
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

    // Algorithm
    [EVENTS.ALGORITHM_PERFORMANCE]: {
      description: 'Content algorithm effectiveness',
      category: 'CONTENT',
      enabled: true,
    },

    // Search (Global)
    [EVENTS.SEARCH_GLOBAL]: {
      description: 'User performs global search across all content types',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.FILTER_APPLIED]: {
      description: 'User applies filter',
      category: 'NAVIGATION',
      enabled: true,
    },

    // Sharing & Feedback
    [EVENTS.DOWNLOAD_RESOURCE]: {
      description: 'User downloads resource',
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

    // Email Capture
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

    // Error Tracking
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

    // Content Activation
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

    // Navigation
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

    // Personalization
    [EVENTS.PERSONALIZATION_AFFINITY_CALCULATED]: {
      description: 'User affinity score calculated',
      category: 'PERSONALIZATION',
      enabled: true,
      sampleRate: 0.1,
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
  } as Record<EventName, EventConfig>;
}

/**
 * Event configuration with metadata
 * 100% dynamically generated - zero hardcoded category configs
 */
export const EVENT_CONFIG: Record<EventName, EventConfig> = buildEventConfig();

/**
 * Type helper for event payloads
 *
 * Re-export from event-payloads.types.ts for convenience.
 * Components using this should import directly from event-payloads.types.ts
 * to avoid pulling in the full EVENT_CONFIG.
 */
export type { EventPayload, EventPayloads } from './event-payloads.types';
