/**
 * Rate Limiting Service
 * High-level rate limiting interface using token bucket algorithm
 */

import { z } from 'zod';
import { logger } from '../logger';
import { createTokenBucket, type TokenBucket } from './token-bucket';

// Rate limit configuration schema
const rateLimitConfigSchema = z.object({
  windowMs: z.number().int().min(1000).max(86400000).default(3600000), // 1 hour default
  maxRequests: z.number().int().min(1).max(100000).default(1000),
  burstLimit: z.number().int().min(1).max(200000).default(2000),
  identifier: z.string().min(1).max(100),
  skipSuccessfulRequests: z.boolean().default(false),
  skipFailedRequests: z.boolean().default(false),
  enableLogging: z.boolean().default(false),
});

type RateLimitConfig = z.infer<typeof rateLimitConfigSchema>;

// Rate limit result schema
const rateLimitResultSchema = z.object({
  success: z.boolean(),
  limit: z.number().int().min(0),
  remaining: z.number().int().min(0),
  resetTime: z.date(),
  retryAfter: z.number().int().min(0).optional(),
});

export type RateLimitResult = z.infer<typeof rateLimitResultSchema>;

/**
 * Rate Limiter Service
 * Provides rate limiting functionality with multiple algorithms
 */
export class RateLimiter {
  private tokenBucket: TokenBucket;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = rateLimitConfigSchema.parse(config);

    // Calculate refill rate from window and max requests
    const refillRate = this.config.maxRequests / (this.config.windowMs / 1000);

