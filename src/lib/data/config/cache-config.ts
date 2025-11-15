'use server';

import { cacheConfigs } from '@/src/lib/flags';

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
  'cache.company_search.ttl_seconds': 300,
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
};

let cacheConfigPromise: CacheConfigPromise | null = null;

async function loadCacheConfig(): Promise<CacheConfig> {
  if (!cacheConfigPromise) {
    cacheConfigPromise = cacheConfigs() as CacheConfigPromise;
  }
  try {
    return await cacheConfigPromise;
  } catch (error) {
    cacheConfigPromise = null;
    throw error;
  }
}

export function primeCacheConfig(promise: CacheConfigPromise): void {
  cacheConfigPromise = promise;
}

export async function getCacheConfigSnapshot(): Promise<CacheConfig> {
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
  try {
    const config = await loadCacheConfig();
    return config[key];
  } catch {
    return BUILD_TIME_TTL_DEFAULTS[key] ?? 3600;
  }
}

export async function getCacheInvalidateTags(key: CacheInvalidateKey): Promise<readonly string[]> {
  try {
    const config = await loadCacheConfig();
    return config[key];
  } catch {
    return CACHE_INVALIDATE_DEFAULTS[key] ?? [];
  }
}
