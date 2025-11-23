/**
 * Notification Toast Handler - Desktop-only toast notifications with localStorage tracking
 */

'use client';

import { UI_CLASSES } from '@heyclaude/web-runtime';
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

function markShown(id: string): void {
  try {
    const shown = getShownIds();
    shown.add(id);
    localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown]));
  } catch {
    // Intentional
  }
}

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
        icon: <Bell className={UI_CLASSES.ICON_SM} />,
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
