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
  // Content View Events (segmented by type for better Umami insights)
  CONTENT_VIEW: 'content_view', // Legacy - kept for backward compatibility
  CONTENT_VIEW_AGENT: 'content_view_agent',
  CONTENT_VIEW_MCP: 'content_view_mcp',
  CONTENT_VIEW_COMMAND: 'content_view_command',
  CONTENT_VIEW_RULE: 'content_view_rule',
  CONTENT_VIEW_HOOK: 'content_view_hook',
  CONTENT_VIEW_STATUSLINE: 'content_view_statusline',
  CONTENT_VIEW_COLLECTION: 'content_view_collection',

  // Related Content Events
  RELATED_CONTENT_VIEW: 'related_content_view', // Legacy
  RELATED_CONTENT_CLICK: 'related_content_click', // Legacy
  RELATED_CONTENT_IMPRESSION: 'related_content_impression',

  // Related Content Click Events (segmented by source type)
  RELATED_CLICK_FROM_AGENT: 'related_click_from_agent',
  RELATED_CLICK_FROM_MCP: 'related_click_from_mcp',
  RELATED_CLICK_FROM_COMMAND: 'related_click_from_command',
  RELATED_CLICK_FROM_RULE: 'related_click_from_rule',
  RELATED_CLICK_FROM_HOOK: 'related_click_from_hook',
  RELATED_CLICK_FROM_STATUSLINE: 'related_click_from_statusline',
  RELATED_CLICK_FROM_COLLECTION: 'related_click_from_collection',
  RELATED_CLICK_FROM_GUIDE: 'related_click_from_guide',

  // Related Content View Events (segmented by source type)
  RELATED_VIEW_ON_AGENT: 'related_view_on_agent',
  RELATED_VIEW_ON_MCP: 'related_view_on_mcp',
  RELATED_VIEW_ON_COMMAND: 'related_view_on_command',
  RELATED_VIEW_ON_RULE: 'related_view_on_rule',
  RELATED_VIEW_ON_HOOK: 'related_view_on_hook',
  RELATED_VIEW_ON_STATUSLINE: 'related_view_on_statusline',
  RELATED_VIEW_ON_COLLECTION: 'related_view_on_collection',
  RELATED_VIEW_ON_GUIDE: 'related_view_on_guide',

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

  // Search Events (segmented by context for better insights)
  SEARCH_PERFORMED: 'search_performed', // Legacy - kept for backward compatibility
  SEARCH_GLOBAL: 'search_global',
  SEARCH_AGENTS: 'search_agents',
  SEARCH_MCP: 'search_mcp',
  SEARCH_COMMANDS: 'search_commands',
  SEARCH_RULES: 'search_rules',
  SEARCH_HOOKS: 'search_hooks',
  SEARCH_STATUSLINES: 'search_statuslines',
  SEARCH_COLLECTIONS: 'search_collections',
  SEARCH_GUIDES: 'search_guides',

  FILTER_APPLIED: 'filter_applied',

  // Interaction Events - Copy (segmented by content type)
  COPY_CODE: 'copy_code', // Legacy - kept for backward compatibility
  COPY_CODE_AGENT: 'copy_code_agent',
  COPY_CODE_MCP: 'copy_code_mcp',
  COPY_CODE_COMMAND: 'copy_code_command',
  COPY_CODE_RULE: 'copy_code_rule',
  COPY_CODE_HOOK: 'copy_code_hook',
  COPY_CODE_STATUSLINE: 'copy_code_statusline',
  COPY_CODE_GUIDE: 'copy_code_guide',
  COPY_CODE_OTHER: 'copy_code_other',

  COPY_MARKDOWN: 'copy_markdown', // Legacy
  COPY_MARKDOWN_AGENT: 'copy_markdown_agent',
  COPY_MARKDOWN_MCP: 'copy_markdown_mcp',
  COPY_MARKDOWN_COMMAND: 'copy_markdown_command',
  COPY_MARKDOWN_RULE: 'copy_markdown_rule',
  COPY_MARKDOWN_HOOK: 'copy_markdown_hook',
  COPY_MARKDOWN_STATUSLINE: 'copy_markdown_statusline',
  COPY_MARKDOWN_COLLECTION: 'copy_markdown_collection',
  COPY_MARKDOWN_OTHER: 'copy_markdown_other',

  DOWNLOAD_RESOURCE: 'download_resource',
  DOWNLOAD_MARKDOWN: 'download_markdown', // Legacy
  DOWNLOAD_MARKDOWN_AGENT: 'download_markdown_agent',
  DOWNLOAD_MARKDOWN_MCP: 'download_markdown_mcp',
  DOWNLOAD_MARKDOWN_COMMAND: 'download_markdown_command',
  DOWNLOAD_MARKDOWN_RULE: 'download_markdown_rule',
  DOWNLOAD_MARKDOWN_HOOK: 'download_markdown_hook',
  DOWNLOAD_MARKDOWN_STATUSLINE: 'download_markdown_statusline',
  DOWNLOAD_MARKDOWN_COLLECTION: 'download_markdown_collection',
  DOWNLOAD_MARKDOWN_OTHER: 'download_markdown_other',
  SHARE_CONTENT: 'share_content',
  FEEDBACK_SUBMITTED: 'feedback_submitted',

  // Email Capture Events
  EMAIL_CAPTURED: 'email_captured',
  EMAIL_MODAL_SHOWN: 'email_modal_shown',
  EMAIL_MODAL_DISMISSED: 'email_modal_dismissed',

  // Email Subscription Success Events (by location)
  EMAIL_SUBSCRIBED_FOOTER: 'email_subscribed_footer',
  EMAIL_SUBSCRIBED_INLINE: 'email_subscribed_inline',
  EMAIL_SUBSCRIBED_POST_COPY: 'email_subscribed_post_copy',
  EMAIL_SUBSCRIBED_HOMEPAGE: 'email_subscribed_homepage',
  EMAIL_SUBSCRIBED_MODAL: 'email_subscribed_modal',
  EMAIL_SUBSCRIBED_CONTENT_PAGE: 'email_subscribed_content_page',

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

  // Personalization Events
  PERSONALIZATION_AFFINITY_CALCULATED: 'personalization_affinity_calculated',
  PERSONALIZATION_RECOMMENDATION_SHOWN: 'personalization_recommendation_shown',
  PERSONALIZATION_RECOMMENDATION_CLICKED: 'personalization_recommendation_clicked',
  PERSONALIZATION_SIMILAR_CONFIG_CLICKED: 'personalization_similar_config_clicked',
  PERSONALIZATION_FOR_YOU_VIEWED: 'personalization_for_you_viewed',
  PERSONALIZATION_USAGE_RECOMMENDATION_SHOWN: 'personalization_usage_recommendation_shown',
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

  [EVENTS.CONTENT_VIEW_AGENT]: {
    slug: string;
    page: string;
    source?: string;
  };

  [EVENTS.CONTENT_VIEW_MCP]: {
    slug: string;
    page: string;
    source?: string;
  };

  [EVENTS.CONTENT_VIEW_COMMAND]: {
    slug: string;
    page: string;
    source?: string;
  };

  [EVENTS.CONTENT_VIEW_RULE]: {
    slug: string;
    page: string;
    source?: string;
  };

  [EVENTS.CONTENT_VIEW_HOOK]: {
    slug: string;
    page: string;
    source?: string;
  };

  [EVENTS.CONTENT_VIEW_STATUSLINE]: {
    slug: string;
    page: string;
    source?: string;
  };

  [EVENTS.CONTENT_VIEW_COLLECTION]: {
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

  // Related Content Click Events (segmented) - cleaner payload without redundant source_category
  [EVENTS.RELATED_CLICK_FROM_AGENT]: {
    target_slug: string;
    target_category: string;
    position: number;
    match_score: number;
    match_type: string;
  };

  [EVENTS.RELATED_CLICK_FROM_MCP]: {
    target_slug: string;
    target_category: string;
    position: number;
    match_score: number;
    match_type: string;
  };

  [EVENTS.RELATED_CLICK_FROM_COMMAND]: {
    target_slug: string;
    target_category: string;
    position: number;
    match_score: number;
    match_type: string;
  };

  [EVENTS.RELATED_CLICK_FROM_RULE]: {
    target_slug: string;
    target_category: string;
    position: number;
    match_score: number;
    match_type: string;
  };

  [EVENTS.RELATED_CLICK_FROM_HOOK]: {
    target_slug: string;
    target_category: string;
    position: number;
    match_score: number;
    match_type: string;
  };

  [EVENTS.RELATED_CLICK_FROM_STATUSLINE]: {
    target_slug: string;
    target_category: string;
    position: number;
    match_score: number;
    match_type: string;
  };

  [EVENTS.RELATED_CLICK_FROM_COLLECTION]: {
    target_slug: string;
    target_category: string;
    position: number;
    match_score: number;
    match_type: string;
  };

  [EVENTS.RELATED_CLICK_FROM_GUIDE]: {
    target_slug: string;
    target_category: string;
    position: number;
    match_score: number;
    match_type: string;
  };

  // Related Content View Events (segmented) - cleaner payload without redundant source_category
  [EVENTS.RELATED_VIEW_ON_AGENT]: {
    items_shown: number;
    cache_hit: boolean;
  };

  [EVENTS.RELATED_VIEW_ON_MCP]: {
    items_shown: number;
    cache_hit: boolean;
  };

  [EVENTS.RELATED_VIEW_ON_COMMAND]: {
    items_shown: number;
    cache_hit: boolean;
  };

  [EVENTS.RELATED_VIEW_ON_RULE]: {
    items_shown: number;
    cache_hit: boolean;
  };

  [EVENTS.RELATED_VIEW_ON_HOOK]: {
    items_shown: number;
    cache_hit: boolean;
  };

  [EVENTS.RELATED_VIEW_ON_STATUSLINE]: {
    items_shown: number;
    cache_hit: boolean;
  };

  [EVENTS.RELATED_VIEW_ON_COLLECTION]: {
    items_shown: number;
    cache_hit: boolean;
  };

  [EVENTS.RELATED_VIEW_ON_GUIDE]: {
    items_shown: number;
    cache_hit: boolean;
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

  [EVENTS.SEARCH_GLOBAL]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };

  [EVENTS.SEARCH_AGENTS]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };

  [EVENTS.SEARCH_MCP]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };

  [EVENTS.SEARCH_COMMANDS]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };

  [EVENTS.SEARCH_RULES]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };

  [EVENTS.SEARCH_HOOKS]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };

  [EVENTS.SEARCH_STATUSLINES]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };

  [EVENTS.SEARCH_COLLECTIONS]: {
    query: string;
    results_count: number;
    filters_applied: boolean;
    time_to_results: number;
  };

  [EVENTS.SEARCH_GUIDES]: {
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

  [EVENTS.COPY_CODE]: {
    content_type: 'code' | 'command' | 'config';
    content_category: string;
    content_slug: string;
    content_length: number;
  };

  [EVENTS.COPY_CODE_AGENT]: {
    slug: string;
    content_length: number;
    language?: string;
  };

  [EVENTS.COPY_CODE_MCP]: {
    slug: string;
    content_length: number;
    language?: string;
  };

  [EVENTS.COPY_CODE_COMMAND]: {
    slug: string;
    content_length: number;
    language?: string;
  };

  [EVENTS.COPY_CODE_RULE]: {
    slug: string;
    content_length: number;
    language?: string;
  };

  [EVENTS.COPY_CODE_HOOK]: {
    slug: string;
    content_length: number;
    language?: string;
  };

  [EVENTS.COPY_CODE_STATUSLINE]: {
    slug: string;
    content_length: number;
    language?: string;
  };

  [EVENTS.COPY_CODE_GUIDE]: {
    slug: string;
    content_length: number;
    language?: string;
  };

  [EVENTS.COPY_CODE_OTHER]: {
    slug: string;
    content_length: number;
    language?: string;
    page?: string;
  };

  [EVENTS.COPY_MARKDOWN]: {
    content_category: string;
    content_slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
  };

  [EVENTS.COPY_MARKDOWN_AGENT]: {
    slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
  };

  [EVENTS.COPY_MARKDOWN_MCP]: {
    slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
  };

  [EVENTS.COPY_MARKDOWN_COMMAND]: {
    slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
  };

  [EVENTS.COPY_MARKDOWN_RULE]: {
    slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
  };

  [EVENTS.COPY_MARKDOWN_HOOK]: {
    slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
  };

  [EVENTS.COPY_MARKDOWN_STATUSLINE]: {
    slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
  };

  [EVENTS.COPY_MARKDOWN_COLLECTION]: {
    slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
  };

  [EVENTS.COPY_MARKDOWN_OTHER]: {
    slug: string;
    include_metadata: boolean;
    include_footer: boolean;
    content_length: number;
    page?: string;
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

  [EVENTS.DOWNLOAD_MARKDOWN_AGENT]: {
    slug: string;
    filename: string;
    file_size: number;
  };

  [EVENTS.DOWNLOAD_MARKDOWN_MCP]: {
    slug: string;
    filename: string;
    file_size: number;
  };

  [EVENTS.DOWNLOAD_MARKDOWN_COMMAND]: {
    slug: string;
    filename: string;
    file_size: number;
  };

  [EVENTS.DOWNLOAD_MARKDOWN_RULE]: {
    slug: string;
    filename: string;
    file_size: number;
  };

  [EVENTS.DOWNLOAD_MARKDOWN_HOOK]: {
    slug: string;
    filename: string;
    file_size: number;
  };

  [EVENTS.DOWNLOAD_MARKDOWN_STATUSLINE]: {
    slug: string;
    filename: string;
    file_size: number;
  };

  [EVENTS.DOWNLOAD_MARKDOWN_COLLECTION]: {
    slug: string;
    filename: string;
    file_size: number;
  };

  [EVENTS.DOWNLOAD_MARKDOWN_OTHER]: {
    slug: string;
    filename: string;
    file_size: number;
    page?: string;
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

  [EVENTS.EMAIL_CAPTURED]: {
    trigger_source: 'post_copy' | 'cta' | 'footer' | 'modal';
    copy_type?: 'llmstxt' | 'markdown' | 'code' | 'link';
    content_category?: string;
    content_slug?: string;
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
}

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

// Type helper for event payloads
export type EventPayload<T extends EventName> = T extends keyof EventPayloads
  ? EventPayloads[T]
  : never;
