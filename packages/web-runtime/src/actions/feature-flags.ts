'use server';

import { z } from 'zod';
import { rateLimitedAction } from './safe-action.ts';
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

// getFlagsModule removed - no longer needed since all actions return static defaults
// All callers have been migrated to static-configs.ts

const checkConfettiEnabledAction = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'featureFlags.checkConfettiEnabled', category: 'analytics' })
  .action(async () => {
    // Return static default
    // All callers have been migrated to static-configs.ts
    return false;
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
    // Return static default
    return false;
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
    // Return static default
    return false;
  });

export async function checkTestFlag(
  input: Parameters<typeof checkTestFlagAction>[0]
): ReturnType<typeof checkTestFlagAction> {
  return checkTestFlagAction(input);
}

type ConfigRecord = Record<string, unknown>;

function createTypedConfigAccessor<const Schema extends ConfigRecord>({
  getDefaults,
  actionName,
}: {
  getDefaults: () => Schema;
  actionName: string;
}) {
  const getSnapshot = rateLimitedAction
    .inputSchema(z.object({}))
    .metadata({ actionName: `${actionName}.getSnapshot`, category: 'analytics' })
    .action(async () => {
      // Return static defaults
      // All callers have been migrated to static-configs.ts
      const defaults = getDefaults();
      return defaults;
    });

  const getValue = rateLimitedAction
    .inputSchema(z.object({ key: z.string() }))
    .metadata({ actionName: `${actionName}.getValue`, category: 'analytics' })
    .action(async ({ parsedInput }) => {
      // Return static default value
      // All callers have been migrated to static-configs.ts
      const defaults = getDefaults();
      return defaults[parsedInput.key as keyof Schema] as Schema[keyof Schema];
    });

  return { getSnapshot, getValue };
}

const newsletterConfigAccessor = createTypedConfigAccessor({
  getDefaults: () => NEWSLETTER_CONFIG_DEFAULTS,
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
  getDefaults: () => PRICING_CONFIG_DEFAULTS,
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
  getDefaults: () => ANIMATION_CONFIG_DEFAULTS,
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
  getDefaults: () => TIMEOUT_CONFIG_DEFAULTS,
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
  getDefaults: () => FORM_CONFIG_DEFAULTS,
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
  getDefaults: () => RECENTLY_VIEWED_CONFIG_DEFAULTS,
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
  getDefaults: () => APP_SETTINGS_DEFAULTS,
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
  getDefaults: () => POLLING_CONFIG_DEFAULTS,
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
  getDefaults: () => COMPONENT_CONFIG_DEFAULTS,
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
  getDefaults: () => HOMEPAGE_CONFIG_DEFAULTS,
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
 * 
 * Returns all configs needed for homepage in a single response:
 * - Homepage config (featured categories, tab categories)
 * - Animation config (spring physics, etc.)
 * - App settings (infinite scroll batch size, threshold, etc.)
 * 
 * @deprecated Use getHomepageConfigBundle from @heyclaude/web-runtime/config/static-configs instead
 * This server action version is kept for backward compatibility but returns static defaults.
 */
export async function getHomepageConfigBundle() {
  // Return static defaults
  // All callers have been migrated to static-configs.ts
  return {
    homepageConfig: HOMEPAGE_CONFIG_DEFAULTS,
    animationConfig: ANIMATION_CONFIG_DEFAULTS,
    appSettings: APP_SETTINGS_DEFAULTS,
  };
}

const emailConfigAccessor = createTypedConfigAccessor({
  getDefaults: () => EMAIL_CONFIG_DEFAULTS,
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
  getDefaults: () => TOAST_CONFIG_DEFAULTS,
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

