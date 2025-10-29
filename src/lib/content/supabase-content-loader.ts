/**
 * Supabase Content Loader - Unified View
 *
 * DATABASE-FIRST ARCHITECTURE: Queries content_unified view instead of 10+ individual tables.
 * Single source of truth for all content types.
 *
 * Features:
 * - Type-safe queries using database-overrides.ts (Views<'content_unified'>)
 * - ISR caching with unstable_cache() (1h revalidation)
 * - Server-side filtering with PostgREST (category, tags, author, etc.)
 * - Error handling with fallback to empty arrays
 * - Queries content_unified view (UNION ALL of 9 content tables)
 *
 * Replaces: 10+ separate table queries → 1 unified view query
 *
 * @module lib/content/supabase-content-loader
 */

import { unstable_cache } from 'next/cache';
import type { CategoryId } from '@/src/lib/config/category-types';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Database, Tables } from '@/src/types/database.types';
import type { Views } from '@/src/types/database-overrides';

/**
 * Content item type - DATABASE-FIRST
 *
 * For LIST views: Use content_unified view (common fields only)
 * For DETAIL views: Use individual table types (all fields)
 *
 * This type uses a union of all Tables for maximum compatibility.
 * All content tables share the same base structure.
 */
export type ContentItem =
  | Tables<'agents'>
  | Tables<'mcp'>
  | Tables<'commands'>
  | Tables<'rules'>
  | Tables<'hooks'>
  | Tables<'statuslines'>
  | Tables<'skills'>
  | Tables<'collections'>
  | Tables<'guides'>
  | Tables<'jobs'>
  | Tables<'changelog'>;

/**
 * Content list item - Uses content_unified view
 * For list/grid views where you only need common fields
 */
export type ContentListItem = Views<'content_unified'>;

/**
 * Full content item type - DEPRECATED
 * @deprecated Use ContentItem directly
 */
export type FullContentItem = ContentItem;

/**
 * Filter options for server-side content queries
 * All filtering happens in PostgreSQL for maximum performance
 */
export interface ContentFilters {
  /** Filter by category (agents, mcp, rules, etc.) */
  category?: CategoryId | CategoryId[];
  /** Filter by tags (array contains) */
  tags?: string[];
  /** Filter by author */
  author?: string | string[];
  /** Filter by source table */
  sourceTable?: string | string[];
  /** Text search in title/description */
  search?: string;
  /** Order by field */
  orderBy?: 'slug' | 'created_at' | 'updated_at' | 'title';
  /** Order direction */
  ascending?: boolean;
  /** Limit number of results */
  limit?: number;
}

/**
 * Get all content items for a specific category - ENRICHED
 *
 * Uses get_enriched_content RPC that returns complete data in single query:
 * - Base content fields
 * - Analytics (viewCount, copyCount, bookmarkCount)
 * - Sponsorship (isSponsored, sponsorTier, etc.)
 * - Computed fields (isNew, popularity)
 * - Category-specific fields (collectionType, difficulty, etc.)
 *
 * @param category - Category ID (agents, mcp, rules, etc)
 * @returns Array of enriched content items
 */
