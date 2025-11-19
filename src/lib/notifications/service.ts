import type { NotificationRecord } from '@/src/lib/data/notifications';
import { logger } from '@/src/lib/logger';
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
  authToken: string;
}

export async function dismissNotifications({
  userId,
  notificationIds,
  authToken,
}: NotificationDismissParams): Promise<number> {
  if (notificationIds.length === 0) {
    return 0;
  }

  const fluxStationUrl =
    process.env['NEXT_PUBLIC_FLUX_STATION_URL'] ||
    `${process.env['NEXT_PUBLIC_SUPABASE_URL']}/functions/v1/flux-station`;

  try {
    // Use auth token passed from action (no client creation needed)
    const response = await fetch(`${fluxStationUrl}/dismiss`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to dismiss notifications: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as { dismissed: number; traceId?: string };
    return result.dismissed;
  } catch (error) {
    logger.error('Failed to dismiss notifications via flux-station', error as Error, {
      userId,
      notificationIdsCount: notificationIds.length,
    });
    throw error;
  }
}

export async function createNotification(
  input: NotificationCreateInput,
  authToken?: string
): Promise<NotificationRecord> {
  const fluxStationUrl =
    process.env['NEXT_PUBLIC_FLUX_STATION_URL'] ||
    `${process.env['NEXT_PUBLIC_SUPABASE_URL']}/functions/v1/flux-station`;

  try {
    // Use optional auth token if provided (notifications are global, auth is optional)
    const response = await fetch(`${fluxStationUrl}/notifications/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create notification: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as {
      notification: NotificationRecord;
      traceId?: string;
    };
    return result.notification;
  } catch (error) {
    logger.error('Failed to create notification via flux-station', error as Error, {
      ...(input.id && { notificationId: input.id }),
      title: input.title,
    });
    throw error;
  }
}
