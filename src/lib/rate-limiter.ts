/**
 * Production-grade rate limiting for Claude Pro Directory API endpoints
 * Implements sliding window rate limiting with Redis persistence
 */

import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/src/lib/logger';
import { redisClient } from '@/src/lib/redis';
import { createRequestId } from '@/src/lib/schemas/branded-types.schema';
import {
  ipAddressSchema,
  type MiddlewareRateLimitConfig,
  middlewareRateLimitConfigSchema,
  requestPathSchema,
} from '@/src/lib/schemas/middleware.schema';
import { sanitizeApiError } from '@/src/lib/security/error-sanitizer';

// Use MiddlewareRateLimitConfig from middleware schema
// Additional interface for extended functionality
export interface ExtendedRateLimitConfig extends Omit<MiddlewareRateLimitConfig, 'windowMs'> {
  /** Window duration in seconds (converted from windowMs) */
  windowSeconds: number;
  /** Custom identifier function */
  keyGenerator?: (request: NextRequest) => Promise<string>;
  /** Skip rate limiting for certain conditions */
  skip?: (request: NextRequest) => boolean;
  /** Custom error response */
  onLimitReached?: (request: NextRequest, limit: RateLimitInfo) => Promise<Response>;
}

/**
 * Rate limit information schema
 */
const rateLimitInfoSchema = z.object({
  limit: z.number().int().min(1).max(100000),
  remaining: z.number().int().min(0),
  resetTime: z.number().int().min(0),
  retryAfter: z.number().int().min(0),
});

/**
 * Rate limit result schema
 */
const rateLimitResultSchema = z.object({
  success: z.boolean(),
  limit: z.number().int().min(1).max(100000),
  remaining: z.number().int().min(0),
  resetTime: z.number().int().min(0),
  retryAfter: z.number().int().min(0),
});

/**
 * Rate limit key components schema
 */
const rateLimitKeySchema = z.object({
  prefix: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z_]+$/, 'Invalid prefix format'),
  clientIP: ipAddressSchema.or(z.literal('unknown')),
  pathname: requestPathSchema,
  userAgentHash: z
    .string()
    .max(32)
    .regex(/^[A-Za-z0-9+/=]+$/, 'Invalid base64 format')
    .or(z.literal('no-ua')),
});

export type RateLimitInfo = z.infer<typeof rateLimitInfoSchema>;
export type RateLimitResult = z.infer<typeof rateLimitResultSchema>;
export type RateLimitKey = z.infer<typeof rateLimitKeySchema>;

/**
 * Default rate limit configurations for different endpoint types
 * All configurations are validated using Zod schemas
 */
const RATE_LIMIT_CONFIGS = {
  // Public API endpoints - generous but protected
  api: middlewareRateLimitConfigSchema.parse({
    maxRequests: 1000,
    windowMs: 3600000, // 1 hour in ms
  }),
  // Search endpoints - more restrictive due to computational cost
  search: middlewareRateLimitConfigSchema.parse({
    maxRequests: 100,
    windowMs: 300000, // 5 minutes in ms
  }),
  // Submit endpoints - balanced to prevent abuse while allowing legitimate use
  submit: middlewareRateLimitConfigSchema.parse({
    maxRequests: 30, // Increased from 10 to allow form corrections
    windowMs: 3600000, // 1 hour in ms
  }),
  // General pages - very generous
  general: middlewareRateLimitConfigSchema.parse({
    maxRequests: 10000,
    windowMs: 3600000, // 1 hour in ms
  }),
  // LLMs.txt endpoints - moderate limit to prevent scraping abuse
  llmstxt: middlewareRateLimitConfigSchema.parse({
    maxRequests: 100,
    windowMs: 3600000, // 1 hour in ms (100 requests per hour per IP)
  }),
  // Webhook endpoints - deliverability events (bounces, complaints)
  webhookBounce: middlewareRateLimitConfigSchema.parse({
    maxRequests: 100,
    windowMs: 60000, // 1 minute in ms (100 bounce events per minute)
  }),
  // Webhook endpoints - analytics events (opens, clicks)
  webhookAnalytics: middlewareRateLimitConfigSchema.parse({
    maxRequests: 500,
    windowMs: 60000, // 1 minute in ms (500 analytics events per minute)
  }),
  // Heavy API endpoints (large datasets) - reasonable for data access
  heavyApi: middlewareRateLimitConfigSchema.parse({
    maxRequests: 100, // Increased from 50 for legitimate data operations
    windowMs: 900000, // 15 minutes in ms
  }),
  // Admin operations - reasonable for maintenance tasks
  admin: middlewareRateLimitConfigSchema.parse({
    maxRequests: 50, // Increased from 5 - needed for cache warming and maintenance
    windowMs: 3600000, // 1 hour in ms
  }),
  // Bulk operations - balanced for legitimate bulk access
  bulk: middlewareRateLimitConfigSchema.parse({
    maxRequests: 50, // Increased from 20 for legitimate bulk operations
    windowMs: 1800000, // 30 minutes in ms
  }),
} as const;

/**
 * Convert rate limit config from ms to seconds for internal use
 */
function configToExtended(config: MiddlewareRateLimitConfig): ExtendedRateLimitConfig {
  return {
    ...config,
    windowSeconds: Math.floor(config.windowMs / 1000),
  };
}

/**
 * Generate rate limit key for Redis storage with validation
 */
