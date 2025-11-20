/**
 * User Data Layer - Authenticated RPC calls with user-scoped edge caching
 * Centralized location for all user-specific data fetching
 */

import { z } from 'zod';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import type { Database, Tables } from '@/src/types/database.types';
import { USER_TIER_VALUES } from '@/src/types/database-overrides';

const ACCOUNT_TTL_KEY = 'cache.account.ttl_seconds';

const accountDashboardSchema = z.object({
  bookmark_count: z.number().catch(0),
  profile: z.object({
    name: z.string().nullable().catch(null),
    tier: z
      .enum([...USER_TIER_VALUES] as [
        Database['public']['Enums']['user_tier'],
        ...Database['public']['Enums']['user_tier'][],
      ])
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
): Promise<Database['public']['Functions']['get_account_dashboard']['Returns'] | null> {
  const result = await fetchCachedRpc<
    'get_account_dashboard',
    Database['public']['Functions']['get_account_dashboard']['Returns'] | null
  >(
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
  // Validate with Zod schema to ensure type safety
  return accountDashboardSchema.parse(result);
}

/**
 * Get user library (bookmarks + collections)
 */
export async function getUserLibrary(
  userId: string
): Promise<Database['public']['Functions']['get_user_library']['Returns'] | null> {
  return fetchCachedRpc<
    'get_user_library',
    Database['public']['Functions']['get_user_library']['Returns'] | null
  >(
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
  // Map from composite type to table type, filtering out nulls
  const bookmarks = data?.bookmarks ?? [];
  return bookmarks
    .filter(
      (
        b
      ): b is typeof b & {
        id: string;
        user_id: string;
        content_type: string;
        content_slug: string;
        created_at: string;
        updated_at: string;
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
    })) as Tables<'bookmarks'>[];
}

/**
 * Get user dashboard data (includes jobs)
 */
export async function getUserDashboard(
  userId: string
): Promise<Database['public']['Functions']['get_user_dashboard']['Returns'] | null> {
  return fetchCachedRpc<
    'get_user_dashboard',
    Database['public']['Functions']['get_user_dashboard']['Returns'] | null
  >(
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
  const jobs = (data?.jobs as Array<Tables<'jobs'>> | undefined) || [];
  return jobs.find((job) => job.id === jobId) ?? null;
}

/**
 * Get collection detail with items and bookmarks
 */
export async function getCollectionDetail(
  userId: string,
  slug: string
): Promise<Database['public']['Functions']['get_collection_detail_with_items']['Returns'] | null> {
  return fetchCachedRpc<
    'get_collection_detail_with_items',
    Database['public']['Functions']['get_collection_detail_with_items']['Returns'] | null
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
export async function getUserSettings(
  userId: string
): Promise<Database['public']['Functions']['get_user_settings']['Returns'] | null> {
  return fetchCachedRpc<
    'get_user_settings',
    Database['public']['Functions']['get_user_settings']['Returns'] | null
  >(
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
export async function getSponsorshipAnalytics(
  userId: string,
  sponsorshipId: string
): Promise<Database['public']['Functions']['get_sponsorship_analytics']['Returns'] | null> {
  return fetchCachedRpc<
    'get_sponsorship_analytics',
    Database['public']['Functions']['get_sponsorship_analytics']['Returns'] | null
  >(
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
export async function getUserCompanies(
  userId: string
): Promise<Database['public']['Functions']['get_user_companies']['Returns'] | null> {
  return fetchCachedRpc<
    'get_user_companies',
    Database['public']['Functions']['get_user_companies']['Returns'] | null
  >(
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
export async function getUserSponsorships(
  userId: string
): Promise<Database['public']['Functions']['get_user_sponsorships']['Returns']> {
  const data = await fetchCachedRpc<
    'get_user_sponsorships',
    Database['public']['Functions']['get_user_sponsorships']['Returns']
  >(
    { p_user_id: userId },
    {
      rpcName: 'get_user_sponsorships',
      tags: ['users', `user-${userId}`, 'sponsorships'],
      ttlKey: ACCOUNT_TTL_KEY,
      keySuffix: `sponsorships-${userId}`,
      useAuthClient: true,
      fallback: [],
      logMeta: { userId },
    }
  );
  return data;
}

/**
 * Convenience helper for owned company lookups by ID
 */
export async function getUserCompanyById(
  userId: string,
  companyId: string
): Promise<Database['public']['CompositeTypes']['user_companies_company'] | null> {
  const data = await getUserCompanies(userId);
  const company = data?.companies?.find(
    (company): company is NonNullable<typeof company> =>
      company !== null && company.id === companyId
  );
  return company ?? null;
}
