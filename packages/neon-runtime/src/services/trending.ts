/**
 * TrendingService - Prisma-based service for trending content
 * 
 * This service replaces the Supabase-based TrendingService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/trending.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';
import type { ContentCategory } from '../types';

/**
 * Arguments for get_trending_metrics_with_content RPC
 * 
 * @property p_category - Optional content category filter
 * @property p_limit - Optional limit for results (defaults to 20)
 */
export interface GetTrendingMetricsArgs {
  p_category?: ContentCategory | null;
  p_limit?: number | null;
}

/**
 * Arguments for get_popular_content RPC
 * 
 * @property p_category - Optional content category filter
 * @property p_limit - Optional limit for results (defaults to 12)
 */
export interface GetPopularContentArgs {
  p_category?: ContentCategory | null;
  p_limit?: number | null;
}

/**
 * Prisma-based TrendingService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class TrendingService {
  /**
   * Calls the database RPC: get_trending_metrics_with_content
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Optional content category filter
   * @param args.p_limit - Optional limit for results (defaults to 20)
   * @returns Array of trending metrics with content
   */
  async getTrendingMetrics(args: GetTrendingMetricsArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters: p_category (NULL), p_limit (20)
        const hasCategory = args.p_category !== undefined && args.p_category !== null;
        const hasLimit = args.p_limit !== undefined && args.p_limit !== null;

        let query = 'SELECT * FROM get_trending_metrics_with_content(';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (hasCategory) {
          query += `$${paramIndex}`;
          params.push(args.p_category);
          paramIndex++;
        } else {
          query += 'NULL';
        }

        if (hasLimit) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
        } else if (hasCategory) {
          query += ', 20'; // default
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return rows;
      });
    } catch (error) {
      console.error('[TrendingService] getTrendingMetrics error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_popular_content
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Optional content category filter
   * @param args.p_limit - Optional limit for results (defaults to 12)
   * @returns Array of popular content
   */
  async getPopularContent(args: GetPopularContentArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters: p_category (NULL), p_limit (12)
        const hasCategory = args.p_category !== undefined && args.p_category !== null;
        const hasLimit = args.p_limit !== undefined && args.p_limit !== null;

        let query = 'SELECT * FROM get_popular_content(';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (hasCategory) {
          query += `$${paramIndex}`;
          params.push(args.p_category);
          paramIndex++;
        } else {
          query += 'NULL';
        }

        if (hasLimit) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
        } else if (hasCategory) {
          query += ', 12'; // default
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return rows;
      });
    } catch (error) {
      console.error('[TrendingService] getPopularContent error:', error);
      throw error;
    }
  }
}
