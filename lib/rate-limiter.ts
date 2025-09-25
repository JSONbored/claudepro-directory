/**
 * Production-grade rate limiting for Claude Pro Directory API endpoints
 * Implements sliding window rate limiting with Redis persistence
 */

import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { sanitizeApiError } from '@/lib/error-sanitizer';
import { logger } from '@/lib/logger';
import redis from '@/lib/redis';

export interface RateLimitConfig {
  /** Maximum requests per window */
  maxRequests: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Custom identifier function */
  keyGenerator?: (request: NextRequest) => Promise<string>;
  /** Skip rate limiting for certain conditions */
  skip?: (request: NextRequest) => boolean;
  /** Custom error response */
  onLimitReached?: (request: NextRequest, limit: RateLimitInfo) => Promise<Response>;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter: number;
}

/**
 * Default rate limit configurations for different endpoint types
 */
export const RATE_LIMIT_CONFIGS = {
  // Public API endpoints - generous but protected
  api: {
    maxRequests: 1000,
    windowSeconds: 3600, // 1 hour
  },
  // Search endpoints - more restrictive due to computational cost
  search: {
    maxRequests: 100,
    windowSeconds: 300, // 5 minutes
  },
  // Submit endpoints - very restrictive to prevent abuse
  submit: {
    maxRequests: 10,
    windowSeconds: 3600, // 1 hour
  },
  // General pages - very generous
  general: {
    maxRequests: 10000,
    windowSeconds: 3600, // 1 hour
  },
  // Heavy API endpoints (large datasets) - moderate restrictions
  heavyApi: {
    maxRequests: 50,
    windowSeconds: 900, // 15 minutes
  },
  // Admin operations - extremely restrictive
  admin: {
    maxRequests: 5,
    windowSeconds: 3600, // 1 hour
  },
  // Bulk operations - very restrictive with longer window
  bulk: {
    maxRequests: 20,
    windowSeconds: 1800, // 30 minutes
  },
} as const;

/**
 * Generate rate limit key for Redis storage
 */
async function generateKey(request: NextRequest, prefix: string = 'rate_limit'): Promise<string> {
  // Priority order for client identification:
  // 1. CF-Connecting-IP (Cloudflare)
  // 2. X-Forwarded-For (proxy)
  // 3. X-Real-IP (nginx)
  // 4. Connection remote address

  const headersList = await headers();
  const clientIP =
    headersList.get('cf-connecting-ip') ||
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown';

  const userAgent = headersList.get('user-agent') || '';
  const pathname = new URL(request.url).pathname;

  // Create a composite key for better uniqueness
  const keyComponents = [
    prefix,
    clientIP,
    pathname,
    // Hash user agent to prevent key explosion while maintaining uniqueness
    userAgent ? Buffer.from(userAgent).toString('base64').slice(0, 16) : 'no-ua',
  ];

  return keyComponents.join(':');
}

/**
 * Sliding window rate limiter using Redis
 */
