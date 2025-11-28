import { supabaseServiceRole } from '../clients/supabase.ts';
import type { Database as DatabaseGenerated } from '@heyclaude/database-types';
import { invalidateCacheByKey } from '../utils/cache.ts';
import { errorToString } from '@heyclaude/shared-runtime';
import { logger } from '../utils/logger.ts';

const MAX_NOTIFICATION_IDS = 50;

type NotificationRecord = DatabaseGenerated['public']['Tables']['notifications']['Row'];

export interface NotificationInsertPayload {
  id?: string;
  title: string;
  message: string;
  priority?: DatabaseGenerated['public']['Enums']['notification_priority'];
  type?: DatabaseGenerated['public']['Enums']['notification_type'];
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
  logContext?: Record<string, unknown>
): Promise<NotificationRecord[]> {
  const sanitizedDismissedIds = Array.from(
    new Set(dismissedIds.map((id) => id.trim()).filter(Boolean))
  ).slice(0, MAX_NOTIFICATION_IDS);

  const rpcArgs = {
    p_dismissed_ids: sanitizedDismissedIds,
  } satisfies DatabaseGenerated['public']['Functions']['get_active_notifications']['Args'];
  const { data, error } = await supabaseServiceRole.rpc('get_active_notifications', rpcArgs);

  if (error) {
    const errorObj = error instanceof Error ? error : new Error(errorToString(error));
    // Use dbQuery serializer for consistent database query formatting
    logger.error('get_active_notifications failed', {
      ...(logContext || {}),
      user_id: userId,
      dismissedCount: sanitizedDismissedIds.length,
      dbQuery: {
        rpcName: 'get_active_notifications',
        args: rpcArgs, // Will be redacted by Pino's redact config
      },
      err: errorObj,
    });
    throw error;
  }

  return (data as NotificationRecord[]) ?? [];
}

export async function insertNotification(
  payload: NotificationInsertPayload,
  logContext?: Record<string, unknown>
): Promise<NotificationRecord> {
  const record = {
    id: payload.id ?? crypto.randomUUID(),
    title: payload.title,
    message: payload.message,
    priority: payload.priority ?? 'medium',
    type:
      payload.type ??
      ('announcement' satisfies DatabaseGenerated['public']['Enums']['notification_type']),
    action_label: payload.action_label ?? null,
    action_href: payload.action_href ?? null,
    action_onclick: payload.action_onclick ?? null,
    icon: payload.icon ?? null,
    expires_at: payload.expires_at ?? null,
    active: payload.active ?? true,
    // Note: metadata column doesn't exist in notifications table schema
    // Keeping metadata in interface for backward compatibility but not inserting it
  };

  const insertData =
    record satisfies DatabaseGenerated['public']['Tables']['notifications']['Insert'];
  const { data, error } = await supabaseServiceRole
    .from('notifications')
    .insert(insertData)
    .select('*')
    .single<NotificationRecord>();

  if (error || !data) {
    if (isConflictError(error) && record.id) {
      const existing = await getNotificationById(record.id);
      if (existing) {
        logger.info('Reusing existing notification', {
          ...(logContext || {}),
          notification_id: existing.id,
        });
        return existing;
      }
    }
    const errorObj = error instanceof Error ? error : new Error(errorToString(error));
    // Use dbQuery serializer for consistent database query formatting
    logger.error('Failed to insert notification', {
      ...(logContext || {}),
      dbQuery: {
        table: 'notifications',
        operation: 'insert',
        schema: 'public',
        args: {
          id: record.id,
          title: record.title,
          // Other fields redacted by Pino's redact config
        },
      },
      err: errorObj,
    });
    throw error ?? new Error('Unknown notification insert error');
  }

  // Invalidate cache after successful insert
  await invalidateCacheByKey('cache.invalidate.notifications', ['notifications'], {
    ...(logContext !== undefined ? { logContext } : {}),
  }).catch((cacheError) => {
    const errorObj = cacheError instanceof Error ? cacheError : new Error(String(cacheError));
    logger.warn('Cache invalidation failed', {
      ...(logContext || {}),
      err: errorObj,
    });
  });

  logger.info('Inserted notification', {
      ...(logContext || {}),
      notification_id: data.id,
      title: data.title,
    });
  return data;
}

export async function dismissNotificationsForUser(
  userId: string,
  notificationIds: string[],
  logContext?: Record<string, unknown>
) {
  const sanitizedIds = Array.from(
    new Set(notificationIds.map((id) => id.trim()).filter(Boolean))
  ).slice(0, MAX_NOTIFICATION_IDS);

  if (sanitizedIds.length === 0) {
    logger.warn('dismissNotificationsForUser called without IDs', {
      ...(logContext || {}),
      user_id: userId,
    });
    return;
  }

  const upsertData = sanitizedIds.map((notificationId) => ({
    notification_id: notificationId,
    user_id: userId,
  })) satisfies DatabaseGenerated['public']['Tables']['notification_dismissals']['Insert'][];
  const { error } = await supabaseServiceRole.from('notification_dismissals').upsert(upsertData);

  if (error) {
    const errorObj = error instanceof Error ? error : new Error(errorToString(error));
    // Use dbQuery serializer for consistent database query formatting
    logger.error('Failed to dismiss notifications', {
      ...(logContext || {}),
      user_id: userId,
      dbQuery: {
        table: 'notification_dismissals',
        operation: 'upsert',
        schema: 'public',
        args: {
          count: sanitizedIds.length,
          // Individual IDs redacted by Pino's redact config
        },
      },
      err: errorObj,
    });
    throw error;
  }

  // Invalidate cache after successful dismiss
  await invalidateCacheByKey('cache.invalidate.notifications', ['notifications'], {
    ...(logContext !== undefined ? { logContext } : {}),
  }).catch((cacheError) => {
    const errorObj = cacheError instanceof Error ? cacheError : new Error(String(cacheError));
    logger.warn('Cache invalidation failed', {
      ...(logContext || {}),
      err: errorObj,
    });
  });

  logger.info('Dismissed notifications', {
      ...(logContext || {}),
      user_id: userId,
      dismissCount: sanitizedIds.length,
    });
}

export function createNotificationTrace(fields?: Record<string, unknown>) {
  return {
    traceId: crypto.randomUUID(),
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
    const errorObj = error instanceof Error ? error : new Error(errorToString(error));
    // Use dbQuery serializer for consistent database query formatting
    logger.error('Failed to load existing notification', {
      notification_id: id,
      dbQuery: {
        table: 'notifications',
        operation: 'select',
        schema: 'public',
        args: {
          id,
        },
      },
      err: errorObj,
    });
    return null;
  }

  return data ?? null;
}
