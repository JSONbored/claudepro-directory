'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';

export interface UseExitIntentOptions {
  /**
   * Enable/disable the exit intent detection
   * @default true
   */
  enabled?: boolean;

  /**
   * Sensitivity threshold for mouse movement detection (pixels from top)
   * Lower value = triggers sooner when mouse moves toward browser chrome
   * @default 20
   */
  sensitivity?: number;

  /**
   * Delay before the hook can trigger again (milliseconds)
   * Prevents repeated triggers if user moves mouse in/out
   * @default 3000
   */
  triggerDelay?: number;

  /**
   * Only trigger on desktop devices
   * Mobile users don't have mouse exit intent behavior
   * @default true
   */
  desktopOnly?: boolean;

  /**
   * Cookie/localStorage key to track if user has seen the intent
   * Set to null to always trigger (no persistence)
   * @default 'exit-intent-shown'
   */
  cookieKey?: string | null;

  /**
   * How long to remember that user has seen the intent (milliseconds)
   * @default 86400000 (24 hours)
   */
  cookieDuration?: number;

  /**
   * Callback when exit intent is detected
   */
  onExitIntent?: () => void;
}

export interface UseExitIntentReturn {
  /**
   * Whether exit intent has been triggered
   */
  isTriggered: boolean;

  /**
   * Manually trigger the exit intent
   */
  trigger: () => void;

  /**
   * Reset the trigger state and allow it to fire again
   */
  reset: () => void;

  /**
   * Dismiss and mark as shown (won't trigger again for cookieDuration)
   */
  dismiss: () => void;
}

/**
 * Hook to detect when user is about to leave the page (exit intent)
 * Triggers when mouse moves toward browser chrome (top of viewport)
 * Database-First: Loads default config from app_settings
 *
 * @example
 * ```tsx
 * const { isTriggered, dismiss } = useExitIntent({
 *   onExitIntent: () => trackEvent('exit_intent_shown'),
 *   sensitivity: 20,
 *   triggerDelay: 3000,
 * });
 *
 * if (isTriggered) {
 *   return <ExitIntentModal onClose={dismiss} />;
 * }
 * ```
 */
export function useExitIntent(options: UseExitIntentOptions = {}): UseExitIntentReturn {
  // Hardcoded fallbacks (loaded from app_settings at mount)
  const [dbDefaults, setDbDefaults] = useState({
    enabled: true,
    sensitivity: 20,
    triggerDelay: 3000,
    desktopOnly: true,
    cookieKey: 'exit-intent-shown',
    cookieDuration: 86400000,
  });

  // Load app_settings on mount (background, non-blocking)
  useEffect(() => {
    const loadDefaults = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.rpc('get_app_settings', {
          p_category: 'hooks',
        });

        if (data) {
          const settings = data as Record<string, { value: unknown }>;

          setDbDefaults({
            enabled: (settings['hooks.exit_intent.enabled']?.value as boolean) ?? true,
            sensitivity: (settings['hooks.exit_intent.sensitivity']?.value as number) ?? 20,
            triggerDelay: (settings['hooks.exit_intent.trigger_delay']?.value as number) ?? 3000,
            desktopOnly: (settings['hooks.exit_intent.desktop_only']?.value as boolean) ?? true,
            cookieKey:
              (settings['hooks.exit_intent.cookie_key']?.value as string) ?? 'exit-intent-shown',
            cookieDuration:
              (settings['hooks.exit_intent.cookie_duration']?.value as number) ?? 86400000,
          });
        }
      } catch {
        // Silent fail - uses hardcoded fallbacks
      }
    };

    loadDefaults().catch(() => {
      // Silent fail - uses hardcoded fallbacks
    });
  }, []);

  // Merge user options with database defaults (user options take precedence)
  const {
    enabled = dbDefaults.enabled,
    sensitivity = dbDefaults.sensitivity,
    triggerDelay = dbDefaults.triggerDelay,
    desktopOnly = dbDefaults.desktopOnly,
    cookieKey = dbDefaults.cookieKey,
    cookieDuration = dbDefaults.cookieDuration,
    onExitIntent,
  } = options;

  const [isTriggered, setIsTriggered] = useState(false);
  const lastTriggerTime = useRef<number>(0);
  const hasShownRef = useRef(false);

  // Check if user has already seen the exit intent
  const hasSeenExitIntent = useCallback((): boolean => {
    if (!cookieKey) return false;

    try {
      const stored = localStorage.getItem(cookieKey);
      if (!stored) return false;

      const timestamp = Number.parseInt(stored, 10);
      if (Number.isNaN(timestamp)) return false;

      // Check if cookie has expired
      const now = Date.now();
      return now - timestamp < cookieDuration;
    } catch {
      return false;
    }
  }, [cookieKey, cookieDuration]);

  // Mark as shown in localStorage
  const markAsShown = useCallback(() => {
    if (!cookieKey) return;

    try {
      localStorage.setItem(cookieKey, Date.now().toString());
      hasShownRef.current = true;
    } catch {
      // LocalStorage may be unavailable (private browsing, etc)
      hasShownRef.current = true;
    }
  }, [cookieKey]);

  // Check if device is desktop
  const isDesktop = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    // Simple desktop detection - can be enhanced with user agent parsing
    return window.innerWidth >= 1024;
  }, []);

  // Trigger exit intent
  const trigger = useCallback(() => {
    if (!enabled) return;
    if (hasShownRef.current || hasSeenExitIntent()) return;

    const now = Date.now();
    if (now - lastTriggerTime.current < triggerDelay) return;

    lastTriggerTime.current = now;
    setIsTriggered(true);
    onExitIntent?.();
  }, [enabled, triggerDelay, hasSeenExitIntent, onExitIntent]);

  // Reset trigger state (allows it to fire again in same session)
  const reset = useCallback(() => {
    setIsTriggered(false);
    lastTriggerTime.current = 0;
  }, []);

  // Dismiss and mark as shown (won't trigger again for cookieDuration)
  const dismiss = useCallback(() => {
    setIsTriggered(false);
    markAsShown();
  }, [markAsShown]);

  // Exit intent detection via mouse movement
  useEffect(() => {
    if (!enabled) return;
    if (desktopOnly && !isDesktop()) return;
    if (hasShownRef.current || hasSeenExitIntent()) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves to top of viewport (toward browser chrome)
      if (e.clientY <= sensitivity) {
        trigger();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, sensitivity, desktopOnly, isDesktop, hasSeenExitIntent, trigger]);

  return {
    isTriggered,
    trigger,
    reset,
    dismiss,
  };
}
