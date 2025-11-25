/**
 * Cache Configuration Utilities
 *
 * CRITICAL: This module is server-only. It must never execute in client/browser environments
 * because it may lazily access runtime-only dependencies (e.g., Vercel Edge Config via flags).
 */


const isBrowserContext = typeof window !== 'undefined' || typeof document !== 'undefined';

import { logger } from './logger.ts';
import { isBuildTime } from './build-time.ts';
import { normalizeError } from './errors.ts';
import { CACHE_CONFIG_DEFAULTS } from './feature-flags/defaults.ts';

export const CACHE_TTL_KEYS = [
  'cache.homepage.ttl_seconds',
  'cache.content_detail.ttl_seconds',
  'cache.content_list.ttl_seconds',
  'cache.content_trending.ttl_seconds',
  'cache.config_detail.ttl_seconds',
  'cache.config_list.ttl_seconds',
  'cache.tool_detail.ttl_seconds',
  'cache.tool_list.ttl_seconds',
  'cache.company_detail.ttl_seconds',
  'cache.company_list.ttl_seconds',
  'cache.company_profile.ttl_seconds',
  'cache.related_content.ttl_seconds',
  'cache.recommendations.ttl_seconds',
  'cache.content_export.ttl_seconds',
  'cache.content_paginated.ttl_seconds',
  'cache.feeds.ttl_seconds',
  'cache.seo.ttl_seconds',
  'cache.sitemap.ttl_seconds',
  'cache.status.ttl_seconds',
  'cache.navigation.ttl_seconds',
  'cache.templates.ttl_seconds',
  'cache.submission_dashboard.ttl_seconds',
  'cache.user_profile.ttl_seconds',
  'cache.user_activity.ttl_seconds',
  'cache.user_stats.ttl_seconds',
  'cache.user_bookmarks.ttl_seconds',
  'cache.user_submissions.ttl_seconds',
  'cache.user_reviews.ttl_seconds',
  'cache.community.ttl_seconds',
  'cache.article.ttl_seconds',
  'cache.boilerplate.ttl_seconds',
  'cache.course.ttl_seconds',
  'cache.book.ttl_seconds',
  'cache.quiz.ttl_seconds',
  'cache.search.ttl_seconds',
  'cache.search_autocomplete.ttl_seconds',
  'cache.search_facets.ttl_seconds',
  'cache.jobs.ttl_seconds',
  'cache.jobs_detail.ttl_seconds',
  'cache.changelog.ttl_seconds',
  'cache.changelog_detail.ttl_seconds',
  'cache.announcements.ttl_seconds',
  'cache.account.ttl_seconds',
  'cache.newsletter_count_ttl_s',
  'cache.company_search.ttl_seconds',
  'cache.notifications.ttl_seconds',
  'cache.contact.ttl_seconds',
] as const;

export const CACHE_INVALIDATE_KEYS = [
  'cache.invalidate.content_create',
  'cache.invalidate.content_update',
  'cache.invalidate.content_delete',
  'cache.invalidate.config_create',
  'cache.invalidate.config_update',
  'cache.invalidate.config_delete',
  'cache.invalidate.tool_create',
  'cache.invalidate.tool_update',
  'cache.invalidate.tool_delete',
  'cache.invalidate.company_create',
  'cache.invalidate.company_update',
  'cache.invalidate.company_delete',
  'cache.invalidate.user_update',
  'cache.invalidate.user_profile_oauth',
  'cache.invalidate.bookmark_create',
  'cache.invalidate.bookmark_delete',
  'cache.invalidate.follow',
  'cache.invalidate.oauth_unlink',
  'cache.invalidate.vote',
  'cache.invalidate.job_create',
  'cache.invalidate.job_update',
  'cache.invalidate.job_delete',
  'cache.invalidate.job_status',
  'cache.invalidate.sponsored_tracking',
  'cache.invalidate.collection_create',
  'cache.invalidate.collection_update',
  'cache.invalidate.collection_delete',
  'cache.invalidate.collection_items',
  'cache.invalidate.review_create',
  'cache.invalidate.review_update',
  'cache.invalidate.notifications',
  'cache.invalidate.review_delete',
  'cache.invalidate.submission_create',
  'cache.invalidate.contact_submission',
  'cache.invalidate.review_helpful',
  'cache.invalidate.usage_tracking',
  'cache.invalidate.changelog',
  'cache.invalidate.newsletter_subscribe',
] as const;

export type CacheTtlKey = (typeof CACHE_TTL_KEYS)[number];
export type CacheInvalidateKey = (typeof CACHE_INVALIDATE_KEYS)[number];

type CacheConfigSchema = { [K in CacheTtlKey]: number } & {
  [K in CacheInvalidateKey]: readonly string[];
};

export type CacheConfig = CacheConfigSchema;
export type CacheConfigPromise = Promise<CacheConfig>;

