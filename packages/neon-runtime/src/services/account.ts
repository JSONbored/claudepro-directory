/**
 * AccountService - Prisma-based service for user account operations
 * 
 * This service replaces the Supabase-based AccountService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/account.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';
import type { ContentCategory } from '../types';

/**
 * Arguments for get_account_dashboard RPC
 * 
 * @property p_user_id - User ID (UUID)
 */
export interface GetAccountDashboardArgs {
  p_user_id: string;
}

/**
 * Arguments for get_user_library RPC
 * 
 * @property p_user_id - User ID (UUID)
 */
export interface GetUserLibraryArgs {
  p_user_id: string;
}

/**
 * Arguments for get_user_dashboard RPC
 * 
 * @property p_user_id - User ID (UUID)
 */
export interface GetUserDashboardArgs {
  p_user_id: string;
}

/**
 * Arguments for get_collection_detail_with_items RPC
 * 
 * @property p_user_id - User ID (UUID)
 * @property p_slug - Collection slug
 */
export interface GetCollectionDetailWithItemsArgs {
  p_user_id: string;
  p_slug: string;
}

/**
 * Arguments for get_user_settings RPC
 * 
 * @property p_user_id - User ID (UUID)
 */
export interface GetUserSettingsArgs {
  p_user_id: string;
}

/**
 * Arguments for get_sponsorship_analytics RPC
 * 
 * @property p_sponsorship_id - Sponsorship ID (UUID)
 * @property p_user_id - User ID (UUID)
 */
export interface GetSponsorshipAnalyticsArgs {
  p_sponsorship_id: string;
  p_user_id: string;
}

/**
 * Arguments for get_user_companies RPC
 * 
 * @property p_user_id - User ID (UUID)
 */
export interface GetUserCompaniesArgs {
  p_user_id: string;
}

/**
 * Arguments for get_user_sponsorships RPC
 * 
 * @property p_user_id - User ID (UUID)
 */
export interface GetUserSponsorshipsArgs {
  p_user_id: string;
}

/**
 * Arguments for get_submission_dashboard RPC
 * 
 * @property p_recent_limit - Optional limit for recent submissions (defaults to 5)
 * @property p_contributors_limit - Optional limit for contributors (defaults to 5)
 */
export interface GetSubmissionDashboardArgs {
  p_recent_limit?: number;
  p_contributors_limit?: number;
}

/**
 * Arguments for is_bookmarked RPC
 * 
 * @property p_user_id - User ID (UUID)
 * @property p_content_type - Content category enum value
 * @property p_content_slug - Content slug
 */
export interface IsBookmarkedArgs {
  p_user_id: string;
  p_content_type: ContentCategory;
  p_content_slug: string;
}

/**
 * Arguments for is_bookmarked_batch RPC
 * 
 * @property p_user_id - User ID (UUID)
 * @property p_items - JSONB array of {content_type, content_slug} objects
 */
export interface IsBookmarkedBatchArgs {
  p_user_id: string;
  p_items: unknown; // jsonb - array of {content_type, content_slug}
}

/**
 * Arguments for is_following RPC
 * 
 * @property follower_id - Follower user ID (UUID)
 * @property following_id - User being followed ID (UUID)
 */
export interface IsFollowingArgs {
  follower_id: string;
  following_id: string;
}

/**
 * Arguments for is_following_batch RPC
 * 
 * @property p_follower_id - Follower user ID (UUID)
 * @property p_followed_user_ids - Array of user IDs being checked (UUID[])
 */
export interface IsFollowingBatchArgs {
  p_follower_id: string;
  p_followed_user_ids: string[];
}

/**
 * Arguments for get_user_activity_summary RPC
 * 
 * @property p_user_id - User ID (UUID)
 */
export interface GetUserActivitySummaryArgs {
  p_user_id: string;
}

/**
 * Arguments for get_user_activity_timeline RPC
 * 
 * @property p_user_id - User ID (UUID)
 * @property p_type - Optional activity type filter (defaults to NULL)
 * @property p_limit - Optional limit for results (defaults to 20)
 * @property p_offset - Optional offset for pagination (defaults to 0)
 */
