/**
 * Feature Flags & Dynamic Configs
 *
 * Following the official Vercel Flags SDK pattern:
 * https://vercel.com/docs/flags/getting-started
 *
 * CRITICAL: This file is server-only to prevent flags/next from being
 * analyzed during build. flags/next uses Vercel Edge Config which
 * triggers "Server Functions cannot be called" errors during static generation.
 *
 * Note: We use 'server-only' (not 'use server') because this file exports
 * regular functions, not server actions.
 */

// This import will throw an error if this module is imported in client code
import 'server-only';

import { type StatsigUser, statsigAdapter } from '@flags-sdk/statsig';
import { createServerClient } from '@supabase/ssr';
// Following official Vercel Flags SDK pattern - direct imports as shown in docs
import { dedupe, flag } from 'flags/next';
import { getAuthenticatedUserFromClient } from '../auth/get-authenticated-user.ts';
import { logger } from '../logger.ts';

/**
 * Identify function - provides user context for flag evaluation
 * Statsig uses this to do % rollouts, user targeting, etc.
 *
 * Following official pattern: wrapped in dedupe for request-level deduplication
 */
export const identify = dedupe(async ({ headers: _headers, cookies }): Promise<StatsigUser> => {
  try {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!(supabaseUrl && supabaseAnonKey)) {
      return { userID: 'anonymous' };
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll() {
          // Flags SDK cookies are read-only
        },
      },
    });

    const { user } = await getAuthenticatedUserFromClient(supabase, {
      context: 'feature_flags_identify',
    });

    const baseUser: StatsigUser = {
      userID: user?.id || 'anonymous',
    };

    if (user?.email) {
      baseUser.email = user.email;
    }

    if (user?.user_metadata?.['slug']) {
      baseUser.customIDs = {
        userSlug: user.user_metadata['slug'] as string,
      };
    }

    return baseUser;
  } catch (error) {
    logger.error(
      'Failed to identify user for feature flags, falling back to anonymous',
      error as Error,
      {
        context: 'feature_flags',
        fallback: 'anonymous',
      }
    );
    return { userID: 'anonymous' };
  }
});

/**
 * Factory function to create feature flags
 * Following the official pattern from Vercel docs
 */
export const createFeatureFlag = (key: string) => {
  return flag<boolean, StatsigUser>({
    key,
    adapter: statsigAdapter.featureGate((gate) => gate.value, {
      exposureLogging: true,
    }),
    identify,
    defaultValue: false,
  });
};

/**
 * Factory function to create experiments (A/B tests with variants)
 */
export const createExperiment = <T extends string>(key: string, defaultValue: T) => {
  return flag<T, StatsigUser>({
    key,
    adapter: statsigAdapter.experiment((exp) => exp.get('variant', defaultValue) as T, {
      exposureLogging: true,
    }),
    identify,
    defaultValue,
  });
};

/**
 * Factory function to create dynamic config groups (runtime-tunable values)
 */
export const createDynamicConfigGroup = <T extends Record<string, unknown>>(
  configName: string,
  defaults: T
) => {
  return flag<T, StatsigUser>({
    key: configName,
    adapter: statsigAdapter.dynamicConfig((config) => {
      const statsigValues = (config.value as Record<string, unknown>) || {};
      return { ...defaults, ...statsigValues } as T;
    }),
    identify,
    defaultValue: defaults,
  });
};

/**
 * Feature flags type - exported for TypeScript inference
 */
export type FeatureFlags = {
  testFlag: () => Promise<boolean>;
  referralProgram: () => Promise<boolean>;
  confettiAnimations: () => Promise<boolean>;
  recentlyViewed: () => Promise<boolean>;
  compareConfigs: () => Promise<boolean>;
  promotedConfigs: () => Promise<boolean>;
  jobAlerts: () => Promise<boolean>;
  selfServiceCheckout: () => Promise<boolean>;
  contentDetailTabs: () => Promise<boolean>;
  interactiveOnboarding: () => Promise<boolean>;
  configPlayground: () => Promise<boolean>;
  contactTerminalEnabled: () => Promise<boolean>;
  publicAPI: () => Promise<boolean>;
  enhancedSkeletons: () => Promise<boolean>;
  floatingActionBar: () => Promise<boolean>;
  fabSubmitAction: () => Promise<boolean>;
  fabSearchAction: () => Promise<boolean>;
  fabScrollToTop: () => Promise<boolean>;
  fabNotifications: () => Promise<boolean>;
  notificationsProvider: () => Promise<boolean>;
  notificationsSheet: () => Promise<boolean>;
  notificationsToasts: () => Promise<boolean>;
  loggerConsole: () => Promise<boolean>;
  loggerVerbose: () => Promise<boolean>;
};

