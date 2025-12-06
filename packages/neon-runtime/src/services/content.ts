/**
 * ContentService - Prisma-based service for content operations
 * 
 * This service replaces the Supabase-based ContentService using Prisma + raw SQL.
 * Uses `withClient()` to call PostgreSQL RPC functions via Neon's serverless driver.
 * 
 * @see packages/data-layer/src/services/content.ts for Supabase version
 */

import { withClient } from '../client';
import type { PoolClient } from 'pg';
import type { ContentCategory } from '../types';

/**
 * Arguments for generate_category_llms_txt RPC
 * 
 * @property p_category - Content category enum value
 */
export interface GetCategoryLlmsTxtArgs {
  p_category: ContentCategory;
}

/**
 * Arguments for generate_changelog_entry_llms_txt RPC
 * 
 * @property p_slug - Changelog entry slug
 */
export interface GetChangelogEntryLlmsTxtArgs {
  p_slug: string;
}

/**
 * Arguments for generate_tool_llms_txt RPC
 * 
 * @property p_tool_name - Tool name
 */
export interface GetToolLlmsTxtArgs {
  p_tool_name: string;
}

/**
 * Arguments for get_api_content_full RPC
 * 
 * @property p_category - Content category enum value
 * @property p_slug - Content slug
 * @property p_base_url - Optional base URL (defaults to 'https://claudepro.directory')
 */
export interface GetApiContentFullArgs {
  p_category: ContentCategory;
  p_slug: string;
  p_base_url?: string | null;
}

/**
 * Arguments for get_content_detail_complete RPC
 * 
 * @property p_category - Content category enum value
 * @property p_slug - Content slug
 * @property p_user_id - Optional user ID (UUID)
 */
export interface GetContentDetailCompleteArgs {
  p_category: ContentCategory;
  p_slug: string;
  p_user_id?: string | null;
}

/**
 * Arguments for get_content_detail_core RPC
 * 
 * @property p_category - Content category enum value
 * @property p_slug - Content slug
 */
export interface GetContentDetailCoreArgs {
  p_category: ContentCategory;
  p_slug: string;
}

/**
 * Arguments for get_content_analytics RPC
 * 
 * @property p_category - Content category enum value
 * @property p_slug - Content slug
 * @property p_user_id - Optional user ID (UUID)
 */
export interface GetContentAnalyticsArgs {
  p_category: ContentCategory;
  p_slug: string;
  p_user_id?: string | null;
}

/**
 * Arguments for get_enriched_content_list RPC
 * 
 * @property p_category - Optional content category filter
 * @property p_slugs - Optional array of content slugs
 * @property p_limit - Optional limit for results (defaults to 100)
 * @property p_offset - Optional offset for pagination (defaults to 0)
 */
export interface GetEnrichedContentListArgs {
  p_category?: ContentCategory | null;
  p_slugs?: string[] | null;
  p_limit?: number | null;
  p_offset?: number | null;
}

/**
 * Arguments for get_content_paginated RPC
 * 
 * @property p_category - Optional content category filter
 * @property p_author - Optional author filter
 * @property p_tags - Optional tags array filter
 * @property p_search - Optional search query
 * @property p_order_by - Optional order by field (defaults to 'created_at')
 * @property p_order_direction - Optional order direction (defaults to 'desc')
 * @property p_limit - Optional limit for results (defaults to 20)
 * @property p_offset - Optional offset for pagination (defaults to 0)
 */
export interface GetContentPaginatedArgs {
  p_category?: string | null;
  p_author?: string | null;
  p_tags?: string[] | null;
  p_search?: string | null;
  p_order_by?: string | null;
  p_order_direction?: string | null;
  p_limit?: number | null;
  p_offset?: number | null;
}

/**
 * Arguments for get_content_paginated_slim RPC
 * 
 * @property p_category - Optional content category filter
 * @property p_limit - Optional limit for results (defaults to 30)
 * @property p_offset - Optional offset for pagination (defaults to 0)
 * @property p_order_by - Optional order by field (defaults to 'created_at')
 * @property p_order_direction - Optional order direction (defaults to 'desc')
 */
