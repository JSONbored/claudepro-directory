'use server';

import { type IsBookmarkedBatchReturns, type IsFollowingBatchReturns } from '@heyclaude/data-layer';
import {
  type bookmarksModel,
  type content_category,
  type jobsModel,
  type user_tier,
} from '@heyclaude/data-layer/prisma';
import { UserTier } from '@heyclaude/data-layer/prisma';
import {
  type GetAccountDashboardReturns,
  type GetCollectionDetailWithItemsReturns,
  type GetSponsorshipAnalyticsReturns,
  type GetSubmissionDashboardReturns,
  type GetUserCompleteDataArgs,
  type GetUserCompleteDataReturns,
  type GetUserIdentitiesReturns,
  type GetUserLibraryReturns,
  type UserCompaniesCompany,
} from '@heyclaude/database-types/postgres-types';
import { z } from 'zod';

import { getAuthenticatedUserFromClient } from '../auth/get-authenticated-user.ts';
import { normalizeError } from '../errors.ts';
import { logger } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';

import { createCachedDataFunction } from './cached-data-factory.ts';
import { getService } from './service-factory.ts';

const USER_TIER_VALUES = Object.values(UserTier) as readonly user_tier[];

const accountDashboardSchema = z.object({
  // eslint-disable-next-line unicorn/prefer-top-level-await -- zod .catch() is not a promise, it's a schema method
  bookmark_count: z.number().catch(0),
  profile: z.object({
    created_at: z.string(),
    // eslint-disable-next-line unicorn/prefer-top-level-await -- zod .catch() is not a promise, it's a schema method
    name: z.string().nullable().catch(null),
    tier: z
      .enum([...USER_TIER_VALUES] as [user_tier, ...user_tier[]])
      .nullable()
      // eslint-disable-next-line unicorn/prefer-top-level-await -- zod .catch() is not a promise, it's a schema method
      .catch(null),
  }),
});


/**
 * Get user bookmarks for collections
 *
 * Converts RPC return data (composite type with string dates) to Prisma bookmarks type (with Date objects).
 * This function transforms the data structure from the RPC composite type to match Prisma table types.
 *
 * NOTE: The consuming code (CollectionForm) uses Prisma types for type safety.
 * This function returns Prisma types to prepare for that migration.
 *
 * @param userId - User ID
 * @returns Array of bookmarks in Prisma format (with Date objects for timestamps)
 */