export async function getContentByCategory(category: CategoryId): Promise<ContentItem[]> {
  // TEMPORARY: Removed unstable_cache to debug empty content issue
  // TODO: Re-add caching once content loads correctly
  try {
    const supabase = createAnonClient();

    logger.info(`Fetching enriched content for category: ${category}`);

    // Use enriched content RPC - single query with all data
    const { data, error } = await supabase.rpc('get_enriched_content', {
      p_category: category,
      p_limit: 1000, // Large limit for category pages
      p_offset: 0,
    });

    if (error) {
      logger.error(`Failed to fetch enriched content for category: ${category}`, error);
      return [];
    }

    logger.info(`Fetched ${Array.isArray(data) ? data.length : 0} items for ${category}`);

    // RPC returns JSONB array - already enriched with analytics, sponsorship, etc.
    return (data || []) as ContentItem[];
  } catch (error) {
    logger.error(
      `Error in getContentByCategory(${category})`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Get a single content item by category and slug - ENRICHED
 *
 * Uses get_enriched_content RPC that returns complete data.
 *
 * @param category - Category ID
 * @param slug - Content item slug
 * @returns Enriched content item or null if not found
 */
export async function getContentBySlug(
  category: CategoryId,
  slug: string
): Promise<ContentItem | null> {
  const result = await unstable_cache(
    async (): Promise<ContentItem | null> => {
      try {
        const supabase = createAnonClient();

        // Use enriched content RPC
        const { data, error } = await supabase.rpc('get_enriched_content', {
          p_category: category,
          p_slug: slug,
          p_limit: 1,
          p_offset: 0,
        });

        if (error) {
          logger.error(`Failed to fetch enriched content: ${category}/${slug}`, error);
          return null;
        }

        const results = (data || []) as ContentItem[];
        return results.length > 0 ? (results[0] ?? null) : null;
      } catch (error) {
        logger.error(
          `Error in getContentBySlug(${category}, ${slug})`,
          error instanceof Error ? error : new Error(String(error))
        );
        return null;
      }
    },
    [`enriched-content-${category}-${slug}`],
    {
      revalidate: 3600, // 1 hour ISR cache
      tags: [`content-${category}`, `content-${category}-${slug}`],
    }
  )();

  return result;
}

/**
 * Get FULL content item by querying individual table (ALL FIELDS)
 *
 * USE FOR: Detail pages where you need ALL category-specific fields
 * (configuration, content, display_title, dependencies, etc.)
 *
 * This queries the individual table (agents, mcp, rules, etc.) instead of content_unified view.
 * Returns proper database type based on the category.
 *
 * @param category - Category ID
 * @param slug - Content item slug
 * @returns Full content item with all category-specific fields, or null if not found
 *
 * @example
 * const mcpServer = await getFullContentBySlug('mcp', 'github');
 * // Returns: Tables<'mcp'> with configuration, documentation_url, etc.
 */
export async function getFullContentBySlug(
  category: CategoryId,
  slug: string
): Promise<FullContentItem | null> {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();

        // Map category to table name (category IS the table name in our architecture)
        // Type-safe: category is CategoryId which matches table names
        const tableName = category as keyof Database['public']['Tables'];

        // Query individual table for ALL fields
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('slug', slug)
          .single();

        if (error) {
          // Not found is expected for invalid slugs
          if (error.code === 'PGRST116') {
            return null;
          }
          logger.error(`Failed to fetch full content: ${category}/${slug}`, error);
          return null;
        }

        if (!data) {
          return null;
        }

        // Return properly typed data from database with category discriminator
        // Database stores arrays as JSONB (Json[]), but app code expects string[]
        // Type cast is safe here because we validate the shape at insert time
        return data as unknown as FullContentItem;
      } catch (error) {
        logger.error(
          `Error in getFullContentBySlug(${category}, ${slug})`,
          error instanceof Error ? error : new Error(String(error))
        );
        return null;
      }
    },
    [`content-full-${category}-${slug}`],
    {
      revalidate: 3600, // 1 hour ISR cache
      tags: [`content-${category}`, `content-${category}-${slug}`],
    }
  )();
}

/**
 * Get all content items across all categories
 *
 * MASSIVE SIMPLIFICATION: Single query to content_unified view instead of 10 parallel queries.
 * Useful for sitemap generation, search indexing, etc.
 *
 * @param filters - Optional filters to apply server-side
 * @returns Array of all content items
 *
 * @example
 * const allContent = await getAllContent();
 * // Returns: [{ slug: 'biome-expert', category: 'agents', ... }, ...]
 *
 * @example
 * // With filters
 * const recentAgents = await getAllContent({
 *   category: 'agents',
 *   orderBy: 'created_at',
 *   ascending: false,
 *   limit: 10
 * });
 */
export async function getAllContent(filters?: ContentFilters): Promise<ContentItem[]> {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();

        // Start query builder
        let query = supabase.from('content_unified').select('*');

        // Apply server-side filters (PostgreSQL, not JavaScript)
        if (filters?.category) {
          if (Array.isArray(filters.category)) {
            query = query.in('category', filters.category);
          } else {
            query = query.eq('category', filters.category);
          }
        }

        if (filters?.tags && filters.tags.length > 0) {
          query = query.overlaps('tags', filters.tags); // Array overlap check
        }

        if (filters?.author) {
          if (Array.isArray(filters.author)) {
            query = query.in('author', filters.author);
          } else {
            query = query.eq('author', filters.author);
          }
        }

        if (filters?.sourceTable) {
          if (Array.isArray(filters.sourceTable)) {
            query = query.in('source_table', filters.sourceTable);
          } else {
            query = query.eq('source_table', filters.sourceTable);
          }
        }

        if (filters?.search) {
          // Full-text search on title and description
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        // Apply ordering
        const orderBy = filters?.orderBy || 'slug';
        const ascending = filters?.ascending ?? true;
        query = query.order(orderBy, { ascending });

        // Apply limit
        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Failed to fetch all content', error);
          return [];
        }

        if (!data) return [];

        // Return data as ContentItem array (RPC returns proper type)
        return data as unknown as ContentItem[];
      } catch (error) {
        logger.error(
          'Error in getAllContent()',
          error instanceof Error ? error : new Error(String(error))
        );
        return [];
      }
    },
    [
      'content-all',
      filters?.category?.toString(),
      filters?.tags?.join(','),
      filters?.author?.toString(),
      filters?.search,
      filters?.orderBy,
      filters?.ascending?.toString(),
      filters?.limit?.toString(),
    ].filter(Boolean) as string[],
    {
      revalidate: 3600, // 1 hour ISR cache
      tags: ['content-all'],
    }
  )();
}

