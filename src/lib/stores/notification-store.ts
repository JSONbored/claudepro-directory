/**
 * Notification Store - Zustand State Management
 *
 * Simple store for managing notification state:
 * - Active notifications
 * - Dismissed notification IDs (persisted in localStorage)
 * - Unread count
 * - Sheet open/close state
 *
 * @module lib/stores/notification-store
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActiveNotifications, type Notification } from '@/src/config/notifications';

export interface NotificationStore {
  /** List of dismissed notification IDs */
  dismissedIds: string[];

  /** Whether the notification sheet is open */
  isSheetOpen: boolean;

  /** Dismiss a notification by ID */
  dismiss: (id: string) => void;

  /** Dismiss all notifications */
  dismissAll: () => void;

  /** Open the notification sheet */
  openSheet: () => void;

  /** Close the notification sheet */
  closeSheet: () => void;

  /** Toggle the notification sheet */
  toggleSheet: () => void;

  /** Get active, non-dismissed notifications */
  getActiveNotifications: () => Notification[];

  /** Get unread count */
  getUnreadCount: () => number;

  /** Check if notification is dismissed */
  isDismissed: (id: string) => boolean;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      dismissedIds: [],
      isSheetOpen: false,

      dismiss: (id: string) => {
        set((state) => ({
          dismissedIds: [...state.dismissedIds, id],
        }));
      },

      dismissAll: () => {
        const allIds = getActiveNotifications().map((n) => n.id);
        set({ dismissedIds: allIds });
      },

      openSheet: () => set({ isSheetOpen: true }),

      closeSheet: () => set({ isSheetOpen: false }),

      toggleSheet: () => set((state) => ({ isSheetOpen: !state.isSheetOpen })),

      getActiveNotifications: () => {
        const { dismissedIds } = get();
        return getActiveNotifications().filter((n) => !dismissedIds.includes(n.id));
      },

      getUnreadCount: () => {
        const { dismissedIds } = get();
        return getActiveNotifications().filter((n) => !dismissedIds.includes(n.id)).length;
      },

      isDismissed: (id: string) => {
        const { dismissedIds } = get();
        return dismissedIds.includes(id);
      },
    }),
    {
      name: 'notification-storage', // localStorage key
      partialize: (state) => ({ dismissedIds: state.dismissedIds }), // Only persist dismissedIds
    }
  )
);
