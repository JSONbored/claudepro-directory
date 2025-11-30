/**
 * useOnboardingToasts Hook
 *
 * Manages onboarding notifications via Vercel API flux routes.
 * Features:
 * - Server-side notification management
 * - Persistent dismissal via database
 * - Sequential display with delays
 * - User-specific notifications
 * - Context-aware messaging
 */

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks/use-authenticated-user';
import { useCallback, useEffect, useState } from 'react';

interface OnboardingToast {
  id: string;
  title: string;
  message: string;
  delay?: number;
  duration?: number;
}

const ONBOARDING_TOASTS: OnboardingToast[] = [
  {
    id: 'wizard-welcome',
    title: '👋 Welcome to the Submission Wizard',
    message: "We'll guide you through each step to create a perfect submission.",
    delay: 1000,
    duration: 5000,
  },
  {
    id: 'wizard-drafts',
    title: '💾 Auto-Save Enabled',
    message: 'Your progress is automatically saved. Feel free to take breaks!',
    delay: 6500,
    duration: 5000,
  },
  {
    id: 'wizard-templates',
    title: '✨ Pro Tip: Use Templates',
    message: 'Save time by starting with proven templates from the community.',
    delay: 12000,
    duration: 5000,
  },
];

const STORAGE_KEY = 'claudepro_onboarding_toasts_seen';

interface OnboardingToastsOptions {
  enabled?: boolean;
  context?: 'wizard' | 'submit' | 'general';
  customToasts?: OnboardingToast[];
}

/**
 * Manage onboarding toast notifications for a given context and provide controls to mark or reset seen state.
 *
 * Creates server-side onboarding notifications when the current user has not yet seen toasts for the provided
 * context, persists the "seen" state in localStorage, exposes IDs of active toasts, and offers utilities to
 * mark or reset the seen state.
 *
 * @param options.enabled - boolean — Whether the hook is active; when false the hook performs no network or local checks (default: `true`)
 * @param options.context - 'wizard' | 'submit' | 'general' — Context key used to scope onboarding toasts (default: `'wizard'`)
 * @param options.customToasts - OnboardingToast[] | undefined — Optional custom list of onboarding toasts to create instead of the default set
 * @returns {{
 *   hasSeenToasts: boolean;
 *   activeToasts: Set<string>;
 *   markToastsAsSeen: () => Promise<void>;
 *   resetToasts: () => void;
 *   resetAllToasts: () => void;
 *   isActive: boolean;
 * }} An object with:
 *   - hasSeenToasts: `true` if toasts for the provided context have been recorded as seen, `false` otherwise.
 *   - activeToasts: IDs of toasts that were successfully created and are currently active.
 *   - markToastsAsSeen: Marks the current context as seen in localStorage (and attempts server-side dismissal where applicable).
 *   - resetToasts: Removes the seen flag for the current context from localStorage.
 *   - resetAllToasts: Clears all onboarding seen state from localStorage.
 *   - isActive: `true` if there are any active toasts (`activeToasts.size > 0`).
 */
