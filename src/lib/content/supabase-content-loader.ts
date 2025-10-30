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

/** Wrapper for content queries with standardized error handling */
async function withErrorHandling<T>(
  operation: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(context, error instanceof Error ? error : new Error(String(error)));
    return fallback;
  }
}

export async function getContentByCategory(category: CategoryId): Promise<ContentItem[]> {
  return withErrorHandling(
    async () => {
      const supabase = createAnonClient();
      const { data, error } = await supabase.rpc('get_enriched_content', {
        p_category: category,
        p_limit: 1000,
        p_offset: 0,
      });
      if (error) throw error;
      return (data || []) as ContentItem[];
    },
    [],
    `getContentByCategory(${category})`
  );
}

export async function getContentBySlug(
  category: CategoryId,
  slug: string
): Promise<ContentItem | null> {
  return unstable_cache(
    () =>
      withErrorHandling(
        async () => {
          const supabase = createAnonClient();
          const { data, error } = await supabase.rpc('get_enriched_content', {
            p_category: category,
            p_slug: slug,
            p_limit: 1,
            p_offset: 0,
          });
          if (error) throw error;
          const results = (data || []) as ContentItem[];
          return results.length > 0 ? (results[0] ?? null) : null;
        },
        null,
        `getContentBySlug(${category}, ${slug})`
      ),
    [`enriched-content-${category}-${slug}`],
    {
      revalidate: 3600,
      tags: [`content-${category}`, `content-${category}-${slug}`],
    }
  )();
}

export async function getFullContentBySlug(
  category: CategoryId,
  slug: string
): Promise<FullContentItem | null> {
  return unstable_cache(
    () =>
      withErrorHandling(
        async () => {
          const supabase = createAnonClient();
          const { data, error } = await supabase
            .from('content')
            .select('*')
            .eq('category', category)
            .eq('slug', slug)
            .single();
          if (error && error.code !== 'PGRST116') throw error;
          return data ? (data as unknown as FullContentItem) : null;
        },
        null,
        `getFullContentBySlug(${category}, ${slug})`
      ),
    [`content-full-${category}-${slug}`],
    { revalidate: 3600, tags: [`content-${category}`, `content-${category}-${slug}`] }
  )();
}

export async function getAllContent(filters?: ContentFilters): Promise<ContentItem[]> {
  return unstable_cache(
    () =>
      withErrorHandling(
        async () => {
          const supabase = createAnonClient();
          let query = supabase.from('content').select('*');

          if (filters?.category) {
            query = Array.isArray(filters.category)
              ? query.in('category', filters.category)
              : query.eq('category', filters.category);
          }
          if (filters?.tags?.length) query = query.overlaps('tags', filters.tags);
          if (filters?.author) {
            query = Array.isArray(filters.author)
              ? query.in('author', filters.author)
              : query.eq('author', filters.author);
          }
          if (filters?.sourceTable) {
            query = Array.isArray(filters.sourceTable)
              ? query.in('source_table', filters.sourceTable)
              : query.eq('source_table', filters.sourceTable);
          }
          if (filters?.search) {
            query = query.textSearch('fts_vector', filters.search, { type: 'websearch' });
          }

          query = query.order(filters?.orderBy || 'slug', {
            ascending: filters?.ascending ?? true,
          });
          if (filters?.limit) query = query.limit(filters.limit);

          const { data, error } = await query;
          if (error) throw error;
          return (data as unknown as ContentItem[]) || [];
        },
        [],
        'getAllContent'
      ),
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
    { revalidate: 3600, tags: ['content-all'] }
  )();
}

export async function getContentCount(category?: CategoryId): Promise<number> {
  return unstable_cache(
    () =>
      withErrorHandling(
        async () => {
          const supabase = createAnonClient();
          let query = supabase.from('content').select('*', { count: 'exact', head: true });
          if (category) query = query.eq('category', category);
          const { count, error } = await query;
          if (error) throw error;
          return count || 0;
        },
        0,
        `getContentCount(${category || 'all'})`
      ),
    [`content-count-${category || 'all'}`],
    {
      revalidate: 3600,
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
    () =>
      withErrorHandling(
        async () => {
          const supabase = createAnonClient();
          let query = supabase
            .from('mv_content_stats')
            .select('*')
            .order(orderBy, { ascending: false, nullsFirst: false })
            .limit(limit);
          if (category) query = query.eq('category', category);
          const { data, error } = await query;
          if (error) throw error;
          return data || [];
        },
        [],
        'getContentWithAnalytics'
      ),
    [`content-analytics-${category || 'all'}-${orderBy}-${limit}`],
    {
      revalidate: 3600,
      tags: category ? [`content-${category}`] : ['content-all'],
    }
  )();
}

export async function getTrendingContent(category?: CategoryId, limit = 20) {
  return unstable_cache(
    () =>
      withErrorHandling(
        async () => {
          const supabase = createAnonClient();
          let query = supabase
            .from('content_popularity')
            .select('*')
            .limit(limit)
            .order('popularity_score', { ascending: false });
          if (category) query = query.eq('category', category);
          const { data, error } = await query;
          if (error) throw error;
          return data || [];
        },
        [],
        'getTrendingContent'
      ),
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
