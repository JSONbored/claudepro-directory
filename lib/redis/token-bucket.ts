/**
 * Token Bucket Rate Limiting Implementation
 * Production-grade token bucket algorithm with Redis persistence and memory fallback
 */

import { z } from 'zod';
import { logger } from '../logger';
import { redisClient } from './client';

// Token bucket configuration schema
const tokenBucketConfigSchema = z.object({
  capacity: z.number().int().min(1).max(10000).default(2000),
  refillRate: z.number().min(0.1).max(1000).default(1000), // tokens per second
  keyPrefix: z.string().min(1).max(50).default('tb'),
  ttlSeconds: z.number().int().min(60).max(86400).default(3600), // 1 hour
  enableLogging: z.boolean().default(false),
});

type TokenBucketConfig = z.infer<typeof tokenBucketConfigSchema>;

// Token bucket state schema
const tokenBucketStateSchema = z.object({
  tokens: z.number().min(0),
  lastRefill: z.number().int().min(0),
  capacity: z.number().int().min(1),
  refillRate: z.number().min(0.1),
});

type TokenBucketState = z.infer<typeof tokenBucketStateSchema>;

/**
 * Token Bucket Rate Limiter
 * Implements distributed rate limiting with token bucket algorithm
 */
export class TokenBucket {
  private config: TokenBucketConfig;
  private identifier: string;
  private redisKey: string;

  // In-memory fallback for when Redis is unavailable
  private static fallbackBuckets = new Map<string, TokenBucketState>();
  private static fallbackCleanupInterval: NodeJS.Timeout | null = null;

  constructor(identifier: string, config?: Partial<TokenBucketConfig>) {
    // Validate and sanitize identifier
    const sanitizedId = z
      .string()
      .min(1)
      .max(100)
      .parse(identifier.replace(/[^a-zA-Z0-9_-]/g, '_'));

    this.identifier = sanitizedId;
    this.config = tokenBucketConfigSchema.parse(config || {});
    this.redisKey = `${this.config.keyPrefix}:${this.identifier}`;

    this.setupFallbackCleanup();
  }

