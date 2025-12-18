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

import { useCallback, useState } from 'react';
import { useLocalStorage } from '@heyclaude/web-runtime/hooks/use-local-storage';

interface OnboardingToast {
  delay?: number;
  duration?: number;
  id: string;
  message: string;
  title: string;
}

// Wizard toasts removed - wizard page has been deleted
// ONBOARDING_TOASTS removed - unused constant

const STORAGE_KEY = 'claudepro_onboarding_toasts_seen';

interface OnboardingToastsOptions {
  context?: 'general' | 'submit';
  customToasts?: OnboardingToast[];
  enabled?: boolean;
}

export function useOnboardingToasts({
  enabled = true,
  context = 'submit',
}: OnboardingToastsOptions = {}) {
  const [activeToasts] = useState<Set<string>>(new Set());

  // Use useLocalStorage for seen toasts data (stored as JSON object with context keys)
  const { value: seenData, setValue: setSeenData, removeValue: removeSeenData } = useLocalStorage<Record<string, boolean>>(
    STORAGE_KEY,
    {
      defaultValue: {},
      syncAcrossTabs: false,
    }
  );

  // Derive hasSeenToasts from seenData
  const hasSeenToasts = enabled ? Boolean(seenData[context]) : true;

  // Mark toasts as seen in localStorage
  const markToastsAsSeen = useCallback(() => {
    setSeenData((prev) => ({
      ...prev,
      [context]: true,
    }));
  }, [context, setSeenData]);

  // Reset toasts (for testing or user preference)
  const resetToasts = useCallback(() => {
    setSeenData((prev) => {
      const updated = { ...prev };
      delete updated[context];
      return updated;
    });
  }, [context, setSeenData]);

  // Reset all toasts across all contexts
  const resetAllToasts = useCallback(() => {
    removeSeenData();
  }, [removeSeenData]);

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
export const ONBOARDING_TOASTS_BY_CONTEXT: Record<string, OnboardingToast[]> = {
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
