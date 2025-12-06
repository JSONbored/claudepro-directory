/**
 * SearchService - Prisma-based service for search operations
 * 
 * This service replaces the Supabase-based SearchService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/search.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';

/**
 * Arguments for search_unified RPC
 * 
 * @property p_query - Search query string
 * @property p_entities - Array of entity types to search
 * @property p_limit - Limit for results
 * @property p_offset - Offset for pagination
 */
export interface SearchUnifiedArgs {
  p_query: string;
  p_entities: string[];
  p_limit: number;
  p_offset: number;
}

/**
 * Arguments for search_content_optimized RPC
 * 
 * @property p_query - Search query string
 * @property p_categories - Optional array of categories to filter
 * @property p_tags - Optional array of tags to filter
 * @property p_authors - Optional array of authors to filter
 * @property p_sort - Sort option (defaults to 'relevance')
 * @property p_limit - Limit for results
 * @property p_offset - Offset for pagination
 */
export interface SearchContentArgs {
  p_query: string;
  p_categories?: string[] | null;
  p_tags?: string[] | null;
  p_authors?: string[] | null;
  p_sort?: string | null;
  p_limit: number;
  p_offset: number;
}

/**
 * Arguments for filter_jobs RPC
 * 
 * @property p_search_query - Optional search query
 * @property p_category - Optional job category filter
 * @property p_employment_type - Optional employment type filter
 * @property p_experience_level - Optional experience level filter
 * @property p_remote_only - Optional remote-only filter
 * @property p_limit - Limit for results
 * @property p_offset - Offset for pagination
 */
export interface FilterJobsArgs {
  p_search_query?: string | null;
  p_category?: string | null;
  p_employment_type?: string | null;
  p_experience_level?: string | null;
  p_remote_only?: boolean | null;
  p_limit: number;
  p_offset: number;
}

/**
 * Prisma-based SearchService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class SearchService {
  /**
   * Calls the database RPC: search_unified
   * 
   * @param args - RPC function arguments
   * @param args.p_query - Search query string
   * @param args.p_entities - Array of entity types to search
   * @param args.p_limit - Limit for results
   * @param args.p_offset - Offset for pagination
   * @returns Search results with total count
   */
  async searchUnified(args: SearchUnifiedArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query(
          'SELECT * FROM search_unified($1, $2, $3, $4)',
          [args.p_query, args.p_entities, args.p_limit, args.p_offset]
        );
        return { data: rows, total_count: rows.length };
      });
    } catch (error) {
      console.error('[SearchService] searchUnified error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: search_content_optimized
   * 
   * @param args - RPC function arguments
   * @param args.p_query - Search query string
   * @param args.p_categories - Optional array of categories to filter
   * @param args.p_tags - Optional array of tags to filter
   * @param args.p_authors - Optional array of authors to filter
   * @param args.p_sort - Sort option (defaults to 'relevance')
   * @param args.p_limit - Limit for results
   * @param args.p_offset - Offset for pagination
   * @returns Search results with total count
   */
  async searchContent(args: SearchContentArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter for p_sort ('relevance')
        const params: unknown[] = [args.p_query];
        let paramIndex = 2;
        let query = 'SELECT * FROM search_content_optimized($1';

        if (args.p_categories !== undefined && args.p_categories !== null && args.p_categories.length > 0) {
          query += `, $${paramIndex}`;
          params.push(args.p_categories);
          paramIndex++;
        } else if (
          args.p_tags !== undefined ||
          args.p_authors !== undefined ||
          args.p_sort !== undefined ||
          args.p_limit !== undefined ||
          args.p_offset !== undefined
        ) {
          query += ', NULL';
        }

        if (args.p_tags !== undefined && args.p_tags !== null && args.p_tags.length > 0) {
          query += `, $${paramIndex}`;
          params.push(args.p_tags);
          paramIndex++;
        } else if (
          args.p_authors !== undefined ||
          args.p_sort !== undefined ||
          args.p_limit !== undefined ||
          args.p_offset !== undefined
        ) {
          query += ', NULL';
        }

        if (args.p_authors !== undefined && args.p_authors !== null && args.p_authors.length > 0) {
          query += `, $${paramIndex}`;
          params.push(args.p_authors);
          paramIndex++;
        } else if (args.p_sort !== undefined || args.p_limit !== undefined || args.p_offset !== undefined) {
          query += ', NULL';
        }

        if (args.p_sort !== undefined && args.p_sort !== null && args.p_sort !== 'relevance') {
          query += `, $${paramIndex}`;
          params.push(args.p_sort);
          paramIndex++;
        } else if (args.p_limit !== undefined || args.p_offset !== undefined) {
          query += ", 'relevance'";
        }

        if (args.p_limit !== undefined) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
          paramIndex++;
        }

        if (args.p_offset !== undefined) {
          query += `, $${paramIndex}`;
          params.push(args.p_offset);
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return { data: rows, total_count: rows.length };
      });
    } catch (error) {
      console.error('[SearchService] searchContent error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: filter_jobs
   * 
   * @param args - RPC function arguments
   * @param args.p_search_query - Optional search query
   * @param args.p_category - Optional job category filter
   * @param args.p_employment_type - Optional employment type filter
   * @param args.p_experience_level - Optional experience level filter
   * @param args.p_remote_only - Optional remote-only filter
   * @param args.p_limit - Limit for results
   * @param args.p_offset - Offset for pagination
   * @returns Filtered jobs with total count
   */
  async filterJobs(args: FilterJobsArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has many optional parameters - build query based on provided args
        const params: unknown[] = [];
        let paramIndex = 1;
        let query = 'SELECT * FROM filter_jobs(';

        if (args.p_search_query !== undefined && args.p_search_query !== null) {
          query += `$${paramIndex}`;
          params.push(args.p_search_query);
          paramIndex++;
        } else {
          query += 'NULL';
        }

        if (args.p_category !== undefined && args.p_category !== null) {
          query += `, $${paramIndex}`;
          params.push(args.p_category);
          paramIndex++;
        } else if (
          args.p_employment_type !== undefined ||
          args.p_experience_level !== undefined ||
          args.p_remote_only !== undefined ||
          args.p_limit !== undefined ||
          args.p_offset !== undefined
        ) {
          query += ', NULL';
        }

        if (args.p_employment_type !== undefined && args.p_employment_type !== null) {
          query += `, $${paramIndex}`;
          params.push(args.p_employment_type);
          paramIndex++;
        } else if (
          args.p_experience_level !== undefined ||
          args.p_remote_only !== undefined ||
          args.p_limit !== undefined ||
          args.p_offset !== undefined
        ) {
          query += ', NULL';
        }

        if (args.p_experience_level !== undefined && args.p_experience_level !== null) {
          query += `, $${paramIndex}`;
          params.push(args.p_experience_level);
          paramIndex++;
        } else if (args.p_remote_only !== undefined || args.p_limit !== undefined || args.p_offset !== undefined) {
          query += ', NULL';
        }

        if (args.p_remote_only !== undefined && args.p_remote_only !== null) {
          query += `, $${paramIndex}`;
          params.push(args.p_remote_only);
          paramIndex++;
        } else if (args.p_limit !== undefined || args.p_offset !== undefined) {
          query += ', NULL';
        }

        if (args.p_limit !== undefined) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
          paramIndex++;
        }

        if (args.p_offset !== undefined) {
          query += `, $${paramIndex}`;
          params.push(args.p_offset);
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return { jobs: rows, total_count: rows.length };
      });
    } catch (error) {
      console.error('[SearchService] filterJobs error:', error);
      throw error;
    }
  }
}
