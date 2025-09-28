/**
 * Production-Grade View Count Service
 * Centralized, secure, and deterministic view count management
 * Integrates with existing Redis infrastructure and provides fallbacks
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { statsRedis } from '@/lib/redis';

// Zod schemas for type safety
const viewCountRequestSchema = z.object({
  category: z.string().min(1).max(50),
  slug: z.string().min(1).max(100),
});

const batchViewCountRequestSchema = z.object({
  items: z.array(viewCountRequestSchema).min(1).max(100),
});

const viewCountResponseSchema = z.object({
  views: z.number().min(0),
  source: z.enum(['redis', 'deterministic', 'fallback']),
  cached: z.boolean(),
});

type ViewCountRequest = z.infer<typeof viewCountRequestSchema>;
type BatchViewCountRequest = z.infer<typeof batchViewCountRequestSchema>;
type ViewCountResponse = z.infer<typeof viewCountResponseSchema>;

/**
 * ViewCountService - Production-ready view count management
 */
class ViewCountService {
  private cache = new Map<string, { views: number; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly VIEW_COUNT_SALT = process.env.VIEW_COUNT_SALT || 'claudepro-view-salt-2024';

  /**
   * Get view count with proper fallback strategy
   */
  async getViewCount(category: string, slug: string): Promise<ViewCountResponse> {
    try {
      // Validate inputs
      const request = viewCountRequestSchema.parse({ category, slug });
      const cacheKey = `${request.category}:${request.slug}`;

      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return viewCountResponseSchema.parse({
          views: cached.views,
          source: 'redis',
          cached: true,
        });
      }

      // Try Redis first (real analytics)
      if (statsRedis.isEnabled()) {
        try {
          const redisViews = await statsRedis.getViewCount(request.category, request.slug);

          // Cache the result
          const viewCount = typeof redisViews === 'number' ? redisViews : 0;
          this.setCache(cacheKey, viewCount);

          return viewCountResponseSchema.parse({
            views: viewCount,
            source: 'redis',
            cached: false,
          });
        } catch (error) {
          logger.warn('Redis view count failed, using deterministic fallback', {
            category: request.category,
            slug: request.slug,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Fallback to deterministic view count
      const deterministicViews = this.getDeterministicViewCount(request.slug);
      this.setCache(cacheKey, deterministicViews);

      return viewCountResponseSchema.parse({
        views: deterministicViews,
        source: 'deterministic',
        cached: false,
      });
    } catch (error) {
      logger.error(
        'View count service error',
        error instanceof Error ? error : new Error(String(error)),
        {
          category,
          slug,
        }
      );

      // Ultimate fallback
      return viewCountResponseSchema.parse({
        views: 0,
        source: 'fallback',
        cached: false,
      });
    }
  }

  /**
   * Get multiple view counts efficiently
   */
  async getBatchViewCounts(
    items: Array<{ category: string; slug: string }>
  ): Promise<Record<string, ViewCountResponse>> {
    try {
      // Validate inputs
      const request = batchViewCountRequestSchema.parse({ items });
      const result: Record<string, ViewCountResponse> = {};

      // Check cache for all items first
      const uncachedItems: Array<{ category: string; slug: string; key: string }> = [];

      for (const item of request.items) {
        const cacheKey = `${item.category}:${item.slug}`;
        const cached = this.getFromCache(cacheKey);

        if (cached) {
          result[cacheKey] = viewCountResponseSchema.parse({
            views: cached.views,
            source: 'redis',
            cached: true,
          });
        } else {
          uncachedItems.push({ ...item, key: cacheKey });
        }
      }

      // Fetch uncached items from Redis
      if (uncachedItems.length > 0 && statsRedis.isEnabled()) {
        try {
          const redisResults = await statsRedis.getViewCounts(
            uncachedItems.map((item) => ({ category: item.category, slug: item.slug }))
          );

          for (const item of uncachedItems) {
            const redisKey = `${item.category}:${item.slug}`;
            const redisViews = redisResults[redisKey] || 0;

            // Cache the result
            this.setCache(item.key, redisViews);

            result[item.key] = viewCountResponseSchema.parse({
              views: redisViews,
              source: 'redis',
              cached: false,
            });
          }
        } catch (error) {
          logger.warn('Batch Redis view count failed, using deterministic fallbacks', {
            itemCount: uncachedItems.length,
            error: error instanceof Error ? error.message : String(error),
          });

          // Fallback to deterministic for failed items
          for (const item of uncachedItems) {
            if (!result[item.key]) {
              const deterministicViews = this.getDeterministicViewCount(item.slug);
              this.setCache(item.key, deterministicViews);

              result[item.key] = viewCountResponseSchema.parse({
                views: deterministicViews,
                source: 'deterministic',
                cached: false,
              });
            }
          }
        }
      } else {
        // Use deterministic for all uncached items
        for (const item of uncachedItems) {
          const deterministicViews = this.getDeterministicViewCount(item.slug);
          this.setCache(item.key, deterministicViews);

          result[item.key] = viewCountResponseSchema.parse({
            views: deterministicViews,
            source: 'deterministic',
            cached: false,
          });
        }
      }

      return result;
    } catch (error) {
      logger.error(
        'Batch view count service error',
        error instanceof Error ? error : new Error(String(error)),
        {
          itemCount: items.length,
        }
      );

      // Return fallback for all items
      const result: Record<string, ViewCountResponse> = {};
      for (const item of items) {
        const key = `${item.category}:${item.slug}`;
        result[key] = viewCountResponseSchema.parse({
          views: 0,
          source: 'fallback',
          cached: false,
        });
      }
      return result;
    }
  }

  /**
   * Cryptographically secure deterministic view count generation
   */
  private getDeterministicViewCount(slug: string): number {
    try {
      // Use Node.js crypto for secure, deterministic hashing
      const crypto = require('crypto');
      const hash = crypto.createHmac('sha256', this.VIEW_COUNT_SALT).update(slug).digest('hex');

      // Convert hex to integer and normalize to view count range
      const hashInt = Number.parseInt(hash.substring(0, 8), 16);
      return (hashInt % 900) + 100; // 100-999 range
    } catch (error) {
      logger.warn('Crypto deterministic view count failed, using simple hash', {
        slug,
        error: error instanceof Error ? error.message : String(error),
      });

      // Fallback to simple hash if crypto fails
      let hash = 0;
      for (let i = 0; i < slug.length; i++) {
        const char = slug.charCodeAt(i);
        hash = ((hash << 5) - hash + char) & 0x7fffffff;
      }
      return (hash % 900) + 100;
    }
  }

  /**
   * Cache management
   */
  private getFromCache(key: string): { views: number; timestamp: number } | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }

    if (cached) {
      this.cache.delete(key); // Remove expired cache
    }

    return null;
  }

  private setCache(key: string, views: number): void {
    // Prevent cache from growing too large
    if (this.cache.size > 1000) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      views,
      timestamp: Date.now(),
    });
  }

  /**
   * Health check for monitoring
   */
  async healthCheck(): Promise<{
    redis: boolean;
    cache: { size: number; maxSize: number };
    lastError?: string;
  }> {
    const redisHealthy = statsRedis.isEnabled();

    return {
      redis: redisHealthy,
      cache: {
        size: this.cache.size,
        maxSize: 1000,
      },
    };
  }
}

// Export singleton instance
export const viewCountService = new ViewCountService();

// Export types for external use
export type { ViewCountRequest, ViewCountResponse, BatchViewCountRequest };

// Export schemas for validation
export { viewCountRequestSchema, viewCountResponseSchema, batchViewCountRequestSchema };
