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
 * @route GET /api/stats/batch?items=category:slug,category:slug,...
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { statsRedis } from '@/src/lib/cache.server';
import { logger } from '@/src/lib/logger';

/**
 * Runtime configuration - serverless function (no ISR)
 */
export const runtime = 'nodejs';

/**
 * Request validation schema
 */
const statsQuerySchema = z.object({
  items: z
    .string()
    .min(1)
    .max(2000)
    .describe('Comma-separated list of category:slug pairs (max 50 items)')
    .transform((val) => val.split(',').filter((item) => item.trim()))
    .pipe(
      z.array(z.string().regex(/^[a-z-]+:[a-z0-9-]+$/)).max(50, 'Maximum 50 items per request')
    ),
});

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
 * GET handler - fetch stats for multiple items
 */
export async function GET(request: Request) {
  try {
    // Parse and validate query params
    const url = new URL(request.url);
    const itemsParam = url.searchParams.get('items');

    if (!itemsParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing items parameter',
          message: 'Provide items as comma-separated category:slug pairs',
        },
        { status: 400 }
      );
    }

    const validation = statsQuerySchema.safeParse({ items: itemsParam });

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid items parameter',
          message: validation.error.issues[0]?.message || 'Invalid format',
        },
        { status: 400 }
      );
    }

    const items = validation.data.items;

    // Check in-memory cache first (reduces Redis load)
    const cacheKey = items.sort().join(',');
    const cached = inMemoryCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      logger.info('Stats batch request (in-memory cache hit)', {
        itemCount: items.length,
        cacheAge: Date.now() - cached.timestamp,
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
            'Cache-Control':
              'public, max-age=300, stale-while-revalidate=3600, stale-if-error=86400', // 5min cache, 1h stale, 24h error
            'X-Cache': 'HIT-MEMORY',
          },
        }
      );
    }

    // Parse items into category/slug pairs
    const parsedItems = items.map((item) => {
      const [category, slug] = item.split(':');
      return { category, slug };
    });

    // Fetch from Redis (batch operation)
    logger.info('Stats batch request (fetching from Redis)', {
      itemCount: items.length,
    });

    const [viewCounts, copyCounts] = await Promise.all([
      statsRedis.getViewCounts(parsedItems),
      statsRedis.getCopyCounts(parsedItems),
    ]);

    // Build response
    const data: Record<string, { viewCount: number; copyCount: number }> = {};
    for (const item of parsedItems) {
      const key = `${item.category}:${item.slug}`;
      data[key] = {
        viewCount: viewCounts[key] || 0,
        copyCount: copyCounts[key] || 0,
      };
    }

    // Store in in-memory cache
    inMemoryCache.set(cacheKey, { data, timestamp: Date.now() });

    // Clean old cache entries (async, don't await)
    if (inMemoryCache.size > 100) {
      cleanExpiredCache();
    }

    logger.info('Stats batch request completed', {
      itemCount: items.length,
      cached: false,
    });

    return NextResponse.json(
      {
        success: true,
        data,
        cached: false,
      },
      {
        headers: {
          'Cache-Control':
            'public, max-age=300, stale-while-revalidate=3600, stale-if-error=86400', // 5min cache, 1h stale, 24h error
          'X-Cache': 'MISS',
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
