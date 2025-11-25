import 'server-only';
import { isBuildTime } from '../build-time.ts';
import {
  ANIMATION_CONFIG_DEFAULTS,
  APP_SETTINGS_DEFAULTS,
  CACHE_CONFIG_DEFAULTS,
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
} from './defaults.ts';

async function getFlagsModule() {
  if (isBuildTime()) {
    throw new Error('Cannot load flags during build-time');
  }
  return await import('./flags.ts');
}

export async function getPricingConfig() {
  if (isBuildTime()) {
    return PRICING_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.pricingConfigs();
  } catch {
    return PRICING_CONFIG_DEFAULTS;
  }
}

export async function getNewsletterConfig() {
  if (isBuildTime()) {
    return NEWSLETTER_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.newsletterConfigs();
  } catch {
    return NEWSLETTER_CONFIG_DEFAULTS;
  }
}

export async function getAnimationConfig() {
  if (isBuildTime()) {
    return ANIMATION_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.animationConfigs();
  } catch {
    return ANIMATION_CONFIG_DEFAULTS;
  }
}

export async function getTimeoutConfig() {
  if (isBuildTime()) {
    return TIMEOUT_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.timeoutConfigs();
  } catch {
    return TIMEOUT_CONFIG_DEFAULTS;
  }
}

export async function getFormConfig() {
  if (isBuildTime()) {
    return FORM_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.formConfigs();
  } catch {
    return FORM_CONFIG_DEFAULTS;
  }
}

export async function getRecentlyViewedConfig() {
  if (isBuildTime()) {
    return RECENTLY_VIEWED_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.recentlyViewedConfigs();
  } catch {
    return RECENTLY_VIEWED_CONFIG_DEFAULTS;
  }
}

export async function getAppSettings() {
  if (isBuildTime()) {
    return APP_SETTINGS_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.appSettings();
  } catch {
    return APP_SETTINGS_DEFAULTS;
  }
}

export async function getPollingConfig() {
  if (isBuildTime()) {
    return POLLING_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.pollingConfigs();
  } catch {
    return POLLING_CONFIG_DEFAULTS;
  }
}

export async function getComponentConfig() {
  if (isBuildTime()) {
    return COMPONENT_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.componentConfigs();
  } catch {
    return COMPONENT_CONFIG_DEFAULTS;
  }
}

export async function getHomepageConfig() {
  if (isBuildTime()) {
    return HOMEPAGE_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.homepageConfigs();
  } catch {
    return HOMEPAGE_CONFIG_DEFAULTS;
  }
}

export async function getEmailConfig() {
  if (isBuildTime()) {
    return EMAIL_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.emailConfigs();
  } catch {
    return EMAIL_CONFIG_DEFAULTS;
  }
}

export async function getToastConfig() {
  if (isBuildTime()) {
    return TOAST_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.toastConfigs();
  } catch {
    return TOAST_CONFIG_DEFAULTS;
  }
}

export async function getCacheConfig() {
  if (isBuildTime()) {
    return CACHE_CONFIG_DEFAULTS;
  }
  try {
    const flagsModule = await getFlagsModule();
    return await flagsModule.cacheConfigs();
  } catch {
    return CACHE_CONFIG_DEFAULTS;
  }
}
