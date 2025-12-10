/**
 * Static Config Accessors
 *
 * Synchronous functions that return static configuration values.
 * All configuration is defined in unified-config.ts - single source of truth.
 *
 * @module web-runtime/config/static-configs
 */

import {
  API_TIMEOUTS,
  COMPONENT_FLAGS,
  CONFETTI_CONFIG,
  HOMEPAGE_CONFIG,
  INFINITE_SCROLL_CONFIG,
  NEWSLETTER_BEHAVIOR,
  NEWSLETTER_CTA,
  POLLING_CONFIG,
  RECENTLY_VIEWED_CONFIG,
  TEST_TIMEOUTS,
  UI_ANIMATION,
  UI_TIMEOUTS,
} from './unified-config.ts';
import { mapComponentCardConfig } from '../utils/component-card-config.ts';

// =============================================================================
// BACKWARD COMPATIBILITY TYPES
// =============================================================================

/** Legacy app settings shape for backward compatibility */
const APP_SETTINGS_COMPAT = {
  'newsletter.excluded_pages': NEWSLETTER_BEHAVIOR.excluded_pages,
  'hooks.infinite_scroll.batch_size': INFINITE_SCROLL_CONFIG.batch_size,
  'queue.pulse.batch_size': 100,
  'hooks.infinite_scroll.threshold': INFINITE_SCROLL_CONFIG.threshold,
  'date.current_month': new Date().toISOString().slice(0, 7),
  'date.current_year': new Date().getFullYear(),
  'date.current_date': new Date().toISOString().split('T')[0],
  'date.last_reviewed': new Date().toISOString().split('T')[0],
} as const;

/** Legacy animation config shape */
const ANIMATION_CONFIG_COMPAT = {
  'animation.ticker.default_ms': UI_ANIMATION['ticker.default_ms'],
  'animation.ticker.fast_ms': UI_ANIMATION['ticker.fast_ms'],
  'animation.ticker.slow_ms': UI_ANIMATION['ticker.slow_ms'],
  'animation.beam.default_ms': UI_ANIMATION['beam.default_ms'],
  'confetti.success.particle_count': CONFETTI_CONFIG['success.particle_count'],
  'confetti.success.spread': CONFETTI_CONFIG['success.spread'],
  'confetti.success.ticks': CONFETTI_CONFIG['success.ticks'],
  'confetti.celebration.particle_count': CONFETTI_CONFIG['celebration.particle_count'],
  'confetti.celebration.spread': CONFETTI_CONFIG['celebration.spread'],
  'confetti.celebration.ticks': CONFETTI_CONFIG['celebration.ticks'],
  'confetti.milestone.particle_count': CONFETTI_CONFIG['milestone.particle_count'],
  'confetti.milestone.spread': CONFETTI_CONFIG['milestone.spread'],
  'confetti.milestone.ticks': CONFETTI_CONFIG['milestone.ticks'],
  'confetti.milestone.scalar': CONFETTI_CONFIG['milestone.scalar'],
  'confetti.subtle.particle_count': CONFETTI_CONFIG['subtle.particle_count'],
  'confetti.subtle.spread': CONFETTI_CONFIG['subtle.spread'],
  'confetti.subtle.ticks': CONFETTI_CONFIG['subtle.ticks'],
} as const;

/** Legacy timeout config shape */
const TIMEOUT_CONFIG_COMPAT = {
  // UI timeouts
  'timeout.ui.debounce_ms': UI_TIMEOUTS.debounce_ms,
  'timeout.ui.tooltip_ms': UI_TIMEOUTS.tooltip_ms,
  'timeout.ui.animation_ms': UI_TIMEOUTS.animation_ms,
  'timeout.ui.transition_ms': UI_TIMEOUTS.transition_ms,
  'timeout.ui.prefetch_delay_ms': UI_TIMEOUTS.prefetch_delay_ms,
  'timeout.ui.button_success_duration_ms': UI_TIMEOUTS.button_success_duration_ms,
  'timeout.ui.clipboard_reset_delay_ms': UI_TIMEOUTS.clipboard_reset_delay_ms,
  'timeout.ui.modal_close_delay_ms': UI_TIMEOUTS.modal_close_delay_ms,
  'timeout.ui.dropdown_open_delay_ms': UI_TIMEOUTS.dropdown_open_delay_ms,
  'timeout.ui.hover_activate_delay_ms': UI_TIMEOUTS.hover_activate_delay_ms,
  'timeout.ui.scroll_direction_threshold_px': UI_TIMEOUTS.scroll_direction_threshold_px,
  'timeout.ui.scroll_hysteresis_px': UI_TIMEOUTS.scroll_hysteresis_px,
  'timeout.ui.form_debounce_ms': UI_TIMEOUTS.form_debounce_ms,
  // API timeouts
  'timeout.api.default_ms': API_TIMEOUTS.default_ms,
  'timeout.api.long_ms': API_TIMEOUTS.long_ms,
  'timeout.api.short_ms': API_TIMEOUTS.short_ms,
  // Test timeouts
  'timeout.test.default_ms': TEST_TIMEOUTS.default_ms,
  'timeout.test.long_ms': TEST_TIMEOUTS.long_ms,
  'timeout.test.network_ms': TEST_TIMEOUTS.network_ms,
} as const;

/** Legacy homepage config shape */
const HOMEPAGE_CONFIG_COMPAT = {
  'homepage.featured_categories': HOMEPAGE_CONFIG.featured_categories,
  'homepage.tab_categories': HOMEPAGE_CONFIG.tab_categories,
} as const;

