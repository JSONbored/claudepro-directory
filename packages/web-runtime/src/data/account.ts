'use server';

import { AccountService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';

import { logger } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';
import { generateRequestId } from '../utils/request-id.ts';

const USER_TIER_VALUES = Constants.public.Enums.user_tier;

const accountDashboardSchema = z.object({
  // eslint-disable-next-line unicorn/prefer-top-level-await -- zod .catch() is not a promise, it's a schema method
  bookmark_count: z.number().catch(0),
  profile: z.object({
    // eslint-disable-next-line unicorn/prefer-top-level-await -- zod .catch() is not a promise, it's a schema method
    name: z.string().nullable().catch(null),
    tier: z
      .enum([...USER_TIER_VALUES] as [
        Database['public']['Enums']['user_tier'],
        ...Database['public']['Enums']['user_tier'][],
      ])
      .nullable()
      // eslint-disable-next-line unicorn/prefer-top-level-await -- zod .catch() is not a promise, it's a schema method
      .catch(null),
    created_at: z.string(),
  }),
});

/**
 * Get account dashboard
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getAccountDashboard(
  userId: string
): Promise<Database['public']['Functions']['get_account_dashboard']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-dashboard-${userId}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getAccountDashboard',
    module: 'data/account',
  });

  try {
    // Can use cookies() inside 'use cache: private'
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getAccountDashboard({ p_user_id: userId });

    reqLogger.info('getAccountDashboard: fetched successfully', {
      userId,
      hasResult: Boolean(result),
    });

    return accountDashboardSchema.parse(result);
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getAccountDashboard: unexpected error', errorForLogging, {
      userId,
    });
    return null;
  }
}

/**
 * Get user library (bookmarks)
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getUserLibrary(
  userId: string
): Promise<Database['public']['Functions']['get_user_library']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-library-${userId}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getUserLibrary',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getUserLibrary({ p_user_id: userId });

    reqLogger.info('getUserLibrary: fetched successfully', {
      userId,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getUserLibrary: unexpected error', errorForLogging, {
      userId,
    });
    return null;
  }
}

export async function getUserBookmarksForCollections(
  userId: string
): Promise<Database['public']['Tables']['bookmarks']['Row'][]> {
  const data = await getUserLibrary(userId);
  const bookmarks = data?.bookmarks ?? [];
  return bookmarks
    .filter(
      (
        b: (typeof bookmarks)[number]
      ): b is typeof b & {
        content_slug: string;
        content_type: string;
        created_at: string;
        id: string;
        updated_at: string;
        user_id: string;
      } =>
        b.id !== null &&
        b.user_id !== null &&
        b.content_type !== null &&
        b.content_slug !== null &&
        b.created_at !== null &&
        b.updated_at !== null
    )
    .map((b: (typeof bookmarks)[number]) => ({
      id: b.id,
      user_id: b.user_id,
      content_type: b.content_type,
      content_slug: b.content_slug,
      notes: b.notes,
      created_at: b.created_at,
      updated_at: b.updated_at,
    })) as Database['public']['Tables']['bookmarks']['Row'][];
}

/**
 * Get user dashboard (jobs)
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getUserDashboard(
  userId: string
): Promise<Database['public']['Functions']['get_user_dashboard']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-dashboard-${userId}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getUserDashboard',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getUserDashboard({ p_user_id: userId });

    reqLogger.info('getUserDashboard: fetched successfully', {
      userId,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getUserDashboard: unexpected error', errorForLogging, {
      userId,
    });
    return null;
  }
}

export async function getUserJobById(
  userId: string,
  jobId: string
): Promise<Database['public']['Tables']['jobs']['Row'] | null> {
  const data = await getUserDashboard(userId);
  const jobs = (data?.jobs as Array<Database['public']['Tables']['jobs']['Row']> | undefined) ?? [];
  return jobs.find((job) => job.id === jobId) ?? null;
}

/**
 * Get collection detail
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId and slug in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getCollectionDetail(
  userId: string,
  slug: string
): Promise<Database['public']['Functions']['get_collection_detail_with_items']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-collection-${userId}-${slug}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getCollectionDetail',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getCollectionDetailWithItems({
      p_user_id: userId,
      p_slug: slug,
    });

    reqLogger.info('getCollectionDetail: fetched successfully', {
      userId,
      slug,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getCollectionDetail: unexpected error', errorForLogging, {
      userId,
      slug,
    });
    return null;
  }
}

/**
 * Get user settings
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getUserSettings(
  userId: string
): Promise<Database['public']['Functions']['get_user_settings']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-settings-${userId}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getUserSettings',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getUserSettings({ p_user_id: userId });

    reqLogger.info('getUserSettings: fetched successfully', {
      userId,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getUserSettings: unexpected error', errorForLogging, {
      userId,
    });
    return null;
  }
}

/**
 * Get sponsorship analytics
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId and sponsorshipId in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getSponsorshipAnalytics(
  userId: string,
  sponsorshipId: string
): Promise<Database['public']['Functions']['get_sponsorship_analytics']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-sponsorship-analytics-${userId}-${sponsorshipId}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getSponsorshipAnalytics',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getSponsorshipAnalytics({
      p_user_id: userId,
      p_sponsorship_id: sponsorshipId,
    });

    reqLogger.info('getSponsorshipAnalytics: fetched successfully', {
      userId,
      sponsorshipId,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getSponsorshipAnalytics: unexpected error', errorForLogging, {
      userId,
      sponsorshipId,
    });
    return null;
  }
}

/**
 * Get user companies
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getUserCompanies(
  userId: string
): Promise<Database['public']['Functions']['get_user_companies']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-companies-${userId}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getUserCompanies',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getUserCompanies({ p_user_id: userId });

    reqLogger.info('getUserCompanies: fetched successfully', {
      userId,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getUserCompanies: unexpected error', errorForLogging, {
      userId,
    });
    return null;
  }
}

/**
 * Get user sponsorships
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getUserSponsorships(
  userId: string
): Promise<Database['public']['Functions']['get_user_sponsorships']['Returns']> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-sponsorships-${userId}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getUserSponsorships',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getUserSponsorships({ p_user_id: userId });

    reqLogger.info('getUserSponsorships: fetched successfully', {
      userId,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getUserSponsorships: unexpected error', errorForLogging, {
      userId,
    });
    return [];
  }
}

export async function getUserCompanyById(
  userId: string,
  companyId: string
): Promise<Database['public']['CompositeTypes']['user_companies_company'] | null> {
  const data = await getUserCompanies(userId);
  const company = data?.companies?.find(
    (c: Database['public']['CompositeTypes']['user_companies_company']) => c.id === companyId
  );
  return company ?? null;
}

/**
 * Get submission dashboard
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Cache keys include limits for different cache entries
 * - Not prerendered (runs at request time)
 */
export async function getSubmissionDashboard(
  recentLimit = 5,
  contributorsLimit = 5
): Promise<Database['public']['Functions']['get_submission_dashboard']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`submission-dashboard-${recentLimit}-${contributorsLimit}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getSubmissionDashboard',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getSubmissionDashboard({
      p_recent_limit: recentLimit,
      p_contributors_limit: contributorsLimit,
    });

    reqLogger.info('getSubmissionDashboard: fetched successfully', {
      recentLimit,
      contributorsLimit,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getSubmissionDashboard: unexpected error', errorForLogging, {
      recentLimit,
      contributorsLimit,
    });
    return null;
  }
}

/**
 * Account Dashboard Bundle - Shared data per request
 *
 * Fetches dashboard, user library, and homepage data in parallel to reduce
 * duplicate data fetching across account pages. This ensures each request
 * only fetches shared data once, improving performance and reducing Supabase load.
 *
 * @param userId - Authenticated user ID
 * @param categoryIds - Homepage category IDs (optional, defaults to getHomepageCategoryIds)
 * @returns Bundle containing dashboard, library, and homepage data
 */
export interface AccountDashboardBundle {
  dashboard: Awaited<ReturnType<typeof getAccountDashboard>>;
  homepage: Awaited<ReturnType<typeof import('./content/homepage.ts').getHomepageData>>;
  library: Awaited<ReturnType<typeof getUserLibrary>>;
}

/**
 * Get user activity summary
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getUserActivitySummary(
  userId: string
): Promise<Database['public']['Functions']['get_user_activity_summary']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-activity-summary-${userId}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getUserActivitySummary',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getUserActivitySummary({ p_user_id: userId });

    reqLogger.info('getUserActivitySummary: fetched successfully', {
      userId,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getUserActivitySummary: unexpected error', errorForLogging, {
      userId,
    });
    return {
      total_posts: 0,
      total_comments: 0,
      total_votes: 0,
      total_submissions: 0,
      merged_submissions: 0,
      total_activity: 0,
    };
  }
}

/**
 * Get user activity timeline
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId, type, limit, offset in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getUserActivityTimeline(input: {
  limit?: number | undefined;
  offset?: number | undefined;
  type?: string | undefined;
  userId: string;
}): Promise<Database['public']['Functions']['get_user_activity_timeline']['Returns'] | null> {
  'use cache: private';
  const { userId, type, limit = 20, offset = 0 } = input;
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-activity-timeline-${userId}-${type ?? 'all'}-${limit}-${offset}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getUserActivityTimeline',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getUserActivityTimeline({
      p_user_id: userId,
      ...(type && { p_type: type }),
      p_limit: limit,
      p_offset: offset,
    });

    reqLogger.info('getUserActivityTimeline: fetched successfully', {
      userId,
      type: type ?? 'all',
      limit,
      offset,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getUserActivityTimeline: unexpected error', errorForLogging, {
      userId,
      type: type ?? 'all',
      limit,
      offset,
    });
    return {
      activities: [],
      has_more: false,
      total: 0,
    };
  }
}

/**
 * Get user identities
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 */
export async function getUserIdentitiesData(
  userId: string
): Promise<Database['public']['Functions']['get_user_identities']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-identities-${userId}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getUserIdentitiesData',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);

    const result = await service.getUserIdentities({ p_user_id: userId });

    reqLogger.info('getUserIdentitiesData: fetched successfully', {
      userId,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('getUserIdentitiesData: unexpected error', errorForLogging, {
      userId,
    });
    return { identities: [] };
  }
}

/**
 * Check if content is bookmarked by user
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function isBookmarked(input: {
  content_slug: string;
  content_type: Database['public']['Enums']['content_category'];
  userId: string;
}): Promise<boolean> {
  'use cache: private';
  const { userId, content_type, content_slug } = input;

  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag('user-bookmarks');
  cacheTag(`user-${userId}`);
  cacheTag(`content-${content_slug}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'isBookmarked',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);
    const result = await service.isBookmarked({
      p_user_id: userId,
      p_content_type: content_type,
      p_content_slug: content_slug,
    });

    return result ?? false;
  } catch (error) {
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('isBookmarked: unexpected error', errorForLogging, {
      userId,
      content_type,
      content_slug,
    });
    return false;
  }
}

