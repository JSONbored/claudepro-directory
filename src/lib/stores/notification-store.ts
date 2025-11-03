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

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => {
      const refreshFromDatabase = async () => {
        const supabase = createClient();
        const { dismissedIds } = get();

        try {
          const { data, error } = await supabase.rpc('get_active_notifications', {
            p_dismissed_ids: dismissedIds,
          });

          if (error) {
            logger.error('Failed to refresh notifications', error);
            return;
          }

          set({
            notifications: data || [],
            unreadCount: (data || []).length,
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
          const supabase = createClient();

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
                refreshFromDatabase();
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

          refreshFromDatabase();
        },

        dismissAll: () => {
          set((state) => ({
            dismissedIds: [...state.dismissedIds, ...state.notifications.map((n) => n.id)],
            notifications: [],
            unreadCount: 0,
          }));

          refreshFromDatabase();
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
