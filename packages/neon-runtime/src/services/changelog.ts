/**
 * ChangelogService - Prisma-based service for changelog operations
 * 
 * This service replaces the Supabase-based ChangelogService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/changelog.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';

/**
 * Arguments for get_changelog_overview RPC
 * 
 * @property p_category - Optional category filter
 * @property p_published_only - Optional filter for published only (defaults to true)
 * @property p_featured_only - Optional filter for featured only (defaults to false)
 * @property p_limit - Optional limit for results (defaults to 50)
 * @property p_offset - Optional offset for pagination (defaults to 0)
 */
export interface GetChangelogOverviewArgs {
  p_category?: string | null;
  p_published_only?: boolean | null;
  p_featured_only?: boolean | null;
  p_limit?: number | null;
  p_offset?: number | null;
}

/**
 * Arguments for get_changelog_detail RPC
 * 
 * @property p_slug - Changelog entry slug
 */
export interface GetChangelogDetailArgs {
  p_slug: string;
}

/**
 * Arguments for get_changelog_with_category_stats RPC
 * 
 * @property p_category - Optional category filter
 * @property p_limit - Optional limit for results (defaults to 1000)
 * @property p_offset - Optional offset for pagination (defaults to 0)
 */
export interface GetChangelogWithCategoryStatsArgs {
  p_category?: string | null;
  p_limit?: number | null;
  p_offset?: number | null;
}

/**
 * Prisma-based ChangelogService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class ChangelogService {
  /**
   * Calls the database RPC: get_changelog_overview
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Optional category filter
   * @param args.p_published_only - Optional filter for published only (defaults to true)
   * @param args.p_featured_only - Optional filter for featured only (defaults to false)
   * @param args.p_limit - Optional limit for results (defaults to 50)
   * @param args.p_offset - Optional offset for pagination (defaults to 0)
   * @returns Array of changelog overview entries
   */
  async getChangelogOverview(args: GetChangelogOverviewArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters, build query based on provided args
        const params: unknown[] = [];
        let paramIndex = 1;
        let query = 'SELECT * FROM get_changelog_overview(';

        if (args.p_category !== undefined) {
          query += `$${paramIndex}`;
          params.push(args.p_category);
          paramIndex++;
        } else {
          query += 'NULL';
        }

        if (args.p_published_only !== undefined) {
          query += `, $${paramIndex}`;
          params.push(args.p_published_only);
          paramIndex++;
        } else if (args.p_featured_only !== undefined || args.p_limit !== undefined || args.p_offset !== undefined) {
          query += ', true'; // default
        }

        if (args.p_featured_only !== undefined) {
          query += `, $${paramIndex}`;
          params.push(args.p_featured_only);
          paramIndex++;
        } else if (args.p_limit !== undefined || args.p_offset !== undefined) {
          query += ', false'; // default
        }

        if (args.p_limit !== undefined) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
          paramIndex++;
        } else if (args.p_offset !== undefined) {
          query += ', 50'; // default
        }

        if (args.p_offset !== undefined) {
          query += `, $${paramIndex}`;
          params.push(args.p_offset);
        } else if (args.p_limit !== undefined) {
          query += ', 0'; // default
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return rows;
      });
    } catch (error) {
      console.error('[ChangelogService] getChangelogOverview error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_changelog_detail
   * 
   * @param args - RPC function arguments
   * @param args.p_slug - Changelog entry slug
   * @returns Changelog detail or null if not found
   */
  async getChangelogDetail(args: GetChangelogDetailArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_changelog_detail($1)', [
          args.p_slug,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ChangelogService] getChangelogDetail error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_changelog_with_category_stats
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Optional category filter
   * @param args.p_limit - Optional limit for results (defaults to 1000)
   * @param args.p_offset - Optional offset for pagination (defaults to 0)
   * @returns Changelog entries with category statistics or null if not found
   */
  async getChangelogWithCategoryStats(args: GetChangelogWithCategoryStatsArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters, build query based on provided args
        const params: unknown[] = [];
        let paramIndex = 1;
        let query = 'SELECT * FROM get_changelog_with_category_stats(';

        if (args.p_category !== undefined) {
          query += `$${paramIndex}`;
          params.push(args.p_category);
          paramIndex++;
        } else {
          query += 'NULL';
        }

        if (args.p_limit !== undefined) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
          paramIndex++;
        } else if (args.p_offset !== undefined) {
          query += ', 1000'; // default
        }

        if (args.p_offset !== undefined) {
          query += `, $${paramIndex}`;
          params.push(args.p_offset);
        } else if (args.p_limit !== undefined) {
          query += ', 0'; // default
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ChangelogService] getChangelogWithCategoryStats error:', error);
      throw error;
    }
  }
}
