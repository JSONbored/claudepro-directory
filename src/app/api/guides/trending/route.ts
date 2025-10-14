import { z } from 'zod';
import { contentCache, statsRedis } from '@/src/lib/cache';
import { CACHE_CONFIG, REVALIDATE_TIMES, UI_CONFIG } from '@/src/lib/constants';
import { createApiRoute } from '@/src/lib/error-handler';
import {
  createCursor,
  createPaginationMeta,
  cursorPaginationQuerySchema,
  decodeCursor,
} from '@/src/lib/schemas/primitives/cursor-pagination.schema';
import { viewCountService } from '@/src/lib/services/view-count.service';
import { rateLimiters } from '@/src/lib/rate-limiter';

export const runtime = 'nodejs';

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

const { GET } = createApiRoute({
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
        const cached = await contentCache.getAPIResponse<any>(cacheKey);
        if (cached) {
          // Compute lightweight metadata for headers (do not mutate cached body)
          const totalCount = (await statsRedis.getTrending(category, 100)).length;

          return okRaw(cached, {
            sMaxAge: REVALIDATE_TIMES.api,
            staleWhileRevalidate: 86400,
            cacheHit: true,
            additionalHeaders: {
              'X-Total-Count': String(totalCount),
              'X-Has-More': String(Boolean(cached?.pagination?.hasMore)),
            },
          });
        }
      } catch (err) {
        requestLogger.warn('Trending API cache read failed; continuing without cache', undefined, {
          error: err instanceof Error ? err.message : String(err),
        });
      }

      const allTrendingSlugs = await statsRedis.getTrending(category, 100);
      const paginatedSlugs = allTrendingSlugs.slice(startIndex, startIndex + fetchLimit);
      const hasMore = paginatedSlugs.length > limit;
      const trendingSlugs = hasMore ? paginatedSlugs.slice(0, limit) : paginatedSlugs;

      const viewCountRequests = trendingSlugs.map((slug) => ({ category, slug }));
      const viewCounts = await viewCountService.getBatchViewCounts(viewCountRequests);

      const trendingGuides = trendingSlugs.map((slug, index) => {
        const viewCountKey = `${category}:${slug}`;
        const viewCountResult = viewCounts[viewCountKey];
        const absoluteIndex = startIndex + index;

        return {
          slug,
          title: slug
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
          url: `/guides/${category}/${slug}`,
          views: viewCountResult?.views || 0,
          rank: absoluteIndex + 1,
        };
      });

      const pagination = createPaginationMeta(
        trendingGuides,
        limit,
        hasMore,
        (item) => createCursor(startIndex + trendingGuides.indexOf(item) + 1)
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
        sMaxAge: REVALIDATE_TIMES.api,
        staleWhileRevalidate: 86400,
        cacheHit: false,
        additionalHeaders: {
          'X-Total-Count': String(allTrendingSlugs.length),
          'X-Has-More': String(pagination.hasMore),
        },
      });
    },
  },
});

export { GET };