  /**
   * Setup periodic cleanup for fallback buckets
   */
  private setupFallbackCleanup(): void {
    if (TokenBucket.fallbackCleanupInterval) return;

    TokenBucket.fallbackCleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, state] of TokenBucket.fallbackBuckets.entries()) {
        // Clean buckets older than TTL
        if (now - state.lastRefill > this.config.ttlSeconds * 1000) {
          TokenBucket.fallbackBuckets.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0 && this.config.enableLogging) {
        logger.debug(`Cleaned ${cleaned} expired token buckets from fallback storage`);
      }
    }, 300000); // Cleanup every 5 minutes
  }

  /**
   * Get current bucket state from Redis or fallback
   */
  private async getBucketState(): Promise<TokenBucketState> {
    try {
      const state = await redisClient.executeOperation(
        async (redis) => {
          const data = await redis.get(this.redisKey);
          if (!data) return null;

          const parsed = JSON.parse(String(data));
          return tokenBucketStateSchema.parse(parsed);
        },
        () => {
          // Fallback operation
          const fallbackState = TokenBucket.fallbackBuckets.get(this.redisKey);
          return fallbackState || null;
        },
        'getBucketState'
      );

      if (state) return state;
    } catch (error) {
      if (this.config.enableLogging) {
        logger.warn(`Failed to get bucket state for ${this.identifier}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Return default state if nothing found
    return {
      tokens: this.config.capacity,
      lastRefill: Date.now(),
      capacity: this.config.capacity,
      refillRate: this.config.refillRate,
    };
  }

  /**
   * Save bucket state to Redis or fallback
   */
  private async saveBucketState(state: TokenBucketState): Promise<void> {
    try {
      await redisClient.executeOperation(
        async (redis) => {
          const serialized = JSON.stringify(state);
          await redis.set(this.redisKey, serialized, { ex: this.config.ttlSeconds });
        },
        () => {
          // Fallback operation
          TokenBucket.fallbackBuckets.set(this.redisKey, { ...state });
        },
        'saveBucketState'
      );
    } catch (error) {
      if (this.config.enableLogging) {
        logger.warn(`Failed to save bucket state for ${this.identifier}`, {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(state: TokenBucketState): TokenBucketState {
    const now = Date.now();
    const timeDiff = (now - state.lastRefill) / 1000; // Convert to seconds

    if (timeDiff <= 0) return state;

    const tokensToAdd = timeDiff * state.refillRate;
    const newTokens = Math.min(state.capacity, state.tokens + tokensToAdd);

    return {
      ...state,
      tokens: newTokens,
      lastRefill: now,
    };
  }

  /**
   * Try to consume a token from the bucket
   */
  async consumeToken(requestedTokens = 1): Promise<{
    allowed: boolean;
    remainingTokens: number;
    retryAfterMs?: number;
    bucketInfo: {
      capacity: number;
      refillRate: number;
      identifier: string;
    };
  }> {
    // Validate requested tokens
    const validTokens = z.number().int().min(1).max(this.config.capacity).parse(requestedTokens);

    try {
      // Get current state and refill
      let state = await this.getBucketState();
      state = this.refillTokens(state);

      const allowed = state.tokens >= validTokens;

      if (allowed) {
        // Consume tokens
        state.tokens -= validTokens;
        await this.saveBucketState(state);

        if (this.config.enableLogging) {
          logger.debug(
            `Token consumed for ${this.identifier}. Remaining: ${state.tokens.toFixed(2)}`
          );
        }

        return {
          allowed: true,
          remainingTokens: Math.floor(state.tokens),
          bucketInfo: {
            capacity: this.config.capacity,
            refillRate: this.config.refillRate,
            identifier: this.identifier,
          },
        };
      }
      // Calculate retry after time
      const tokensNeeded = validTokens - state.tokens;
      const retryAfterMs = Math.ceil((tokensNeeded / state.refillRate) * 1000);

      if (this.config.enableLogging) {
        logger.debug(`Rate limit exceeded for ${this.identifier}. Retry after: ${retryAfterMs}ms`);
      }

      return {
        allowed: false,
        remainingTokens: Math.floor(state.tokens),
        retryAfterMs: Math.min(retryAfterMs, 60000), // Cap at 1 minute
        bucketInfo: {
          capacity: this.config.capacity,
          refillRate: this.config.refillRate,
          identifier: this.identifier,
        },
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`Token bucket error for ${this.identifier}`, err);

      // On error, allow the request but log it
      return {
        allowed: true,
        remainingTokens: this.config.capacity,
        bucketInfo: {
          capacity: this.config.capacity,
          refillRate: this.config.refillRate,
          identifier: this.identifier,
        },
      };
    }
  }

  /**
   * Check current token count without consuming
   */
  async checkTokens(): Promise<{
    availableTokens: number;
    capacity: number;
    refillRate: number;
    nextRefillMs: number;
  }> {
    try {
      let state = await this.getBucketState();
      state = this.refillTokens(state);

      const nextRefillMs =
        state.tokens >= state.capacity ? 0 : Math.ceil((1 / state.refillRate) * 1000);

      return {
        availableTokens: Math.floor(state.tokens),
        capacity: state.capacity,
        refillRate: state.refillRate,
        nextRefillMs,
      };
    } catch (error) {
      logger.error(
        `Failed to check tokens for ${this.identifier}`,
        error instanceof Error ? error : new Error(String(error))
      );

      return {
        availableTokens: this.config.capacity,
        capacity: this.config.capacity,
        refillRate: this.config.refillRate,
        nextRefillMs: 0,
      };
    }
  }

  /**
   * Reset bucket to full capacity
   */
  async reset(): Promise<void> {
    const state: TokenBucketState = {
      tokens: this.config.capacity,
      lastRefill: Date.now(),
      capacity: this.config.capacity,
      refillRate: this.config.refillRate,
    };

    await this.saveBucketState(state);

    if (this.config.enableLogging) {
      logger.info(`Token bucket reset for ${this.identifier}`);
    }
  }

  /**
   * Get bucket statistics
   */
  async getStats(): Promise<{
    identifier: string;
    capacity: number;
    refillRate: number;
    currentTokens: number;
    utilizationPercent: number;
    lastRefill: Date;
  }> {
    try {
      let state = await this.getBucketState();
      state = this.refillTokens(state);

      return {
        identifier: this.identifier,
        capacity: state.capacity,
        refillRate: state.refillRate,
        currentTokens: Math.floor(state.tokens),
        utilizationPercent: ((state.capacity - state.tokens) / state.capacity) * 100,
        lastRefill: new Date(state.lastRefill),
      };
    } catch (error) {
      logger.error(
        `Failed to get stats for ${this.identifier}`,
        error instanceof Error ? error : new Error(String(error))
      );

      return {
        identifier: this.identifier,
        capacity: this.config.capacity,
        refillRate: this.config.refillRate,
        currentTokens: this.config.capacity,
        utilizationPercent: 0,
        lastRefill: new Date(),
      };
    }
  }

  /**
   * Cleanup all fallback buckets (for testing/shutdown)
   */
  static cleanup(): void {
    if (TokenBucket.fallbackCleanupInterval) {
      clearInterval(TokenBucket.fallbackCleanupInterval);
      TokenBucket.fallbackCleanupInterval = null;
    }
    TokenBucket.fallbackBuckets.clear();
  }
}

/**
 * Create a token bucket with default configuration
 */
export function createTokenBucket(
  identifier: string,
  config?: Partial<TokenBucketConfig>
): TokenBucket {
  return new TokenBucket(identifier, config);
}

/**
 * Pre-configured token buckets for common use cases
 */
export const TokenBuckets = {
  // API rate limiting (1000 req/s, burst 2000)
  api: (identifier: string) =>
    new TokenBucket(identifier, {
      capacity: 2000,
      refillRate: 1000,
      keyPrefix: 'api_limit',
      ttlSeconds: 3600,
    }),

  // Strict rate limiting (100 req/s, burst 200)
  strict: (identifier: string) =>
    new TokenBucket(identifier, {
      capacity: 200,
      refillRate: 100,
      keyPrefix: 'strict_limit',
      ttlSeconds: 1800,
    }),

  // Generous rate limiting (5000 req/s, burst 10000)
  generous: (identifier: string) =>
    new TokenBucket(identifier, {
      capacity: 10000,
      refillRate: 5000,
      keyPrefix: 'generous_limit',
      ttlSeconds: 7200,
    }),
} as const;