export async function getUserBookmarksForCollections(userId: string): Promise<bookmarksModel[]> {
  // OPTIMIZATION: Use getUserCompleteData directly instead of wrapper
  const completeData = await getUserCompleteData(userId);
  const bookmarksArray = completeData?.user_library?.bookmarks ?? [];
  return bookmarksArray
    .filter(
      (
        b: (typeof bookmarksArray)[number]
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
    .map((b) => ({
      content_slug: b.content_slug,
      content_type: b.content_type as bookmarksModel['content_type'], // RPC returns string, Prisma expects enum
      created_at: new Date(b.created_at), // Convert string to Date for Prisma type
      id: b.id,
      notes: b.notes ?? null,
      updated_at: new Date(b.updated_at), // Convert string to Date for Prisma type
      user_id: b.user_id,
    }));
}


/**
 * Get user job by ID
 * Simplified: Extracts job from getUserCompleteData result
 */
export async function getUserJobById(userId: string, jobId: string): Promise<jobsModel | null> {
  const completeData = await getUserCompleteData(userId);
  const jobs = (completeData?.user_dashboard?.jobs as jobsModel[] | undefined) ?? [];
  return jobs.find((job) => job.id === jobId) ?? null;
}

/**
 * Get user complete data (consolidated)
 *
 * Returns ALL user account data in a single optimized database call, including:
 * - Account Dashboard (bookmark_count, profile)
 * - User Dashboard (submissions, companies, jobs)
 * - User Settings (profile, user_data)
 * - Activity Summary (total_posts, total_comments, total_votes, total_submissions, merged_submissions, total_activity)
 * - Activity Timeline (paginated activity items)
 * - User Library (bookmarks, collections, stats)
 * - User Identities (OAuth connections)
 * - Sponsorships (sponsored content array)
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 *
 * @param userId - Authenticated user ID
 * @param options - Optional parameters for activity timeline pagination
 * @param options.activityLimit
 * @param options.activityOffset
 * @param options.activityType
 * @returns Consolidated user data or null if user not found
 */
export async function getUserCompleteData(
  userId: string,
  options?: {
    activityLimit?: number;
    activityOffset?: number;
    activityType?: null | string;
  }
): Promise<GetUserCompleteDataReturns | null> {
  'use cache: private';
  const { cacheLife, cacheTag } = await import('next/cache');
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data
  cacheTag(`user-complete-data-${userId}`);

  const reqLogger = logger.child({
    module: 'data/account',
    operation: 'getUserCompleteData',
  });

  try {
    const client = await createSupabaseServerClient();

    // Single authentication check - getAuthenticatedUserFromClient validates session via getUser()
    // No need to call getSession() separately as getUser() already validates the session
    const authResult = await getAuthenticatedUserFromClient(client, {
      context: 'getUserCompleteData',
      requireUser: true,
    });

    // Verify authentication and userId match in single check
    if (!authResult.isAuthenticated || authResult.user?.id !== userId) {
      reqLogger.warn(
        {
          authenticatedUserId: authResult.user?.id,
          error: authResult.error?.message,
          hasUser: Boolean(authResult.user),
          isAuthenticated: authResult.isAuthenticated,
          requestedUserId: userId,
        },
        'getUserCompleteData: authentication failed or userId mismatch'
      );
      return null;
    }

    // Use AccountService for proper architectural flow through data layer
    // OPTIMIZATION: Use singleton instance (services are stateless)
    const service = await getService('account');

    // Build RPC parameters - only include p_activity_type if it's provided (not null/undefined)
    const rpcParams: GetUserCompleteDataArgs = {
      p_activity_limit: options?.activityLimit ?? 20,
      p_activity_offset: options?.activityOffset ?? 0,
      p_user_id: userId,
      ...(options?.activityType && { p_activity_type: options.activityType }),
    };

    const result = await service.getUserCompleteData(rpcParams);

    reqLogger.info(
      { hasResult: Boolean(result), userId },
      'getUserCompleteData: fetched successfully'
    );

    // Type assertion: RPC returns postgres-types, using custom composite types for consistency
    // The structure matches, but nullability differs slightly between Database types and our custom types
    // TODO: Remove assertion when fully migrated to Prisma queries
    return result;
  } catch (error) {
    // Normalize error properly - handle both Error instances and Supabase error objects
    const normalizedError = normalizeError(error, 'getUserCompleteData: unexpected error occurred');
    reqLogger.error(
      {
        err: normalizedError,
        options,
        // Include original error details if available
        originalError:
          error && typeof error === 'object' && 'code' in error
            ? {
                code: (error as { code?: string }).code,
                details: (error as { details?: string }).details,
                hint: (error as { hint?: string }).hint,
                message: (error as { message?: string }).message,
              }
            : undefined,
        userId,
      },
      'getUserCompleteData: unexpected error occurred'
    );
    return null;
  }
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
 * @param userId
 * @param slug
 */
/**
 * Get collection detail
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function getCollectionDetail(
  userId: string,
  slug: string
): Promise<GetCollectionDetailWithItemsReturns | null> {
  const cachedFn = createCachedDataFunction<
    { userId: string; slug: string },
    GetCollectionDetailWithItemsReturns | null
  >({
    serviceKey: 'account',
    methodName: 'getCollectionDetailWithItems',
    cacheMode: 'private',
    cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
    cacheTags: (args) => [`user-collection-${args.userId}-${args.slug}`],
    module: 'data/account',
    operation: 'getCollectionDetail',
    transformArgs: (args) => ({
      p_slug: args.slug,
      p_user_id: args.userId,
    }),
    onError: () => null,
    logContext: (args) => ({ slug: args.slug, userId: args.userId }),
  });

  return await cachedFn({ userId, slug });
}

/**
 * Get user settings
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * NOTE: This function now uses the consolidated getUserCompleteData internally
 * for better performance and to avoid "role 'user' does not exist" errors.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 */

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
 * @param userId
 * @param sponsorshipId
 */
/**
 * Get sponsorship analytics
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
/**
 * Get sponsorship analytics
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function getSponsorshipAnalytics(
  userId: string,
  sponsorshipId: string
): Promise<GetSponsorshipAnalyticsReturns | null> {
  const cachedFn = createCachedDataFunction<
    { userId: string; sponsorshipId: string },
    GetSponsorshipAnalyticsReturns | null
  >({
    serviceKey: 'account',
    methodName: 'getSponsorshipAnalytics',
    cacheMode: 'private',
    cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
    cacheTags: (args) => [`user-sponsorship-analytics-${args.userId}-${args.sponsorshipId}`],
    module: 'data/account',
    operation: 'getSponsorshipAnalytics',
    transformArgs: (args) => ({
      p_sponsorship_id: args.sponsorshipId,
      p_user_id: args.userId,
    }),
    onError: () => null,
    logContext: (args) => ({ sponsorshipId: args.sponsorshipId, userId: args.userId }),
  });

  return await cachedFn({ userId, sponsorshipId });
}

// All call sites have been updated to use getUserCompleteData().sponsorships

/**
 * Get user company by ID
 * Simplified: Extracts company from getUserCompleteData result
 */
export async function getUserCompanyById(
  userId: string,
  companyId: string
): Promise<null | UserCompaniesCompany> {
  const completeData = await getUserCompleteData(userId);
  const companies = Array.isArray(completeData?.user_dashboard?.companies)
    ? (completeData.user_dashboard.companies as UserCompaniesCompany[])
    : [];
  return companies.find((c) => c?.id === companyId) ?? null;
}

/**
 * Get submission dashboard
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function getSubmissionDashboard(
  recentLimit = 5,
  contributorsLimit = 5
): Promise<GetSubmissionDashboardReturns | null> {
  const cachedFn = createCachedDataFunction<
    { recentLimit: number; contributorsLimit: number },
    GetSubmissionDashboardReturns | null
  >({
    serviceKey: 'account',
    methodName: 'getSubmissionDashboard',
    cacheMode: 'private',
    cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
    cacheTags: (args) => [
      `submission-dashboard-${args.recentLimit}-${args.contributorsLimit}`,
    ],
    module: 'data/account',
    operation: 'getSubmissionDashboard',
    transformArgs: (args) => ({
      p_contributors_limit: args.contributorsLimit,
      p_recent_limit: args.recentLimit,
    }),
    onError: () => null,
    logContext: (args) => ({
      contributorsLimit: args.contributorsLimit,
      recentLimit: args.recentLimit,
    }),
  });

  return await cachedFn({ recentLimit, contributorsLimit });
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
  dashboard: GetAccountDashboardReturns | null;
  homepage: Awaited<ReturnType<typeof import('./content/homepage.ts').getHomepageData>>;
  library: GetUserLibraryReturns | null;
}

// All call sites have been updated to use getUserCompleteData(userId, { activityLimit, activityOffset, activityType }).activity_timeline
// Note: For custom pagination, call getUserCompleteData with options directly

/**
 * Get user identities
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * NOTE: This function now uses the consolidated getUserCompleteData internally
 * for better performance and to avoid "role 'user' does not exist" errors.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 * @param userId
 */
/**
 * Get user identities
 * Simplified: Extracts identities from getUserCompleteData result
 * Uses same cache tags as getUserCompleteData for cache sharing
 */
export async function getUserIdentitiesData(
  userId: string
): Promise<GetUserIdentitiesReturns | null> {
  const completeData = await getUserCompleteData(userId);
  return completeData?.user_identities ?? { identities: [] };
}

/**
 * Check if content is bookmarked by user
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
/**
 * Check if content is bookmarked by user
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function isBookmarked(input: {
  content_slug: string;
  content_type: content_category;
  userId: string;
}): Promise<boolean> {
  const cachedFn = createCachedDataFunction<
    { content_slug: string; content_type: content_category; userId: string },
    boolean
  >({
    serviceKey: 'account',
    methodName: 'isBookmarked',
    cacheMode: 'private',
    cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
    cacheTags: (input) => [
      'user-bookmarks',
      `user-${input.userId}`,
      `content-${input.content_slug}`,
    ],
    module: 'data/account',
    operation: 'isBookmarked',
    transformArgs: (input) => ({
      p_content_slug: input.content_slug,
      p_content_type: input.content_type,
      p_user_id: input.userId,
    }),
    transformResult: (result) => Boolean(result), // Generated type is unknown, but function returns boolean
    onError: () => false,
    logContext: (input) => ({
      content_slug: input.content_slug,
      content_type: input.content_type,
      userId: input.userId,
    }),
  });

  return (await cachedFn(input)) ?? false;
}

/**
 * Check if user is following another user
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
/**
 * Check if user is following another user
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function isFollowing(input: {
  followerId: string;
  followingId: string;
}): Promise<boolean> {
  const cachedFn = createCachedDataFunction<
    { followerId: string; followingId: string },
    boolean
  >({
    serviceKey: 'account',
    methodName: 'isFollowing',
    cacheMode: 'private',
    cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
    cacheTags: (input) => ['users', `user-${input.followerId}`, `user-${input.followingId}`],
    module: 'data/account',
    operation: 'isFollowing',
    transformArgs: (input) => ({
      follower_id: input.followerId,
      following_id: input.followingId,
    }),
    transformResult: (result) => Boolean(result), // Generated type is unknown, but function returns boolean
    onError: () => false,
    logContext: (input) => ({
      followerId: input.followerId,
      followingId: input.followingId,
    }),
  });

  return (await cachedFn(input)) ?? false;
}

/**
 * Batch check bookmark status for multiple items
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
/**
 * Batch check bookmark status for multiple items
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function isBookmarkedBatch(input: {
  items: Array<{
    content_slug: string;
    content_type: content_category;
  }>;
  userId: string;
}): Promise<IsBookmarkedBatchReturns> {
  const cachedFn = createCachedDataFunction<
    {
      items: Array<{
        content_slug: string;
        content_type: content_category;
      }>;
      userId: string;
    },
    IsBookmarkedBatchReturns
  >({
    serviceKey: 'account',
    methodName: 'isBookmarkedBatch',
    cacheMode: 'private',
    cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
    cacheTags: (input) => {
      const tags = ['user-bookmarks', `user-${input.userId}`];
      // Include sorted item keys in cache tag for proper cache key generation
      const itemKey = input.items
        .map((i) => `${i.content_type}:${i.content_slug}`)
        .toSorted()
        .join(',');
      tags.push(`bookmark-batch-${itemKey}`);
      return tags;
    },
    module: 'data/account',
    operation: 'isBookmarkedBatch',
    transformArgs: (input) => ({
      p_items: input.items, // Array is valid - service handles both array and JSONB
      p_user_id: input.userId,
    }),
    onError: () => [],
    logContext: (input) => ({
      itemCount: input.items.length,
      userId: input.userId,
    }),
  });

  return (await cachedFn(input)) ?? [];
}

/**
 * Batch check follow status for multiple users
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
/**
 * Batch check follow status for multiple users
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 */
export async function isFollowingBatch(input: {
  followedUserIds: string[];
  followerId: string;
}): Promise<IsFollowingBatchReturns> {
  const cachedFn = createCachedDataFunction<
    { followedUserIds: string[]; followerId: string },
    IsFollowingBatchReturns
  >({
    serviceKey: 'account',
    methodName: 'isFollowingBatch',
    cacheMode: 'private',
    cacheLife: 'userProfile', // 1min stale, 5min revalidate, 30min expire - User-specific data
    cacheTags: (input) => {
      const tags = ['users', `user-${input.followerId}`];
      // Include sorted user IDs in cache tag for proper cache key generation
      const userIdsKey = [...input.followedUserIds].toSorted().join(',');
      tags.push(`follow-batch-${userIdsKey}`);
      return tags;
    },
    module: 'data/account',
    operation: 'isFollowingBatch',
    transformArgs: (input) => ({
      p_followed_user_ids: input.followedUserIds,
      p_follower_id: input.followerId,
    }),
    onError: () => [],
    logContext: (input) => ({
      followedUserCount: input.followedUserIds.length,
      followerId: input.followerId,
    }),
  });

  return (await cachedFn(input)) ?? [];
}

/**
 * Get account dashboard bundle
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This bundles dashboard, library, and homepage data together, with the first two
 * being user-specific (cached per-user) and homepage being public (shared cache).
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 * @param userId
 * @param categoryIds
 */
export async function getAccountDashboardBundle(
  userId: string,
  categoryIds?: readonly string[]
): Promise<AccountDashboardBundle> {
  'use cache: private';
  const { cacheLife, cacheTag } = await import('next/cache');
  cacheLife('userProfile'); // 1min stale, 5min revalidate, 30min expire - User-specific data
  cacheTag(`user-dashboard-bundle-${userId}`);
  if (categoryIds) {
    cacheTag(`dashboard-bundle-categories-${categoryIds.join(',')}`);
  }

  // Lazy import to avoid circular dependencies
  const { getHomepageData } = await import('./content/homepage.ts');
  const { getHomepageCategoryIds } = await import('./config/category/index.ts');

  const finalCategoryIds = categoryIds ?? getHomepageCategoryIds;

  // OPTIMIZATION: Use getUserCompleteData directly - single database call instead of two
  const [completeData, homepage] = await Promise.all([
    getUserCompleteData(userId),
    getHomepageData(finalCategoryIds),
  ]);

  // Extract dashboard and library from complete data
  const dashboard = completeData?.account_dashboard
    ? accountDashboardSchema.parse(completeData.account_dashboard)
    : null;
  const library = completeData?.user_library ?? null;

  return {
    dashboard,
    homepage,
    library,
  };
}