async function generateKey(request: NextRequest, prefix: string = 'rate_limit'): Promise<string> {
  // Priority order for client identification:
  // 1. CF-Connecting-IP (Cloudflare)
  // 2. X-Forwarded-For (proxy)
  // 3. X-Real-IP (nginx)
  // 4. Connection remote address

  const headersList = await headers();
  const rawClientIP =
    headersList.get('cf-connecting-ip') ||
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headersList.get('x-real-ip') ||
    'unknown';

  const rawUserAgent = headersList.get('user-agent') || '';
  const rawPathname = new URL(request.url).pathname;

  // Validate all components
  const keyComponents: RateLimitKey = rateLimitKeySchema.parse({
    prefix,
    clientIP: rawClientIP,
    pathname: rawPathname,
    userAgentHash: rawUserAgent
      ? Buffer.from(rawUserAgent).toString('base64').slice(0, 16)
      : 'no-ua',
  });

  return `${keyComponents.prefix}:${keyComponents.clientIP}:${keyComponents.pathname}:${keyComponents.userAgentHash}`;
}

/**
 * Sliding window rate limiter using Redis
 */
export class RateLimiter {
  private config: Required<ExtendedRateLimitConfig>;

  constructor(config: MiddlewareRateLimitConfig) {
    // Validate the input configuration
    const validatedConfig = middlewareRateLimitConfigSchema.parse(config);
    const extendedConfig = configToExtended(validatedConfig);

    this.config = {
      keyGenerator: generateKey,
      skip: () => false,
      onLimitReached: this.defaultErrorResponse.bind(this),
      skipFailedRequests: false,
      skipSuccessfulRequests: false,
      ...extendedConfig,
    } as Required<ExtendedRateLimitConfig>;
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
      const result = {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        resetTime: Date.now() + this.config.windowSeconds * 1000,
        retryAfter: 0,
      };
      return rateLimitResultSchema.parse(result);
    }

    const key = await this.config.keyGenerator(request);
    const now = Date.now();
    const windowStart = now - this.config.windowSeconds * 1000;

    try {
      // If Redis is not available, allow requests but log warning
      if (!(redisClient.getStatus().isConnected || redisClient.getStatus().isFallback)) {
        logger.warn('Redis not available for rate limiting', {
          path: new URL(request.url).pathname,
          fallback: 'allowing request',
        });

        const fallbackResult = {
          success: true,
          limit: this.config.maxRequests,
          remaining: this.config.maxRequests - 1,
          resetTime: now + this.config.windowSeconds * 1000,
          retryAfter: 0,
        };
        return rateLimitResultSchema.parse(fallbackResult);
      }

      // Execute Redis operations using the client manager
      const requestCount = await redisClient.executeOperation(
        async (redis) => {
          // Use Redis pipeline for atomic operations
          const pipeline = redis.pipeline();

          // Remove expired entries and add current request
          pipeline.zremrangebyscore(key, 0, windowStart);
          pipeline.zadd(key, {
            score: now,
            member: `${now}-${crypto.randomUUID()}`,
          });
          pipeline.zcard(key);
          pipeline.expire(key, this.config.windowSeconds);

          const results = await pipeline.exec();

          if (!results || results.length < 3) {
            throw new Error('Redis pipeline failed');
          }

          // Get the count from zcard result (third command)
          const count = results[2] as number;
          return count || 0;
        },
        () => 0, // Fallback: allow request on failure
        'rate_limit_check'
      );
      const remaining = Math.max(0, this.config.maxRequests - requestCount);
      const resetTime = now + this.config.windowSeconds * 1000;

      const success = requestCount <= this.config.maxRequests;

      // If limit exceeded, remove the request we just added
      if (!success) {
        await redisClient.executeOperation(
          async (redis) => {
            await redis.zremrangebyrank(key, -1, -1);
          },
          () => {
            // Fallback: no-op
          },
          'rate_limit_cleanup'
        );
      }

      const result = {
        success,
        limit: this.config.maxRequests,
        remaining,
        resetTime,
        retryAfter: success ? 0 : Math.ceil(this.config.windowSeconds / 2),
      };
      return rateLimitResultSchema.parse(result);
    } catch (error: unknown) {
      // Sanitize error to prevent information leakage
      const sanitizedError = sanitizeApiError(error, createRequestId(), {
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
      const errorResult = {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowSeconds * 1000,
        retryAfter: 0,
      };
      return rateLimitResultSchema.parse(errorResult);
    }
  }

  /**
   * Middleware function for Next.js API routes
   */
  async middleware(request: NextRequest): Promise<Response | null> {
    const result = await this.checkLimit(request);

    if (!result.success) {
      const info: RateLimitInfo = rateLimitInfoSchema.parse({
        limit: result.limit,
        remaining: result.remaining,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter || Math.ceil(this.config.windowSeconds / 2),
      });

      return this.config.onLimitReached(request, info);
    }

    return null; // Continue to next middleware/handler
  }
}

/**
 * Create rate limiter instances for different endpoint types
 * All configurations are pre-validated through Zod schemas
 */
export const rateLimiters = {
  api: new RateLimiter(RATE_LIMIT_CONFIGS.api),
  search: new RateLimiter(RATE_LIMIT_CONFIGS.search),
  submit: new RateLimiter(RATE_LIMIT_CONFIGS.submit),
  general: new RateLimiter(RATE_LIMIT_CONFIGS.general),
  heavyApi: new RateLimiter(RATE_LIMIT_CONFIGS.heavyApi),
  admin: new RateLimiter(RATE_LIMIT_CONFIGS.admin),
  bulk: new RateLimiter(RATE_LIMIT_CONFIGS.bulk),
  llmstxt: new RateLimiter(RATE_LIMIT_CONFIGS.llmstxt),
  webhookBounce: new RateLimiter(RATE_LIMIT_CONFIGS.webhookBounce),
  webhookAnalytics: new RateLimiter(RATE_LIMIT_CONFIGS.webhookAnalytics),
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
