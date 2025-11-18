/**
 * Feature Flags Server Actions
 * Wraps Statsig flag checks for use in client components
 */

'use server';

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { isBuildTime } from '@/src/lib/utils/build-time';

// CRITICAL: ALL imports from flags.ts are lazy-loaded to prevent Edge Config access during build.
// When flags.ts is imported, it executes module-level code that creates configs using flag(),
// which accesses Vercel Edge Config. This triggers "Server Functions cannot be called" errors.
// Solution: Lazy-load everything from flags.ts only when actions are actually called (runtime).

/**
 * Lazy-load flags.ts only when needed (runtime, not build-time)
 */
async function getFlagsModule() {
  if (isBuildTime()) {
    throw new Error('Cannot load flags during build-time');
  }
  return await import('@/src/lib/flags');
}

/**
 * Check if confetti animations are enabled
 */
export const checkConfettiEnabled = rateLimitedAction
  .schema(z.object({}))
  .metadata({ actionName: 'featureFlags.checkConfettiEnabled', category: 'analytics' })
  .action(async () => {
    try {
      const { featureFlags } = await getFlagsModule();
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
      const { featureFlags } = await getFlagsModule();
      return await featureFlags.contactTerminalEnabled();
    } catch {
      // Fallback to false on error (safe-action middleware handles logging)
      return false;
    }
  });

type ConfigRecord = Record<string, unknown>;

function createTypedConfigAccessor<const Schema extends ConfigRecord>({
  getDefaults,
  getFetcher,
  actionName,
}: {
  getDefaults: () => Promise<Schema>;
  getFetcher: (
    flagsModule: Awaited<ReturnType<typeof getFlagsModule>>
  ) => () => Promise<ConfigRecord>;
  actionName: string;
}) {
  const getSnapshot = rateLimitedAction
    .schema(z.object({}))
    .metadata({ actionName: `${actionName}.getSnapshot`, category: 'analytics' })
    .action(async () => {
      try {
        const defaults = await getDefaults();
        if (isBuildTime()) {
          return defaults;
        }
        const flagsModule = await getFlagsModule();
        const fetcher = getFetcher(flagsModule);
        const result = (await fetcher()) as Schema;
        return { ...defaults, ...result };
      } catch {
        // Fallback to defaults on error (safe-action middleware handles logging)
        const defaults = await getDefaults();
        return defaults;
      }
    });

  const getValue = rateLimitedAction
    .schema(z.object({ key: z.string() }))
    .metadata({ actionName: `${actionName}.getValue`, category: 'analytics' })
    .action(async ({ parsedInput }) => {
      try {
        const snapshotResult = await getSnapshot({});
        const defaults = await getDefaults();
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
        const defaults = await getDefaults();
        return defaults[parsedInput.key as keyof Schema] as Schema[keyof Schema];
      }
    });

  return { getSnapshot, getValue };
}

function emptyObject<T extends ConfigRecord>(): T {
  return {} as T;
}

// Lazy-loaded config accessors - all defaults and fetchers are loaded from flags.ts at runtime
const newsletterConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.NEWSLETTER_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.newsletterConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.newsletterConfig',
});

const pricingConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.PRICING_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.pricingConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.pricingConfig',
});

const animationConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.ANIMATION_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.animationConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.animationConfig',
});

const timeoutConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.TIMEOUT_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.timeoutConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.timeoutConfig',
});

const formConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.FORM_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.formConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.formConfig',
});

const recentlyViewedConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.RECENTLY_VIEWED_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.recentlyViewedConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.recentlyViewedConfig',
});

const appSettingsAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.APP_SETTINGS_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.appSettings() as Promise<ConfigRecord>,
  actionName: 'featureFlags.appSettings',
});

const pollingConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.POLLING_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.pollingConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.pollingConfig',
});

const componentConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.COMPONENT_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.componentConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.componentConfig',
});

const homepageConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.HOMEPAGE_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.homepageConfigs() as Promise<ConfigRecord>,
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
 * Lazy-loads cacheConfigs to avoid Vercel Edge Config access during build
 */
export const getCacheConfig = rateLimitedAction
  .schema(z.object({}))
  .metadata({ actionName: 'featureFlags.getCacheConfig', category: 'analytics' })
  .action(async () => {
    try {
      if (isBuildTime()) {
        return emptyObject();
      }
      const { cacheConfigs } = await getFlagsModule();
      return await cacheConfigs();
    } catch {
      // Fallback to empty object on error (safe-action middleware handles logging)
      return emptyObject();
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
