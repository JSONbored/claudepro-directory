/**
 * Analytics Events - Consolidated Events Architecture (Umami Best Practices)
 *
 * Single source of truth for ALL analytics: events, config, and type definitions.
 * Implements Umami's recommended approach for cleaner dashboard analytics.
 *
 * **2025 Modernization - Consolidated Events:**
 * - Replaced 171 events (77 category-specific + 94 core) with streamlined event structure
 * - Category-specific events → 7 generic events with dynamic category payloads
 * - Before: content_view_agent, content_view_mcp, content_view_command (77 events)
 * - After: content_viewed with {category: 'agents'|'mcp'|'commands'} (1 event)
 *
 * **Architecture Benefits:**
 * - Cleaner Umami dashboard: Filter by category property instead of 77 event names
 * - Type-safe payloads: Numbers, booleans, dates preserved (not stringified)
 * - Smaller bundle: Removed event-mapper.ts, template literal types, dynamic generation
 * - Tree-shakeable: Lazy initialization prevents loading unused code
 * - Maintainable: Static configuration, no auto-generation needed
 *
 * **Bundle Size:**
 * - EVENTS const: ~1KB (imported by all components)
 * - getEventConfig(): ~3KB (only imported by tracker.ts)
 * - EventPayloads: 0KB (types stripped at compile time)
 *
 * @see https://umami.is/docs/track-events - Umami best practices for event tracking
 * @module lib/analytics/events.constants
 */

/**
 * ============================================
 * EVENT NAMES (STATIC CONST - TREE-SHAKEABLE)
 * ============================================
 *
 * Static const object - fully tree-shakeable, no side effects.
 * Components can import this without pulling in EVENT_CONFIG.
 * 100% auto-generated from UNIFIED_CATEGORY_REGISTRY.
 */
