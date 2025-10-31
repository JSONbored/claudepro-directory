/**
 * Notification Toast Handler - Desktop-only toast notifications with localStorage tracking
 */

'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { Bell } from '@/src/lib/icons';
import { type NotificationStore, useNotificationStore } from '@/src/lib/stores/notification-store';

const SHOWN_KEY = 'notification-toasts-shown';

function getShownIds(): Set<string> {
  try {
    const stored = localStorage.getItem(SHOWN_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

function markShown(id: string): void {
  try {
    const shown = getShownIds();
    shown.add(id);
    localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown]));
  } catch {}
}

export function NotificationToastHandler() {
  const notifications = useNotificationStore((state: NotificationStore) => state.notifications);
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!window.matchMedia('(min-width: 768px)').matches) return;

    const persistedShown = getShownIds();
    const toShow = notifications.find(
      (n) => !(persistedShown.has(n.id) || shownRef.current.has(n.id))
    );

    if (toShow) {
      toast(toShow.title, {
        description: toShow.message,
        icon: <Bell className="h-4 w-4" />,
        duration: 5000,
        action: toShow.action_label
          ? {
              label: toShow.action_label,
              onClick: () => {
                if (toShow.action_href) {
                  window.location.href = toShow.action_href;
                }
              },
            }
          : undefined,
      });

      markShown(toShow.id);
      shownRef.current.add(toShow.id);
    }
  }, [notifications]);

  return null;
}
