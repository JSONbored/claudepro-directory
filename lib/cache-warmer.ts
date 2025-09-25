/**
 * Cache Warming Strategy
 * Pre-loads popular content into Redis cache for better performance
 */

import { agentsMetadata } from '@/generated/agents-metadata';
import { commandsMetadata } from '@/generated/commands-metadata';
import { hooksMetadata } from '@/generated/hooks-metadata';
import { mcpMetadata } from '@/generated/mcp-metadata';
import { rulesMetadata } from '@/generated/rules-metadata';
import { contentIndexer } from '@/lib/related-content/indexer';
import { relatedContentService } from '@/lib/related-content/service';
import { logger } from './logger';
import { contentCache, statsRedis } from './redis';

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

      // Get popular items from each category
      const categories = [
        { name: 'agents', items: agentsMetadata },
        { name: 'mcp', items: mcpMetadata },
        { name: 'rules', items: rulesMetadata },
        { name: 'commands', items: commandsMetadata },
        { name: 'hooks', items: hooksMetadata },
      ];

      for (const category of categories) {
        try {
          // Get top 10 popular items from Redis stats
          const popular = await statsRedis?.getPopular(category.name as any, 10);

          if (popular && popular.length > 0) {
            // Warm cache for popular items
            for (const item of popular) {
              await this.warmItem(category.name, item.slug);
              itemsWarmed++;
            }
          } else {
            // If no popularity data, warm first 5 items as fallback
            const topItems = category.items.slice(0, 5);
            for (const item of topItems) {
              await this.warmItem(category.name, item.slug);
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
        await contentCache?.cacheAPIResponse(
          'cache_warming_status',
          {
            lastRun: new Date().toISOString(),
            itemsWarmed,
            errors,
            duration,
          },
          86400
        ); // 24 hour TTL
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
  private async warmItem(category: string, slug: string): Promise<void> {
    try {
      const cacheKey = `content:${category}:${slug}`;

      // Check if already cached
      const cached = await contentCache?.getAPIResponse(cacheKey);
      if (cached) {
        return; // Already cached, skip
      }

      // Pre-load the content (this would normally happen on first request)
      // Here we're just ensuring it's in cache
      await contentCache?.cacheAPIResponse(
        cacheKey,
        {
          category,
          slug,
          warmed: true,
          timestamp: new Date().toISOString(),
        },
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
        { path: '/', category: undefined },
        { path: '/agents', category: 'agents' },
        { path: '/mcp', category: 'mcp' },
        { path: '/rules', category: 'rules' },
        { path: '/commands', category: 'commands' },
        { path: '/hooks', category: 'hooks' },
      ];

      for (const page of topPages) {
        try {
          await relatedContentService.getRelatedContent({
            currentPath: page.path,
            currentCategory: page.category as any,
            currentTags: [],
            currentKeywords: [],
            limit: 6,
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
      const commonQueries = [
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
  async triggerManualWarming(): Promise<{ success: boolean; message: string }> {
    if (this.isWarming) {
      return {
        success: false,
        message: 'Cache warming already in progress',
      };
    }

    try {
      await this.warmPopularContent();
      return {
        success: true,
        message: 'Cache warming completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Cache warming failed: ${error}`,
      };
    }
  }

  /**
   * Get cache warming status
   */
  async getStatus(): Promise<any> {
    try {
      const status = await contentCache?.getAPIResponse('cache_warming_status');
      return status || { message: 'No cache warming data available' };
    } catch {
      return { error: 'Failed to get cache warming status' };
    }
  }
}

// Export singleton instance
export const cacheWarmer = new CacheWarmer();

// Auto-schedule if running on server
if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
  // Schedule cache warming in production
  cacheWarmer.scheduleWarming();
}
