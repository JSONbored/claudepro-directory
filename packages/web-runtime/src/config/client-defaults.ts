/**
 * Client-Safe Config Defaults
 * 
 * These are static defaults that can be safely imported in Client Components.
 * They return immediately without calling server actions or feature flags.
 * 
 * For dynamic config values, use server actions from the server or pass props
 * from Server Components to Client Components.
 */

import { Constants } from '@heyclaude/database-types';

const CATEGORY_ENUM = Constants.public.Enums.content_category;

/**
 * Named category lookup to decouple from enum array ordering
 * Returns the category if found, otherwise falls back to the literal
 */
const getCategoryByName = (name: string) =>
  CATEGORY_ENUM.find((c) => c === name) ?? name;

// Named category constants for type-safe access
const CATEGORIES = {
  agents: getCategoryByName('agents'),
  mcp: getCategoryByName('mcp'),
  rules: getCategoryByName('rules'),
  commands: getCategoryByName('commands'),
  hooks: getCategoryByName('hooks'),
  statuslines: getCategoryByName('statuslines'),
  skills: getCategoryByName('skills'),
  collections: getCategoryByName('collections'),
  guides: getCategoryByName('guides'),
} as const;

// Animation Config Defaults - Safe for client import
export const ANIMATION_CONFIG_CLIENT_DEFAULTS = {
  'animation.ticker.default_ms': 1500,
  'animation.ticker.fast_ms': 1000,
  'animation.ticker.slow_ms': 2000,
  'animation.stagger.fast_ms': 100,
  'animation.stagger.medium_ms': 200,
  'animation.stagger.slow_ms': 300,
  'animation.beam.default_ms': 15_000,
  'animation.card.stagger_ms': 100,
  'animation.spring.default.stiffness': 400,
  'animation.spring.default.damping': 17,
  'animation.spring.bouncy.stiffness': 500,
  'animation.spring.bouncy.damping': 20,
  'animation.spring.smooth.stiffness': 300,
  'animation.spring.smooth.damping': 25,
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

// Homepage Config Defaults - Safe for client import
export const HOMEPAGE_CONFIG_CLIENT_DEFAULTS = {
  'homepage.featured_categories': [
    CATEGORIES.agents,
    CATEGORIES.mcp,
    CATEGORIES.commands,
    CATEGORIES.rules,
    CATEGORIES.skills,
    CATEGORIES.collections,
    CATEGORIES.hooks,
    CATEGORIES.statuslines,
  ] as const,
  'homepage.tab_categories': [
    'all',
    CATEGORIES.agents,
    CATEGORIES.mcp,
    CATEGORIES.commands,
    CATEGORIES.rules,
    CATEGORIES.hooks,
    CATEGORIES.statuslines,
    CATEGORIES.collections,
    CATEGORIES.guides,
    'community',
  ] as const,
} as const;

// Polling Config Defaults - Safe for client import
export const POLLING_CONFIG_CLIENT_DEFAULTS = {
  'polling.realtime_ms': 1000,
  'polling.badges_ms': 30_000,
  'polling.status.health_ms': 60_000,
  'polling.status.api_ms': 30_000,
  'polling.status.database_ms': 120_000,
  'polling.analytics.views_ms': 60_000,
  'polling.analytics.stats_ms': 300_000,
  'polling.newsletter_count_ms': 300_000,
} as const;

// Timeout Config Defaults - Safe for client import
export const TIMEOUT_CONFIG_CLIENT_DEFAULTS = {
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
  'timeout.api.long_ms': 10_000,
  'timeout.api.short_ms': 2000,
  'timeout.test.default_ms': 5000,
  'timeout.test.long_ms': 10_000,
  'timeout.test.network_ms': 5000,
  'retry.api.initial_delay_ms': 1000,
  'retry.api.exponential_delay_ms': 2000,
  'retry.api.max_delay_ms': 10_000,
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

// Recently Viewed Config Defaults - Safe for client import
export const RECENTLY_VIEWED_CONFIG_CLIENT_DEFAULTS = {
  'recently_viewed.ttl_days': 30,
  'recently_viewed.max_items': 10,
  'recently_viewed.max_description_length': 150,
  'recently_viewed.max_tags': 5,
} as const;

// Newsletter Config Defaults - Safe for client import
export const NEWSLETTER_CONFIG_CLIENT_DEFAULTS = {
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
  'newsletter.footer_bar.show_after_delay_ms': 30_000,
  'newsletter.scroll_trigger.min_scroll_height_px': 500,
  'newsletter.max_retries': 3,
  'newsletter.initial_retry_delay_ms': 1000,
  'newsletter.retry_backoff_multiplier': 2,
  'newsletter.show_footer_bar': true,
  'newsletter.show_scroll_trigger': true,
} as const;

// App Settings Defaults - Safe for client import
export const APP_SETTINGS_CLIENT_DEFAULTS = {
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
  ] as const,
  'hooks.infinite_scroll.batch_size': 30,
  'queue.pulse.batch_size': 100,
  'hooks.infinite_scroll.threshold': 0.1,
  'date.current_month': new Date().toISOString().slice(0, 7),
  'date.current_year': new Date().getFullYear(),
  'date.current_date': new Date().toISOString().split('T')[0],
  'date.last_reviewed': new Date().toISOString().split('T')[0],
} as const;

/**
 * Client-safe function to get animation config
 * Returns static defaults immediately without calling server actions
 */
export function getAnimationConfig() {
  return Promise.resolve(ANIMATION_CONFIG_CLIENT_DEFAULTS);
}

/**
 * Client-safe function to get homepage featured categories
 * Returns static defaults immediately
 */
export function getHomepageFeaturedCategories() {
  return Promise.resolve(HOMEPAGE_CONFIG_CLIENT_DEFAULTS['homepage.featured_categories']);
}

/**
 * Client-safe function to get homepage tab categories
 * Returns static defaults immediately
 */
export function getHomepageTabCategories() {
  return Promise.resolve(HOMEPAGE_CONFIG_CLIENT_DEFAULTS['homepage.tab_categories']);
}

/**
 * Client-safe function to get polling config
 * Returns static defaults immediately
 */
export function getPollingConfig() {
  return Promise.resolve(POLLING_CONFIG_CLIENT_DEFAULTS);
}

/**
 * Client-safe function to get timeout config
 * Returns static defaults immediately without calling server actions
 */
export function getTimeoutConfig() {
  return Promise.resolve(TIMEOUT_CONFIG_CLIENT_DEFAULTS);
}

/**
 * Client-safe function to get recently viewed config
 * Returns static defaults immediately
 */
export function getRecentlyViewedConfig() {
  return Promise.resolve(RECENTLY_VIEWED_CONFIG_CLIENT_DEFAULTS);
}

/**
 * Client-safe function to get newsletter config
 * Returns static defaults immediately without calling server actions
 */
export function getNewsletterConfig() {
  return Promise.resolve({ data: NEWSLETTER_CONFIG_CLIENT_DEFAULTS });
}

/**
 * Client-safe function to get a specific newsletter config value
 * Returns the static default value for the requested key
 */
export function getNewsletterConfigValue(input: { key: string }) {
  const { key } = input;
  const config = NEWSLETTER_CONFIG_CLIENT_DEFAULTS as Record<string, unknown>;
  return Promise.resolve({ 
    data: config[key] ?? null 
  });
}

/**
 * Client-safe function to get app settings
 * Returns static defaults immediately without calling server actions
 */
export function getAppSettings() {
  return Promise.resolve({ data: APP_SETTINGS_CLIENT_DEFAULTS });
}

/**
 * Client-safe function to check if confetti is enabled
 * Returns static default (disabled in client contexts, enabled via server props)
 */
export function checkConfettiEnabled() {
  return Promise.resolve({ data: false });
}
