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
// LEGACY KEY ARRAYS (for backward compatibility)
// =============================================================================

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

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/** Legacy TTL key format (e.g., 'cache.homepage.ttl_seconds') */
export type CacheTtlKeyLegacy = (typeof CACHE_TTL_KEYS)[number];

/** New simplified TTL key format (e.g., 'homepage') */
export type CacheTtlKey = keyof typeof CACHE_TTL;

/** Legacy invalidate key format (e.g., 'cache.invalidate.content_create') */
export type CacheInvalidateKeyLegacy = (typeof CACHE_INVALIDATE_KEYS)[number];

/** New simplified invalidate key format (e.g., 'content_create') */
export type CacheInvalidateKey = keyof typeof CACHE_INVALIDATION;

/** Cache configuration type - maps legacy keys to values */
export type CacheConfig = {
  [key: string]: number | readonly string[];
};

// =============================================================================
// INTERNAL CACHE
// =============================================================================

// Module-level cache for performance
let cachedConfig: Record<string, number | readonly string[]> | null = null;

function buildCacheConfig(): Record<string, number | readonly string[]> {
  if (cachedConfig) return cachedConfig;

  const config: Record<string, number | readonly string[]> = {};

  // Map CACHE_TTL to legacy key format
  for (const [key, value] of Object.entries(CACHE_TTL)) {
    const legacyKey = key === 'newsletter_count'
      ? 'cache.newsletter_count_ttl_s'
      : `cache.${key}.ttl_seconds`;
    config[legacyKey] = value;
  }

  // Map CACHE_INVALIDATION to legacy key format
  for (const [key, value] of Object.entries(CACHE_INVALIDATION)) {
    config[`cache.invalidate.${key}`] = value;
  }

  cachedConfig = config;
  return config;
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get full cache configuration snapshot
 */
export function getCacheConfigSnapshot(): CacheConfig {
  return buildCacheConfig();
}

/**
 * Get cache TTL value for a specific key
 * Accepts both legacy format ('cache.homepage.ttl_seconds') and new format ('homepage')
 * @param key - The cache TTL key
 */
export function getCacheTtl(key: CacheTtlKeyLegacy | CacheTtlKey): number {
  // Handle new simplified format
  if (key in CACHE_TTL) {
    return CACHE_TTL[key as CacheTtlKey];
  }

  // Handle legacy format
  const config = buildCacheConfig();
  const value = config[key];
  return typeof value === 'number' ? value : 3600; // Default 1 hour
}

/**
 * Get cache invalidation tags for a specific key
 * Accepts both legacy format ('cache.invalidate.content_create') and new format ('content_create')
 * @param key - The cache invalidation key
 */
export function getCacheInvalidateTags(key: CacheInvalidateKeyLegacy | CacheInvalidateKey): readonly string[] {
  // Handle new simplified format
  if (key in CACHE_INVALIDATION) {
    return CACHE_INVALIDATION[key as CacheInvalidateKey];
  }

  // Handle legacy format
  const config = buildCacheConfig();
  const value = config[key];
  return Array.isArray(value) ? value : [];
}
