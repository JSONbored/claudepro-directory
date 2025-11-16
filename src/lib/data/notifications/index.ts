'use server';

import { revalidateTag } from 'next/cache';
import { getCacheInvalidateTags } from '@/src/lib/data/config/cache-config';
import { fetchCachedRpc } from '@/src/lib/data/helpers';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

export type NotificationRecord = Database['public']['Tables']['notifications']['Row'];

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
}: NotificationFetchParams): Promise<NotificationRecord[]> {
  // Note: get_active_notifications RPC only accepts p_dismissed_ids (notifications are global, not user-specific)
  // userId is used for cache key generation only
  return fetchCachedRpc<'get_active_notifications', NotificationRecord[]>(
    {
      p_dismissed_ids: dismissedIds,
    },
    {
      rpcName: 'get_active_notifications',
      tags: [DEFAULT_NOTIFICATION_TAG, `user-${userId}`],
      ttlKey: TTL_KEY,
      keySuffix: `${userId}-${dismissedIds.join('|') || 'none'}`,
      useAuthClient: true,
      fallback: [],
      logMeta: { userId, dismissedCount: dismissedIds.length },
    }
  );
}
