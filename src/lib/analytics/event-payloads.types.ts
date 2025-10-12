/**
 * Analytics Event Payload Type Definitions
 *
 * Type-only file containing EventPayloads interface for analytics events.
 * Split from events.config.ts to reduce bundle size - most components only
 * need the EVENTS const, not the full payload type definitions.
 *
 * Bundle Impact:
 * - This file: ~1300 lines of type definitions (0KB at runtime - types are stripped)
 * - Only imported where type checking is needed (event-mapper.ts, etc.)
 * - Dramatically reduces bundle for components that only need event names
 *
 * Import Cycle Prevention:
 * - Imports EVENTS from events.constants.ts (not events.config.ts)
 * - This breaks the circular dependency between event-payloads.types.ts and events.config.ts
 *
 * @module lib/analytics/event-payloads.types
 */

import { EVENTS } from './events.constants';

/**
 * Event payload definitions for type-safe analytics tracking
 *
 * Maps each event name to its required payload structure.
 * Provides autocomplete and compile-time validation for event data.
 */
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
