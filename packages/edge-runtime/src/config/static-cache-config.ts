/**
 * Static Cache Config Helper
 * 
 * Returns static cache config values from defaults.
 * Provides static cache configuration values from version-controlled defaults.
 */

import { CACHE_CONFIG_DEFAULTS } from '@heyclaude/edge-runtime/config/cache-defaults.ts';

/**
 * Get cache config number value
 * Returns static default value
 */
export function getCacheConfigNumber(key: string, fallback: number): number {
  const config = CACHE_CONFIG_DEFAULTS as Record<string, unknown>;
  const value = config[key];
  
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  
  return fallback;
}

/**
 * Get cache config string array value
 * Returns static default value
 */
export function getCacheConfigStringArray(key: string, fallback: string[]): string[] {
  const config = CACHE_CONFIG_DEFAULTS as Record<string, unknown>;
  const value = config[key];
  
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }
  
  return fallback;
}
