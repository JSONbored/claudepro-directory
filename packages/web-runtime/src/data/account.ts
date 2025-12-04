'use server';

import { AccountService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { cache } from 'react';
import { z } from 'zod';

import { logger, normalizeError } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';
import { generateRequestId } from '../utils/request-id.ts';

// Removed ACCOUNT_TTL_KEY - no longer used since we use React.cache() instead of fetchCached

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
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because:
 * 1. Account data is user-specific and requires cookies() for auth
 * 2. cookies() cannot be called inside unstable_cache() (Next.js restriction)
 * 3. User-specific data should not be cached across requests anyway
 *
 * React.cache() provides request-level deduplication within the same React Server Component tree,
 * which is safe and appropriate for user-specific data.
 */
export const getAccountDashboard = cache(
  async (
    userId: string
  ): Promise<Database['public']['Functions']['get_account_dashboard']['Returns'] | null> => {
    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'getAccountDashboard',
      module: 'data/account',
    });

    try {
      // Create authenticated client OUTSIDE of any cache scope
      const client = await createSupabaseServerClient();
      const service = new AccountService(client);

      const result = await service.getAccountDashboard({ p_user_id: userId });

      reqLogger.info('getAccountDashboard: fetched successfully', {
        userId,
        hasResult: Boolean(result),
      });

      return accountDashboardSchema.parse(result);
    } catch (error) {
      const normalized = normalizeError(error, 'getAccountDashboard failed');
      reqLogger.error('getAccountDashboard: unexpected error', normalized, {
        userId,
      });
      return null;
    }
  }
);

/**
 * Get user library (bookmarks)
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getUserLibrary = cache(
  async (
    userId: string
  ): Promise<Database['public']['Functions']['get_user_library']['Returns'] | null> => {
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
      const normalized = normalizeError(error, 'getUserLibrary failed');
      reqLogger.error('getUserLibrary: unexpected error', normalized, {
        userId,
      });
      return null;
    }
  }
);

export async function getUserBookmarksForCollections(
  userId: string
): Promise<Database['public']['Tables']['bookmarks']['Row'][]> {
  const data = await getUserLibrary(userId);
  const bookmarks = data?.bookmarks ?? [];
  return bookmarks
    .filter(
      (
        b
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
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getUserDashboard = cache(
  async (
    userId: string
  ): Promise<Database['public']['Functions']['get_user_dashboard']['Returns'] | null> => {
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
      const normalized = normalizeError(error, 'getUserDashboard failed');
      reqLogger.error('getUserDashboard: unexpected error', normalized, {
        userId,
      });
      return null;
    }
  }
);

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
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getCollectionDetail = cache(
  async (
    userId: string,
    slug: string
  ): Promise<
    Database['public']['Functions']['get_collection_detail_with_items']['Returns'] | null
  > => {
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
      const normalized = normalizeError(error, 'getCollectionDetail failed');
      reqLogger.error('getCollectionDetail: unexpected error', normalized, {
        userId,
        slug,
      });
      return null;
    }
  }
);

/**
 * Get user settings
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getUserSettings = cache(
  async (
    userId: string
  ): Promise<Database['public']['Functions']['get_user_settings']['Returns'] | null> => {
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
      const normalized = normalizeError(error, 'getUserSettings failed');
      reqLogger.error('getUserSettings: unexpected error', normalized, {
        userId,
      });
      return null;
    }
  }
);

/**
 * Get sponsorship analytics
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getSponsorshipAnalytics = cache(
  async (
    userId: string,
    sponsorshipId: string
  ): Promise<Database['public']['Functions']['get_sponsorship_analytics']['Returns'] | null> => {
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
      const normalized = normalizeError(error, 'getSponsorshipAnalytics failed');
      reqLogger.error('getSponsorshipAnalytics: unexpected error', normalized, {
        userId,
        sponsorshipId,
      });
      return null;
    }
  }
);

/**
 * Get user companies
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getUserCompanies = cache(
  async (
    userId: string
  ): Promise<Database['public']['Functions']['get_user_companies']['Returns'] | null> => {
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
      const normalized = normalizeError(error, 'getUserCompanies failed');
      reqLogger.error('getUserCompanies: unexpected error', normalized, {
        userId,
      });
      return null;
    }
  }
);

/**
 * Get user sponsorships
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getUserSponsorships = cache(
  async (
    userId: string
  ): Promise<Database['public']['Functions']['get_user_sponsorships']['Returns']> => {
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
      const normalized = normalizeError(error, 'getUserSponsorships failed');
      reqLogger.error('getUserSponsorships: unexpected error', normalized, {
        userId,
      });
      return [];
    }
  }
);

export async function getUserCompanyById(
  userId: string,
  companyId: string
): Promise<Database['public']['CompositeTypes']['user_companies_company'] | null> {
  const data = await getUserCompanies(userId);
  const company = data?.companies?.find((c) => c.id === companyId);
  return company ?? null;
}

/**
 * Get submission dashboard
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getSubmissionDashboard = cache(
  async (
    recentLimit = 5,
    contributorsLimit = 5
  ): Promise<Database['public']['Functions']['get_submission_dashboard']['Returns'] | null> => {
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
      const normalized = normalizeError(error, 'getSubmissionDashboard failed');
      reqLogger.error('getSubmissionDashboard: unexpected error', normalized, {
        recentLimit,
        contributorsLimit,
      });
      return null;
    }
  }
);

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
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getUserActivitySummary = cache(
  async (
    userId: string
  ): Promise<Database['public']['Functions']['get_user_activity_summary']['Returns'] | null> => {
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
      const normalized = normalizeError(error, 'getUserActivitySummary failed');
      reqLogger.error('getUserActivitySummary: unexpected error', normalized, {
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
);

/**
 * Get user activity timeline
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getUserActivityTimeline = cache(
  async (input: {
    limit?: number | undefined;
    offset?: number | undefined;
    type?: string | undefined;
    userId: string;
  }): Promise<Database['public']['Functions']['get_user_activity_timeline']['Returns'] | null> => {
    const { userId, type, limit = 20, offset = 0 } = input;
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
      const normalized = normalizeError(error, 'getUserActivityTimeline failed');
      reqLogger.error('getUserActivityTimeline: unexpected error', normalized, {
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
);

/**
 * Get user identities
 *
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because user-specific data requires auth.
 */
export const getUserIdentitiesData = cache(
  async (
    userId: string
  ): Promise<Database['public']['Functions']['get_user_identities']['Returns'] | null> => {
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
      const normalized = normalizeError(error, 'getUserIdentitiesData failed');
      reqLogger.error('getUserIdentitiesData: unexpected error', normalized, {
        userId,
      });
      return { identities: [] };
    }
  }
);

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