export const EVENTS = {
  // ============================================
  // CONSOLIDATED EVENTS (Umami Best Practices)
  // ============================================
  // Generic events with category payload for cleaner dashboard analytics
  // Replaces 77 category-specific events with 7 generic events + dynamic properties
  CONTENT_VIEWED: 'content_viewed',
  RELATED_CLICKED: 'related_clicked',
  RELATED_VIEWED: 'related_viewed',
  SEARCH: 'search',
  CODE_COPIED: 'code_copied',
  MARKDOWN_COPIED: 'markdown_copied',
  MARKDOWN_DOWNLOADED: 'markdown_downloaded',

  // ============================================
  // CORE EVENTS (Non-category-specific)
  // ============================================

  // Related Content (Generic)
  RELATED_CONTENT_IMPRESSION: 'related_content_impression',
  CAROUSEL_NAVIGATION: 'carousel_navigation',

  // User Journey
  CONTENT_JOURNEY: 'content_journey',
  SESSION_START: 'session_start',
  SESSION_DEPTH: 'session_depth',

  // Performance
  PERFORMANCE_METRIC: 'performance_metric',
  CACHE_PERFORMANCE: 'cache_performance',
  API_LATENCY: 'api_latency',
  PAGE_LOAD_TIME: 'page_load_time',

  // Algorithm
  ALGORITHM_PERFORMANCE: 'algorithm_performance',

  // Search (Global)
  SEARCH_GLOBAL: 'search_global',
  FILTER_APPLIED: 'filter_applied',

  // Sharing & Feedback
  DOWNLOAD_RESOURCE: 'download_resource',
  SHARE_CONTENT: 'share_content',
  FEEDBACK_SUBMITTED: 'feedback_submitted',

  // Email Capture
  EMAIL_MODAL_SHOWN: 'email_modal_shown',
  EMAIL_MODAL_DISMISSED: 'email_modal_dismissed',
  EMAIL_SUBSCRIBED_FOOTER: 'email_subscribed_footer',
  EMAIL_SUBSCRIBED_INLINE: 'email_subscribed_inline',
  EMAIL_SUBSCRIBED_POST_COPY: 'email_subscribed_post_copy',
  EMAIL_SUBSCRIBED_HOMEPAGE: 'email_subscribed_homepage',
  EMAIL_SUBSCRIBED_MODAL: 'email_subscribed_modal',
  EMAIL_SUBSCRIBED_CONTENT_PAGE: 'email_subscribed_content_page',

  // Growth Tools - Interactive Lead Capture
  EXIT_INTENT_SHOWN: 'exit_intent_shown',
  EXIT_INTENT_DISMISSED: 'exit_intent_dismissed',
  EXIT_INTENT_CONVERTED: 'exit_intent_converted',
  SCROLL_TRIGGER_SHOWN: 'scroll_trigger_shown',
  SCROLL_TRIGGER_CONVERTED: 'scroll_trigger_converted',
  TIME_DELAYED_SHOWN: 'time_delayed_shown',
  TIME_DELAYED_DISMISSED: 'time_delayed_dismissed',
  TIME_DELAYED_CONVERTED: 'time_delayed_converted',
  ROI_CALCULATOR_STARTED: 'roi_calculator_started',
  ROI_CALCULATOR_COMPLETED: 'roi_calculator_completed',
  ROI_CALCULATOR_EMAIL_CAPTURED: 'roi_calculator_email_captured',
  SPONSORSHIP_CALCULATOR_STARTED: 'sponsorship_calculator_started',
  SPONSORSHIP_CALCULATOR_COMPLETED: 'sponsorship_calculator_completed',
  MEDIA_KIT_REQUESTED: 'media_kit_requested',

  // PWA / App Installation
  PWA_INSTALLABLE: 'pwa_installable',
  PWA_PROMPT_ACCEPTED: 'pwa_prompt_accepted',
  PWA_PROMPT_DISMISSED: 'pwa_prompt_dismissed',
  PWA_INSTALLED: 'pwa_installed',
  PWA_LAUNCHED: 'pwa_launched',

  // Error Tracking
  ERROR_OCCURRED: 'error_occurred',
  NOT_FOUND: 'not_found',
  API_ERROR: 'api_error',

  // Content Activation
  MCP_INSTALLED: 'mcp_installed',
  AGENT_ACTIVATED: 'agent_activated',
  COMMAND_EXECUTED: 'command_executed',
  RULE_APPLIED: 'rule_applied',
  HOOK_TRIGGERED: 'hook_triggered',

  // Navigation
  TAB_SWITCHED: 'tab_switched',
  FILTER_TOGGLED: 'filter_toggled',
  SORT_CHANGED: 'sort_changed',
  PAGINATION_CLICKED: 'pagination_clicked',

  // Personalization
  PERSONALIZATION_AFFINITY_CALCULATED: 'personalization_affinity_calculated',
  PERSONALIZATION_RECOMMENDATION_SHOWN: 'personalization_recommendation_shown',
  PERSONALIZATION_RECOMMENDATION_CLICKED: 'personalization_recommendation_clicked',
  PERSONALIZATION_SIMILAR_CONFIG_CLICKED: 'personalization_similar_config_clicked',
  PERSONALIZATION_FOR_YOU_VIEWED: 'personalization_for_you_viewed',
  PERSONALIZATION_USAGE_RECOMMENDATION_SHOWN: 'personalization_usage_recommendation_shown',
} as const;

/**
 * Type helper for event names
 */
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

/**
 * ============================================
 * EVENT CONFIGURATION (LAZY INITIALIZATION)
 * ============================================
 *
 * Tree-shaking optimization: EVENT_CONFIG is built lazily via getEventConfig().
 * Components importing only EVENTS will NOT include this code in their bundle.
 * Only tracker.ts uses this, saving ~5KB per route for other components.
 */

/**
 * Event configuration interface
 */
interface EventConfig {
  description: string;
  category:
    | 'CONTENT'
    | 'JOURNEY'
    | 'PERFORMANCE'
    | 'INTERACTION'
    | 'ERROR'
    | 'FEATURE'
    | 'NAVIGATION'
    | 'PERSONALIZATION';
  enabled: boolean;
  sampleRate?: number;
  debugOnly?: boolean;
}

