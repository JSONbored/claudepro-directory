/**
 * User Data Layer - Authenticated RPC calls with user-scoped edge caching
 * Centralized location for all user-specific data fetching
 */

import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import type { Tables } from '@/src/types/database.types';

/**
 * Get user account dashboard data (bookmarks, profile, tier)
 */
export async function getAccountDashboard(userId: string) {
  try {
    const data = await cachedRPCWithDedupe(
      'get_account_dashboard',
      { p_user_id: userId },
      {
        tags: ['users', `user-${userId}`],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `dashboard-${userId}`,
        useAuthClient: true,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      'Error in getAccountDashboard',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return null;
  }
}

/**
 * Get user library (bookmarks + collections)
 */
export async function getUserLibrary(userId: string) {
  try {
    const data = await cachedRPCWithDedupe(
      'get_user_library',
      { p_user_id: userId },
      {
        tags: ['users', `user-${userId}`, 'user-bookmarks'],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `library-${userId}`,
        useAuthClient: true,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      'Error in getUserLibrary',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return null;
  }
}

/**
 * Convenience helper for collection workflows
 */
export async function getUserBookmarksForCollections(
  userId: string
): Promise<Tables<'bookmarks'>[]> {
  const data = (await getUserLibrary(userId)) as
    | { bookmarks?: Tables<'bookmarks'>[] }
    | null
    | undefined;
  return data?.bookmarks || [];
}

/**
 * Get user dashboard data (includes jobs)
 */
export async function getUserDashboard(userId: string) {
  try {
    const data = await cachedRPCWithDedupe(
      'get_user_dashboard',
      { p_user_id: userId },
      {
        tags: ['users', `user-${userId}`, 'jobs'],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `jobs-${userId}`,
        useAuthClient: true,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      'Error in getUserDashboard',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return null;
  }
}

/**
 * Convenience helper for owned job lookups by ID
 */
export async function getUserJobById(
  userId: string,
  jobId: string
): Promise<Tables<'jobs'> | null> {
  const data = (await getUserDashboard(userId)) as { jobs?: Tables<'jobs'>[] } | null | undefined;
  return data?.jobs?.find((job) => job.id === jobId) ?? null;
}

/**
 * Get collection detail with items and bookmarks
 */
export async function getCollectionDetail(userId: string, slug: string) {
  try {
    const data = await cachedRPCWithDedupe(
      'get_collection_detail_with_items',
      { p_user_id: userId, p_slug: slug },
      {
        tags: ['users', `user-${userId}`, 'collections', `collection-${slug}`],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `collection-${userId}-${slug}`,
        useAuthClient: true,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      'Error in getCollectionDetail',
      error instanceof Error ? error : new Error(String(error)),
      { userId, slug }
    );
    return null;
  }
}

/**
 * Get user settings (profile + user data)
 */
export async function getUserSettings(userId: string) {
  try {
    const data = await cachedRPCWithDedupe(
      'get_user_settings',
      { p_user_id: userId },
      {
        tags: ['users', `user-${userId}`, 'settings'],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `settings-${userId}`,
        useAuthClient: true,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      'Error in getUserSettings',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return null;
  }
}

/**
 * Get sponsorship analytics
 */
export async function getSponsorshipAnalytics(userId: string, sponsorshipId: string) {
  try {
    const data = await cachedRPCWithDedupe(
      'get_sponsorship_analytics',
      { p_user_id: userId, p_sponsorship_id: sponsorshipId },
      {
        tags: ['users', `user-${userId}`, 'sponsorships', `sponsorship-${sponsorshipId}`],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `sponsorship-${userId}-${sponsorshipId}`,
        useAuthClient: true,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      'Error in getSponsorshipAnalytics',
      error instanceof Error ? error : new Error(String(error)),
      { userId, sponsorshipId }
    );
    return null;
  }
}

/**
 * Get user companies
 */
export async function getUserCompanies(userId: string) {
  try {
    const data = await cachedRPCWithDedupe(
      'get_user_companies',
      { p_user_id: userId },
      {
        tags: ['users', `user-${userId}`, 'companies'],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `companies-${userId}`,
        useAuthClient: true,
      }
    );
    return data;
  } catch (error) {
    logger.error(
      'Error in getUserCompanies',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return null;
  }
}

/**
 * Get user sponsorships
 */
export async function getUserSponsorships(userId: string): Promise<Tables<'sponsored_content'>[]> {
  try {
    const data = await cachedRPCWithDedupe<Array<Tables<'sponsored_content'>>>(
      'get_user_sponsorships',
      { p_user_id: userId },
      {
        tags: ['users', `user-${userId}`, 'sponsorships'],
        ttlConfigKey: 'cache.account.ttl_seconds',
        keySuffix: `sponsorships-${userId}`,
        useAuthClient: true,
      }
    );
    return data || [];
  } catch (error) {
    logger.error(
      'Error in getUserSponsorships',
      error instanceof Error ? error : new Error(String(error)),
      { userId }
    );
    return [];
  }
}

/**
 * Convenience helper for owned company lookups by ID
 */
export async function getUserCompanyById(
  userId: string,
  companyId: string
): Promise<Tables<'companies'> | null> {
  const data = (await getUserCompanies(userId)) as
    | { companies?: Tables<'companies'>[] }
    | null
    | undefined;
  return data?.companies?.find((company) => company.id === companyId) ?? null;
}