/**
 * Check if user is following another user
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function isFollowing(input: {
  followerId: string;
  followingId: string;
}): Promise<boolean> {
  'use cache: private';
  const { followerId, followingId } = input;

  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag('users');
  cacheTag(`user-${followerId}`);
  cacheTag(`user-${followingId}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'isFollowing',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);
    const result = await service.isFollowing({
      follower_id: followerId,
      following_id: followingId,
    });

    return result ?? false;
  } catch (error) {
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('isFollowing: unexpected error', errorForLogging, {
      followerId,
      followingId,
    });
    return false;
  }
}

/**
 * Batch check bookmark status for multiple items
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function isBookmarkedBatch(input: {
  items: Array<{
    content_slug: string;
    content_type: Database['public']['Enums']['content_category'];
  }>;
  userId: string;
}): Promise<Database['public']['Functions']['is_bookmarked_batch']['Returns']> {
  'use cache: private';
  const { userId, items } = input;

  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag('user-bookmarks');
  cacheTag(`user-${userId}`);
  // Include sorted item keys in cache tag for proper cache key generation
  const itemKey = items
    .map((i) => `${i.content_type}:${i.content_slug}`)
    .sort()
    .join(',');
  cacheTag(`bookmark-batch-${itemKey}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'isBookmarkedBatch',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);
    const result = await service.isBookmarkedBatch({
      p_user_id: userId,
      p_items: items,
    });

    return result ?? [];
  } catch (error) {
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('isBookmarkedBatch: unexpected error', errorForLogging, {
      userId,
      itemCount: items.length,
    });
    return [];
  }
}

/**
 * Batch check follow status for multiple users
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function isFollowingBatch(input: {
  followedUserIds: string[];
  followerId: string;
}): Promise<Database['public']['Functions']['is_following_batch']['Returns']> {
  'use cache: private';
  const { followerId, followedUserIds } = input;

  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag('users');
  cacheTag(`user-${followerId}`);
  // Include sorted user IDs in cache tag for proper cache key generation
  const userIdsKey = [...followedUserIds].sort().join(',');
  cacheTag(`follow-batch-${userIdsKey}`);

  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'isFollowingBatch',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);
    const result = await service.isFollowingBatch({
      p_follower_id: followerId,
      p_followed_user_ids: followedUserIds,
    });

    return result ?? [];
  } catch (error) {
    const errorForLogging: Error | string =
      error instanceof Error ? error : error instanceof String ? error.toString() : String(error);
    reqLogger.error('isFollowingBatch: unexpected error', errorForLogging, {
      followerId,
      followedUserCount: followedUserIds.length,
    });
    return [];
  }
}

export async function getAccountDashboardBundle(
  userId: string,
  categoryIds?: readonly string[]
): Promise<AccountDashboardBundle> {
  // Lazy import to avoid circular dependencies
  const { getHomepageData } = await import('./content/homepage.ts');
  const { getHomepageCategoryIds } = await import('./config/category/index.ts');

  const finalCategoryIds = categoryIds ?? getHomepageCategoryIds;

  // Fetch all three data sources in parallel
  const [dashboard, library, homepage] = await Promise.all([
    getAccountDashboard(userId),
    getUserLibrary(userId),
    getHomepageData(finalCategoryIds),
  ]);

  return {
    dashboard,
    library,
    homepage,
  };
}
