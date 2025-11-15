import { supabaseServiceRole } from '../clients/supabase.ts';
import type { Database } from '../database.types.ts';

type NotificationRecord = Database['public']['Tables']['notifications']['Row'];
type NotificationPriority = Database['public']['Enums']['notification_priority'];
type NotificationType = Database['public']['Enums']['notification_type'];

export interface NotificationInsertPayload {
  id?: string;
  title: string;
  message: string;
  priority?: NotificationPriority;
  type?: NotificationType;
  action_label?: string | null;
  action_href?: string | null;
  action_onclick?: string | null;
  icon?: string | null;
  expires_at?: string | null;
  active?: boolean;
  metadata?: Record<string, unknown> | null;
}

export async function getActiveNotificationsForUser(
  userId: string,
  dismissedIds: string[]
): Promise<NotificationRecord[]> {
  const { data, error } = await supabaseServiceRole.rpc('get_active_notifications', {
    p_user_id: userId,
    dismissed_ids: dismissedIds,
  });

  if (error) {
    throw error;
  }

  return (data as NotificationRecord[]) ?? [];
}

export async function insertNotification(
  payload: NotificationInsertPayload
): Promise<NotificationRecord> {
  const record = {
    id: payload.id ?? crypto.randomUUID(),
    title: payload.title,
    message: payload.message,
    priority: payload.priority ?? 'medium',
    type: payload.type ?? 'announcement',
    action_label: payload.action_label ?? null,
    action_href: payload.action_href ?? null,
    action_onclick: payload.action_onclick ?? null,
    icon: payload.icon ?? null,
    expires_at: payload.expires_at ?? null,
    active: payload.active ?? true,
    metadata: payload.metadata ?? null,
  };

  const { data, error } = await supabaseServiceRole
    .from('notifications')
    .insert(record)
    .select('*')
    .single<NotificationRecord>();

  if (error || !data) {
    if (isConflictError(error) && record.id) {
      const existing = await getNotificationById(record.id);
      if (existing) {
        console.info('[notifications] Reusing existing notification', { id: existing.id });
        return existing;
      }
    }
    console.error('[notifications] Failed to insert notification', error);
    throw error ?? new Error('Unknown notification insert error');
  }

  console.info('[notifications] Inserted notification', { id: data.id, title: data.title });
  return data;
}

export async function dismissNotificationsForUser(userId: string, notificationIds: string[]) {
  if (notificationIds.length === 0) return;

  const { error } = await supabaseServiceRole.from('notification_dismissals').upsert(
    notificationIds.map((notificationId) => ({
      notification_id: notificationId,
      user_id: userId,
    }))
  );

  if (error) {
    throw error;
  }
}

function isConflictError(error: unknown): error is {
  code?: string;
} {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === '23505'
  );
}

async function getNotificationById(id: string): Promise<NotificationRecord | null> {
  const { data, error } = await supabaseServiceRole
    .from('notifications')
    .select('*')
    .eq('id', id)
    .single<NotificationRecord>();

  if (error) {
    console.error('[notifications] Failed to load existing notification', error);
    return null;
  }

  return data ?? null;
}
