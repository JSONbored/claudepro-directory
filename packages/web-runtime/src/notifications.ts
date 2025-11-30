import { env } from '@heyclaude/shared-runtime/schemas/env';
import type { Database } from '@heyclaude/database-types';
import { logger } from './logger.ts';
import { normalizeError } from './errors.ts';

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

interface NotificationDismissParams {
  userId: string;
  notificationIds: string[];
  authToken: string;
}

function getFluxApiUrl(): string {
  // Try env vars with fallback chain
  // Now uses Vercel API routes instead of Supabase Edge Functions
  const customUrl = (env as Record<string, unknown>)['NEXT_PUBLIC_FLUX_API_URL'] as string | undefined;
  const siteUrl = (env as Record<string, unknown>)['NEXT_PUBLIC_SITE_URL'] as string | undefined;
  
  const url = customUrl || siteUrl;
  if (!url) {
    throw new Error('Flux API URL not configured: NEXT_PUBLIC_FLUX_API_URL or NEXT_PUBLIC_SITE_URL must be set');
  }
  return url;
}

export async function dismissNotifications({
  userId,
  notificationIds,
  authToken,
}: NotificationDismissParams): Promise<number> {
  if (notificationIds.length === 0) {
    return 0;
  }

  const fluxApiUrl = getFluxApiUrl();

  try {
    const response = await fetch(`${fluxApiUrl}/api/flux/notifications/dismiss`, {
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
    const normalized = normalizeError(error, 'Failed to dismiss notifications');
    logger.error('Failed to dismiss notifications', normalized, {
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
  const fluxApiUrl = getFluxApiUrl();

  try {
    const response = await fetch(`${fluxApiUrl}/api/flux/notifications/create`, {
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
    const normalized = normalizeError(error, 'Failed to create notification');
    logger.error('Failed to create notification', normalized, {
      ...(input.id && { notificationId: input.id }),
      title: input.title,
    });
    throw error;
  }
}
