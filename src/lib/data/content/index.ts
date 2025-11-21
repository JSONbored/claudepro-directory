/**
 * Supabase Content Loader - Queries unified content table
 * Uses Statsig-controlled cache TTLs for all queries
 */

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { getCacheTtl } from '@/src/lib/data/config/cache-config';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey, generateContentTags } from '@/src/lib/data/helpers-utils';
import { toLogContextValue } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

export interface ContentFilters {
  category?:
    | Database['public']['Enums']['content_category']
    | Database['public']['Enums']['content_category'][];
  tags?: string[];
  author?: string | string[];
  sourceTable?: string | string[];
  search?: string;
  orderBy?: 'slug' | 'created_at' | 'updated_at' | 'title';
  ascending?: boolean;
  limit?: number;
}

export async function getContentByCategory(
  category: Database['public']['Enums']['content_category']
): Promise<Database['public']['Functions']['get_enriched_content_list']['Returns']> {
  return fetchCachedRpc<
    'get_enriched_content_list',
    Database['public']['Functions']['get_enriched_content_list']['Returns']
  >(
    {
      p_category: category,
      p_limit: 1000,
      p_offset: 0,
    },
    {
      rpcName: 'get_enriched_content_list',
      tags: generateContentTags(category),
      ttlKey: 'cache.content_list.ttl_seconds',
      keySuffix: generateContentCacheKey(category),
      fallback: [],
      logMeta: { category },
    }
  );
}

export const getContentBySlug = cache(
  async (
    category: Database['public']['Enums']['content_category'],
    slug: string
  ): Promise<Database['public']['CompositeTypes']['enriched_content_item'] | null> => {
    const ttl = await getCacheTtl('cache.content_detail.ttl_seconds');

    return unstable_cache(
      async () => {
        // Use get_enriched_content_list with slug filter (get_enriched_content was removed as unused)
        const data = await fetchCachedRpc<
          'get_enriched_content_list',
          Database['public']['Functions']['get_enriched_content_list']['Returns']
        >(
          {
            p_category: category,
            p_slugs: [slug],
            p_limit: 1,
            p_offset: 0,
          },
          {
            rpcName: 'get_enriched_content_list',
            tags: generateContentTags(category, slug),
            ttlKey: 'cache.content_detail.ttl_seconds',
            keySuffix: generateContentCacheKey(category, slug),
            fallback: [],
            logMeta: { category, slug },
          }
        );
        // RPC returns array, extract first item or null
        return data?.[0] ?? null;
      },
      [`enriched-content-${category}-${slug}`],
      {
        revalidate: ttl,
        tags: generateContentTags(category, slug),
      }
    )();
  }
);

// TODO: RPC 'get_full_content_by_slug' does not exist in database
// Use get_content_detail_complete or get_enriched_content_list instead
// This function is currently unused - consider removing or implementing with existing RPC
export const getFullContentBySlug = cache(
  async (
    category: Database['public']['Enums']['content_category'],
    slug: string
  ): Promise<Database['public']['CompositeTypes']['enriched_content_item'] | null> => {
    // Fallback to getContentBySlug for now
    return getContentBySlug(category, slug);
  }
);

// TODO: RPC 'get_all_content' does not exist - using get_content_paginated instead
export const getAllContent = cache(
  async (
    filters?: ContentFilters
  ): Promise<Database['public']['CompositeTypes']['enriched_content_item'][]> => {
    const category = Array.isArray(filters?.category) ? filters.category[0] : filters?.category;
    const author = Array.isArray(filters?.author) ? filters.author[0] : filters?.author;
    const result = await fetchCachedRpc<
      'get_content_paginated',
      Database['public']['Functions']['get_content_paginated']['Returns']
    >(
      {
        ...(category ? { p_category: category } : {}),
        ...(author ? { p_author: author } : {}),
        ...(filters?.tags ? { p_tags: filters.tags } : {}),
        ...(filters?.search ? { p_search: filters.search } : {}),
        p_order_by: filters?.orderBy ?? 'created_at',
        p_order_direction: filters?.ascending ? 'asc' : 'desc',
        p_limit: filters?.limit ?? 1000,
        p_offset: 0,
      },
      {
        rpcName: 'get_content_paginated',
        tags: ['content-all'],
        ttlKey: 'cache.content_list.ttl_seconds',
        keySuffix: JSON.stringify(filters ?? {}),
        fallback: { items: [], pagination: null, filters_applied: null },
        ...(filters ? { logMeta: { filters: toLogContextValue(filters) } } : {}),
      }
    );

    // Extract items array - return directly (snake_case from database)
    return (result.items ?? []) as Database['public']['CompositeTypes']['enriched_content_item'][];
  }
);

// TODO: RPC 'get_content_count' does not exist - derive count from paginated result
// Consider creating a dedicated count RPC for better performance
export const getContentCount = cache(
  async (category?: Database['public']['Enums']['content_category']): Promise<number> => {
    // Use get_content_paginated with limit=1 to get total (if RPC returns pagination metadata)
    // For now, return a placeholder - this needs a proper count RPC
    const data = await fetchCachedRpc<
      'get_content_paginated',
      Database['public']['Functions']['get_content_paginated']['Returns']
    >(
      {
        ...(category ? { p_category: category } : {}),
        p_limit: 1,
        p_offset: 0,
      },
      {
        rpcName: 'get_content_paginated',
        tags: generateContentTags(category),
        ttlKey: 'cache.content_list.ttl_seconds',
        keySuffix: generateContentCacheKey(category),
        fallback: { items: [], pagination: null, filters_applied: null },
        logMeta: { category: category ?? 'all' },
      }
    );
    // TODO: This is incorrect - we need the actual count, not array length
    // The RPC doesn't return total count metadata, so this is a temporary workaround
    return data.pagination?.total_count ?? 0;
  }
);

export const getTrendingContent = cache(
  async (category?: Database['public']['Enums']['content_category'], limit = 20) => {
    return fetchCachedRpc<
      'get_trending_content',
      Database['public']['Functions']['get_trending_content']['Returns']
    >(
      {
        ...(category ? { p_category: category } : {}),
        p_limit: limit,
      },
      {
        rpcName: 'get_trending_content',
        tags: ['trending', ...(category ? [`trending-${category}`] : ['trending-all'])],
        ttlKey: 'cache.content_list.ttl_seconds',
        keySuffix: generateContentCacheKey(category, null, limit),
        fallback: [],
        logMeta: { category: category ?? 'all', limit },
      }
    );
  }
);

export const getFilteredContent = cache(
  async (
    filters: ContentFilters
  ): Promise<Database['public']['CompositeTypes']['enriched_content_item'][]> => {
    return getAllContent(filters);
  }
);
