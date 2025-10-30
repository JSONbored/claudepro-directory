/**
 * Supabase Content Loader - Queries unified content table
 */

import { unstable_cache } from 'next/cache';
import type { CategoryId } from '@/src/lib/config/category-types';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Tables } from '@/src/types/database.types';

export type ContentItem = Tables<'content'> | Tables<'jobs'> | Tables<'changelog'>;

export type ContentListItem = Tables<'content'>;

export type FullContentItem = ContentItem;

export interface ContentFilters {
  category?: CategoryId | CategoryId[];
  tags?: string[];
  author?: string | string[];
  sourceTable?: string | string[];
  search?: string;
  orderBy?: 'slug' | 'created_at' | 'updated_at' | 'title';
  ascending?: boolean;
  limit?: number;
}

export async function getContentByCategory(category: CategoryId): Promise<ContentItem[]> {
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc('get_enriched_content', {
      p_category: category,
      p_limit: 1000,
      p_offset: 0,
    });

    if (error) {
      logger.error(`Failed to fetch content for ${category}`, error);
      return [];
    }

    return (data || []) as ContentItem[];
  } catch (error) {
    logger.error(
      `Error in getContentByCategory(${category})`,
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

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

export async function getFullContentBySlug(
  category: CategoryId,
  slug: string
): Promise<FullContentItem | null> {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();
        const { data, error } = await supabase
          .from('content')
          .select('*')
          .eq('category', category)
          .eq('slug', slug)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null;
          logger.error(`Failed to fetch ${category}/${slug}`, error);
          return null;
        }

        return data ? (data as unknown as FullContentItem) : null;
      } catch (error) {
        logger.error(
          `Error in getFullContentBySlug(${category}, ${slug})`,
          error instanceof Error ? error : new Error(String(error))
        );
        return null;
      }
    },
    [`content-full-${category}-${slug}`],
    { revalidate: 3600, tags: [`content-${category}`, `content-${category}-${slug}`] }
  )();
}

export async function getAllContent(filters?: ContentFilters): Promise<ContentItem[]> {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();
        let query = supabase.from('content').select('*');

        if (filters?.category) {
          if (Array.isArray(filters.category)) {
            query = query.in('category', filters.category);
          } else {
            query = query.eq('category', filters.category);
          }
        }

        if (filters?.tags && filters.tags.length > 0) {
          query = query.overlaps('tags', filters.tags);
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
          query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        const orderBy = filters?.orderBy || 'slug';
        const ascending = filters?.ascending ?? true;
        query = query.order(orderBy, { ascending });

        if (filters?.limit) {
          query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) {
          logger.error('Failed to fetch all content', error);
          return [];
        }

        return data ? (data as unknown as ContentItem[]) : [];
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

export async function getContentCount(category?: CategoryId): Promise<number> {
  return unstable_cache(
    async () => {
      try {
        const supabase = createAnonClient();
        let query = supabase.from('content').select('*', { count: 'exact', head: true });

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

export async function getFilteredContent(filters: ContentFilters): Promise<ContentItem[]> {
  return getAllContent(filters);
}
