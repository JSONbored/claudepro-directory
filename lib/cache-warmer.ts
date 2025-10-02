/**
 * Cache Warming Strategy
 * Pre-loads popular content into Redis cache for better performance
 */

import { z } from 'zod';
import { metadataLoader } from '@/lib/lazy-content-loaders';
import { contentIndexer } from '@/lib/related-content/indexer';
import { relatedContentService } from '@/lib/related-content/service';
import {
  isoDatetimeString,
  nonEmptyString,
  nonNegativeInt,
  positiveInt,
  stringArray,
} from '@/lib/schemas/primitives';
import { logger } from './logger';
import { contentCache, statsRedis } from './redis';
import { isProduction } from './schemas/env.schema';

/**
 * Cache Warmer Schemas (inlined - only used here)
 */
const CACHE_WARMER_LIMITS = {
  MAX_ITEMS_PER_CATEGORY: 100,
  MAX_CATEGORIES: 20,
  MAX_QUERY_LENGTH: 100,
  MAX_PATH_LENGTH: 500,
  MAX_SLUG_LENGTH: 200,
  MIN_TTL: 60,
  MAX_TTL: 604800,
  MAX_BATCH_SIZE: 50,
  MAX_COMMON_QUERIES: 100,
} as const;

export const warmableCategorySchema = z.enum([
  'agents',
  'mcp',
  'rules',
  'commands',
  'hooks',
  'statuslines',
  'guides',
  'jobs',
]);

