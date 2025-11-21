import { isValidCategory } from '@/src/lib/data/config/category';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey } from '@/src/lib/data/helpers-utils';
import type { DisplayableContent, HomepageContentItem } from '@/src/lib/types/component.types';
import type { Database } from '@/src/types/database.types';

interface TrendingPageParams {
  category?: Database['public']['Enums']['content_category'] | null;
  limit?: number;
}

interface TrendingPageDataResult {
  trending: DisplayableContent[];
  popular: DisplayableContent[];
  recent: DisplayableContent[];
  totalCount: number;
}

const TTL_CONFIG_KEY = 'cache.content_list.ttl_seconds';
const DEFAULT_CATEGORY: Database['public']['Enums']['content_category'] = 'agents';

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
  category: Database['public']['Enums']['content_category'] | null,
  limit: number
): Promise<Database['public']['Functions']['get_trending_metrics_with_content']['Returns']> {
  return fetchCachedRpc<
    'get_trending_metrics_with_content',
    Database['public']['Functions']['get_trending_metrics_with_content']['Returns']
  >(
    {
      ...(category ? { p_category: category } : {}),
      p_limit: limit,
    },
    {
      rpcName: 'get_trending_metrics_with_content',
      tags: ['trending', 'trending-page'],
      ttlKey: TTL_CONFIG_KEY,
      keySuffix: `metrics-${generateContentCacheKey(category, null, limit)}`,
      fallback: [],
      logMeta: { category: category ?? 'all', limit },
    }
  );
}

async function fetchPopularContent(
  category: Database['public']['Enums']['content_category'] | null,
  limit: number
): Promise<Database['public']['Functions']['get_popular_content']['Returns']> {
  return fetchCachedRpc<
    'get_popular_content',
    Database['public']['Functions']['get_popular_content']['Returns']
  >(
    {
      ...(category ? { p_category: category } : {}),
      p_limit: limit,
    },
    {
      rpcName: 'get_popular_content',
      tags: ['trending', 'trending-popular'],
      ttlKey: TTL_CONFIG_KEY,
      keySuffix: `popular-${generateContentCacheKey(category, null, limit)}`,
      fallback: [],
      logMeta: { category: category ?? 'all', limit },
    }
  );
}

async function fetchRecentContent(
  category: Database['public']['Enums']['content_category'] | null,
  limit: number
): Promise<Database['public']['Functions']['get_recent_content']['Returns']> {
  return fetchCachedRpc<
    'get_recent_content',
    Database['public']['Functions']['get_recent_content']['Returns']
  >(
    {
      ...(category ? { p_category: category } : {}),
      p_limit: limit,
      p_days: 30,
    },
    {
      rpcName: 'get_recent_content',
      tags: ['trending', 'trending-recent'],
      ttlKey: TTL_CONFIG_KEY,
      keySuffix: `recent-${generateContentCacheKey(category, null, limit)}`,
      fallback: [],
      logMeta: { category: category ?? 'all', limit },
    }
  );
}

function mapTrendingMetrics(
  rows: Database['public']['Functions']['get_trending_metrics_with_content']['Returns'],
  category: Database['public']['Enums']['content_category'] | null
): DisplayableContent[] {
  if (!rows || rows.length === 0) return [];
  return rows.map((row, index: number) => {
    // category is string from view, validate it's a valid ENUM value
    const resolvedCategory =
      (row.category as Database['public']['Enums']['content_category']) ??
      category ??
      DEFAULT_CATEGORY;
    const validCategory = isValidCategory(resolvedCategory) ? resolvedCategory : DEFAULT_CATEGORY;
    return toHomepageContentItem({
      slug: row.slug,
      category: validCategory,
      title: row.title,
      description: row.description,
      author: row.author,
      tags: row.tags,
      source: row.source ?? 'trending',
      viewCount: row.views_total ?? 0,
      copyCount: row.copies_total ?? 0,
      featuredScore: row.trending_score ?? row.engagement_score ?? row.freshness_score ?? 0,
      featuredRank: index + 1,
    });
  });
}

function mapPopularContent(
  rows: Database['public']['Functions']['get_popular_content']['Returns'],
  category: Database['public']['Enums']['content_category'] | null
): DisplayableContent[] {
  return rows.map((row, index: number) => {
    // category is string from view, validate it's a valid ENUM value
    const resolvedCategory =
      (row.category as Database['public']['Enums']['content_category']) ??
      category ??
      DEFAULT_CATEGORY;
    const validCategory = isValidCategory(resolvedCategory) ? resolvedCategory : DEFAULT_CATEGORY;
    return toHomepageContentItem({
      slug: row.slug,
      category: validCategory,
      title: row.title,
      description: row.description,
      author: row.author,
      tags: row.tags,
      viewCount: row.view_count,
      copyCount: row.copy_count,
      featuredScore: row.popularity_score,
      featuredRank: index + 1,
    });
  });
}

function mapRecentContent(
  rows: Database['public']['Functions']['get_recent_content']['Returns'],
  category: Database['public']['Enums']['content_category'] | null
): DisplayableContent[] {
  return rows.map((row, index: number) => {
    // category is string from table, validate it's a valid ENUM value
    const resolvedCategory =
      (row.category as Database['public']['Enums']['content_category']) ??
      category ??
      DEFAULT_CATEGORY;
    const validCategory = isValidCategory(resolvedCategory) ? resolvedCategory : DEFAULT_CATEGORY;
    return toHomepageContentItem({
      slug: row.slug,
      category: validCategory,
      title: row.title,
      description: row.description,
      author: row.author,
      tags: row.tags,
      created_at: row.created_at,
      date_added: row.created_at,
      featuredRank: index + 1,
    });
  });
}

function toHomepageContentItem(input: {
  slug: string;
  category: Database['public']['Enums']['content_category'];
  title?: string | null;
  description?: string | null;
  author?: string | null;
  tags?: string[] | null;
  source?: string | null;
  created_at?: string | null;
  date_added?: string | null;
  viewCount?: number | null;
  copyCount?: number | null;
  featuredScore?: number | null;
  featuredRank?: number | null;
}): HomepageContentItem {
  const timestamp = input.created_at ?? input.date_added ?? new Date().toISOString();

  return {
    slug: input.slug,
    title: input.title ?? input.slug,
    description: input.description ?? '',
    author: input.author ?? 'Community',
    tags: Array.isArray(input.tags) ? input.tags : [],
    source: input.source ?? 'community',
    created_at: input.created_at ?? timestamp,
    date_added: input.date_added ?? timestamp,
    category: input.category,
    view_count: input.viewCount ?? 0,
    copy_count: input.copyCount ?? 0,
    featured: input.featuredScore != null,
  };
}
