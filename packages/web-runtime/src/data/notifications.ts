'use server';

import { MiscService } from '@heyclaude/data-layer';
import type { Database } from '@heyclaude/database-types';
import { revalidateTag } from 'next/cache';

import { fetchCached } from '../cache/fetch-cached.ts';
import { getCacheInvalidateTags } from '../cache-config.ts';
import { logger, normalizeError } from '../index.ts';
import { generateRequestId } from '../utils/request-context.ts';

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
  const tags = getNotificationCacheTags(userId);
  for (const tag of tags) {
    try {
      revalidateTag(tag, 'default');
    } catch (error) {
      logger.error('Failed to revalidate notification cache tag', normalizeError(error), {
        requestId: generateRequestId(),
        operation: 'revalidateNotificationCache',
        tag,
      });
    }
  }
}

interface NotificationFetchParameters {
  userId: string;
  dismissedIds?: string[];
}

export async function getActiveNotifications({
  userId,
  dismissedIds = [],
}: NotificationFetchParameters): Promise<ActiveNotificationRecord[]> {
  return fetchCached(
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
}
