import { Redis } from '@upstash/redis';
import { z } from 'zod';
import { logger } from '../logger';
import type { UnifiedContentItem } from '../schemas/components';
import { redisConfig } from '../schemas/env.schema';
import type { ContentByCategory } from './content-processor.service';

const cacheEntrySchema = z.object({
  data: z.any(),
  timestamp: z.number(),
  version: z.string().default('1.0'),
});

type CacheEntry = z.infer<typeof cacheEntrySchema>;

interface CacheOptions {
  ttlSeconds?: number;
  useRedis?: boolean;
  useMemory?: boolean;
  keyPrefix?: string;
}

class ContentCacheService {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 14400; // 4 hours
  private readonly memoryLimit = 1000; // Max entries in memory cache

  constructor() {
    // Initialize Redis with auto-pipelining for optimal Edge Runtime performance
    if (redisConfig.isConfigured) {
      this.redis = new Redis({
        url: redisConfig.url!,
        token: redisConfig.token!,
        enableAutoPipelining: true, // Major performance boost for Edge Runtime
      });
    }
  }

  private buildCacheKey(key: string, prefix = 'content'): string {
    return `${prefix}:${key}`;
  }

  private isValidCacheEntry(entry: CacheEntry, ttlSeconds: number): boolean {
    const age = Date.now() - entry.timestamp;
    return age < ttlSeconds * 1000;
  }

  private async getFromRedis(key: string): Promise<CacheEntry | null> {
    if (!this.redis) return null;

    try {
      const data = await this.redis.get(key);
      if (!data) return null;

      const parsed = cacheEntrySchema.safeParse(JSON.parse(data as string));
      return parsed.success ? parsed.data : null;
    } catch (error) {
      logger.warn('Redis cache read failed', { key, error: String(error) });
      return null;
    }
  }

