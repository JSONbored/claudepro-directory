import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CACHE_HEADERS, REVALIDATE_TIMES } from '@/lib/constants';
import { handleApiError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { statsRedis } from '@/lib/redis';
import { errorInputSchema } from '@/lib/schemas/error.schema';
import { viewCountService } from '@/lib/view-count.service';

export const runtime = 'nodejs';
export const revalidate = REVALIDATE_TIMES.trending;

// Query parameters schema
const querySchema = z.object({
  category: z.enum(['guides', 'tutorials', 'use-cases', 'workflows', 'comparisons']).optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(request: NextRequest) {
  const requestLogger = logger.forRequest(request);

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = querySchema.parse({
      category: searchParams.get('category') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : 10,
    });

    requestLogger.info('Trending guides API request', {
      category: params.category || 'all',
      limit: params.limit,
    });

    const category = params.category || 'guides';

    // Get trending items from Redis
    const trendingSlugs = await statsRedis.getTrending(category, params.limit);

    // Get view counts for all trending guides using centralized service
    const viewCountRequests = trendingSlugs.map((slug) => ({ category, slug }));
    const viewCounts = await viewCountService.getBatchViewCounts(viewCountRequests);

    // Build trending guides response
    const trendingGuides = trendingSlugs.map((slug, index) => {
      const viewCountKey = `${category}:${slug}`;
      const viewCountResult = viewCounts[viewCountKey];

      return {
        slug,
        title: slug
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        url: `/guides/${category}/${slug}`,
        views: viewCountResult?.views || 0,
        rank: index + 1,
      };
    });

    const response = {
      guides: trendingGuides,
      category,
      count: trendingGuides.length,
      timestamp: new Date().toISOString(),
    };

    requestLogger.info('Trending guides API response', {
      count: response.count,
      category,
    });

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': CACHE_HEADERS.MEDIUM,
      },
    });
  } catch (error) {
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success ? validatedError.data : { message: 'Trending guides error occurred' }
    );
  }
}
