'use server';

import { AccountService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { cacheLife, cacheTag } from 'next/cache';
import { z } from 'zod';

import { getAuthenticatedUserFromClient } from '../auth/get-authenticated-user.ts';
import { normalizeError } from '../errors.ts';
import { logger } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';

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
 * NOTE: This function now uses the consolidated getUserCompleteData internally
 * for better performance and to avoid "role 'user' does not exist" errors.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 * @param userId
 */
export async function getAccountDashboard(
  userId: string
): Promise<Database['public']['Functions']['get_account_dashboard']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-dashboard-${userId}`);
  // Also tag with complete data cache to share cache entry
  cacheTag(`user-complete-data-${userId}`);

  const reqLogger = logger.child({
    operation: 'getAccountDashboard',
    module: 'data/account',
  });

  try {
    // Use consolidated function internally - single optimized database call
    const completeData = await getUserCompleteData(userId);

    if (!completeData?.account_dashboard) {
      reqLogger.warn('getAccountDashboard: account_dashboard missing from complete data', {
        userId,
        hasCompleteData: Boolean(completeData),
      });
      return null;
    }

    const result = accountDashboardSchema.parse(completeData.account_dashboard);

    reqLogger.info('getAccountDashboard: fetched successfully', {
      userId,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * NOTE: This function now uses the consolidated getUserCompleteData internally
 * for better performance and to avoid "role 'user' does not exist" errors.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 * @param userId
 */
export async function getUserLibrary(
  userId: string
): Promise<Database['public']['Functions']['get_user_library']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-library-${userId}`);
  // Also tag with complete data cache to share cache entry
  cacheTag(`user-complete-data-${userId}`);

  const reqLogger = logger.child({
    operation: 'getUserLibrary',
    module: 'data/account',
  });

  try {
    // Use consolidated function internally - single optimized database call
    const completeData = await getUserCompleteData(userId);

    if (!completeData?.user_library) {
      reqLogger.warn('getUserLibrary: user_library missing from complete data', {
        userId,
        hasCompleteData: Boolean(completeData),
      });
      return null;
    }

    reqLogger.info('getUserLibrary: fetched successfully', {
      userId,
      hasResult: Boolean(completeData.user_library),
    });

    return completeData.user_library;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * NOTE: This function now uses the consolidated getUserCompleteData internally
 * for better performance and to avoid "role 'user' does not exist" errors.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 * @param userId
 */
export async function getUserDashboard(
  userId: string
): Promise<Database['public']['Functions']['get_user_dashboard']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-dashboard-${userId}`);
  // Also tag with complete data cache to share cache entry
  cacheTag(`user-complete-data-${userId}`);

  const reqLogger = logger.child({
    operation: 'getUserDashboard',
    module: 'data/account',
  });

  try {
    // Use consolidated function internally - single optimized database call
    const completeData = await getUserCompleteData(userId);

    if (!completeData?.user_dashboard) {
      reqLogger.warn('getUserDashboard: user_dashboard missing from complete data', {
        userId,
        hasCompleteData: Boolean(completeData),
      });
      return null;
    }

    reqLogger.info('getUserDashboard: fetched successfully', {
      userId,
      hasResult: Boolean(completeData.user_dashboard),
    });

    return completeData.user_dashboard;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
): Promise<Database['public']['CompositeTypes']['user_complete_data_result'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-complete-data-${userId}`);

  const reqLogger = logger.child({
    operation: 'getUserCompleteData',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();

    // Verify session is valid before making RPC call
    // This ensures PostgREST receives a valid auth token
    // Use getAuthenticatedUserFromClient instead of direct auth.getUser() for proper error handling
    const authResult = await getAuthenticatedUserFromClient(client, {
      context: 'getUserCompleteData',
      requireUser: true,
    });

    if (!authResult.isAuthenticated || !authResult.user) {
      reqLogger.warn('getUserCompleteData: authentication failed', {
        userId,
        isAuthenticated: authResult.isAuthenticated,
        hasUser: Boolean(authResult.user),
        error: authResult.error?.message,
      });
      return null;
    }

    // Verify the authenticated user matches the requested userId (security check)
    if (authResult.user.id !== userId) {
      reqLogger.warn('getUserCompleteData: userId mismatch', {
        requestedUserId: userId,
        authenticatedUserId: authResult.user.id,
      });
      return null;
    }

    // Get the session after getUser() to ensure we have the latest token
    const {
      data: { session },
      error: sessionError,
    } = await client.auth.getSession();

    if (sessionError || !session) {
      reqLogger.warn('getUserCompleteData: no valid session after getUser', {
        userId,
        sessionError: sessionError?.message,
        hasSession: Boolean(session),
      });
      return null;
    }

    // Verify the authenticated user matches the requested userId (security check)
    if (session.user.id !== userId) {
      reqLogger.warn('getUserCompleteData: userId mismatch', {
        requestedUserId: userId,
        authenticatedUserId: session.user.id,
      });
      return null;
    }

    // Use AccountService for proper architectural flow through data layer
    const service = new AccountService(client);

    // Build RPC parameters - only include p_activity_type if it's provided (not null/undefined)
    const rpcParams: Database['public']['Functions']['get_user_complete_data']['Args'] = {
      p_user_id: userId,
      p_activity_limit: options?.activityLimit ?? 20,
      p_activity_offset: options?.activityOffset ?? 0,
      ...(options?.activityType && { p_activity_type: options.activityType }),
    };

    const result = await service.getUserCompleteData(rpcParams);

    reqLogger.info('getUserCompleteData: fetched successfully', {
      userId,
      hasResult: Boolean(result),
    });

    return result;
  } catch (error) {
    // Normalize error properly - handle both Error instances and Supabase error objects
    const normalizedError = normalizeError(error, 'getUserCompleteData: unexpected error occurred');
    reqLogger.error('getUserCompleteData: unexpected error', normalizedError, {
      userId,
      options,
      // Include original error details if available
      originalError:
        error && typeof error === 'object' && 'code' in error
          ? {
              code: (error as { code?: string }).code,
              message: (error as { message?: string }).message,
              details: (error as { details?: string }).details,
              hint: (error as { hint?: string }).hint,
            }
          : undefined,
    });
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
export async function getCollectionDetail(
  userId: string,
  slug: string
): Promise<Database['public']['Functions']['get_collection_detail_with_items']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-collection-${userId}-${slug}`);

  const reqLogger = logger.child({
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
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * NOTE: This function now uses the consolidated getUserCompleteData internally
 * for better performance and to avoid "role 'user' does not exist" errors.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 */
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
 * @param userId
 */
export async function getUserSettings(
  userId: string
): Promise<Database['public']['Functions']['get_user_settings']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-settings-${userId}`);
  // Also tag with complete data cache to share cache entry
  cacheTag(`user-complete-data-${userId}`);

  const reqLogger = logger.child({
    operation: 'getUserSettings',
    module: 'data/account',
  });

  try {
    // Use consolidated function internally - single optimized database call
    const completeData = await getUserCompleteData(userId);

    if (!completeData?.user_settings) {
      reqLogger.warn('getUserSettings: user_settings missing from complete data', {
        userId,
        hasCompleteData: Boolean(completeData),
      });
      return null;
    }

    reqLogger.info('getUserSettings: fetched successfully', {
      userId,
      hasResult: Boolean(completeData.user_settings),
    });

    return completeData.user_settings;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * @param userId
 * @param sponsorshipId
 */
export async function getSponsorshipAnalytics(
  userId: string,
  sponsorshipId: string
): Promise<Database['public']['Functions']['get_sponsorship_analytics']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-sponsorship-analytics-${userId}-${sponsorshipId}`);

  const reqLogger = logger.child({
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
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * NOTE: This function now uses the consolidated getUserCompleteData internally
 * and extracts companies from user_dashboard.companies (JSONB).
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 * @param userId
 */
export async function getUserCompanies(
  userId: string
): Promise<Database['public']['Functions']['get_user_companies']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-companies-${userId}`);
  // Also tag with complete data cache to share cache entry
  cacheTag(`user-complete-data-${userId}`);

  const reqLogger = logger.child({
    operation: 'getUserCompanies',
    module: 'data/account',
  });

  try {
    // Use consolidated function internally - single optimized database call
    const completeData = await getUserCompleteData(userId);

    if (!completeData?.user_dashboard?.companies) {
      reqLogger.warn('getUserCompanies: companies missing from complete data', {
        userId,
        hasCompleteData: completeData != null,
        hasUserDashboard: completeData?.user_dashboard != null,
      });
      return { companies: [] };
    }

    // Extract companies from JSONB and convert to expected structure
    // user_dashboard.companies is JSONB array, we need to convert to user_companies_company[]
    const companiesJson = completeData.user_dashboard.companies;
    const companiesArray = Array.isArray(companiesJson) ? companiesJson : [];

    reqLogger.info('getUserCompanies: fetched successfully', {
      userId,
      hasResult: Boolean(completeData.user_dashboard.companies),
      count: companiesArray.length,
    });

    return {
      companies: companiesArray as Database['public']['CompositeTypes']['user_companies_company'][],
    };
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error('getUserCompanies: unexpected error', errorForLogging, {
      userId,
    });
    return { companies: [] };
  }
}

