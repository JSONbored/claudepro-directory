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
import { getAuthenticatedUserFromClient } from '../auth/get-authenticated-user.ts';
import { isBuildTime } from '../build-time.ts';
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
 * Lazy loader for flags/next package
 * CRITICAL: Only imports flags/next at runtime, never during build-time static analysis
 * This prevents Next.js from analyzing the module and trying to access next/headers during build
 */
let flagsNextModulePromise: Promise<{ dedupe: typeof import('flags/next').dedupe; flag: typeof import('flags/next').flag }> | null = null;

function getFlagsNextModule() {
  if (isBuildTime()) {
    throw new Error('Cannot load flags/next during build-time');
  }
  if (!flagsNextModulePromise) {
    flagsNextModulePromise = import('flags/next');
  }
  return flagsNextModulePromise;
}

/**
 * Identify function - provides user context for flag evaluation
 * Statsig uses this to do % rollouts, user targeting, etc.
 *
 * Following official pattern: wrapped in dedupe for request-level deduplication
 * CRITICAL: Lazy-loaded to prevent build-time module analysis
 */
let identifyFnPromise: Promise<({ headers, cookies }: { headers: unknown; cookies: { getAll: () => Array<{ name: string; value: string }> } }) => Promise<StatsigUser>> | null = null;

