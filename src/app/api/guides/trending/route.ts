import { z } from 'zod';
import { statsRedis } from '@/src/lib/cache';
import { CACHE_HEADERS } from '@/src/lib/constants';
import { createApiRoute } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
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

      const fetchLimit = (params.limit || 10) + 1;

      const allTrendingSlugs = await statsRedis.getTrending(category, 100);
      const paginatedSlugs = allTrendingSlugs.slice(startIndex, startIndex + fetchLimit);
      const hasMore = paginatedSlugs.length > (params.limit || 10);
      const trendingSlugs = hasMore ? paginatedSlugs.slice(0, params.limit || 10) : paginatedSlugs;

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
        params.limit || 10,
        hasMore,
        (item) => createCursor(startIndex + trendingGuides.indexOf(item) + 1)
      );

      const response = {
        guides: trendingGuides,
        category,
        pagination,
        timestamp: new Date().toISOString(),
      };

      return okRaw(response, {
        sMaxAge: 3600,
        staleWhileRevalidate: 86400,
        additionalHeaders: {
          'Cache-Control': CACHE_HEADERS.MEDIUM,
          'X-Total-Count': String(allTrendingSlugs.length),
          'X-Has-More': String(pagination.hasMore),
        },
      });
    },
  },
});

export { GET };
