/**
 * Server-Only Constants
 * Functions that require Statsig flags (server-only)
 */

import {
  getAnimationConfig,
  getAppSettings,
  getPollingConfig,
  getTimeoutConfig,
} from '@heyclaude/web-runtime';
import {
  ANIMATION_DURATIONS,
  DATE_CONFIG,
  POLLING_INTERVALS,
  TIMEOUTS,
} from '@/src/lib/data/config/constants';

/**
 * Get current date configuration from database
 * Falls back to hardcoded values if database unavailable
 */
export async function getDateConfig() {
  try {
    const result = await getAppSettings({});
    if (!result?.data) {
      return DATE_CONFIG;
    }
    const config = result.data;
    return {
      currentMonth: config['date.current_month'],
      currentYear: config['date.current_year'],
      currentDate: config['date.current_date'],
      lastReviewed: config['date.last_reviewed'],
      claudeModels: DATE_CONFIG.claudeModels,
    };
  } catch {
    return DATE_CONFIG;
  }
}

/**
 * Get formatted date strings for SEO templates
 */
export async function getDateStrings() {
  const config = await getDateConfig();
  return {
    current: `${config.currentMonth} ${config.currentYear}`,
    seo: `${config.currentMonth.toLowerCase()} ${config.currentYear}`,
  };
}

/**
 * Get polling intervals from Statsig Dynamic Configs
 * Falls back to hardcoded POLLING_INTERVALS if unavailable
 */
export async function getPollingIntervals() {
  try {
    const result = await getPollingConfig({});
    if (!result?.data) {
      return POLLING_INTERVALS;
    }
    const config = result.data;
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
  } catch {
    return POLLING_INTERVALS;
  }
}

/**
 * Get animation durations from Statsig Dynamic Configs
 * Falls back to hardcoded ANIMATION_DURATIONS if unavailable
 */
export async function getAnimationDurations() {
  try {
    const result = await getAnimationConfig({});
    if (!result?.data) {
      return ANIMATION_DURATIONS;
    }
    const config = result.data;
    return {
      ticker: {
        default: config['animation.ticker.default_ms'],
        fast: config['animation.ticker.fast_ms'],
        slow: config['animation.ticker.slow_ms'],
      },
      stagger: {
        fast: config['animation.stagger.fast_ms'],
        medium: config['animation.stagger.medium_ms'],
        slow: config['animation.stagger.slow_ms'],
      },
      beam: {
        default: config['animation.beam.default_ms'],
      },
    };
  } catch {
    return ANIMATION_DURATIONS;
  }
}

/**
 * Get timeout configurations from Statsig Dynamic Configs
 * Falls back to hardcoded TIMEOUTS if unavailable
 */
export async function getTimeouts() {
  try {
    const result = await getTimeoutConfig({});
    if (!result?.data) {
      return TIMEOUTS;
    }
    const config = result.data;
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
  } catch {
    return TIMEOUTS;
  }
}
