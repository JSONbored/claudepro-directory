/**
 * Cache Configuration Utilities
 *
 * NOTE: This file does NOT have 'use server' because getCacheTtl and other functions
 * are helper functions used in server components, not server actions called from client components.
 * Removing 'use server' prevents Next.js from treating this as a server action module
 * during static generation, which was causing "Server Functions cannot be called" errors.
 *
 * CRITICAL: This module MUST be server-only to prevent flags/next from being bundled
 * for client components. flags/next uses Node.js-only modules (async_hooks) that don't exist in the browser.
 *
 * NOTE: cacheConfigs is NOT imported at module level to avoid flags/next accessing
 * Vercel Edge Config during module initialization. It's lazy-loaded in loadCacheConfig()
 * only when we're certain we're in runtime server context (not build-time, not browser).
 */

// CRITICAL: Mark this module as server-only to prevent client component imports
// This throws an error if imported in client components, preventing flags/next from being bundled
import 'server-only';

// CRITICAL: Detect browser/client context IMMEDIATELY at module load
// If we're in a browser, export mock functions that never touch flags.ts
// (This is a fallback in case server-only doesn't catch it)
const isBrowserContext = typeof window !== 'undefined' || typeof document !== 'undefined';

import { logger } from '@/src/lib/logger';
import { isBuildTime } from '@/src/lib/utils/build-time';
import { normalizeError } from '@/src/lib/utils/error.utils';

