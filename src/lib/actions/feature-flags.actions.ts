/**
 * Feature Flags Server Actions
 * Wraps Statsig flag checks for use in client components
 */

'use server';

import { traceMeta } from '@/src/lib/actions/action-helpers';
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

type ConfigRecord = Record<string, unknown>;

type NewsletterConfigSchema = Awaited<ReturnType<typeof newsletterConfigs>>;
type PricingConfigSchema = Awaited<ReturnType<typeof pricingConfigs>>;
type AnimationConfigSchema = Awaited<ReturnType<typeof animationConfigs>>;
type TimeoutConfigSchema = Awaited<ReturnType<typeof timeoutConfigs>>;
type FormConfigSchema = Awaited<ReturnType<typeof formConfigs>>;
type RecentlyViewedConfigSchema = Awaited<ReturnType<typeof recentlyViewedConfigs>>;
type AppSettingsConfigSchema = Awaited<ReturnType<typeof appSettings>>;
type CacheConfigSchema = Awaited<ReturnType<typeof cacheConfigs>>;
type PollingConfigSchema = Awaited<ReturnType<typeof pollingConfigs>>;
type ComponentConfigSchema = Awaited<ReturnType<typeof componentConfigs>>;
type HomepageConfigSchema = Awaited<ReturnType<typeof homepageConfigs>>;

function emptyObject<T extends ConfigRecord>(): T {
  return {} as T;
}

/**
 * Get newsletter configuration from Statsig
 */
export async function getNewsletterConfig(): Promise<NewsletterConfigSchema> {
  return fetchWithLogging<NewsletterConfigSchema>(
    'newsletterConfigs',
    () => newsletterConfigs(),
    () => emptyObject<NewsletterConfigSchema>()
  );
}

/**
 * Get pricing configuration from Statsig
 */
export async function getPricingConfig(): Promise<PricingConfigSchema> {
  return fetchWithLogging<PricingConfigSchema>(
    'pricingConfigs',
    () => pricingConfigs(),
    () => emptyObject<PricingConfigSchema>()
  );
}

/**
 * Get animation configuration from Statsig
 */
export async function getAnimationConfig(): Promise<AnimationConfigSchema> {
  return fetchWithLogging<AnimationConfigSchema>(
    'animationConfigs',
    () => animationConfigs(),
    () => emptyObject<AnimationConfigSchema>()
  );
}

/**
 * Get timeout configuration from Statsig
 */
export async function getTimeoutConfig(): Promise<TimeoutConfigSchema> {
  return fetchWithLogging<TimeoutConfigSchema>(
    'timeoutConfigs',
    () => timeoutConfigs(),
    () => emptyObject<TimeoutConfigSchema>()
  );
}

/**
 * Get form validation configuration from Statsig
 */
export async function getFormConfig(): Promise<FormConfigSchema> {
  return fetchWithLogging<FormConfigSchema>(
    'formConfigs',
    () => formConfigs(),
    () => emptyObject<FormConfigSchema>()
  );
}

/**
 * Get recently viewed configuration from Statsig
 */
export async function getRecentlyViewedConfig(): Promise<RecentlyViewedConfigSchema> {
  return fetchWithLogging<RecentlyViewedConfigSchema>(
    'recentlyViewedConfigs',
    () => recentlyViewedConfigs(),
    () => emptyObject<RecentlyViewedConfigSchema>()
  );
}

/**
 * Get app settings configuration from Statsig
 */
export async function getAppSettings(): Promise<AppSettingsConfigSchema> {
  return fetchWithLogging<AppSettingsConfigSchema>(
    'appSettings',
    () => appSettings(),
    () => emptyObject<AppSettingsConfigSchema>()
  );
}

/**
 * Get cache configuration from Statsig
 */
export async function getCacheConfig(): Promise<CacheConfigSchema> {
  return fetchWithLogging<CacheConfigSchema>(
    'cacheConfigs',
    () => cacheConfigs(),
    () => emptyObject<CacheConfigSchema>()
  );
}

/**
 * Get polling configuration from Statsig
 */
export async function getPollingConfig(): Promise<PollingConfigSchema> {
  return fetchWithLogging<PollingConfigSchema>(
    'pollingConfigs',
    () => pollingConfigs(),
    () => emptyObject<PollingConfigSchema>()
  );
}

/**
 * Get component configuration from Statsig
 */
export async function getComponentConfig(): Promise<ComponentConfigSchema> {
  return fetchWithLogging<ComponentConfigSchema>(
    'componentConfigs',
    () => componentConfigs(),
    () => emptyObject<ComponentConfigSchema>()
  );
}

/**
 * Get homepage configuration from Statsig
 */
export async function getHomepageConfig(): Promise<HomepageConfigSchema> {
  return fetchWithLogging<HomepageConfigSchema>(
    'homepageConfigs',
    () => homepageConfigs(),
    () => emptyObject<HomepageConfigSchema>()
  );
}

async function fetchWithLogging<T>(
  label: string,
  fetcher: () => Promise<T>,
  fallbackFactory: () => T
): Promise<T> {
  const trace = traceMeta({ label });
  try {
    return await fetcher();
  } catch (error) {
    const normalized = normalizeError(error, `Failed to load ${label}`);
    logger.error(`FeatureFlags: ${label} fetch failed`, normalized, trace);
    return fallbackFactory();
  }
}