export class RateLimiter {
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: generateKey,
      skip: () => false,
      onLimitReached: this.defaultErrorResponse.bind(this),
      ...config,
    };
  }

  private async defaultErrorResponse(request: NextRequest, info: RateLimitInfo): Promise<Response> {
    const headersList = await headers();
    const clientIP =
      headersList.get('cf-connecting-ip') || headersList.get('x-forwarded-for') || 'unknown';

    logger.warn('Rate limit exceeded', {
      ip: clientIP,
      path: new URL(request.url).pathname,
      userAgent: headersList.get('user-agent') || '',
      limit: info.limit,
      remaining: info.remaining,
      resetTime: info.resetTime,
    });

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit: ${info.limit} requests per ${this.config.windowSeconds} seconds`,
        retryAfter: info.retryAfter,
        resetTime: info.resetTime,
        timestamp: new Date().toISOString(),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(info.limit),
          'X-RateLimit-Remaining': String(info.remaining),
          'X-RateLimit-Reset': String(info.resetTime),
          'Retry-After': String(info.retryAfter),
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Check and update rate limit for a request
   */
  async checkLimit(request: NextRequest): Promise<RateLimitResult> {
    // Skip if configured to do so
    if (this.config.skip(request)) {
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowSeconds * 1000,
        retryAfter: 0,
      };
    }

    const key = await this.config.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - this.config.windowSeconds * 1000;

    try {
      // If Redis is not available, allow requests but log warning
      if (!redis) {
        logger.warn('Redis not available for rate limiting', {
          path: new URL(request.url).pathname,
          fallback: 'allowing request',
        });

        return {
          success: true,
          limit: this.config.maxRequests,
          remaining: this.config.maxRequests - 1,
          resetTime: now + this.config.windowSeconds * 1000,
          retryAfter: 0,
        };
      }

      // Use Redis pipeline for atomic operations
      const pipeline = redis.pipeline();

      // Remove expired entries and add current request
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, { score: now, member: `${now}-${Math.random()}` });
      pipeline.zcard(key);
      pipeline.expire(key, this.config.windowSeconds);

      const results = await pipeline.exec();

      if (
        !results ||
        results.some((result) => result && (result as [Error | null, string | number])[0])
      ) {
        throw new Error('Redis pipeline failed');
      }

      // Redis pipeline results: [error, result] tuple for each command
      const zcardResult = results[2] as [Error | null, number] | null;
      const requestCount = zcardResult?.[1] ?? 0;
      const remaining = Math.max(0, this.config.maxRequests - requestCount);
      const resetTime = now + this.config.windowSeconds * 1000;

      const success = requestCount <= this.config.maxRequests;

      // If limit exceeded, remove the request we just added
      if (!success) {
        await redis.zremrangebyrank(key, -1, -1);
      }

      return {
        success,
        limit: this.config.maxRequests,
        remaining,
        resetTime,
        retryAfter: success ? 0 : Math.ceil(this.config.windowSeconds / 2),
      };
    } catch (error: unknown) {
      // Sanitize error to prevent information leakage
      const sanitizedError = sanitizeApiError(error, {
        component: 'rate-limiter',
        operation: 'check_limit',
        key: 'redacted',
      });

      const normalizedError = error instanceof Error ? error : new Error(String(error));
      logger.error('Rate limiter error', normalizedError, {
        sanitizedMessage: sanitizedError.message,
        path: new URL(request.url).pathname,
        fallback: 'allowing request',
      });

      // On error, allow the request but log the issue
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowSeconds * 1000,
        retryAfter: 0,
      };
    }
  }

  /**
   * Middleware function for Next.js API routes
   */
  async middleware(request: NextRequest): Promise<Response | null> {
    const result = await this.checkLimit(request);

    if (!result.success) {
      const info: RateLimitInfo = {
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter || Math.ceil(this.config.windowSeconds / 2),
      };

      return this.config.onLimitReached(request, info);
    }

    return null; // Continue to next middleware/handler
  }
}

/**
 * Create rate limiter instances for different endpoint types
 */
export const rateLimiters = {
  api: new RateLimiter(RATE_LIMIT_CONFIGS.api),
  search: new RateLimiter(RATE_LIMIT_CONFIGS.search),
  submit: new RateLimiter(RATE_LIMIT_CONFIGS.submit),
  general: new RateLimiter(RATE_LIMIT_CONFIGS.general),
  heavyApi: new RateLimiter(RATE_LIMIT_CONFIGS.heavyApi),
  admin: new RateLimiter(RATE_LIMIT_CONFIGS.admin),
  bulk: new RateLimiter(RATE_LIMIT_CONFIGS.bulk),
};

/**
 * Utility function to apply rate limiting to API routes
 */
export async function withRateLimit<T extends unknown[]>(
  request: NextRequest,
  limiter: RateLimiter,
  handler: (...args: T) => Promise<Response>,
  ...args: T
): Promise<Response> {
  const limitResult = await limiter.middleware(request);

  if (limitResult) {
    return limitResult; // Rate limit exceeded
  }

  // Add rate limit headers to successful responses
  const response = await handler(...args);
  const result = await limiter.checkLimit(request);

  // Clone response to add headers
  const newResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });

  newResponse.headers.set('X-RateLimit-Limit', String(result.limit));
  newResponse.headers.set('X-RateLimit-Remaining', String(result.remaining));
  newResponse.headers.set('X-RateLimit-Reset', String(result.resetTime));

  return newResponse;
}

/**
 * Rate limit decorator for API route handlers
 */
export function rateLimit(limiter: RateLimiter) {
  return <T extends (...args: [NextRequest, ...Parameters<T>]) => Promise<Response>>(
    descriptor: TypedPropertyDescriptor<T>
  ) => {
    const originalMethod = descriptor.value;

    if (!originalMethod) {
      throw new Error('Rate limit decorator can only be applied to methods');
    }

    descriptor.value = async function (
      this: Record<string, never>,
      request: NextRequest,
      ...args: Parameters<T>
    ) {
      return withRateLimit(request, limiter, originalMethod.bind(this), ...args);
    } as T;

    return descriptor;
  };
}

export default RateLimiter;
