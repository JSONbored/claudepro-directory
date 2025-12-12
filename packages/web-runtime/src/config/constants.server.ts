/**
 * Server-Only Constants
 * Functions that use static configuration values (server-only)
 */

import {
  DATE_CONFIG,
} from '../data/config/constants.ts';

import {
  getAnimationConfig,
  getAppSettings,
  getPollingConfig,
  getTimeoutConfig,
} from "./static-configs.ts";

/**
 * Get current date configuration from database
 * Falls back to hardcoded values if database unavailable
 */
export function getDateConfig() {
  // Get app settings from static defaults
  const config = getAppSettings();
  return {
    currentMonth: config['date.current_month'],
    currentYear: config['date.current_year'],
    currentDate: config['date.current_date'],
    lastReviewed: config['date.last_reviewed'],
    claudeModels: DATE_CONFIG.claudeModels,
  };
}

/**
 * Get formatted date strings for SEO templates
 */
export function getDateStrings() {
  const config = getDateConfig();
  return {
    current: `${config.currentMonth} ${config.currentYear}`,
    seo: `${config.currentMonth.toLowerCase()} ${config.currentYear}`,
  };
}

/**
 * Get polling intervals from static config
 * Returns values from static configuration defaults
 */
export function getPollingIntervals() {
  // Get polling config from static defaults
  const config = getPollingConfig();
  return {
    realtime: config['polling.realtime_ms'],
    badges: config['polling.badges_ms'],
    status: {
      health: config['polling.status.health_ms'],
      api: config['polling.status.api_ms'],
      database: config['polling.status.database_ms'],
    },
    analytics: {
      views: config['polling.analytics.views_ms'],
      stats: config['polling.analytics.stats_ms'],
    },
  };
}

/**
 * Get animation durations from static config
 * Returns values from static configuration defaults
 */
export function getAnimationDurations() {
  // Get animation config from static defaults
  const config = getAnimationConfig();
  return {
    ticker: {
      default: config['animation.ticker.default_ms'],
      fast: config['animation.ticker.fast_ms'],
      slow: config['animation.ticker.slow_ms'],
    },
    beam: {
      default: config['animation.beam.default_ms'],
    },
  };
}

/**
 * Get timeout configurations from static config
 * Returns values from static configuration defaults
 */
export function getTimeouts() {
  // Get timeout config from static defaults
  const config = getTimeoutConfig();
  return {
    api: {
      default: config['timeout.api.default_ms'],
      long: config['timeout.api.long_ms'],
      short: config['timeout.api.short_ms'],
    },
    ui: {
      debounce: config['timeout.ui.debounce_ms'],
      tooltip: config['timeout.ui.tooltip_ms'],
      animation: config['timeout.ui.animation_ms'],
      transition: config['timeout.ui.transition_ms'],
    },
    test: {
      default: config['timeout.test.default_ms'],
      long: config['timeout.test.long_ms'],
      network: config['timeout.test.network_ms'],
    },
  };
}
