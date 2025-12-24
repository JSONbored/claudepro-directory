/**
 * Account Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import type {
  BatchInsertUserInteractionsArgs,
  BatchInsertUserInteractionsReturns,
} from '@heyclaude/database-types/postgres-types';
import type { content_category } from '@prisma/client';
import { prisma } from '../prisma/client';

// Local types for converted RPCs (RPCs removed, using Prisma directly)
// These RPC functions were removed and converted to Prisma direct queries
// Types are defined locally to match the original RPC return structures
// Exported for use in web-runtime

export type GetAccountDashboardArgs = {
  p_user_id: string;
};

export type GetAccountDashboardReturns = {
  bookmark_count: number;
  profile: {
    name: string | null;
    tier: 'free' | 'pro' | 'enterprise' | null;
    created_at: string | null;
  } | null;
};

export type GetUserLibraryArgs = {
  p_user_id: string;
};

export type GetUserLibraryReturns = {
  bookmarks: Array<{
    id: string;
    user_id: string;
    content_type: string | null;
    content_slug: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }> | null;
  collections: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
    is_public: boolean;
    item_count: number;
    view_count: number;
    created_at: string;
  }> | null;
  stats: {
    bookmark_count: number;
    collection_count: number;
    total_collection_items: number;
    total_collection_views: number;
  } | null;
};

export type GetUserDashboardArgs = {
  p_user_id: string;
};

export type UserDashboardSubmission = {
  id: string;
  user_id: string | null;
  content_type: string | null;
  content_slug: string;
  content_name: string;
  pr_number: string | null;
  pr_url: string | null;
  branch_name: string | null;
  status: string | null;
  submission_data: Record<string, unknown> | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
};

export type GetUserDashboardReturns = {
  submissions: UserDashboardSubmission[];
  companies: Record<string, unknown> | null;
  jobs: Record<string, unknown> | null;
};

export type GetCollectionDetailWithItemsArgs = {
  p_slug: string;
  p_user_id: string;
};

export type GetCollectionDetailWithItemsReturns = {
  collection: {
    id: string;
    user_id: string;
    slug: string;
    name: string;
    description: string | null;
    is_public: boolean;
    view_count: number;
    bookmark_count: number;
    item_count: number;
    created_at: string;
    updated_at: string;
  } | null;
  items: Array<{
    id: string;
    collection_id: string;
    user_id: string;
    content_type: string | null;
    content_slug: string;
    order: number;
    notes: string | null;
    added_at: string;
    created_at: string;
    updated_at: string;
  }> | null;
  bookmarks: Array<{
    id: string;
    user_id: string;
    content_type: string | null;
    content_slug: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
  }> | null;
};

export type GetUserSettingsArgs = {
  p_user_id: string;
};

export type GetUserSettingsReturns = {
  profile: {
    display_name: string | null;
    bio: string | null;
    work: string | null;
    website: string | null;
    social_x_link: string | null;
    interests: string[];
    profile_public: boolean | null;
    follow_email: boolean | null;
    created_at: string | null;
  } | null;
  user_data: {
    slug: string | null; // Prisma schema: String? (nullable)
    name: string | null;
    image: string | null;
    tier: 'free' | 'pro' | 'enterprise' | null; // Prisma schema: user_tier? (nullable)
  } | null;
  username: string | null;
};

export type GetSponsorshipAnalyticsArgs = {
  p_user_id: string;
  p_sponsorship_id: string;
};

export type GetSponsorshipAnalyticsReturns = {
  sponsorship: {
    id: string;
    user_id: string;
    content_type: content_category;
    content_id: string;
    active: boolean | null;
    start_date: string;
    end_date: string;
    impression_limit: number | null;
    impression_count: number | null;
    click_count: number | null;
    created_at: string;
    updated_at: string;
    tier: string;
  } | null;
  daily_stats: Array<{
    date: string | null;
    impressions: number | null;
    clicks: number | null;
  }> | null;
  computed_metrics: {
    ctr: number;
    days_active: number;
    avg_impressions_per_day: number;
  } | null;
};

export type GetUserCompaniesArgs = {
  p_user_id: string;
};

export type GetUserCompaniesReturns = {
  companies: Array<{
    id: string;
    slug: string;
    name: string;
    logo: string | null;
    website: string | null;
    description: string | null;
    size: string | null;
    industry: string | null;
    using_cursor_since: string | null;
    featured: boolean | null;
    created_at: string;
    updated_at: string;
    stats: {
      total_jobs: number;
      active_jobs: number;
      total_views: number;
      total_clicks: number;
      latest_job_posted_at: string | null;
    } | null;
  }>;
};

export type UserCompaniesCompany = GetUserCompaniesReturns['companies'][number];

export type GetUserSponsorshipsArgs = {
  p_user_id: string;
};

export type GetUserSponsorshipsReturns = unknown[];

export type GetSubmissionDashboardArgs = {
  p_limit: number;
  p_offset: number;
  p_recent_limit?: number;
  p_contributors_limit?: number;
};

export type GetSubmissionDashboardReturns = {
  stats: {
    total: number;
    pending: number;
    merged_this_week: number;
  };
  recent: Array<{
    id: string;
    content_name: string;
    content_type: string | null;
    merged_at: string | null;
    user: {
      name: string | null; // Prisma schema: String? (nullable)
      slug: string | null; // Prisma schema: String? (nullable)
    } | null;
  }>;
  contributors: Array<{
    rank: number;
    name: string | null; // Prisma schema: String? (nullable)
    slug: string | null; // Prisma schema: String? (nullable)
    merged_count: number;
  }>;
};

export type GetUserActivitySummaryArgs = {
  p_user_id: string;
};

export type GetUserActivitySummaryReturns = {
  total_posts: number;
  total_comments: number;
  total_votes: number;
  total_submissions: number;
  merged_submissions: number;
  total_activity: number;
} | null;

export type GetUserActivityTimelineArgs = {
  p_user_id: string;
  p_activity_type?: string | null;
  p_activity_limit?: number;
  p_activity_offset?: number;
  p_type?: string;
  p_limit?: number;
  p_offset?: number;
};

export type GetUserActivityTimelineReturns = {
  activities: Array<{
    id: string;
    type: string;
    title: string;
    body: string | null;
    vote_type: string | null;
    content_type: string | null;
    content_slug: string | null;
    post_id: string | null;
    parent_id: string | null;
    submission_url: string;
    description: string;
    status: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
  }>;
  has_more: boolean;
  total: number;
};

export type GetUserIdentitiesArgs = {
  p_user_id: string;
};

export type GetUserIdentitiesReturns = {
  identities: Array<{
    provider: string;
    email: string | null;
    created_at: string | null;
    last_sign_in_at: string | null;
  }>;
};

export type GetUserCompleteDataArgs = {
  p_user_id: string;
  p_activity_limit: number;
  p_activity_offset: number;
  p_activity_type?: string | null;
};

export type GetUserCompleteDataReturns = {
  account_dashboard: GetAccountDashboardReturns;
  user_dashboard: GetUserDashboardReturns;
  user_settings: GetUserSettingsReturns;
  activity_summary: GetUserActivitySummaryReturns;
  activity_timeline: GetUserActivityTimelineReturns;
  user_library: GetUserLibraryReturns;
  user_identities: GetUserIdentitiesReturns;
  sponsorships: unknown[] | null;
};

type IsBookmarkedArgs = {
  p_user_id: string;
  p_content_type: content_category;
  p_content_slug: string;
};

type IsFollowingArgs = {
  follower_id: string;
  following_id: string;
};

// Local types for batch functions (RPCs removed, using Prisma directly)
// Exported for use in web-runtime
export type IsBookmarkedBatchArgs = {
  p_user_id: string;
  p_items:
    | Array<{ content_type: content_category; content_slug: string }>
    | Record<string, unknown>;
};

export type IsBookmarkedBatchReturns = Array<{
  content_type: content_category | null;
  content_slug: string;
  is_bookmarked: boolean;
}>;

export type IsFollowingBatchArgs = {
  p_follower_id: string;
  p_followed_user_ids: string[];
};

export type IsFollowingBatchReturns = Array<{
  followed_user_id: string;
  is_following: boolean;
}>;
import { BasePrismaService } from './base-prisma-service';
import { withSmartCache } from '../utils/request-cache';

/**
 * Account Service using Prisma Client
 *
 * This service uses:
 * - RPC wrapper for PostgreSQL functions
 * - Request-scoped caching (via BasePrismaService)
 * - Same public API as Supabase-based service
 */