let _featureFlags: FeatureFlags | null = null;

const getFeatureFlags = (): FeatureFlags => {
  if (!_featureFlags) {
    _featureFlags = {
      // Test
      testFlag: createFeatureFlag('test_flag'),
      // Growth features
      referralProgram: createFeatureFlag('referral_program'),
      confettiAnimations: createFeatureFlag('confetti_animations'),
      recentlyViewed: createFeatureFlag('recently_viewed_sidebar'),
      compareConfigs: createFeatureFlag('compare_configs'),
      // Monetization features
      promotedConfigs: createFeatureFlag('promoted_configs'),
      jobAlerts: createFeatureFlag('job_alerts'),
      selfServiceCheckout: createFeatureFlag('self_service_checkout'),
      // UX enhancements
      contentDetailTabs: createFeatureFlag('content_detail_tabs'),
      interactiveOnboarding: createFeatureFlag('interactive_onboarding'),
      configPlayground: createFeatureFlag('config_playground'),
      contactTerminalEnabled: createFeatureFlag('contact_terminal_enabled'),
      // Infrastructure
      publicAPI: createFeatureFlag('public_api'),
      enhancedSkeletons: createFeatureFlag('enhanced_skeletons'),
      // UI Components
      floatingActionBar: createFeatureFlag('floating_action_bar'),
      fabSubmitAction: createFeatureFlag('fab_submit_action'),
      fabSearchAction: createFeatureFlag('fab_search_action'),
      fabScrollToTop: createFeatureFlag('fab_scroll_to_top'),
      fabNotifications: createFeatureFlag('fab_notifications'),
      notificationsProvider: createFeatureFlag('notifications_provider'),
      notificationsSheet: createFeatureFlag('notifications_sheet'),
      notificationsToasts: createFeatureFlag('notifications_toasts'),
      // Infrastructure - Logging
      loggerConsole: createFeatureFlag('logger_console'),
      loggerVerbose: createFeatureFlag('logger_verbose'),
    };
  }
  return _featureFlags;
};

export const featureFlags: FeatureFlags = new Proxy({} as FeatureFlags, {
  get(_target, prop) {
    return getFeatureFlags()[prop as keyof FeatureFlags];
  },
});

/**
 * Newsletter A/B Test Experiments
 * CRITICAL: Lazy-initialized to prevent module-level execution during build
 */
let _newsletterExperiments: {
  footerDelay: () => Promise<'10s' | '30s' | '60s'>;
  ctaVariant: () => Promise<'aggressive' | 'social_proof' | 'value_focused'>;
} | null = null;

const getNewsletterExperiments = () => {
  if (!_newsletterExperiments) {
    _newsletterExperiments = {
      // Footer delay timing test (10s vs 30s vs 60s)
      footerDelay: createExperiment<'10s' | '30s' | '60s'>('newsletter_footer_delay', '30s'),

      // CTA copy variant test (aggressive vs social_proof vs value_focused)
      ctaVariant: createExperiment<'aggressive' | 'social_proof' | 'value_focused'>(
        'newsletter_cta_variant',
        'value_focused'
      ),
    };
  }
  return _newsletterExperiments;
};

export const newsletterExperiments = new Proxy(
  {} as {
    footerDelay: () => Promise<'10s' | '30s' | '60s'>;
    ctaVariant: () => Promise<'aggressive' | 'social_proof' | 'value_focused'>;
  },
  {
    get(_target, prop) {
      return getNewsletterExperiments()[prop as keyof typeof _newsletterExperiments];
    },
  }
);

/**
 * Dynamic Configs - Runtime-tunable values
 * Migrated from app_settings table and hardcoded constants
 */

/**
 * App Settings (formerly from app_settings table)
 * Replaces database queries with Statsig Dynamic Configs
 * Usage: const config = await appSettings(); const pages = config['newsletter.excluded_pages'];
 */
