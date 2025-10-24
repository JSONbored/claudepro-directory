/**
 * Notification Store - Zustand State Management
 *
 * ARCHITECTURE: Derived State Pattern (2025)
 * - Stores computed values as state (not computed on access)
 * - Updates derived state when dismissedIds changes
 * - Prevents infinite re-render loops (React Error #185)
 * - Components select stable state references
 *
 * Performance:
 * - O(1) state access (no filtering on every render)
 * - Memoized derived state updates only when dismissedIds changes
 * - Stable array references prevent unnecessary component re-renders
 *
 * @module lib/stores/notification-store
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getActiveNotifications, type Notification } from '@/src/config/notifications';

/**
 * Helper: Compute active notifications (non-dismissed)
 */
function computeActiveNotifications(dismissedIds: string[]): Notification[] {
  return getActiveNotifications().filter((n) => !dismissedIds.includes(n.id));
}

export interface NotificationStore {
  /** List of dismissed notification IDs (persisted) */
  dismissedIds: string[];

  /** Whether the notification sheet is open */
  isSheetOpen: boolean;

  /** Derived state: Active, non-dismissed notifications (STABLE REFERENCE) */
  activeNotifications: Notification[];

  /** Derived state: Unread count (STABLE VALUE) */
  unreadCount: number;

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

  /** Check if notification is dismissed */
  isDismissed: (id: string) => boolean;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => {
      // Initialize derived state
      const initialDismissedIds: string[] = [];
      const initialActiveNotifications = computeActiveNotifications(initialDismissedIds);

      return {
        dismissedIds: initialDismissedIds,
        isSheetOpen: false,
        activeNotifications: initialActiveNotifications,
        unreadCount: initialActiveNotifications.length,

        dismiss: (id: string) => {
          set((state) => {
            const newDismissedIds = [...state.dismissedIds, id];
            const newActiveNotifications = computeActiveNotifications(newDismissedIds);

            return {
              dismissedIds: newDismissedIds,
              activeNotifications: newActiveNotifications,
              unreadCount: newActiveNotifications.length,
            };
          });
        },

        dismissAll: () => {
          const allIds = getActiveNotifications().map((n) => n.id);
          set({
            dismissedIds: allIds,
            activeNotifications: [],
            unreadCount: 0,
          });
        },

        openSheet: () => set({ isSheetOpen: true }),

        closeSheet: () => set({ isSheetOpen: false }),

        toggleSheet: () => set((state) => ({ isSheetOpen: !state.isSheetOpen })),

        isDismissed: (id: string) => {
          const { dismissedIds } = get();
          return dismissedIds.includes(id);
        },
      };
    },
    {
      name: 'notification-storage', // localStorage key
      partialize: (state) => ({ dismissedIds: state.dismissedIds }), // Only persist dismissedIds
      onRehydrateStorage: () => (state) => {
        // After rehydration, recompute derived state from persisted dismissedIds
        if (state) {
          const activeNotifications = computeActiveNotifications(state.dismissedIds);
          state.activeNotifications = activeNotifications;
          state.unreadCount = activeNotifications.length;
        }
      },
    }
  )
);
