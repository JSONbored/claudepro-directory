import { z } from 'zod';
import { contentCache } from '@/src/lib/cache.server';
import { UI_CONFIG } from '@/src/lib/constants';
import { CACHE_CONFIG } from '@/src/lib/constants/cache';
import { getContentByCategory } from '@/src/lib/content/content-loaders';
import { createApiRoute } from '@/src/lib/error-handler';
import { rateLimiters } from '@/src/lib/rate-limiter.server';
import {
  createCursor,
  createPaginationMeta,
  cursorPaginationQuerySchema,
  decodeCursor,
} from '@/src/lib/schemas/primitives/cursor-pagination.schema';
import { getBatchTrendingData } from '@/src/lib/trending/calculator.server';

export const runtime = 'nodejs';

// Response type for trending guides API
type TrendingGuideItem = {
  slug: string;
  title: string;
  url: string;
  views: number;
  rank: number;
};

type TrendingGuidesResponse = {
  items: TrendingGuideItem[];
  nextCursor: string | null;
  hasMore: boolean;
  meta: {
    total: number;
    limit: number;
    currentPage: number;
  };
};

// Query parameters schema with cursor pagination
const querySchema = z
  .object({
    category: z
      .enum(['guides', 'tutorials', 'use-cases', 'workflows', 'comparisons'])
      .optional()
      .describe('Content category filter for trending guides'),
  })
  .merge(cursorPaginationQuerySchema)
  .describe('Trending guides query parameters with cursor-based pagination');

const route = createApiRoute({
  validate: {
    query: querySchema,
  },
  rateLimit: { limiter: rateLimiters.api },
  response: { envelope: false },
  handlers: {
    GET: async ({ query, okRaw, logger: requestLogger }) => {
      const params = query as z.infer<typeof querySchema>;

      requestLogger.info('Trending guides API request with cursor pagination', {
        category: params.category || 'all',
        limit: params.limit,
        hasCursor: !!params.cursor,
      });

      const category = params.category || 'guides';

      // Decode cursor to get starting position
      let startIndex = 0;
      if (params.cursor) {
        const decoded = decodeCursor(params.cursor);
        if (decoded && typeof decoded.id === 'number') {
          startIndex = decoded.id;
        } else {
          requestLogger.warn('Invalid cursor provided, starting from beginning', undefined, {
            cursor: params.cursor,
          });
        }
      }

      const limit = Math.min(
        params.limit ?? UI_CONFIG.pagination.defaultLimit,
        UI_CONFIG.pagination.maxLimit
      );
      const fetchLimit = limit + 1;

      // Build normalized cache key (allowed charset only; avoid raw base64 cursor)
      const cacheKey = `guides/trending:cat:${category}:start:${startIndex}:limit:${limit}`;

      // Try cache first (fast path)
      try {
        const cached = await contentCache.getAPIResponse<TrendingGuidesResponse>(cacheKey);
        if (cached) {
          return okRaw(cached, {
            sMaxAge: 300, // 5 minutes (API revalidation)
            staleWhileRevalidate: 86400,
            cacheHit: true,
            additionalHeaders: {
              'X-Total-Count': String(cached.meta.total),
              'X-Has-More': String(cached.hasMore),
            },
          });
        }
      } catch (err) {
        requestLogger.warn('Trending API cache read failed; continuing without cache', undefined, {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      // OPTIMIZATION: Use new trending calculator (calculates from view counters)
      // Load content for this category
      const guides = await getContentByCategory('guides');

      // Calculate trending using Redis view counts
      const trendingData = await getBatchTrendingData({
        guides: guides.map((item) => ({ ...item, category: 'guides' as const })),
      });

      // Extract trending items and paginate
      const allTrending = trendingData.trending;
      const paginatedItems = allTrending.slice(startIndex, startIndex + fetchLimit);
      const hasMore = paginatedItems.length > limit;
      const trendingItems = hasMore ? paginatedItems.slice(0, limit) : paginatedItems;

      const trendingGuides = trendingItems.map((item, index) => ({
        slug: item.slug,
        title: item.title,
        url: `/guides/${category}/${item.slug}`,
        views: item.viewCount || 0,
        rank: startIndex + index + 1,
      }));

      const pagination = createPaginationMeta(trendingGuides, limit, hasMore, (item) =>
        createCursor(startIndex + trendingGuides.indexOf(item) + 1)
      );

      const response = {
        guides: trendingGuides,
        category,
        pagination,
        timestamp: new Date().toISOString(),
      };

      // Write-through cache on miss
      try {
        await contentCache.cacheAPIResponse(cacheKey, response, CACHE_CONFIG.ttl.api);
      } catch (err) {
        requestLogger.warn('Trending API cache write failed; serving fresh response', undefined, {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      return okRaw(response, {
        sMaxAge: 300, // 5 minutes (API revalidation)
        staleWhileRevalidate: 86400,
        cacheHit: false,
        additionalHeaders: {
          'X-Total-Count': String(allTrending.length),
          'X-Has-More': String(pagination.hasMore),
        },
      });
    },
  },
});

export async function GET(
  request: Request,
  context: { params: Promise<Record<string, never>> }
): Promise<Response> {
  if (!route.GET) return new Response('Method Not Allowed', { status: 405 });
  return route.GET(request, context);
}
