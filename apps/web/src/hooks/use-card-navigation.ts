/**
 * Card Navigation Hook
 *
 * Provides standardized navigation behavior for interactive card components.
 * Handles click events, keyboard navigation, router transitions, and view transitions.
 *
 * Features (Enhanced October 2025):
 * - View Transitions API support for smooth page morphing
 * - Progressive enhancement (works everywhere, enhanced where supported)
 * - Respects prefers-reduced-motion
 * - Keyboard navigation (Enter/Space)
 *
 * Usage:
 * ```tsx
 * const { handleCardClick, handleKeyDown } = useCardNavigation({
 *   path: '/target/path',
 *   useViewTransitions: true, // Smooth card → detail morph
 * });
 * <Card onClick={handleCardClick} onKeyDown={handleKeyDown} tabIndex={0}>
 * ```
 */

import { navigateWithTransition } from '@heyclaude/web-runtime/client';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export interface UseCardNavigationOptions {
  /** Target path for navigation */
  path: string;
  /** Optional callback before navigation */
  onBeforeNavigate?: (() => void) | undefined;
  /** Optional callback after navigation is initiated */
  onAfterNavigate?: (() => void) | undefined;
  /**
   * Enable View Transitions API for smooth page morphing
   * Progressive enhancement - works everywhere, enhanced where supported
   * @default false
   */
  useViewTransitions?: boolean | undefined;
}

export function useCardNavigation(pathOrOptions: string | UseCardNavigationOptions) {
  const router = useRouter();

  // Normalize options
  const options: UseCardNavigationOptions =
    typeof pathOrOptions === 'string' ? { path: pathOrOptions } : pathOrOptions;

  const { path, onBeforeNavigate, onAfterNavigate, useViewTransitions = false } = options;

  /**
   * Handle card click - navigates to target path
   * Uses View Transitions API if enabled and supported
   */
  const handleCardClick = useCallback(() => {
    onBeforeNavigate?.();

    if (useViewTransitions) {
      navigateWithTransition(path, router);
    } else {
      router.push(path);
    }

    onAfterNavigate?.();
  }, [path, router, onBeforeNavigate, onAfterNavigate, useViewTransitions]);

  /**
   * Handle keyboard navigation - Enter or Space key triggers navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleCardClick();
      }
    },
    [handleCardClick]
  );

  /**
   * Handle action button click - navigates without card click propagation
   */
  const handleActionClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onBeforeNavigate?.();

      if (useViewTransitions) {
        navigateWithTransition(path, router);
      } else {
        router.push(path);
      }

      onAfterNavigate?.();
    },
    [path, router, onBeforeNavigate, onAfterNavigate, useViewTransitions]
  );

  return {
    handleCardClick,
    handleKeyDown,
    handleActionClick,
  };
}
