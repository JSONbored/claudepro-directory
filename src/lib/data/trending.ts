import type { CategoryId } from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import type { DisplayableContent } from '@/src/lib/types/component.types';
import { normalizeError } from '@/src/lib/utils/error.utils';

interface TrendingPageParams {
  category?: CategoryId | null;
  limit?: number;
}

interface TrendingPageDataResult {
  trending: DisplayableContent[];
  popular: DisplayableContent[];
  recent: DisplayableContent[];
  totalCount: number;
}

type TrendingMetricRow = {
  category: string | null;
  slug: string;
  title: string | null;
  description: string | null;
  author: string | null;
  tags: string[] | null;
  source: string | null;
  views_total: number | null;
  copies_total: number | null;
  bookmarks_total: number | null;
  trending_score: number | null;
  engagement_score: number | null;
  freshness_score: number | null;
};

type PopularContentRow = {
  category: string | null;
  slug: string;
  title: string | null;
  description: string | null;
  author: string | null;
  tags: string[] | null;
  view_count: number | null;
  copy_count: number | null;
  popularity_score: number | null;
};

type RecentContentRow = {
  category: string | null;
  slug: string;
  title: string | null;
  description: string | null;
  author: string | null;
  tags: string[] | null;
  created_at: string | null;
};

const TTL_CONFIG_KEY = 'cache.content_list.ttl_seconds';
const DEFAULT_CATEGORY: CategoryId = 'agents';

export async function getTrendingPageData(
  params: TrendingPageParams = {}
): Promise<TrendingPageDataResult> {
  const { category = null, limit = 12 } = params;
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const [trendingRaw, popularRaw, recentRaw] = await Promise.all([
    fetchTrendingMetrics(category, safeLimit),
    fetchPopularContent(category, safeLimit),
    fetchRecentContent(category, safeLimit),
  ]);

  const trending = mapTrendingMetrics(trendingRaw, category);
  const popular = mapPopularContent(popularRaw, category);
  const recent = mapRecentContent(recentRaw, category);

  return {
    trending,
    popular,
    recent,
    totalCount: trending.length,
  };
}

async function fetchTrendingMetrics(
  category: CategoryId | null,
  limit: number
): Promise<TrendingMetricRow[]> {
  try {
    const data = await cachedRPCWithDedupe<TrendingMetricRow[]>(
      'get_trending_metrics_with_content',
      {
        p_category: category,
        p_limit: limit,
      },
      {
        tags: ['trending', 'trending-page'],
        ttlConfigKey: TTL_CONFIG_KEY,
        keySuffix: `metrics-${category ?? 'all'}-${limit}`,
      }
    );
    return data ?? [];
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load trending metrics');
    logger.error('getTrendingPageData: get_trending_metrics_with_content failed', normalized, {
      category: category ?? 'all',
      limit,
    });
    return [];
  }
}

async function fetchPopularContent(
  category: CategoryId | null,
  limit: number
): Promise<PopularContentRow[]> {
  try {
    const data = await cachedRPCWithDedupe<PopularContentRow[]>(
      'get_popular_content',
      {
        p_category: category,
        p_limit: limit,
      },
      {
        tags: ['trending', 'trending-popular'],
        ttlConfigKey: TTL_CONFIG_KEY,
        keySuffix: `popular-${category ?? 'all'}-${limit}`,
      }
    );
    return data ?? [];
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load popular content');
    logger.error('getTrendingPageData: get_popular_content failed', normalized, {
      category: category ?? 'all',
      limit,
    });
    return [];
  }
}

async function fetchRecentContent(
  category: CategoryId | null,
  limit: number
): Promise<RecentContentRow[]> {
  try {
    const data = await cachedRPCWithDedupe<RecentContentRow[]>(
      'get_recent_content',
      {
        p_category: category,
        p_limit: limit,
        p_days: 30,
      },
      {
        tags: ['trending', 'trending-recent'],
        ttlConfigKey: TTL_CONFIG_KEY,
        keySuffix: `recent-${category ?? 'all'}-${limit}`,
      }
    );
    return data ?? [];
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load recent content');
    logger.error('getTrendingPageData: get_recent_content failed', normalized, {
      category: category ?? 'all',
      limit,
    });
    return [];
  }
}

function mapTrendingMetrics(
  rows: TrendingMetricRow[],
  category: CategoryId | null
): DisplayableContent[] {
  return rows.map((row) => ({
    category: (row.category ?? category ?? DEFAULT_CATEGORY) as CategoryId,
    slug: row.slug,
    title: row.title ?? row.slug,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    source: row.source ?? undefined,
    viewCount: row.views_total ?? undefined,
    copyCount: row.copies_total ?? undefined,
    bookmarkCount: row.bookmarks_total ?? undefined,
    popularity: row.trending_score ?? undefined,
    engagementScore: row.engagement_score ?? undefined,
    freshnessScore: row.freshness_score ?? undefined,
  }));
}

function mapPopularContent(
  rows: PopularContentRow[],
  category: CategoryId | null
): DisplayableContent[] {
  return rows.map((row) => ({
    category: (row.category ?? category ?? DEFAULT_CATEGORY) as CategoryId,
    slug: row.slug,
    title: row.title ?? row.slug,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    viewCount: row.view_count ?? undefined,
    copyCount: row.copy_count ?? undefined,
    popularity: row.popularity_score ?? undefined,
  }));
}

function mapRecentContent(
  rows: RecentContentRow[],
  category: CategoryId | null
): DisplayableContent[] {
  return rows.map((row) => ({
    category: (row.category ?? category ?? DEFAULT_CATEGORY) as CategoryId,
    slug: row.slug,
    title: row.title ?? row.slug,
    description: row.description ?? undefined,
    author: row.author ?? undefined,
    tags: Array.isArray(row.tags) ? row.tags : undefined,
    created_at: row.created_at ?? undefined,
  }));
}
