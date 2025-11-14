import { randomUUID } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { cacheConfigs } from '@/src/lib/flags';
import { logger } from '@/src/lib/logger';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
import { createClient } from '@/src/lib/supabase/server';
import { normalizeError } from '@/src/lib/utils/error.utils';
import type { Database } from '@/src/types/database.types';

export type NotificationRecord = Database['public']['Tables']['notifications']['Row'];

export interface NotificationCreateInput {
  id?: string;
  title: string;
  message: string;
  type: Database['public']['Enums']['notification_type'];
  priority?: Database['public']['Enums']['notification_priority'];
  action_label?: string | null;
  action_href?: string | null;
  action_onclick?: string | null;
  icon?: string | null;
  expires_at?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface NotificationFetchParams {
  userId: string;
  dismissedIds?: string[];
}

interface NotificationDismissParams {
  userId: string;
  notificationIds: string[];
}

const DEFAULT_NOTIFICATION_TAG = 'notifications';
const DEFAULT_TTL_CONFIG_KEY = 'cache.notifications.ttl_seconds';
const DEFAULT_INVALIDATE_KEY = 'cache.invalidate.notifications';

async function getNotificationCacheTags(userId: string): Promise<string[]> {
  const config = await cacheConfigs();
  const dynamicTags = (config[DEFAULT_INVALIDATE_KEY] as string[] | undefined) ?? [];
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

export async function getActiveNotifications({
  userId,
  dismissedIds = [],
}: NotificationFetchParams): Promise<NotificationRecord[]> {
  return (
    (await cachedRPCWithDedupe<NotificationRecord[]>(
      'get_active_notifications',
      {
        p_user_id: userId,
        dismissed_ids: dismissedIds,
      },
      {
        tags: [DEFAULT_NOTIFICATION_TAG, `user-${userId}`],
        ttlConfigKey: DEFAULT_TTL_CONFIG_KEY,
        keySuffix: `${userId}-${dismissedIds.join('|') || 'none'}`,
        useAuthClient: true,
      }
    )) ?? []
  );
}

export async function dismissNotifications({
  userId,
  notificationIds,
}: NotificationDismissParams): Promise<void> {
  if (notificationIds.length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from('notification_dismissals').upsert(
    notificationIds.map((notificationId) => ({
      notification_id: notificationId,
      user_id: userId,
    }))
  );

  if (error) {
    throw new Error(`Failed to dismiss notifications: ${error.message}`);
  }

  await revalidateNotificationCache(userId);
}

export async function createNotification(
  input: NotificationCreateInput
): Promise<NotificationRecord> {
  const supabase = await createClient();
  const payload = {
    id: input.id ?? randomUUID(),
    title: input.title,
    message: input.message,
    type: input.type,
    priority: input.priority ?? 'medium',
    action_label: input.action_label ?? null,
    action_href: input.action_href ?? null,
    action_onclick: input.action_onclick ?? null,
    icon: input.icon ?? null,
    expires_at: input.expires_at ?? null,
    metadata: input.metadata ?? null,
  };

  const { data, error } = await supabase.from('notifications').insert(payload).select('*').single();

  if (error || !data) {
    throw new Error(`Failed to create notification: ${error?.message ?? 'unknown error'}`);
  }

  return data as NotificationRecord;
}