/**
 * Get content count by category (or total count)
 *
 * SERVER-SIDE COUNT: Uses PostgreSQL COUNT() aggregation, not JavaScript array.length.
 *
 * @param category - Optional category ID (omit for total count)
 * @returns Number of content items
 *
 * @example
 * const agentCount = await getContentCount('agents'); // Count agents only
 * const totalCount = await getContentCount(); // Count all content
 */
export async function getContentCount(category?: CategoryId): Promise<number> {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();

        // Start query builder for count
        let query = supabase.from('content_unified').select('*', { count: 'exact', head: true });

        // Apply category filter if provided
        if (category) {
          query = query.eq('category', category);
        }

        const { count, error } = await query;

        if (error) {
          logger.error(
            `Failed to count content${category ? ` for category: ${category}` : ''}`,
            error
          );
          return 0;
        }

        return count || 0;
      } catch (error) {
        logger.error(
          `Error in getContentCount(${category || 'all'})`,
          error instanceof Error ? error : new Error(String(error))
        );
        return 0;
      }
    },
    [`content-count-${category || 'all'}`],
    {
      revalidate: 3600, // 1 hour ISR cache
      tags: category ? [`content-${category}`] : ['content-all'],
    }
  )();
}

/**
 * Get content with analytics (views, popularity, trending scores)
 *
 * DATABASE-FIRST: Queries mv_content_stats materialized view (refreshed hourly).
 * Includes pre-computed analytics instead of runtime aggregation.
 *
 * @param category - Optional category filter
 * @param orderBy - Sort by popularity_score, trending_score, view_count, or created_at
 * @param limit - Max results
 * @returns Array of content with analytics
 *
 * @example
 * const popular = await getContentWithAnalytics('agents', 'popularity_score', 10);
 */
export async function getContentWithAnalytics(
  category?: CategoryId,
  orderBy: 'popularity_score' | 'trending_score' | 'view_count' | 'created_at' = 'popularity_score',
  limit = 20
) {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();

        let query = supabase
          .from('mv_content_stats')
          .select('*')
          .order(orderBy, { ascending: false, nullsFirst: false })
          .limit(limit);

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Failed to fetch content with analytics', error);
          return [];
        }

        return data || [];
      } catch (error) {
        logger.error(
          'Error in getContentWithAnalytics()',
          error instanceof Error ? error : new Error(String(error))
        );
        return [];
      }
    },
    [`content-analytics-${category || 'all'}-${orderBy}-${limit}`],
    {
      revalidate: 3600, // 1 hour (matches mv_content_stats refresh)
      tags: category ? [`content-${category}`] : ['content-all'],
    }
  )();
}

/**
 * Get trending content
 *
 * DATABASE-FIRST: Queries mv_trending_content materialized view (refreshed hourly).
 * Top 100 trending items pre-computed with rankings.
 *
 * @param category - Optional category filter
 * @param limit - Max results
 * @returns Array of trending content
 *
 * @example
 * const trending = await getTrendingContent('agents', 10);
 */
export async function getTrendingContent(category?: CategoryId, limit = 20) {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();

        let query = supabase.from('mv_trending_content').select('*').limit(limit);

        if (category) {
          query = query.eq('category', category).order('rank_in_category', { ascending: true });
        } else {
          query = query.order('rank_overall', { ascending: true });
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Failed to fetch trending content', error);
          return [];
        }

        return data || [];
      } catch (error) {
        logger.error(
          'Error in getTrendingContent()',
          error instanceof Error ? error : new Error(String(error))
        );
        return [];
      }
    },
    [`trending-${category || 'all'}-${limit}`],
    {
      revalidate: 3600,
      tags: category ? [`trending-${category}`] : ['trending-all'],
    }
  )();
}

/**
 * Get content with advanced server-side filtering
 *
 * Flexible query builder for complex filtering scenarios.
 * All filtering happens in PostgreSQL with indexes.
 *
 * @param filters - Filter options
 * @returns Filtered and ordered content items
 *
 * @example
 * // Get recent TypeScript-tagged agents
 * const items = await getFilteredContent({
 *   category: 'agents',
 *   tags: ['typescript'],
 *   orderBy: 'created_at',
 *   ascending: false,
 *   limit: 20
 * });
 *
 * @example
 * // Search across all content
 * const results = await getFilteredContent({
 *   search: 'biome linter',
 *   limit: 10
 * });
 */
export async function getFilteredContent(filters: ContentFilters): Promise<ContentItem[]> {
  // Reuse getAllContent with filters - it already supports everything we need
  return getAllContent(filters);
}
