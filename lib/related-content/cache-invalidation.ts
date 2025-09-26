/**
 * Cache Invalidation Service for Related Content
 * Automatically invalidates caches when content is updated
 */

import { logger } from '@/lib/logger';
import { contentCache } from '@/lib/redis';
import type { ContentCategory } from './types';

export class CacheInvalidationService {
  /**
   * Invalidate caches when content is updated
   */
  async invalidateContentCaches(
    category: ContentCategory,
    slug: string,
    options: {
      invalidateRelated?: boolean;
      invalidateCategory?: boolean;
    } = {}
  ): Promise<void> {
    const { invalidateRelated = true, invalidateCategory = true } = options;
    const keysToInvalidate: string[] = [];

    try {
      // Invalidate specific content cache
      const contentKey = `related:${slug.replace(/\//g, '_')}:*`;
      keysToInvalidate.push(contentKey);

      // Invalidate category caches if requested
      if (invalidateCategory) {
        const categoryKey = `related:*:${category}:*`;
        keysToInvalidate.push(categoryKey);
      }

      // Invalidate related content if requested
      if (invalidateRelated) {
        // This would invalidate caches for content that might include this item
        const relatedKeys = await this.findRelatedCacheKeys(category, slug);
        keysToInvalidate.push(...relatedKeys);
      }

      // Perform invalidation
      await this.invalidateKeys(keysToInvalidate);

      logger.info('Cache invalidation completed', {
        category,
        slug,
        keysInvalidated: keysToInvalidate.length,
      });
    } catch (error) {
      logger.error('Cache invalidation failed', error as Error, {
        category,
        slug,
      });
      // Don't throw - cache invalidation shouldn't break the update flow
    }
  }

  /**
   * Invalidate all related content caches
   */
  async invalidateAllRelatedContent(): Promise<void> {
    try {
      const pattern = 'related:*';
      await contentCache.invalidatePattern(pattern);

      logger.info('All related content caches invalidated');
    } catch (error) {
      logger.error('Failed to invalidate all related content caches', error as Error);
    }
  }

  /**
   * Invalidate caches for a specific algorithm version
   */
  async invalidateAlgorithmVersion(algorithmVersion: string): Promise<void> {
    try {
      const pattern = `related:*:*:*:${algorithmVersion}`;
      await contentCache.invalidatePattern(pattern);

      logger.info('Algorithm version caches invalidated', {
        algorithmVersion,
      });
    } catch (error) {
      logger.error('Failed to invalidate algorithm version caches', error as Error, {
        algorithmVersion,
      });
    }
  }

  /**
   * Find cache keys that might contain the updated content
   */
  private async findRelatedCacheKeys(category: ContentCategory, slug: string): Promise<string[]> {
    const keys: string[] = [];

    // Get related categories that might include this content
    const relatedCategories = this.getRelatedCategories(category);

    for (const relatedCategory of relatedCategories) {
      keys.push(`related:*:${relatedCategory}:*`);
    }

    // Also invalidate trending and popular caches
    keys.push(`trending:${category}:*`);
    keys.push(`popular:${category}:*`);

    // Invalidate any caches that specifically reference this slug
    keys.push(`*:${slug.replace(/\//g, '_')}:*`);

    return keys;
  }

  /**
   * Invalidate specific keys
   */
  private async invalidateKeys(patterns: string[]): Promise<void> {
    for (const pattern of patterns) {
      try {
        await contentCache.invalidatePattern(pattern);
      } catch (error) {
        logger.warn('Failed to invalidate pattern', { pattern, error: String(error) });
      }
    }
  }

  /**
   * Get related categories for cross-category invalidation
   */
  private getRelatedCategories(category: ContentCategory): ContentCategory[] {
    const relationships: Record<string, ContentCategory[]> = {
      tutorials: ['workflows', 'use-cases'],
      comparisons: ['tutorials', 'troubleshooting'],
      workflows: ['tutorials', 'use-cases'],
      'use-cases': ['tutorials', 'workflows'],
      troubleshooting: ['tutorials', 'comparisons'],
      agents: ['commands', 'rules'],
      mcp: ['agents', 'hooks'],
      rules: ['agents', 'commands'],
      commands: ['agents', 'rules'],
      hooks: ['mcp', 'commands'],
    };

    return relationships[category] || [];
  }

  /**
   * Schedule periodic cache cleanup
   */
  async scheduleCacheCleanup(): Promise<void> {
    // Run cleanup every 24 hours
    setInterval(
      async () => {
        try {
          await this.cleanupExpiredCaches();
        } catch (error) {
          logger.error('Cache cleanup failed', error as Error);
        }
      },
      24 * 60 * 60 * 1000
    );
  }

  /**
   * Clean up expired caches
   */
  private async cleanupExpiredCaches(): Promise<void> {
    try {
      // This would be implemented based on Redis TTL
      // For now, we rely on Redis's built-in TTL mechanism
      logger.info('Cache cleanup completed');
    } catch (error) {
      logger.error('Failed to cleanup caches', error as Error);
    }
  }
}

// Export singleton instance
export const cacheInvalidation = new CacheInvalidationService();

// Content update hook
export async function onContentUpdate(category: ContentCategory, slug: string): Promise<void> {
  await cacheInvalidation.invalidateContentCaches(category, slug);
}

// Build hook
export async function onBuildComplete(): Promise<void> {
  // Invalidate all caches after a build
  await cacheInvalidation.invalidateAllRelatedContent();
}
