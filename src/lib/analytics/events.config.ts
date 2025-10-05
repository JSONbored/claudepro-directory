/**
 * Centralized Umami Events Configuration
 * Single source of truth for all analytics events in the application
 *
 * To add new events:
 * 1. Add event definition to EVENTS object
 * 2. Add type to EventPayloads interface
 * 3. Use trackAnalyticsEvent() anywhere in the app
 */

// Event names as const for type safety
export const EVENTS = {
  // Content View Events
  CONTENT_VIEW: 'content_view',

  // Related Content Events
  RELATED_CONTENT_VIEW: 'related_content_view',
  RELATED_CONTENT_CLICK: 'related_content_click',
  RELATED_CONTENT_IMPRESSION: 'related_content_impression',
  CAROUSEL_NAVIGATION: 'carousel_navigation',

  // User Journey Events
  CONTENT_JOURNEY: 'content_journey',
  SESSION_START: 'session_start',
  SESSION_DEPTH: 'session_depth',

  // Performance Events
  PERFORMANCE_METRIC: 'performance_metric',
  CACHE_PERFORMANCE: 'cache_performance',
  API_LATENCY: 'api_latency',
  PAGE_LOAD_TIME: 'page_load_time',

  // Algorithm Events
  ALGORITHM_PERFORMANCE: 'algorithm_performance',
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',

  // Interaction Events
  COPY_CODE: 'copy_code',
  COPY_MARKDOWN: 'copy_markdown',
  DOWNLOAD_RESOURCE: 'download_resource',
  DOWNLOAD_MARKDOWN: 'download_markdown',
  SHARE_CONTENT: 'share_content',
  FEEDBACK_SUBMITTED: 'feedback_submitted',

  // Error Events
  ERROR_OCCURRED: 'error_occurred',
  NOT_FOUND: 'not_found',
  API_ERROR: 'api_error',

  // MCP/Agent Events
  MCP_INSTALLED: 'mcp_installed',
  AGENT_ACTIVATED: 'agent_activated',
  COMMAND_EXECUTED: 'command_executed',
  RULE_APPLIED: 'rule_applied',
  HOOK_TRIGGERED: 'hook_triggered',

  // Navigation Events
  TAB_SWITCHED: 'tab_switched',
  FILTER_TOGGLED: 'filter_toggled',
  SORT_CHANGED: 'sort_changed',
  PAGINATION_CLICKED: 'pagination_clicked',
} as const;

// Type for event names
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

// Event payload definitions
export interface EventPayloads {
  [EVENTS.CONTENT_VIEW]: {
    category: string;
    slug: string;
    page: string;
    source?: string;
  };

  [EVENTS.RELATED_CONTENT_VIEW]: {
    source_page: string;
    source_category: string;
    items_shown: number;
    algorithm_version: string;
    cache_hit: boolean;
    render_time?: number;
  };

  [EVENTS.RELATED_CONTENT_CLICK]: {
    source_page: string;
    target_page: string;
    source_category: string;
    target_category: string;
    position: number;
    match_score: number;
    match_type: string;
    time_to_click?: number;
  };

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

  [EVENTS.SEARCH_PERFORMED]: {
    query: string; // Sanitized, no PII
    results_count: number;
    category?: string;
    filters_applied?: string;
    time_to_results: number;
  };

  [EVENTS.FILTER_APPLIED]: {
    filter_type: string;
    filter_value: string;
    page: string;
    results_count: number;
  };

  [EVENTS.COPY_CODE]: {
    content_type: 'code' | 'command' | 'config';
    content_category: string;
    content_slug: string;
    content_length: number;
  };

  [EVENTS.COPY_MARKDOWN]: {
    content_category: string;
    content_slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
  };

  [EVENTS.DOWNLOAD_RESOURCE]: {
    resource_type: string;
    resource_name: string;
    file_size?: number;
    page: string;
  };

  [EVENTS.DOWNLOAD_MARKDOWN]: {
    content_category: string;
    content_slug: string;
    filename: string;
    file_size: number;
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
    error_message?: string; // Sanitized
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
    parameters?: string; // Sanitized
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
}

// Event categories for grouping and permissions
export const EVENT_CATEGORIES = {
  CONTENT: [
    EVENTS.CONTENT_VIEW,
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
    EVENTS.COPY_MARKDOWN,
    EVENTS.DOWNLOAD_RESOURCE,
    EVENTS.DOWNLOAD_MARKDOWN,
    EVENTS.SHARE_CONTENT,
    EVENTS.FEEDBACK_SUBMITTED,
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
    description: 'User views content detail page',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CONTENT_VIEW]: {
    description: 'User views related content section',
    category: 'CONTENT',
    enabled: true,
  },
  [EVENTS.RELATED_CONTENT_CLICK]: {
    description: 'User clicks on related content item',
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
    description: 'Performance measurement',
    category: 'PERFORMANCE',
    enabled: true,
    debugOnly: true,
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
    description: 'User performs search',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.FILTER_APPLIED]: {
    description: 'User applies filter',
    category: 'NAVIGATION',
    enabled: true,
  },
  [EVENTS.COPY_CODE]: {
    description: 'User copies code/command',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.COPY_MARKDOWN]: {
    description: 'User copies content as markdown',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_RESOURCE]: {
    description: 'User downloads resource',
    category: 'INTERACTION',
    enabled: true,
  },
  [EVENTS.DOWNLOAD_MARKDOWN]: {
    description: 'User downloads content as markdown file',
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
};

// Type helper for event payloads
export type EventPayload<T extends EventName> = T extends keyof EventPayloads
  ? EventPayloads[T]
  : never;