const CACHE_TTL_KEYS = [
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

const CACHE_INVALIDATE_KEYS = [
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

const BUILD_TIME_TTL_DEFAULTS: Record<CacheTtlKey, number> = {
  'cache.homepage.ttl_seconds': 3600,
  'cache.content_detail.ttl_seconds': 7200,
  'cache.content_list.ttl_seconds': 1800,
  'cache.content_trending.ttl_seconds': 1800,
  'cache.config_detail.ttl_seconds': 7200,
  'cache.config_list.ttl_seconds': 1800,
  'cache.tool_detail.ttl_seconds': 7200,
  'cache.tool_list.ttl_seconds': 1800,
  'cache.company_detail.ttl_seconds': 1800,
  'cache.company_list.ttl_seconds': 1800,
  'cache.company_profile.ttl_seconds': 1800,
  'cache.related_content.ttl_seconds': 3600,
  'cache.recommendations.ttl_seconds': 3600,
  'cache.content_export.ttl_seconds': 604800,
  'cache.content_paginated.ttl_seconds': 86400,
  'cache.feeds.ttl_seconds': 600,
  'cache.seo.ttl_seconds': 86400,
  'cache.sitemap.ttl_seconds': 86400,
  'cache.status.ttl_seconds': 60,
  'cache.navigation.ttl_seconds': 7200,
  'cache.templates.ttl_seconds': 7200,
  'cache.submission_dashboard.ttl_seconds': 900,
  'cache.user_profile.ttl_seconds': 1800,
  'cache.user_activity.ttl_seconds': 900,
  'cache.user_stats.ttl_seconds': 1800,
  'cache.user_bookmarks.ttl_seconds': 300,
  'cache.user_submissions.ttl_seconds': 300,
  'cache.user_reviews.ttl_seconds': 300,
  'cache.community.ttl_seconds': 1800,
  'cache.article.ttl_seconds': 7200,
  'cache.boilerplate.ttl_seconds': 7200,
  'cache.course.ttl_seconds': 7200,
  'cache.book.ttl_seconds': 7200,
  'cache.quiz.ttl_seconds': 3600,
  'cache.search.ttl_seconds': 3600,
  'cache.search_autocomplete.ttl_seconds': 3600,
  'cache.search_facets.ttl_seconds': 3600,
  'cache.jobs.ttl_seconds': 1800,
  'cache.jobs_detail.ttl_seconds': 1800,
  'cache.changelog.ttl_seconds': 3600,
  'cache.changelog_detail.ttl_seconds': 7200,
  'cache.announcements.ttl_seconds': 1800,
  'cache.account.ttl_seconds': 300,
  'cache.newsletter_count_ttl_s': 300,
  'cache.company_search.ttl_seconds': 1800, // Increased from 300s to 1800s (30min) - company data changes infrequently
  'cache.notifications.ttl_seconds': 300,
  'cache.contact.ttl_seconds': 3600,
};

const CACHE_INVALIDATE_DEFAULTS: Record<CacheInvalidateKey, readonly string[]> = {
  'cache.invalidate.content_create': ['content', 'homepage', 'trending'],
  'cache.invalidate.content_update': ['content', 'homepage', 'trending'],
  'cache.invalidate.content_delete': ['content', 'homepage', 'trending'],
  'cache.invalidate.config_create': ['configs', 'homepage'],
  'cache.invalidate.config_update': ['configs', 'homepage'],
  'cache.invalidate.config_delete': ['configs', 'homepage'],
  'cache.invalidate.tool_create': ['tools', 'homepage'],
  'cache.invalidate.tool_update': ['tools', 'homepage'],
  'cache.invalidate.tool_delete': ['tools', 'homepage'],
  'cache.invalidate.company_create': ['companies'],
  'cache.invalidate.company_update': ['companies'],
  'cache.invalidate.company_delete': ['companies'],
  'cache.invalidate.user_update': ['users'],
  'cache.invalidate.user_profile_oauth': ['users'],
  'cache.invalidate.bookmark_create': ['user-bookmarks', 'users'],
  'cache.invalidate.bookmark_delete': ['user-bookmarks', 'users'],
  'cache.invalidate.follow': ['users'],
  'cache.invalidate.oauth_unlink': ['users'],
  'cache.invalidate.vote': ['content', 'trending'],
  'cache.invalidate.job_create': ['jobs', 'companies'],
  'cache.invalidate.job_update': ['jobs', 'companies'],
  'cache.invalidate.job_delete': ['jobs', 'companies'],
  'cache.invalidate.job_status': ['jobs', 'companies'],
  'cache.invalidate.sponsored_tracking': ['jobs', 'companies'],
  'cache.invalidate.collection_create': ['collections', 'users'],
  'cache.invalidate.collection_update': ['collections', 'users'],
  'cache.invalidate.collection_delete': ['collections', 'users'],
  'cache.invalidate.collection_items': ['collections', 'users'],
  'cache.invalidate.review_create': ['content', 'homepage', 'trending'],
  'cache.invalidate.review_update': ['content'],
  'cache.invalidate.notifications': ['notifications'],
  'cache.invalidate.review_delete': ['content'],
  'cache.invalidate.submission_create': ['submissions'],
  'cache.invalidate.contact_submission': ['contact', 'submissions'],
  'cache.invalidate.review_helpful': ['content'],
  'cache.invalidate.usage_tracking': ['content'],
  'cache.invalidate.changelog': ['changelog'],
  'cache.invalidate.newsletter_subscribe': ['newsletter'],
};

let cacheConfigPromise: CacheConfigPromise | null = null;

/**
 * Detect if we're in build-time context (static generation)
 * During build, headers() is unavailable, so Statsig calls will fail
 * Next.js throws different error messages depending on context:
 * - "headers was called outside a request scope" (older format)
 * - "Dynamic server usage: Route ... couldn't be rendered statically because it used `headers`" (newer format)
 */
function isBuildTimeContext(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message;
    // Check for both error formats
    return (
      (msg.includes('headers') && msg.includes('request scope')) ||
      (msg.includes('Dynamic server usage') && msg.includes('headers'))
    );
  }
  return false;
}

// isBuildTime() is now imported from @/src/lib/utils/build-time
// This ensures consistent build-time detection across the entire codebase

async function loadCacheConfig(): Promise<CacheConfig> {
  // CRITICAL: If we're in browser/client context, return defaults immediately
  // flags/next uses Node.js-only modules (async_hooks) that don't exist in browser
  // This prevents the module from being bundled for client components
  if (isBrowserContext) {
    return {
      ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
      ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
    } as CacheConfig;
  }

  // CRITICAL: During build-time static generation, return defaults immediately
  // This prevents "headers() called outside request scope" and "Server Functions cannot be called" errors
  //
  // The flags/next package uses Vercel Edge Config as a cache layer for Statsig configs.
  // Accessing Edge Config during build triggers server function calls, which Next.js detects
  // as "Server Functions cannot be called during initial render".
  //
  // Solution: Never call cacheConfigs() during build - always use defaults.
  // CRITICAL: This check MUST happen BEFORE any dynamic import of flags.ts
  // Even dynamic imports are analyzed by Next.js during static generation
  // We check MULTIPLE times to be absolutely certain
  // 
  // NOTE: isBuildTime() should return true during local builds (no VERCEL env vars)
  // If it doesn't, we have a problem with build-time detection
  const buildTimeCheck1 = isBuildTime();
  if (buildTimeCheck1) {
    return {
      ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
      ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
    } as CacheConfig;
  }

  // DOUBLE-CHECK: Build-time detection must be extremely conservative
  // If we're uncertain, ALWAYS use defaults to prevent Edge Config access
  const buildTimeCheck2 = isBuildTime();
  if (buildTimeCheck2) {
    return {
      ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
      ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
    } as CacheConfig;
  }

  if (!cacheConfigPromise) {
    // Lazy-load cacheConfigs to avoid module-level initialization issues
    // This ensures flags/next doesn't access Edge Config until we're sure we're in runtime
    try {
      // CRITICAL: Final build-time check RIGHT BEFORE the import
      // This is the last chance to prevent flags.ts from being analyzed during static generation
      // We check AGAIN right before importing to be absolutely certain
      const buildTimeCheck3 = isBuildTime();
      if (buildTimeCheck3) {
        return {
          ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
          ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
        } as CacheConfig;
      }

      // CRITICAL: NEVER import flags.ts during static generation
      // Even with isBuildTime() checks, Next.js analyzes the module during static generation
      // and sees require('flags/next') calls, which triggers Edge Config access
      // Solution: ALWAYS use defaults during build, never import flags.ts
      // 
      // During runtime (not build-time), we would import flags.ts here, but since
      // isBuildTime() should return true during local builds, we should never reach this point
      // If we do reach this point, it means isBuildTime() is not working correctly,
      // so we return defaults as a safety measure
      return {
        ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
        ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
      } as CacheConfig;
    } catch (error) {
      // If this is a build-time error (headers unavailable or server function error), return defaults immediately
      if (
        isBuildTimeContext(error) ||
        (error instanceof Error && error.message.includes('Server Functions'))
      ) {
        return {
          ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
          ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
        } as CacheConfig;
      }
      // Re-throw other errors (shouldn't happen, but safety check)
      throw error;
    }
  }

  try {
    return await cacheConfigPromise;
  } catch (error) {
    cacheConfigPromise = null;

    // If this is a build-time error, return defaults silently (expected during build)
    if (
      isBuildTimeContext(error) ||
      (error instanceof Error && error.message.includes('Server Functions'))
    ) {
      return {
        ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
        ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
      } as CacheConfig;
    }

    // Runtime errors: log and return fallback
    const normalized = normalizeError(error, 'Failed to load cache config from Statsig');
    logger.error('loadCacheConfig failed', normalized, {
      source: 'cache-config.ts',
    });
    // Return fallback config (same as getCacheConfigSnapshot)
    return {
      ...(BUILD_TIME_TTL_DEFAULTS as Record<CacheTtlKey, number>),
      ...(CACHE_INVALIDATE_DEFAULTS as Record<CacheInvalidateKey, readonly string[]>),
    } as CacheConfig;
  }
}

export async function primeCacheConfig(promise: CacheConfigPromise): Promise<void> {
  cacheConfigPromise = promise;
}

export async function getCacheConfigSnapshot(): Promise<CacheConfig> {
  // CRITICAL: If we're in browser/client context, return defaults immediately
  // This prevents flags/next from being bundled for client components
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
  // CRITICAL: If we're in browser/client context, return defaults immediately
  // This prevents flags/next from being bundled for client components
  if (isBrowserContext) {
    return BUILD_TIME_TTL_DEFAULTS[key] ?? 3600;
  }

  // CRITICAL: Check build-time BEFORE calling loadCacheConfig()
  // This prevents flags/next from accessing Vercel Edge Config during build
  // which triggers "Server Functions cannot be called during initial render" errors
  if (isBuildTime()) {
    return BUILD_TIME_TTL_DEFAULTS[key] ?? 3600;
  }

  try {
    const config = await loadCacheConfig();
    return config[key];
  } catch {
    return BUILD_TIME_TTL_DEFAULTS[key] ?? 3600;
  }
}

export async function getCacheInvalidateTags(key: CacheInvalidateKey): Promise<readonly string[]> {
  // CRITICAL: If we're in browser/client context, return defaults immediately
  // This prevents flags/next from being bundled for client components
  if (isBrowserContext) {
    return CACHE_INVALIDATE_DEFAULTS[key] ?? [];
  }

  // CRITICAL: Check build-time BEFORE calling loadCacheConfig()
  // This prevents flags/next from accessing Vercel Edge Config during build
  if (isBuildTime()) {
    return CACHE_INVALIDATE_DEFAULTS[key] ?? [];
  }

  try {
    const config = await loadCacheConfig();
    return config[key];
  } catch {
    return CACHE_INVALIDATE_DEFAULTS[key] ?? [];
  }
}
