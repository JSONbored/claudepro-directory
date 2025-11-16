import { randomUUID } from 'node:crypto';
import { supabaseServiceRole } from '../clients/supabase.ts';
import type { Database } from '../database.types.ts';
import { invalidateCacheByKey } from '../utils/cache.ts';
import type { BaseLogContext } from '../utils/logging.ts';

const MAX_NOTIFICATION_IDS = 50;

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
  dismissedIds: string[],
  logContext?: BaseLogContext
): Promise<NotificationRecord[]> {
  const sanitizedDismissedIds = Array.from(
    new Set(dismissedIds.map((id) => id.trim()).filter(Boolean))
  ).slice(0, MAX_NOTIFICATION_IDS);

  const { data, error } = await supabaseServiceRole.rpc('get_active_notifications', {
    p_user_id: userId,
    dismissed_ids: sanitizedDismissedIds,
  });

  if (error) {
    console.error('[notifications] get_active_notifications failed', {
      ...(logContext || {}),
      user_id: userId,
      dismissedCount: sanitizedDismissedIds.length,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  return (data as NotificationRecord[]) ?? [];
}

export async function insertNotification(
  payload: NotificationInsertPayload,
  logContext?: BaseLogContext
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
        console.info('[notifications] Reusing existing notification', {
          ...(logContext || {}),
          notification_id: existing.id,
        });
        return existing;
      }
    }
    console.error('[notifications] Failed to insert notification', {
      ...(logContext || {}),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error ?? new Error('Unknown notification insert error');
  }

  // Invalidate cache after successful insert
  await invalidateCacheByKey('cache.invalidate.notifications', ['notifications'], {
    logContext,
  }).catch((cacheError) => {
    console.warn('[notifications] Cache invalidation failed', {
      ...(logContext || {}),
      error: cacheError instanceof Error ? cacheError.message : String(cacheError),
    });
  });

  console.info('[notifications] Inserted notification', {
    ...(logContext || {}),
    notification_id: data.id,
    title: data.title,
  });
  return data;
}

export async function dismissNotificationsForUser(
  userId: string,
  notificationIds: string[],
  logContext?: BaseLogContext
) {
  const sanitizedIds = Array.from(
    new Set(notificationIds.map((id) => id.trim()).filter(Boolean))
  ).slice(0, MAX_NOTIFICATION_IDS);

  if (sanitizedIds.length === 0) {
    console.warn('[notifications] dismissNotificationsForUser called without IDs', {
      ...(logContext || {}),
      user_id: userId,
    });
    return;
  }

  const { error } = await supabaseServiceRole.from('notification_dismissals').upsert(
    sanitizedIds.map((notificationId) => ({
      notification_id: notificationId,
      user_id: userId,
    }))
  );

  if (error) {
    console.error('[notifications] Failed to dismiss notifications', {
      ...(logContext || {}),
      user_id: userId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }

  // Invalidate cache after successful dismiss
  await invalidateCacheByKey('cache.invalidate.notifications', ['notifications'], {
    logContext,
  }).catch((cacheError) => {
    console.warn('[notifications] Cache invalidation failed', {
      ...(logContext || {}),
      error: cacheError instanceof Error ? cacheError.message : String(cacheError),
    });
  });

  console.info('[notifications] Dismissed notifications', {
    ...(logContext || {}),
    user_id: userId,
    dismissCount: sanitizedIds.length,
  });
}

export function createNotificationTrace(fields?: Record<string, unknown>) {
  return {
    traceId: randomUUID(),
    ...(fields ?? {}),
  };
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
    console.error('[notifications] Failed to load existing notification', {
      notification_id: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }

  return data ?? null;
}
