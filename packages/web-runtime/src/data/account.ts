'use server';

import type { Database } from '@heyclaude/database-types';
import { Constants } from '@heyclaude/database-types';
import { z } from 'zod';
import { fetchCached } from '../cache/fetch-cached.ts';
import { AccountService } from '@heyclaude/data-layer';

const ACCOUNT_TTL_KEY = 'cache.account.ttl_seconds';

const USER_TIER_VALUES = Constants.public.Enums.user_tier;

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

export async function getAccountDashboard(
  userId: string
): Promise<Database['public']['Functions']['get_account_dashboard']['Returns'] | null> {
  const result = await fetchCached(
    (client) => new AccountService(client).getAccountDashboard({ p_user_id: userId }),
    {
      key: `dashboard-${userId}`,
      tags: ['users', `user-${userId}`],
      ttlKey: ACCOUNT_TTL_KEY,
      useAuth: true,
      fallback: null,
      logMeta: { userId },
    }
  );

  if (!result) return null;
  return accountDashboardSchema.parse(result);
}

export async function getUserLibrary(
  userId: string
): Promise<Database['public']['Functions']['get_user_library']['Returns'] | null> {
  return fetchCached(
    (client) => new AccountService(client).getUserLibrary({ p_user_id: userId }),
    {
      key: `library-${userId}`,
      tags: ['users', `user-${userId}`, 'user-bookmarks'],
      ttlKey: ACCOUNT_TTL_KEY,
      useAuth: true,
      fallback: null,
      logMeta: { userId },
    }
  );
}

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
    })) as Database['public']['Tables']['bookmarks']['Row'][];
}

export async function getUserDashboard(
  userId: string
): Promise<Database['public']['Functions']['get_user_dashboard']['Returns'] | null> {
  return fetchCached(
    (client) => new AccountService(client).getUserDashboard({ p_user_id: userId }),
    {
      key: `jobs-${userId}`,
      tags: ['users', `user-${userId}`, 'jobs'],
      ttlKey: ACCOUNT_TTL_KEY,
      useAuth: true,
      fallback: null,
      logMeta: { userId },
    }
  );
}

export async function getUserJobById(
  userId: string,
  jobId: string
): Promise<Database['public']['Tables']['jobs']['Row'] | null> {
  const data = await getUserDashboard(userId);
  const jobs = (data?.jobs as Array<Database['public']['Tables']['jobs']['Row']> | undefined) || [];
  return jobs.find((job) => job.id === jobId) ?? null;
}

export async function getCollectionDetail(
  userId: string,
  slug: string
): Promise<Database['public']['Functions']['get_collection_detail_with_items']['Returns'] | null> {
  return fetchCached(
    (client) => new AccountService(client).getCollectionDetailWithItems({ p_user_id: userId, p_slug: slug }),
    {
      key: `collection-${userId}-${slug}`,
      tags: ['users', `user-${userId}`, 'collections', `collection-${slug}`],
      ttlKey: ACCOUNT_TTL_KEY,
      useAuth: true,
      fallback: null,
      logMeta: { userId, slug },
    }
  );
}

export async function getUserSettings(
  userId: string
): Promise<Database['public']['Functions']['get_user_settings']['Returns'] | null> {
  return fetchCached(
    (client) => new AccountService(client).getUserSettings({ p_user_id: userId }),
    {
      key: `settings-${userId}`,
      tags: ['users', `user-${userId}`, 'settings'],
      ttlKey: ACCOUNT_TTL_KEY,
      useAuth: true,
      fallback: null,
      logMeta: { userId },
    }
  );
}

export async function getSponsorshipAnalytics(
  userId: string,
  sponsorshipId: string
): Promise<Database['public']['Functions']['get_sponsorship_analytics']['Returns'] | null> {
  return fetchCached(
    (client) => new AccountService(client).getSponsorshipAnalytics({ p_user_id: userId, p_sponsorship_id: sponsorshipId }),
    {
      key: `sponsorship-${userId}-${sponsorshipId}`,
      tags: ['users', `user-${userId}`, 'sponsorships', `sponsorship-${sponsorshipId}`],
      ttlKey: ACCOUNT_TTL_KEY,
      useAuth: true,
      fallback: null,
      logMeta: { userId, sponsorshipId },
    }
  );
}

export async function getUserCompanies(
  userId: string
): Promise<Database['public']['Functions']['get_user_companies']['Returns'] | null> {
  return fetchCached(
    (client) => new AccountService(client).getUserCompanies({ p_user_id: userId }),
    {
      key: `companies-${userId}`,
      tags: ['users', `user-${userId}`, 'companies'],
      ttlKey: ACCOUNT_TTL_KEY,
      useAuth: true,
      fallback: null,
      logMeta: { userId },
    }
  );
}

export async function getUserSponsorships(
  userId: string
): Promise<Database['public']['Functions']['get_user_sponsorships']['Returns']> {
  return fetchCached(
    (client) => new AccountService(client).getUserSponsorships({ p_user_id: userId }),
    {
      key: `sponsorships-${userId}`,
      tags: ['users', `user-${userId}`, 'sponsorships'],
      ttlKey: ACCOUNT_TTL_KEY,
      useAuth: true,
      fallback: [],
      logMeta: { userId },
    }
  );
}

export async function getUserCompanyById(
  userId: string,
  companyId: string
): Promise<Database['public']['CompositeTypes']['user_companies_company'] | null> {
  const data = await getUserCompanies(userId);
  const company = data?.companies?.find(
    (c): c is NonNullable<typeof c> => c !== null && c.id === companyId
  );
  return company ?? null;
}

export async function getSubmissionDashboard(
  recentLimit = 5,
  contributorsLimit = 5
): Promise<Database['public']['Functions']['get_submission_dashboard']['Returns'] | null> {
  return fetchCached(
    (client) => new AccountService(client).getSubmissionDashboard({
      p_recent_limit: recentLimit,
      p_contributors_limit: contributorsLimit,
    }),
    {
      key: `${recentLimit}-${contributorsLimit}`,
      tags: ['submissions', 'dashboard', 'content'],
      ttlKey: 'cache.submission_dashboard.ttl_seconds',
      useAuth: true,
      fallback: null,
      logMeta: { recentLimit, contributorsLimit },
    }
  );
}