export class AccountService extends BasePrismaService {
  /**
   * Get account dashboard
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT from users table, which Prisma handles perfectly.
   *
   * @param args - Arguments with p_user_id
   * @returns Account dashboard data matching RPC return structure
   */
  async getAccountDashboard(
    args: GetAccountDashboardArgs
  ): Promise<
    GetAccountDashboardReturns & {
      profile: (GetAccountDashboardReturns['profile'] & { account_age?: number }) | null;
    }
  > {
    return withSmartCache(
      'getAccountDashboard',
      'getAccountDashboard',
      async () => {
        // OPTIMIZATION: Use Prisma query builder instead of raw SQL for better type safety and maintainability
        // Calculate account_age in JavaScript after fetching (since we're in withSmartCache, Date.now() is safe)
        const user = await prisma.public_users.findUnique({
          where: { id: args.p_user_id },
          select: {
            bookmark_count: true,
            name: true,
            tier: true,
            created_at: true,
          },
        });

        // Return empty state if user not found (matching RPC behavior)
        if (!user) {
          return {
            bookmark_count: 0,
            profile: {
              name: null,
              tier: 'free' as GetAccountDashboardReturns['profile'] extends { tier: infer T }
                ? T
                : never,
              created_at: null, // Use null instead of current date for empty state
              account_age: 0,
            } as GetAccountDashboardReturns['profile'] & { account_age: number },
          } as GetAccountDashboardReturns & {
            profile: (GetAccountDashboardReturns['profile'] & { account_age: number }) | null;
          };
        }

        // Calculate account_age in JavaScript (days since account creation)
        const accountAge = user.created_at
          ? Math.floor((Date.now() - user.created_at.getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        // Transform to match RPC return structure (AccountDashboardResult) with account_age
        return {
          bookmark_count: user.bookmark_count ?? 0,
          profile: {
            name: user.name,
            tier: (user.tier ?? 'free') as 'free' | 'pro' | 'enterprise' | null,
            created_at: user.created_at.toISOString(),
            account_age: accountAge,
          } as GetAccountDashboardReturns['profile'] & { account_age: number },
        } as GetAccountDashboardReturns & {
          profile: (GetAccountDashboardReturns['profile'] & { account_age: number }) | null;
        };
      },
      args
    );
  }

  /**
   * Get user library
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing multiple queries (bookmarks, collections, stats), which we can do with Prisma.
   *
   * @param args - Arguments with p_user_id
   * @returns User library data matching RPC return structure
   */
  async getUserLibrary(args: GetUserLibraryArgs): Promise<GetUserLibraryReturns> {
    return withSmartCache(
      'getUserLibrary',
      'getUserLibrary',
      async () => {
        // OPTIMIZATION: Use count() instead of findMany().length to avoid fetching all records
        // Fetch bookmarks, collections, and counts in parallel
        // OPTIMIZATION: Use select to fetch only needed fields
        const [bookmarks, collections, bookmarkCount, collectionCount] = await Promise.all([
          prisma.bookmarks.findMany({
            where: { user_id: args.p_user_id },
            select: {
              id: true,
              user_id: true,
              content_type: true,
              content_slug: true,
              notes: true,
              created_at: true,
              updated_at: true,
            },
            orderBy: { created_at: 'desc' },
          }),
          prisma.user_collections.findMany({
            where: { user_id: args.p_user_id },
            select: {
              id: true,
              user_id: true,
              slug: true,
              name: true,
              description: true,
              is_public: true,
              item_count: true,
              view_count: true,
              created_at: true,
              updated_at: true,
            },
            orderBy: { created_at: 'desc' },
          }),
          prisma.bookmarks.count({
            where: { user_id: args.p_user_id },
          }),
          prisma.user_collections.count({
            where: { user_id: args.p_user_id },
          }),
        ]);
        // OPTIMIZATION: Use aggregate queries instead of in-memory reduce
        // This is more efficient when we have many collections
        const [aggregateResult] = await Promise.all([
          prisma.user_collections.aggregate({
            where: { user_id: args.p_user_id },
            _sum: {
              item_count: true,
              view_count: true,
            },
          }),
        ]);
        const totalItems = aggregateResult._sum.item_count ?? 0;
        const totalViews = aggregateResult._sum.view_count ?? 0;

        // Transform to match RPC return structure (UserLibraryResult)
        return {
          bookmarks: bookmarks.map((bookmark) => ({
            id: bookmark.id,
            user_id: bookmark.user_id,
            content_type: bookmark.content_type, // content_category enum, cast to string for composite type
            content_slug: bookmark.content_slug,
            notes: bookmark.notes,
            created_at: bookmark.created_at.toISOString(),
            updated_at: bookmark.updated_at.toISOString(),
          })),
          collections: collections.map((collection) => ({
            id: collection.id,
            user_id: collection.user_id,
            slug: collection.slug,
            name: collection.name,
            description: collection.description,
            is_public: collection.is_public,
            item_count: collection.item_count ?? 0,
            view_count: collection.view_count ?? 0,
            created_at: collection.created_at.toISOString(),
            updated_at: collection.updated_at.toISOString(),
          })),
          stats: {
            bookmark_count: bookmarkCount,
            collection_count: collectionCount,
            total_collection_items: totalItems, // Note: RPC uses total_collection_items, not total_items
            total_collection_views: totalViews, // Note: RPC uses total_collection_views, not total_views
          },
        };
      },
      args
    );
  }

  /**
   * Get user dashboard
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing multiple queries (submissions, companies, jobs), which we can do with Prisma.
   *
   * @param args - Arguments with p_user_id
   * @returns User dashboard data matching RPC return structure
   */
  async getUserDashboard(args: GetUserDashboardArgs): Promise<GetUserDashboardReturns> {
    return withSmartCache(
      'getUserDashboard',
      'getUserDashboard',
      async () => {
        // Fetch submissions, companies, and jobs in parallel
        const [submissions, companies, jobs] = await Promise.all([
          prisma.content_submissions.findMany({
            where: { submitter_id: args.p_user_id },
            orderBy: { created_at: 'desc' },
            select: {
              id: true,
              submitter_id: true,
              submission_type: true,
              approved_slug: true,
              name: true,
              github_pr_url: true,
              status: true,
              content_data: true,
              moderator_notes: true,
              created_at: true,
              updated_at: true,
              merged_at: true,
            },
          }),
          // OPTIMIZATION: Use select to fetch only needed company fields
          prisma.companies.findMany({
            where: { owner_id: args.p_user_id },
            select: {
              id: true,
              slug: true,
              name: true,
              logo: true,
              website: true,
              description: true,
              size: true,
              industry: true,
              using_cursor_since: true,
              featured: true,
              created_at: true,
              updated_at: true,
            },
            orderBy: { created_at: 'desc' },
          }),
          // OPTIMIZATION: Use select to fetch only needed job fields
          prisma.jobs.findMany({
            where: {
              user_id: args.p_user_id,
              status: { not: 'deleted' },
            },
            select: {
              id: true,
              slug: true,
              title: true,
              company: true,
              description: true,
              location: true,
              remote: true,
              salary: true,
              type: true,
              category: true,
              tags: true,
              requirements: true,
              benefits: true,
              link: true,
              contact_email: true,
              posted_at: true,
              expires_at: true,
              active: true,
              status: true,
              plan: true,
              tier: true,
              order: true,
              created_at: true,
              updated_at: true,
            },
            orderBy: { created_at: 'desc' },
          }),
        ]);

        // Transform to match RPC return structure (UserDashboardResult)
        return {
          submissions: submissions.map((submission) => ({
            id: submission.id,
            user_id: submission.submitter_id,
            content_type: submission.submission_type ? String(submission.submission_type) : null, // submission_type enum to string
            content_slug: submission.approved_slug ?? '',
            content_name: submission.name,
            pr_number: null, // Not available in content_submissions
            pr_url: submission.github_pr_url,
            branch_name: null, // Not available in content_submissions
            status: submission.status ? String(submission.status) : null, // submission_status enum to string
            submission_data: submission.content_data as Record<string, unknown> | null,
            rejection_reason: submission.moderator_notes,
            created_at: submission.created_at.toISOString(),
            updated_at: submission.updated_at.toISOString(),
            merged_at: submission.merged_at?.toISOString() ?? null,
          })),
          // Type assertion required: UserDashboardResult.companies is Record<string, unknown> | null
          // because the RPC returns JSONB (jsonb_agg). Prisma returns companies[], which needs to be
          // converted to match the JSONB structure. The actual usage expects an array-like structure
          // that can be parsed, so we cast the array to match the expected JSONB format.
          // TODO: Improve database type generation to properly type JSONB arrays
          companies:
            companies.length > 0 ? (companies as unknown as Record<string, unknown>) : null,
          // Type assertion required: UserDashboardResult.jobs is Record<string, unknown> | null
          // because the RPC returns JSONB (jsonb_agg). Prisma returns jobs[], which needs to be
          // converted to match the JSONB structure. Note: job_billing_summary is a view, not a Prisma
          // relation, so billing summary is not included (can be added later with raw SQL if needed).
          // TODO: Improve database type generation to properly type JSONB arrays
          jobs: jobs.length > 0 ? (jobs as unknown as Record<string, unknown>) : null,
        };
      },
      args
    );
  }

  /**
   * Get collection detail with items
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing multiple queries (collection, items, bookmarks), which we can do with Prisma includes.
   *
   * @param args - Arguments with p_user_id and p_slug
   * @returns Collection detail with items and bookmarks matching RPC return structure
   */
  async getCollectionDetailWithItems(
    args: GetCollectionDetailWithItemsArgs
  ): Promise<GetCollectionDetailWithItemsReturns> {
    return withSmartCache(
      'getCollectionDetailWithItems',
      'getCollectionDetailWithItems',
      async () => {
        // OPTIMIZATION: Use select instead of include to fetch only needed fields
        // OPTIMIZATION: Use relationLoadStrategy: 'join' to fetch collection and items in a single query
        const collection = await prisma.user_collections.findFirst({
          where: {
            user_id: args.p_user_id,
            slug: args.p_slug,
          },
          select: {
            id: true,
            user_id: true,
            slug: true,
            name: true,
            description: true,
            is_public: true,
            item_count: true,
            view_count: true,
            bookmark_count: true, // Used in transformation
            created_at: true,
            updated_at: true,
            collection_items: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                collection_id: true,
                user_id: true, // Used in transformation
                content_type: true,
                content_slug: true,
                order: true,
                notes: true, // Used in transformation
                added_at: true,
                created_at: true, // Used in transformation
                updated_at: true, // Used in transformation
              },
            },
          },
          relationLoadStrategy: 'join', // Use JOIN for better performance (requires relationJoins preview feature)
        });

        if (!collection) {
          return {
            collection: null,
            items: null,
            bookmarks: null,
          };
        }

        // OPTIMIZATION: Use select to fetch only needed bookmark fields
        // Get bookmarks for this user (ordered by created_at DESC)
        const bookmarks = await prisma.bookmarks.findMany({
          where: { user_id: args.p_user_id },
          select: {
            id: true,
            user_id: true,
            content_type: true,
            content_slug: true,
            notes: true,
            created_at: true,
            updated_at: true,
          },
          orderBy: { created_at: 'desc' },
        });

        // Transform to match RPC return structure (CollectionDetailWithItemsResult)
        // Note: Composite types expect all fields including computed ones (view_count, bookmark_count, item_count)
        return {
          collection: {
            id: collection.id,
            user_id: collection.user_id,
            slug: collection.slug,
            name: collection.name,
            description: collection.description,
            is_public: collection.is_public,
            view_count: collection.view_count ?? 0,
            bookmark_count: collection.bookmark_count ?? 0,
            item_count: collection.collection_items.length,
            created_at: collection.created_at.toISOString(),
            updated_at: collection.updated_at.toISOString(),
          },
          items: collection.collection_items.map((item) => ({
            id: item.id,
            collection_id: item.collection_id,
            user_id: item.user_id,
            content_type: item.content_type,
            content_slug: item.content_slug,
            order: item.order,
            notes: item.notes,
            added_at: item.added_at.toISOString(),
            created_at: item.created_at.toISOString(),
            updated_at: item.updated_at.toISOString(),
          })),
          bookmarks: bookmarks.map((bookmark) => ({
            id: bookmark.id,
            user_id: bookmark.user_id,
            content_type: bookmark.content_type,
            content_slug: bookmark.content_slug,
            notes: bookmark.notes,
            created_at: bookmark.created_at.toISOString(),
            updated_at: bookmark.updated_at.toISOString(),
          })),
        };
      },
      args
    );
  }

