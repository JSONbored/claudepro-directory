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
import { publicContentUnifiedRowSchema } from '@/src/lib/schemas/generated/db-schemas';
import { createClient } from '@/src/lib/supabase/server';
import type { Tables } from '@/src/types/database.types';
import type { Views } from '@/src/types/database-overrides';

/**
 * Content item type from content_unified view
 * Database-first: Type inferred from generated database view schema
 *
 * Jobs table is EXCLUDED - it has a completely different schema.
 * Jobs should use Tables<'jobs'> type separately.
 */
export type ContentItem = Views<'content_unified'>;

/**
 * Full content item type - discriminated union based on category field
 * TypeScript can narrow the type based on the category value
 */
export type FullContentItem =
  | (Tables<'agents'> & { category: 'agents' })
  | (Tables<'mcp'> & { category: 'mcp' })
  | (Tables<'commands'> & { category: 'commands' })
  | (Tables<'rules'> & { category: 'rules' })
  | (Tables<'hooks'> & { category: 'hooks' })
  | (Tables<'statuslines'> & { category: 'statuslines' })
  | (Tables<'skills'> & { category: 'skills' })
  | (Tables<'collections'> & { category: 'collections' })
  | (Tables<'guides'> & { category: 'guides' })
  | (Tables<'jobs'> & { category: 'jobs' })
  | (Tables<'changelog'> & { category: 'changelog' });

/**
 * Base fields guaranteed to exist on ALL content items (NOT NULL in database)
 */
export interface ContentItemBase {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  author: string;
  date_added: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  source_table: string;
}

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
 * Get all content items for a specific category
 *
 * SERVER-SIDE FILTERING: Uses PostgREST .eq() query, no client-side filtering.
 * Database → content_unified view → Zod validation → Typed result
 *
 * @param category - Category ID (agents, mcp, rules, etc)
 * @returns Array of validated content items
 *
 * @example
 * const agents = await getContentByCategory('agents');
 * // Returns: Array<Views<'content_unified'>> filtered by category
 */
export async function getContentByCategory(category: CategoryId): Promise<ContentItem[]> {
  return unstable_cache(
    async () => {
      try {
        const supabase = await createClient();

        // SERVER-SIDE FILTER: Query content_unified view with category filter
        const { data, error } = await supabase
          .from('content_unified')
          .select('*')
          .eq('category', category) // PostgreSQL filter, not JavaScript
          .order('slug', { ascending: true });

        if (error) {
          logger.error(`Failed to fetch content for category: ${category}`, error);
          return [];
        }

        if (!data || data.length === 0) {
          return [];
        }

        // Validate with Zod schema - runtime safety
        const validated = publicContentUnifiedRowSchema.array().parse(data);

        return validated as ContentItem[];
      } catch (error) {
        logger.error(
          `Error in getContentByCategory(${category})`,
          error instanceof Error ? error : new Error(String(error))
        );
        return [];
      }
    },
    [`content-category-${category}`],
    {
      revalidate: 3600, // 1 hour ISR cache
      tags: [`content-${category}`],
    }
  )();
}

/**
 * Get a single content item by category and slug (UNIFIED VIEW - common fields only)
 *
 * USE FOR: Listings, search results, cards where you only need common fields
 * DON'T USE FOR: Detail pages - use getFullContentBySlug() instead
 *
 * SERVER-SIDE FILTERING: Uses PostgREST .eq() query on both category and slug.
 *
 * @param category - Category ID
 * @param slug - Content item slug
 * @returns Content item or null if not found
 *
 * @example
 * const agent = await getContentBySlug('agents', 'biome-expert');
 * // Returns: { slug: 'biome-expert', title: 'Biome Linter', ... } (common fields only)
 */
export async function getContentBySlug(
  category: CategoryId,
  slug: string
): Promise<ContentItem | null> {
  return unstable_cache(
    async () => {
      try {
        const supabase = await createClient();

        // SERVER-SIDE FILTER: Query content_unified view with category + slug filter
        const { data, error } = await supabase
          .from('content_unified')
          .select('*')
          .eq('category', category) // PostgreSQL filter
          .eq('slug', slug) // PostgreSQL filter
          .single();

        if (error) {
          // Not found is expected for invalid slugs
          if (error.code === 'PGRST116') {
            return null;
          }
          logger.error(`Failed to fetch content: ${category}/${slug}`, error);
          return null;
        }

        if (!data) {
          return null;
        }

        // Validate with Zod schema
        const validated = publicContentUnifiedRowSchema.parse(data);

        return validated as ContentItem;
      } catch (error) {
        logger.error(
          `Error in getContentBySlug(${category}, ${slug})`,
          error instanceof Error ? error : new Error(String(error))
        );
        return null;
      }
    },
    [`content-item-${category}-${slug}`],
    {
      revalidate: 3600, // 1 hour ISR cache
      tags: [`content-${category}`, `content-${category}-${slug}`],
    }
  )();
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
        const supabase = await createClient();

        // Map category to table name (jobs already uses 'jobs' table)
        const tableName = category as string;

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
        const supabase = await createClient();

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

        // Validate with Zod schema
        const validated = publicContentUnifiedRowSchema.array().parse(data);

        return validated as ContentItem[];
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
        const supabase = await createClient();

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
        const supabase = await createClient();

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
        const supabase = await createClient();

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