export interface GetUserActivityTimelineArgs {
  p_user_id: string;
  p_type?: string | null;
  p_limit?: number;
  p_offset?: number;
}

/**
 * Arguments for get_user_identities RPC
 * 
 * @property p_user_id - User ID (UUID)
 */
export interface GetUserIdentitiesArgs {
  p_user_id: string;
}

/**
 * Prisma-based AccountService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class AccountService {
  /**
   * Calls the database RPC: get_account_dashboard
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @returns Account dashboard data or null if not found
   */
  async getAccountDashboard(args: GetAccountDashboardArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_account_dashboard($1)', [
          args.p_user_id,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[AccountService] getAccountDashboard error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_user_library
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @returns User library data or null if not found
   */
  async getUserLibrary(args: GetUserLibraryArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_user_library($1)', [
          args.p_user_id,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[AccountService] getUserLibrary error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_user_dashboard
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @returns User dashboard data or null if not found
   */
  async getUserDashboard(args: GetUserDashboardArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_user_dashboard($1)', [
          args.p_user_id,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[AccountService] getUserDashboard error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_collection_detail_with_items
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @param args.p_slug - Collection slug
   * @returns Collection detail with items or null if not found
   */
  async getCollectionDetailWithItems(args: GetCollectionDetailWithItemsArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query(
          'SELECT * FROM get_collection_detail_with_items($1, $2)',
          [args.p_user_id, args.p_slug]
        );
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[AccountService] getCollectionDetailWithItems error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_user_settings
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @returns User settings data or null if not found
   */
  async getUserSettings(args: GetUserSettingsArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_user_settings($1)', [
          args.p_user_id,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[AccountService] getUserSettings error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_sponsorship_analytics
   * 
   * @param args - RPC function arguments
   * @param args.p_sponsorship_id - Sponsorship ID (UUID)
   * @param args.p_user_id - User ID (UUID)
   * @returns Sponsorship analytics data or null if not found
   */
  async getSponsorshipAnalytics(args: GetSponsorshipAnalyticsArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query(
          'SELECT * FROM get_sponsorship_analytics($1, $2)',
          [args.p_sponsorship_id, args.p_user_id]
        );
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[AccountService] getSponsorshipAnalytics error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_user_companies
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @returns Array of user companies
   */
  async getUserCompanies(args: GetUserCompaniesArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_user_companies($1)', [
          args.p_user_id,
        ]);
        return rows;
      });
    } catch (error) {
      console.error('[AccountService] getUserCompanies error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_user_sponsorships
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @returns Array of user sponsorships
   */
  async getUserSponsorships(args: GetUserSponsorshipsArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_user_sponsorships($1)', [
          args.p_user_id,
        ]);
        return rows;
      });
    } catch (error) {
      console.error('[AccountService] getUserSponsorships error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_submission_dashboard
   * 
   * @param args - Optional RPC function arguments
   * @param args.p_recent_limit - Optional limit for recent submissions (defaults to 5)
   * @param args.p_contributors_limit - Optional limit for contributors (defaults to 5)
   * @returns Submission dashboard data or null if not found
   */
  async getSubmissionDashboard(args: GetSubmissionDashboardArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters, only pass if provided
        const hasArgs = args.p_recent_limit !== undefined || args.p_contributors_limit !== undefined;
        const query = hasArgs
          ? 'SELECT * FROM get_submission_dashboard($1, $2)'
          : 'SELECT * FROM get_submission_dashboard()';
        const params = hasArgs
          ? [args.p_recent_limit ?? 5, args.p_contributors_limit ?? 5]
          : [];
        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[AccountService] getSubmissionDashboard error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: is_bookmarked
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @param args.p_content_type - Content category enum value
   * @param args.p_content_slug - Content slug
   * @returns Bookmark status object or null if not found
   */
  async isBookmarked(args: IsBookmarkedArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM is_bookmarked($1, $2, $3)', [
          args.p_user_id,
          args.p_content_type,
          args.p_content_slug,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[AccountService] isBookmarked error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: is_bookmarked_batch
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @param args.p_items - JSONB array of {content_type, content_slug} objects
   * @returns Array of bookmark status results
   */
  async isBookmarkedBatch(args: IsBookmarkedBatchArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM is_bookmarked_batch($1, $2)', [
          args.p_user_id,
          JSON.stringify(args.p_items), // Convert to jsonb
        ]);
        return rows;
      });
    } catch (error) {
      console.error('[AccountService] isBookmarkedBatch error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: is_following
   * 
   * @param args - RPC function arguments
   * @param args.follower_id - Follower user ID (UUID)
   * @param args.following_id - User being followed ID (UUID)
   * @returns Boolean indicating if following relationship exists
   */
  async isFollowing(args: IsFollowingArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM is_following($1, $2)', [
          args.follower_id,
          args.following_id,
        ]);
        return rows[0]?.is_following ?? false;
      });
    } catch (error) {
      console.error('[AccountService] isFollowing error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: is_following_batch
   * 
   * @param args - RPC function arguments
   * @param args.p_follower_id - Follower user ID (UUID)
   * @param args.p_followed_user_ids - Array of user IDs being checked (UUID[])
   * @returns Array of following status results
   */
  async isFollowingBatch(args: IsFollowingBatchArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM is_following_batch($1, $2)', [
          args.p_follower_id,
          args.p_followed_user_ids,
        ]);
        return rows;
      });
    } catch (error) {
      console.error('[AccountService] isFollowingBatch error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_user_activity_summary
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @returns User activity summary or null if not found
   */
  async getUserActivitySummary(args: GetUserActivitySummaryArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_user_activity_summary($1)', [
          args.p_user_id,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[AccountService] getUserActivitySummary error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_user_activity_timeline
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @param args.p_type - Optional activity type filter (defaults to NULL)
   * @param args.p_limit - Optional limit for results (defaults to 20)
   * @param args.p_offset - Optional offset for pagination (defaults to 0)
   * @returns Array of activity timeline entries
   */
  async getUserActivityTimeline(args: GetUserActivityTimelineArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters: p_type (NULL), p_limit (20), p_offset (0)
        // Only pass parameters if they differ from defaults
        const hasType = args.p_type !== undefined && args.p_type !== null;
        const hasLimit = args.p_limit !== undefined && args.p_limit !== 20;
        const hasOffset = args.p_offset !== undefined && args.p_offset !== 0;

        if (hasType || hasLimit || hasOffset) {
          const params: unknown[] = [args.p_user_id];
          let paramIndex = 2;
          let query = 'SELECT * FROM get_user_activity_timeline($1';

          if (hasType) {
            query += `, $${paramIndex}`;
            params.push(args.p_type);
            paramIndex++;
          } else if (hasLimit || hasOffset) {
            query += ', NULL'; // p_type default
          }

          if (hasLimit) {
            query += `, $${paramIndex}`;
            params.push(args.p_limit);
            paramIndex++;
          } else if (hasOffset) {
            query += ', 20'; // p_limit default
          }

          if (hasOffset) {
            query += `, $${paramIndex}`;
            params.push(args.p_offset);
          }

          query += ')';
          const { rows } = await client.query(query, params);
          return rows;
        } else {
          // Use defaults for all optional parameters
          const { rows } = await client.query('SELECT * FROM get_user_activity_timeline($1)', [
            args.p_user_id,
          ]);
          return rows;
        }
      });
    } catch (error) {
      console.error('[AccountService] getUserActivityTimeline error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_user_identities
   * 
   * @param args - RPC function arguments
   * @param args.p_user_id - User ID (UUID)
   * @returns Array of user identity information
   */
  async getUserIdentities(args: GetUserIdentitiesArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_user_identities($1)', [
          args.p_user_id,
        ]);
        return rows;
      });
    } catch (error) {
      console.error('[AccountService] getUserIdentities error:', error);
      throw error;
    }
  }
}
