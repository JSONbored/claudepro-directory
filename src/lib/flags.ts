import { type StatsigUser, statsigAdapter } from '@flags-sdk/statsig';
import { createServerClient } from '@supabase/ssr';
import type { Identify } from 'flags';
import { dedupe, flag } from 'flags/next';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

/**
 * Identify function - provides user context for flag evaluation
 * Statsig uses this to do % rollouts, user targeting, etc.
 *
 * IMPORTANT: Uses headers/cookies provided by flags SDK (no next/headers import needed)
 * This allows the function to work in both server and client contexts without build errors
 */
export const identify = dedupe((async ({ headers, cookies }) => {
  try {
    // Build-time detection: If cookies/headers unavailable (static generation), return anonymous immediately
    // This prevents warnings about missing request context during build
    if (!(cookies && headers)) {
      return { userID: 'anonymous' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Fallback to anonymous if env vars missing (development safety)
    if (!(supabaseUrl && supabaseAnonKey)) {
      return { userID: 'anonymous' };
    }

    // Create Supabase client using cookies provided by flags SDK
    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll() {
          // Flags SDK cookies are read-only, cannot set
          // This is fine - auth cookies are already set by middleware/route handlers
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const baseUser: StatsigUser = {
      userID: user?.id || 'anonymous',
    };

    // Only add optional fields if they exist
    if (user?.email) {
      baseUser.email = user.email;
    }

    if (user?.user_metadata?.slug) {
      baseUser.customIDs = {
        userSlug: user.user_metadata.slug as string,
      };
    }

    return baseUser;
  } catch (error) {
    // Log auth failure for monitoring (important for debugging flag evaluation issues)
    logger.error(
      'Failed to identify user for feature flags, falling back to anonymous',
      error as Error,
      {
        context: 'feature_flags',
        fallback: 'anonymous',
      }
    );

    // Fallback to anonymous if auth fails
    return {
      userID: 'anonymous',
    };
  }
}) satisfies Identify<StatsigUser>);

/**
 * Factory function to create feature flags
 */
export const createFeatureFlag = (key: string) =>
  flag<boolean, StatsigUser>({
    key,
    adapter: statsigAdapter.featureGate((gate) => gate.value, {
      exposureLogging: true, // Track when flags are checked (for analytics)
    }),
    identify,
  });

/**
 * Factory function to create experiments (A/B tests with variants)
 */
export const createExperiment = <T extends string>(key: string, defaultValue: T) =>
  flag<T, StatsigUser>({
    key,
    adapter: statsigAdapter.experiment((exp) => exp.get('variant', defaultValue) as T, {
      exposureLogging: true,
    }),
    identify,
    defaultValue,
  });

/**
 * Factory function to create dynamic config groups (runtime-tunable values)
 * Each config group returns a JSON object with multiple parameters
 * Use for values that need to change without code deploys
 */
const createDynamicConfigGroup = <T extends Record<string, unknown>>(
  configName: string,
  defaults: T
) =>
  flag<T, StatsigUser>({
    key: configName,
    adapter: statsigAdapter.dynamicConfig((config) => {
      // Merge Statsig values with defaults
      const statsigValues = (config.value as Record<string, unknown>) || {};
      return { ...defaults, ...statsigValues } as T;
    }),
    identify,
    defaultValue: defaults,
  });

/**
 * All feature flags - centralized
 * Usage: const enabled = await featureFlags.testFlag();
 */
export const featureFlags = {
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

  // Infrastructure
  publicAPI: createFeatureFlag('public_api'),
  enhancedSkeletons: createFeatureFlag('enhanced_skeletons'),

  // UI Components
  floatingActionBar: createFeatureFlag('floating_action_bar'),
  fabSubmitAction: createFeatureFlag('fab_submit_action'),
  fabSearchAction: createFeatureFlag('fab_search_action'),
  fabScrollToTop: createFeatureFlag('fab_scroll_to_top'),
  fabNotifications: createFeatureFlag('fab_notifications'),

  // Infrastructure - Logging
  loggerConsole: createFeatureFlag('logger_console'),
  loggerVerbose: createFeatureFlag('logger_verbose'),
};

/**
 * Newsletter A/B Test Experiments
 */
export const newsletterExperiments = {
  // Footer delay timing test (10s vs 30s vs 60s)
  footerDelay: createExperiment<'10s' | '30s' | '60s'>('newsletter_footer_delay', '30s'),

  // CTA copy variant test (aggressive vs social_proof vs value_focused)
  ctaVariant: createExperiment<'aggressive' | 'social_proof' | 'value_focused'>(
    'newsletter_cta_variant',
    'value_focused'
  ),
};

/**
 * Dynamic Configs - Runtime-tunable values
 * Migrated from app_settings table and hardcoded constants
 */

/**
 * App Settings (formerly from app_settings table)
 * Replaces database queries with Statsig Dynamic Configs
 * Usage: const config = await appSettings(); const pages = config['newsletter.excluded_pages'];
 */
export const appSettings = createDynamicConfigGroup('app_settings', {
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
  ] as string[],
  'hooks.infinite_scroll.batch_size': 30,
  'hooks.infinite_scroll.threshold': 0.1,
  'date.current_month': new Date().toISOString().slice(0, 7),
  'date.current_year': new Date().getFullYear(),
  'date.current_date': new Date().toISOString().split('T')[0],
  'date.last_reviewed': new Date().toISOString().split('T')[0],
});

/**
 * Component Configs - Component-level UI behavior settings
 * Controls card behaviors, FAB actions, and other component-level configs
 * Usage: const config = await componentConfigs(); const showCopy = config['cards.show_copy_button'];
 */
export const componentConfigs = createDynamicConfigGroup('component_configs', {
  'cards.show_copy_button': true,
  'cards.show_bookmark': true,
  'cards.show_view_count': true,
  'cards.show_copy_count': true,
  'cards.show_rating': true,
  'fab.show_submit_button': true,
  'fab.show_search_button': true,
  'fab.show_scroll_to_top': true,
  'fab.show_notifications': true,
});

/**
 * Email Configs - Subject lines and email copy
 * Enables A/B testing of email subjects without deploys
 * Usage: const config = await emailConfigs(); const subject = config['email.subject.welcome'];
 */
export const emailConfigs = createDynamicConfigGroup('email_configs', {
  'email.subject.welcome': 'Welcome to Claude Pro Directory! 🎉',
  'email.subject.magic_link': 'Your Magic Link - Claude Pro Directory',
  'email.subject.password_reset': 'Reset Your Password - Claude Pro Directory',
  'email.subject.job_posted': 'Your Job Listing is Live!',
  'email.subject.collection_shared': 'Someone shared a collection with you!',
});

/**
 * Newsletter Configs - CTA copy and settings
 * Powers contextual newsletter CTAs and variant testing
 * Usage: const config = await newsletterConfigs(); const headline = config['newsletter.cta.aggressive.headline'];
 */
export const newsletterConfigs = createDynamicConfigGroup('newsletter_configs', {
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
});

/**
 * Pricing Configs - Partner page pricing display
 * Enables pricing experiments without deploys
 * Usage: const config = await pricingConfigs(); const price = config['pricing.jobs.regular'];
 */
export const pricingConfigs = createDynamicConfigGroup('pricing_configs', {
  'pricing.jobs.regular': 249,
  'pricing.jobs.discounted': 149,
  'pricing.jobs.duration_days': 30,
  'pricing.sponsored.regular': 199,
  'pricing.sponsored.discounted': 119,
  'pricing.launch_discount_percent': 40,
  'pricing.launch_discount_enabled': true,
  'pricing.launch_discount_end_date': '2025-12-31',
});

/**
 * Polling Configs - Polling intervals for real-time updates
 * Controls how frequently the app checks for updates
 * Usage: const config = await pollingConfigs(); const interval = config['polling.badges_ms'];
 */
export const pollingConfigs = createDynamicConfigGroup('polling_configs', {
  'polling.realtime_ms': 1000,
  'polling.badges_ms': 30000,
  'polling.status.health_ms': 60000,
  'polling.status.api_ms': 30000,
  'polling.status.database_ms': 120000,
  'polling.analytics.views_ms': 60000,
  'polling.analytics.stats_ms': 300000,
  'polling.newsletter_count_ms': 300000, // Phase 3
});

/**
 * Animation Configs - Animation durations and delays
 * Controls animation timing for consistent UX
 * Usage: const config = await animationConfigs(); const duration = config['animation.ticker.default_ms'];
 */
export const animationConfigs = createDynamicConfigGroup('animation_configs', {
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
});

/** Timeout Configs - UI/API timeouts and retry logic */
export const timeoutConfigs = createDynamicConfigGroup('timeout_configs', {
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
});

/**
 * Toast Configs - Toast notification messages
 * Enables copy testing and message updates without deploys
 * Usage: const config = await toastConfigs(); const message = config['toast.copied'];
 */
export const toastConfigs = createDynamicConfigGroup('toast_configs', {
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
});

/**
 * Homepage Configs - Homepage layout and categories
 * Controls which categories appear on homepage
 * Usage: const config = await homepageConfigs(); const categories = config['homepage.featured_categories'];
 */
export const homepageConfigs = createDynamicConfigGroup('homepage_configs', {
  'homepage.featured_categories': [
    'agents',
    'mcp',
    'commands',
    'rules',
    'skills',
    'collections',
    'hooks',
    'statuslines',
  ] as string[],
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
  ] as string[],
});

/**
 * Form Configs - Form validation and limits (Phase 3)
 * Controls file upload limits and form validation rules
 * Usage: const config = await formConfigs(); const maxSize = config['form.max_file_size_mb'];
 */
export const formConfigs = createDynamicConfigGroup('form_configs', {
  'form.max_file_size_mb': 5,
  'form.max_image_dimension_px': 2048,
  'form.max_review_length': 2000,
  'form.min_review_length': 10,
  'form.review_helpful_threshold': 3,
  'form.review_auto_approve_score': 0.8,
});

/**
 * Recently Viewed Configs - Recently viewed items settings (Phase 3)
 * Controls storage and display of recently viewed content
 * Usage: const config = await recentlyViewedConfigs(); const ttl = config['recently_viewed.ttl_days'];
 */
export const recentlyViewedConfigs = createDynamicConfigGroup('recently_viewed_configs', {
  'recently_viewed.ttl_days': 30,
  'recently_viewed.max_items': 10,
  'recently_viewed.max_description_length': 150,
  'recently_viewed.max_tags': 5,
});

/**
 * Cache Configs - Cache TTL settings and invalidation rules
 * Controls cache durations and invalidation tags across the application
 * Usage: const config = await cacheConfigs(); const ttl = config['cache.homepage.ttl_seconds'];
 */
export const cacheConfigs = createDynamicConfigGroup('cache_configs', {
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
  'cache.related_content.ttl_seconds': 3600, // 1 hour (stable recommendations)
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
  'cache.invalidate.collection_create': ['collections', 'users'] as string[],
  'cache.invalidate.collection_update': ['collections', 'users'] as string[],
  'cache.invalidate.collection_delete': ['collections', 'users'] as string[],
  'cache.invalidate.collection_items': ['collections', 'users'] as string[],
  'cache.invalidate.review_create': ['content', 'homepage', 'trending'] as string[],
  'cache.invalidate.review_update': ['content'] as string[],
  'cache.invalidate.review_delete': ['content'] as string[],
  'cache.invalidate.submission_create': ['submissions'] as string[],
  'cache.invalidate.review_helpful': ['content'] as string[],
  'cache.invalidate.usage_tracking': ['content'] as string[],
});
