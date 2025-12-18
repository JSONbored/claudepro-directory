/**
 * Account Service - Prisma Implementation
 *
 * Migrated from Supabase client to Prisma ORM.
 * Maintains the same public API for backward compatibility.
 */

import type {
  BatchInsertUserInteractionsArgs,
  BatchInsertUserInteractionsReturns,
  GetAccountDashboardArgs,
  GetAccountDashboardReturns,
  GetUserLibraryArgs,
  GetUserLibraryReturns,
  GetUserDashboardArgs,
  GetUserDashboardReturns,
  GetCollectionDetailWithItemsArgs,
  GetCollectionDetailWithItemsReturns,
  GetUserSettingsArgs,
  GetUserSettingsReturns,
  GetSponsorshipAnalyticsArgs,
  GetSponsorshipAnalyticsReturns,
  GetUserCompaniesArgs,
  GetUserCompaniesReturns,
  GetUserSponsorshipsArgs,
  GetUserSponsorshipsReturns,
  GetSubmissionDashboardArgs,
  GetSubmissionDashboardReturns,
  GetUserActivitySummaryArgs,
  GetUserActivitySummaryReturns,
  GetUserActivityTimelineArgs,
  GetUserActivityTimelineReturns,
  GetUserIdentitiesArgs,
  GetUserIdentitiesReturns,
  GetUserCompleteDataArgs,
  GetUserCompleteDataReturns,
} from '@heyclaude/database-types/postgres-types';
import type { content_category } from '@heyclaude/data-layer/prisma';
import { prisma } from '../prisma/client.ts';