    this.tokenBucket = createTokenBucket(this.config.identifier, {
      capacity: this.config.burstLimit,
      refillRate,
      keyPrefix: 'rate_limit',
      ttlSeconds: Math.ceil(this.config.windowMs / 1000),
      enableLogging: this.config.enableLogging,
    });
  }

  /**
   * Check if request should be rate limited
   */
  async checkRateLimit(requestCount = 1): Promise<RateLimitResult> {
    try {
      const result = await this.tokenBucket.consumeToken(requestCount);

      const resetTime = new Date(Date.now() + this.config.windowMs);

      if (result.allowed) {
        if (this.config.enableLogging) {
          logger.debug(`Rate limit check passed for ${this.config.identifier}`);
        }

        return rateLimitResultSchema.parse({
          success: true,
          limit: this.config.burstLimit,
          remaining: result.remainingTokens,
          resetTime,
        });
      }
      if (this.config.enableLogging) {
        logger.warn(`Rate limit exceeded for ${this.config.identifier}`);
      }

      return rateLimitResultSchema.parse({
        success: false,
        limit: this.config.burstLimit,
        remaining: result.remainingTokens,
        resetTime,
        retryAfter: Math.ceil((result.retryAfterMs || 0) / 1000),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Rate limit check failed for ${this.config.identifier}`, err);

      // On error, allow the request but log it
      return rateLimitResultSchema.parse({
        success: true,
        limit: this.config.burstLimit,
        remaining: this.config.burstLimit,
        resetTime: new Date(Date.now() + this.config.windowMs),
      });
    }
  }

  /**
   * Get current rate limit status without consuming tokens
   */
  async getStatus(): Promise<{
    limit: number;
    remaining: number;
    resetTime: Date;
    utilizationPercent: number;
  }> {
    try {
      const stats = await this.tokenBucket.getStats();

      return {
        limit: this.config.burstLimit,
        remaining: stats.currentTokens,
        resetTime: new Date(Date.now() + this.config.windowMs),
        utilizationPercent: stats.utilizationPercent,
      };
    } catch (error) {
      logger.error(
        `Failed to get rate limit status for ${this.config.identifier}`,
        error instanceof Error ? error : new Error(String(error))
      );

      return {
        limit: this.config.burstLimit,
        remaining: this.config.burstLimit,
        resetTime: new Date(Date.now() + this.config.windowMs),
        utilizationPercent: 0,
      };
    }
  }

  /**
   * Reset rate limit for this identifier
   */
  async reset(): Promise<void> {
    await this.tokenBucket.reset();

    if (this.config.enableLogging) {
      logger.info(`Rate limit reset for ${this.config.identifier}`);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<RateLimitConfig>): RateLimiter {
    const updatedConfig = rateLimitConfigSchema.parse({
      ...this.config,
      ...newConfig,
    });

    return new RateLimiter(updatedConfig);
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const RateLimiters = {
  /**
   * API rate limiter - 1000 requests per hour with 2000 burst
   */
  api: (identifier: string) =>
    new RateLimiter({
      identifier,
      windowMs: 3600000, // 1 hour
      maxRequests: 1000,
      burstLimit: 2000,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      enableLogging: true,
    }),

  /**
   * Strict rate limiter - 100 requests per hour with 200 burst
   */
  strict: (identifier: string) =>
    new RateLimiter({
      identifier,
      windowMs: 3600000, // 1 hour
      maxRequests: 100,
      burstLimit: 200,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      enableLogging: true,
    }),

  /**
   * Authentication rate limiter - 10 requests per 15 minutes
   */
  auth: (identifier: string) =>
    new RateLimiter({
      identifier,
      windowMs: 900000, // 15 minutes
      maxRequests: 10,
      burstLimit: 15,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      enableLogging: true,
    }),

  /**
   * Search rate limiter - 50 requests per minute with 100 burst
   */
  search: (identifier: string) =>
    new RateLimiter({
      identifier,
      windowMs: 60000, // 1 minute
      maxRequests: 50,
      burstLimit: 100,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      enableLogging: false,
    }),

  /**
   * Upload rate limiter - 5 requests per minute with 10 burst
   */
  upload: (identifier: string) =>
    new RateLimiter({
      identifier,
      windowMs: 60000, // 1 minute
      maxRequests: 5,
      burstLimit: 10,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      enableLogging: true,
    }),
} as const;

/**
 * Create a custom rate limiter
 */
export function createRateLimiter(config: RateLimitConfig): RateLimiter {
  return new RateLimiter(config);
}

/**
 * Utility function to extract client identifier from request
 */
export function getClientIdentifier(ip?: string, userAgent?: string, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }

  if (ip) {
    // Hash IP for privacy while maintaining uniqueness
    const hash = require('crypto').createHash('sha256');
    hash.update(ip + (userAgent || ''));
    return `ip:${hash.digest('hex').substring(0, 16)}`;
  }

  return 'anonymous';
}

/**
 * Rate limit tracking for analytics
 */
const rateLimitEvents: Array<{
  identifier: string;
  timestamp: Date;
  success: boolean;
  remaining: number;
}> = [];

export const RateLimitTracker = {
  record(identifier: string, result: RateLimitResult): void {
    rateLimitEvents.push({
      identifier,
      timestamp: new Date(),
      success: result.success,
      remaining: result.remaining,
    });

    // Keep only last 1000 events
    if (rateLimitEvents.length > 1000) {
      rateLimitEvents.splice(0, rateLimitEvents.length - 1000);
    }
  },

  getStats(): {
    totalRequests: number;
    blockedRequests: number;
    blockRate: number;
    topBlockedIdentifiers: Array<{ identifier: string; blocks: number }>;
  } {
    const total = rateLimitEvents.length;
    const blocked = rateLimitEvents.filter((e) => !e.success).length;

    // Count blocks by identifier
    const blocksByIdentifier = new Map<string, number>();
    rateLimitEvents
      .filter((e) => !e.success)
      .forEach((e) => {
        blocksByIdentifier.set(e.identifier, (blocksByIdentifier.get(e.identifier) || 0) + 1);
      });

    const topBlocked = Array.from(blocksByIdentifier.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([identifier, blocks]) => ({ identifier, blocks }));

    return {
      totalRequests: total,
      blockedRequests: blocked,
      blockRate: total > 0 ? (blocked / total) * 100 : 0,
      topBlockedIdentifiers: topBlocked,
    };
  },

  clear(): void {
    rateLimitEvents.length = 0;
  },
} as const;
