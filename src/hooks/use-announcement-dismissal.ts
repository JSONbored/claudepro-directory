'use client';

import { useLocalStorage } from '@/src/hooks/use-local-storage';
import { logger } from '@/src/lib/logger';

/**
 * Dismissal State Interface
 *
 * Stores dismissal information for each announcement by ID.
 * Includes timestamp for analytics and potential expiry logic.
 */
interface DismissalState {
  [announcementId: string]: {
    /** Whether this announcement has been dismissed */
    dismissed: boolean;
    /** ISO timestamp when dismissal occurred */
    timestamp: string;
  };
}

/**
 * Return type for useAnnouncementDismissal hook
 */
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
 * useAnnouncementDismissal Hook
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
 * @param announcementId - Unique identifier for the announcement
 * @returns Object with dismissal state and control functions
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
 * @see Research Report: "shadcn Announcement Component Integration - Section 4.3"
 */
export function useAnnouncementDismissal(announcementId: string): UseAnnouncementDismissalReturn {
  const { value, setValue } = useLocalStorage<DismissalState>('announcement-dismissals', {
    defaultValue: {},
    syncAcrossTabs: true,
  });

  /**
   * Check if this specific announcement has been dismissed
   */
  const isDismissed = value[announcementId]?.dismissed ?? false;

  /**
   * Dismiss this announcement
   * Stores dismissal state with current timestamp
   */
  const dismiss = () => {
    setValue({
      ...value,
      [announcementId]: {
        dismissed: true,
        timestamp: new Date().toISOString(),
      },
    });
  };

  /**
   * Reset dismissal for this announcement
   * Useful for testing or allowing users to "unblock" announcements
   */
  const reset = () => {
    const newValue = { ...value };
    delete newValue[announcementId];
    setValue(newValue);
  };

  /**
   * Get the timestamp when this announcement was dismissed
   * @returns ISO timestamp string or null if not dismissed
   */
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
 * Clear All Dismissals
 *
 * Utility function to clear all announcement dismissals.
 * Useful for testing or admin functions.
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
      error instanceof Error ? error : new Error(String(error)),
      { component: 'useAnnouncementDismissal', action: 'clearAll' }
    );
  }
}

/**
 * Get Dismissal Analytics
 *
 * Retrieves all dismissal data for analytics purposes.
 * Returns map of announcement IDs to dismissal timestamps.
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
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    logger.error(
      'Failed to read dismissal analytics',
      error instanceof Error ? error : new Error(String(error)),
      { component: 'useAnnouncementDismissal', action: 'getAnalytics' }
    );
    return {};
  }
}