/** Legacy newsletter config shape */
const NEWSLETTER_CONFIG_COMPAT = {
  'newsletter.cta.aggressive.headline': NEWSLETTER_CTA['aggressive.headline'],
  'newsletter.cta.social_proof.headline': NEWSLETTER_CTA['social_proof.headline'],
  'newsletter.cta.value_focused.headline': NEWSLETTER_CTA['value_focused.headline'],
  'newsletter.cta.aggressive.description': NEWSLETTER_CTA['aggressive.description'],
  'newsletter.cta.social_proof.description': NEWSLETTER_CTA['social_proof.description'],
  'newsletter.cta.value_focused.description': NEWSLETTER_CTA['value_focused.description'],
  'newsletter.contextual.agents.headline': NEWSLETTER_CTA['contextual.agents.headline'],
  'newsletter.contextual.agents.description': NEWSLETTER_CTA['contextual.agents.description'],
  'newsletter.contextual.mcp.headline': NEWSLETTER_CTA['contextual.mcp.headline'],
  'newsletter.contextual.mcp.description': NEWSLETTER_CTA['contextual.mcp.description'],
  'newsletter.contextual.guides.headline': NEWSLETTER_CTA['contextual.guides.headline'],
  'newsletter.contextual.guides.description': NEWSLETTER_CTA['contextual.guides.description'],
  'newsletter.footer_text': NEWSLETTER_CTA.footer_text,
  'newsletter.show_subscriber_count': NEWSLETTER_BEHAVIOR.show_subscriber_count,
  'newsletter.footer_bar.show_after_delay_ms': NEWSLETTER_BEHAVIOR.footer_bar_show_after_delay_ms,
  'newsletter.scroll_trigger.min_scroll_height_px': NEWSLETTER_BEHAVIOR.scroll_trigger_min_scroll_height_px,
  'newsletter.max_retries': NEWSLETTER_BEHAVIOR.max_retries,
  'newsletter.initial_retry_delay_ms': NEWSLETTER_BEHAVIOR.initial_retry_delay_ms,
  'newsletter.retry_backoff_multiplier': NEWSLETTER_BEHAVIOR.retry_backoff_multiplier,
  'newsletter.show_footer_bar': NEWSLETTER_BEHAVIOR.show_footer_bar,
  'newsletter.show_scroll_trigger': NEWSLETTER_BEHAVIOR.show_scroll_trigger,
} as const;

/** Legacy polling config shape */
const POLLING_CONFIG_COMPAT = {
  'polling.realtime_ms': POLLING_CONFIG.realtime_ms,
  'polling.badges_ms': POLLING_CONFIG.badges_ms,
  'polling.status.health_ms': POLLING_CONFIG['status.health_ms'],
  'polling.status.api_ms': POLLING_CONFIG['status.api_ms'],
  'polling.status.database_ms': POLLING_CONFIG['status.database_ms'],
  'polling.analytics.views_ms': POLLING_CONFIG['analytics.views_ms'],
  'polling.analytics.stats_ms': POLLING_CONFIG['analytics.stats_ms'],
  'polling.newsletter_count_ms': POLLING_CONFIG.newsletter_count_ms,
} as const;

/** Legacy recently viewed config shape */
const RECENTLY_VIEWED_CONFIG_COMPAT = {
  'recently_viewed.ttl_days': RECENTLY_VIEWED_CONFIG.ttl_days,
  'recently_viewed.max_items': RECENTLY_VIEWED_CONFIG.max_items,
  'recently_viewed.max_description_length': RECENTLY_VIEWED_CONFIG.max_description_length,
  'recently_viewed.max_tags': RECENTLY_VIEWED_CONFIG.max_tags,
} as const;

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get component configuration
 * Returns component visibility flags
 */
export function getComponentConfig() {
  return COMPONENT_FLAGS;
}

/**
 * Get component card configuration (mapped format)
 * Returns mapped component card config from static defaults
 */
export function getComponentCardConfig() {
  return mapComponentCardConfig(COMPONENT_FLAGS);
}

/**
 * Get homepage config bundle
 * Returns all homepage-related configs in a single bundle
 */
export function getHomepageConfigBundle() {
  return {
    homepageConfig: HOMEPAGE_CONFIG_COMPAT,
    animationConfig: ANIMATION_CONFIG_COMPAT,
    appSettings: APP_SETTINGS_COMPAT,
  };
}

/**
 * Get animation config
 * Returns animation timing and physics settings
 */
export function getAnimationConfig() {
  return ANIMATION_CONFIG_COMPAT;
}

/**
 * Get timeout config
 * Returns UI timeout settings
 */
export function getTimeoutConfig() {
  return TIMEOUT_CONFIG_COMPAT;
}

/**
 * Get newsletter config
 * Returns newsletter CTA and behavior settings
 */
export function getNewsletterConfig() {
  return NEWSLETTER_CONFIG_COMPAT;
}

/**
 * Get newsletter config value by key
 * @param key - The config key to retrieve
 */
export function getNewsletterConfigValue(key: string) {
  const config = NEWSLETTER_CONFIG_COMPAT as Record<string, unknown>;
  return config[key] ?? null;
}

/**
 * Get app settings
 * Returns general app settings
 */
export function getAppSettings() {
  return APP_SETTINGS_COMPAT;
}

/**
 * Get polling config
 * Returns polling interval settings
 */
export function getPollingConfig() {
  return POLLING_CONFIG_COMPAT;
}

/**
 * Get recently viewed config
 * Returns recently viewed feature settings
 */
export function getRecentlyViewedConfig() {
  return RECENTLY_VIEWED_CONFIG_COMPAT;
}

/**
 * Check if confetti animations are enabled
 * @returns true (confetti enabled)
 */
export function checkConfettiEnabled() {
  return true;
}
