'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { redisClient, statsRedis } from '@/lib/redis';
import { type AnalyticsResponse, validateTrackingParams } from '@/lib/schemas/analytics.schema';

/**
 * Simple rate limiter for server actions
 * Limits requests per IP address using Redis
 */
async function checkServerActionRateLimit(
  action: string,
  maxRequests: number = 100,
  windowSeconds: number = 60
): Promise<boolean> {
  try {
    const headersList = await headers();
    const clientIP =
      headersList.get('cf-connecting-ip') ||
      headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      headersList.get('x-real-ip') ||
      'unknown';

    if (clientIP === 'unknown') {
      // Allow requests without identifiable IP but log warning
      logger.warn('Rate limit check with unknown IP', { action });
      return true;
    }

    const key = `server_action_rate_limit:${action}:${clientIP}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    const requestCount = await redisClient.executeOperation(
      async (redis) => {
        // Use Redis pipeline for atomic operations
        const pipeline = redis.pipeline();
        pipeline.zremrangebyscore(key, 0, windowStart);
        pipeline.zadd(key, { score: now, member: `${now}-${crypto.randomUUID()}` });
        pipeline.zcard(key);
        pipeline.expire(key, windowSeconds);

        const results = await pipeline.exec();
        if (!results || results.length < 3) {
          throw new Error('Redis pipeline failed');
        }

        return (results[2] as number) || 0;
      },
      () => 0, // Fallback: allow request on failure
      'server_action_rate_limit'
    );

    const allowed = requestCount <= maxRequests;

    if (!allowed) {
      logger.warn('Server action rate limit exceeded', {
        action,
        clientIP,
        requestCount,
        limit: maxRequests,
      });
    }

    return allowed;
  } catch (error) {
    logger.error(
      'Rate limit check failed',
      error instanceof Error ? error : new Error(String(error)),
      { action }
    );
    // On error, allow the request
    return true;
  }
}

/**
 * Track a view event for content
 * Validates parameters to prevent data corruption
 * Rate limited to 100 requests per minute per IP
 */
export async function trackView(category: unknown, slug: unknown): Promise<AnalyticsResponse> {
  // LEGITIMATE: Server actions accept unknown for validation
  try {
    // Check rate limit (100 requests per 60 seconds)
    const allowed = await checkServerActionRateLimit('trackView', 100, 60);
    if (!allowed) {
      return {
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
      };
    }

    // Validate input parameters
    const validated = validateTrackingParams(category, slug);

    if (!statsRedis.isEnabled()) {
      logger.debug('Stats tracking not enabled', {
        category: validated.category,
        slug: validated.slug,
      });
      return { success: false, message: 'Stats tracking not enabled' };
    }

    const viewCount = await statsRedis.incrementView(validated.category, validated.slug);

    logger.info('View tracked successfully', {
      category: validated.category,
      slug: validated.slug,
      viewCount: viewCount ?? 0,
    });

    return { success: true, viewCount: viewCount ?? 0 };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid tracking parameters', {
        errorCount: error.issues.length,
        firstError: error.issues[0]?.message || 'Unknown validation error',
        category: String(category),
        slug: String(slug),
      });
      return {
        success: false,
        message: 'Invalid tracking parameters',
      };
    }

    logger.error(
      'Server action failed to track view',
      error instanceof Error ? error : new Error(String(error)),
      {
        category: String(category),
        slug: String(slug),
        action: 'trackView',
      }
    );
    return { success: false, message: 'Failed to track view' };
  }
}

/**
 * Track a copy event for content (e.g., code snippets)
 * Validates parameters to prevent data corruption
 * Rate limited to 100 requests per minute per IP
 */
export async function trackCopy(category: unknown, slug: unknown): Promise<AnalyticsResponse> {
  // LEGITIMATE: Server actions accept unknown for validation
  try {
    // Check rate limit (100 requests per 60 seconds)
    const allowed = await checkServerActionRateLimit('trackCopy', 100, 60);
    if (!allowed) {
      return {
        success: false,
        message: 'Rate limit exceeded. Please try again later.',
      };
    }

    // Validate input parameters
    const validated = validateTrackingParams(category, slug);

    if (!statsRedis.isEnabled()) {
      logger.debug('Stats tracking not enabled', {
        category: validated.category,
        slug: validated.slug,
      });
      return { success: false, message: 'Stats tracking not enabled' };
    }

    await statsRedis.trackCopy(validated.category, validated.slug);

    logger.info('Copy tracked successfully', {
      category: validated.category,
      slug: validated.slug,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid tracking parameters for copy', {
        errorCount: error.issues.length,
        firstError: error.issues[0]?.message || 'Unknown validation error',
        category: String(category),
        slug: String(slug),
      });
      return {
        success: false,
        message: 'Invalid tracking parameters',
      };
    }

    logger.error(
      'Server action failed to track copy',
      error instanceof Error ? error : new Error(String(error)),
      {
        category: String(category),
        slug: String(slug),
        action: 'trackCopy',
      }
    );
    return { success: false, message: 'Failed to track copy' };
  }
}
