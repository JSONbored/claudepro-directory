import 'server-only';

import { ContentService, TrendingService, type ContentFilterOptions } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';
import { cache } from 'react';

import { fetchCached } from '../../cache/fetch-cached.ts';
import { toLogContextValue } from '../../logger.ts';
import { QUERY_LIMITS } from '../config/constants.ts';
import {
  generateContentTags,
} from '../content-helpers.ts';

// OPTIMIZATION: Wrapped with React.cache() for request-level deduplication
// This prevents duplicate calls within the same request (React Server Component tree)
export const getContentByCategory = cache(
  async (
    category: Database['public']['Enums']['content_category']
  ): Promise<Database['public']['Functions']['get_enriched_content_list']['Returns']> => {
    const result = await fetchCached(
      (client) => new ContentService(client).getEnrichedContentList({
        p_category: category,
        p_limit: QUERY_LIMITS.content.default,
        p_offset: 0
      }),
      {
        keyParts: ['content', category],
        tags: generateContentTags(category),
        ttlKey: 'cache.content_list.ttl_seconds',
        fallback: [],
        logMeta: { category },
      }
    );
    return result;
  }
);

export const getContentBySlug = cache(
  async (
    category: Database['public']['Enums']['content_category'],
    slug: string
  ): Promise<Database['public']['CompositeTypes']['enriched_content_item'] | null> => {
    return fetchCached(
       async (client) => {
         // Manual service had getEnrichedContentBySlug which called get_enriched_content_list with p_slugs
         const data = await new ContentService(client).getEnrichedContentList({
           p_category: category,
           p_slugs: [slug],
           p_limit: 1,
           p_offset: 0
         });
         return data[0] ?? null;
       },
       {
          keyParts: ['content', category, slug],
          tags: generateContentTags(category, slug),
          ttlKey: 'cache.content_detail.ttl_seconds',
          fallback: null,
          logMeta: { category, slug },
       }
    );
  }
);

// REMOVED: getFullContentBySlug - redundant wrapper, use getContentBySlug directly

export const getAllContent = cache(
  async (
    filters?: ContentFilterOptions
  ): Promise<Database['public']['CompositeTypes']['enriched_content_item'][]> => {
    const category = filters?.categories?.[0];
    
    return fetchCached(
      async (client) => {
         const result = await new ContentService(client).getContentPaginated({
            ...(category ? { p_category: category } : {}),
            ...(filters?.tags ? { p_tags: filters.tags } : {}),
            ...(filters?.search ? { p_search: filters.search } : {}),
            ...(filters?.author ? { p_author: filters.author } : {}),
            p_order_by: filters?.orderBy ?? 'created_at',
            p_order_direction: filters?.orderDirection ?? 'desc',
            p_limit: filters?.limit ?? QUERY_LIMITS.content.default,
            p_offset: 0
         });
         return (result.items ?? []) as Database['public']['CompositeTypes']['enriched_content_item'][];
      },
      {
        // Next.js automatically handles serialization of keyParts array
        keyParts: [
          'content-all',
          category ?? 'all',
          ...(filters?.tags ?? []),
          filters?.search ?? '',
          filters?.author ?? '',
          filters?.orderBy ?? 'created_at',
          filters?.orderDirection ?? 'desc',
          filters?.limit ?? QUERY_LIMITS.content.default,
        ],
        tags: ['content-all'],
        ttlKey: 'cache.content_list.ttl_seconds',
        fallback: [] as Database['public']['CompositeTypes']['enriched_content_item'][],
        ...(filters ? { logMeta: { filters: toLogContextValue(filters as Record<string, unknown>) } } : {})
      }
    );
  }
);

export const getContentCount = cache(
  async (category?: Database['public']['Enums']['content_category']): Promise<number> => {
    return fetchCached(
      async (client) => {
        const result = await new ContentService(client).getContentPaginated({
          ...(category ? { p_category: category } : {}),
          p_limit: 1,
          p_offset: 0,
          p_order_by: 'created_at',
          p_order_direction: 'desc'
        });
        return result.pagination?.total_count ?? 0;
      },
      {
        keyParts: ['content-count', category ?? 'all'],
        tags: generateContentTags(category),
        ttlKey: 'cache.content_list.ttl_seconds',
        fallback: 0,
        logMeta: { category: category ?? 'all' }
      }
    );
  }
);

export const getTrendingContent = cache(
  async (category?: Database['public']['Enums']['content_category'], limit = 20) => {
    return fetchCached(
      (client) => new TrendingService(client).getTrendingContent({
        ...(category ? { p_category: category } : {}),
        p_limit: limit
      }),
      {
        keyParts: ['trending', category ?? 'all', limit],
        tags: ['trending', ...(category ? [`trending-${category}`] : ['trending-all'])],
        ttlKey: 'cache.content_list.ttl_seconds',
        fallback: [],
        logMeta: { category: category ?? 'all', limit },
      }
    );
  }
);

// REMOVED: getFilteredContent - redundant wrapper, use getAllContent directly

export const getConfigurationCount = cache(async () => getContentCount());

interface TrendingPageParameters {
  category?: Database['public']['Enums']['content_category'] | null;
  limit?: number;
}

type TrendingMetricsRows =
  Database['public']['Functions']['get_trending_metrics_with_content']['Returns'];
type PopularContentRows = Database['public']['Functions']['get_popular_content']['Returns'];
type RecentContentRows = Database['public']['Functions']['get_recent_content']['Returns'];

interface TrendingPageDataResult {
  popular: PopularContentRows;
  recent: RecentContentRows;
  totalCount: number;
  trending: TrendingMetricsRows;
}

export async function getTrendingPageData(
  parameters: TrendingPageParameters = {}
): Promise<TrendingPageDataResult> {
  const { category = null, limit = 12 } = parameters;
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const [trending, popular, recent] = await Promise.all([
    fetchCached(
      (client) => new TrendingService(client).getTrendingMetrics({
        ...(category ? { p_category: category } : {}),
        p_limit: safeLimit
      }),
      {
        keyParts: ['trending-metrics', category ?? 'all', safeLimit],
        tags: ['trending', 'trending-page'],
        ttlKey: 'cache.content_list.ttl_seconds',
        fallback: [],
        logMeta: { category: category ?? 'all', limit: safeLimit },
      }
    ),
    fetchCached(
      (client) => new TrendingService(client).getPopularContent({
        ...(category ? { p_category: category } : {}),
        p_limit: safeLimit
      }),
      {
        keyParts: ['trending-popular', category ?? 'all', safeLimit],
        tags: ['trending', 'trending-popular'],
        ttlKey: 'cache.content_list.ttl_seconds',
        fallback: [],
        logMeta: { category: category ?? 'all', limit: safeLimit },
      }
    ),
    fetchCached(
      (client) => new TrendingService(client).getRecentContent({
        ...(category ? { p_category: category } : {}),
        p_limit: safeLimit,
        p_days: 30
      }),
      {
        keyParts: ['trending-recent', category ?? 'all', safeLimit, 30],
        tags: ['trending', 'trending-recent'],
        ttlKey: 'cache.content_list.ttl_seconds',
        fallback: [],
        logMeta: { category: category ?? 'all', limit: safeLimit },
      }
    )
  ]);

  return {
    trending,
    popular,
    recent,
    totalCount: trending.length,
  };
}