  /**
   * Get user settings
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT from users table, which Prisma handles perfectly.
   *
   * @param args - Arguments with p_user_id
   * @returns User settings matching RPC return structure
   */
  async getUserSettings(args: GetUserSettingsArgs): Promise<GetUserSettingsReturns> {
    return withSmartCache(
      'getUserSettings',
      'getUserSettings',
      async () => {
        const user = await prisma.public_users.findUnique({
          where: { id: args.p_user_id },
          select: {
            username: true,
            display_name: true,
            bio: true,
            work: true,
            website: true,
            social_x_link: true,
            interests: true,
            profile_public: true,
            follow_email: true,
            created_at: true,
            slug: true,
            name: true,
            image: true,
            tier: true,
          },
        });

        if (!user) {
          return {
            profile: null,
            user_data: null,
            username: null,
          };
        }

        // Transform to match RPC return structure (UserSettingsResultV2)
        return {
          profile: {
            display_name: user.display_name,
            bio: user.bio,
            work: user.work,
            website: user.website,
            social_x_link: user.social_x_link,
            interests: user.interests,
            profile_public: user.profile_public,
            follow_email: user.follow_email,
            created_at: user.created_at?.toISOString() ?? null,
          },
          user_data: {
            slug: user.slug,
            name: user.name,
            image: user.image,
            tier: user.tier,
          },
          username: user.username,
        };
      },
      args
    );
  }

