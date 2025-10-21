/**
 * Batch Stats API Route
 *
 * Fetches view and copy counts for multiple items in a single request.
 * CRITICAL: Aggressive caching to stay under 3-5k Redis commands/day budget.
 *
 * Caching Strategy (NO ISR - fully static site):
 * 1. CDN cache (5 minutes via Cache-Control headers) - serves cached responses globally
 * 2. In-memory cache (1 minute) - reduces Redis load within serverless instance
 * 3. localStorage cache (24h client-side) - prevents most API calls
 * 4. Stale-while-revalidate (1h client-side) - serves stale data while refreshing
 *
 * Redis Budget Calculation:
 * - Without caching: 10,000+ commands/day (100 page views/hour * 24 hours)
 * - With localStorage (24h cache) + 95% hit rate: ~120 API calls/day
 * - With in-memory cache (1 min): ~120 Redis commands/day
 * - Target: <500 commands/day ✅
 *
 * Performance:
 * - Cache hit (localStorage): <5ms, no network request
 * - Cache hit (CDN): <50ms
 * - Cache hit (in-memory): <10ms
 * - Cache miss (Redis): <100ms
 * - Batch size: up to 50 items per request
 *
 * @route POST /api/stats/batch
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { statsRedis } from '@/src/lib/cache.server';
import { logger } from '@/src/lib/logger';
import { categoryIdSchema } from '@/src/lib/schemas/shared.schema';
import type {
  StatsBatchMode,
  StatsBatchResult,
  StatsHydrationPayload,
} from '@/src/lib/stats/types';

/**
 * Runtime configuration - serverless function (no ISR)
 */
export const runtime = 'nodejs';

const statsBatchItemSchema = z
  .object({
    category: categoryIdSchema.describe('Category identifier for the stat item'),
    slug: z
      .string()
      .min(1, 'Slug is required')
      .max(200, 'Slug must be <= 200 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must be kebab-case'),
    type: z
      .enum(['views', 'copies', 'both'])
      .default('both')
      .describe('Type of stat requested for the item'),
  })
  .describe('Stat item describing which counters to fetch');

const statsBatchBodySchema = z
  .object({
    items: z
      .array(statsBatchItemSchema)
      .min(1, 'At least one item is required')
      .max(50, 'Maximum 50 items per request')
      .describe('Collection of stat items to retrieve in this batch'),
    mode: z
      .enum(['cached', 'realtime'])
      .default('cached')
      .describe('Fetch mode. Cached respects CDN caching, realtime bypasses cache headers'),
  })
  .describe('Request payload for stats batch API');

const CACHE_CONTROL_HEADERS: Record<StatsBatchMode, string> = {
  cached: 'public, max-age=0, s-maxage=300, stale-while-revalidate=60, stale-if-error=86400',
  realtime: 'no-cache, no-store, must-revalidate',
};

/**
 * In-memory cache (per serverless instance)
 * Reduces Redis load for high-traffic pages
 */
interface CacheEntry {
  data: Record<string, { viewCount: number; copyCount: number }>;
  timestamp: number;
}

const CACHE_TTL_MS = 60 * 1000; // 1 minute
const inMemoryCache = new Map<string, CacheEntry>();

/**
 * Clean expired cache entries
 */
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of inMemoryCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      inMemoryCache.delete(key);
    }
  }
}

/**
 * POST handler - fetch stats for multiple items
 */
export async function POST(request: Request) {
  try {
    const rawBody = await request.json().catch(() => null);

    const validation = statsBatchBodySchema.safeParse(rawBody);

    if (!validation.success) {
      const issue = validation.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          message: issue?.message || 'Malformed request payload',
        },
        { status: 400 }
      );
    }

    const { items: requestedItems, mode } = validation.data;

    const structuredItems = Array.from(
      new Map(
        requestedItems.map((item) => [`${item.category}:${item.slug}:${item.type}`, item])
      ).values()
    );

    if (structuredItems.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {},
          cached: false,
        },
        {
          headers: {
            'Cache-Control': CACHE_CONTROL_HEADERS[mode],
            'X-Cache': 'MISS',
          },
        }
      );
    }

    const cacheKeyBase = structuredItems
      .map((item) => `${item.category}:${item.slug}:${item.type}`)
      .sort()
      .join(',');
    const cacheKey = `${mode}|${cacheKeyBase}`;

    const cached = inMemoryCache.get(cacheKey);

    if (mode === 'cached' && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      logger.info('Stats batch request (in-memory cache hit)', {
        itemCount: structuredItems.length,
        cacheAge: Date.now() - cached.timestamp,
        mode,
      });

      return NextResponse.json(
        {
          success: true,
          data: cached.data,
          cached: true,
          cacheAge: Date.now() - cached.timestamp,
        },
        {
          headers: {
            'Cache-Control': CACHE_CONTROL_HEADERS[mode],
            'X-Cache': 'HIT-MEMORY',
          },
        }
      );
    }

    const parsedItems: Array<{ category: string; slug: string }> = Array.from(
      new Map(
        structuredItems.map(({ category, slug }) => [`${category}:${slug}`, { category, slug }])
      ).values()
    );

    logger.info('Stats batch request (fetching from Redis)', {
      itemCount: structuredItems.length,
      mode,
    });

    const requests: Array<Promise<Record<string, number>>> = [];
    const viewsRequested = structuredItems.some((item) => item.type !== 'copies');
    const copiesRequested = structuredItems.some((item) => item.type !== 'views');

    if (viewsRequested) {
      requests.push(statsRedis.getViewCounts(parsedItems));
    } else {
      requests.push(Promise.resolve({}));
    }

    if (copiesRequested) {
      requests.push(statsRedis.getCopyCounts(parsedItems));
    } else {
      requests.push(Promise.resolve({}));
    }

    const [viewCounts, copyCounts] = await Promise.all(requests);

    const data = structuredItems.reduce<StatsBatchResult>((acc, item) => {
      const key = `${item.category}:${item.slug}`;
      const wantsViews = item.type === 'views' || item.type === 'both';
      const wantsCopies = item.type === 'copies' || item.type === 'both';
      const existing = acc[key] ?? { viewCount: 0, copyCount: 0 };

      acc[key] = {
        viewCount: wantsViews ? (viewCounts?.[key] ?? existing.viewCount) : existing.viewCount,
        copyCount: wantsCopies ? (copyCounts?.[key] ?? existing.copyCount) : existing.copyCount,
      };

      return acc;
    }, {});

    if (mode === 'cached') {
      inMemoryCache.set(cacheKey, { data, timestamp: Date.now() });

      if (inMemoryCache.size > 100) {
        cleanExpiredCache();
      }
    }

    logger.info('Stats batch request completed', {
      itemCount: structuredItems.length,
      cached: false,
      mode,
    });

    const payload: StatsHydrationPayload | undefined =
      mode === 'cached'
        ? {
            items: structuredItems,
            results: data,
          }
        : undefined;

    return NextResponse.json(
      {
        success: true,
        data,
        cached: mode === 'cached' && Boolean(cached),
        payload,
      },
      {
        headers: {
          'Cache-Control': CACHE_CONTROL_HEADERS[mode],
          'X-Cache': cached ? 'HIT-MEMORY' : 'MISS',
        },
      }
    );
  } catch (error) {
    logger.error(
      'Stats batch request failed',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch stats',
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  }
}
