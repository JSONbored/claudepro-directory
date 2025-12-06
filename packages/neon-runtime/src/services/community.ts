/**
 * CommunityService - Prisma-based service for community operations
 * 
 * This service replaces the Supabase-based CommunityService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/community.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';

/**
 * Arguments for get_community_directory RPC
 * 
 * @property p_search_query - Optional search query (defaults to NULL)
 * @property p_limit - Optional limit for results (defaults to 100)
 */
export interface GetCommunityDirectoryArgs {
  p_search_query?: string | null;
  p_limit?: number | null;
}

/**
 * Arguments for get_user_profile RPC
 * 
 * @property p_user_slug - User slug
 * @property p_viewer_id - Optional viewer user ID (UUID)
 */
export interface GetUserProfileArgs {
  p_user_slug: string;
  p_viewer_id?: string | null;
}

/**
 * Arguments for get_user_collection_detail RPC
 * 
 * @property p_user_slug - User slug
 * @property p_collection_slug - Collection slug
 * @property p_viewer_id - Optional viewer user ID (UUID)
 */
export interface GetUserCollectionDetailArgs {
  p_user_slug: string;
  p_collection_slug: string;
  p_viewer_id?: string | null;
}

/**
 * Prisma-based CommunityService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class CommunityService {
  /**
   * Calls the database RPC: get_community_directory
   * 
   * @param args - RPC function arguments
   * @param args.p_search_query - Optional search query (defaults to NULL)
   * @param args.p_limit - Optional limit for results (defaults to 100)
   * @returns Community directory result or null if not found
   */
  async getCommunityDirectory(args: GetCommunityDirectoryArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters: p_search_query (NULL), p_limit (100)
        const hasSearch = args.p_search_query !== undefined && args.p_search_query !== null;
        const hasLimit = args.p_limit !== undefined && args.p_limit !== null;

        let query = 'SELECT * FROM get_community_directory(';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (hasSearch) {
          query += `$${paramIndex}`;
          params.push(args.p_search_query);
          paramIndex++;
        } else {
          query += 'NULL';
        }

        if (hasLimit) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
        } else if (hasSearch) {
          query += ', 100'; // default
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[CommunityService] getCommunityDirectory error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_user_profile
   * 
   * @param args - RPC function arguments
   * @param args.p_user_slug - User slug
   * @param args.p_viewer_id - Optional viewer user ID (UUID, defaults to NULL)
   * @returns User profile or null if not found
   */
  async getUserProfile(args: GetUserProfileArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter for p_viewer_id
        const query =
          args.p_viewer_id !== undefined && args.p_viewer_id !== null
            ? 'SELECT * FROM get_user_profile($1, $2)'
            : 'SELECT * FROM get_user_profile($1)';
        const params =
          args.p_viewer_id !== undefined && args.p_viewer_id !== null
            ? [args.p_user_slug, args.p_viewer_id]
            : [args.p_user_slug];
        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[CommunityService] getUserProfile error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_user_collection_detail
   * 
   * @param args - RPC function arguments
   * @param args.p_user_slug - User slug
   * @param args.p_collection_slug - Collection slug
   * @param args.p_viewer_id - Optional viewer user ID (UUID, defaults to NULL)
   * @returns User collection detail or null if not found
   */
  async getUserCollectionDetail(args: GetUserCollectionDetailArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter for p_viewer_id
        const query =
          args.p_viewer_id !== undefined && args.p_viewer_id !== null
            ? 'SELECT * FROM get_user_collection_detail($1, $2, $3)'
            : 'SELECT * FROM get_user_collection_detail($1, $2)';
        const params =
          args.p_viewer_id !== undefined && args.p_viewer_id !== null
            ? [args.p_user_slug, args.p_collection_slug, args.p_viewer_id]
            : [args.p_user_slug, args.p_collection_slug];
        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[CommunityService] getUserCollectionDetail error:', error);
      throw error;
    }
  }
}