  private async setToRedis(key: string, entry: CacheEntry, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, ttlSeconds, JSON.stringify(entry));
    } catch (error) {
      logger.warn('Redis cache write failed', { key, error: String(error) });
    }
  }

  private getFromMemory(key: string): CacheEntry | null {
    return this.memoryCache.get(key) || null;
  }

  private setToMemory(key: string, entry: CacheEntry): void {
    if (this.memoryCache.size >= this.memoryLimit) {
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) {
        this.memoryCache.delete(firstKey);
      }
    }
    this.memoryCache.set(key, entry);
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const {
      ttlSeconds = this.defaultTTL,
      useRedis = true,
      useMemory = true,
      keyPrefix = 'content',
    } = options;

    const cacheKey = this.buildCacheKey(key, keyPrefix);

    // Try memory cache first (fastest)
    if (useMemory) {
      const memoryEntry = this.getFromMemory(cacheKey);
      if (memoryEntry && this.isValidCacheEntry(memoryEntry, ttlSeconds)) {
        logger.debug('Cache hit (memory)', { key: cacheKey });
        return memoryEntry.data as T;
      }
    }

    // Try Redis cache (persistent across deployments)
    if (useRedis) {
      const redisEntry = await this.getFromRedis(cacheKey);
      if (redisEntry && this.isValidCacheEntry(redisEntry, ttlSeconds)) {
        logger.debug('Cache hit (Redis)', { key: cacheKey });

        // Backfill memory cache
        if (useMemory) {
          this.setToMemory(cacheKey, redisEntry);
        }

        return redisEntry.data as T;
      }
    }

    logger.debug('Cache miss', { key: cacheKey });
    return null;
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const {
      ttlSeconds = this.defaultTTL,
      useRedis = true,
      useMemory = true,
      keyPrefix = 'content',
    } = options;

    const cacheKey = this.buildCacheKey(key, keyPrefix);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      version: '1.0',
    };

    const validatedEntry = cacheEntrySchema.parse(entry);

    // Store in memory cache
    if (useMemory) {
      this.setToMemory(cacheKey, validatedEntry);
    }

    // Store in Redis cache
    if (useRedis) {
      await this.setToRedis(cacheKey, validatedEntry, ttlSeconds);
    }

    logger.debug('Cache set', { key: cacheKey, useRedis, useMemory });
  }

  async invalidate(key: string, keyPrefix = 'content'): Promise<void> {
    const cacheKey = this.buildCacheKey(key, keyPrefix);

    // Remove from memory
    this.memoryCache.delete(cacheKey);

    // Remove from Redis
    if (this.redis) {
      try {
        await this.redis.del(cacheKey);
      } catch (error) {
        logger.warn('Redis cache invalidation failed', { key: cacheKey, error: String(error) });
      }
    }

    logger.debug('Cache invalidated', { key: cacheKey });
  }

  async invalidatePattern(pattern: string, keyPrefix = 'content'): Promise<void> {
    const fullPattern = this.buildCacheKey(pattern, keyPrefix);

    // Clear matching memory cache entries
    const memoryKeys = Array.from(this.memoryCache.keys());
    const matchingMemoryKeys = memoryKeys.filter(
      (key) => key.includes(pattern) || key.startsWith(fullPattern.replace('*', ''))
    );

    for (const key of matchingMemoryKeys) {
      this.memoryCache.delete(key);
    }

    // Clear matching Redis entries using auto-pipelining
    if (this.redis) {
      try {
        const keys = await this.redis.keys(fullPattern);
        if (keys.length > 0) {
          // Use Promise.all for optimal auto-pipelining performance
          await Promise.all(keys.map((key) => this.redis!.del(key)));
        }
      } catch (error) {
        logger.warn('Redis pattern invalidation failed', {
          pattern: fullPattern,
          error: String(error),
        });
      }
    }

    logger.debug('Cache pattern invalidated', { pattern: fullPattern });
  }

  async getContentByCategory(category: string): Promise<UnifiedContentItem[] | null> {
    return this.get<UnifiedContentItem[]>(`category:${category}`, {
      keyPrefix: 'content',
      ttlSeconds: this.defaultTTL,
    });
  }

  async setContentByCategory(category: string, content: UnifiedContentItem[]): Promise<void> {
    await this.set(`category:${category}`, content, {
      keyPrefix: 'content',
      ttlSeconds: this.defaultTTL,
    });
  }

  async getAllContent(): Promise<ContentByCategory | null> {
    return this.get<ContentByCategory>('all-content', {
      keyPrefix: 'content',
      ttlSeconds: this.defaultTTL,
    });
  }

  async setAllContent(content: ContentByCategory): Promise<void> {
    await this.set('all-content', content, {
      keyPrefix: 'content',
      ttlSeconds: this.defaultTTL,
    });
  }

  async getSEOContent(): Promise<ContentByCategory | null> {
    return this.get<ContentByCategory>('seo-content', {
      keyPrefix: 'content',
      ttlSeconds: this.defaultTTL,
    });
  }

  async setSEOContent(content: ContentByCategory): Promise<void> {
    await this.set('seo-content', content, {
      keyPrefix: 'content',
      ttlSeconds: this.defaultTTL,
    });
  }

  async getMainContent(): Promise<ContentByCategory | null> {
    return this.get<ContentByCategory>('main-content', {
      keyPrefix: 'content',
      ttlSeconds: this.defaultTTL,
    });
  }

  async setMainContent(content: ContentByCategory): Promise<void> {
    await this.set('main-content', content, {
      keyPrefix: 'content',
      ttlSeconds: this.defaultTTL,
    });
  }

  async invalidateContent(category?: string): Promise<void> {
    if (category) {
      await this.invalidate(`category:${category}`, 'content');
    } else {
      await this.invalidatePattern('*', 'content');
    }
  }

  async warmCache(): Promise<void> {
    logger.info('Starting content cache warm-up');
    // This will be called by content processor to pre-populate cache
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
    logger.info('Memory cache cleared');
  }

  getStats(): {
    memorySize: number;
    memoryKeys: string[];
    redisConfigured: boolean;
  } {
    return {
      memorySize: this.memoryCache.size,
      memoryKeys: Array.from(this.memoryCache.keys()),
      redisConfigured: redisConfig.isConfigured,
    };
  }
}

export const contentCache = new ContentCacheService();
