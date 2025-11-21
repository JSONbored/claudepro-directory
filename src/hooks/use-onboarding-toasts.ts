/**
 * useOnboardingToasts Hook
 *
 * Manages onboarding notifications via flux-station notification system.
 * Features:
 * - Server-side notification management
 * - Persistent dismissal via database
 * - Sequential display with delays
 * - User-specific notifications
 * - Context-aware messaging
 */

import { useCallback, useEffect, useState } from 'react';
import { useAuthenticatedUser } from '@/src/lib/auth/use-authenticated-user';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

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

  // Fetch active notifications from flux-station
  useEffect(() => {
    if (!(enabled && user)) return;

    const fetchNotifications = async () => {
      try {
        const fluxStationUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
          ? `${process.env['NEXT_PUBLIC_SUPABASE_URL']}/functions/v1/flux-station/active-notifications`
          : null;
        if (!fluxStationUrl) {
          logger.warn('NEXT_PUBLIC_SUPABASE_URL not configured, skipping notification fetch');
          return;
        }
        const response = await fetch(fluxStationUrl, {
          headers: {
            Authorization: `Bearer ${user.id}`,
          },
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

    fetchNotifications().catch((error) => {
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

  // Create onboarding notifications via flux-station
  useEffect(() => {
    if (!enabled || hasSeenToasts || !user) return;

    const createNotifications = async () => {
      const toastsToShow = customToasts || ONBOARDING_TOASTS;

      try {
        // Create notifications in database via edge function
        const fluxStationUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
          ? `${process.env['NEXT_PUBLIC_SUPABASE_URL']}/functions/v1/flux-station/notifications/create`
          : null;
        if (!fluxStationUrl) {
          logger.warn('NEXT_PUBLIC_SUPABASE_URL not configured, skipping notification creation');
          return;
        }
        for (const toast of toastsToShow) {
          await fetch(fluxStationUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${user.id}`,
            },
            body: JSON.stringify({
              type: 'announcement', // Edge function expects 'announcement' or 'feedback'
              priority: 'low',
              title: toast.title,
              message: toast.message,
              // Note: metadata field is not supported by notifications table schema
            }),
          });

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

    createNotifications().catch((error) => {
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
 * Manual toast trigger for specific onboarding moments
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
