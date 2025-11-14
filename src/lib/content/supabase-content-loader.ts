/**
 * Supabase Content Loader - Queries unified content table
 * Uses Statsig-controlled cache TTLs for all queries
 */

import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import type { CategoryId } from '@/src/lib/config/category-config';
import { cacheConfigs } from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
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

export async function getContentByCategory(
  category: CategoryId
): Promise<GetEnrichedContentListReturn> {
  return withErrorHandling(
    async () => {
      // Edge-layer cached RPC call with Statsig-controlled TTL
      const data = await cachedRPCWithDedupe<GetEnrichedContentListReturn>(
        'get_enriched_content_list',
        {
          p_category: category,
          p_limit: 1000,
          p_offset: 0,
        },
        {
          tags: ['content', `content-${category}`],
          ttlConfigKey: 'cache.content_list.ttl_seconds',
          keySuffix: category,
        }
      );

      return (data || []) as GetEnrichedContentListReturn;
    },
    [],
    `getContentByCategory(${category})`
  );
}

export const getContentBySlug = cache(
  async (category: CategoryId, slug: string): Promise<ContentItem | null> => {
    const config = await cacheConfigs();
    const ttl = config['cache.content_detail.ttl_seconds'] as number;

    return unstable_cache(
      () =>
        withErrorHandling(
          async () => {
            const data = await cachedRPCWithDedupe<ContentItem[]>(
              'get_enriched_content',
              {
                p_category: category,
                p_slug: slug,
                p_limit: 1,
                p_offset: 0,
              },
              {
                tags: [`content-${category}`, `content-${category}-${slug}`],
                ttlConfigKey: 'cache.content_detail.ttl_seconds',
                keySuffix: `${category}-${slug}`,
              }
            );
            const results = data || [];
            return results.length > 0 ? (results[0] ?? null) : null;
          },
          null,
          `getContentBySlug(${category}, ${slug})`
        ),
      [`enriched-content-${category}-${slug}`],
      {
        revalidate: ttl,
        tags: [`content-${category}`, `content-${category}-${slug}`],
      }
    )();
  }
);

export const getFullContentBySlug = cache(
  async (category: CategoryId, slug: string): Promise<FullContentItem | null> => {
    const config = await cacheConfigs();
    const ttl = config['cache.content_detail.ttl_seconds'] as number;

    return unstable_cache(
      () =>
        withErrorHandling(
          async () => {
            const data = await cachedRPCWithDedupe<FullContentItem | null>(
              'get_full_content_by_slug',
              {
                p_category: category,
                p_slug: slug,
              },
              {
                tags: [`content-${category}`, `content-${category}-${slug}`],
                ttlConfigKey: 'cache.content_detail.ttl_seconds',
                keySuffix: `${category}-${slug}-full`,
              }
            );
            return data ?? null;
          },
          null,
          `getFullContentBySlug(${category}, ${slug})`
        ),
      [`content-full-${category}-${slug}`],
      { revalidate: ttl, tags: [`content-${category}`, `content-${category}-${slug}`] }
    )();
  }
);

export const getAllContent = cache(async (filters?: ContentFilters): Promise<ContentItem[]> => {
  const config = await cacheConfigs();
  const ttl = config['cache.content_list.ttl_seconds'] as number;

  return unstable_cache(
    () =>
      withErrorHandling(
        async () => {
          const data = await cachedRPCWithDedupe<ContentItem[]>(
            'get_all_content',
            {
              filters,
            },
            {
              tags: ['content-all'],
              ttlConfigKey: 'cache.content_list.ttl_seconds',
              keySuffix: JSON.stringify(filters ?? {}),
            }
          );

          return data || [];
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
    { revalidate: ttl, tags: ['content-all'] }
  )();
});

export const getContentCount = cache(async (category?: CategoryId): Promise<number> => {
  const config = await cacheConfigs();
  const ttl = config['cache.content_list.ttl_seconds'] as number;

  return unstable_cache(
    () =>
      withErrorHandling(
        async () => {
          const data = await cachedRPCWithDedupe<number>(
            'get_content_count',
            {
              p_category: category ?? null,
            },
            {
              tags: category ? [`content-${category}`] : ['content-all'],
              ttlConfigKey: 'cache.content_list.ttl_seconds',
              keySuffix: category ?? 'all',
            }
          );
          return data ?? 0;
        },
        0,
        `getContentCount(${category || 'all'})`
      ),
    [`content-count-${category || 'all'}`],
    {
      revalidate: ttl,
      tags: category ? [`content-${category}`] : ['content-all'],
    }
  )();
});

export const getTrendingContent = cache(async (category?: CategoryId, limit = 20) => {
  const config = await cacheConfigs();
  const ttl = config['cache.content_list.ttl_seconds'] as number;

  return unstable_cache(
    () =>
      withErrorHandling(
        async () => {
          const data = await cachedRPCWithDedupe<ContentListItem[]>(
            'get_trending_content',
            {
              p_category: category ?? null,
              p_limit: limit,
            },
            {
              tags: category ? [`trending-${category}`] : ['trending-all'],
              ttlConfigKey: 'cache.content_list.ttl_seconds',
              keySuffix: `${category ?? 'all'}-${limit}`,
            }
          );

          return data || [];
        },
        [],
        `getTrendingContent(${category ?? 'all'}, ${limit})`
      ),
    [`trending-${category || 'all'}-${limit}`],
    {
      revalidate: ttl,
      tags: category ? [`trending-${category}`] : ['trending-all'],
    }
  )();
});

export const getFilteredContent = cache(async (filters: ContentFilters): Promise<ContentItem[]> => {
  return getAllContent(filters);
});
