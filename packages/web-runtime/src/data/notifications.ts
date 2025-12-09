import { MiscService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { cacheLife, cacheTag, revalidateTag } from 'next/cache';

import { logger } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';

export type ActiveNotificationRecord =
  Database['public']['Functions']['get_active_notifications']['Returns'][number];

const DEFAULT_NOTIFICATION_TAG = 'notifications' as const;

export function getNotificationCacheTags(userId: string): string[] {
  // Direct tag array for cache invalidation
  const tags = new Set<string>([
    DEFAULT_NOTIFICATION_TAG,
    `user-${userId}`,
    'notifications',
    'users',
  ]);
  return [...tags];
}

export function revalidateNotificationCache(userId: string): void {
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'revalidateNotificationCache',
    module: 'data/notifications',
  });

  const tags = getNotificationCacheTags(userId);
  for (const tag of tags) {
    try {
      revalidateTag(tag, 'default');
    } catch (error) {
      // logger.error() normalizes errors internally, so pass raw error
      const errorForLogging: Error | string = error instanceof Error ? error : String(error);
      reqLogger.error('Failed to revalidate notification cache tag', errorForLogging, {
        tag,
        userId,
      });
    }
  }
}

interface NotificationFetchParameters {
  dismissedIds?: string[];
  userId: string;
}

/**
 * Get active notifications for a user
 *
 * Uses 'use cache: private' to enable cross-request caching for user-specific data.
 * This allows cookies() to be used inside the cache scope while still providing
 * per-user caching with TTL and cache invalidation support.
 *
 * Cache behavior:
 * - Minimum 30 seconds stale time (required for runtime prefetch)
 * - Per-user cache keys (userId and dismissedIds in cache tag)
 * - Not prerendered (runs at request time)
 * @param root0
 * @param root0.userId
 * @param root0.dismissedIds
 */
export async function getActiveNotifications({
  userId,
  dismissedIds = [],
}: NotificationFetchParameters): Promise<ActiveNotificationRecord[]> {
  'use cache: private';

  // Configure cache
  cacheLife({ stale: 60, revalidate: 300, expire: 1800 }); // 1min stale, 5min revalidate, 30min expire
  const tags = getNotificationCacheTags(userId);
  for (const tag of tags) {
    cacheTag(tag);
  }
  if (dismissedIds.length > 0) {
    cacheTag(`notifications-dismissed-${dismissedIds.sort().join('-')}`);
  }

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    operation: 'getActiveNotifications',
    module: 'data/notifications',
  });

  try {
    // Can use cookies() inside 'use cache: private'
    const client = await createSupabaseServerClient();
    const service = new MiscService(client);

    const result = await service.getActiveNotifications({ p_dismissed_ids: dismissedIds });

    reqLogger.info('getActiveNotifications: fetched successfully', {
      userId,
      dismissedCount: dismissedIds.length,
      notificationCount: result.length,
    });

    return result;
  } catch (error) {
    // logger.error() normalizes errors internally, so pass raw error
    const errorForLogging: Error | string = error instanceof Error ? error : String(error);
    reqLogger.error('getActiveNotifications: unexpected error', errorForLogging, {
      userId,
      dismissedCount: dismissedIds.length,
    });
    // Return fallback on errors
    return [];
  }
}