// Helper to split the flat CACHE_CONFIG_DEFAULTS into TTL and Invalidate parts
const getBuildTimeTtls = (): Record<CacheTtlKey, number> => {
  const ttls: Partial<Record<CacheTtlKey, number>> = {};
  for (const key of CACHE_TTL_KEYS) {
    // Safe cast as we know the key exists in defaults
    ttls[key] = (CACHE_CONFIG_DEFAULTS as unknown as Record<string, number>)[key] ?? 3600;
  }
  return ttls as Record<CacheTtlKey, number>;
};

const getBuildTimeInvalidations = (): Record<CacheInvalidateKey, readonly string[]> => {
  const invalidations: Partial<Record<CacheInvalidateKey, readonly string[]>> = {};
  for (const key of CACHE_INVALIDATE_KEYS) {
    invalidations[key] =
      (CACHE_CONFIG_DEFAULTS as unknown as Record<string, readonly string[]>)[key] ?? [];
  }
  return invalidations as Record<CacheInvalidateKey, readonly string[]>;
};

const BUILD_TIME_TTL_DEFAULTS = getBuildTimeTtls();
const CACHE_INVALIDATE_DEFAULTS = getBuildTimeInvalidations();

let cacheConfigPromise: CacheConfigPromise | null = null;
// OPTIMIZATION: Store resolved config to avoid re-awaiting the same promise
let cachedConfig: CacheConfig | null = null;

function isBuildTimeContext(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message;
    return (
      (msg.includes('headers') && msg.includes('request scope')) ||
      (msg.includes('Dynamic server usage') && msg.includes('headers'))
    );
  }
  return false;
}

async function loadCacheConfig(): Promise<CacheConfig> {
  if (isBrowserContext) {
    return {
      ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
      ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
    } as CacheConfig;
  }

  // Single build-time check - eliminates redundant calls
  const isBuild = isBuildTime();
  if (isBuild) {
    return {
      ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
      ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
    } as CacheConfig;
  }

  // OPTIMIZATION: Return cached config if already loaded (request-scoped memoization)
  if (cachedConfig !== null) {
    return cachedConfig;
  }

  if (!cacheConfigPromise) {
    try {
      // Note: Statsig/feature flags loading would happen here in runtime
      // For now, return defaults (actual implementation would load from Statsig)
      const defaultConfig = {
        ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
        ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
      } as CacheConfig;
      // Cache the default config to avoid re-computing
      cachedConfig = defaultConfig;
      return defaultConfig;
    } catch (error) {
      if (
        isBuildTimeContext(error) ||
        (error instanceof Error && error.message.includes('Server Functions'))
      ) {
        const defaultConfig = {
          ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
          ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
        } as CacheConfig;
        cachedConfig = defaultConfig;
        return defaultConfig;
      }
      throw error;
    }
  }

  try {
    const config = await cacheConfigPromise;
    // Cache the resolved config for subsequent calls in the same request
    cachedConfig = config;
    return config;
  } catch (error) {
    cacheConfigPromise = null;
    cachedConfig = null;

    if (
      isBuildTimeContext(error) ||
      (error instanceof Error && error.message.includes('Server Functions'))
    ) {
      return {
        ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
        ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
      } as CacheConfig;
    }

    const normalized = normalizeError(error, 'Failed to load cache config from Statsig');
    logger.error('loadCacheConfig failed', normalized, {
      source: 'web-runtime/cache-config',
    });
    const fallbackConfig = {
      ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
      ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
    } as CacheConfig;
    // Cache the fallback config
    cachedConfig = fallbackConfig;
    return fallbackConfig;
  }
}

export async function primeCacheConfig(promise: CacheConfigPromise): Promise<void> {
  cacheConfigPromise = promise;
  // Clear cached config when priming a new promise
  cachedConfig = null;
}

export async function getCacheConfigSnapshot(): Promise<CacheConfig> {
  if (isBrowserContext) {
    return {
      ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
      ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
    } as CacheConfig;
  }

  try {
    return await loadCacheConfig();
  } catch {
    return {
      ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
      ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
    } as CacheConfig;
  }
}

export async function getCacheTtl(key: CacheTtlKey): Promise<number> {
  if (isBrowserContext) {
    return BUILD_TIME_TTL_DEFAULTS[key] ?? 3600;
  }

  if (isBuildTime()) {
    return BUILD_TIME_TTL_DEFAULTS[key] ?? 3600;
  }

  // OPTIMIZATION: Use cached config if available (request-scoped memoization)
  if (cachedConfig !== null) {
    return cachedConfig[key];
  }

  try {
    const config = await loadCacheConfig();
    return config[key];
  } catch {
    return BUILD_TIME_TTL_DEFAULTS[key] ?? 3600;
  }
}

export async function getCacheInvalidateTags(
  key: CacheInvalidateKey
): Promise<readonly string[]> {
  if (isBrowserContext) {
    return CACHE_INVALIDATE_DEFAULTS[key] ?? [];
  }

  if (isBuildTime()) {
    return CACHE_INVALIDATE_DEFAULTS[key] ?? [];
  }

  // OPTIMIZATION: Use cached config if available (request-scoped memoization)
  if (cachedConfig !== null) {
    return cachedConfig[key];
  }

  try {
    const config = await loadCacheConfig();
    return config[key];
  } catch {
    return CACHE_INVALIDATE_DEFAULTS[key] ?? [];
  }
}
