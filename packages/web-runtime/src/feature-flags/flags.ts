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
import {
  ANIMATION_CONFIG_DEFAULTS,
  APP_SETTINGS_DEFAULTS,
  CACHE_CONFIG_DEFAULTS,
  COMPONENT_CONFIG_DEFAULTS,
  EMAIL_CONFIG_DEFAULTS,
  FORM_CONFIG_DEFAULTS,
  HOMEPAGE_CONFIG_DEFAULTS,
  NEWSLETTER_CONFIG_DEFAULTS,
  POLLING_CONFIG_DEFAULTS,
  PRICING_CONFIG_DEFAULTS,
  RECENTLY_VIEWED_CONFIG_DEFAULTS,
  TIMEOUT_CONFIG_DEFAULTS,
  TOAST_CONFIG_DEFAULTS,
} from './defaults.ts';

// Re-export defaults for convenience (optional, but keeps API surface)
export {
  ANIMATION_CONFIG_DEFAULTS,
  APP_SETTINGS_DEFAULTS,
  CACHE_CONFIG_DEFAULTS,
  COMPONENT_CONFIG_DEFAULTS,
  EMAIL_CONFIG_DEFAULTS,
  FORM_CONFIG_DEFAULTS,
  HOMEPAGE_CONFIG_DEFAULTS,
  NEWSLETTER_CONFIG_DEFAULTS,
  POLLING_CONFIG_DEFAULTS,
  PRICING_CONFIG_DEFAULTS,
  RECENTLY_VIEWED_CONFIG_DEFAULTS,
  TIMEOUT_CONFIG_DEFAULTS,
  TOAST_CONFIG_DEFAULTS,
};

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
// Lazy getter - only creates the config when first accessed
let _animationConfigsFn: (() => Promise<typeof ANIMATION_CONFIG_DEFAULTS>) | null = null;
export const animationConfigs = (): Promise<typeof ANIMATION_CONFIG_DEFAULTS> => {
  if (!_animationConfigsFn) {
    _animationConfigsFn = createDynamicConfigGroup('animation_configs', ANIMATION_CONFIG_DEFAULTS);
  }
  return _animationConfigsFn();
};

/** Timeout Configs - UI/API timeouts and retry logic */
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
// Lazy getter - only creates the config when first accessed
let _cacheConfigsFn: (() => Promise<typeof CACHE_CONFIG_DEFAULTS>) | null = null;
export const cacheConfigs = (): Promise<typeof CACHE_CONFIG_DEFAULTS> => {
  if (!_cacheConfigsFn) {
    _cacheConfigsFn = createDynamicConfigGroup('cache_configs', CACHE_CONFIG_DEFAULTS);
  }
  return _cacheConfigsFn();
};
