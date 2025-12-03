/**
 * Cache Configuration Utilities
 *
 * CRITICAL: This module is server-only. It must never execute in client/browser environments.
 *
 * Uses static configuration from unified-config.ts (single source of truth).
 *
 * @module web-runtime/cache-config
 */

import { CACHE_INVALIDATION, CACHE_TTL } from './config/unified-config.ts';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Simplified TTL key format (e.g., 'homepage') */
export type CacheTtlKey = keyof typeof CACHE_TTL;

/** Simplified invalidate key format (e.g., 'content_create') */
export type CacheInvalidateKey = keyof typeof CACHE_INVALIDATION;

/** Cache configuration type - maps legacy keys to values */
export type CacheConfig = {
  [key: string]: number | readonly string[];
};

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get full cache configuration snapshot
 */
export function getCacheConfigSnapshot(): CacheConfig {
  return {
    ...CACHE_TTL,
    ...CACHE_INVALIDATION,
  } as CacheConfig;
}

/**
 * Get cache TTL value for a specific key
 * @param key - The cache TTL key (e.g., 'homepage')
 */
export function getCacheTtl(key: CacheTtlKey): number {
  return CACHE_TTL[key] ?? 3600; // Default 1 hour if key not found
}

/**
 * Get cache invalidation tags for a specific key
 * @param key - The cache invalidation key (e.g., 'content_create')
 */
export function getCacheInvalidateTags(key: CacheInvalidateKey): readonly string[] {
  return CACHE_INVALIDATION[key] ?? [];
}
