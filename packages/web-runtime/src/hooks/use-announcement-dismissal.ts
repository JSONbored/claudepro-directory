'use client';

/**
 * Announcement Dismissal Hook
 *
 * Manages per-announcement dismissal state using localStorage.
 * Provides type-safe, persistent dismissal tracking with cross-tab synchronization.
 *
 * Features:
 * - Per-announcement dismissal tracking (not global)
 * - Persistent across page reloads
 * - Synchronized across browser tabs
 * - Timestamp tracking for analytics
 * - Reset capability for testing
 * - SSR-safe
 *
 * @example
 * ```tsx
 * function AnnouncementBanner({ announcement }) {
 *   const { isDismissed, dismiss } = useAnnouncementDismissal(announcement.id);
 *
 *   if (isDismissed) return null;
 *
 *   return (
 *     <div>
 *       {announcement.title}
 *       <button onClick={dismiss}>Dismiss</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @module web-runtime/hooks/use-announcement-dismissal
 */

import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';
import { ParseStrategy, safeParse } from '../data.ts';
import { useLocalStorage } from './use-local-storage.ts';
import { z } from 'zod';

/**
 * Dismissal state for all announcements
 * Maps announcement IDs to their dismissal information
 */
interface DismissalState {
  [announcementId: string]: {
    /** Whether this announcement has been dismissed */
    dismissed: boolean;
    /** ISO timestamp when dismissal occurred */
    timestamp: string;
  };
}

/** Zod schema for validating dismissal state from localStorage */
const dismissalStateSchema = z.record(
  z.string(),
  z.object({
    dismissed: z.boolean(),
    timestamp: z.string(),
  })
);

/** Return type for useAnnouncementDismissal hook */
export interface UseAnnouncementDismissalReturn {
  /** Whether this announcement has been dismissed */
  isDismissed: boolean;
  /** Function to dismiss this announcement */
  dismiss: () => void;
  /** Function to reset dismissal (for testing/debugging) */
  reset: () => void;
  /** Get the timestamp when this announcement was dismissed (null if not dismissed) */
  getDismissalTime: () => string | null;
}

/**
 * Hook for managing announcement dismissal state
 * @param announcementId - Unique identifier for the announcement
 * @returns Object with dismissal state and control functions
 */
export function useAnnouncementDismissal(announcementId: string): UseAnnouncementDismissalReturn {
  const { value, setValue } = useLocalStorage<DismissalState>('announcement-dismissals', {
    defaultValue: {},
    syncAcrossTabs: true,
  });

  const isDismissed = value[announcementId]?.dismissed ?? false;

  const dismiss = () => {
    setValue({
      ...value,
      [announcementId]: {
        dismissed: true,
        timestamp: new Date().toISOString(),
      },
    });
  };

  const reset = () => {
    const newValue = { ...value };
    delete newValue[announcementId];
    setValue(newValue);
  };

  const getDismissalTime = (): string | null => {
    return value[announcementId]?.timestamp || null;
  };

  return {
    isDismissed,
    dismiss,
    reset,
    getDismissalTime,
  };
}

/**
 * Clear all announcement dismissals from localStorage
 * Useful for testing or admin functions
 *
 * @example
 * ```tsx
 * function AdminPanel() {
 *   return (
 *     <button onClick={clearAllAnnouncementDismissals}>
 *       Reset All Announcements
 *     </button>
 *   );
 * }
 * ```
 */
export function clearAllAnnouncementDismissals(): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem('announcement-dismissals');
  } catch (error) {
    logger.error(
      'Failed to clear announcement dismissals',
      normalizeError(error, 'Announcement dismissal operation failed'),
      { component: 'useAnnouncementDismissal', action: 'clearAll' }
    );
  }
}

/**
 * Get dismissal analytics data from localStorage
 * Returns map of announcement IDs to dismissal timestamps
 *
 * @returns Map of announcement IDs to dismissal information
 *
 * @example
 * ```tsx
 * function AnalyticsDashboard() {
 *   const dismissals = getAnnouncementDismissalAnalytics();
 *
 *   return (
 *     <div>
 *       <h3>Dismissed Announcements: {Object.keys(dismissals).length}</h3>
 *       {Object.entries(dismissals).map(([id, data]) => (
 *         <div key={id}>
 *           {id}: Dismissed on {new Date(data.timestamp).toLocaleDateString()}
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function getAnnouncementDismissalAnalytics(): DismissalState {
  if (typeof window === 'undefined') return {};

  try {
    const stored = window.localStorage.getItem('announcement-dismissals');
    if (!stored) return {};

    return safeParse<DismissalState>(stored, dismissalStateSchema, {
      strategy: ParseStrategy.VALIDATED_JSON,
    });
  } catch (error) {
    logger.error(
      'Failed to read dismissal analytics',
      normalizeError(error, 'Announcement dismissal operation failed'),
      { component: 'useAnnouncementDismissal', action: 'getAnalytics' }
    );
    return {};
  }
}