export const cacheWarmerPopularItemSchema = z.object({
  slug: nonEmptyString
    .max(CACHE_WARMER_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format'),
  views: nonNegativeInt,
});

export const categoryMetadataSchema = z.object({
  name: warmableCategorySchema,
  items: z
    .array(
      z.object({
        slug: nonEmptyString,
        title: nonEmptyString.optional(),
        description: nonEmptyString.optional(),
      })
    )
    .max(CACHE_WARMER_LIMITS.MAX_ITEMS_PER_CATEGORY),
});

export const relatedContentWarmingSchema = z.object({
  path: nonEmptyString
    .max(CACHE_WARMER_LIMITS.MAX_PATH_LENGTH)
    .regex(/^\/[a-zA-Z0-9\-_/]*$/, 'Invalid path format')
    .refine((path) => !path.includes('..'), 'Path traversal detected'),
  category: warmableCategorySchema.default('agents'),
  tags: stringArray.max(50).default([]),
  keywords: stringArray.max(50).default([]),
  limit: positiveInt.min(1).max(20).default(6),
});

export const commonQuerySchema = nonEmptyString.max(CACHE_WARMER_LIMITS.MAX_QUERY_LENGTH);

export const cachedContentSchema = z.object({
  content: z.unknown(),
  cachedAt: isoDatetimeString,
  ttl: positiveInt,
});

export const cacheWarmingStatusSchema = z.enum([
  'idle',
  'warming',
  'completed',
  'failed',
  'partial',
]);

export const cacheWarmingResultSchema = z.object({
  status: cacheWarmingStatusSchema,
  success: z.boolean().optional(),
  message: z.string().optional(),
  itemsWarmed: nonNegativeInt,
  errors: nonNegativeInt,
  duration: nonNegativeInt,
  timestamp: isoDatetimeString,
  categories: z.array(warmableCategorySchema),
});

export type WarmableCategory = z.infer<typeof warmableCategorySchema>;
export type CacheWarmingStatus = z.infer<typeof cacheWarmingStatusSchema>;
export type CacheWarmingResult = z.infer<typeof cacheWarmingResultSchema>;

export class CacheWarmer {
  private isWarming = false;

  /**
   * Warm caches for popular content
   * This runs periodically to ensure frequently accessed content is cached
   */
  async warmPopularContent(): Promise<void> {
    if (this.isWarming) {
      logger.info('Cache warming already in progress, skipping');
      return;
    }

    this.isWarming = true;
    const startTime = performance.now();
    let itemsWarmed = 0;
    let errors = 0;

    try {
      logger.info('Starting cache warming for popular content');

      // Lazy load metadata only when needed
      const [
        agentsMetadata,
        mcpMetadata,
        rulesMetadata,
        commandsMetadata,
        hooksMetadata,
        statuslinesMetadata,
      ] = await Promise.all([
        metadataLoader.get('agentsMetadata'),
        metadataLoader.get('mcpMetadata'),
        metadataLoader.get('rulesMetadata'),
        metadataLoader.get('commandsMetadata'),
        metadataLoader.get('hooksMetadata'),
        metadataLoader.get('statuslinesMetadata'),
      ]);

      // Get popular items from each category
      const categories = [
        { name: 'agents' as WarmableCategory, items: agentsMetadata },
        { name: 'mcp' as WarmableCategory, items: mcpMetadata },
        { name: 'rules' as WarmableCategory, items: rulesMetadata },
        { name: 'commands' as WarmableCategory, items: commandsMetadata },
        { name: 'hooks' as WarmableCategory, items: hooksMetadata },
        { name: 'statuslines' as WarmableCategory, items: statuslinesMetadata },
      ];

      // Validate categories
      const validatedCategories = categories.map((cat) => categoryMetadataSchema.parse(cat));

      for (const category of validatedCategories) {
        try {
          // Validate category name
          const validatedCategoryName = warmableCategorySchema.parse(category.name);

          // Get top 10 popular items from Redis stats
          const popular = await statsRedis?.getPopular(validatedCategoryName, 10);

          if (popular && popular.length > 0) {
            // Validate and warm cache for popular items
            const validatedPopular = z.array(cacheWarmerPopularItemSchema).parse(popular);
            for (const item of validatedPopular) {
              await this.warmItem(validatedCategoryName, item.slug);
              itemsWarmed++;
            }
          } else {
            // If no popularity data, warm first 5 items as fallback
            const topItems = category.items.slice(0, 5);
            for (const item of topItems) {
              await this.warmItem(validatedCategoryName, item.slug);
              itemsWarmed++;
            }
          }
        } catch (error) {
          logger.error(`Failed to warm cache for category ${category.name}`, error as Error);
          errors++;
        }
      }

      // Warm related content for popular pages
      await this.warmRelatedContent();

      // Warm search indexes
      await this.warmSearchIndexes();

      const duration = Math.round(performance.now() - startTime);
      logger.info('Cache warming completed', {
        itemsWarmed,
        errors,
        durationMs: duration,
      });

      // Track cache warming success
      if (typeof window === 'undefined') {
        // Server-side only
        const status = cacheWarmingStatusSchema.parse({
          lastRun: new Date().toISOString(),
          itemsWarmed,
          errors,
          duration,
        });

        await contentCache?.cacheAPIResponse('cache_warming_status', status, 86400); // 24 hour TTL
      }
    } catch (error) {
      logger.error('Cache warming failed', error as Error);
    } finally {
      this.isWarming = false;
    }
  }

  /**
   * Warm cache for a specific item
   */
  private async warmItem(category: WarmableCategory, slug: string): Promise<void> {
    try {
      const cacheKey = `content:${category}:${slug}`;

      // Check if already cached
      const cached = await contentCache?.getAPIResponse(cacheKey);
      if (cached) {
        return; // Already cached, skip
      }

      // Pre-load the content (this would normally happen on first request)
      // Here we're just ensuring it's in cache
      const cachedContent = cachedContentSchema.parse({
        category,
        slug,
        warmed: true,
        timestamp: new Date().toISOString(),
      });

      await contentCache?.cacheAPIResponse(
        cacheKey,
        cachedContent,
        14400 // 4 hour TTL
      );
    } catch (error) {
      // Don't fail the whole process for one item
      logger.warn('Failed to warm cache for item', { category, slug, error: String(error) });
    }
  }

  /**
   * Warm related content caches
   */
  private async warmRelatedContent(): Promise<void> {
    try {
      // Pre-calculate related content for top pages
      const topPages = [
        { path: '/', category: 'agents' as WarmableCategory },
        { path: '/agents', category: 'agents' as WarmableCategory },
        { path: '/mcp', category: 'mcp' as WarmableCategory },
        { path: '/rules', category: 'rules' as WarmableCategory },
        { path: '/commands', category: 'commands' as WarmableCategory },
        { path: '/hooks', category: 'hooks' as WarmableCategory },
        { path: '/statuslines', category: 'statuslines' as WarmableCategory },
      ];

      // Validate pages
      const validatedPages = topPages.map((page) => relatedContentWarmingSchema.parse(page));

      for (const page of validatedPages) {
        try {
          await relatedContentService.getRelatedContent({
            currentPath: page.path,
            currentCategory: page.category,
            currentTags: [],
            currentKeywords: [],
            limit: 6,
            featured: [],
            exclude: [],
          });
        } catch (error) {
          logger.warn('Failed to warm related content', { page: page.path, error: String(error) });
        }
      }
    } catch (error) {
      logger.error('Failed to warm related content caches', error as Error);
    }
  }

  /**
   * Warm search indexes
   */
  private async warmSearchIndexes(): Promise<void> {
    try {
      // Build and cache the content index
      const index = await contentIndexer.buildIndex();
      await contentIndexer.saveIndex(index);

      // Cache common search queries
      const rawQueries = [
        'ai',
        'agent',
        'mcp',
        'server',
        'api',
        'database',
        'auth',
        'react',
        'typescript',
        'python',
        'javascript',
        'test',
        'lint',
      ];

      // Validate queries
      const commonQueries = z.array(commonQuerySchema).parse(rawQueries);

      for (const query of commonQueries) {
        const cacheKey = `search:${query}`;
        await contentCache?.cacheAPIResponse(
          cacheKey,
          {
            query,
            warmed: true,
            timestamp: new Date().toISOString(),
          },
          3600 // 1 hour TTL for search results
        );
      }
    } catch (error) {
      logger.error('Failed to warm search indexes', error as Error);
    }
  }

  /**
   * Schedule periodic cache warming
   * Runs every 6 hours at off-peak times
   */
  scheduleWarming(): void {
    if (typeof window !== 'undefined') {
      // Don't run in browser
      return;
    }

    // Run immediately on startup
    this.warmPopularContent();

    // Schedule periodic warming every 6 hours
    setInterval(
      () => {
        // Only run during off-peak hours (midnight to 6 AM UTC)
        const hour = new Date().getUTCHours();
        if (hour >= 0 && hour < 6) {
          this.warmPopularContent();
        }
      },
      6 * 60 * 60 * 1000
    ); // 6 hours
  }

  /**
   * Manually trigger cache warming
   * Useful for admin endpoints or manual triggers
   */
  async triggerManualWarming(): Promise<CacheWarmingResult> {
    if (this.isWarming) {
      return cacheWarmingResultSchema.parse({
        success: false,
        message: 'Cache warming already in progress',
      });
    }

    const startTime = performance.now();
    try {
      await this.warmPopularContent();
      const duration = Math.round(performance.now() - startTime);

      return cacheWarmingResultSchema.parse({
        success: true,
        message: 'Cache warming completed successfully',
        duration,
      });
    } catch (error) {
      const duration = Math.round(performance.now() - startTime);

      return cacheWarmingResultSchema.parse({
        success: false,
        message: `Cache warming failed: ${error}`,
        duration,
      });
    }
  }

  /**
   * Get cache warming status
   */
  async getStatus(): Promise<CacheWarmingStatus | { message: string } | { error: string }> {
    try {
      const status = await contentCache?.getAPIResponse<unknown>('cache_warming_status');
      if (status) {
        // Validate the cached status
        return cacheWarmingStatusSchema.parse(status);
      }
      return { message: 'No cache warming data available' };
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error(
          'Invalid cache warming status data',
          new Error(error.issues[0]?.message || 'Invalid status'),
          {
            errorCount: error.issues.length,
          }
        );
      }
      return { error: 'Failed to get cache warming status' };
    }
  }
}

// Export singleton instance
export const cacheWarmer = new CacheWarmer();

// Auto-schedule if running on server
if (typeof window === 'undefined' && isProduction) {
  // Schedule cache warming in production
  cacheWarmer.scheduleWarming();
}
