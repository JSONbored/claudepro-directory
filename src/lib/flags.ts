import { type StatsigUser, statsigAdapter } from '@flags-sdk/statsig';
import type { Identify } from 'flags';
import { dedupe, flag } from 'flags/next';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

/**
 * Identify function - provides user context for flag evaluation
 * Statsig uses this to do % rollouts, user targeting, etc.
 */
export const identify = dedupe((async () => {
  try {
    const supabase = await createClient();
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
