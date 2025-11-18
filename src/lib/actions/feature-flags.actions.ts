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
const checkConfettiEnabledAction = rateLimitedAction
  .inputSchema(z.object({}))
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

export async function checkConfettiEnabled(
  input: Parameters<typeof checkConfettiEnabledAction>[0]
): ReturnType<typeof checkConfettiEnabledAction> {
  return checkConfettiEnabledAction(input);
}

/**
 * Check if contact terminal feature is enabled
 * Used for gradual rollout of interactive terminal on /contact page
 */
const checkContactTerminalEnabledAction = rateLimitedAction
  .inputSchema(z.object({}))
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

export async function checkContactTerminalEnabled(
  input: Parameters<typeof checkContactTerminalEnabledAction>[0]
): ReturnType<typeof checkContactTerminalEnabledAction> {
  return checkContactTerminalEnabledAction(input);
}

/**
 * Check if test flag is enabled
 * Used for testing Statsig integration on /test-flags page
 */
const checkTestFlagAction = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'featureFlags.checkTestFlag', category: 'analytics' })
  .action(async () => {
    try {
      const { featureFlags } = await getFlagsModule();
      return await featureFlags.testFlag();
    } catch {
      // Fallback to false on error (safe-action middleware handles logging)
      return false;
    }
  });

export async function checkTestFlag(
  input: Parameters<typeof checkTestFlagAction>[0]
): ReturnType<typeof checkTestFlagAction> {
  return checkTestFlagAction(input);
}

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
    .inputSchema(z.object({}))
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
    .inputSchema(z.object({ key: z.string() }))
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
export async function getNewsletterConfig(
  input: Parameters<typeof newsletterConfigAccessor.getSnapshot>[0]
): ReturnType<typeof newsletterConfigAccessor.getSnapshot> {
  return newsletterConfigAccessor.getSnapshot(input);
}

export async function getNewsletterConfigValue(
  input: Parameters<typeof newsletterConfigAccessor.getValue>[0]
): ReturnType<typeof newsletterConfigAccessor.getValue> {
  return newsletterConfigAccessor.getValue(input);
}

/**
 * Get pricing configuration from Statsig
 */
export async function getPricingConfig(
  input: Parameters<typeof pricingConfigAccessor.getSnapshot>[0]
): ReturnType<typeof pricingConfigAccessor.getSnapshot> {
  return pricingConfigAccessor.getSnapshot(input);
}

export async function getPricingConfigValue(
  input: Parameters<typeof pricingConfigAccessor.getValue>[0]
): ReturnType<typeof pricingConfigAccessor.getValue> {
  return pricingConfigAccessor.getValue(input);
}

/**
 * Get animation configuration from Statsig
 */
export async function getAnimationConfig(
  input: Parameters<typeof animationConfigAccessor.getSnapshot>[0]
): ReturnType<typeof animationConfigAccessor.getSnapshot> {
  return animationConfigAccessor.getSnapshot(input);
}

export async function getAnimationConfigValue(
  input: Parameters<typeof animationConfigAccessor.getValue>[0]
): ReturnType<typeof animationConfigAccessor.getValue> {
  return animationConfigAccessor.getValue(input);
}

/**
 * Get timeout configuration from Statsig
 */
export async function getTimeoutConfig(
  input: Parameters<typeof timeoutConfigAccessor.getSnapshot>[0]
): ReturnType<typeof timeoutConfigAccessor.getSnapshot> {
  return timeoutConfigAccessor.getSnapshot(input);
}

export async function getTimeoutConfigValue(
  input: Parameters<typeof timeoutConfigAccessor.getValue>[0]
): ReturnType<typeof timeoutConfigAccessor.getValue> {
  return timeoutConfigAccessor.getValue(input);
}

/**
 * Get form validation configuration from Statsig
 */
export async function getFormConfig(
  input: Parameters<typeof formConfigAccessor.getSnapshot>[0]
): ReturnType<typeof formConfigAccessor.getSnapshot> {
  return formConfigAccessor.getSnapshot(input);
}

export async function getFormConfigValue(
  input: Parameters<typeof formConfigAccessor.getValue>[0]
): ReturnType<typeof formConfigAccessor.getValue> {
  return formConfigAccessor.getValue(input);
}

/**
 * Get recently viewed configuration from Statsig
 */