export async function identify({ headers: _headers, cookies }: { headers: unknown; cookies: { getAll: () => Array<{ name: string; value: string }> } }): Promise<StatsigUser> {
  if (!identifyFnPromise) {
    identifyFnPromise = (async () => {
      const { dedupe } = await getFlagsNextModule();
      return dedupe(async ({ headers: _headers, cookies }): Promise<StatsigUser> => {
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
    })();
  }
  const identifyFn = await identifyFnPromise;
  return identifyFn({ headers: _headers, cookies });
}

/**
 * Factory function to create feature flags
 * Following the official pattern from Vercel docs
 * CRITICAL: Lazy-loaded to prevent build-time module analysis
 */
export async function createFeatureFlag(key: string) {
  const { flag } = await getFlagsNextModule();
  return flag<boolean, StatsigUser>({
    key,
    adapter: statsigAdapter.featureGate((gate) => gate.value, {
      exposureLogging: true,
    }),
    identify,
    defaultValue: false,
  });
}

/**
 * Factory function to create experiments (A/B tests with variants)
 * CRITICAL: Lazy-loaded to prevent build-time module analysis
 */
export async function createExperiment<T extends string>(key: string, defaultValue: T) {
  const { flag } = await getFlagsNextModule();
  return flag<T, StatsigUser>({
    key,
    adapter: statsigAdapter.experiment((exp) => exp.get('variant', defaultValue) as T, {
      exposureLogging: true,
    }),
    identify,
    defaultValue,
  });
}

/**
 * Factory function to create dynamic config groups (runtime-tunable values)
 * CRITICAL: Lazy-loaded to prevent build-time module analysis
 */
export async function createDynamicConfigGroup<T extends Record<string, unknown>>(
  configName: string,
  defaults: T
) {
  const { flag } = await getFlagsNextModule();
  return flag<T, StatsigUser>({
    key: configName,
    adapter: statsigAdapter.dynamicConfig((config) => {
      const statsigValues = (config.value as Record<string, unknown>) || {};
      return { ...defaults, ...statsigValues } as T;
    }),
    identify,
    defaultValue: defaults,
  });
}

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
let _featureFlagsPromise: Promise<FeatureFlags> | null = null;

async function getFeatureFlags(): Promise<FeatureFlags> {
  if (_featureFlags) {
    return _featureFlags;
  }
  if (!_featureFlagsPromise) {
    _featureFlagsPromise = (async () => {
      // Initialize all flags in parallel for better performance
      const [
        testFlag,
        referralProgram,
        confettiAnimations,
        recentlyViewed,
        compareConfigs,
        promotedConfigs,
        jobAlerts,
        selfServiceCheckout,
        contentDetailTabs,
        interactiveOnboarding,
        configPlayground,
        contactTerminalEnabled,
        publicAPI,
        enhancedSkeletons,
        floatingActionBar,
        fabSubmitAction,
        fabSearchAction,
        fabScrollToTop,
        fabNotifications,
        notificationsProvider,
        notificationsSheet,
        notificationsToasts,
        loggerConsole,
        loggerVerbose,
      ] = await Promise.all([
        createFeatureFlag('test_flag'),
        createFeatureFlag('referral_program'),
        createFeatureFlag('confetti_animations'),
        createFeatureFlag('recently_viewed_sidebar'),
        createFeatureFlag('compare_configs'),
        createFeatureFlag('promoted_configs'),
        createFeatureFlag('job_alerts'),
        createFeatureFlag('self_service_checkout'),
        createFeatureFlag('content_detail_tabs'),
        createFeatureFlag('interactive_onboarding'),
        createFeatureFlag('config_playground'),
        createFeatureFlag('contact_terminal_enabled'),
        createFeatureFlag('public_api'),
        createFeatureFlag('enhanced_skeletons'),
        createFeatureFlag('floating_action_bar'),
        createFeatureFlag('fab_submit_action'),
        createFeatureFlag('fab_search_action'),
        createFeatureFlag('fab_scroll_to_top'),
        createFeatureFlag('fab_notifications'),
        createFeatureFlag('notifications_provider'),
        createFeatureFlag('notifications_sheet'),
        createFeatureFlag('notifications_toasts'),
        createFeatureFlag('logger_console'),
        createFeatureFlag('logger_verbose'),
      ]);

      _featureFlags = {
        testFlag,
        referralProgram,
        confettiAnimations,
        recentlyViewed,
        compareConfigs,
        promotedConfigs,
        jobAlerts,
        selfServiceCheckout,
        contentDetailTabs,
        interactiveOnboarding,
        configPlayground,
        contactTerminalEnabled,
        publicAPI,
        enhancedSkeletons,
        floatingActionBar,
        fabSubmitAction,
        fabSearchAction,
        fabScrollToTop,
        fabNotifications,
        notificationsProvider,
        notificationsSheet,
        notificationsToasts,
        loggerConsole,
        loggerVerbose,
      };
      return _featureFlags;
    })();
  }
  return _featureFlagsPromise;
}

export const featureFlags: FeatureFlags = new Proxy({} as FeatureFlags, {
  get(_target, prop) {
    // Return a function that awaits the flag initialization, then calls the flag
    return async () => {
      const flags = await getFeatureFlags();
      const flagFn = flags[prop as keyof FeatureFlags];
      return flagFn();
    };
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
let _newsletterExperimentsPromise: Promise<{
  footerDelay: () => Promise<'10s' | '30s' | '60s'>;
  ctaVariant: () => Promise<'aggressive' | 'social_proof' | 'value_focused'>;
}> | null = null;

async function getNewsletterExperiments() {
  if (_newsletterExperiments) {
    return _newsletterExperiments;
  }
  if (!_newsletterExperimentsPromise) {
    _newsletterExperimentsPromise = (async () => {
      const [footerDelay, ctaVariant] = await Promise.all([
        createExperiment<'10s' | '30s' | '60s'>('newsletter_footer_delay', '30s'),
        createExperiment<'aggressive' | 'social_proof' | 'value_focused'>(
          'newsletter_cta_variant',
          'value_focused'
        ),
      ]);

      _newsletterExperiments = {
        footerDelay,
        ctaVariant,
      };
      return _newsletterExperiments;
    })();
  }
  return _newsletterExperimentsPromise;
}

export const newsletterExperiments = new Proxy(
  {} as {
    footerDelay: () => Promise<'10s' | '30s' | '60s'>;
    ctaVariant: () => Promise<'aggressive' | 'social_proof' | 'value_focused'>;
  },
  {
    get(_target, prop) {
      return async () => {
        const experiments = await getNewsletterExperiments();
        const experimentFn = experiments[prop as keyof typeof experiments];
        return experimentFn();
      };
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
let _appSettingsFnPromise: Promise<() => Promise<typeof APP_SETTINGS_DEFAULTS>> | null = null;
export const appSettings = async (): Promise<typeof APP_SETTINGS_DEFAULTS> => {
  if (!_appSettingsFn) {
    if (!_appSettingsFnPromise) {
      _appSettingsFnPromise = createDynamicConfigGroup('app_settings', APP_SETTINGS_DEFAULTS);
    }
    _appSettingsFn = await _appSettingsFnPromise;
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
let _componentConfigsFnPromise: Promise<() => Promise<typeof COMPONENT_CONFIG_DEFAULTS>> | null = null;
export const componentConfigs = async (): Promise<typeof COMPONENT_CONFIG_DEFAULTS> => {
  if (!_componentConfigsFn) {
    if (!_componentConfigsFnPromise) {
      _componentConfigsFnPromise = createDynamicConfigGroup('component_configs', COMPONENT_CONFIG_DEFAULTS);
    }
    _componentConfigsFn = await _componentConfigsFnPromise;
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
let _emailConfigsFnPromise: Promise<() => Promise<typeof EMAIL_CONFIG_DEFAULTS>> | null = null;
export const emailConfigs = async (): Promise<typeof EMAIL_CONFIG_DEFAULTS> => {
  if (!_emailConfigsFn) {
    if (!_emailConfigsFnPromise) {
      _emailConfigsFnPromise = createDynamicConfigGroup('email_configs', EMAIL_CONFIG_DEFAULTS);
    }
    _emailConfigsFn = await _emailConfigsFnPromise;
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
let _newsletterConfigsFnPromise: Promise<() => Promise<typeof NEWSLETTER_CONFIG_DEFAULTS>> | null = null;
export const newsletterConfigs = async (): Promise<typeof NEWSLETTER_CONFIG_DEFAULTS> => {
  if (!_newsletterConfigsFn) {
    if (!_newsletterConfigsFnPromise) {
      _newsletterConfigsFnPromise = createDynamicConfigGroup(
        'newsletter_configs',
        NEWSLETTER_CONFIG_DEFAULTS
      );
    }
    _newsletterConfigsFn = await _newsletterConfigsFnPromise;
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
let _pricingConfigsFnPromise: Promise<() => Promise<typeof PRICING_CONFIG_DEFAULTS>> | null = null;
export const pricingConfigs = async (): Promise<typeof PRICING_CONFIG_DEFAULTS> => {
  if (!_pricingConfigsFn) {
    if (!_pricingConfigsFnPromise) {
      _pricingConfigsFnPromise = createDynamicConfigGroup('pricing_configs', PRICING_CONFIG_DEFAULTS);
    }
    _pricingConfigsFn = await _pricingConfigsFnPromise;
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
let _pollingConfigsFnPromise: Promise<() => Promise<typeof POLLING_CONFIG_DEFAULTS>> | null = null;
export const pollingConfigs = async (): Promise<typeof POLLING_CONFIG_DEFAULTS> => {
  if (!_pollingConfigsFn) {
    if (!_pollingConfigsFnPromise) {
      _pollingConfigsFnPromise = createDynamicConfigGroup('polling_configs', POLLING_CONFIG_DEFAULTS);
    }
    _pollingConfigsFn = await _pollingConfigsFnPromise;
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
let _animationConfigsFnPromise: Promise<() => Promise<typeof ANIMATION_CONFIG_DEFAULTS>> | null = null;
export const animationConfigs = async (): Promise<typeof ANIMATION_CONFIG_DEFAULTS> => {
  if (!_animationConfigsFn) {
    if (!_animationConfigsFnPromise) {
      _animationConfigsFnPromise = createDynamicConfigGroup('animation_configs', ANIMATION_CONFIG_DEFAULTS);
    }
    _animationConfigsFn = await _animationConfigsFnPromise;
  }
  return _animationConfigsFn();
};

/** Timeout Configs - UI/API timeouts and retry logic */
// Lazy getter - only creates the config when first accessed
let timeoutConfigsFnPromise: Promise<() => Promise<typeof TIMEOUT_CONFIG_DEFAULTS>> | null = null;
export async function timeoutConfigs(): Promise<typeof TIMEOUT_CONFIG_DEFAULTS> {
  if (!timeoutConfigsFnPromise) {
    timeoutConfigsFnPromise = createDynamicConfigGroup('timeout_configs', TIMEOUT_CONFIG_DEFAULTS);
  }
  const fn = await timeoutConfigsFnPromise;
  return fn();
}

/**
 * Toast Configs - Toast notification messages
 * Enables copy testing and message updates without deploys
 * Usage: const config = await toastConfigs(); const message = config['toast.copied'];
 */
// Lazy getter - only creates the config when first accessed
let toastConfigsFnPromise: Promise<() => Promise<typeof TOAST_CONFIG_DEFAULTS>> | null = null;
export async function toastConfigs(): Promise<typeof TOAST_CONFIG_DEFAULTS> {
  if (!toastConfigsFnPromise) {
    toastConfigsFnPromise = createDynamicConfigGroup('toast_configs', TOAST_CONFIG_DEFAULTS);
  }
  const fn = await toastConfigsFnPromise;
  return fn();
}

/**
 * Homepage Configs - Homepage layout and categories
 * Controls which categories appear on homepage
 * Usage: const config = await homepageConfigs(); const categories = config['homepage.featured_categories'];
 */
// Lazy getter - only creates the config when first accessed
let homepageConfigsFnPromise: Promise<() => Promise<typeof HOMEPAGE_CONFIG_DEFAULTS>> | null = null;
export async function homepageConfigs(): Promise<typeof HOMEPAGE_CONFIG_DEFAULTS> {
  if (!homepageConfigsFnPromise) {
    homepageConfigsFnPromise = createDynamicConfigGroup('homepage_configs', HOMEPAGE_CONFIG_DEFAULTS);
  }
  const fn = await homepageConfigsFnPromise;
  return fn();
}

/**
 * Form Configs - Form validation and limits (Phase 3)
 * Controls file upload limits and form validation rules
 * Usage: const config = await formConfigs(); const maxSize = config['form.max_file_size_mb'];
 */
// Lazy getter - only creates the config when first accessed
let formConfigsFnPromise: Promise<() => Promise<typeof FORM_CONFIG_DEFAULTS>> | null = null;
export async function formConfigs(): Promise<typeof FORM_CONFIG_DEFAULTS> {
  if (!formConfigsFnPromise) {
    formConfigsFnPromise = createDynamicConfigGroup('form_configs', FORM_CONFIG_DEFAULTS);
  }
  const fn = await formConfigsFnPromise;
  return fn();
}

/**
 * Recently Viewed Configs - Recently viewed items settings (Phase 3)
 * Controls storage and display of recently viewed content
 * Usage: const config = await recentlyViewedConfigs(); const ttl = config['recently_viewed.ttl_days'];
 */
// Lazy getter - only creates the config when first accessed
let recentlyViewedConfigsFnPromise: Promise<() => Promise<typeof RECENTLY_VIEWED_CONFIG_DEFAULTS>> | null = null;
export async function recentlyViewedConfigs(): Promise<typeof RECENTLY_VIEWED_CONFIG_DEFAULTS> {
  if (!recentlyViewedConfigsFnPromise) {
    recentlyViewedConfigsFnPromise = createDynamicConfigGroup(
      'recently_viewed_configs',
      RECENTLY_VIEWED_CONFIG_DEFAULTS
    );
  }
  const fn = await recentlyViewedConfigsFnPromise;
  return fn();
}

/**
 * Cache Configs - Cache TTL settings and invalidation rules
 * Controls cache durations and invalidation tags across the application
 * Usage: const config = await cacheConfigs(); const ttl = config['cache.homepage.ttl_seconds'];
 */
// Lazy getter - only creates the config when first accessed
let cacheConfigsFnPromise: Promise<() => Promise<typeof CACHE_CONFIG_DEFAULTS>> | null = null;
export async function cacheConfigs(): Promise<typeof CACHE_CONFIG_DEFAULTS> {
  if (!cacheConfigsFnPromise) {
    cacheConfigsFnPromise = createDynamicConfigGroup('cache_configs', CACHE_CONFIG_DEFAULTS);
  }
  const fn = await cacheConfigsFnPromise;
  return fn();
}
