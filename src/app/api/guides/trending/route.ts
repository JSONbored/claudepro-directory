import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { statsRedis } from '@/src/lib/cache';
import { CACHE_HEADERS } from '@/src/lib/constants';
import { handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { errorInputSchema } from '@/src/lib/schemas/error.schema';
import {
  createCursor,
  createPaginationMeta,
  cursorPaginationQuerySchema,
  decodeCursor,
} from '@/src/lib/schemas/primitives/cursor-pagination.schema';
import { viewCountService } from '@/src/lib/services/view-count.service';

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

export async function GET(request: NextRequest) {
  const requestLogger = logger.forRequest(request);

  try {
    // Parse query parameters with cursor pagination
    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      category: searchParams.get('category') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
    });

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
        // Invalid cursor - start from beginning
        requestLogger.warn('Invalid cursor provided, starting from beginning', undefined, {
          cursor: params.cursor,
        });
      }
    }

    // Fetch one extra item to determine if there are more pages
    const fetchLimit = params.limit + 1;

    // Get trending items from Redis (fetch all and slice for pagination)
    const allTrendingSlugs = await statsRedis.getTrending(category, 100); // Get more items for pagination

    // Slice based on cursor position
    const paginatedSlugs = allTrendingSlugs.slice(startIndex, startIndex + fetchLimit);

    // Determine if there are more pages
    const hasMore = paginatedSlugs.length > params.limit;

    // Remove extra item if present
    const trendingSlugs = hasMore ? paginatedSlugs.slice(0, params.limit) : paginatedSlugs;

    // Get view counts for all trending guides using centralized service
    const viewCountRequests = trendingSlugs.map((slug) => ({ category, slug }));
    const viewCounts = await viewCountService.getBatchViewCounts(viewCountRequests);

    // Build trending guides response with cursor information
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

    // Create pagination metadata
    const pagination = createPaginationMeta(
      trendingGuides,
      params.limit,
      hasMore,
      (item) => createCursor(startIndex + trendingGuides.indexOf(item) + 1) // Next cursor points to next position
    );

    const response = {
      guides: trendingGuides,
      category,
      pagination,
      timestamp: new Date().toISOString(),
    };

    requestLogger.info('Trending guides API response', {
      count: trendingGuides.length,
      category,
      hasMore: pagination.hasMore,
      nextCursor: pagination.nextCursor || 'none',
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': CACHE_HEADERS.MEDIUM,
        'X-Total-Count': String(allTrendingSlugs.length),
        'X-Has-More': String(pagination.hasMore),
      },
    });
  } catch (error) {
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success ? validatedError.data : { message: 'Trending guides error occurred' },
      {
        route: '/api/guides/trending',
        method: 'GET',
        operation: 'trending_guides_pagination',
        logLevel: 'error',
      }
    );
  }
}
