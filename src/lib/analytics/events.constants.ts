/**
 * Analytics Event Names Constants
 * Single source of truth for all analytics event names
 *
 * Separated from events.config.ts to break import cycle between
 * events.config.ts and event-payloads.types.ts
 *
 * This file contains ONLY the EVENTS constant object with no dependencies,
 * allowing it to be safely imported by both:
 * - event-payloads.types.ts (for type definitions)
 * - events.config.ts (for event configuration)
 *
 * @module lib/analytics/events.constants
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

  // Email Capture Events (segmented by trigger source)
  EMAIL_CAPTURED: 'email_captured', // Legacy - kept for backward compatibility
  EMAIL_MODAL_SHOWN: 'email_modal_shown',
  EMAIL_MODAL_DISMISSED: 'email_modal_dismissed',
  EMAIL_SUBSCRIBED_FOOTER: 'email_subscribed_footer',
  EMAIL_SUBSCRIBED_INLINE: 'email_subscribed_inline',
  EMAIL_SUBSCRIBED_POST_COPY: 'email_subscribed_post_copy',
  EMAIL_SUBSCRIBED_HOMEPAGE: 'email_subscribed_homepage',
  EMAIL_SUBSCRIBED_MODAL: 'email_subscribed_modal',
  EMAIL_SUBSCRIBED_CONTENT_PAGE: 'email_subscribed_content_page',

  // Error Tracking
  ERROR_OCCURRED: 'error_occurred',
  NOT_FOUND: 'not_found',
  API_ERROR: 'api_error',

  // Content Activation Events
  MCP_INSTALLED: 'mcp_installed',
  AGENT_ACTIVATED: 'agent_activated',
  COMMAND_EXECUTED: 'command_executed',
  RULE_APPLIED: 'rule_applied',
  HOOK_TRIGGERED: 'hook_triggered',

  // Interaction Events - Navigation
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

/**
 * Type helper for event names
 */
export type EventName = (typeof EVENTS)[keyof typeof EVENTS];
