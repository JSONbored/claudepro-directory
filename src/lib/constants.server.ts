/**
 * Server-Only Constants
 * Functions that require Statsig flags (server-only)
 */

import { animationConfigs, appSettings, pollingConfigs, timeoutConfigs } from '@/src/lib/flags';
import { ANIMATION_DURATIONS, DATE_CONFIG, POLLING_INTERVALS, TIMEOUTS } from './constants';

/**
 * Get current date configuration from database
 * Falls back to hardcoded values if database unavailable
 */
export async function getDateConfig() {
  try {
    const config = await appSettings();
    return {
      currentMonth: (config['date.current_month'] as string) ?? DATE_CONFIG.currentMonth,
      currentYear: (config['date.current_year'] as number) ?? DATE_CONFIG.currentYear,
      currentDate: (config['date.current_date'] as string) ?? DATE_CONFIG.currentDate,
      lastReviewed: (config['date.last_reviewed'] as string) ?? DATE_CONFIG.lastReviewed,
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
    const config = await pollingConfigs();
    return {
      realtime: (config['polling.realtime_ms'] as number) ?? POLLING_INTERVALS.realtime,
      badges: (config['polling.badges_ms'] as number) ?? POLLING_INTERVALS.badges,
      status: {
        health: (config['polling.status.health_ms'] as number) ?? POLLING_INTERVALS.status.health,
        api: (config['polling.status.api_ms'] as number) ?? POLLING_INTERVALS.status.api,
        database:
          (config['polling.status.database_ms'] as number) ?? POLLING_INTERVALS.status.database,
      },
      analytics: {
        views: (config['polling.analytics.views_ms'] as number) ?? 60000,
        stats: (config['polling.analytics.stats_ms'] as number) ?? 300000,
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
    const config = await animationConfigs();
    return {
      ticker: {
        default:
          (config['animation.ticker.default_ms'] as number) ?? ANIMATION_DURATIONS.ticker.default,
        fast: (config['animation.ticker.fast_ms'] as number) ?? ANIMATION_DURATIONS.ticker.fast,
        slow: (config['animation.ticker.slow_ms'] as number) ?? ANIMATION_DURATIONS.ticker.slow,
      },
      stagger: {
        fast: (config['animation.stagger.fast_ms'] as number) ?? ANIMATION_DURATIONS.stagger.fast,
        medium:
          (config['animation.stagger.medium_ms'] as number) ?? ANIMATION_DURATIONS.stagger.medium,
        slow: (config['animation.stagger.slow_ms'] as number) ?? ANIMATION_DURATIONS.stagger.slow,
      },
      beam: {
        default:
          (config['animation.beam.default_ms'] as number) ?? ANIMATION_DURATIONS.beam.default,
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
    const config = await timeoutConfigs();
    return {
      api: {
        default: (config['timeout.api.default_ms'] as number) ?? 5000,
        long: (config['timeout.api.long_ms'] as number) ?? 10000,
        short: (config['timeout.api.short_ms'] as number) ?? 2000,
      },
      ui: {
        debounce: (config['timeout.ui.debounce_ms'] as number) ?? TIMEOUTS.ui.debounce,
        tooltip: (config['timeout.ui.tooltip_ms'] as number) ?? TIMEOUTS.ui.tooltip,
        animation: (config['timeout.ui.animation_ms'] as number) ?? TIMEOUTS.ui.animation,
        transition: (config['timeout.ui.transition_ms'] as number) ?? TIMEOUTS.ui.transition,
      },
      test: {
        default: (config['timeout.test.default_ms'] as number) ?? 5000,
        long: (config['timeout.test.long_ms'] as number) ?? 10000,
        network: (config['timeout.test.network_ms'] as number) ?? 5000,
      },
    };
  } catch {
    return TIMEOUTS;
  }
}