/**
 * Get user sponsorships
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
export async function getUserSponsorships(
  userId: string
): Promise<Database['public']['Functions']['get_user_sponsorships']['Returns']> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-sponsorships-${userId}`);
  // Also tag with complete data cache to share cache entry
  cacheTag(`user-complete-data-${userId}`);

  const reqLogger = logger.child({
    operation: 'getUserSponsorships',
    module: 'data/account',
  });

  try {
    // Use consolidated function internally - single optimized database call
    const completeData = await getUserCompleteData(userId);

    if (!completeData?.sponsorships) {
      reqLogger.warn('getUserSponsorships: sponsorships missing from complete data', {
        userId,
        hasCompleteData: Boolean(completeData),
      });
      return [];
    }

    reqLogger.info('getUserSponsorships: fetched successfully', {
      userId,
      hasResult: Boolean(completeData.sponsorships),
      count: completeData.sponsorships.length,
    });

    return completeData.sponsorships;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * @param recentLimit
 * @param contributorsLimit
 */
export async function getSubmissionDashboard(
  recentLimit = 5,
  contributorsLimit = 5
): Promise<Database['public']['Functions']['get_submission_dashboard']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`submission-dashboard-${recentLimit}-${contributorsLimit}`);

  const reqLogger = logger.child({
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
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * NOTE: This function now uses the consolidated getUserCompleteData internally
 * for better performance and to avoid "role 'user' does not exist" errors.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 * @param userId
 */
export async function getUserActivitySummary(
  userId: string
): Promise<Database['public']['Functions']['get_user_activity_summary']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-activity-summary-${userId}`);
  // Also tag with complete data cache to share cache entry
  cacheTag(`user-complete-data-${userId}`);

  const reqLogger = logger.child({
    operation: 'getUserActivitySummary',
    module: 'data/account',
  });

  try {
    // Use consolidated function internally - single optimized database call
    const completeData = await getUserCompleteData(userId);

    if (!completeData?.activity_summary) {
      reqLogger.warn('getUserActivitySummary: activity_summary missing from complete data', {
        userId,
        hasCompleteData: Boolean(completeData),
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

    reqLogger.info('getUserActivitySummary: fetched successfully', {
      userId,
      hasResult: Boolean(completeData.activity_summary),
    });

    return completeData.activity_summary;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * NOTE: This function now uses the consolidated getUserCompleteData internally
 * for better performance and to avoid "role 'user' does not exist" errors.
 * However, if custom pagination parameters are provided, it will make a separate
 * call to get the correctly paginated timeline.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId, type, limit, offset in cache tag)
 * - Not prerendered (runs at request time)
 * @param input
 * @param input.limit
 * @param input.offset
 * @param input.type
 * @param input.userId
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
  // Also tag with complete data cache to share cache entry (if using default params)
  if (limit === 20 && offset === 0 && !type) {
    cacheTag(`user-complete-data-${userId}`);
  }

  const reqLogger = logger.child({
    operation: 'getUserActivityTimeline',
    module: 'data/account',
  });

  try {
    // Always use consolidated function - it supports custom pagination via options
    const completeData = await getUserCompleteData(userId, {
      activityLimit: limit,
      activityOffset: offset,
      activityType: type ?? null,
    });

    if (!completeData?.activity_timeline) {
      reqLogger.warn('getUserActivityTimeline: activity_timeline missing from complete data', {
        userId,
        hasCompleteData: Boolean(completeData),
      });
      return {
        activities: [],
        has_more: false,
        total: 0,
      };
    }

    reqLogger.info('getUserActivityTimeline: fetched successfully from complete data', {
      userId,
      type: type ?? 'all',
      limit,
      offset,
      hasResult: Boolean(completeData.activity_timeline),
    });

    return completeData.activity_timeline;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * NOTE: This function now uses the consolidated getUserCompleteData internally
 * for better performance and to avoid "role 'user' does not exist" errors.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId in cache tag)
 * - Not prerendered (runs at request time)
 * @param userId
 */
export async function getUserIdentitiesData(
  userId: string
): Promise<Database['public']['Functions']['get_user_identities']['Returns'] | null> {
  'use cache: private';
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-identities-${userId}`);
  // Also tag with complete data cache to share cache entry
  cacheTag(`user-complete-data-${userId}`);

  const reqLogger = logger.child({
    operation: 'getUserIdentitiesData',
    module: 'data/account',
  });

  try {
    // Use consolidated function internally - single optimized database call
    const completeData = await getUserCompleteData(userId);

    if (!completeData?.user_identities) {
      reqLogger.warn('getUserIdentitiesData: user_identities missing from complete data', {
        userId,
        hasCompleteData: Boolean(completeData),
      });
      return { identities: [] };
    }

    reqLogger.info('getUserIdentitiesData: fetched successfully', {
      userId,
      hasResult: Boolean(completeData.user_identities),
    });

    return completeData.user_identities;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * @param input
 * @param input.content_slug
 * @param input.content_type
 * @param input.userId
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

  const reqLogger = logger.child({
    operation: 'isBookmarked',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);
    return await service.isBookmarked({
      p_user_id: userId,
      p_content_type: content_type,
      p_content_slug: content_slug,
    });
  } catch (error) {
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * @param input
 * @param input.followerId
 * @param input.followingId
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

  const reqLogger = logger.child({
    operation: 'isFollowing',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);
    return await service.isFollowing({
      follower_id: followerId,
      following_id: followingId,
    });
  } catch (error) {
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * @param input
 * @param input.items
 * @param input.userId
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
    .toSorted()
    .join(',');
  cacheTag(`bookmark-batch-${itemKey}`);

  const reqLogger = logger.child({
    operation: 'isBookmarkedBatch',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);
    return await service.isBookmarkedBatch({
      p_user_id: userId,
      p_items: items,
    });
  } catch (error) {
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
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
 * @param input
 * @param input.followedUserIds
 * @param input.followerId
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
  const userIdsKey = [...followedUserIds].toSorted().join(',');
  cacheTag(`follow-batch-${userIdsKey}`);

  const reqLogger = logger.child({
    operation: 'isFollowingBatch',
    module: 'data/account',
  });

  try {
    const client = await createSupabaseServerClient();
    const service = new AccountService(client);
    return await service.isFollowingBatch({
      p_follower_id: followerId,
      p_followed_user_ids: followedUserIds,
    });
  } catch (error) {
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error('isFollowingBatch: unexpected error', errorForLogging, {
      followerId,
      followedUserCount: followedUserIds.length,
    });
    return [];
  }
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
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  cacheTag(`user-dashboard-bundle-${userId}`);
  if (categoryIds) {
    cacheTag(`dashboard-bundle-categories-${categoryIds.join(',')}`);
  }

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
