'use server';

import { revalidateTag } from 'next/cache';
import { getCacheInvalidateTags, logger, normalizeError } from '../index.ts';
import type { Database } from '@heyclaude/database-types';
import { fetchCached } from '../cache/fetch-cached.ts';
import { MiscService } from '@heyclaude/data-layer';

export type ActiveNotificationRecord = Database['public']['Functions']['get_active_notifications']['Returns'][number];

const DEFAULT_NOTIFICATION_TAG = 'notifications' as const;
const TTL_KEY = 'cache.notifications.ttl_seconds' as const;
const INVALIDATION_KEY = 'cache.invalidate.notifications' as const;

export async function getNotificationCacheTags(userId: string): Promise<string[]> {
  const dynamicTags = await getCacheInvalidateTags(INVALIDATION_KEY);
  const tags = new Set<string>([DEFAULT_NOTIFICATION_TAG, `user-${userId}`]);
  for (const tag of dynamicTags) {
    tags.add(tag);
  }
  return Array.from(tags);
}

export async function revalidateNotificationCache(userId: string): Promise<void> {
  const tags = await getNotificationCacheTags(userId);
  for (const tag of tags) {
    try {
      revalidateTag(tag, 'default');
    } catch (error) {
      logger.error('Failed to revalidate notification cache tag', normalizeError(error), { tag });
    }
  }
}

interface NotificationFetchParams {
  userId: string;
  dismissedIds?: string[];
}

export async function getActiveNotifications({
  userId,
  dismissedIds = [],
}: NotificationFetchParams): Promise<ActiveNotificationRecord[]> {
  return fetchCached(
    (client) => new MiscService(client).getActiveNotifications({ p_dismissed_ids: dismissedIds }),
    {
      key: `${userId}-${dismissedIds.join('|') || 'none'}`,
      tags: [DEFAULT_NOTIFICATION_TAG, `user-${userId}`],
      ttlKey: TTL_KEY,
      useAuth: true,
      fallback: [],
      logMeta: { userId, dismissedCount: dismissedIds.length },
    }
  );
}
