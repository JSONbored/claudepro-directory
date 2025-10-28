/**
 * Notification Store - Zustand State Management
 *
 * Database-first: Fetches notifications from Supabase using Tables<'notifications'>
 * No manual types - everything from generated database.types.ts
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
import { createClient } from '@/src/lib/supabase/client';
import type { Tables } from '@/src/types/database.types';

// Type alias for cleaner code
type Notification = Tables<'notifications'>;

/**
 * Fetch active notifications from database (client-side)
 */
async function fetchActiveNotifications(): Promise<Notification[]> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('active', true)
    .or(`expires_at.is.null,expires_at.gte.${now}`)
    .order('priority', { ascending: false }) // high > medium > low
    .order('created_at', { ascending: true }); // oldest first

  if (error) {
    console.error('Failed to load notifications:', error);
    return [];
  }

  return data || [];
}

/**
 * Helper: Compute active notifications (non-dismissed)
 */
function computeActiveNotifications(
  allNotifications: Notification[],
  dismissedIds: string[]
): Notification[] {
  return allNotifications.filter((n) => !dismissedIds.includes(n.id));
}

export interface NotificationStore {
  /** List of dismissed notification IDs (persisted) */
  dismissedIds: string[];

  /** Whether the notification sheet is open */
  isSheetOpen: boolean;

  /** All notifications from database */
  allNotifications: Notification[];

  /** Derived state: Active, non-dismissed notifications (STABLE REFERENCE) */
  activeNotifications: Notification[];

  /** Derived state: Unread count (STABLE VALUE) */
  unreadCount: number;

  /** Fetch notifications from database */
  fetchNotifications: () => Promise<void>;

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
      const initialAllNotifications: Notification[] = [];
      const initialActiveNotifications = computeActiveNotifications(
        initialAllNotifications,
        initialDismissedIds
      );

      return {
        dismissedIds: initialDismissedIds,
        isSheetOpen: false,
        allNotifications: initialAllNotifications,
        activeNotifications: initialActiveNotifications,
        unreadCount: initialActiveNotifications.length,

        fetchNotifications: async () => {
          const notifications = await fetchActiveNotifications();
          set((state) => {
            const newActiveNotifications = computeActiveNotifications(
              notifications,
              state.dismissedIds
            );
            return {
              allNotifications: notifications,
              activeNotifications: newActiveNotifications,
              unreadCount: newActiveNotifications.length,
            };
          });
        },

        dismiss: (id: string) => {
          set((state) => {
            const newDismissedIds = [...state.dismissedIds, id];
            const newActiveNotifications = computeActiveNotifications(
              state.allNotifications,
              newDismissedIds
            );

            return {
              dismissedIds: newDismissedIds,
              activeNotifications: newActiveNotifications,
              unreadCount: newActiveNotifications.length,
            };
          });
        },

        dismissAll: () => {
          set((state) => {
            const allIds = state.allNotifications.map((n) => n.id);
            return {
              dismissedIds: allIds,
              activeNotifications: [],
              unreadCount: 0,
            };
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
        // After rehydration, fetch notifications from database
        if (state) {
          state.fetchNotifications();
        }
      },
    }
  )
);