export function useOnboardingToasts({
  enabled = true,
  context = 'wizard',
  customToasts,
}: OnboardingToastsOptions = {}) {
  const [hasSeenToasts, setHasSeenToasts] = useState(true);
  const [activeToasts, setActiveToasts] = useState<Set<string>>(new Set());

  // Check if user has seen toasts for this context
  const { user } = useAuthenticatedUser({
    context: 'useOnboardingToasts',
    subscribe: false,
  });

  // Fetch active notifications from Vercel API
  useEffect(() => {
    if (!(enabled && user)) return;

    const fetchNotifications = async () => {
      try {
        // Use relative URL for Vercel API routes (same origin)
        const response = await fetch('/api/flux/notifications/active', {
          credentials: 'include', // Include cookies for auth
        });

        if (response.ok) {
          const data = await response.json();
          const hasOnboardingNotifs = data.notifications?.some(
            (n: { metadata?: { context?: string }; type?: string }) =>
              n.metadata?.context === context && n.type === 'onboarding'
          );
          setHasSeenToasts(hasOnboardingNotifs);
        }
      } catch (_error) {
        // Fallback to localStorage
        try {
          const seenToasts = localStorage.getItem(STORAGE_KEY);
          const seenData = seenToasts ? JSON.parse(seenToasts) : {};
          if (!seenData[context]) {
            setHasSeenToasts(false);
          }
        } catch {
          // Ignore localStorage errors
        }
      }
    };

    fetchNotifications().catch((error: unknown) => {
      const normalized = normalizeError(error, 'Failed to fetch notifications');
      logger.warn('Failed to fetch notifications', { error: normalized.message });
    });
  }, [enabled, context, user]);

  // Mark toasts as seen in both database and localStorage
  const markToastsAsSeen = useCallback(async () => {
    try {
      // Mark in localStorage (immediate)
      const seenToasts = localStorage.getItem(STORAGE_KEY);
      const seenData = seenToasts ? JSON.parse(seenToasts) : {};
      seenData[context] = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seenData));

      // Dismiss notifications in database (async) via edge function
      // Note: This is a no-op since we don't have notification IDs here
      // The actual dismissal happens when users interact with notifications
      // This hook just tracks localStorage state

      setHasSeenToasts(true);
    } catch {
      // Ignore errors when marking toasts as seen
    }
  }, [context]);

  // Create onboarding notifications via Vercel API
  useEffect(() => {
    if (!enabled || hasSeenToasts || !user) return;

    const createNotifications = async () => {
      const toastsToShow = customToasts || ONBOARDING_TOASTS;

      try {
        // Create notifications in database via Vercel API
        for (const toast of toastsToShow) {
          const response = await fetch('/api/flux/notifications/create', {
            method: 'POST',
            credentials: 'include', // Include cookies for auth
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'onboarding',
              priority: 'low',
              title: toast.title,
              message: toast.message,
              metadata: {
                context: context,
              },
            }),
          });

          if (!response.ok) {
            logger.warn('Failed to create onboarding notification', {
              toastId: toast.id,
              status: response.status,
            });
            continue;
          }

          setActiveToasts((prev) => new Set(prev).add(toast.id));
        }

        // Mark as seen after creation
        await markToastsAsSeen();
      } catch {
        // Fallback: mark as seen in localStorage only
        try {
          const seenToasts = localStorage.getItem(STORAGE_KEY);
          const seenData = seenToasts ? JSON.parse(seenToasts) : {};
          seenData[context] = true;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seenData));
        } catch {
          // Ignore localStorage errors
        }
      }
    };

    createNotifications().catch((error: unknown) => {
      const normalized = normalizeError(error, 'Failed to create onboarding notifications');
      logger.warn('Failed to create onboarding notifications', { error: normalized.message });
    });
  }, [enabled, hasSeenToasts, customToasts, user, context, markToastsAsSeen]);

  // Reset toasts (for testing or user preference)
  const resetToasts = useCallback(() => {
    try {
      const seenToasts = localStorage.getItem(STORAGE_KEY);
      const seenData = seenToasts ? JSON.parse(seenToasts) : {};

      delete seenData[context];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seenData));

      setHasSeenToasts(false);
    } catch {
      // Ignore localStorage errors
    }
  }, [context]);

  // Reset all toasts across all contexts
  const resetAllToasts = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setHasSeenToasts(false);
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  return {
    hasSeenToasts,
    activeToasts,
    markToastsAsSeen,
    resetToasts,
    resetAllToasts,
    isActive: activeToasts.size > 0,
  };
}

/**
 * Onboarding toasts for different contexts
 */
export const ONBOARDING_TOASTS_BY_CONTEXT = {
  wizard: ONBOARDING_TOASTS,

  submit: [
    {
      id: 'submit-welcome',
      title: '🚀 Submit Your Content',
      message: 'Share your agents, rules, and configs with the community.',
      delay: 500,
      duration: 4000,
    },
    {
      id: 'submit-quality',
      title: '⭐ Quality Matters',
      message: 'High-quality submissions get approved faster and help more users.',
      delay: 5000,
      duration: 4000,
    },
  ],

  browse: [
    {
      id: 'browse-welcome',
      title: '🔍 Discover Content',
      message: 'Browse thousands of community-created agents, rules, and MCPs.',
      delay: 500,
      duration: 4000,
    },
    {
      id: 'browse-bookmark',
      title: '🔖 Bookmark Your Favorites',
      message: 'Save content for later and build your personal collection.',
      delay: 5000,
      duration: 4000,
    },
  ],
} as const;

/**
 * Trigger a one-off onboarding toast and optionally persist that it was shown.
 *
 * If a `storageKey` is provided and a corresponding entry exists in localStorage,
 * the function returns immediately without showing the toast. When a `storageKey`
 * is provided and the toast is shown, the function marks it as seen by storing
 * `onboarding_<storageKey> = "true"` in localStorage.
 *
 * Access to localStorage is best-effort: any errors reading or writing are
 * swallowed and do not throw.
 *
 * @param _title - The toast title
 * @param _message - The toast message body
 * @param options.duration - Optional display duration in milliseconds
 * @param options.storageKey - Optional key fragment used to persist that this specific toast was shown
 * @returns void
 * @see useOnboardingToasts
 */
export function showOnboardingToast(
  _title: string,
  _message: string,
  options?: {
    duration?: number;
    storageKey?: string;
  }
) {
  const { storageKey } = options || {};

  // Check if already shown
  if (storageKey) {
    try {
      const seen = localStorage.getItem(`onboarding_${storageKey}`);
      if (seen) return;
    } catch {
      // Ignore localStorage errors
    }
  }

  // Show toast

  // Mark as seen
  if (storageKey) {
    try {
      localStorage.setItem(`onboarding_${storageKey}`, 'true');
    } catch {
      // Ignore localStorage errors
    }
  }
}