'use server';

import { z } from 'zod';
import { rateLimitedAction } from './safe-action.ts';
import { isBuildTime } from '../build-time.ts';
import {
  ANIMATION_CONFIG_DEFAULTS,
  APP_SETTINGS_DEFAULTS,
  COMPONENT_CONFIG_DEFAULTS,
  EMAIL_CONFIG_DEFAULTS,
  FORM_CONFIG_DEFAULTS,
  HOMEPAGE_CONFIG_DEFAULTS,
  NEWSLETTER_CONFIG_DEFAULTS,
  POLLING_CONFIG_DEFAULTS,
  PRICING_CONFIG_DEFAULTS,
  RECENTLY_VIEWED_CONFIG_DEFAULTS,
  TIMEOUT_CONFIG_DEFAULTS,
  TOAST_CONFIG_DEFAULTS,
} from '../feature-flags/defaults.ts';

async function getFlagsModule() {
  if (isBuildTime()) {
    throw new Error('Cannot load flags during build-time');
  }
  return await import('../feature-flags/flags.ts');
}

const emptyObject = <T extends Record<string, unknown>>(): T => {
  return {} as T;
};

const checkConfettiEnabledAction = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'featureFlags.checkConfettiEnabled', category: 'analytics' })
  .action(async () => {
    try {
      const { featureFlags } = await getFlagsModule();
      return await featureFlags.confettiAnimations();
    } catch {
      return false;
    }
  });

export async function checkConfettiEnabled(
  input: Parameters<typeof checkConfettiEnabledAction>[0]
): ReturnType<typeof checkConfettiEnabledAction> {
  return checkConfettiEnabledAction(input);
}

const checkContactTerminalEnabledAction = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'featureFlags.checkContactTerminalEnabled', category: 'analytics' })
  .action(async () => {
    try {
      const { featureFlags } = await getFlagsModule();
      return await featureFlags.contactTerminalEnabled();
    } catch {
      return false;
    }
  });

export async function checkContactTerminalEnabled(
  input: Parameters<typeof checkContactTerminalEnabledAction>[0]
): ReturnType<typeof checkContactTerminalEnabledAction> {
  return checkContactTerminalEnabledAction(input);
}

const checkTestFlagAction = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'featureFlags.checkTestFlag', category: 'analytics' })
  .action(async () => {
    try {
      const { featureFlags } = await getFlagsModule();
      return await featureFlags.testFlag();
    } catch {
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
        // Check build-time before attempting to load flags
        if (isBuildTime()) {
          return defaults;
        }
        try {
          const flagsModule = await getFlagsModule();
          const fetcher = getFetcher(flagsModule);
          const result = (await fetcher()) as Schema;
          return { ...defaults, ...result };
        } catch (flagsError) {
          // If flags loading fails (e.g., build-time detection issue), return defaults
          if (
            flagsError instanceof Error &&
            (flagsError.message.includes('build-time') ||
              flagsError.message.includes('Server Functions'))
          ) {
            return defaults;
          }
          throw flagsError;
        }
      } catch {
        // Final fallback: return defaults on any error
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
        const defaults = await getDefaults();
        return defaults[parsedInput.key as keyof Schema] as Schema[keyof Schema];
      }
    });

  return { getSnapshot, getValue };
}

const newsletterConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => NEWSLETTER_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.newsletterConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.newsletterConfig',
});

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

const pricingConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => PRICING_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.pricingConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.pricingConfig',
});

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

const animationConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => ANIMATION_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.animationConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.animationConfig',
});

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

const timeoutConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => TIMEOUT_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.timeoutConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.timeoutConfig',
});

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

const formConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => FORM_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.formConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.formConfig',
});

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

const recentlyViewedConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => RECENTLY_VIEWED_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.recentlyViewedConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.recentlyViewedConfig',
});

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

const appSettingsAccessor = createTypedConfigAccessor({
  getDefaults: async () => APP_SETTINGS_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.appSettings() as Promise<ConfigRecord>,
  actionName: 'featureFlags.appSettings',
});

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

const pollingConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => POLLING_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.pollingConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.pollingConfig',
});

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

const componentConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => COMPONENT_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.componentConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.componentConfig',
});

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

const homepageConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => HOMEPAGE_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.homepageConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.homepageConfig',
});

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

/**
 * Homepage Config Bundle - Combined config for homepage
 * OPTIMIZATION: Combines homepage, animation, and app settings into single call
 * Reduces 3-4 separate config calls to 1 (75% reduction)
 * 
 * Returns all configs needed for homepage in a single response:
 * - Homepage config (featured categories, tab categories)
 * - Animation config (spring physics, etc.)
 * - App settings (infinite scroll batch size, threshold, etc.)
 */
export async function getHomepageConfigBundle() {
  try {
    // Fetch all three configs in parallel (they all use the same flags module internally)
    const [homepageResult, animationResult, appSettingsResult] = await Promise.all([
      homepageConfigAccessor.getSnapshot({}),
      animationConfigAccessor.getSnapshot({}),
      appSettingsAccessor.getSnapshot({}),
    ]);

    // Combine into single bundle
    return {
      homepageConfig: homepageResult?.data ?? HOMEPAGE_CONFIG_DEFAULTS,
      animationConfig: animationResult?.data ?? ANIMATION_CONFIG_DEFAULTS,
      appSettings: appSettingsResult?.data ?? APP_SETTINGS_DEFAULTS,
    };
  } catch (error) {
    // Fallback to defaults on any error
    return {
      homepageConfig: HOMEPAGE_CONFIG_DEFAULTS,
      animationConfig: ANIMATION_CONFIG_DEFAULTS,
      appSettings: APP_SETTINGS_DEFAULTS,
    };
  }
}

const emailConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => EMAIL_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.emailConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.emailConfig',
});

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

const toastConfigAccessor = createTypedConfigAccessor({
  getDefaults: async () => TOAST_CONFIG_DEFAULTS,
  getFetcher: (flagsModule) => () => flagsModule.toastConfigs() as Promise<ConfigRecord>,
  actionName: 'featureFlags.toastConfig',
});

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
      return emptyObject();
    }
  });

export async function getCacheConfig(
  input: Parameters<typeof getCacheConfigAction>[0]
): ReturnType<typeof getCacheConfigAction> {
  return getCacheConfigAction(input);
}
