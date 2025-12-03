/**
 * Server-Only Constants
 * Functions that use static configuration values (server-only)
 */

import {
  DATE_CONFIG,
} from '../data/config/constants.ts';

import {
  POLLING_CONFIG,
  API_TIMEOUTS,
  TEST_TIMEOUTS,
  UI_TIMEOUTS,
} from './unified-config.ts';
import { animation } from '../design-system/tokens.ts';

/**
 * Get current date configuration from database
 * Falls back to hardcoded values if database unavailable
 */
export function getDateConfig() {
  // Get date config from DATE_CONFIG (which uses current date)
  const now = new Date();
  return {
    currentMonth: now.toISOString().slice(0, 7),
    currentYear: now.getFullYear(),
    currentDate: now.toISOString().split('T')[0],
    lastReviewed: now.toISOString().split('T')[0],
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
  // Get polling config from unified-config
  return {
    realtime: POLLING_CONFIG.realtime_ms,
    badges: POLLING_CONFIG.badges_ms,
    status: {
      health: POLLING_CONFIG['status.health_ms'],
      api: POLLING_CONFIG['status.api_ms'],
      database: POLLING_CONFIG['status.database_ms'],
    },
    analytics: {
      views: POLLING_CONFIG['analytics.views_ms'],
      stats: POLLING_CONFIG['analytics.stats_ms'],
    },
  };
}

/**
 * Get animation durations from static config
 * Returns values from static configuration defaults
 */
export function getAnimationDurations() {
  // Get animation config from design system tokens
  return {
    ticker: {
      default: animation.ticker.default,
      fast: animation.ticker.fast,
      slow: animation.ticker.slow,
    },
    stagger: {
      fast: animation.stagger.fast,
      medium: animation.stagger.medium,
      slow: animation.stagger.slow,
    },
    beam: {
      default: animation.borderBeam.default,
    },
  };
}

/**
 * Get timeout configurations from static config
 * Returns values from static configuration defaults
 */
export function getTimeouts() {
  // Get timeout config from unified-config and design system
  return {
    api: {
      default: API_TIMEOUTS.default_ms,
      long: API_TIMEOUTS.long_ms,
      short: API_TIMEOUTS.short_ms,
    },
    ui: {
      debounce: UI_TIMEOUTS.debounce_ms,
      tooltip: UI_TIMEOUTS.tooltip_ms,
      animation: animation.duration.animation,
      transition: animation.duration.transition,
    },
    test: {
      default: TEST_TIMEOUTS.default_ms,
      long: TEST_TIMEOUTS.long_ms,
      network: TEST_TIMEOUTS.network_ms,
    },
  };
}