export const APP_SETTINGS_DEFAULTS = {
  'newsletter.excluded_pages': [
    '/',
    '/trending',
    '/guides',
    '/changelog',
    '/community',
    '/companies',
    '/jobs',
    '/partner',
    '/submit',
    '/tools/config-recommender',
    '/agents/',
    '/mcp/',
    '/rules/',
    '/commands/',
    '/hooks/',
    '/statuslines/',
    '/collections/',
  ] as const satisfies readonly string[],
  'hooks.infinite_scroll.batch_size': 30,
  'queue.pulse.batch_size': 100, // User interactions queue batch size (hyper-optimized egress reduction)
  'hooks.infinite_scroll.threshold': 0.1,
  'date.current_month': new Date().toISOString().slice(0, 7),
  'date.current_year': new Date().getFullYear(),
  'date.current_date': new Date().toISOString().split('T')[0],
  'date.last_reviewed': new Date().toISOString().split('T')[0],
} as const;

// Lazy getter - only creates the config when first accessed
let _appSettingsFn: (() => Promise<typeof APP_SETTINGS_DEFAULTS>) | null = null;
export const appSettings = (): Promise<typeof APP_SETTINGS_DEFAULTS> => {
  if (!_appSettingsFn) {
    _appSettingsFn = createDynamicConfigGroup('app_settings', APP_SETTINGS_DEFAULTS);
  }
  return _appSettingsFn();
};

/**
 * Component Configs - Component-level UI behavior settings
 * Controls card behaviors, FAB actions, and other component-level configs
 * Usage: const config = await componentConfigs(); const showCopy = config['cards.show_copy_button'];
 */
export const COMPONENT_CONFIG_DEFAULTS = {
  'cards.show_copy_button': true,
  'cards.show_bookmark': true,
  'cards.show_view_count': true,
  'cards.show_copy_count': true,
  'cards.show_rating': true,
  'fab.show_submit_button': true,
  'fab.show_search_button': true,
  'fab.show_scroll_to_top': true,
  'fab.show_notifications': true,
} as const;

// Lazy getter - only creates the config when first accessed
let _componentConfigsFn: (() => Promise<typeof COMPONENT_CONFIG_DEFAULTS>) | null = null;
export const componentConfigs = (): Promise<typeof COMPONENT_CONFIG_DEFAULTS> => {
  if (!_componentConfigsFn) {
    _componentConfigsFn = createDynamicConfigGroup('component_configs', COMPONENT_CONFIG_DEFAULTS);
  }
  return _componentConfigsFn();
};

/**
 * Email Configs - Subject lines and email copy
 * Enables A/B testing of email subjects without deploys
 * Usage: const config = await emailConfigs(); const subject = config['email.subject.welcome'];
 */
export const EMAIL_CONFIG_DEFAULTS = {
  'email.subject.welcome': 'Welcome to Claude Pro Directory! 🎉',
  'email.subject.magic_link': 'Your Magic Link - Claude Pro Directory',
  'email.subject.password_reset': 'Reset Your Password - Claude Pro Directory',
  'email.subject.job_posted': 'Your Job Listing is Live!',
  'email.subject.collection_shared': 'Someone shared a collection with you!',
} as const;

// Lazy getter - only creates the config when first accessed
let _emailConfigsFn: (() => Promise<typeof EMAIL_CONFIG_DEFAULTS>) | null = null;
export const emailConfigs = (): Promise<typeof EMAIL_CONFIG_DEFAULTS> => {
  if (!_emailConfigsFn) {
    _emailConfigsFn = createDynamicConfigGroup('email_configs', EMAIL_CONFIG_DEFAULTS);
  }
  return _emailConfigsFn();
};

/**
 * Newsletter Configs - CTA copy and settings
 * Powers contextual newsletter CTAs and variant testing
 * Usage: const config = await newsletterConfigs(); const headline = config['newsletter.cta.aggressive.headline'];
 */
