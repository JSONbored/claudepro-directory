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

/**
 * Check if confetti animations are enabled
 */
export async function checkConfettiEnabled(): Promise<boolean> {
  try {
    return await featureFlags.confettiAnimations();
  } catch {
    return false;
  }
}

/**
 * Get newsletter configuration from Statsig
 */
export async function getNewsletterConfig(): Promise<Record<string, unknown>> {
  try {
    return await newsletterConfigs();
  } catch {
    return {};
  }
}

/**
 * Get pricing configuration from Statsig
 */
export async function getPricingConfig(): Promise<Record<string, unknown>> {
  try {
    return await pricingConfigs();
  } catch {
    return {};
  }
}

/**
 * Get animation configuration from Statsig
 */
export async function getAnimationConfig(): Promise<Record<string, unknown>> {
  try {
    return await animationConfigs();
  } catch {
    return {};
  }
}

/**
 * Get timeout configuration from Statsig
 */
export async function getTimeoutConfig(): Promise<Record<string, unknown>> {
  try {
    return await timeoutConfigs();
  } catch {
    return {};
  }
}

/**
 * Get form validation configuration from Statsig
 */
export async function getFormConfig(): Promise<Record<string, unknown>> {
  try {
    return await formConfigs();
  } catch {
    return {};
  }
}

/**
 * Get recently viewed configuration from Statsig
 */
export async function getRecentlyViewedConfig(): Promise<Record<string, unknown>> {
  try {
    return await recentlyViewedConfigs();
  } catch {
    return {};
  }
}

/**
 * Get app settings configuration from Statsig
 */
export async function getAppSettings(): Promise<Record<string, unknown>> {
  try {
    return await appSettings();
  } catch {
    return {};
  }
}

/**
 * Get cache configuration from Statsig
 */
export async function getCacheConfig(): Promise<Record<string, unknown>> {
  try {
    return await cacheConfigs();
  } catch {
    return {};
  }
}

/**
 * Get polling configuration from Statsig
 */
export async function getPollingConfig(): Promise<Record<string, unknown>> {
  try {
    return await pollingConfigs();
  } catch {
    return {};
  }
}

/**
 * Get component configuration from Statsig
 */
export async function getComponentConfig(): Promise<Record<string, unknown>> {
  try {
    return await componentConfigs();
  } catch {
    return {};
  }
}

/**
 * Get homepage configuration from Statsig
 */
export async function getHomepageConfig(): Promise<Record<string, unknown>> {
  try {
    return await homepageConfigs();
  } catch {
    return {};
  }
}
