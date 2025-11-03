/**
 * Supabase Content Loader - Queries unified content table
 */

import { unstable_cache } from 'next/cache';
import type { CategoryId } from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Tables } from '@/src/types/database.types';

export type ContentItem = Tables<'content'> | Tables<'jobs'>;
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
          // Optimized: Select only commonly needed columns for list views (13/37 columns = 65% reduction)
          let query = supabase
            .from('content')
            .select(
              'id, category, slug, title, display_title, description, author, date_added, tags, features, use_cases, created_at, updated_at'
            );

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

          // Use content table with denormalized columns (100x faster than content_popularity MV)
          // Popularity score: view_count * 1 + bookmark_count * 5 + review_count * 3 + recency boost
          let query = supabase
            .from('content')
            .select(
              'category, slug, title, display_title, description, author, tags, created_at, view_count, bookmark_count, review_count, avg_rating'
            )
            .limit(limit)
            .order('view_count', { ascending: false }); // Primary sort by views (denormalized)

          if (category) query = query.eq('category', category);

          const { data, error } = await query;
          if (error) throw error;

          // Calculate popularity score client-side and re-sort
          // This is faster than complex SQL ORDER BY expression
          const scored = (data || []).map((item) => ({
            ...item,
            popularity_score:
              (item.view_count || 0) * 1 +
              (item.bookmark_count || 0) * 5 +
              (item.review_count || 0) * 3 +
              // Recency boost: +10 if created in last 7 days, +5 if last 30 days
              (new Date().getTime() - new Date(item.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
                ? 10
                : 0) +
              (new Date().getTime() - new Date(item.created_at).getTime() < 30 * 24 * 60 * 60 * 1000
                ? 5
                : 0),
          }));

          // Sort by calculated popularity score
          scored.sort((a, b) => b.popularity_score - a.popularity_score);

          return scored;
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