  /**
   * Get sponsorship analytics
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing aggregations and filtering with date ranges, which we can replicate with Prisma.
   *
   * @param args - Arguments with p_user_id, p_start_date, p_end_date
   * @returns Sponsorship analytics data matching RPC return structure
   */
  /**
   * Get sponsorship analytics
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing complex date series generation and aggregations, which we replicate with Prisma queries.
   *
   * @param args - Arguments with p_sponsorship_id and p_user_id
   * @returns Sponsorship analytics data matching RPC return structure
   */
  async getSponsorshipAnalytics(
    args: GetSponsorshipAnalyticsArgs
  ): Promise<GetSponsorshipAnalyticsReturns> {
    return withSmartCache(
      'getSponsorshipAnalytics',
      'getSponsorshipAnalytics',
      async () => {
        // Check if sponsorship exists and belongs to user
        // OPTIMIZATION: Use select to fetch only needed sponsorship fields
        const sponsorship = await prisma.sponsored_content.findFirst({
          where: {
            id: args.p_sponsorship_id,
            user_id: args.p_user_id,
          },
          select: {
            id: true,
            user_id: true,
            content_type: true,
            content_id: true,
            active: true,
            start_date: true,
            end_date: true,
            impression_limit: true,
            impression_count: true,
            click_count: true,
            created_at: true,
            updated_at: true,
            tier: true,
          },
        });

        if (!sponsorship) {
          // Return null structure matching composite type (all fields nullable)
          return {
            sponsorship: null,
            daily_stats: null,
            computed_metrics: null,
          };
        }

        // OPTIMIZATION: Use Prisma groupBy for date-based aggregations instead of raw SQL
        // Calculate date range in JavaScript (safe within withSmartCache)
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // Last 30 days (0-29 = 30 days)
        thirtyDaysAgo.setUTCHours(0, 0, 0, 0); // Start of day
        const todayStart = new Date(now);
        todayStart.setUTCHours(0, 0, 0, 0);

        // OPTIMIZATION: Use Prisma groupBy to group by date (extract date from created_at)
        // Prisma doesn't support DATE() function directly, so we'll fetch all records and group in JS
        // OR we can use Prisma's date filtering and group in JavaScript
        // Actually, let's use Prisma to fetch and group by date in JavaScript for better type safety
        const [impressionsData, clicksData] = await Promise.all([
          prisma.user_interactions.findMany({
            where: {
              interaction_type: 'sponsored_impression',
              content_slug: args.p_sponsorship_id,
              created_at: {
                gte: thirtyDaysAgo,
                lte: now,
              },
            },
            select: {
              created_at: true,
            },
          }),
          prisma.user_interactions.findMany({
            where: {
              interaction_type: 'sponsored_click',
              content_slug: args.p_sponsorship_id,
              created_at: {
                gte: thirtyDaysAgo,
                lte: now,
              },
            },
            select: {
              created_at: true,
            },
          }),
        ]);

        // Group by date in JavaScript (more efficient than fetching all records if we had to)
        // But actually, we can use Prisma's groupBy if we add a computed field
        // For now, group in JavaScript for type safety
        const impressionsGrouped = Array.from(
          impressionsData.reduce((map, item) => {
            // created_at is always present since we select it
            const dateKey = (item.created_at as Date).toISOString().split('T')[0]; // YYYY-MM-DD
            if (dateKey) {
              map.set(dateKey, (map.get(dateKey) || 0) + 1);
            }
            return map;
          }, new Map<string, number>())
        ).map(([date, count]) => ({ date, count: BigInt(count) }));

        const clicksGrouped = Array.from(
          clicksData.reduce((map, item) => {
            // created_at is always present since we select it
            const dateKey = (item.created_at as Date).toISOString().split('T')[0]; // YYYY-MM-DD
            if (dateKey) {
              map.set(dateKey, (map.get(dateKey) || 0) + 1);
            }
            return map;
          }, new Map<string, number>())
        ).map(([date, count]) => ({ date, count: BigInt(count) }));

        // Create a map of date -> { impressions, clicks }
        const dailyStatsMap = new Map<string, { impressions: number; clicks: number }>();

        // Process impressions - already grouped by date from database
        for (const row of impressionsGrouped) {
          dailyStatsMap.set(row.date, {
            impressions: Number(row.count),
            clicks: 0,
          });
        }

        // Process clicks - merge with impressions map
        for (const row of clicksGrouped) {
          const existing = dailyStatsMap.get(row.date) || { impressions: 0, clicks: 0 };
          dailyStatsMap.set(row.date, {
            ...existing,
            clicks: Number(row.count),
          });
        }

        // Generate all dates in the last 30 days in JavaScript (safe within withSmartCache)
        // More efficient than database generate_series for small ranges
        const dateRange: string[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          date.setUTCHours(0, 0, 0, 0);
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
          if (dateStr) {
            dateRange.push(dateStr);
          }
        }

        const dailyStats: Array<{
          date: string | null;
          impressions: number | null;
          clicks: number | null;
        }> = dateRange.map((dateStr) => {
          const stats = dailyStatsMap.get(dateStr) || { impressions: 0, clicks: 0 };
          return {
            date: dateStr,
            impressions: stats.impressions,
            clicks: stats.clicks,
          };
        });

        // Calculate days active in JavaScript (safe within withSmartCache)
        const daysActive = sponsorship.start_date
          ? Math.max(0, Math.floor((now.getTime() - sponsorship.start_date.getTime()) / (1000 * 60 * 60 * 24)))
          : 0;

        const impressionCount = sponsorship.impression_count ?? 0;
        const clickCount = sponsorship.click_count ?? 0;

        const ctr =
          impressionCount > 0 ? Math.round((clickCount / impressionCount) * 100 * 100) / 100 : 0;

        const avgImpressionsPerDay = daysActive > 0 ? Math.round(impressionCount / daysActive) : 0;

        // Build result matching SponsorshipAnalyticsResult composite type
        return {
          sponsorship: {
            id: sponsorship.id,
            user_id: sponsorship.user_id,
            content_type: sponsorship.content_type,
            content_id: sponsorship.content_id,
            active: sponsorship.active,
            start_date: sponsorship.start_date.toISOString(),
            end_date: sponsorship.end_date.toISOString(),
            impression_limit: sponsorship.impression_limit,
            impression_count: sponsorship.impression_count,
            click_count: sponsorship.click_count,
            created_at: sponsorship.created_at.toISOString(),
            updated_at: sponsorship.updated_at.toISOString(),
            tier: sponsorship.tier,
          },
          daily_stats: dailyStats.length > 0 ? dailyStats : null,
          computed_metrics: {
            ctr,
            days_active: daysActive,
            avg_impressions_per_day: avgImpressionsPerDay,
          },
        };
      },
      args
    );
  }

