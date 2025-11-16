import { randomUUID } from 'node:crypto';
import { type NotificationRecord, revalidateNotificationCache } from '@/src/lib/data/notifications';
import { createClient } from '@/src/lib/supabase/server';
import type { Database } from '@/src/types/database.types';

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

interface NotificationDismissParams {
  userId: string;
  notificationIds: string[];
}

export async function dismissNotifications({
  userId,
  notificationIds,
}: NotificationDismissParams): Promise<number> {
  if (notificationIds.length === 0) {
    return 0;
  }

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
  return notificationIds.length;
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
