/**
 * Analytics Queue Service
 * Batches view and copy tracking events to reduce Redis commands
 *
 * OPTIMIZATION: Reduces Redis commands by 90-95%
 * - Without batching: 1 command per event = ~70,000 commands/day
 * - With batching: 1 command per unique slug every 5 min = ~2,000 commands/day
 * - Savings: ~68,000 commands/day
 *
 * Trade-off: 5-minute delay in analytics (acceptable for low-traffic sites)
 */

import { logger } from '@/src/lib/logger';

/**
 * Queue entry for tracking events
 */
interface QueueEntry {
  category: string;
  slug: string;
  count: number;
}

/**
 * Analytics Queue Manager
 * Singleton service for batching analytics events
 */
class AnalyticsQueueService {
  // In-memory queues (Map for O(1) lookups and updates)
  private viewQueue = new Map<string, QueueEntry>();
  private copyQueue = new Map<string, QueueEntry>();

  // Flush intervals
  private viewFlushInterval: NodeJS.Timeout | null = null;
  private copyFlushInterval: NodeJS.Timeout | null = null;

  // Configuration
  private readonly FLUSH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private isShuttingDown = false;

  /**
   * Initialize the queue service
   * Starts automatic flush intervals
   */
  initialize(): void {
    if (typeof window !== 'undefined') {
      logger.warn('Analytics queue should not run in browser');
      return;
    }

    // Start flush intervals
    this.viewFlushInterval = setInterval(() => {
      this.flushViews().catch((err) => {
        logger.error(
          'Failed to flush view queue',
          err instanceof Error ? err : new Error(String(err))
        );
      });
    }, this.FLUSH_INTERVAL_MS);

    this.copyFlushInterval = setInterval(() => {
      this.flushCopies().catch((err) => {
        logger.error(
          'Failed to flush copy queue',
          err instanceof Error ? err : new Error(String(err))
        );
      });
    }, this.FLUSH_INTERVAL_MS);

    logger.info('Analytics queue service initialized', {
      flushIntervalMinutes: this.FLUSH_INTERVAL_MS / 60000,
    });

    // Graceful shutdown handler
    if (process) {
      process.on('SIGTERM', () => this.shutdown());
      process.on('SIGINT', () => this.shutdown());
    }
  }