  /**
   * Get user companies
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was using LATERAL JOIN for job stats, which we can replicate with Prisma includes and aggregations.
   *
   * @param args - Arguments with p_user_id
   * @returns User companies with job stats matching RPC return structure
   */
  async getUserCompanies(args: GetUserCompaniesArgs): Promise<GetUserCompaniesReturns> {
    return withSmartCache(
      'getUserCompanies',
      'getUserCompanies',
      async () => {
        // OPTIMIZATION: Use relationLoadStrategy: 'join' to fetch companies and jobs in a single query
        // This reduces database round-trips and improves performance
        // OPTIMIZATION: Use select instead of include to fetch only needed fields
        const companies = await prisma.companies.findMany({
          where: { owner_id: args.p_user_id },
          select: {
            id: true,
            slug: true,
            name: true,
            logo: true,
            website: true,
            description: true,
            size: true,
            industry: true,
            using_cursor_since: true,
            featured: true,
            created_at: true,
            updated_at: true, // Used in transformation
            jobs: {
              select: {
                status: true,
                view_count: true,
                click_count: true,
                created_at: true,
              },
            },
          },
          orderBy: { created_at: 'desc' },
          relationLoadStrategy: 'join', // Use JOIN for better performance (requires relationJoins preview feature)
        });

        // Transform to match RPC return structure (UserCompaniesResult)
        // NOTE: Since jobs are already loaded via include with relationLoadStrategy: 'join',
        // it's more efficient to calculate stats in-memory rather than making additional queries
        const companiesWithStats = companies.map((company) => {
          // Calculate job stats (matching LATERAL JOIN logic from RPC)
          const totalJobs = company.jobs.length;
          const activeJobs = company.jobs.filter((j) => j.status === 'active').length;
          const totalViews = company.jobs.reduce((sum, j) => sum + (j.view_count ?? 0), 0);
          const totalClicks = company.jobs.reduce((sum, j) => sum + (j.click_count ?? 0), 0);
          const latestJobPostedAt =
            company.jobs.length > 0
              ? company.jobs.reduce(
                  (latest, j) => {
                    const jobDate = j.created_at;
                    return !latest || (jobDate && jobDate > latest) ? jobDate : latest;
                  },
                  null as Date | null
                )
              : null;

          return {
            id: company.id,
            slug: company.slug,
            name: company.name,
            logo: company.logo,
            website: company.website,
            description: company.description,
            size: company.size ? String(company.size) : null, // company_size enum to string
            industry: company.industry,
            using_cursor_since: company.using_cursor_since?.toISOString() ?? null, // Date to ISO string
            featured: company.featured,
            created_at: company.created_at.toISOString(),
            updated_at: company.updated_at.toISOString(),
            stats: {
              total_jobs: totalJobs,
              active_jobs: activeJobs,
              total_views: totalViews,
              total_clicks: totalClicks,
              latest_job_posted_at: latestJobPostedAt?.toISOString() ?? null,
            },
          };
        });

        // Return structure matching RPC (user_companies_result)
        return {
          companies: companiesWithStats,
        };
      },
      args
    );
  }