/**
 * Build event configurations
 * Static configuration for all analytics events
 */
function buildEventConfig(): Record<EventName, EventConfig> {
  return {
    // ============================================
    // CONSOLIDATED EVENTS (Umami Best Practices)
    // ============================================
    [EVENTS.CONTENT_VIEWED]: {
      description: 'User views content detail page',
      category: 'CONTENT',
      enabled: true,
    },
    [EVENTS.RELATED_CLICKED]: {
      description: 'User clicks related content',
      category: 'CONTENT',
      enabled: true,
    },
    [EVENTS.RELATED_VIEWED]: {
      description: 'Related content viewed on detail page',
      category: 'CONTENT',
      enabled: true,
    },
    [EVENTS.SEARCH]: {
      description: 'User searches within a section',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.CODE_COPIED]: {
      description: 'User copies code from detail page',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.MARKDOWN_COPIED]: {
      description: 'User copies content as markdown',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.MARKDOWN_DOWNLOADED]: {
      description: 'User downloads content as markdown file',
      category: 'INTERACTION',
      enabled: true,
    },

    // ============================================
    // CORE EVENTS (Non-category-specific)
    // ============================================

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

    // Growth Tools - Interactive Lead Capture
    [EVENTS.EXIT_INTENT_SHOWN]: {
      description: 'Exit intent modal shown to user',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.EXIT_INTENT_DISMISSED]: {
      description: 'User dismissed exit intent modal',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.EXIT_INTENT_CONVERTED]: {
      description: 'User subscribed via exit intent modal',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.SCROLL_TRIGGER_SHOWN]: {
      description: 'Scroll trigger capture shown at scroll depth',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.SCROLL_TRIGGER_CONVERTED]: {
      description: 'User subscribed via scroll trigger',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.TIME_DELAYED_SHOWN]: {
      description: 'Time-delayed modal shown after delay',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.TIME_DELAYED_DISMISSED]: {
      description: 'User dismissed time-delayed modal',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.TIME_DELAYED_CONVERTED]: {
      description: 'User subscribed via time-delayed modal',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.ROI_CALCULATOR_STARTED]: {
      description: 'User started MCP ROI calculator',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.ROI_CALCULATOR_COMPLETED]: {
      description: 'User completed MCP ROI calculator',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.ROI_CALCULATOR_EMAIL_CAPTURED]: {
      description: 'Email captured via MCP ROI calculator',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.SPONSORSHIP_CALCULATOR_STARTED]: {
      description: 'User started sponsorship ROI calculator',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.SPONSORSHIP_CALCULATOR_COMPLETED]: {
      description: 'User completed sponsorship ROI calculator',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.MEDIA_KIT_REQUESTED]: {
      description: 'User requested media kit download',
      category: 'INTERACTION',
      enabled: true,
    },

    // PWA / App Installation
    [EVENTS.PWA_INSTALLABLE]: {
      description: 'PWA install prompt available to user',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.PWA_PROMPT_ACCEPTED]: {
      description: 'User accepted PWA install prompt',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.PWA_PROMPT_DISMISSED]: {
      description: 'User dismissed PWA install prompt',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.PWA_INSTALLED]: {
      description: 'PWA successfully installed to home screen',
      category: 'INTERACTION',
      enabled: true,
    },
    [EVENTS.PWA_LAUNCHED]: {
      description: 'App launched in standalone mode (from home screen)',
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
 * Lazy initialization cache for EVENT_CONFIG
 * Only builds when getEventConfig() is called (by tracker.ts)
 */
let _eventConfigCache: Record<EventName, EventConfig> | null = null;

/**
 * Get event configuration with lazy initialization
 *
 * Tree-shaking: This function and buildEventConfig() are only included
 * in bundles that actually call getEventConfig(). Components importing
 * only EVENTS will NOT include this code (~5KB savings per route).
 *
 * @returns Event configuration map
 */
export function getEventConfig(): Record<EventName, EventConfig> {
  if (!_eventConfigCache) {
    _eventConfigCache = buildEventConfig();
  }
  return _eventConfigCache;
}

/**
 * ============================================
 * EVENT PAYLOAD TYPE DEFINITIONS
 * ============================================
 *
 * Type-only definitions - 0KB runtime cost (types are stripped at compile time).
 * Provides full type safety and autocomplete for trackEvent() calls.
 */

/**
 * Event payload definitions for type-safe analytics tracking
 * Maps each event name to its required payload structure
 */
export interface EventPayloads {
  // ============================================
  // CORE EVENTS (Non-category-specific)
  // ============================================

  [EVENTS.RELATED_CONTENT_IMPRESSION]: {
    source_page: string;
    algorithm_version: string;
    content_ids: string;
    user_segment?: 'new' | 'returning';
  };

  [EVENTS.CAROUSEL_NAVIGATION]: {
    action: 'next' | 'previous';
    current_slide: number;
    total_slides: number;
    source_page: string;
  };

  [EVENTS.CONTENT_JOURNEY]: {
    from_page: string;
    to_page: string;
    journey_step: number;
    session_id?: string;
  };

  [EVENTS.SESSION_START]: {
    entry_page: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };

  [EVENTS.SESSION_DEPTH]: {
    pages_viewed: number;
    time_spent: number;
    categories_explored: string;
  };

  [EVENTS.PERFORMANCE_METRIC]: {
    metric: string;
    value: number;
    page?: string;
    component?: string;
  };

  [EVENTS.CACHE_PERFORMANCE]: {
    cache_hit: boolean;
    latency_ms: number;
    cache_key?: string;
    cache_size?: number;
  };

  [EVENTS.API_LATENCY]: {
    endpoint: string;
    method: string;
    duration_ms: number;
    status_code: number;
    cached: boolean;
  };

  [EVENTS.PAGE_LOAD_TIME]: {
    page: string;
    time_to_interactive: number;
    time_to_first_byte: number;
    dom_content_loaded: number;
    fully_loaded: number;
  };

  [EVENTS.ALGORITHM_PERFORMANCE]: {
    algorithm_version: string;
    match_score: number;
    user_clicked: boolean;
    position?: number;
  };

  [EVENTS.SEARCH_GLOBAL]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };

  [EVENTS.FILTER_APPLIED]: {
    filter_type: string;
    filter_value: string;
    page: string;
    results_count: number;
  };

  [EVENTS.DOWNLOAD_RESOURCE]: {
    resource_type: string;
    resource_name: string;
    file_size?: number;
    page: string;
  };

  [EVENTS.SHARE_CONTENT]: {
    content_type: string;
    content_slug: string;
    share_method: 'twitter' | 'linkedin' | 'copy_link' | 'email';
  };

  [EVENTS.FEEDBACK_SUBMITTED]: {
    feedback_type: 'helpful' | 'not_helpful' | 'report_issue';
    page: string;
    category?: string;
  };

  [EVENTS.EMAIL_MODAL_SHOWN]: {
    trigger_source: string;
    copy_type?: string;
    session_copy_count: number;
  };

  [EVENTS.EMAIL_MODAL_DISMISSED]: {
    trigger_source: string;
    dismissal_method: 'close_button' | 'overlay_click' | 'maybe_later';
    time_shown_ms: number;
  };

  [EVENTS.EMAIL_SUBSCRIBED_FOOTER]: {
    contact_id?: string;
    referrer?: string;
  };

  [EVENTS.EMAIL_SUBSCRIBED_INLINE]: {
    contact_id?: string;
    referrer?: string;
    page?: string;
    category?: string;
  };

  [EVENTS.EMAIL_SUBSCRIBED_POST_COPY]: {
    contact_id?: string;
    referrer?: string;
    copy_type?: string;
    content_category?: string;
    content_slug?: string;
  };

  [EVENTS.EMAIL_SUBSCRIBED_HOMEPAGE]: {
    contact_id?: string;
    referrer?: string;
  };

  [EVENTS.EMAIL_SUBSCRIBED_MODAL]: {
    contact_id?: string;
    referrer?: string;
    modal_context?: string;
  };

  [EVENTS.EMAIL_SUBSCRIBED_CONTENT_PAGE]: {
    contact_id?: string;
    referrer?: string;
    page?: string;
    category?: string;
  };

  // Growth Tools - Interactive Lead Capture
  [EVENTS.EXIT_INTENT_SHOWN]: {
    trigger_source: string;
    trigger_context: string;
    page: string;
  };

  [EVENTS.EXIT_INTENT_DISMISSED]: {
    trigger_source: string;
    dismissal_method: 'close_button' | 'overlay_click' | 'escape_key';
    time_shown_ms: number;
  };

  [EVENTS.EXIT_INTENT_CONVERTED]: {
    trigger_source: string;
    contact_id?: string;
    category?: string;
  };

  [EVENTS.SCROLL_TRIGGER_SHOWN]: {
    trigger_source: string;
    scroll_percentage: number;
    trigger_context: string;
    page: string;
  };

  [EVENTS.SCROLL_TRIGGER_CONVERTED]: {
    trigger_source: string;
    contact_id?: string;
    category?: string;
  };

  [EVENTS.TIME_DELAYED_SHOWN]: {
    trigger_source: string;
    delay_ms: number;
    trigger_context: string;
    page: string;
  };

  [EVENTS.TIME_DELAYED_DISMISSED]: {
    trigger_source: string;
    dismissal_method: 'close_button' | 'overlay_click' | 'escape_key';
    time_shown_ms: number;
  };

  [EVENTS.TIME_DELAYED_CONVERTED]: {
    trigger_source: string;
    contact_id?: string;
    category?: string;
  };

  [EVENTS.ROI_CALCULATOR_STARTED]: {
    trigger_source: string;
    calculator_type: 'mcp' | 'sponsorship';
  };

  [EVENTS.ROI_CALCULATOR_COMPLETED]: {
    trigger_source: string;
    calculator_type: 'mcp' | 'sponsorship';
    team_size?: string;
    hours_per_week?: number;
    hourly_rate?: number;
    monthly_savings?: number;
  };

  [EVENTS.ROI_CALCULATOR_EMAIL_CAPTURED]: {
    trigger_source: string;
    calculator_type: 'mcp' | 'sponsorship';
    monthly_savings?: number;
    contact_id?: string;
  };

  [EVENTS.SPONSORSHIP_CALCULATOR_STARTED]: {
    trigger_source: string;
  };

  [EVENTS.SPONSORSHIP_CALCULATOR_COMPLETED]: {
    trigger_source: string;
    budget: number;
    estimated_conversions?: number;
  };

  [EVENTS.MEDIA_KIT_REQUESTED]: {
    trigger_source: string;
    budget_tier?: string;
    contact_id?: string;
  };

  [EVENTS.PWA_INSTALLABLE]: {
    platform: string;
    user_agent?: string;
  };

  [EVENTS.PWA_PROMPT_ACCEPTED]: {
    platform: string;
  };

  [EVENTS.PWA_PROMPT_DISMISSED]: {
    platform: string;
  };

  [EVENTS.PWA_INSTALLED]: {
    platform: string;
    timestamp: string;
  };

  [EVENTS.PWA_LAUNCHED]: {
    platform: string;
    timestamp: string;
  };

  [EVENTS.ERROR_OCCURRED]: {
    error_type: string;
    error_code?: string;
    context?: string;
    page?: string;
  };

  [EVENTS.NOT_FOUND]: {
    requested_path: string;
    referrer?: string;
  };

  [EVENTS.API_ERROR]: {
    endpoint: string;
    status_code: number;
    error_message?: string;
  };

  [EVENTS.MCP_INSTALLED]: {
    mcp_slug: string;
    installation_method: string;
    from_page: string;
  };

  [EVENTS.AGENT_ACTIVATED]: {
    agent_slug: string;
    activation_source: string;
    configuration?: string;
  };

  [EVENTS.COMMAND_EXECUTED]: {
    command_slug: string;
    execution_context: string;
    parameters?: string;
  };

  [EVENTS.RULE_APPLIED]: {
    rule_slug: string;
    application_context: string;
  };

  [EVENTS.HOOK_TRIGGERED]: {
    hook_slug: string;
    trigger_context: string;
    execution_time?: number;
  };

  [EVENTS.TAB_SWITCHED]: {
    from_tab: string;
    to_tab: string;
    page: string;
  };

  [EVENTS.FILTER_TOGGLED]: {
    filter_name: string;
    filter_state: boolean;
    page: string;
  };

  [EVENTS.SORT_CHANGED]: {
    sort_field: string;
    sort_direction: 'asc' | 'desc';
    page: string;
  };

  [EVENTS.PAGINATION_CLICKED]: {
    from_page: number;
    to_page: number;
    total_pages: number;
    items_per_page: number;
    section: string;
  };

  [EVENTS.PERSONALIZATION_AFFINITY_CALCULATED]: {
    user_id: string;
    content_type: string;
    affinity_score: number;
    based_on_interactions: number;
  };

  [EVENTS.PERSONALIZATION_RECOMMENDATION_SHOWN]: {
    recommendation_source: string;
    position: number;
    content_slug: string;
    content_type: string;
  };

  [EVENTS.PERSONALIZATION_RECOMMENDATION_CLICKED]: {
    content_slug: string;
    content_type: string;
    position: number;
    recommendation_source: string;
  };

  [EVENTS.PERSONALIZATION_SIMILAR_CONFIG_CLICKED]: {
    source_slug: string;
    target_slug: string;
    similarity_score: number;
  };

  [EVENTS.PERSONALIZATION_FOR_YOU_VIEWED]: {
    items_shown: number;
    algorithm_version: string;
    user_has_history: boolean;
  };

  [EVENTS.PERSONALIZATION_USAGE_RECOMMENDATION_SHOWN]: {
    trigger: string;
    recommendations_count: number;
    context_type?: string;
  };

  // ============================================
  // CONSOLIDATED EVENT PAYLOADS
  // ============================================
  // Generic events with typed data (Umami best practices)
  // Replaces 77 category-specific payloads with 7 generic payloads

  [EVENTS.CONTENT_VIEWED]: {
    category: string;
    slug: string;
    page: string;
    source?: string;
    viewCount?: number;
    isFeatured?: boolean;
    rating?: number;
  };

  [EVENTS.RELATED_CLICKED]: {
    category: string;
    slug: string;
    targetCategory: string;
    targetSlug: string;
    position: number;
    impressionCount?: number;
  };

  [EVENTS.RELATED_VIEWED]: {
    category: string;
    slug: string;
    impressionCount: number;
    loadTimeMs?: number;
  };

  [EVENTS.SEARCH]: {
    category: string;
    query: string;
    resultsCount: number;
    filtersApplied?: boolean;
  };

  [EVENTS.CODE_COPIED]: {
    category: string;
    slug: string;
    contentLength: number;
    language?: string;
  };

  [EVENTS.MARKDOWN_COPIED]: {
    category: string;
    slug: string;
    contentLength: number;
    copyCount?: number;
  };

  [EVENTS.MARKDOWN_DOWNLOADED]: {
    category: string;
    slug: string;
    fileSize: number;
    downloadCount?: number;
  };
}

/**
 * Type helper to extract payload type for a specific event
 *
 * @example
 * ```typescript
 * type Payload = EventPayload<'copy_code_agent'>;
 * // Inferred as: { slug: string; content_length: number; language?: string; }
 * ```
 */
export type EventPayload<T extends keyof EventPayloads> = EventPayloads[T];
