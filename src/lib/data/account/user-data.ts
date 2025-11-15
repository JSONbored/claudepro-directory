/**
 * User Data Layer - Authenticated RPC calls with user-scoped edge caching
 * Centralized location for all user-specific data fetching
 */

import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Tables } from '@/src/types/database.types';

const ACCOUNT_TTL_KEY = 'cache.account.ttl_seconds';

/**
 * Get user account dashboard data (bookmarks, profile, tier)
 */
export async function getAccountDashboard(userId: string) {
  return fetchCachedRpc<unknown | null>(
    { p_user_id: userId },
    {
      rpcName: 'get_account_dashboard',
      tags: ['users', `user-${userId}`],
      ttlKey: ACCOUNT_TTL_KEY,
      keySuffix: `dashboard-${userId}`,
      useAuthClient: true,
      fallback: null,
      logMeta: { userId },
    }
  );
}

/**
 * Get user library (bookmarks + collections)
 */
export async function getUserLibrary(userId: string) {
  return fetchCachedRpc<unknown | null>(
    { p_user_id: userId },
    {
      rpcName: 'get_user_library',
      tags: ['users', `user-${userId}`, 'user-bookmarks'],
      ttlKey: ACCOUNT_TTL_KEY,
      keySuffix: `library-${userId}`,
      useAuthClient: true,
      fallback: null,
      logMeta: { userId },
    }
  );
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
  return fetchCachedRpc<unknown | null>(
    { p_user_id: userId },
    {
      rpcName: 'get_user_dashboard',
      tags: ['users', `user-${userId}`, 'jobs'],
      ttlKey: ACCOUNT_TTL_KEY,
      keySuffix: `jobs-${userId}`,
      useAuthClient: true,
      fallback: null,
      logMeta: { userId },
    }
  );
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
  return fetchCachedRpc<unknown | null>(
    { p_user_id: userId, p_slug: slug },
    {
      rpcName: 'get_collection_detail_with_items',
      tags: ['users', `user-${userId}`, 'collections', `collection-${slug}`],
      ttlKey: ACCOUNT_TTL_KEY,
      keySuffix: `collection-${userId}-${slug}`,
      useAuthClient: true,
      fallback: null,
      logMeta: { userId, slug },
    }
  );
}

/**
 * Get user settings (profile + user data)
 */
export async function getUserSettings(userId: string) {
  return fetchCachedRpc<unknown | null>(
    { p_user_id: userId },
    {
      rpcName: 'get_user_settings',
      tags: ['users', `user-${userId}`, 'settings'],
      ttlKey: ACCOUNT_TTL_KEY,
      keySuffix: `settings-${userId}`,
      useAuthClient: true,
      fallback: null,
      logMeta: { userId },
    }
  );
}

/**
 * Get sponsorship analytics
 */
export async function getSponsorshipAnalytics(userId: string, sponsorshipId: string) {
  return fetchCachedRpc<unknown | null>(
    { p_user_id: userId, p_sponsorship_id: sponsorshipId },
    {
      rpcName: 'get_sponsorship_analytics',
      tags: ['users', `user-${userId}`, 'sponsorships', `sponsorship-${sponsorshipId}`],
      ttlKey: ACCOUNT_TTL_KEY,
      keySuffix: `sponsorship-${userId}-${sponsorshipId}`,
      useAuthClient: true,
      fallback: null,
      logMeta: { userId, sponsorshipId },
    }
  );
}

/**
 * Get user companies
 */
export async function getUserCompanies(userId: string) {
  return fetchCachedRpc<unknown | null>(
    { p_user_id: userId },
    {
      rpcName: 'get_user_companies',
      tags: ['users', `user-${userId}`, 'companies'],
      ttlKey: ACCOUNT_TTL_KEY,
      keySuffix: `companies-${userId}`,
      useAuthClient: true,
      fallback: null,
      logMeta: { userId },
    }
  );
}

/**
 * Get user sponsorships
 */
export async function getUserSponsorships(userId: string): Promise<Tables<'sponsored_content'>[]> {
  const data = await fetchCachedRpc<Array<Tables<'sponsored_content'>> | null>(
    { p_user_id: userId },
    {
      rpcName: 'get_user_sponsorships',
      tags: ['users', `user-${userId}`, 'sponsorships'],
      ttlKey: ACCOUNT_TTL_KEY,
      keySuffix: `sponsorships-${userId}`,
      useAuthClient: true,
      fallback: null,
      logMeta: { userId },
    }
  );
  return data ?? [];
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
