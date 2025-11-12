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
  'search.enabled': true,
  'search.min_query_length': 2,
  'search.max_results': 50,
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