export async function getRecentlyViewedConfig(
  input: Parameters<typeof recentlyViewedConfigAccessor.getSnapshot>[0]
): ReturnType<typeof recentlyViewedConfigAccessor.getSnapshot> {
  return recentlyViewedConfigAccessor.getSnapshot(input);
}

export async function getRecentlyViewedConfigValue(
  input: Parameters<typeof recentlyViewedConfigAccessor.getValue>[0]
): ReturnType<typeof recentlyViewedConfigAccessor.getValue> {
  return recentlyViewedConfigAccessor.getValue(input);
}

/**
 * Get app settings configuration from Statsig
 */
export async function getAppSettings(
  input: Parameters<typeof appSettingsAccessor.getSnapshot>[0]
): ReturnType<typeof appSettingsAccessor.getSnapshot> {
  return appSettingsAccessor.getSnapshot(input);
}

export async function getAppSettingValue(
  input: Parameters<typeof appSettingsAccessor.getValue>[0]
): ReturnType<typeof appSettingsAccessor.getValue> {
  return appSettingsAccessor.getValue(input);
}

/**
 * Get cache configuration from Statsig
 * Lazy-loads cacheConfigs to avoid Vercel Edge Config access during build
 */
const getCacheConfigAction = rateLimitedAction
  .inputSchema(z.object({}))
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

export async function getCacheConfig(
  input: Parameters<typeof getCacheConfigAction>[0]
): ReturnType<typeof getCacheConfigAction> {
  return getCacheConfigAction(input);
}

/**
 * Get polling configuration from Statsig
 */
export async function getPollingConfig(
  input: Parameters<typeof pollingConfigAccessor.getSnapshot>[0]
): ReturnType<typeof pollingConfigAccessor.getSnapshot> {
  return pollingConfigAccessor.getSnapshot(input);
}

export async function getPollingConfigValue(
  input: Parameters<typeof pollingConfigAccessor.getValue>[0]
): ReturnType<typeof pollingConfigAccessor.getValue> {
  return pollingConfigAccessor.getValue(input);
}

/**
 * Get component configuration from Statsig
 */
export async function getComponentConfig(
  input: Parameters<typeof componentConfigAccessor.getSnapshot>[0]
): ReturnType<typeof componentConfigAccessor.getSnapshot> {
  return componentConfigAccessor.getSnapshot(input);
}

export async function getComponentConfigValue(
  input: Parameters<typeof componentConfigAccessor.getValue>[0]
): ReturnType<typeof componentConfigAccessor.getValue> {
  return componentConfigAccessor.getValue(input);
}

/**
 * Get homepage configuration from Statsig
 */
export async function getHomepageConfig(
  input: Parameters<typeof homepageConfigAccessor.getSnapshot>[0]
): ReturnType<typeof homepageConfigAccessor.getSnapshot> {
  return homepageConfigAccessor.getSnapshot(input);
}

export async function getHomepageConfigValue(
  input: Parameters<typeof homepageConfigAccessor.getValue>[0]
): ReturnType<typeof homepageConfigAccessor.getValue> {
  return homepageConfigAccessor.getValue(input);
}

const emailConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.EMAIL_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.emailConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.emailConfig',
});

const toastConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => {
    const flagsModule = await getFlagsModule();
    return flagsModule.TOAST_CONFIG_DEFAULTS;
  },
  getFetcher: (flagsModule) => () => flagsModule.toastConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.toastConfig',
});

/**
 * Get email configuration from Statsig
 */
export async function getEmailConfig(
  input: Parameters<typeof emailConfigAccessor.getSnapshot>[0]
): ReturnType<typeof emailConfigAccessor.getSnapshot> {
  return emailConfigAccessor.getSnapshot(input);
}

export async function getEmailConfigValue(
  input: Parameters<typeof emailConfigAccessor.getValue>[0]
): ReturnType<typeof emailConfigAccessor.getValue> {
  return emailConfigAccessor.getValue(input);
}

/**
 * Get toast configuration from Statsig
 */
export async function getToastConfig(
  input: Parameters<typeof toastConfigAccessor.getSnapshot>[0]
): ReturnType<typeof toastConfigAccessor.getSnapshot> {
  return toastConfigAccessor.getSnapshot(input);
}

export async function getToastConfigValue(
  input: Parameters<typeof toastConfigAccessor.getValue>[0]
): ReturnType<typeof toastConfigAccessor.getValue> {
  return toastConfigAccessor.getValue(input);
}

// fetchWithLogging removed - safe-action middleware handles all error logging
