export const FLAG_KEYS = {
  // Test
  TEST_FLAG: 'test_flag',

  // Growth features
  REFERRAL_PROGRAM: 'referral_program',
  CONFETTI_ANIMATIONS: 'confetti_animations',
  RECENTLY_VIEWED: 'recently_viewed_sidebar',
  COMPARE_CONFIGS: 'compare_configs',

  // Monetization features
  PROMOTED_CONFIGS: 'promoted_configs',
  JOB_ALERTS: 'job_alerts',
  SELF_SERVICE_CHECKOUT: 'self_service_checkout',

  // UX enhancements
  CONTENT_DETAIL_TABS: 'content_detail_tabs',
  INTERACTIVE_ONBOARDING: 'interactive_onboarding',
  CONFIG_PLAYGROUND: 'config_playground',
  CONTACT_TERMINAL_ENABLED: 'contact_terminal_enabled',

  // Infrastructure
  PUBLIC_API: 'public_api',
  ENHANCED_SKELETONS: 'enhanced_skeletons',

  // UI Components
  FLOATING_ACTION_BAR: 'floating_action_bar',
  FAB_SUBMIT_ACTION: 'fab_submit_action',
  FAB_SEARCH_ACTION: 'fab_search_action',
  FAB_SCROLL_TO_TOP: 'fab_scroll_to_top',
  FAB_NOTIFICATIONS: 'fab_notifications',
  NOTIFICATIONS_PROVIDER: 'notifications_provider',
  NOTIFICATIONS_SHEET: 'notifications_sheet',
  NOTIFICATIONS_TOASTS: 'notifications_toasts',

  // Infrastructure - Logging
  LOGGER_CONSOLE: 'logger_console',
  LOGGER_VERBOSE: 'logger_verbose',
} as const;

export const EXPERIMENT_KEYS = {
  NEWSLETTER_FOOTER_DELAY: 'newsletter_footer_delay',
  NEWSLETTER_CTA_VARIANT: 'newsletter_cta_variant',
} as const;

export const DYNAMIC_CONFIG_KEYS = {
  APP_SETTINGS: 'app_settings',
  COMPONENT_CONFIGS: 'component_configs',
  EMAIL_CONFIGS: 'email_configs',
  NEWSLETTER_CONFIGS: 'newsletter_configs',
  PRICING_CONFIGS: 'pricing_configs',
  POLLING_CONFIGS: 'polling_configs',
  ANIMATION_CONFIGS: 'animation_configs',
  TIMEOUT_CONFIGS: 'timeout_configs',
  TOAST_CONFIGS: 'toast_configs',
  HOMEPAGE_CONFIGS: 'homepage_configs',
  FORM_CONFIGS: 'form_configs',
  RECENTLY_VIEWED_CONFIGS: 'recently_viewed_configs',
  CACHE_CONFIGS: 'cache_configs',
} as const;
