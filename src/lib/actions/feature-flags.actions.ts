/**
 * Feature Flags Server Actions
 * Wraps Statsig flag checks for use in client components
 */

'use server';

import { traceMeta } from '@/src/lib/actions/action-helpers';
import {
  ANIMATION_CONFIG_DEFAULTS,
  APP_SETTINGS_DEFAULTS,
  animationConfigs,
  appSettings,
  COMPONENT_CONFIG_DEFAULTS,
  cacheConfigs,
  componentConfigs,
  FORM_CONFIG_DEFAULTS,
  featureFlags,
  formConfigs,
  HOMEPAGE_CONFIG_DEFAULTS,
  homepageConfigs,
  NEWSLETTER_CONFIG_DEFAULTS,
  newsletterConfigs,
  POLLING_CONFIG_DEFAULTS,
  PRICING_CONFIG_DEFAULTS,
  pollingConfigs,
  pricingConfigs,
  RECENTLY_VIEWED_CONFIG_DEFAULTS,
  recentlyViewedConfigs,
  TIMEOUT_CONFIG_DEFAULTS,
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

function createTypedConfigAccessor<const Schema extends ConfigRecord>({
  label,
  fetcher,
  defaults,
}: {
  label: string;
  fetcher: () => Promise<ConfigRecord>;
  defaults: Schema;
}) {
  async function getSnapshot(): Promise<Schema> {
    const result = await fetchWithLogging<Schema>(
      label,
      async () => ({ ...(await fetcher()) }) as Schema,
      () => defaults
    );
    return { ...defaults, ...result };
  }

  async function getValue<K extends keyof Schema>(key: K): Promise<Schema[K]> {
    const snapshot = await getSnapshot();
    const value = snapshot[key];
    return (value === undefined ? defaults[key] : value) as Schema[K];
  }

  return { getSnapshot, getValue };
}

type NewsletterConfigSchema = typeof NEWSLETTER_CONFIG_DEFAULTS;
type PricingConfigSchema = typeof PRICING_CONFIG_DEFAULTS;
type AnimationConfigSchema = typeof ANIMATION_CONFIG_DEFAULTS;
type TimeoutConfigSchema = typeof TIMEOUT_CONFIG_DEFAULTS;
type FormConfigSchema = typeof FORM_CONFIG_DEFAULTS;
type RecentlyViewedConfigSchema = typeof RECENTLY_VIEWED_CONFIG_DEFAULTS;
type AppSettingsConfigSchema = typeof APP_SETTINGS_DEFAULTS;
type CacheConfigSchema = Awaited<ReturnType<typeof cacheConfigs>>;
type PollingConfigSchema = typeof POLLING_CONFIG_DEFAULTS;
type ComponentConfigSchema = typeof COMPONENT_CONFIG_DEFAULTS;
type HomepageConfigSchema = typeof HOMEPAGE_CONFIG_DEFAULTS;

function emptyObject<T extends ConfigRecord>(): T {
  return {} as T;
}

const newsletterConfigAccessor = createTypedConfigAccessor<NewsletterConfigSchema>({
  label: 'newsletterConfigs',
  fetcher: () => newsletterConfigs() as Promise<ConfigRecord>,
  defaults: NEWSLETTER_CONFIG_DEFAULTS,
});

const pricingConfigAccessor = createTypedConfigAccessor<PricingConfigSchema>({
  label: 'pricingConfigs',
  fetcher: () => pricingConfigs() as Promise<ConfigRecord>,
  defaults: PRICING_CONFIG_DEFAULTS,
});

const animationConfigAccessor = createTypedConfigAccessor<AnimationConfigSchema>({
  label: 'animationConfigs',
  fetcher: () => animationConfigs() as Promise<ConfigRecord>,
  defaults: ANIMATION_CONFIG_DEFAULTS,
});

const timeoutConfigAccessor = createTypedConfigAccessor<TimeoutConfigSchema>({
  label: 'timeoutConfigs',
  fetcher: () => timeoutConfigs() as Promise<ConfigRecord>,
  defaults: TIMEOUT_CONFIG_DEFAULTS,
});

const formConfigAccessor = createTypedConfigAccessor<FormConfigSchema>({
  label: 'formConfigs',
  fetcher: () => formConfigs() as Promise<ConfigRecord>,
  defaults: FORM_CONFIG_DEFAULTS,
});

const recentlyViewedConfigAccessor = createTypedConfigAccessor<RecentlyViewedConfigSchema>({
  label: 'recentlyViewedConfigs',
  fetcher: () => recentlyViewedConfigs() as Promise<ConfigRecord>,
  defaults: RECENTLY_VIEWED_CONFIG_DEFAULTS,
});

const appSettingsAccessor = createTypedConfigAccessor<AppSettingsConfigSchema>({
  label: 'appSettings',
  fetcher: () => appSettings() as Promise<ConfigRecord>,
  defaults: APP_SETTINGS_DEFAULTS,
});

const pollingConfigAccessor = createTypedConfigAccessor<PollingConfigSchema>({
  label: 'pollingConfigs',
  fetcher: () => pollingConfigs() as Promise<ConfigRecord>,
  defaults: POLLING_CONFIG_DEFAULTS,
});

const componentConfigAccessor = createTypedConfigAccessor<ComponentConfigSchema>({
  label: 'componentConfigs',
  fetcher: () => componentConfigs() as Promise<ConfigRecord>,
  defaults: COMPONENT_CONFIG_DEFAULTS,
});

const homepageConfigAccessor = createTypedConfigAccessor<HomepageConfigSchema>({
  label: 'homepageConfigs',
  fetcher: () => homepageConfigs() as Promise<ConfigRecord>,
  defaults: HOMEPAGE_CONFIG_DEFAULTS,
});

/**
 * Get newsletter configuration from Statsig
 */
export const getNewsletterConfig = newsletterConfigAccessor.getSnapshot;
export const getNewsletterConfigValue = newsletterConfigAccessor.getValue;

/**
 * Get pricing configuration from Statsig
 */
export const getPricingConfig = pricingConfigAccessor.getSnapshot;
export const getPricingConfigValue = pricingConfigAccessor.getValue;

/**
 * Get animation configuration from Statsig
 */
export const getAnimationConfig = animationConfigAccessor.getSnapshot;
export const getAnimationConfigValue = animationConfigAccessor.getValue;

/**
 * Get timeout configuration from Statsig
 */
export const getTimeoutConfig = timeoutConfigAccessor.getSnapshot;
export const getTimeoutConfigValue = timeoutConfigAccessor.getValue;

/**
 * Get form validation configuration from Statsig
 */
export const getFormConfig = formConfigAccessor.getSnapshot;
export const getFormConfigValue = formConfigAccessor.getValue;

/**
 * Get recently viewed configuration from Statsig
 */
export const getRecentlyViewedConfig = recentlyViewedConfigAccessor.getSnapshot;
export const getRecentlyViewedConfigValue = recentlyViewedConfigAccessor.getValue;

/**
 * Get app settings configuration from Statsig
 */
export const getAppSettings = appSettingsAccessor.getSnapshot;
export const getAppSettingValue = appSettingsAccessor.getValue;

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
export const getPollingConfig = pollingConfigAccessor.getSnapshot;
export const getPollingConfigValue = pollingConfigAccessor.getValue;

/**
 * Get component configuration from Statsig
 */
export const getComponentConfig = componentConfigAccessor.getSnapshot;
export const getComponentConfigValue = componentConfigAccessor.getValue;

/**
 * Get homepage configuration from Statsig
 */
export const getHomepageConfig = homepageConfigAccessor.getSnapshot;
export const getHomepageConfigValue = homepageConfigAccessor.getValue;

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