export interface GetContentPaginatedSlimArgs {
  p_category?: string | null;
  p_limit?: number | null;
  p_offset?: number | null;
  p_order_by?: string | null;
  p_order_direction?: string | null;
}

/**
 * Arguments for get_homepage_complete RPC
 * 
 * @property p_category_ids - Optional array of category IDs (defaults to all categories)
 */
export interface GetHomepageCompleteArgs {
  p_category_ids?: string[] | null;
}

/**
 * Arguments for get_homepage_optimized RPC
 * 
 * @property p_category_ids - Array of category IDs (required)
 * @property p_limit - Optional limit for results (defaults to 12)
 */
export interface GetHomepageOptimizedArgs {
  p_category_ids: string[];
  p_limit?: number | null;
}

/**
 * Arguments for get_reviews_with_stats RPC
 * 
 * @property p_content_type - Content category enum value
 * @property p_content_slug - Content slug
 * @property p_sort_by - Optional sort field (defaults to 'recent')
 * @property p_offset - Optional offset for pagination (defaults to 0)
 * @property p_limit - Optional limit for results (defaults to 10)
 * @property p_user_id - Optional user ID (UUID)
 */
export interface GetReviewsWithStatsArgs {
  p_content_type: ContentCategory;
  p_content_slug: string;
  p_sort_by?: string | null;
  p_offset?: number | null;
  p_limit?: number | null;
  p_user_id?: string | null;
}

/**
 * Arguments for get_related_content RPC
 * 
 * @property p_category - Content category enum value
 * @property p_slug - Content slug
 * @property p_tags - Optional tags array (defaults to empty array)
 * @property p_limit - Optional limit for results (defaults to 3)
 * @property p_exclude_slugs - Optional array of slugs to exclude (defaults to empty array)
 */
export interface GetRelatedContentArgs {
  p_category: ContentCategory;
  p_slug: string;
  p_tags?: string[] | null;
  p_limit?: number | null;
  p_exclude_slugs?: string[] | null;
}

/**
 * Arguments for get_similar_content RPC
 * 
 * @property p_content_type - Content category enum value
 * @property p_content_slug - Content slug
 * @property p_limit - Optional limit for results (defaults to 10)
 */
export interface GetSimilarContentArgs {
  p_content_type: ContentCategory;
  p_content_slug: string;
  p_limit?: number | null;
}

/**
 * Arguments for get_content_templates RPC
 * 
 * @property p_category - Content category enum value
 */
export interface GetContentTemplatesArgs {
  p_category: ContentCategory;
}

/**
 * Prisma-based ContentService
 * 
 * Uses raw SQL via `withClient()` to call PostgreSQL RPC functions.
 * This maintains the same API as the Supabase version but uses Neon/Prisma.
 */
