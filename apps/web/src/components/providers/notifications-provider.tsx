/**
 * NotificationsProvider
 * Centralizes notification fetch, realtime updates, dismissed state, and feature flags.
 */
'use client';

import type { Database } from '@heyclaude/database-types';
import {
  dismissNotificationsAction,
  getActiveNotificationsAction,
} from '@heyclaude/web-runtime/actions';
import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { FLAG_KEYS } from '@heyclaude/web-runtime/feature-flags/keys';
import { useFeatureFlags } from '@heyclaude/web-runtime/feature-flags/provider';
import { useAction } from 'next-safe-action/hooks';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type NotificationRecord = Database['public']['Tables']['notifications']['Row'];

interface NotificationFeatureFlags {
  enableNotifications: boolean;
  enableSheet: boolean;
  enableToasts: boolean;
  enableFab: boolean;
}

interface NotificationsContextValue {
  notifications: NotificationRecord[];
  unreadCount: number;
  dismiss: (id: string) => void;
  dismissAll: () => void;
  isSheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  toggleSheet: () => void;
  flags: NotificationFeatureFlags;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);
const DISMISSED_STORAGE_KEY = 'notification-storage';

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isEnabled } = useFeatureFlags();

  const flags = useMemo(
    () => ({
      enableNotifications: isEnabled(FLAG_KEYS.NOTIFICATIONS_PROVIDER),
      enableSheet: isEnabled(FLAG_KEYS.NOTIFICATIONS_SHEET),
      enableToasts: isEnabled(FLAG_KEYS.NOTIFICATIONS_TOASTS),
      enableFab: isEnabled(FLAG_KEYS.FAB_NOTIFICATIONS),
    }),
    [isEnabled]
  );

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const dismissedIdsRef = useRef<string[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { executeAsync: fetchNotifications } = useAction(getActiveNotificationsAction);
  const { executeAsync: performDismiss } = useAction(dismissNotificationsAction);

  useEffect(() => {
    dismissedIdsRef.current = dismissedIds;
    try {
      localStorage.setItem(
        DISMISSED_STORAGE_KEY,
        JSON.stringify({ dismissedIds: dismissedIdsRef.current })
      );
    } catch (error) {
      const err = normalizeError(error);
      logger.error('[NotificationsProvider] Failed to persist dismissed IDs', err, {
        dismissedIds: dismissedIdsRef.current, // Array support enables better log querying
        count: dismissedIdsRef.current.length,
      });
    }
  }, [dismissedIds]);

  const refresh = useCallback(async () => {
    if (!flags.enableNotifications) return;
    try {
      const latest = await fetchNotifications({ dismissedIds: dismissedIdsRef.current });

      if (latest?.serverError) {
        logger.error(
          '[NotificationsProvider] Failed to refresh notifications (server error)',
          new Error(latest.serverError)
        );
        return;
      }

      if (latest?.validationErrors) {
        logger.error(
          '[NotificationsProvider] Validation error refreshing notifications',
          new Error(JSON.stringify(latest.validationErrors))
        );
        return;
      }

      const payload = latest?.data as
        | { notifications?: NotificationRecord[]; traceId?: string }
        | undefined;
      setNotifications(payload?.notifications ?? []);
    } catch (error) {
      logger.error(
        '[NotificationsProvider] Failed to refresh notifications',
        normalizeError(error),
        {
          dismissedIds: dismissedIdsRef.current, // Array support enables better log querying
          count: dismissedIdsRef.current.length,
        }
      );
    }
  }, [fetchNotifications, flags.enableNotifications]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { dismissedIds?: string[] };
        if (parsed?.dismissedIds?.length) {
          setDismissedIds(parsed.dismissedIds);
        }
      }
    } catch (error) {
      logger.error('[NotificationsProvider] Failed to read dismissed IDs', normalizeError(error));
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!(isInitialized && flags.enableNotifications)) return;
    refresh().catch((error) => {
      logger.error(
        '[NotificationsProvider] Failed to refresh notifications on mount',
        normalizeError(error)
      );
    });
  }, [flags.enableNotifications, isInitialized, refresh]);

  useEffect(() => {
    if (!(flags.enableNotifications && isInitialized)) {
      return undefined;
    }
    const id = window.setInterval(() => {
      refresh().catch((error) =>
        logger.error('[NotificationsProvider] Failed periodic refresh', normalizeError(error))
      );
    }, 60000);
    return () => window.clearInterval(id);
  }, [flags.enableNotifications, isInitialized, refresh]);

  const dismiss = useCallback(
    (id: string) => {
      setDismissedIds((prev) => {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      });
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
      performDismiss({ notificationIds: [id] })
        .then(() => refresh())
        .catch((error) => {
          const normalized = normalizeError(
            error,
            '[NotificationsProvider] Failed to persist dismissal'
          );
          logger.error('[NotificationsProvider] Failed to persist dismissal', normalized, {
            id,
          });
        });
    },
    [performDismiss, refresh]
  );

  const dismissAll = useCallback(() => {
    if (notifications.length === 0) return;
    const ids = notifications.map((notification) => notification.id);
    setDismissedIds((prev) => Array.from(new Set([...prev, ...ids])));
    setNotifications([]);
    performDismiss({ notificationIds: ids })
      .then(() => refresh())
      .catch((error) => {
        const normalized = normalizeError(
          error,
          '[NotificationsProvider] Failed to persist dismiss-all'
        );
        logger.error('[NotificationsProvider] Failed to persist dismiss-all', normalized, {
          dismissedIds: ids, // Array support enables better log querying
          count: ids.length,
        });
      });
  }, [notifications, performDismiss, refresh]);

  const contextValue = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount: notifications.length,
      dismiss,
      dismissAll,
      isSheetOpen,
      openSheet: () => setIsSheetOpen(true),
      closeSheet: () => setIsSheetOpen(false),
      toggleSheet: () => setIsSheetOpen((prev) => !prev),
      flags,
      refresh,
    }),
    [dismiss, dismissAll, flags, isSheetOpen, notifications, refresh]
  );

  return (
    <NotificationsContext.Provider value={contextValue}>{children}</NotificationsContext.Provider>
  );
}

export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return ctx;
}