export const NEWSLETTER_CONFIG_DEFAULTS = {
  'newsletter.cta.aggressive.headline': 'Join 500+ subscribers getting exclusive Claude configs',
  'newsletter.cta.social_proof.headline': '500+ Claude users already subscribed',
  'newsletter.cta.value_focused.headline': 'Get weekly Claude resources & updates',
  'newsletter.cta.aggressive.description':
    'Be the first to access new agents, MCP servers, and advanced prompts. Limited spots available.',
  'newsletter.cta.social_proof.description':
    'Join developers from Anthropic, Google, and leading AI companies who read our newsletter.',
  'newsletter.cta.value_focused.description':
    'Weekly roundup of the best Claude configurations, tutorials, and community highlights.',
  'newsletter.contextual.agents.headline': 'Master Agents & Prompts',
  'newsletter.contextual.agents.description':
    'Get weekly agent templates, advanced prompting techniques, and expert tutorials delivered to your inbox.',
  'newsletter.contextual.mcp.headline': 'MCP Integration Secrets',
  'newsletter.contextual.mcp.description':
    'Stay ahead with weekly MCP server tutorials, integration guides, and new server announcements.',
  'newsletter.contextual.guides.headline': 'Level Up Your Claude Skills',
  'newsletter.contextual.guides.description':
    'Get in-depth guides, best practices, and expert tips for mastering Claude delivered weekly.',
  'newsletter.footer_text': 'Free weekly newsletter • Unsubscribe anytime',
  'newsletter.show_subscriber_count': true,
  // Behavior settings (Phase 3)
  'newsletter.footer_bar.show_after_delay_ms': 30000,
  'newsletter.scroll_trigger.min_scroll_height_px': 500,
  'newsletter.max_retries': 3,
  'newsletter.initial_retry_delay_ms': 1000,
  'newsletter.retry_backoff_multiplier': 2,
  'newsletter.show_footer_bar': true,
  'newsletter.show_scroll_trigger': true,
} as const;

// Lazy getter - only creates the config when first accessed
let _newsletterConfigsFn: (() => Promise<typeof NEWSLETTER_CONFIG_DEFAULTS>) | null = null;
export const newsletterConfigs = (): Promise<typeof NEWSLETTER_CONFIG_DEFAULTS> => {
  if (!_newsletterConfigsFn) {
    _newsletterConfigsFn = createDynamicConfigGroup(
      'newsletter_configs',
      NEWSLETTER_CONFIG_DEFAULTS
    );
  }
  return _newsletterConfigsFn();
};

/**
 * Pricing Configs - Partner page pricing display
 * Enables pricing experiments without deploys
 * Usage: const config = await pricingConfigs(); const price = config['pricing.jobs.regular'];
 */
export const PRICING_CONFIG_DEFAULTS = {
  'pricing.jobs.regular': 249,
  'pricing.jobs.discounted': 149,
  'pricing.jobs.duration_days': 30,
  'pricing.sponsored.regular': 199,
  'pricing.sponsored.discounted': 119,
  'pricing.launch_discount_percent': 40,
  'pricing.launch_discount_enabled': true,
  'pricing.launch_discount_end_date': '2025-12-31',
} as const;

// Lazy getter - only creates the config when first accessed
let _pricingConfigsFn: (() => Promise<typeof PRICING_CONFIG_DEFAULTS>) | null = null;
export const pricingConfigs = (): Promise<typeof PRICING_CONFIG_DEFAULTS> => {
  if (!_pricingConfigsFn) {
    _pricingConfigsFn = createDynamicConfigGroup('pricing_configs', PRICING_CONFIG_DEFAULTS);
  }
  return _pricingConfigsFn();
};

/**
 * Polling Configs - Polling intervals for real-time updates
 * Controls how frequently the app checks for updates
 * Usage: const config = await pollingConfigs(); const interval = config['polling.badges_ms'];
 */
export const POLLING_CONFIG_DEFAULTS = {
  'polling.realtime_ms': 1000,
  'polling.badges_ms': 30000,
  'polling.status.health_ms': 60000,
  'polling.status.api_ms': 30000,
  'polling.status.database_ms': 120000,
  'polling.analytics.views_ms': 60000,
  'polling.analytics.stats_ms': 300000,
  'polling.newsletter_count_ms': 300000, // Phase 3
} as const;

// Lazy getter - only creates the config when first accessed
let _pollingConfigsFn: (() => Promise<typeof POLLING_CONFIG_DEFAULTS>) | null = null;
export const pollingConfigs = (): Promise<typeof POLLING_CONFIG_DEFAULTS> => {
  if (!_pollingConfigsFn) {
    _pollingConfigsFn = createDynamicConfigGroup('polling_configs', POLLING_CONFIG_DEFAULTS);
  }
  return _pollingConfigsFn();
};

/**
 * Animation Configs - Animation durations and delays
 * Controls animation timing for consistent UX
 * Usage: const config = await animationConfigs(); const duration = config['animation.ticker.default_ms'];
 */
