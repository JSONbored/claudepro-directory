import { MiscService } from '@heyclaude/data-layer';
import  { type Database } from '@heyclaude/database-types';
import { revalidateTag } from 'next/cache';

import { fetchCached } from '../cache/fetch-cached.ts';
import { getCacheInvalidateTags } from '../cache-config.ts';
import { logger, normalizeError } from '../index.ts';
import { generateRequestId } from '../utils/request-id.ts';

export type ActiveNotificationRecord = Database['public']['Functions']['get_active_notifications']['Returns'][number];

const DEFAULT_NOTIFICATION_TAG = 'notifications' as const;
const TTL_KEY = 'cache.notifications.ttl_seconds' as const;
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

export async function getActiveNotifications({
  userId,
  dismissedIds = [],
}: NotificationFetchParameters): Promise<ActiveNotificationRecord[]> {
  // Create request-scoped child logger to avoid race conditions
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'getActiveNotifications',
    module: 'data/notifications',
  });

  try {
    return await fetchCached(
      (client) => new MiscService(client).getActiveNotifications({ p_dismissed_ids: dismissedIds }),
      {
        keyParts: ['notifications', userId, dismissedIds.join('|') || 'none'],
        tags: [DEFAULT_NOTIFICATION_TAG, `user-${userId}`],
        ttlKey: TTL_KEY,
        useAuth: true,
        fallback: [],
        logMeta: { userId, dismissedCount: dismissedIds.length },
      }
    );
  } catch (error) {
    // Log error if fetchCached fails unexpectedly (e.g., cache system error)
    // Note: fetchCached handles service call errors internally and returns fallback
    const normalized = normalizeError(error, 'getActiveNotifications failed');
    reqLogger.error('getActiveNotifications: unexpected error', normalized, {
      userId,
      dismissedCount: dismissedIds.length,
    });
    // Return fallback on unexpected errors
    return [];
  }
}
