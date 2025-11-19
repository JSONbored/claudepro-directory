import { isValidCategory } from '@/src/lib/data/config/category';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { generateContentCacheKey } from '@/src/lib/data/helpers-utils';
import type { DisplayableContent } from '@/src/lib/types/component.types';
import type { Database } from '@/src/types/database.types';
import type {
  GetGetPopularContentReturn,
  GetGetRecentContentReturn,
  GetGetTrendingMetricsWithContentReturn,
  HomepageContentItem,
} from '@/src/types/database-overrides';

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
): Promise<GetGetTrendingMetricsWithContentReturn> {
  return fetchCachedRpc<
    'get_trending_metrics_with_content',
    GetGetTrendingMetricsWithContentReturn
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
): Promise<GetGetPopularContentReturn> {
  // Note: fetchCachedRpc has a constraint issue where it expects description: string
  // but GetGetPopularContentReturn has description: string | null. We bypass the constraint
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
  return data as GetGetPopularContentReturn;
}

async function fetchRecentContent(
  category: Database['public']['Enums']['content_category'] | null,
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
  rows: GetGetTrendingMetricsWithContentReturn,
  category: Database['public']['Enums']['content_category'] | null
): DisplayableContent[] {
  if (!rows || rows.length === 0) return [];
  return rows.map((row: GetGetTrendingMetricsWithContentReturn[number], index: number) => {
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
      viewCount: row.views_total ?? 0,
      copyCount: row.copies_total ?? 0,
      featuredScore: row.trending_score ?? row.engagement_score ?? row.freshness_score ?? 0,
      featuredRank: index + 1,
    });
  });
}

function mapPopularContent(
  rows: GetGetPopularContentReturn,
  category: Database['public']['Enums']['content_category'] | null
): DisplayableContent[] {
  return rows.map((row: GetGetPopularContentReturn[number], index: number) => {
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
  category: Database['public']['Enums']['content_category'] | null
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