export const ANIMATION_CONFIG_DEFAULTS = {
  'animation.ticker.default_ms': 1500,
  'animation.ticker.fast_ms': 1000,
  'animation.ticker.slow_ms': 2000,
  'animation.stagger.fast_ms': 100,
  'animation.stagger.medium_ms': 200,
  'animation.stagger.slow_ms': 300,
  'animation.beam.default_ms': 15000,
  'animation.card.stagger_ms': 100,
  // Spring physics
  'animation.spring.default.stiffness': 400,
  'animation.spring.default.damping': 17,
  'animation.spring.bouncy.stiffness': 500,
  'animation.spring.bouncy.damping': 20,
  'animation.spring.smooth.stiffness': 300,
  'animation.spring.smooth.damping': 25,
  // Confetti animations
  'confetti.success.particle_count': 50,
  'confetti.success.spread': 60,
  'confetti.success.ticks': 150,
  'confetti.celebration.particle_count': 100,
  'confetti.celebration.spread': 70,
  'confetti.celebration.ticks': 200,
  'confetti.milestone.particle_count': 30,
  'confetti.milestone.spread': 100,
  'confetti.milestone.ticks': 200,
  'confetti.milestone.scalar': 1.2,
  'confetti.subtle.particle_count': 30,
  'confetti.subtle.spread': 40,
  'confetti.subtle.ticks': 100,
} as const;

// Lazy getter - only creates the config when first accessed
let _animationConfigsFn: (() => Promise<typeof ANIMATION_CONFIG_DEFAULTS>) | null = null;
export const animationConfigs = (): Promise<typeof ANIMATION_CONFIG_DEFAULTS> => {
  if (!_animationConfigsFn) {
    _animationConfigsFn = createDynamicConfigGroup('animation_configs', ANIMATION_CONFIG_DEFAULTS);
  }
  return _animationConfigsFn();
};

/** Timeout Configs - UI/API timeouts and retry logic */
export const TIMEOUT_CONFIG_DEFAULTS = {
  'timeout.ui.debounce_ms': 150,
  'timeout.ui.tooltip_ms': 300,
  'timeout.ui.animation_ms': 300,
  'timeout.ui.transition_ms': 200,
  'timeout.ui.prefetch_delay_ms': 300,
  'timeout.ui.button_success_duration_ms': 2000,
  'timeout.ui.clipboard_reset_delay_ms': 2000,
  'timeout.ui.modal_close_delay_ms': 300,
  'timeout.ui.dropdown_open_delay_ms': 200,
  'timeout.ui.hover_activate_delay_ms': 150,
  'timeout.ui.scroll_direction_threshold_px': 100,
  'timeout.ui.scroll_hysteresis_px': 10,
  'timeout.ui.form_debounce_ms': 300,
  'timeout.api.default_ms': 5000,
  'timeout.api.long_ms': 10000,
  'timeout.api.short_ms': 2000,
  'timeout.test.default_ms': 5000,
  'timeout.test.long_ms': 10000,
  'timeout.test.network_ms': 5000,
  'retry.api.initial_delay_ms': 1000,
  'retry.api.exponential_delay_ms': 2000,
  'retry.api.max_delay_ms': 10000,
  'retry.email.send_delay_ms': 1000,
  'retry.email.retry_delay_ms': 2000,
  'retry.github.delay_ms': 1000,
  'retry.resend.delay_ms': 1000,
  'retry.external.delay_ms': 500,
  'retry.database.query_spacing_ms': 100,
  'retry.database.write_spacing_ms': 200,
  'retry.database.transaction_retry_ms': 500,
  'retry.build.max_retries': 3,
} as const;

// Lazy getter - only creates the config when first accessed
let _timeoutConfigsFn: (() => Promise<typeof TIMEOUT_CONFIG_DEFAULTS>) | null = null;
export const timeoutConfigs = (): Promise<typeof TIMEOUT_CONFIG_DEFAULTS> => {
  if (!_timeoutConfigsFn) {
    _timeoutConfigsFn = createDynamicConfigGroup('timeout_configs', TIMEOUT_CONFIG_DEFAULTS);
  }
  return _timeoutConfigsFn();
};

/**
 * Toast Configs - Toast notification messages
 * Enables copy testing and message updates without deploys
 * Usage: const config = await toastConfigs(); const message = config['toast.copied'];
 */