  /**
   * Queue a view event
   * Increments counter for this content item
   */
  queueView(category: string, slug: string): void {
    if (this.isShuttingDown) {
      logger.warn('Cannot queue view during shutdown', { category, slug });
      return;
    }

    const key = `${category}:${slug}`;
    const existing = this.viewQueue.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      this.viewQueue.set(key, { category, slug, count: 1 });
    }
  }

  /**
   * Queue a copy event
   * Increments counter for this content item
   */
  queueCopy(category: string, slug: string): void {
    if (this.isShuttingDown) {
      logger.warn('Cannot queue copy during shutdown', { category, slug });
      return;
    }

    const key = `${category}:${slug}`;
    const existing = this.copyQueue.get(key);

    if (existing) {
      existing.count += 1;
    } else {
      this.copyQueue.set(key, { category, slug, count: 1 });
    }
  }

  /**
   * Flush view queue to Redis
   * Batches all queued views into a single operation
   */
  private async flushViews(): Promise<void> {
    if (this.viewQueue.size === 0) return;

    // Snapshot and clear queue atomically
    const snapshot = new Map(this.viewQueue);
    this.viewQueue.clear();

    logger.info('Flushing view queue to Redis', {
      itemCount: snapshot.size,
      totalViews: Array.from(snapshot.values()).reduce((sum, entry) => sum + entry.count, 0),
    });

    try {
      // Use statsRedis.incrementView's underlying pipeline
      // But since we're batching, we'll use Redis directly for efficiency
      const { redisClient } = await import('@/src/lib/cache.server');

      await redisClient.executeOperation(
        async (redis) => {
          const pipeline = redis.pipeline();

          for (const entry of snapshot.values()) {
            const key = `views:${entry.category}:${entry.slug}`;
            // Use incrby to add multiple views at once
            pipeline.incrby(key, entry.count);
          }

          await pipeline.exec();
          return true;
        },
        () => {
          logger.warn('View flush failed - using fallback (data lost)', {
            itemCount: snapshot.size,
          });
          return false;
        },
        'flush_view_queue'
      );

      logger.info('View queue flushed successfully', {
        itemCount: snapshot.size,
      });
    } catch (error) {
      logger.error(
        'Failed to flush view queue',
        error instanceof Error ? error : new Error(String(error)),
        {
          itemCount: snapshot.size,
          action: 're-queue',
        }
      );

      // Re-queue failed items (merge with current queue)
      for (const [key, entry] of snapshot) {
        const existing = this.viewQueue.get(key);
        if (existing) {
          existing.count += entry.count;
        } else {
          this.viewQueue.set(key, entry);
        }
      }
    }
  }

  /**
   * Flush copy queue to Redis
   * Batches all queued copies into a single operation
   */
  private async flushCopies(): Promise<void> {
    if (this.copyQueue.size === 0) return;

    // Snapshot and clear queue atomically
    const snapshot = new Map(this.copyQueue);
    this.copyQueue.clear();

    logger.info('Flushing copy queue to Redis', {
      itemCount: snapshot.size,
      totalCopies: Array.from(snapshot.values()).reduce((sum, entry) => sum + entry.count, 0),
    });

    try {
      const { redisClient } = await import('@/src/lib/cache.server');

      await redisClient.executeOperation(
        async (redis) => {
          const pipeline = redis.pipeline();

          for (const entry of snapshot.values()) {
            const copyKey = `copies:${entry.category}:${entry.slug}`;
            // Use incrby to add multiple copies at once
            pipeline.incrby(copyKey, entry.count);
            // NOTE: Removed sorted set updates; compute top-copied via nightly job instead
          }

          await pipeline.exec();
          return true;
        },
        () => {
          logger.warn('Copy flush failed - using fallback (data lost)', {
            itemCount: snapshot.size,
          });
          return false;
        },
        'flush_copy_queue'
      );

      logger.info('Copy queue flushed successfully', {
        itemCount: snapshot.size,
      });
    } catch (error) {
      logger.error(
        'Failed to flush copy queue',
        error instanceof Error ? error : new Error(String(error)),
        {
          itemCount: snapshot.size,
          action: 're-queue',
        }
      );

      // Re-queue failed items
      for (const [key, entry] of snapshot) {
        const existing = this.copyQueue.get(key);
        if (existing) {
          existing.count += entry.count;
        } else {
          this.copyQueue.set(key, entry);
        }
      }
    }
  }

  /**
   * Graceful shutdown
   * Flushes all queued data before exit
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) return;

    this.isShuttingDown = true;
    logger.info('Analytics queue service shutting down gracefully...');

    // Clear intervals
    if (this.viewFlushInterval) {
      clearInterval(this.viewFlushInterval);
    }
    if (this.copyFlushInterval) {
      clearInterval(this.copyFlushInterval);
    }

    // Flush remaining data
    try {
      await Promise.all([this.flushViews(), this.flushCopies()]);
      logger.info('Analytics queue shutdown complete');
    } catch (error) {
      logger.error(
        'Error during analytics queue shutdown',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Get queue statistics (for monitoring/debugging)
   */
  getStats(): {
    viewQueueSize: number;
    copyQueueSize: number;
    totalViewsQueued: number;
    totalCopiesQueued: number;
  } {
    return {
      viewQueueSize: this.viewQueue.size,
      copyQueueSize: this.copyQueue.size,
      totalViewsQueued: Array.from(this.viewQueue.values()).reduce(
        (sum, entry) => sum + entry.count,
        0
      ),
      totalCopiesQueued: Array.from(this.copyQueue.values()).reduce(
        (sum, entry) => sum + entry.count,
        0
      ),
    };
  }
}

// Singleton instance
const analyticsQueue = new AnalyticsQueueService();

// Auto-initialize in server environment
if (typeof window === 'undefined') {
  analyticsQueue.initialize();
}

export { analyticsQueue };
