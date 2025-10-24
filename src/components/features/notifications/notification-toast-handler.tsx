/**
 * Notification Toast Handler
 *
 * Desktop-only component that displays notifications as toasts.
 * Uses Sonner (already installed) for toast notifications.
 *
 * Features:
 * - Desktop only (hidden on mobile: md: 768px+)
 * - Auto-dismiss after 5 seconds
 * - Shows each notification ONCE per user (localStorage tracking)
 * - Doesn't interfere with action toasts (copy, save, etc.)
 *
 * @module components/features/notifications/notification-toast-handler
 */

'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { Notification } from '@/src/config/notifications';
import { Bell } from '@/src/lib/icons';
import { type NotificationStore, useNotificationStore } from '@/src/lib/stores/notification-store';

const SHOWN_NOTIFICATIONS_KEY = 'notification-toasts-shown';

/**
 * Get list of notification IDs that have been shown as toasts
 */
function getShownNotifications(): string[] {
  try {
    const stored = localStorage.getItem(SHOWN_NOTIFICATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Mark notification as shown
 */
function markNotificationAsShown(id: string): void {
  try {
    const shown = getShownNotifications();
    if (!shown.includes(id)) {
      shown.push(id);
      localStorage.setItem(SHOWN_NOTIFICATIONS_KEY, JSON.stringify(shown));
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function NotificationToastHandler() {
  const activeNotifications = useNotificationStore((state: NotificationStore) =>
    state.getActiveNotifications()
  );
  const [hasShownToast, setHasShownToast] = useState(false);

  useEffect(() => {
    // Only show toast on desktop (using media query)
    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (!isDesktop || hasShownToast) return;

    // Get notifications that haven't been shown as toasts yet
    const shownIds = getShownNotifications();
    const unshownNotifications = activeNotifications.filter(
      (n: Notification) => !shownIds.includes(n.id)
    );

    // Show toast for first unshown notification only (avoid spam)
    if (unshownNotifications.length > 0) {
      const notification = unshownNotifications[0];

      if (!notification) return; // Type guard

      toast(notification.title, {
        description: notification.message,
        icon: <Bell className="h-4 w-4" />,
        duration: 5000,
        action: notification.action
          ? {
              label: notification.action.label,
              onClick: () => {
                if (notification.action?.href) {
                  window.location.href = notification.action.href;
                }
              },
            }
          : undefined,
      });

      // Mark as shown so it doesn't appear again
      markNotificationAsShown(notification.id);
      setHasShownToast(true);
    }
  }, [activeNotifications, hasShownToast]);

  return null; // This component doesn't render anything
}