export const TOAST_CONFIG_DEFAULTS = {
  'toast.profile_updated': 'Profile updated successfully',
  'toast.signed_out': 'Signed out successfully',
  'toast.submission_created_title': 'Submission Created!',
  'toast.submission_created_description': 'Your {contentType} has been submitted for review.',
  'toast.template_applied_title': 'Template Applied!',
  'toast.template_applied_description': 'Form has been pre-filled. Customize as needed.',
  'toast.copied': 'Copied to clipboard!',
  'toast.link_copied': 'Link copied to clipboard!',
  'toast.code_copied': 'Code copied to clipboard!',
  'toast.screenshot_copied': 'Screenshot copied & downloaded!',
  'toast.bookmark_added': 'Bookmark added',
  'toast.bookmark_removed': 'Bookmark removed',
  'toast.changes_saved': 'Changes saved successfully',
  'toast.save_failed': 'Failed to save. Please try again.',
  'toast.required_fields': 'Please fill in all required fields',
  'toast.auth_required': 'Please sign in to continue',
  'toast.permission_denied': 'You do not have permission to perform this action',
  'toast.submission_error_title': 'Submission Error',
  'toast.submission_error_description': 'Failed to submit. Please try again.',
  'toast.network_error': 'Network error. Please check your connection and try again.',
  'toast.server_error': 'Server error. Please try again later.',
  'toast.rate_limited': 'Too many requests. Please wait a moment and try again.',
  'toast.screenshot_failed': 'Failed to generate screenshot',
  'toast.profile_update_failed': 'Failed to update profile',
  'toast.vote_update_failed': 'Failed to update vote',
  'toast.coming_soon': 'Coming soon!',
  'toast.redirecting': 'Redirecting...',
  'toast.unsaved_changes': 'You have unsaved changes',
  'toast.slow_connection': 'Slow connection detected. This may take longer than usual.',
  'toast.saving': 'Saving...',
  'toast.processing': 'Processing...',
} as const;

// Lazy getter - only creates the config when first accessed
let _toastConfigsFn: (() => Promise<typeof TOAST_CONFIG_DEFAULTS>) | null = null;
export const toastConfigs = (): Promise<typeof TOAST_CONFIG_DEFAULTS> => {
  if (!_toastConfigsFn) {
    _toastConfigsFn = createDynamicConfigGroup('toast_configs', TOAST_CONFIG_DEFAULTS);
  }
  return _toastConfigsFn();
};

/**
 * Homepage Configs - Homepage layout and categories
 * Controls which categories appear on homepage
 * Usage: const config = await homepageConfigs(); const categories = config['homepage.featured_categories'];
 */
export const HOMEPAGE_CONFIG_DEFAULTS = {
  'homepage.featured_categories': [
    'agents',
    'mcp',
    'commands',
    'rules',
    'skills',
    'collections',
    'hooks',
    'statuslines',
  ] as const satisfies readonly string[],
  'homepage.tab_categories': [
    'all',
    'agents',
    'mcp',
    'commands',
    'rules',
    'hooks',
    'statuslines',
    'collections',
    'guides',
    'community',
  ] as const satisfies readonly string[],
} as const;

// Lazy getter - only creates the config when first accessed
let _homepageConfigsFn: (() => Promise<typeof HOMEPAGE_CONFIG_DEFAULTS>) | null = null;
export const homepageConfigs = (): Promise<typeof HOMEPAGE_CONFIG_DEFAULTS> => {
  if (!_homepageConfigsFn) {
    _homepageConfigsFn = createDynamicConfigGroup('homepage_configs', HOMEPAGE_CONFIG_DEFAULTS);
  }
  return _homepageConfigsFn();
};

/**
 * Form Configs - Form validation and limits (Phase 3)
 * Controls file upload limits and form validation rules
 * Usage: const config = await formConfigs(); const maxSize = config['form.max_file_size_mb'];
 */
export const FORM_CONFIG_DEFAULTS = {
  'form.max_file_size_mb': 5,
  'form.max_image_dimension_px': 2048,
  'form.max_review_length': 2000,
  'form.min_review_length': 10,
  'form.review_helpful_threshold': 3,
  'form.review_auto_approve_score': 0.8,
} as const;

// Lazy getter - only creates the config when first accessed
let _formConfigsFn: (() => Promise<typeof FORM_CONFIG_DEFAULTS>) | null = null;
export const formConfigs = (): Promise<typeof FORM_CONFIG_DEFAULTS> => {
  if (!_formConfigsFn) {
    _formConfigsFn = createDynamicConfigGroup('form_configs', FORM_CONFIG_DEFAULTS);
  }
  return _formConfigsFn();
};

