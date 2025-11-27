/**
 * Cache Configuration Utilities
 *
 * CRITICAL: This module is server-only. It must never execute in client/browser environments.
 * 
 * Uses static configuration defaults from feature-flags/defaults.ts (no external dependencies).
 */

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

// Helper to split the flat CACHE_CONFIG_DEFAULTS into TTL and Invalidate parts
const getBuildTimeTtls = (): Record<CacheTtlKey, number> => {
  const ttls: Partial<Record<CacheTtlKey, number>> = {};
  for (const key of CACHE_TTL_KEYS) {
    // Type guard: Validate that the key exists in defaults and is a number
    const value = CACHE_CONFIG_DEFAULTS[key as keyof typeof CACHE_CONFIG_DEFAULTS];
    if (typeof value === 'number') {
      ttls[key] = value;
    } else {
      ttls[key] = 3600; // Default fallback
    }
  }
  // Type guard: Ensure all keys are present
  if (Object.keys(ttls).length !== CACHE_TTL_KEYS.length) {
    throw new Error('getBuildTimeTtls: Missing TTL values in CACHE_CONFIG_DEFAULTS');
  }
  return ttls as Record<CacheTtlKey, number>;
};

const getBuildTimeInvalidations = (): Record<CacheInvalidateKey, readonly string[]> => {
  const invalidations: Partial<Record<CacheInvalidateKey, readonly string[]>> = {};
  for (const key of CACHE_INVALIDATE_KEYS) {
    // Type guard: Validate that the key exists in defaults and is an array
    const value = CACHE_CONFIG_DEFAULTS[key as keyof typeof CACHE_CONFIG_DEFAULTS];
    if (Array.isArray(value) && value.every((item): item is string => typeof item === 'string')) {
      invalidations[key] = value;
    } else {
      invalidations[key] = []; // Default fallback
    }
  }
  // Type guard: Ensure all keys are present
  if (Object.keys(invalidations).length !== CACHE_INVALIDATE_KEYS.length) {
    throw new Error('getBuildTimeInvalidations: Missing invalidation values in CACHE_CONFIG_DEFAULTS');
  }
  return invalidations as Record<CacheInvalidateKey, readonly string[]>;
};

const BUILD_TIME_TTL_DEFAULTS = getBuildTimeTtls();
const CACHE_INVALIDATE_DEFAULTS = getBuildTimeInvalidations();

// OPTIMIZATION: Store resolved config to avoid re-computing (request-scoped memoization)
let cachedConfig: CacheConfig | null = null;

function loadCacheConfig(): CacheConfig {
  // OPTIMIZATION: Return cached config if already loaded (request-scoped memoization)
  if (cachedConfig !== null) {
    return cachedConfig;
  }

  const defaultConfig = {
    ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
    ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
  } as CacheConfig;
  
  // Cache the config to avoid re-computing
  cachedConfig = defaultConfig;
  return defaultConfig;
}

export function getCacheConfigSnapshot(): CacheConfig {
  return loadCacheConfig();
}

export function getCacheTtl(key: CacheTtlKey): number {
  // OPTIMIZATION: Use cached config if available (request-scoped memoization)
  if (cachedConfig !== null) {
    return cachedConfig[key];
  }

  // Load static config
  const config = loadCacheConfig();
  return config[key];
}

export function getCacheInvalidateTags(key: CacheInvalidateKey): readonly string[] {
  // OPTIMIZATION: Use cached config if available (request-scoped memoization)
  if (cachedConfig !== null) {
    return cachedConfig[key];
  }

  // Load static config
  const config = loadCacheConfig();
  return config[key];
}
