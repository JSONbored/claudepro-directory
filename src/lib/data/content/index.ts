/**
 * Supabase Content Loader - Queries unified content table
 * Uses Statsig-controlled cache TTLs for all queries
 */

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { getCacheTtl } from '@/src/lib/data/config/cache-config';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey, generateContentTags } from '@/src/lib/data/helpers-utils';
import type {
  ContentCategory,
  ContentType,
  GetGetEnrichedContentListReturn,
  Tables,
} from '@/src/types/database-overrides';

export type FullContentItem = ContentType;

export interface ContentFilters {
  category?: ContentCategory | ContentCategory[];
  tags?: string[];
  author?: string | string[];
  sourceTable?: string | string[];
  search?: string;
  orderBy?: 'slug' | 'created_at' | 'updated_at' | 'title';
  ascending?: boolean;
  limit?: number;
}

export async function getContentByCategory(
  category: ContentCategory
): Promise<GetGetEnrichedContentListReturn> {
  return fetchCachedRpc<'get_enriched_content_list', GetGetEnrichedContentListReturn>(
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
    category: ContentCategory,
    slug: string
  ): Promise<GetGetEnrichedContentListReturn[number] | null> => {
    const ttl = await getCacheTtl('cache.content_detail.ttl_seconds');

    return unstable_cache(
      async () => {
        const data = await fetchCachedRpc<'get_enriched_content', GetGetEnrichedContentListReturn>(
          {
            p_category: category,
            p_slug: slug,
            p_limit: 1,
            p_offset: 0,
          },
          {
            rpcName: 'get_enriched_content',
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
// Use get_content_detail_complete or get_enriched_content instead
// This function is currently unused - consider removing or implementing with existing RPC
export const getFullContentBySlug = cache(
  async (
    category: ContentCategory,
    slug: string
  ): Promise<GetGetEnrichedContentListReturn[number] | null> => {
    // Fallback to getContentBySlug for now
    return getContentBySlug(category, slug);
  }
);

// TODO: RPC 'get_all_content' does not exist - using get_content_paginated instead
export const getAllContent = cache(
  async (filters?: ContentFilters): Promise<GetGetEnrichedContentListReturn> => {
    const filterMeta = filters ? { filterKeys: Object.keys(filters).length } : undefined;
    const category = Array.isArray(filters?.category) ? filters.category[0] : filters?.category;
    const author = Array.isArray(filters?.author) ? filters.author[0] : filters?.author;
    return fetchCachedRpc<'get_content_paginated', GetGetEnrichedContentListReturn>(
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
        fallback: [],
        ...(filterMeta ? { logMeta: filterMeta } : {}),
      }
    );
  }
);

// TODO: RPC 'get_content_count' does not exist - derive count from paginated result
// Consider creating a dedicated count RPC for better performance
export const getContentCount = cache(async (category?: ContentCategory): Promise<number> => {
  // Use get_content_paginated with limit=1 to get total (if RPC returns pagination metadata)
  // For now, return a placeholder - this needs a proper count RPC
  const data = await fetchCachedRpc<'get_content_paginated', GetGetEnrichedContentListReturn>(
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
      fallback: [],
      logMeta: { category: category ?? 'all' },
    }
  );
  // TODO: This is incorrect - we need the actual count, not array length
  // The RPC doesn't return total count metadata, so this is a temporary workaround
  return data.length;
});

export const getTrendingContent = cache(async (category?: ContentCategory, limit = 20) => {
  return fetchCachedRpc<'get_trending_content', Tables<'content'>[]>(
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
});

export const getFilteredContent = cache(
  async (filters: ContentFilters): Promise<GetGetEnrichedContentListReturn> => {
    return getAllContent(filters);
  }
);
