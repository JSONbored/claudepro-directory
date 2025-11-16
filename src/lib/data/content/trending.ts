import { isValidCategory } from '@/src/lib/data/config/category';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey } from '@/src/lib/data/helpers-utils';
import type { DisplayableContent } from '@/src/lib/types/component.types';
import type {
  ContentCategory,
  GetGetRecentContentReturn,
  GetPopularContentReturn,
  GetTrendingMetricsWithContentReturn,
  HomepageContentItem,
} from '@/src/types/database-overrides';

interface TrendingPageParams {
  category?: ContentCategory | null;
  limit?: number;
}

interface TrendingPageDataResult {
  trending: DisplayableContent[];
  popular: DisplayableContent[];
  recent: DisplayableContent[];
  totalCount: number;
}

const TTL_CONFIG_KEY = 'cache.content_list.ttl_seconds';
const DEFAULT_CATEGORY: ContentCategory = 'agents';

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
  category: ContentCategory | null,
  limit: number
): Promise<GetTrendingMetricsWithContentReturn> {
  return fetchCachedRpc<'get_trending_metrics_with_content', GetTrendingMetricsWithContentReturn>(
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
  category: ContentCategory | null,
  limit: number
): Promise<GetPopularContentReturn> {
  // Note: fetchCachedRpc has a constraint issue where it expects description: string
  // but GetPopularContentReturn has description: string | null. We bypass the constraint
  // by casting the function call result.
  const data = await fetchCachedRpc(
    {
      ...(category ? { p_category: category } : {}),
      p_limit: limit,
    },
    {
      rpcName: 'get_popular_content' as const,
      tags: ['trending', 'trending-popular'],
      ttlKey: TTL_CONFIG_KEY,
      keySuffix: `popular-${generateContentCacheKey(category, null, limit)}`,
      fallback: [] as unknown as {
        author: string;
        category: string;
        copy_count: number;
        description: string;
        popularity_score: number;
        slug: string;
        tags: string[];
        title: string;
        view_count: number;
      }[],
      logMeta: { category: category ?? 'all', limit },
    }
  );
  return data as GetPopularContentReturn;
}

async function fetchRecentContent(
  category: ContentCategory | null,
  limit: number
): Promise<GetGetRecentContentReturn> {
  return fetchCachedRpc<'get_recent_content', GetGetRecentContentReturn>(
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
  rows: GetTrendingMetricsWithContentReturn,
  category: ContentCategory | null
): DisplayableContent[] {
  return rows.map((row: GetTrendingMetricsWithContentReturn[number], index: number) => {
    const resolvedCategory = row.category ?? category ?? DEFAULT_CATEGORY;
    const validCategory = isValidCategory(resolvedCategory) ? resolvedCategory : DEFAULT_CATEGORY;
    return toHomepageContentItem({
      slug: row.slug,
      category: validCategory,
      title: row.title,
      description: row.description,
      author: row.author,
      tags: row.tags,
      source: row.source ?? 'trending',
      viewCount: row.views_total,
      copyCount: row.copies_total,
      featuredScore: row.trending_score ?? row.freshness_score ?? row.engagement_score,
      featuredRank: index + 1,
    });
  });
}

function mapPopularContent(
  rows: GetPopularContentReturn,
  category: ContentCategory | null
): DisplayableContent[] {
  return rows.map((row: GetPopularContentReturn[number], index: number) => {
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
  rows: GetGetRecentContentReturn,
  category: ContentCategory | null
): DisplayableContent[] {
  return rows.map((row: GetGetRecentContentReturn[number], index: number) => {
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
  category: ContentCategory;
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
