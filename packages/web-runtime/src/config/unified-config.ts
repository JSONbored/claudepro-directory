/**
 * Unified Application Configuration
 *
 * Single source of truth for ALL application configuration.
 * Edit this file and redeploy to change any value.
 *
 * Organization:
 * - APP: Core app metadata and URLs
 * - UI: Animation, pagination, navigation settings
 * - FEATURES: Component toggles and feature flags
 * - CACHE: TTL settings and invalidation rules
 * - TIMEOUTS: API/UI timeouts and retry logic
 * - MESSAGES: Toast notifications and email subjects
 * - NEWSLETTER: CTA copy and behavior settings
 * - PRICING: Partner page pricing display
 * - FORMS: Validation limits
 *
 * @module web-runtime/config/unified-config
 */

import { Constants } from '@heyclaude/database-types';

// =============================================================================
// APP METADATA
// =============================================================================

/** Core application configuration */
export const APP_CONFIG = {
  url: 'https://claudepro.directory',
  name: 'Claude Pro Directory',
  author: 'Claude Pro Directory',
  domain: 'claudepro.directory',
  license: 'MIT',
  version: '1.0.0',
  description: 'Complete database of Claude AI configurations',
} as const;

/** Social links and contact emails */
export const SOCIAL_LINKS = {
  email: 'contact@claudepro.directory',
  github: 'https://github.com/JSONbored/claudepro-directory',
  discord: 'https://discord.gg/Ax3Py4YDrq',
  hiEmail: 'hi@claudepro.directory',
  twitter: 'https://x.com/JSONbored',
  partnerEmail: 'partner@claudepro.directory',
  supportEmail: 'support@claudepro.directory',
  authorProfile: 'https://github.com/JSONbored',
  securityEmail: 'security@claudepro.directory',
} as const;

/** External service URLs */
export const EXTERNAL_SERVICES = {
  'app.main_url': 'https://claudepro.directory',
  'app.www_url': 'https://www.claudepro.directory',
  'github.api_url': 'https://api.github.com',
  'github.site_url': 'https://github.com',
  'github.user_content_pattern': 'https://*.githubusercontent.com',
  'supabase.pattern': 'https://*.supabase.co',
  'vercel.toolbar_url': 'https://vercel.live',
  'vercel.scripts_pattern': 'https://*.vercel-scripts.com',
  'google.accounts_url': 'https://accounts.google.com',
  'umami.analytics_url': 'https://umami.claudepro.directory',
  'betterstack.status_url': 'https://status.claudepro.directory',
} as const;

/** Date configuration - updated at deploy time */
export const DATE_CONFIG = {
  currentDate: '2025-11-28',
  currentYear: 2025,
  currentMonth: 'November',
  lastReviewed: '2025-11-28',
  claudeModels: {
    opus: 'Claude Opus 4.1',
    sonnet: 'Claude Sonnet 4.5',
  },
} as const;

/** Claude desktop paths */
export const CLAUDE_DESKTOP_PATHS = {
  macos: '~/Library/Application Support/Claude/claude_desktop_config.json',
  windows: String.raw`%APPDATA%\\Claude\\claude_desktop_config.json`,
} as const;

// =============================================================================
// UI CONFIGURATION
// =============================================================================

// NOTE: UI_ANIMATION and CONFETTI_CONFIG have been moved to V2 design system
// Import from '@heyclaude/web-runtime/design-system/tokens' instead:
// - animation.spring.* (for spring physics)
// - animation.duration.* (for durations)
// - animation.ticker.* (for ticker speeds)
// - animation.stagger.* (for stagger delays)
// - animation.borderBeam.* (for border beam)
// - animation.confetti.* (for confetti settings)

/** Pagination settings */
export const PAGINATION_CONFIG = {
  maxLimit: 100,
  defaultLimit: 20,
} as const;

/** Navigation settings */
export const NAVIGATION_CONFIG = {
  'backdrop_blur': '12px',
  'scroll_threshold': 20,
  'animation_duration': 300,
  'height_default_mobile': 'h-14',
  'height_default_desktop': 'h-16',
  'height_scrolled_mobile': 'h-11',
  'height_scrolled_desktop': 'h-12',
  'mobile_swipe_threshold': 100,
} as const;

/** Media query breakpoints */
export const BREAKPOINTS = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1280px',
} as const;

