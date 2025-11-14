'use server';

import { z } from 'zod';
import { authedAction } from '@/src/lib/actions/safe-action';
import { logger } from '@/src/lib/logger';

const getActiveNotificationsSchema = z.object({
  dismissedIds: z.array(z.string()).optional(),
});

export type ActiveNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  action_label: string | null;
  action_href: string | null;
  action_onclick: string | null;
  active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export const getActiveNotificationsAction = authedAction
  .metadata({
    actionName: 'getActiveNotifications',
    category: 'user',
  })
  .schema(getActiveNotificationsSchema)
  .action(async ({ parsedInput, ctx }) => {
    try {
      const { createClient } = await import('@/src/lib/supabase/server');
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_active_notifications', {
        p_dismissed_ids: parsedInput.dismissedIds ?? [],
      });

      if (error) {
        throw new Error(error.message);
      }

      return (data || []) as ActiveNotification[];
    } catch (error) {
      logger.error(
        'Failed to load active notifications',
        error instanceof Error ? error : new Error(String(error)),
        { userId: ctx.userId }
      );
      throw error;
    }
  });