export class ContentService {
  /**
   * Calls the database RPC: generate_readme_data
   * 
   * @returns README data result or null if not found
   */
  async getSitewideReadme() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM generate_readme_data()');
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getSitewideReadme error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: generate_sitewide_llms_txt
   * 
   * @returns Sitewide LLMs.txt data
   */
  async getSitewideLlmsTxt() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM generate_sitewide_llms_txt()');
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getSitewideLlmsTxt error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: generate_changelog_llms_txt
   * 
   * @returns Changelog LLMs.txt data
   */
  async getChangelogLlmsTxt() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM generate_changelog_llms_txt()');
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getChangelogLlmsTxt error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: generate_category_llms_txt
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Content category enum value
   * @returns Category LLMs.txt data
   */
  async getCategoryLlmsTxt(args: GetCategoryLlmsTxtArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM generate_category_llms_txt($1)', [
          args.p_category,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getCategoryLlmsTxt error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: generate_changelog_entry_llms_txt
   * 
   * @param args - RPC function arguments
   * @param args.p_slug - Changelog entry slug
   * @returns Changelog entry LLMs.txt data
   */
  async getChangelogEntryLlmsTxt(args: GetChangelogEntryLlmsTxtArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM generate_changelog_entry_llms_txt($1)', [
          args.p_slug,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getChangelogEntryLlmsTxt error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: generate_tool_llms_txt
   * 
   * @param args - RPC function arguments
   * @param args.p_tool_name - Tool name
   * @returns Tool LLMs.txt data
   */
  async getToolLlmsTxt(args: GetToolLlmsTxtArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM generate_tool_llms_txt($1)', [
          args.p_tool_name,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getToolLlmsTxt error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_category_configs_with_features
   * 
   * @returns Array of category configs with features
   */
  async getCategoryConfigs() {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_category_configs_with_features()');
        return rows;
      });
    } catch (error) {
      console.error('[ContentService] getCategoryConfigs error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_api_content_full
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Content category enum value
   * @param args.p_slug - Content slug
   * @param args.p_base_url - Optional base URL (defaults to 'https://claudepro.directory')
   * @returns API content full data or null if not found
   */
  async getApiContentFull(args: GetApiContentFullArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter for p_base_url
        const query =
          args.p_base_url !== undefined && args.p_base_url !== null
            ? 'SELECT * FROM get_api_content_full($1, $2, $3)'
            : 'SELECT * FROM get_api_content_full($1, $2)';
        const params =
          args.p_base_url !== undefined && args.p_base_url !== null
            ? [args.p_category, args.p_slug, args.p_base_url]
            : [args.p_category, args.p_slug];
        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getApiContentFull error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_content_detail_complete
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Content category enum value
   * @param args.p_slug - Content slug
   * @param args.p_user_id - Optional user ID (UUID, defaults to NULL)
   * @returns Content detail complete or null if not found
   */
  async getContentDetailComplete(args: GetContentDetailCompleteArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter for p_user_id
        const query =
          args.p_user_id !== undefined && args.p_user_id !== null
            ? 'SELECT * FROM get_content_detail_complete($1, $2, $3)'
            : 'SELECT * FROM get_content_detail_complete($1, $2)';
        const params =
          args.p_user_id !== undefined && args.p_user_id !== null
            ? [args.p_category, args.p_slug, args.p_user_id]
            : [args.p_category, args.p_slug];
        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getContentDetailComplete error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_content_detail_core
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Content category enum value
   * @param args.p_slug - Content slug
   * @returns Content detail core or null if not found
   */
  async getContentDetailCore(args: GetContentDetailCoreArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_content_detail_core($1, $2)', [
          args.p_category,
          args.p_slug,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getContentDetailCore error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_content_analytics
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Content category enum value
   * @param args.p_slug - Content slug
   * @param args.p_user_id - Optional user ID (UUID, defaults to NULL)
   * @returns Content analytics or null if not found
   */
  async getContentAnalytics(args: GetContentAnalyticsArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter for p_user_id
        const query =
          args.p_user_id !== undefined && args.p_user_id !== null
            ? 'SELECT * FROM get_content_analytics($1, $2, $3)'
            : 'SELECT * FROM get_content_analytics($1, $2)';
        const params =
          args.p_user_id !== undefined && args.p_user_id !== null
            ? [args.p_category, args.p_slug, args.p_user_id]
            : [args.p_category, args.p_slug];
        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getContentAnalytics error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_enriched_content_list
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Optional content category filter
   * @param args.p_slugs - Optional array of content slugs
   * @param args.p_limit - Optional limit for results (defaults to 100)
   * @param args.p_offset - Optional offset for pagination (defaults to 0)
   * @returns Array of enriched content items
   */
  async getEnrichedContentList(args: GetEnrichedContentListArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters: p_category (NULL), p_slugs (NULL), p_limit (100), p_offset (0)
        const params: unknown[] = [];
        let paramIndex = 1;
        let query = 'SELECT * FROM get_enriched_content_list(';

        if (args.p_category !== undefined && args.p_category !== null) {
          query += `$${paramIndex}`;
          params.push(args.p_category);
          paramIndex++;
        } else {
          query += 'NULL';
        }

        if (args.p_slugs !== undefined && args.p_slugs !== null) {
          query += `, $${paramIndex}`;
          params.push(args.p_slugs);
          paramIndex++;
        } else if (args.p_limit !== undefined || args.p_offset !== undefined) {
          query += ', NULL';
        }

        if (args.p_limit !== undefined && args.p_limit !== null) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
          paramIndex++;
        } else if (args.p_offset !== undefined) {
          query += ', 100'; // default
        }

        if (args.p_offset !== undefined && args.p_offset !== null) {
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
      console.error('[ContentService] getEnrichedContentList error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_content_paginated
   * 
   * @param args - RPC function arguments
   * @returns Array of paginated content items
   */
  async getContentPaginated(args: GetContentPaginatedArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has many default parameters - build query carefully
        const params: unknown[] = [];
        let paramIndex = 1;
        let query = 'SELECT * FROM get_content_paginated(';

        // p_category (NULL default)
        if (args.p_category !== undefined && args.p_category !== null) {
          query += `$${paramIndex}`;
          params.push(args.p_category);
          paramIndex++;
        } else {
          query += 'NULL';
        }

        // p_author (NULL default)
        if (args.p_author !== undefined && args.p_author !== null) {
          query += `, $${paramIndex}`;
          params.push(args.p_author);
          paramIndex++;
        } else if (
          args.p_tags !== undefined ||
          args.p_search !== undefined ||
          args.p_order_by !== undefined ||
          args.p_order_direction !== undefined ||
          args.p_limit !== undefined ||
          args.p_offset !== undefined
        ) {
          query += ', NULL';
        }

        // p_tags (NULL default)
        if (args.p_tags !== undefined && args.p_tags !== null) {
          query += `, $${paramIndex}`;
          params.push(args.p_tags);
          paramIndex++;
        } else if (
          args.p_search !== undefined ||
          args.p_order_by !== undefined ||
          args.p_order_direction !== undefined ||
          args.p_limit !== undefined ||
          args.p_offset !== undefined
        ) {
          query += ', NULL';
        }

        // p_search (NULL default)
        if (args.p_search !== undefined && args.p_search !== null) {
          query += `, $${paramIndex}`;
          params.push(args.p_search);
          paramIndex++;
        } else if (
          args.p_order_by !== undefined ||
          args.p_order_direction !== undefined ||
          args.p_limit !== undefined ||
          args.p_offset !== undefined
        ) {
          query += ', NULL';
        }

        // p_order_by ('created_at' default)
        if (args.p_order_by !== undefined && args.p_order_by !== null && args.p_order_by !== 'created_at') {
          query += `, $${paramIndex}`;
          params.push(args.p_order_by);
          paramIndex++;
        } else if (args.p_order_direction !== undefined || args.p_limit !== undefined || args.p_offset !== undefined) {
          query += ", 'created_at'";
        }

        // p_order_direction ('desc' default)
        if (args.p_order_direction !== undefined && args.p_order_direction !== null && args.p_order_direction !== 'desc') {
          query += `, $${paramIndex}`;
          params.push(args.p_order_direction);
          paramIndex++;
        } else if (args.p_limit !== undefined || args.p_offset !== undefined) {
          query += ", 'desc'";
        }

        // p_limit (20 default)
        if (args.p_limit !== undefined && args.p_limit !== null && args.p_limit !== 20) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
          paramIndex++;
        } else if (args.p_offset !== undefined) {
          query += ', 20';
        }

        // p_offset (0 default)
        if (args.p_offset !== undefined && args.p_offset !== null && args.p_offset !== 0) {
          query += `, $${paramIndex}`;
          params.push(args.p_offset);
        } else if (args.p_limit !== undefined && args.p_limit !== null && args.p_limit !== 20) {
          query += ', 0';
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return rows;
      });
    } catch (error) {
      console.error('[ContentService] getContentPaginated error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_homepage_complete
   * 
   * @param args - RPC function arguments
   * @param args.p_category_ids - Optional array of category IDs (defaults to all categories)
   * @returns Homepage complete data or null if not found
   */
  async getHomepageComplete(args: GetHomepageCompleteArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter for p_category_ids
        const query =
          args.p_category_ids !== undefined && args.p_category_ids !== null
            ? 'SELECT * FROM get_homepage_complete($1)'
            : 'SELECT * FROM get_homepage_complete()';
        const params =
          args.p_category_ids !== undefined && args.p_category_ids !== null
            ? [args.p_category_ids]
            : [];
        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getHomepageComplete error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_homepage_optimized
   * 
   * @param args - RPC function arguments
   * @param args.p_category_ids - Array of category IDs (required)
   * @param args.p_limit - Optional limit for results (defaults to 12)
   * @returns Homepage optimized data or null if not found
   */
  async getHomepageOptimized(args: GetHomepageOptimizedArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter for p_limit
        const query =
          args.p_limit !== undefined && args.p_limit !== null && args.p_limit !== 12
            ? 'SELECT * FROM get_homepage_optimized($1, $2)'
            : 'SELECT * FROM get_homepage_optimized($1)';
        const params =
          args.p_limit !== undefined && args.p_limit !== null && args.p_limit !== 12
            ? [args.p_category_ids, args.p_limit]
            : [args.p_category_ids];
        const { rows } = await client.query(query, params);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getHomepageOptimized error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_reviews_with_stats
   * 
   * @param args - RPC function arguments
   * @param args.p_content_type - Content category enum value
   * @param args.p_content_slug - Content slug
   * @param args.p_sort_by - Optional sort field (defaults to 'recent')
   * @param args.p_offset - Optional offset for pagination (defaults to 0)
   * @param args.p_limit - Optional limit for results (defaults to 10)
   * @param args.p_user_id - Optional user ID (UUID, defaults to NULL)
   * @returns Array of reviews with statistics
   */
  async getReviewsWithStats(args: GetReviewsWithStatsArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters - build query based on provided args
        const params: unknown[] = [args.p_content_type, args.p_content_slug];
        let paramIndex = 3;
        let query = 'SELECT * FROM get_reviews_with_stats($1, $2';

        if (args.p_sort_by !== undefined && args.p_sort_by !== null && args.p_sort_by !== 'recent') {
          query += `, $${paramIndex}`;
          params.push(args.p_sort_by);
          paramIndex++;
        } else if (args.p_offset !== undefined || args.p_limit !== undefined || args.p_user_id !== undefined) {
          query += ", 'recent'";
        }

        if (args.p_offset !== undefined && args.p_offset !== null && args.p_offset !== 0) {
          query += `, $${paramIndex}`;
          params.push(args.p_offset);
          paramIndex++;
        } else if (args.p_limit !== undefined || args.p_user_id !== undefined) {
          query += ', 0';
        }

        if (args.p_limit !== undefined && args.p_limit !== null && args.p_limit !== 10) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
          paramIndex++;
        } else if (args.p_user_id !== undefined) {
          query += ', 10';
        }

        if (args.p_user_id !== undefined && args.p_user_id !== null) {
          query += `, $${paramIndex}`;
          params.push(args.p_user_id);
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return rows;
      });
    } catch (error) {
      console.error('[ContentService] getReviewsWithStats error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_related_content
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Content category enum value
   * @param args.p_slug - Content slug
   * @param args.p_tags - Optional tags array (defaults to empty array)
   * @param args.p_limit - Optional limit for results (defaults to 3)
   * @param args.p_exclude_slugs - Optional array of slugs to exclude (defaults to empty array)
   * @returns Array of related content
   */
  async getRelatedContent(args: GetRelatedContentArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters
        const params: unknown[] = [args.p_category, args.p_slug];
        let paramIndex = 3;
        let query = 'SELECT * FROM get_related_content($1, $2';

        if (args.p_tags !== undefined && args.p_tags !== null && args.p_tags.length > 0) {
          query += `, $${paramIndex}`;
          params.push(args.p_tags);
          paramIndex++;
        } else if (args.p_limit !== undefined || args.p_exclude_slugs !== undefined) {
          query += ", '{}'";
        }

        if (args.p_limit !== undefined && args.p_limit !== null && args.p_limit !== 3) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
          paramIndex++;
        } else if (args.p_exclude_slugs !== undefined) {
          query += ', 3';
        }

        if (args.p_exclude_slugs !== undefined && args.p_exclude_slugs !== null && args.p_exclude_slugs.length > 0) {
          query += `, $${paramIndex}`;
          params.push(args.p_exclude_slugs);
        } else if (args.p_limit !== undefined && args.p_limit !== null && args.p_limit !== 3) {
          query += ", '{}'";
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return rows;
      });
    } catch (error) {
      console.error('[ContentService] getRelatedContent error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_similar_content
   * 
   * @param args - RPC function arguments
   * @param args.p_content_type - Content category enum value
   * @param args.p_content_slug - Content slug
   * @param args.p_limit - Optional limit for results (defaults to 10)
   * @returns Array of similar content
   */
  async getSimilarContent(args: GetSimilarContentArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameter for p_limit
        const query =
          args.p_limit !== undefined && args.p_limit !== null && args.p_limit !== 10
            ? 'SELECT * FROM get_similar_content($1, $2, $3)'
            : 'SELECT * FROM get_similar_content($1, $2)';
        const params =
          args.p_limit !== undefined && args.p_limit !== null && args.p_limit !== 10
            ? [args.p_content_type, args.p_content_slug, args.p_limit]
            : [args.p_content_type, args.p_content_slug];
        const { rows } = await client.query(query, params);
        return rows;
      });
    } catch (error) {
      console.error('[ContentService] getSimilarContent error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_content_templates
   * 
   * @param args - RPC function arguments
   * @param args.p_category - Content category enum value
   * @returns Content templates result or null if not found
   */
  async getContentTemplates(args: GetContentTemplatesArgs) {
    try {
      return await withClient(async (client: PoolClient) => {
        const { rows } = await client.query('SELECT * FROM get_content_templates($1)', [
          args.p_category,
        ]);
        return rows[0] ?? null;
      });
    } catch (error) {
      console.error('[ContentService] getContentTemplates error:', error);
      throw error;
    }
  }

  /**
   * Calls the database RPC: get_content_paginated_slim
   * 
   * @param args - RPC function arguments
   * @returns Array of paginated content items (slim version)
   */
  async getContentPaginatedSlim(args: GetContentPaginatedSlimArgs = {}) {
    try {
      return await withClient(async (client: PoolClient) => {
        // Function has default parameters: p_category (NULL), p_limit (30), p_offset (0), p_order_by ('created_at'), p_order_direction ('desc')
        const params: unknown[] = [];
        let paramIndex = 1;
        let query = 'SELECT * FROM get_content_paginated_slim(';

        if (args.p_category !== undefined && args.p_category !== null) {
          query += `$${paramIndex}`;
          params.push(args.p_category);
          paramIndex++;
        } else {
          query += 'NULL';
        }

        if (args.p_limit !== undefined && args.p_limit !== null && args.p_limit !== 30) {
          query += `, $${paramIndex}`;
          params.push(args.p_limit);
          paramIndex++;
        } else if (args.p_offset !== undefined || args.p_order_by !== undefined || args.p_order_direction !== undefined) {
          query += ', 30';
        }

        if (args.p_offset !== undefined && args.p_offset !== null && args.p_offset !== 0) {
          query += `, $${paramIndex}`;
          params.push(args.p_offset);
          paramIndex++;
        } else if (args.p_order_by !== undefined || args.p_order_direction !== undefined) {
          query += ', 0';
        }

        if (args.p_order_by !== undefined && args.p_order_by !== null && args.p_order_by !== 'created_at') {
          query += `, $${paramIndex}`;
          params.push(args.p_order_by);
          paramIndex++;
        } else if (args.p_order_direction !== undefined) {
          query += ", 'created_at'";
        }

        if (args.p_order_direction !== undefined && args.p_order_direction !== null && args.p_order_direction !== 'desc') {
          query += `, $${paramIndex}`;
          params.push(args.p_order_direction);
        } else if (args.p_order_by !== undefined && args.p_order_by !== null && args.p_order_by !== 'created_at') {
          query += ", 'desc'";
        }

        query += ')';

        const { rows } = await client.query(query, params);
        return rows;
      });
    } catch (error) {
      console.error('[ContentService] getContentPaginatedSlim error:', error);
      throw error;
    }
  }
}
