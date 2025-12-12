/**
 * useOnboardingToasts Hook
 *
 * Manages client-side onboarding toasts with localStorage persistence.
 * Features:
 * - Client-side only (no database persistence)
 * - Persistent dismissal via localStorage
 * - Context-aware messaging
 *
 * Note: Database notification system is disabled - this hook only manages client-side toasts.
 */

'use client';

import { useCallback, useEffect, useState } from 'react';

interface OnboardingToast {
  delay?: number;
  duration?: number;
  id: string;
  message: string;
  title: string;
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
    delay: 12_000,
    duration: 5000,
  },
];

const STORAGE_KEY = 'claudepro_onboarding_toasts_seen';

interface OnboardingToastsOptions {
  context?: 'general' | 'submit' | 'wizard';
  customToasts?: OnboardingToast[];
  enabled?: boolean;
}

export function useOnboardingToasts({
  enabled = true,
  context = 'wizard',
}: OnboardingToastsOptions = {}) {
  const [hasSeenToasts, setHasSeenToasts] = useState(true);
  const [activeToasts] = useState<Set<string>>(new Set());

  // Check localStorage on mount to determine if toasts have been seen
  useEffect(() => {
    if (!enabled) return;
    try {
      const seenToasts = localStorage.getItem(STORAGE_KEY);
      const seenData = seenToasts ? JSON.parse(seenToasts) : {};
      setHasSeenToasts(Boolean(seenData[context]));
    } catch {
      // Ignore localStorage errors
      setHasSeenToasts(false);
    }
  }, [enabled, context]);

  // Mark toasts as seen in localStorage
  const markToastsAsSeen = useCallback(async () => {
    try {
      const seenToasts = localStorage.getItem(STORAGE_KEY);
      const seenData = seenToasts ? JSON.parse(seenToasts) : {};
      seenData[context] = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seenData));
      setHasSeenToasts(true);
    } catch {
      // Ignore errors when marking toasts as seen
    }
  }, [context]);

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