  /**
   * Get user sponsorships
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT from sponsored_content, which Prisma handles perfectly.
   *
   * @param args - Arguments with p_user_id
   * @returns Array of sponsored content records (GetUserSponsorshipsReturns is unknown[], so we cast)
   */
  async getUserSponsorships(args: GetUserSponsorshipsArgs): Promise<GetUserSponsorshipsReturns> {
    return withSmartCache(
      'getUserSponsorships',
      'getUserSponsorships',
      async () => {
        // OPTIMIZATION: Use select to fetch only required fields (12 fields, excluding user_id)
        // This reduces data transfer and improves query performance
        const sponsorships = await prisma.sponsored_content.findMany({
          where: { user_id: args.p_user_id },
          select: {
            id: true,
            content_type: true,
            content_id: true,
            active: true,
            start_date: true,
            end_date: true,
            impression_limit: true,
            impression_count: true,
            click_count: true,
            created_at: true,
            updated_at: true,
            tier: true,
          },
          orderBy: { created_at: 'desc' },
        });
        // Transform Prisma results to match RPC return format
        // RPC returns dates as ISO strings, but Prisma returns Date objects
        // Convert Date fields to ISO strings to match expected return type
        const transformed = sponsorships.map((sponsorship) => ({
          ...sponsorship,
          created_at: sponsorship.created_at.toISOString(),
          updated_at: sponsorship.updated_at.toISOString(),
          start_date: sponsorship.start_date.toISOString(),
          end_date: sponsorship.end_date.toISOString(),
        })) satisfies GetUserSponsorshipsReturns;

        return transformed;
      },
      args
    );
  }

