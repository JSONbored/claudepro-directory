/**
 * Cache Config Defaults for Edge Functions
 * 
 * Extracted from web-runtime defaults to avoid cross-package dependency.
 * Edge functions cannot import from web-runtime due to Deno module resolution.
 * 
 * These values match CACHE_CONFIG_DEFAULTS in @heyclaude/web-runtime/feature-flags/defaults.ts
 */

export const CACHE_CONFIG_DEFAULTS = {
  // TTL Settings (in seconds) - Optimized for low-traffic sites
  'cache.homepage.ttl_seconds': 3600, // 1 hour
  'cache.content_detail.ttl_seconds': 7200, // 2 hours
  'cache.content_list.ttl_seconds': 1800, // 30 minutes
  'cache.content_trending.ttl_seconds': 1800, // 30 minutes
  'cache.config_detail.ttl_seconds': 7200, // 2 hours
  'cache.config_list.ttl_seconds': 1800, // 30 minutes
  'cache.tool_detail.ttl_seconds': 7200, // 2 hours
  'cache.tool_list.ttl_seconds': 1800, // 30 minutes
  'cache.company_detail.ttl_seconds': 1800, // 30 minutes
  'cache.company_list.ttl_seconds': 1800, // 30 minutes
  'cache.company_profile.ttl_seconds': 1800, // 30 minutes (public profile API)
  'cache.related_content.ttl_seconds': 3600, // 1 hour (stable recommendations)
  'cache.recommendations.ttl_seconds': 3600, // 1 hour (AI-config recommendations)
  'cache.content_export.ttl_seconds': 604800, // 7 days (content JSON/markdown/LLMs exports)
  'cache.content_paginated.ttl_seconds': 86400, // 1 day (homepage infinite scroll)
  'cache.feeds.ttl_seconds': 600, // 10 minutes (RSS/Atom feeds)
  'cache.seo.ttl_seconds': 86400, // 1 day (SEO metadata builder)
  'cache.sitemap.ttl_seconds': 86400, // 1 day (sitemap XML/JSON)
  'cache.status.ttl_seconds': 60, // 1 minute (status health endpoint)
  'cache.navigation.ttl_seconds': 7200, // 2 hours (rarely changes)
  'cache.templates.ttl_seconds': 7200, // 2 hours (rarely changes)
  'cache.submission_dashboard.ttl_seconds': 900, // 15 minutes (community activity updates)
  'cache.user_profile.ttl_seconds': 1800, // 30 minutes
  'cache.user_activity.ttl_seconds': 900, // 15 minutes
  'cache.user_stats.ttl_seconds': 1800, // 30 minutes
  'cache.user_bookmarks.ttl_seconds': 300, // 5 minutes (feels real-time)
  'cache.user_submissions.ttl_seconds': 300, // 5 minutes
  'cache.user_reviews.ttl_seconds': 300, // 5 minutes
  'cache.community.ttl_seconds': 1800, // 30 minutes
  'cache.article.ttl_seconds': 7200, // 2 hours
  'cache.boilerplate.ttl_seconds': 7200, // 2 hours
  'cache.course.ttl_seconds': 7200, // 2 hours
  'cache.book.ttl_seconds': 7200, // 2 hours
  'cache.quiz.ttl_seconds': 3600, // 1 hour
  'cache.search.ttl_seconds': 3600, // 1 hour
  'cache.search_autocomplete.ttl_seconds': 3600, // 1 hour (suggestions from history)
  'cache.search_facets.ttl_seconds': 3600, // 1 hour (available filters)
  'cache.jobs.ttl_seconds': 1800, // 30 minutes
  'cache.jobs_detail.ttl_seconds': 1800, // 30 minutes
  'cache.changelog.ttl_seconds': 3600, // 1 hour
  'cache.changelog_detail.ttl_seconds': 7200, // 2 hours
  'cache.announcements.ttl_seconds': 1800, // 30 minutes
  'cache.account.ttl_seconds': 300, // 5 minutes (user-specific data, shorter TTL)
  'cache.newsletter_count_ttl_s': 300, // 5 minutes (subscriber count)
  'cache.company_search.ttl_seconds': 300, // 5 minutes (company selector search)
  'cache.notifications.ttl_seconds': 300, // 5 minutes (user notification cache)
  'cache.contact.ttl_seconds': 3600, // 1 hour (contact terminal commands)

  // Invalidation Tag Arrays
  'cache.invalidate.content_create': ['content', 'homepage', 'trending'] as string[],
  'cache.invalidate.content_update': ['content', 'homepage', 'trending'] as string[],
  'cache.invalidate.content_delete': ['content', 'homepage', 'trending'] as string[],
  'cache.invalidate.config_create': ['configs', 'homepage'] as string[],
  'cache.invalidate.config_update': ['configs', 'homepage'] as string[],
  'cache.invalidate.config_delete': ['configs', 'homepage'] as string[],
  'cache.invalidate.tool_create': ['tools', 'homepage'] as string[],
  'cache.invalidate.tool_update': ['tools', 'homepage'] as string[],
  'cache.invalidate.tool_delete': ['tools', 'homepage'] as string[],
  'cache.invalidate.company_create': ['companies'] as string[],
  'cache.invalidate.company_update': ['companies'] as string[],
  'cache.invalidate.company_delete': ['companies'] as string[],
  'cache.invalidate.user_update': ['users'] as string[],
  'cache.invalidate.user_profile_oauth': ['users'] as string[],
  'cache.invalidate.bookmark_create': ['user-bookmarks', 'users'] as string[],
  'cache.invalidate.bookmark_delete': ['user-bookmarks', 'users'] as string[],
  'cache.invalidate.follow': ['users'] as string[],
  'cache.invalidate.oauth_unlink': ['users'] as string[],
  'cache.invalidate.vote': ['content', 'trending'] as string[],
  'cache.invalidate.job_create': ['jobs', 'companies'] as string[],
  'cache.invalidate.job_update': ['jobs', 'companies'] as string[],
  'cache.invalidate.job_delete': ['jobs', 'companies'] as string[],
  'cache.invalidate.job_status': ['jobs', 'companies'] as string[],
  'cache.invalidate.sponsored_tracking': ['jobs', 'companies'] as string[],
  'cache.invalidate.collection_create': ['collections', 'users'] as string[],
  'cache.invalidate.collection_update': ['collections', 'users'] as string[],
  'cache.invalidate.collection_delete': ['collections', 'users'] as string[],
  'cache.invalidate.collection_items': ['collections', 'users'] as string[],
  'cache.invalidate.review_create': ['content', 'homepage', 'trending'] as string[],
  'cache.invalidate.review_update': ['content'] as string[],
  'cache.invalidate.notifications': ['notifications'] as string[],
  'cache.invalidate.review_delete': ['content'] as string[],
  'cache.invalidate.submission_create': ['submissions'] as string[],
  'cache.invalidate.contact_submission': ['contact', 'submissions'] as string[],
  'cache.invalidate.review_helpful': ['content'] as string[],
  'cache.invalidate.usage_tracking': ['content'] as string[],
  'cache.invalidate.changelog': ['changelog'] as string[],
  'cache.invalidate.newsletter_subscribe': ['newsletter'] as string[],

  // Queue Batch Sizes (for edge functions)
  'queue.pulse.batch_size': 100,
  'queue.changelog_process.batch_size': 5,
  'queue.changelog_notify.batch_size': 5,
} as const;