/**
 * Recently Viewed Configs - Recently viewed items settings (Phase 3)
 * Controls storage and display of recently viewed content
 * Usage: const config = await recentlyViewedConfigs(); const ttl = config['recently_viewed.ttl_days'];
 */
export const RECENTLY_VIEWED_CONFIG_DEFAULTS = {
  'recently_viewed.ttl_days': 30,
  'recently_viewed.max_items': 10,
  'recently_viewed.max_description_length': 150,
  'recently_viewed.max_tags': 5,
} as const;

// Lazy getter - only creates the config when first accessed
let _recentlyViewedConfigsFn: (() => Promise<typeof RECENTLY_VIEWED_CONFIG_DEFAULTS>) | null = null;
export const recentlyViewedConfigs = (): Promise<typeof RECENTLY_VIEWED_CONFIG_DEFAULTS> => {
  if (!_recentlyViewedConfigsFn) {
    _recentlyViewedConfigsFn = createDynamicConfigGroup(
      'recently_viewed_configs',
      RECENTLY_VIEWED_CONFIG_DEFAULTS
    );
  }
  return _recentlyViewedConfigsFn();
};

/**
 * Cache Configs - Cache TTL settings and invalidation rules
 * Controls cache durations and invalidation tags across the application
 * Usage: const config = await cacheConfigs(); const ttl = config['cache.homepage.ttl_seconds'];
 */
