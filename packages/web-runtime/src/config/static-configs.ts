/**
 * Static Config Accessors
 * 
 * Synchronous functions that return static default values.
 * Provides static configuration values from version-controlled defaults.
 * 
 * All functions are synchronous and return values directly from defaults.ts
 * to avoid async complexity and external service dependencies.
 */

import {
  ANIMATION_CONFIG_DEFAULTS,
  APP_SETTINGS_DEFAULTS,
  COMPONENT_CONFIG_DEFAULTS,
  HOMEPAGE_CONFIG_DEFAULTS,
  NEWSLETTER_CONFIG_DEFAULTS,
  POLLING_CONFIG_DEFAULTS,
  RECENTLY_VIEWED_CONFIG_DEFAULTS,
  TIMEOUT_CONFIG_DEFAULTS,
} from '../feature-flags/defaults.ts';
import { mapComponentCardConfig } from '../hooks/use-component-card-config.tsx';

/**
 * Get component configuration
 * Returns static defaults (synchronous)
 */
export function getComponentConfig(): typeof COMPONENT_CONFIG_DEFAULTS {
  return COMPONENT_CONFIG_DEFAULTS;
}

/**
 * Get component card configuration (mapped format)
 * Returns mapped component card config from static defaults
 */
export function getComponentCardConfig() {
  return mapComponentCardConfig(COMPONENT_CONFIG_DEFAULTS);
}

/**
 * Get homepage config bundle
 * Returns all homepage-related configs in a single bundle (synchronous)
 * Includes: homepage config, animation config, app settings
 */
export function getHomepageConfigBundle() {
  return {
    homepageConfig: HOMEPAGE_CONFIG_DEFAULTS,
    animationConfig: ANIMATION_CONFIG_DEFAULTS,
    appSettings: APP_SETTINGS_DEFAULTS,
  };
}

/**
 * Get animation config
 * Returns static defaults (synchronous)
 */
export function getAnimationConfig() {
  return ANIMATION_CONFIG_DEFAULTS;
}

/**
 * Get timeout config
 * Returns static defaults (synchronous)
 */
export function getTimeoutConfig() {
  return TIMEOUT_CONFIG_DEFAULTS;
}

/**
 * Get newsletter config
 * Returns static defaults (synchronous)
 */
export function getNewsletterConfig() {
  return NEWSLETTER_CONFIG_DEFAULTS;
}

/**
 * Get newsletter config value by key
 * Returns static default value for the key (synchronous)
 */
export function getNewsletterConfigValue(key: string) {
  const config = NEWSLETTER_CONFIG_DEFAULTS as Record<string, unknown>;
  return config[key] ?? null;
}

/**
 * Get app settings
 * Returns static defaults (synchronous)
 */
export function getAppSettings() {
  return APP_SETTINGS_DEFAULTS;
}

/**
 * Get polling config
 * Returns static defaults (synchronous)
 */
export function getPollingConfig() {
  return POLLING_CONFIG_DEFAULTS;
}

/**
 * Get recently viewed config
 * Returns static defaults (synchronous)
 */
export function getRecentlyViewedConfig() {
  return RECENTLY_VIEWED_CONFIG_DEFAULTS;
}

/**
 * Check if confetti animations are enabled
 * Returns static default (synchronous)
 */
export function checkConfettiEnabled() {
  // Static default: confetti disabled
  return false;
}
