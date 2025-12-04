import { MiscService } from '@heyclaude/data-layer';
import { type Database } from '@heyclaude/database-types';
import { revalidateTag } from 'next/cache';
import { cache } from 'react';

import { getCacheInvalidateTags } from '../cache-config.ts';
import { logger, normalizeError } from '../index.ts';
import { createSupabaseServerClient } from '../supabase/server.ts';
import { generateRequestId } from '../utils/request-id.ts';

export type ActiveNotificationRecord =
  Database['public']['Functions']['get_active_notifications']['Returns'][number];

const DEFAULT_NOTIFICATION_TAG = 'notifications' as const;
// Removed TTL_KEY - no longer used since we use React.cache() instead of fetchCached
const INVALIDATION_KEY = 'cache.invalidate.notifications' as const;

export function getNotificationCacheTags(userId: string): string[] {
  const dynamicTags = getCacheInvalidateTags(INVALIDATION_KEY);
  const tags = new Set<string>([DEFAULT_NOTIFICATION_TAG, `user-${userId}`]);
  for (const tag of dynamicTags) {
    tags.add(tag);
  }
  return [...tags];
}

export function revalidateNotificationCache(userId: string): void {
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'revalidateNotificationCache',
    module: 'data/notifications',
  });

  const tags = getNotificationCacheTags(userId);
  for (const tag of tags) {
    try {
      revalidateTag(tag, 'default');
    } catch (error) {
      // Log error with normalized error object
      reqLogger.error('Failed to revalidate notification cache tag', normalizeError(error), {
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
 * CRITICAL: This function uses React.cache() for request-level deduplication only.
 * It does NOT use Next.js unstable_cache() because:
 * 1. Notifications are user-specific and require cookies() for auth
 * 2. cookies() cannot be called inside unstable_cache() (Next.js restriction)
 * 3. User-specific data should not be cached across requests anyway
 *
 * React.cache() provides request-level deduplication within the same React Server Component tree,
 * which is safe and appropriate for user-specific data.
 */
export const getActiveNotifications = cache(
  async ({
    userId,
    dismissedIds = [],
  }: NotificationFetchParameters): Promise<ActiveNotificationRecord[]> => {
    // Create request-scoped child logger to avoid race conditions
    const requestId = generateRequestId();
    const reqLogger = logger.child({
      requestId,
      operation: 'getActiveNotifications',
      module: 'data/notifications',
    });

    try {
      // Create authenticated client OUTSIDE of any cache scope
      // This is safe because React.cache() only deduplicates within the same request
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
      const normalized = normalizeError(error, 'getActiveNotifications failed');
      reqLogger.error('getActiveNotifications: unexpected error', normalized, {
        userId,
        dismissedCount: dismissedIds.length,
      });
      // Return fallback on errors
      return [];
    }
  }
);