const _cacheConfigsDefaults = {
  // TTL Settings (in seconds) - Optimized for low-traffic sites
  'cache.homepage.ttl_seconds': 3600, // 1 hour
  'cache.content_detail.ttl_seconds': 7200, // 2 hours
  'cache.content_list.ttl_seconds': 1800, // 30 minutes
  'cache.content_trending.ttl_seconds': 1800, // 30 minutes
  'cache.config_detail.ttl_seconds': 7200, // 2 hours
  'cache.config_list.ttl_seconds': 1800, // 30 minutes
  'cache.tool_detail.ttl_seconds': 7200, // 2 hours
  'cache.tool_list.ttl_seconds': 1800, // 30 minutes
  'cache.company_detail.ttl_seconds': 1800, // 30 minutes
  'cache.company_list.ttl_seconds': 1800, // 30 minutes
  'cache.company_profile.ttl_seconds': 1800, // 30 minutes (public profile API)
  'cache.related_content.ttl_seconds': 3600, // 1 hour (stable recommendations)
  'cache.recommendations.ttl_seconds': 3600, // 1 hour (AI-config recommendations)
  'cache.content_export.ttl_seconds': 604800, // 7 days (content JSON/markdown/LLMs exports)
  'cache.content_paginated.ttl_seconds': 86400, // 1 day (homepage infinite scroll)
  'cache.feeds.ttl_seconds': 600, // 10 minutes (RSS/Atom feeds)
  'cache.seo.ttl_seconds': 86400, // 1 day (SEO metadata builder)
  'cache.sitemap.ttl_seconds': 86400, // 1 day (sitemap XML/JSON)
  'cache.status.ttl_seconds': 60, // 1 minute (status health endpoint)
  'cache.navigation.ttl_seconds': 7200, // 2 hours (rarely changes)
  'cache.templates.ttl_seconds': 7200, // 2 hours (rarely changes)
  'cache.submission_dashboard.ttl_seconds': 900, // 15 minutes (community activity updates)
  'cache.user_profile.ttl_seconds': 1800, // 30 minutes
  'cache.user_activity.ttl_seconds': 900, // 15 minutes
  'cache.user_stats.ttl_seconds': 1800, // 30 minutes
  'cache.user_bookmarks.ttl_seconds': 300, // 5 minutes (feels real-time)
  'cache.user_submissions.ttl_seconds': 300, // 5 minutes
  'cache.user_reviews.ttl_seconds': 300, // 5 minutes
  'cache.community.ttl_seconds': 1800, // 30 minutes
  'cache.article.ttl_seconds': 7200, // 2 hours
  'cache.boilerplate.ttl_seconds': 7200, // 2 hours
  'cache.course.ttl_seconds': 7200, // 2 hours
  'cache.book.ttl_seconds': 7200, // 2 hours
  'cache.quiz.ttl_seconds': 3600, // 1 hour
  'cache.search.ttl_seconds': 3600, // 1 hour
  'cache.search_autocomplete.ttl_seconds': 3600, // 1 hour (suggestions from history)
  'cache.search_facets.ttl_seconds': 3600, // 1 hour (available filters)
  'cache.jobs.ttl_seconds': 1800, // 30 minutes
  'cache.jobs_detail.ttl_seconds': 1800, // 30 minutes
  'cache.changelog.ttl_seconds': 3600, // 1 hour
  'cache.changelog_detail.ttl_seconds': 7200, // 2 hours
  'cache.announcements.ttl_seconds': 1800, // 30 minutes
  'cache.account.ttl_seconds': 300, // 5 minutes (user-specific data, shorter TTL)
  'cache.newsletter_count_ttl_s': 300, // 5 minutes (subscriber count)
  'cache.company_search.ttl_seconds': 300, // 5 minutes (company selector search)
  'cache.notifications.ttl_seconds': 300, // 5 minutes (user notification cache)
  'cache.contact.ttl_seconds': 3600, // 1 hour (contact terminal commands)

  // Invalidation Tag Arrays
  'cache.invalidate.content_create': ['content', 'homepage', 'trending'] as string[],
  'cache.invalidate.content_update': ['content', 'homepage', 'trending'] as string[],
  'cache.invalidate.content_delete': ['content', 'homepage', 'trending'] as string[],
  'cache.invalidate.config_create': ['configs', 'homepage'] as string[],
  'cache.invalidate.config_update': ['configs', 'homepage'] as string[],
  'cache.invalidate.config_delete': ['configs', 'homepage'] as string[],
  'cache.invalidate.tool_create': ['tools', 'homepage'] as string[],
  'cache.invalidate.tool_update': ['tools', 'homepage'] as string[],
  'cache.invalidate.tool_delete': ['tools', 'homepage'] as string[],
  'cache.invalidate.company_create': ['companies'] as string[],
  'cache.invalidate.company_update': ['companies'] as string[],
  'cache.invalidate.company_delete': ['companies'] as string[],
  'cache.invalidate.user_update': ['users'] as string[],
  'cache.invalidate.user_profile_oauth': ['users'] as string[],
  'cache.invalidate.bookmark_create': ['user-bookmarks', 'users'] as string[],
  'cache.invalidate.bookmark_delete': ['user-bookmarks', 'users'] as string[],
  'cache.invalidate.follow': ['users'] as string[],
  'cache.invalidate.oauth_unlink': ['users'] as string[],
  'cache.invalidate.vote': ['content', 'trending'] as string[],
  'cache.invalidate.job_create': ['jobs', 'companies'] as string[],
  'cache.invalidate.job_update': ['jobs', 'companies'] as string[],
  'cache.invalidate.job_delete': ['jobs', 'companies'] as string[],
  'cache.invalidate.job_status': ['jobs', 'companies'] as string[],
  'cache.invalidate.sponsored_tracking': ['jobs', 'companies'] as string[],
  'cache.invalidate.collection_create': ['collections', 'users'] as string[],
  'cache.invalidate.collection_update': ['collections', 'users'] as string[],
  'cache.invalidate.collection_delete': ['collections', 'users'] as string[],
  'cache.invalidate.collection_items': ['collections', 'users'] as string[],
  'cache.invalidate.review_create': ['content', 'homepage', 'trending'] as string[],
  'cache.invalidate.review_update': ['content'] as string[],
  'cache.invalidate.notifications': ['notifications'] as string[],
  'cache.invalidate.review_delete': ['content'] as string[],
  'cache.invalidate.submission_create': ['submissions'] as string[],
  'cache.invalidate.contact_submission': ['contact', 'submissions'] as string[],
  'cache.invalidate.review_helpful': ['content'] as string[],
  'cache.invalidate.usage_tracking': ['content'] as string[],
  'cache.invalidate.changelog': ['changelog'] as string[],
  'cache.invalidate.newsletter_subscribe': ['newsletter'] as string[],
} as const;

// Lazy getter - only creates the config when first accessed
let _cacheConfigsFn: (() => Promise<typeof _cacheConfigsDefaults>) | null = null;
export const cacheConfigs = (): Promise<typeof _cacheConfigsDefaults> => {
  if (!_cacheConfigsFn) {
    _cacheConfigsFn = createDynamicConfigGroup('cache_configs', _cacheConfigsDefaults);
  }
  return _cacheConfigsFn();
};