/** Infinite scroll settings */
export const INFINITE_SCROLL_CONFIG = {
  enabled: true,
  batch_size: 30,
  threshold: 0.1,
  debounce_ms: 100,
  root_margin: '100px',
  max_pages: 10,
  load_more_threshold: 0.1,
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

/** Component visibility toggles */
export const COMPONENT_FLAGS = {
  'cards.show_copy_button': true,
  'cards.show_bookmark': true,
  'cards.show_view_count': true,
  'cards.show_copy_count': true,
  'cards.show_rating': true,
  'fab.show_submit_button': true,
  'fab.show_search_button': true,
  'fab.show_scroll_to_top': true,
  'fab.show_notifications': true,
  'notifications_provider': true,
  'notifications_sheet': true,
  'notifications_toasts': true,
  'copy_email.modal_enabled': true,
} as const;

/** Feature toggles */
export const FEATURE_FLAGS = {
  'exit_intent.enabled': true,
  'exit_intent.desktop_only': true,
  'exit_intent.sensitivity': 20,
  'exit_intent.trigger_delay': 3000,
  'exit_intent.cookie_key': 'exit-intent-shown',
  'exit_intent.cookie_duration': 86_400_000,
  'network_status.enabled': true,
  'network_status.poll_interval_ms': 5000,
  'local_storage.sync_across_tabs': true,
  'intersection_observer.track_visibility': true,
  'intersection_observer.default_threshold': 0.1,
  'intersection_observer.default_root_margin': '0px',
} as const;

/** Security settings */
export const SECURITY_CONFIG = {
  enabled: true,
  cache_ttl_ms: 300_000,
  log_all_events: false,
  alert_threshold: 5,
  dedup_window_ms: 60_000,
  block_repeated_violations: true,
  max_violations_per_window: 10,
} as const;

/** Rate limiting settings */
export const RATE_LIMIT_CONFIG = {
  enabled: true,
  max_requests: 100,
  window_ms: 60_000,
  block_duration_ms: 300_000,
  whitelist_ips: [] as string[],
} as const;

/** Analytics settings */
export const ANALYTICS_CONFIG = {
  enable_debug: false,
  debug_enabled: false,
  default_category: 'INTERACTION',
  pii_keywords: [
    'email', 'name', 'phone', 'address', 'ssn', 'credit', 'password',
  ],
} as const;

/** Logger settings */
export const LOGGER_CONFIG = {
  min_level: 'info',
  max_files: 5,
  max_file_size_mb: 10,
  enable_file: false,
  enable_console: true,
  structured_logging: true,
} as const;

// =============================================================================
// TIMEOUTS & RETRY LOGIC
// =============================================================================

/** UI timeouts */
export const UI_TIMEOUTS = {
  'debounce_ms': 150,
  'tooltip_ms': 300,
  'animation_ms': 300,
  'transition_ms': 200,
  'prefetch_delay_ms': 300,
  'button_success_duration_ms': 2000,
  'clipboard_reset_delay_ms': 2000,
  'modal_close_delay_ms': 300,
  'dropdown_open_delay_ms': 200,
  'hover_activate_delay_ms': 150,
  'scroll_direction_threshold_px': 100,
  'scroll_hysteresis_px': 10,
  'form_debounce_ms': 300,
  'window_focus.blur_timeout_ms': 100,
  'window_size.debounce_ms': 150,
  'window_size.throttle_ms': 100,
  'debounced_input.default_delay_ms': 300,
} as const;

/** API timeouts */
export const API_TIMEOUTS = {
  default_ms: 5000,
  long_ms: 10000,
  short_ms: 2000,
} as const;

/** Test timeouts */
export const TEST_TIMEOUTS = {
  default_ms: 5000,
  long_ms: 10000,
  network_ms: 5000,
} as const;

/** Retry configuration */
export const RETRY_CONFIG = {
  'api.initial_delay_ms': 1000,
  'api.exponential_delay_ms': 2000,
  'api.max_delay_ms': 10000,
  'email.send_delay_ms': 1000,
  'email.retry_delay_ms': 2000,
  'github.delay_ms': 1000,
  'resend.delay_ms': 1000,
  'resend.batch_size': 100,
  'resend.max_retries': 3,
  'external.delay_ms': 500,
  'database.query_spacing_ms': 100,
  'database.write_spacing_ms': 200,
  'database.transaction_retry_ms': 500,
  'build.max_retries': 3,
} as const;

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

/** Cache TTL settings (in seconds) */
export const CACHE_TTL = {
  'homepage': 3600, // 1 hour
  'content_detail': 7200, // 2 hours
  'content_list': 1800, // 30 minutes
  'content_trending': 1800, // 30 minutes
  'content_paginated': 86400, // 1 day
  'content_export': 604800, // 7 days
  'config_detail': 7200, // 2 hours
  'config_list': 1800, // 30 minutes
  'tool_detail': 7200, // 2 hours
  'tool_list': 1800, // 30 minutes
  'company_detail': 1800, // 30 minutes
  'company_list': 1800, // 30 minutes
  'company_profile': 1800, // 30 minutes
  'company_search': 300, // 5 minutes
  'related_content': 3600, // 1 hour
  'recommendations': 3600, // 1 hour
  'feeds': 600, // 10 minutes
  'seo': 86400, // 1 day
  'sitemap': 86400, // 1 day
  'status': 60, // 1 minute
  'navigation': 7200, // 2 hours
  'templates': 7200, // 2 hours
  'submission_dashboard': 900, // 15 minutes
  'user_profile': 1800, // 30 minutes
  'user_activity': 900, // 15 minutes
  'user_stats': 1800, // 30 minutes
  'user_bookmarks': 300, // 5 minutes
  'user_submissions': 300, // 5 minutes
  'user_reviews': 300, // 5 minutes
  'community': 1800, // 30 minutes
  'article': 7200, // 2 hours
  'boilerplate': 7200, // 2 hours
  'course': 7200, // 2 hours
  'book': 7200, // 2 hours
  'quiz': 3600, // 1 hour
  'search': 3600, // 1 hour
  'search_autocomplete': 3600, // 1 hour
  'search_facets': 3600, // 1 hour
  'jobs': 1800, // 30 minutes
  'jobs_detail': 1800, // 30 minutes
  'changelog': 3600, // 1 hour
  'changelog_detail': 7200, // 2 hours
  'announcements': 1800, // 30 minutes
  'account': 300, // 5 minutes
  'newsletter_count': 300, // 5 minutes
  'notifications': 300, // 5 minutes
  'contact': 3600, // 1 hour
} as const;

/** Cache behavior settings (in milliseconds) */
export const CACHE_BEHAVIOR = {
  max_ttl_ms: 3_600_000,
  default_ttl_ms: 900_000,
  stale_while_revalidate_ms: 300_000,
  enable_tags: true,
  bypass_on_auth: false,
  aggressive_mode: false,
} as const;

/** Cache invalidation tag mappings */
export const CACHE_INVALIDATION = {
  'content_create': ['content', 'homepage', 'trending'],
  'content_update': ['content', 'homepage', 'trending'],
  'content_delete': ['content', 'homepage', 'trending'],
  'config_create': ['configs', 'homepage'],
  'config_update': ['configs', 'homepage'],
  'config_delete': ['configs', 'homepage'],
  'tool_create': ['tools', 'homepage'],
  'tool_update': ['tools', 'homepage'],
  'tool_delete': ['tools', 'homepage'],
  'company_create': ['companies'],
  'company_update': ['companies'],
  'company_delete': ['companies'],
  'user_update': ['users'],
  'user_profile_oauth': ['users'],
  'bookmark_create': ['user-bookmarks', 'users'],
  'bookmark_delete': ['user-bookmarks', 'users'],
  'follow': ['users'],
  'oauth_unlink': ['users'],
  'vote': ['content', 'trending'],
  'job_create': ['jobs', 'companies'],
  'job_update': ['jobs', 'companies'],
  'job_delete': ['jobs', 'companies'],
  'job_status': ['jobs', 'companies'],
  'sponsored_tracking': ['jobs', 'companies'],
  'collection_create': ['collections', 'users'],
  'collection_update': ['collections', 'users'],
  'collection_delete': ['collections', 'users'],
  'collection_items': ['collections', 'users'],
  'review_create': ['content', 'homepage', 'trending'],
  'review_update': ['content'],
  'review_delete': ['content'],
  'review_helpful': ['content'],
  'notifications': ['notifications'],
  'submission_create': ['submissions'],
  'contact_submission': ['contact', 'submissions'],
  'usage_tracking': ['content'],
  'changelog': ['changelog'],
  'newsletter_subscribe': ['newsletter'],
} as const;

// =============================================================================
// QUEUE & BATCH SETTINGS
// =============================================================================

/** Queue batch sizes */
export const QUEUE_CONFIG = {
  'pulse.batch_size': 100,
  'changelog_process.batch_size': 5,
  'changelog_notify.batch_size': 5,
} as const;

// =============================================================================
// MESSAGES
// =============================================================================

/** Toast notification messages */
export const TOAST_MESSAGES = {
  'profile_updated': 'Profile updated successfully',
  'signed_out': 'Signed out successfully',
  'submission_created_title': 'Submission Created!',
  'submission_created_description': 'Your {contentType} has been submitted for review.',
  'template_applied_title': 'Template Applied!',
  'template_applied_description': 'Form has been pre-filled. Customize as needed.',
  'copied': 'Copied to clipboard!',
  'link_copied': 'Link copied to clipboard!',
  'code_copied': 'Code copied to clipboard!',
  'screenshot_copied': 'Screenshot copied & downloaded!',
  'bookmark_added': 'Bookmark added',
  'bookmark_removed': 'Bookmark removed',
  'changes_saved': 'Changes saved successfully',
  'save_failed': 'Failed to save. Please try again.',
  'required_fields': 'Please fill in all required fields',
  'auth_required': 'Please sign in to continue',
  'permission_denied': 'You do not have permission to perform this action',
  'submission_error_title': 'Submission Error',
  'submission_error_description': 'Failed to submit. Please try again.',
  'network_error': 'Network error. Please check your connection and try again.',
  'server_error': 'Server error. Please try again later.',
  'rate_limited': 'Too many requests. Please wait a moment and try again.',
  'screenshot_failed': 'Failed to generate screenshot',
  'profile_update_failed': 'Failed to update profile',
  'vote_update_failed': 'Failed to update vote',
  'coming_soon': 'Coming soon!',
  'redirecting': 'Redirecting...',
  'unsaved_changes': 'You have unsaved changes',
  'slow_connection': 'Slow connection detected. This may take longer than usual.',
  'saving': 'Saving...',
  'processing': 'Processing...',
} as const;

/** Email subject lines */
export const EMAIL_SUBJECTS = {
  'welcome': 'Welcome to Claude Pro Directory! 🎉',
  'magic_link': 'Your Magic Link - Claude Pro Directory',
  'password_reset': 'Reset Your Password - Claude Pro Directory',
  'job_posted': 'Your Job Listing is Live!',
  'collection_shared': 'Someone shared a collection with you!',
} as const;

// =============================================================================
// NEWSLETTER
// =============================================================================

/** Newsletter CTA copy */
export const NEWSLETTER_CTA = {
  'aggressive.headline': 'Join 500+ subscribers getting exclusive Claude configs',
  'aggressive.description': 'Be the first to access new agents, MCP servers, and advanced prompts. Limited spots available.',
  'social_proof.headline': '500+ Claude users already subscribed',
  'social_proof.description': 'Join developers from Anthropic, Google, and leading AI companies who read our newsletter.',
  'value_focused.headline': 'Get weekly Claude resources & updates',
  'value_focused.description': 'Weekly roundup of the best Claude configurations, tutorials, and community highlights.',
  'contextual.agents.headline': 'Master Agents & Prompts',
  'contextual.agents.description': 'Get weekly agent templates, advanced prompting techniques, and expert tutorials delivered to your inbox.',
  'contextual.mcp.headline': 'MCP Integration Secrets',
  'contextual.mcp.description': 'Stay ahead with weekly MCP server tutorials, integration guides, and new server announcements.',
  'contextual.guides.headline': 'Level Up Your Claude Skills',
  'contextual.guides.description': 'Get in-depth guides, best practices, and expert tips for mastering Claude delivered weekly.',
  'footer_text': 'Free weekly newsletter • Unsubscribe anytime',
} as const;

/** Newsletter behavior settings */
export const NEWSLETTER_BEHAVIOR = {
  show_subscriber_count: true,
  show_footer_bar: true,
  show_scroll_trigger: true,
  footer_bar_show_after_delay_ms: 30000,
  scroll_trigger_min_scroll_height_px: 500,
  max_retries: 3,
  initial_retry_delay_ms: 1000,
  retry_backoff_multiplier: 2,
  excluded_pages: [
    '/', '/trending', '/guides', '/board', '/changelog', '/community',
    '/companies', '/for-you', '/jobs', '/partner', '/submit',
    '/tools/config-recommender', '/agents/', '/mcp/', '/rules/',
    '/commands/', '/hooks/', '/statuslines/', '/collections/',
  ],
} as const;

// =============================================================================
// PRICING
// =============================================================================

/** Pricing configuration */
export const PRICING_CONFIG = {
  'jobs.regular': 249,
  'jobs.discounted': 149,
  'jobs.duration_days': 30,
  'sponsored.regular': 199,
  'sponsored.discounted': 119,
  'launch_discount_percent': 40,
  'launch_discount_enabled': true,
  'launch_discount_end_date': '2025-12-31',
} as const;

// =============================================================================
// FORMS
// =============================================================================

/** Form validation limits */
export const FORM_CONFIG = {
  max_file_size_mb: 5,
  max_image_dimension_px: 2048,
  max_review_length: 2000,
  min_review_length: 10,
  review_helpful_threshold: 3,
  review_auto_approve_score: 0.8,
} as const;

/** Recently viewed settings */
export const RECENTLY_VIEWED_CONFIG = {
  ttl_days: 30,
  max_items: 10,
  max_description_length: 150,
  max_tags: 5,
} as const;

// =============================================================================
// SEARCH
// =============================================================================

/** Search settings */
export const SEARCH_CONFIG = {
  threshold: 0.3,
  debounce_ms: 150,
  max_results: 50,
} as const;

// =============================================================================
// HOMEPAGE
// =============================================================================

/** Homepage configuration */
export const HOMEPAGE_CONFIG = {
  featured_categories: [
    Constants.public.Enums.content_category[0], // 'agents'
    Constants.public.Enums.content_category[1], // 'mcp'
    Constants.public.Enums.content_category[3], // 'commands'
    Constants.public.Enums.content_category[2], // 'rules'
    Constants.public.Enums.content_category[6], // 'skills'
    Constants.public.Enums.content_category[8], // 'collections'
    Constants.public.Enums.content_category[4], // 'hooks'
    Constants.public.Enums.content_category[5], // 'statuslines'
  ],
  tab_categories: [
    'all',
    Constants.public.Enums.content_category[0], // 'agents'
    Constants.public.Enums.content_category[1], // 'mcp'
    Constants.public.Enums.content_category[3], // 'commands'
    Constants.public.Enums.content_category[2], // 'rules'
    Constants.public.Enums.content_category[4], // 'hooks'
    Constants.public.Enums.content_category[5], // 'statuslines'
    Constants.public.Enums.content_category[8], // 'collections'
    Constants.public.Enums.content_category[7], // 'guides'
    'community',
  ],
} as const;

// =============================================================================
// SITEMAP
// =============================================================================

/** Sitemap configuration */
export const SITEMAP_CONFIG = {
  exclude_patterns: [
    '/login', '/auth/*', '/auth-code-error', '/account', '/account/*',
    '/api/*', '/board/new', '*/new', '*/edit', '*/analytics',
    '/tools/*/results/*', '(auth)/*', '(seo)/*',
  ],
  priority_overrides: {
    '/': 1, '/u/*': 0.6, '/guides': 0.7, '/trending': 0.8,
    '/ph-bundle': 0.9, '/ph-waitlist': 0.8,
  },
  changefreq_overrides: {
    '/': 'daily', '/u/*': 'weekly', '/trending': 'daily',
    '/changelog': 'daily', '/ph-bundle': 'weekly', '/ph-waitlist': 'weekly',
  },
} as const;

/** Local storage prohibited patterns */
export const LOCAL_STORAGE_PROHIBITED = [
  'password', 'token', 'secret', 'key', 'auth', 'session', 'credit',
  'ssn', 'license', 'passport', 'apikey', 'api_key', 'access_token',
  'refresh_token', 'bearer', 'jwt', 'oauth', 'private', 'confidential',
  'sensitive', 'pii',
] as const;

// =============================================================================
// POLLING
// =============================================================================

/** Polling intervals (in milliseconds) */
export const POLLING_CONFIG = {
  realtime_ms: 1000,
  badges_ms: 30000,
  'status.health_ms': 60000,
  'status.api_ms': 30000,
  'status.database_ms': 120000,
  'analytics.views_ms': 60000,
  'analytics.stats_ms': 300000,
  newsletter_count_ms: 300000,
} as const;

