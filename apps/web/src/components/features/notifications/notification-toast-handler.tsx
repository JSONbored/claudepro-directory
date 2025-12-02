/**
 * Notification Toast Handler - Desktop-only toast notifications with localStorage tracking
 */

'use client';

import { iconSize } from '@heyclaude/web-runtime/design-system';
import { Bell } from '@heyclaude/web-runtime/icons';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useNotificationsContext } from '@/src/components/providers/notifications-provider';

const SHOWN_KEY = 'notification-toasts-shown';

function getShownIds(): Set<string> {
  try {
    const stored = localStorage.getItem(SHOWN_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Persistently records a notification ID as shown so it will not be shown again across sessions.
 *
 * Attempts to add `id` to the persisted set stored under the `SHOWN_KEY` localStorage entry; failures are silently ignored.
 *
 * @param id - The notification identifier to mark as shown
 * @see getShownIds
 * @see SHOWN_KEY
 */
function markShown(id: string): void {
  try {
    const shown = getShownIds();
    shown.add(id);
    localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown]));
  } catch {
    // Intentional
  }
}

/**
 * Displays at most one desktop toast for the first unseen notification and records it as shown.
 *
 * When toasts are enabled and the viewport is at least 768px wide, finds the first notification
 * that has not been shown in previous sessions (persisted in localStorage) nor during the current
 * session, displays a toast for it, and marks that notification as shown both persistently and
 * in-memory. The toast includes the notification title, message, optional action button (which
 * navigates to the notification's href when clicked), and a small Bell icon.
 *
 * Note: Renders nothing (returns null).
 *
 * @see getShownIds
 * @see markShown
 * @see useNotificationsContext
 * @see iconSize
 * @see Bell
 */
export function NotificationToastHandler() {
  const { notifications, flags } = useNotificationsContext();
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!flags.enableToasts) return;
    if (!window.matchMedia('(min-width: 768px)').matches) return;

    const persistedShown = getShownIds();
    const toShow = notifications.find(
      (n) => !(persistedShown.has(n.id) || shownRef.current.has(n.id))
    );

    if (toShow) {
      toast(toShow.title, {
        description: toShow.message,
        icon: <Bell className={iconSize.sm} />,
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
  }, [notifications, flags.enableToasts]);

  return null;
}