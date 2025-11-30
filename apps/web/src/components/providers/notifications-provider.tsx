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
import { logClientError } from '@heyclaude/web-runtime/logging/client';
import { getLayoutFlags } from '@heyclaude/web-runtime/data';
import { useSafeAction } from '@heyclaude/web-runtime/hooks';
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

/**
 * Provides notification state, controls, and feature-flagged fetching/dismissal to descendant components.
 *
 * Exposes a NotificationsContext value that includes the current notifications, unread count, methods to
 * dismiss single or all notifications, sheet open/close/toggle controls, a manual refresh function, and
 * derived feature flags. Dismissed notification IDs are persisted to localStorage and synced to the server;
 * notifications are refreshed on mount and periodically while enabled.
 *
 * @param children - React children that will receive the notifications context
 *
 * @see NotificationsContext
 * @see useNotificationsContext
 */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  // Get static layout flags
  const layoutFlags = getLayoutFlags();

  const flags = useMemo(
    () => ({
      enableNotifications: layoutFlags.notificationsProvider,
      enableSheet: layoutFlags.notificationsSheet,
      enableToasts: layoutFlags.notificationsToasts,
      enableFab: layoutFlags.fabNotifications,
    }),
    [layoutFlags]
  );

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const dismissedIdsRef = useRef<string[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { executeAsync: fetchNotifications } = useSafeAction(getActiveNotificationsAction);
  const { executeAsync: performDismiss } = useSafeAction(dismissNotificationsAction);

  useEffect(() => {
    dismissedIdsRef.current = dismissedIds;
    try {
      localStorage.setItem(
        DISMISSED_STORAGE_KEY,
        JSON.stringify({ dismissedIds: dismissedIdsRef.current })
      );
    } catch (error) {
      logClientError(
        '[NotificationsProvider] Failed to persist dismissed IDs',
        error,
        'NotificationsProvider.persistDismissedIds',
        {
          dismissedIds: dismissedIdsRef.current, // Array support enables better log querying
          count: dismissedIdsRef.current.length,
        }
      );
    }
  }, [dismissedIds]);

  const refresh = useCallback(async () => {
    if (!flags.enableNotifications) return;
    try {
      const latest = await fetchNotifications({ dismissedIds: dismissedIdsRef.current });

      if (latest?.serverError) {
        logClientError(
          '[NotificationsProvider] Failed to refresh notifications (server error)',
          new Error(latest.serverError),
          'NotificationsProvider.refresh'
        );
        return;
      }

      if (latest?.validationErrors) {
        logClientError(
          '[NotificationsProvider] Validation error refreshing notifications',
          new Error(JSON.stringify(latest.validationErrors)),
          'NotificationsProvider.refresh'
        );
        return;
      }

      const payload = latest?.data as
        | { notifications?: NotificationRecord[]; traceId?: string }
        | undefined;
      setNotifications(payload?.notifications ?? []);
    } catch (error) {
      logClientError(
        '[NotificationsProvider] Failed to refresh notifications',
        error,
        'NotificationsProvider.refresh',
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
      logClientError('[NotificationsProvider] Failed to read dismissed IDs', error, 'NotificationsProvider.readDismissedIds');
    } finally {
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!(isInitialized && flags.enableNotifications)) return;
    refresh().catch((error) => {
      logClientError(
        '[NotificationsProvider] Failed to refresh notifications on mount',
        error,
        'NotificationsProvider.mount'
      );
    });
  }, [flags.enableNotifications, isInitialized, refresh]);

  useEffect(() => {
    if (!(flags.enableNotifications && isInitialized)) {
      return undefined;
    }
    const id = window.setInterval(() => {
      refresh().catch((error) =>
        logClientError('[NotificationsProvider] Failed periodic refresh', error, 'NotificationsProvider.periodicRefresh')
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
          logClientError('[NotificationsProvider] Failed to persist dismissal', error, 'NotificationsProvider.dismiss', {
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
        logClientError('[NotificationsProvider] Failed to persist dismiss-all', error, 'NotificationsProvider.dismissAll', {
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

/**
 * Access the notifications context for the current React tree.
 *
 * @returns The `NotificationsContextValue` provided by the nearest `NotificationsProvider`.
 * @throws Error if called outside of a `NotificationsProvider`.
 * @see NotificationsProvider
 */
export function useNotificationsContext(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider');
  }
  return ctx;
}