  /**
   * Get submission dashboard
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing aggregations and fetching recent merged submissions and top contributors.
   *
   * @param args - Arguments with p_recent_limit, p_contributors_limit
   * @returns Submission dashboard data matching RPC return structure
   */
  async getSubmissionDashboard(
    args: GetSubmissionDashboardArgs
  ): Promise<GetSubmissionDashboardReturns> {
    return withSmartCache(
      'getSubmissionDashboard',
      'getSubmissionDashboard',
      async () => {
        const recentLimit = args.p_recent_limit ?? 5;
        const contributorsLimit = args.p_contributors_limit ?? 5;

        // Use database DATE_TRUNC for week start (eliminates new Date() call)
        // More efficient: database handles date calculations natively
        // OPTIMIZATION: Calculate week start once before Promise.all (since we're in withSmartCache, Date.now() is safe)
        const weekStart = new Date();
        weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay()); // Start of week (Sunday)
        weekStart.setUTCHours(0, 0, 0, 0);
        
        // Fetch stats, recent merged submissions, and top contributors in parallel
        const [totalCount, pendingCount, mergedThisWeekCountResult, recentMerged, topContributors] =
          await Promise.all([
            prisma.content_submissions.count(),
            prisma.content_submissions.count({
              where: { status: 'pending' },
            }),
            // OPTIMIZATION: Use Prisma count() with date calculation instead of raw SQL
            prisma.content_submissions.count({
              where: {
                status: 'merged', // RPC uses 'approved' but Prisma enum is 'merged'
                created_at: { gte: weekStart },
              },
            }),
            prisma.content_submissions.findMany({
              where: {
                status: 'merged', // RPC SQL uses 'approved'::submission_status, but Prisma enum value is 'merged'
                moderated_at: { not: null },
              },
              orderBy: { moderated_at: 'desc' },
              take: recentLimit,
              select: {
                id: true,
                name: true,
                submission_type: true,
                moderated_at: true,
                submitter_id: true,
              },
            }),
            // Get top contributors (users with most merged submissions)
            prisma.content_submissions.groupBy({
              by: ['submitter_id'],
              _count: {
                id: true,
              },
              where: {
                status: 'approved', // RPC SQL uses 'approved'::submission_status
                submitter_id: { not: null },
              },
              orderBy: {
                _count: {
                  id: 'desc',
                },
              },
              take: contributorsLimit,
            }),
          ]);

        // Fetch user details for recent merged submissions and top contributors
        const submitterIds = recentMerged
          .map((s) => s.submitter_id)
          .filter((id): id is string => id !== null);
        const contributorUserIds = topContributors
          .map((c) => c.submitter_id)
          .filter((id): id is string => id !== null);

        const allUserIds = [...new Set([...submitterIds, ...contributorUserIds])];

        const users =
          allUserIds.length > 0
            ? await prisma.public_users.findMany({
                where: {
                  id: { in: allUserIds },
                  name: { not: null },
                  slug: { not: null },
                },
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              })
            : [];

        // Create maps for quick lookup
        const usersMap = new Map(users.map((u) => [u.id, u]));

        // Transform to match RPC return structure (SubmissionDashboardResult)
        return {
          stats: {
            total: totalCount,
            pending: pendingCount,
            merged_this_week: mergedThisWeekCountResult,
          },
          recent: recentMerged.map((submission) => {
            const user = submission.submitter_id ? usersMap.get(submission.submitter_id) : null;
            return {
              id: submission.id,
              content_name: submission.name,
              content_type: submission.submission_type ? String(submission.submission_type) : null, // Convert enum to string | null
              merged_at: submission.moderated_at?.toISOString() ?? null,
              user: user
                ? {
                    name: user.name,
                    slug: user.slug,
                  }
                : null,
            };
          }),
          contributors: topContributors
            .map((contributor, index) => {
              const user = contributor.submitter_id ? usersMap.get(contributor.submitter_id) : null;
              if (!user) return null;
              return {
                rank: index + 1,
                name: user.name,
                slug: user.slug,
                merged_count: contributor._count.id,
              };
            })
            .filter((c): c is NonNullable<typeof c> => c !== null),
        };
      },
      args
    );
  }

  /**
   * Check if content is bookmarked by user
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple EXISTS check, which Prisma handles perfectly.
   *
   * @param args - Arguments with user_id, content_type, and content_slug
   * @returns Boolean indicating if content is bookmarked
   */
  async isBookmarked(args: IsBookmarkedArgs): Promise<boolean> {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'packages/data-layer/src/services/account.ts:1384',message:'AccountService.isBookmarked - ENTRY',data:{args},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ROOT'})}).catch(()=>{});
    // #endregion
    const result = await withSmartCache(
      'isBookmarked',
      'isBookmarked',
      async () => {
        // #region agent log
        const allBookmarks = await prisma.bookmarks.findMany({ where: { user_id: args.p_user_id } });
        fetch('http://127.0.0.1:7243/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'packages/data-layer/src/services/account.ts:1389',message:'isBookmarked - before Prisma query',data:{args,allBookmarksCount:allBookmarks.length,allBookmarks:allBookmarks.map(b=>({id:b.id,user_id:b.user_id,content_type:b.content_type,content_slug:b.content_slug}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        const bookmark = await prisma.bookmarks.findFirst({
          where: {
            user_id: args.p_user_id,
            content_type: args.p_content_type as content_category,
            content_slug: args.p_content_slug,
          },
          select: { id: true }, // Only need to check existence
        });
        // #region agent log
        const result = bookmark !== null;
        fetch('http://127.0.0.1:7243/ingest/2d0592d2-813e-46fd-8d41-08438ca12c51',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'packages/data-layer/src/services/account.ts:1401',message:'isBookmarked - RETURNING FROM SERVICE',data:{bookmarkFound:bookmark!==null,bookmarkId:bookmark?.id,result,resultType:typeof result,isTrue:result === true,isFalse:result === false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'ROOT'})}).catch(()=>{});
        // #endregion
        return result;
      },
      args
    );
    return result;
  }

  /**
   * Batch check if multiple content items are bookmarked
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was processing a JSONB array and doing EXISTS checks for each item.
   * We can do this more efficiently with a single Prisma query using OR conditions.
   *
   * @param args - Arguments with user_id and items array (JSONB)
   * @returns Array of results with content_type, content_slug, and is_bookmarked flag
   */
  async isBookmarkedBatch(args: IsBookmarkedBatchArgs): Promise<IsBookmarkedBatchReturns> {
    return withSmartCache(
      'isBookmarkedBatch',
      'isBookmarkedBatch',
      async () => {
        // Parse items from JSONB (could be array or object)
        let items: Array<{ content_type: content_category; content_slug: string }>;
        if (Array.isArray(args.p_items)) {
          // Already an array with proper types
          items = args.p_items;
        } else if (typeof args.p_items === 'object' && args.p_items !== null) {
          // If it's a JSONB object, try to extract array
          if (
            'items' in args.p_items &&
            Array.isArray((args.p_items as Record<string, unknown>)['items'])
          ) {
            // Validate and cast items from JSONB
            const rawItems = (args.p_items as Record<string, unknown>)['items'] as Array<{
              content_type: unknown;
              content_slug: unknown;
            }>;
            items = rawItems.map((item) => ({
              content_type: item.content_type as content_category,
              content_slug: String(item.content_slug),
            }));
          } else {
            // Single item wrapped in object - validate and cast
            const rawItem = args.p_items as { content_type: unknown; content_slug: unknown };
            items = [
              {
                content_type: rawItem.content_type as content_category,
                content_slug: String(rawItem.content_slug),
              },
            ];
          }
        } else {
          // Invalid format, return empty array
          return [];
        }

        if (items.length === 0) {
          return [];
        }

        // Build OR conditions for all items - types are already correct
        const whereConditions = items.map((item) => ({
          content_type: item.content_type,
          content_slug: item.content_slug,
        }));

        // Single query to get all bookmarks for this user matching any of the items
        const bookmarks = await prisma.bookmarks.findMany({
          where: {
            user_id: args.p_user_id,
            OR: whereConditions,
          },
          select: {
            content_type: true,
            content_slug: true,
          },
        });

        // Build set of bookmarked items for fast lookup
        const bookmarkSet = new Set(bookmarks.map((b) => `${b.content_type}:${b.content_slug}`));

        // Build result array - types are already correct
        return items.map((item) => ({
          content_type: item.content_type,
          content_slug: item.content_slug,
          is_bookmarked: bookmarkSet.has(`${item.content_type}:${item.content_slug}`),
        }));
      },
      args
    );
  }

  /**
   * Check if user is following another user
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple EXISTS check, which Prisma handles perfectly.
   *
   * @param args - Arguments with follower_id and following_id
   * @returns Boolean indicating if user is following
   */
  async isFollowing(args: IsFollowingArgs): Promise<boolean> {
    return withSmartCache(
      'isFollowing',
      'isFollowing',
      async () => {
        const follow = await prisma.followers.findFirst({
          where: {
            follower_id: args.follower_id,
            following_id: args.following_id,
          },
          select: { id: true }, // Only need to check existence
        });
        return follow !== null;
      },
      args
    );
  }

  /**
   * Batch check if user is following multiple users
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was processing a UUID array and doing EXISTS checks for each user.
   * We can do this more efficiently with a single Prisma query using IN condition.
   *
   * @param args - Arguments with follower_id and followed_user_ids array
   * @returns Array of results with followed_user_id and is_following flag
   */
  async isFollowingBatch(args: IsFollowingBatchArgs): Promise<IsFollowingBatchReturns> {
    return withSmartCache(
      'isFollowingBatch',
      'isFollowingBatch',
      async () => {
        const { p_follower_id, p_followed_user_ids } = args;

        if (!p_followed_user_ids || p_followed_user_ids.length === 0) {
          return [];
        }

        // Single query to get all follows for this follower matching any of the followed users
        const follows = await prisma.followers.findMany({
          where: {
            follower_id: p_follower_id,
            following_id: { in: p_followed_user_ids },
          },
          select: { following_id: true },
        });

        // Build set of followed user IDs for fast lookup
        const followedSet = new Set(follows.map((f) => f.following_id));

        // Build result array matching RPC return format
        // Type is already correct - map returns IsFollowingBatchReturns directly
        const result: IsFollowingBatchReturns = p_followed_user_ids.map((userId) => ({
          followed_user_id: userId,
          is_following: followedSet.has(userId),
        }));
        return result;
      },
      args
    );
  }

  /**
   * Get user activity summary
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing simple counts from users and content_submissions tables.
   *
   * @param args - Arguments with p_user_id
   * @returns User activity summary matching RPC return structure
   */
  async getUserActivitySummary(
    args: GetUserActivitySummaryArgs
  ): Promise<GetUserActivitySummaryReturns> {
    return withSmartCache(
      'getUserActivitySummary',
      'getUserActivitySummary',
      async () => {
        // Fetch user and merged submissions count in parallel
        const [user, mergedSubmissions] = await Promise.all([
          prisma.public_users.findUnique({
            where: { id: args.p_user_id },
            select: {
              submission_count: true,
            },
          }),
          prisma.content_submissions.count({
            where: {
              submitter_id: args.p_user_id,
              status: 'merged',
            },
          }),
        ]);

        // Return empty state if user not found (matching RPC behavior)
        if (!user) {
          return {
            total_posts: 0,
            total_comments: 0,
            total_votes: 0,
            total_submissions: 0,
            merged_submissions: 0,
            total_activity: 0,
          };
        }

        const totalSubmissions = user.submission_count ?? 0;
        const totalActivity = totalSubmissions; // Only submissions exist (posts/comments/votes not implemented)

        // Transform to match RPC return structure (UserActivitySummary)
        return {
          total_posts: 0, // Feature not implemented (backward compatibility)
          total_comments: 0, // Feature not implemented (backward compatibility)
          total_votes: 0, // Feature not implemented (backward compatibility)
          total_submissions: totalSubmissions,
          merged_submissions: mergedSubmissions,
          total_activity: totalActivity,
        };
      },
      args
    );
  }

  /**
   * Get user activity timeline
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a query with CTEs and pagination, which we can replicate with Prisma.
   *
   * @param args - Arguments with p_user_id, p_type, p_limit, p_offset
   * @returns User activity timeline matching RPC return structure
   */
  async getUserActivityTimeline(
    args: GetUserActivityTimelineArgs
  ): Promise<GetUserActivityTimelineReturns> {
    return withSmartCache(
      'getUserActivityTimeline',
      'getUserActivityTimeline',
      async () => {
        const limit = args.p_limit ?? 20;
        const offset = args.p_offset ?? 0;

        // Build where clause (only submissions exist, posts/comments/votes not implemented)
        // Filter by type if provided (only 'submission' is valid, but all are submissions anyway)
        const whereClause: {
          submitter_id: string;
        } = {
          submitter_id: args.p_user_id,
        };

        // Fetch submissions with pagination (fetch one extra to check has_more)
        const [submissions, totalCount] = await Promise.all([
          prisma.content_submissions.findMany({
            where: whereClause,
            orderBy: { created_at: 'desc' },
            take: limit + 1, // Fetch one extra to check has_more
            skip: offset,
            select: {
              id: true,
              name: true,
              description: true,
              submission_type: true,
              status: true,
              approved_slug: true,
              created_at: true,
              updated_at: true,
            },
          }),
          prisma.content_submissions.count({
            where: whereClause,
          }),
        ]);

        // Check if there are more items
        const hasMore = submissions.length > limit;
        const items = hasMore ? submissions.slice(0, limit) : submissions;

        // Transform to match RPC return structure (UserActivityTimelineResult)
        return {
          activities: items.map((submission) => ({
            id: submission.id,
            type: 'submission',
            title: submission.name,
            body: null, // Not available in content_submissions
            vote_type: null, // Not applicable
            content_type: submission.submission_type ? String(submission.submission_type) : null,
            content_slug: null, // Not available in content_submissions
            post_id: null, // Not applicable
            parent_id: null, // Not applicable
            submission_url: submission.approved_slug ?? '',
            description: submission.description,
            status: submission.status ? String(submission.status) : null,
            user_id: args.p_user_id,
            created_at: submission.created_at.toISOString(),
            updated_at: submission.updated_at.toISOString(),
          })),
          has_more: hasMore,
          total: totalCount,
        };
      },
      args
    );
  }

  /**
   * Get user identities
   *
   * OPTIMIZATION: Uses Prisma directly instead of RPC for better type safety and performance.
   * The RPC was doing a simple SELECT from auth.identities, which Prisma handles perfectly.
   *
   * @param args - Arguments with p_user_id
   * @returns User identities matching RPC return structure
   */
  async getUserIdentities(args: GetUserIdentitiesArgs): Promise<GetUserIdentitiesReturns> {
    return withSmartCache(
      'getUserIdentities',
      'getUserIdentities',
      async () => {
        const identities = await prisma.identities.findMany({
          where: { user_id: args.p_user_id },
          select: {
            provider: true,
            email: true,
            created_at: true,
            last_sign_in_at: true,
          },
          orderBy: { created_at: 'asc' },
        });

        // Transform to match RPC return structure (UserIdentitiesResult)
        return {
          identities: identities.map((identity) => ({
            provider: identity.provider,
            email: identity.email,
            created_at: identity.created_at?.toISOString() ?? null,
            last_sign_in_at: identity.last_sign_in_at?.toISOString() ?? null,
          })),
        };
      },
      args
    );
  }

  /**
   * Get user complete data
   *
   * OPTIMIZATION: Uses Prisma directly by calling individual service methods instead of RPC.
   * The RPC was calling other RPCs (get_user_settings, get_user_identities, etc.) which have
   * all been converted to Prisma. This method now calls the Prisma-based service methods directly.
   *
   * @param args - Arguments with p_user_id, p_activity_limit, p_activity_offset, p_activity_type
   * @returns User complete data matching RPC return structure
   */
  async getUserCompleteData(args: GetUserCompleteDataArgs): Promise<GetUserCompleteDataReturns> {
    // Optimized: Use request-scoped caching to prevent duplicate calls within same request
    // This is especially important since getUserCompleteData is called by multiple
    // functions (getAccountDashboard, getUserLibrary, getUserSettings, etc.)
    return withSmartCache(
      'get_user_complete_data',
      'getUserCompleteData',
      async () => {
        // Call all individual service methods in parallel (they all use Prisma directly)
        const [
          accountDashboard,
          userDashboard,
          userSettings,
          activitySummary,
          activityTimeline,
          userLibrary,
          userIdentities,
          sponsorships,
        ] = await Promise.all([
          this.getAccountDashboard({ p_user_id: args.p_user_id }),
          this.getUserDashboard({ p_user_id: args.p_user_id }),
          this.getUserSettings({ p_user_id: args.p_user_id }),
          this.getUserActivitySummary({ p_user_id: args.p_user_id }),
          this.getUserActivityTimeline({
            p_user_id: args.p_user_id,
            ...(args.p_activity_type ? { p_type: args.p_activity_type } : {}),
            p_limit: args.p_activity_limit ?? 20,
            p_offset: args.p_activity_offset ?? 0,
          }),
          this.getUserLibrary({ p_user_id: args.p_user_id }),
          this.getUserIdentities({ p_user_id: args.p_user_id }),
          this.getUserSponsorships({ p_user_id: args.p_user_id }),
        ]);

        // Build the composite result matching the RPC return structure
        return {
          account_dashboard: accountDashboard,
          user_dashboard: userDashboard,
          user_settings: userSettings,
          activity_summary: activitySummary,
          activity_timeline: activityTimeline,
          user_library: userLibrary,
          user_identities: userIdentities,
          // Type assertion required: GetUserCompleteDataReturns['sponsorships'] is unknown[] | null
          // because the database type generator couldn't determine the exact structure.
          // getUserSponsorships() returns GetUserSponsorshipsReturns (unknown[]), which matches
          // the expected type structure, but TypeScript can't verify this without the assertion.
          // TODO: Improve database type generation to properly type sponsored_content in composite types
          sponsorships: sponsorships as GetUserCompleteDataReturns['sponsorships'],
        };
      },
      args
    );
  }

  async batchInsertUserInteractions(
    args: BatchInsertUserInteractionsArgs
  ): Promise<BatchInsertUserInteractionsReturns> {
    // Mutations don't use caching
    return this.callRpc<BatchInsertUserInteractionsReturns>(
      'batch_insert_user_interactions',
      args,
      { methodName: 'batchInsertUserInteractions', useCache: false }
    );
  }
}
