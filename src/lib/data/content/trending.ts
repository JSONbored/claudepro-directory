import type { CategoryId } from '@/src/lib/data/config/category';
import { isValidCategory } from '@/src/lib/data/config/category';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey } from '@/src/lib/data/helpers-utils';
import type { DisplayableContent } from '@/src/lib/types/component.types';
import type {
  GetPopularContentReturn,
  GetRecentContentReturn,
  GetTrendingMetricsReturn,
  HomepageContentItem,
} from '@/src/types/database-overrides';

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
): Promise<GetTrendingMetricsReturn> {
  return fetchCachedRpc<GetTrendingMetricsReturn>(
    {
      p_category: category,
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
  category: CategoryId | null,
  limit: number
): Promise<GetPopularContentReturn> {
  return fetchCachedRpc<GetPopularContentReturn>(
    {
      p_category: category,
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
  category: CategoryId | null,
  limit: number
): Promise<GetRecentContentReturn> {
  return fetchCachedRpc<GetRecentContentReturn>(
    {
      p_category: category,
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
  rows: GetTrendingMetricsReturn,
  category: CategoryId | null
): DisplayableContent[] {
  return rows.map((row, index) => {
    const resolvedCategory = row.category ?? category ?? DEFAULT_CATEGORY;
    const validCategory = isValidCategory(resolvedCategory) ? resolvedCategory : DEFAULT_CATEGORY;
    return toHomepageContentItem({
      slug: row.slug,
      category: validCategory,
      title: row.title,
      description: row.description,
      author: row.author,
      tags: row.tags,
      source: row.source,
      viewCount: row.views_total,
      copyCount: row.copies_total,
      featuredScore: row.trending_score ?? row.freshness_score ?? row.engagement_score,
      featuredRank: index + 1,
    });
  });
}

function mapPopularContent(
  rows: GetPopularContentReturn,
  category: CategoryId | null
): DisplayableContent[] {
  return rows.map((row, index) => {
    const resolvedCategory = row.category ?? category ?? DEFAULT_CATEGORY;
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
  rows: GetRecentContentReturn,
  category: CategoryId | null
): DisplayableContent[] {
  return rows.map((row, index) => {
    const resolvedCategory = row.category ?? category ?? DEFAULT_CATEGORY;
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
  category: CategoryId;
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
    id: `${input.slug}-${input.category}-${input.featuredRank ?? 'item'}`,
    slug: input.slug,
    title: input.title ?? input.slug,
    description: input.description ?? '',
    author: input.author ?? 'Community',
    tags: Array.isArray(input.tags) ? input.tags : [],
    source: input.source ?? 'community',
    created_at: input.created_at ?? timestamp,
    date_added: input.date_added ?? timestamp,
    category: input.category,
    viewCount: input.viewCount ?? 0,
    copyCount: input.copyCount ?? 0,
    _featured:
      input.featuredScore != null
        ? {
            rank: input.featuredRank ?? 0,
            score: input.featuredScore,
          }
        : null,
  };
}
