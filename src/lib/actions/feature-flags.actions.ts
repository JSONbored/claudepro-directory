/**
 * Feature Flags Server Actions
 * Wraps Statsig flag checks for use in client components
 */

'use server';

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
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
// Error handling now done by safe-action middleware

/**
 * Check if confetti animations are enabled
 */
export const checkConfettiEnabled = rateLimitedAction
  .schema(z.object({}))
  .metadata({ actionName: 'featureFlags.checkConfettiEnabled', category: 'analytics' })
  .action(async () => {
    try {
      return await featureFlags.confettiAnimations();
    } catch {
      // Fallback to false on error (safe-action middleware handles logging)
      return false;
    }
  });

/**
 * Check if contact terminal feature is enabled
 * Used for gradual rollout of interactive terminal on /contact page
 */
export const checkContactTerminalEnabled = rateLimitedAction
  .schema(z.object({}))
  .metadata({ actionName: 'featureFlags.checkContactTerminalEnabled', category: 'analytics' })
  .action(async () => {
    try {
      return await featureFlags.contactTerminalEnabled();
    } catch {
      // Fallback to false on error (safe-action middleware handles logging)
      return false;
    }
  });

type ConfigRecord = Record<string, unknown>;

function createTypedConfigAccessor<const Schema extends ConfigRecord>({
  fetcher,
  defaults,
  actionName,
}: {
  fetcher: () => Promise<ConfigRecord>;
  defaults: Schema;
  actionName: string;
}) {
  const getSnapshot = rateLimitedAction
    .schema(z.object({}))
    .metadata({ actionName: `${actionName}.getSnapshot`, category: 'analytics' })
    .action(async () => {
      try {
        const result = (await fetcher()) as Schema;
        return { ...defaults, ...result };
      } catch {
        // Fallback to defaults on error (safe-action middleware handles logging)
        return defaults;
      }
    });

  const getValue = rateLimitedAction
    .schema(z.object({ key: z.string() }))
    .metadata({ actionName: `${actionName}.getValue`, category: 'analytics' })
    .action(async ({ parsedInput }) => {
      try {
        const snapshotResult = await getSnapshot({});
        if (!snapshotResult?.data) {
          return defaults[parsedInput.key as keyof Schema] as Schema[keyof Schema];
        }
        const snapshot = snapshotResult.data;
        const value = snapshot[parsedInput.key as keyof Schema];
        return (
          value === undefined ? defaults[parsedInput.key as keyof Schema] : value
        ) as Schema[keyof Schema];
      } catch {
        // Fallback to default value on error
        return defaults[parsedInput.key as keyof Schema] as Schema[keyof Schema];
      }
    });

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
  fetcher: () => newsletterConfigs() as Promise<ConfigRecord>,
  defaults: NEWSLETTER_CONFIG_DEFAULTS,
  actionName: 'featureFlags.newsletterConfig',
});

const pricingConfigAccessor = createTypedConfigAccessor<PricingConfigSchema>({
  fetcher: () => pricingConfigs() as Promise<ConfigRecord>,
  defaults: PRICING_CONFIG_DEFAULTS,
  actionName: 'featureFlags.pricingConfig',
});

const animationConfigAccessor = createTypedConfigAccessor<AnimationConfigSchema>({
  fetcher: () => animationConfigs() as Promise<ConfigRecord>,
  defaults: ANIMATION_CONFIG_DEFAULTS,
  actionName: 'featureFlags.animationConfig',
});

const timeoutConfigAccessor = createTypedConfigAccessor<TimeoutConfigSchema>({
  fetcher: () => timeoutConfigs() as Promise<ConfigRecord>,
  defaults: TIMEOUT_CONFIG_DEFAULTS,
  actionName: 'featureFlags.timeoutConfig',
});

const formConfigAccessor = createTypedConfigAccessor<FormConfigSchema>({
  fetcher: () => formConfigs() as Promise<ConfigRecord>,
  defaults: FORM_CONFIG_DEFAULTS,
  actionName: 'featureFlags.formConfig',
});

const recentlyViewedConfigAccessor = createTypedConfigAccessor<RecentlyViewedConfigSchema>({
  fetcher: () => recentlyViewedConfigs() as Promise<ConfigRecord>,
  defaults: RECENTLY_VIEWED_CONFIG_DEFAULTS,
  actionName: 'featureFlags.recentlyViewedConfig',
});

const appSettingsAccessor = createTypedConfigAccessor<AppSettingsConfigSchema>({
  fetcher: () => appSettings() as Promise<ConfigRecord>,
  defaults: APP_SETTINGS_DEFAULTS,
  actionName: 'featureFlags.appSettings',
});

const pollingConfigAccessor = createTypedConfigAccessor<PollingConfigSchema>({
  fetcher: () => pollingConfigs() as Promise<ConfigRecord>,
  defaults: POLLING_CONFIG_DEFAULTS,
  actionName: 'featureFlags.pollingConfig',
});

const componentConfigAccessor = createTypedConfigAccessor<ComponentConfigSchema>({
  fetcher: () => componentConfigs() as Promise<ConfigRecord>,
  defaults: COMPONENT_CONFIG_DEFAULTS,
  actionName: 'featureFlags.componentConfig',
});

const homepageConfigAccessor = createTypedConfigAccessor<HomepageConfigSchema>({
  fetcher: () => homepageConfigs() as Promise<ConfigRecord>,
  defaults: HOMEPAGE_CONFIG_DEFAULTS,
  actionName: 'featureFlags.homepageConfig',
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
export const getCacheConfig = rateLimitedAction
  .schema(z.object({}))
  .metadata({ actionName: 'featureFlags.getCacheConfig', category: 'analytics' })
  .action(async () => {
    try {
      return await cacheConfigs();
    } catch {
      // Fallback to empty object on error (safe-action middleware handles logging)
      return emptyObject<CacheConfigSchema>();
    }
  });

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

// fetchWithLogging removed - safe-action middleware handles all error logging
