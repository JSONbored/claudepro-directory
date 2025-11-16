/**
 * User Data Layer - Authenticated RPC calls with user-scoped edge caching
 * Centralized location for all user-specific data fetching
 */

import { z } from 'zod';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Tables } from '@/src/types/database.types';
import type {
  GetGetAccountDashboardReturn,
  GetGetCollectionDetailWithItemsReturn,
  GetGetSponsorshipAnalyticsReturn,
  GetGetUserCompaniesReturn,
  GetGetUserDashboardReturn,
  GetGetUserLibraryReturn,
  GetGetUserSettingsReturn,
  GetGetUserSponsorshipsReturn,
  UserTier,
} from '@/src/types/database-overrides';
import { USER_TIER_VALUES } from '@/src/types/database-overrides';

const ACCOUNT_TTL_KEY = 'cache.account.ttl_seconds';

const accountDashboardSchema = z.object({
  bookmark_count: z.number().catch(0),
  profile: z.object({
    name: z.string().nullable().catch(null),
    tier: z
      .enum([...USER_TIER_VALUES] as [UserTier, ...UserTier[]])
      .nullable()
      .catch(null),
    created_at: z.string(),
  }),
});

/**
 * Get user account dashboard data (bookmarks, profile, tier)
 */
export async function getAccountDashboard(
  userId: string
): Promise<GetGetAccountDashboardReturn | null> {
  const result = await fetchCachedRpc<'get_account_dashboard', GetGetAccountDashboardReturn | null>(
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

  if (!result) return null;
  return accountDashboardSchema.parse(result);
}

/**
 * Get user library (bookmarks + collections)
 */
export async function getUserLibrary(userId: string): Promise<GetGetUserLibraryReturn | null> {
  return fetchCachedRpc<'get_user_library', GetGetUserLibraryReturn | null>(
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
  const data = await getUserLibrary(userId);
  return data?.bookmarks ?? [];
}

/**
 * Get user dashboard data (includes jobs)
 */
export async function getUserDashboard(userId: string): Promise<GetGetUserDashboardReturn | null> {
  return fetchCachedRpc<'get_user_dashboard', GetGetUserDashboardReturn | null>(
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
  const data = await getUserDashboard(userId);
  return data?.jobs?.find((job) => job.id === jobId) ?? null;
}

/**
 * Get collection detail with items and bookmarks
 */
export async function getCollectionDetail(
  userId: string,
  slug: string
): Promise<GetGetCollectionDetailWithItemsReturn | null> {
  return fetchCachedRpc<
    'get_collection_detail_with_items',
    GetGetCollectionDetailWithItemsReturn | null
  >(
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
export async function getUserSettings(userId: string): Promise<GetGetUserSettingsReturn | null> {
  return fetchCachedRpc<'get_user_settings', GetGetUserSettingsReturn | null>(
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
export type SponsorshipAnalytics = GetGetSponsorshipAnalyticsReturn;

export async function getSponsorshipAnalytics(
  userId: string,
  sponsorshipId: string
): Promise<GetGetSponsorshipAnalyticsReturn | null> {
  return fetchCachedRpc<'get_sponsorship_analytics', GetGetSponsorshipAnalyticsReturn | null>(
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
export async function getUserCompanies(userId: string): Promise<GetGetUserCompaniesReturn | null> {
  return fetchCachedRpc<'get_user_companies', GetGetUserCompaniesReturn | null>(
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
export async function getUserSponsorships(userId: string): Promise<GetGetUserSponsorshipsReturn> {
  const data = await fetchCachedRpc<'get_user_sponsorships', GetGetUserSponsorshipsReturn | null>(
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
  const data = await getUserCompanies(userId);
  const company = data?.companies?.find((company) => company.id === companyId);
  if (!company) return null;

  // Map simplified RPC return to full Tables<'companies'> structure
  return {
    ...company,
    json_ld: null,
    owner_id: userId,
  } as Tables<'companies'>;
}
