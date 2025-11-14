/**
 * Notification Store - Database-First with Realtime
 * Zero client-side filtering via PostgreSQL RPC + instant updates via Supabase Realtime.
 */

'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import type { Tables } from '@/src/types/database.types';

type Notification = Tables<'notifications'>;

export interface NotificationStore {
  dismissedIds: string[];
  isSheetOpen: boolean;
  notifications: Notification[];
  unreadCount: number;
  channel: RealtimeChannel | null;

  initializeRealtime: () => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  openSheet: () => void;
  closeSheet: () => void;
  toggleSheet: () => void;
  isDismissed: (id: string) => boolean;
  cleanup: () => void;
}

const supabase = createClient();
const EDGE_NOTIFICATIONS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/notification-router/active-notifications`;

async function fetchNotifications(dismissedIds: string[]): Promise<Notification[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('User session not found');
  }

  const params = new URLSearchParams();
  if (dismissedIds.length > 0) {
    params.set('dismissed', dismissedIds.join(','));
  }

  const response = await fetch(`${EDGE_NOTIFICATIONS_URL}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch notifications');
  }

  const data = (await response.json()) as { notifications?: Notification[] };
  return data.notifications || [];
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => {
      const refreshFromDatabase = async () => {
        const { dismissedIds } = get();

        try {
          const notifications = await fetchNotifications(dismissedIds);
          set({
            notifications,
            unreadCount: notifications.length,
          });
        } catch (error) {
          logger.error(
            'Failed to refresh notifications',
            error instanceof Error ? error : new Error(String(error))
          );
        }
      };

      return {
        dismissedIds: [],
        isSheetOpen: false,
        notifications: [],
        unreadCount: 0,
        channel: null,

        initializeRealtime: () => {
          const channel = supabase
            .channel('notifications-realtime', {
              config: {
                broadcast: { ack: false },
                presence: { key: '' },
              },
            })
            .on(
              'postgres_changes',
              {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
              },
              () => {
                refreshFromDatabase().catch(() => {
                  // Silent fail - notification refresh failed, state remains unchanged
                });
              }
            )
            .subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                await refreshFromDatabase();
              }
            });

          set({ channel });
        },

        dismiss: (id: string) => {
          set((state) => ({
            dismissedIds: [...state.dismissedIds, id],
            notifications: state.notifications.filter((n) => n.id !== id),
            unreadCount: state.notifications.filter((n) => n.id !== id).length,
          }));

          refreshFromDatabase().catch(() => {
            // Silent fail - notification already removed from UI
          });
        },

        dismissAll: () => {
          set((state) => ({
            dismissedIds: [...state.dismissedIds, ...state.notifications.map((n) => n.id)],
            notifications: [],
            unreadCount: 0,
          }));

          refreshFromDatabase().catch(() => {
            // Silent fail - all notifications already cleared from UI
          });
        },

        openSheet: () => set({ isSheetOpen: true }),

        closeSheet: () => set({ isSheetOpen: false }),

        toggleSheet: () => set((state) => ({ isSheetOpen: !state.isSheetOpen })),

        isDismissed: (id: string) => {
          const { dismissedIds } = get();
          return dismissedIds.includes(id);
        },

        cleanup: () => {
          const { channel } = get();
          if (channel) {
            channel.unsubscribe();
          }
        },
      };
    },
    {
      name: 'notification-storage',
      partialize: (state) => ({ dismissedIds: state.dismissedIds }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeRealtime();
        }
      },
    }
  )
);
