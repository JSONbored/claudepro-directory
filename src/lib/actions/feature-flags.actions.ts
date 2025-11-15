/**
 * Feature Flags Server Actions
 * Wraps Statsig flag checks for use in client components
 */

'use server';

import {
  animationConfigs,
  appSettings,
  cacheConfigs,
  componentConfigs,
  featureFlags,
  formConfigs,
  homepageConfigs,
  newsletterConfigs,
  pollingConfigs,
  pricingConfigs,
  recentlyViewedConfigs,
  timeoutConfigs,
} from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

/**
 * Check if confetti animations are enabled
 */
export async function checkConfettiEnabled(): Promise<boolean> {
  return fetchWithLogging(
    'confettiAnimations',
    () => featureFlags.confettiAnimations(),
    () => false
  );
}

/**
 * Get newsletter configuration from Statsig
 */
export async function getNewsletterConfig(): Promise<Record<string, unknown>> {
  return fetchWithLogging('newsletterConfigs', newsletterConfigs, emptyObject);
}

/**
 * Get pricing configuration from Statsig
 */
export async function getPricingConfig(): Promise<Record<string, unknown>> {
  return fetchWithLogging('pricingConfigs', pricingConfigs, emptyObject);
}

/**
 * Get animation configuration from Statsig
 */
export async function getAnimationConfig(): Promise<Record<string, unknown>> {
  return fetchWithLogging('animationConfigs', animationConfigs, emptyObject);
}

/**
 * Get timeout configuration from Statsig
 */
export async function getTimeoutConfig(): Promise<Record<string, unknown>> {
  return fetchWithLogging('timeoutConfigs', timeoutConfigs, emptyObject);
}

/**
 * Get form validation configuration from Statsig
 */
export async function getFormConfig(): Promise<Record<string, unknown>> {
  return fetchWithLogging('formConfigs', formConfigs, emptyObject);
}

/**
 * Get recently viewed configuration from Statsig
 */
export async function getRecentlyViewedConfig(): Promise<Record<string, unknown>> {
  return fetchWithLogging('recentlyViewedConfigs', recentlyViewedConfigs, emptyObject);
}

/**
 * Get app settings configuration from Statsig
 */
export async function getAppSettings(): Promise<Record<string, unknown>> {
  return fetchWithLogging('appSettings', appSettings, emptyObject);
}

/**
 * Get cache configuration from Statsig
 */
export async function getCacheConfig(): Promise<Record<string, unknown>> {
  return fetchWithLogging('cacheConfigs', cacheConfigs, emptyObject);
}

/**
 * Get polling configuration from Statsig
 */
export async function getPollingConfig(): Promise<Record<string, unknown>> {
  return fetchWithLogging('pollingConfigs', pollingConfigs, emptyObject);
}

/**
 * Get component configuration from Statsig
 */
export async function getComponentConfig(): Promise<Record<string, unknown>> {
  return fetchWithLogging('componentConfigs', componentConfigs, emptyObject);
}

/**
 * Get homepage configuration from Statsig
 */
export async function getHomepageConfig(): Promise<Record<string, unknown>> {
  return fetchWithLogging('homepageConfigs', homepageConfigs, emptyObject);
}

function emptyObject(): Record<string, unknown> {
  return {};
}

async function fetchWithLogging<T>(
  label: string,
  fetcher: () => Promise<T>,
  fallbackFactory: () => T
): Promise<T> {
  try {
    return await fetcher();
  } catch (error) {
    const normalized = normalizeError(error, `Failed to load ${label}`);
    logger.error(`FeatureFlags: ${label} fetch failed`, normalized);
    return fallbackFactory();
  }
}