// Local types for converted RPCs (RPCs removed, using Prisma directly)
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
  p_items: Array<{ content_type: content_category; content_slug: string }> | Record<string, unknown>;
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
import { BasePrismaService } from './base-prisma-service.ts';
import { withSmartCache } from '../utils/request-cache.ts';

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
  ): Promise<GetAccountDashboardReturns> {
    return withSmartCache(
      'getAccountDashboard',
      'getAccountDashboard',
      async () => {
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
              tier: 'free',
              created_at: new Date().toISOString(),
            },
          };
        }

        // Transform to match RPC return structure (AccountDashboardResult)
        return {
          bookmark_count: user.bookmark_count ?? 0,
          profile: {
            name: user.name,
            tier: user.tier ?? 'free',
            created_at: user.created_at.toISOString(),
          },
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
  async getUserLibrary(
    args: GetUserLibraryArgs
  ): Promise<GetUserLibraryReturns> {
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
  async getUserDashboard(
    args: GetUserDashboardArgs
  ): Promise<GetUserDashboardReturns> {
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
          companies: companies.length > 0 ? companies as unknown as Record<string, unknown> : null,
          // Note: job_billing_summary is a view, not a Prisma relation
          // For now, return jobs without billing summary (can be added later with raw SQL if needed)
          jobs: jobs.length > 0 ? jobs as unknown as Record<string, unknown> : null,
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
          relationLoadStrategy: 'join' // Use JOIN for better performance (requires relationJoins preview feature)
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
  async getUserSettings(
    args: GetUserSettingsArgs
  ): Promise<GetUserSettingsReturns> {
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

        // Calculate date range (last 30 days from today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29); // 29 days ago + today = 30 days

        // OPTIMIZATION: Use groupBy with raw SQL for date grouping instead of fetching all records
        // This is more efficient for large datasets and reduces data transfer
        // Note: Prisma groupBy doesn't support DATE() function directly, so we use $queryRawUnsafe
        const [impressionsGrouped, clicksGrouped] = await Promise.all([
          prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
            `
            SELECT 
              DATE(created_at)::text as date,
              COUNT(*)::bigint as count
            FROM public.user_interactions
            WHERE interaction_type = 'sponsored_impression'
              AND content_slug = $1
              AND created_at >= $2
              AND created_at <= $3
            GROUP BY DATE(created_at)
            ORDER BY date ASC
            `,
            args.p_sponsorship_id,
            thirtyDaysAgo,
            today
          ),
          prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
            `
            SELECT 
              DATE(created_at)::text as date,
              COUNT(*)::bigint as count
            FROM public.user_interactions
            WHERE interaction_type = 'sponsored_click'
              AND content_slug = $1
              AND created_at >= $2
              AND created_at <= $3
            GROUP BY DATE(created_at)
            ORDER BY date ASC
            `,
            args.p_sponsorship_id,
            thirtyDaysAgo,
            today
          ),
        ]);

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

        // Generate all dates in the last 30 days and build daily_stats array
        const dailyStats: Array<{
          date: string | null;
          impressions: number | null;
          clicks: number | null;
        }> = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0]!;
          const stats = dailyStatsMap.get(dateKey) || { impressions: 0, clicks: 0 };
          dailyStats.push({
            date: dateKey,
            impressions: stats.impressions,
            clicks: stats.clicks,
          });
        }

        // Calculate computed metrics
        const startDate = new Date(sponsorship.start_date);
        startDate.setHours(0, 0, 0, 0);
        const daysActive = Math.max(
          0,
          Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        );

        const impressionCount = sponsorship.impression_count ?? 0;
        const clickCount = sponsorship.click_count ?? 0;

        const ctr =
          impressionCount > 0
            ? Math.round((clickCount / impressionCount) * 100 * 100) / 100
            : 0;

        const avgImpressionsPerDay =
          daysActive > 0 ? Math.round(impressionCount / daysActive) : 0;

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
  async getUserCompanies(
    args: GetUserCompaniesArgs
  ): Promise<GetUserCompaniesReturns> {
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
          relationLoadStrategy: 'join' // Use JOIN for better performance (requires relationJoins preview feature)
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
          const latestJobPostedAt = company.jobs.length > 0
            ? company.jobs.reduce((latest, j) => {
                const jobDate = j.created_at;
                return !latest || (jobDate && jobDate > latest) ? jobDate : latest;
              }, null as Date | null)
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
  async getUserSponsorships(
    args: GetUserSponsorshipsArgs
  ): Promise<GetUserSponsorshipsReturns> {
    return withSmartCache(
      'getUserSponsorships',
      'getUserSponsorships',
      async () => {
        const sponsorships = await prisma.sponsored_content.findMany({
          where: { user_id: args.p_user_id },
          orderBy: { created_at: 'desc' },
        });
        // GetUserSponsorshipsReturns is unknown[], cast through unknown first to avoid type errors
        return sponsorships as unknown as GetUserSponsorshipsReturns;
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

        // Calculate week start for "merged this week" filter
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week (Sunday)
        weekStart.setHours(0, 0, 0, 0);

        // Fetch stats, recent merged submissions, and top contributors in parallel
        const [totalCount, pendingCount, mergedThisWeekCount, recentMerged, topContributors] = await Promise.all([
          prisma.content_submissions.count(),
          prisma.content_submissions.count({
            where: { status: 'pending' },
          }),
          prisma.content_submissions.count({
            where: {
              status: 'approved', // RPC SQL uses 'approved'::submission_status
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
        
        const users = allUserIds.length > 0
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
            merged_this_week: mergedThisWeekCount,
          },
          recent: recentMerged.map((submission) => {
            const user = submission.submitter_id ? usersMap.get(submission.submitter_id) : null;
            return {
              id: submission.id,
              content_name: submission.name,
              content_type: submission.submission_type, // submission_type enum matches expected type
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
              const user = contributor.submitter_id
                ? usersMap.get(contributor.submitter_id)
                : null;
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
  async isBookmarked(
    args: IsBookmarkedArgs
  ): Promise<boolean> {
    return withSmartCache(
      'isBookmarked',
      'isBookmarked',
      async () => {
        const bookmark = await prisma.bookmarks.findFirst({
          where: {
            user_id: args.p_user_id,
            content_type: args.p_content_type as content_category,
            content_slug: args.p_content_slug,
          },
          select: { id: true }, // Only need to check existence
        });
        return bookmark !== null;
      },
      args
    );
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
  async isBookmarkedBatch(
    args: IsBookmarkedBatchArgs
  ): Promise<IsBookmarkedBatchReturns> {
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
          if ('items' in args.p_items && Array.isArray((args.p_items as Record<string, unknown>)['items'])) {
            // Validate and cast items from JSONB
            const rawItems = (args.p_items as Record<string, unknown>)['items'] as Array<{ content_type: unknown; content_slug: unknown }>;
            items = rawItems.map((item) => ({
              content_type: item.content_type as content_category,
              content_slug: String(item.content_slug),
            }));
          } else {
            // Single item wrapped in object - validate and cast
            const rawItem = args.p_items as { content_type: unknown; content_slug: unknown };
            items = [{
              content_type: rawItem.content_type as content_category,
              content_slug: String(rawItem.content_slug),
            }];
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
        const bookmarkSet = new Set(
          bookmarks.map((b) => `${b.content_type}:${b.content_slug}`)
        );

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
  async isFollowing(
    args: IsFollowingArgs
  ): Promise<boolean> {
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
  async isFollowingBatch(
    args: IsFollowingBatchArgs
  ): Promise<IsFollowingBatchReturns> {
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
  async getUserIdentities(
    args: GetUserIdentitiesArgs
  ): Promise<GetUserIdentitiesReturns> {
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

  async getUserCompleteData(
    args: GetUserCompleteDataArgs
  ): Promise<GetUserCompleteDataReturns> {
    // Optimized: Use request-scoped caching to prevent duplicate calls within same request
    // This is especially important since getUserCompleteData is called by multiple
    // functions (getAccountDashboard, getUserLibrary, getUserSettings, etc.)
    return withSmartCache(
      'get_user_complete_data',
      'getUserCompleteData',
      async () => {
        return this.callRpc<GetUserCompleteDataReturns>(
          'get_user_complete_data',
          args,
          { methodName: 'getUserCompleteData', useCache: false } // Disable callRpc cache since we use withSmartCache
        );
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
