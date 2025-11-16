/**
 * Supabase Content Loader - Queries unified content table
 * Uses Statsig-controlled cache TTLs for all queries
 */

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { getCacheTtl } from '@/src/lib/data/config/cache-config';
import type { CategoryId } from '@/src/lib/data/config/category';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import {
  generateContentCacheKey,
  generateContentTags,
  normalizeRpcResult,
} from '@/src/lib/data/helpers-utils';
import type { Tables } from '@/src/types/database.types';
import type { GetEnrichedContentListReturn } from '@/src/types/database-overrides';

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

export async function getContentByCategory(
  category: CategoryId
): Promise<GetEnrichedContentListReturn> {
  return fetchCachedRpc<GetEnrichedContentListReturn>(
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
  async (category: CategoryId, slug: string): Promise<ContentItem | null> => {
    const ttl = await getCacheTtl('cache.content_detail.ttl_seconds');

    return unstable_cache(
      async () => {
        const data = await fetchCachedRpc<ContentItem[]>(
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
        return normalizeRpcResult(data);
      },
      [`enriched-content-${category}-${slug}`],
      {
        revalidate: ttl,
        tags: generateContentTags(category, slug),
      }
    )();
  }
);

export const getFullContentBySlug = cache(
  async (category: CategoryId, slug: string): Promise<FullContentItem | null> => {
    return fetchCachedRpc<FullContentItem | null>(
      {
        p_category: category,
        p_slug: slug,
      },
      {
        rpcName: 'get_full_content_by_slug',
        tags: generateContentTags(category, slug),
        ttlKey: 'cache.content_detail.ttl_seconds',
        keySuffix: generateContentCacheKey(category, slug, null, null, 'full'),
        fallback: null,
        logMeta: { category, slug },
      }
    );
  }
);

export const getAllContent = cache(async (filters?: ContentFilters): Promise<ContentItem[]> => {
  const filterMeta = filters ? { filterKeys: Object.keys(filters).length } : undefined;
  return fetchCachedRpc<ContentItem[]>(
    {
      filters,
    },
    {
      rpcName: 'get_all_content',
      tags: ['content-all'],
      ttlKey: 'cache.content_list.ttl_seconds',
      keySuffix: JSON.stringify(filters ?? {}),
      fallback: [],
      ...(filterMeta ? { logMeta: filterMeta } : {}),
    }
  );
});

export const getContentCount = cache(async (category?: CategoryId): Promise<number> => {
  return fetchCachedRpc<number>(
    {
      p_category: category ?? null,
    },
    {
      rpcName: 'get_content_count',
      tags: generateContentTags(category),
      ttlKey: 'cache.content_list.ttl_seconds',
      keySuffix: generateContentCacheKey(category),
      fallback: 0,
      logMeta: { category: category ?? 'all' },
    }
  );
});

export const getTrendingContent = cache(async (category?: CategoryId, limit = 20) => {
  return fetchCachedRpc<ContentListItem[]>(
    {
      p_category: category ?? null,
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

export const getFilteredContent = cache(async (filters: ContentFilters): Promise<ContentItem[]> => {
  return getAllContent(filters);
});
