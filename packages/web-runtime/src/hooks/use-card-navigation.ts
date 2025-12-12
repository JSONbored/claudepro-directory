'use client';

/**
 * Card Navigation Hook
 *
 * Provides standardized navigation behavior for interactive card components.
 * Handles click events, keyboard navigation, router transitions, and view transitions.
 *
 * Architecture:
 * - Next.js-specific (uses Next.js useRouter)
 * - Uses web-runtime view transitions utilities
 * - Client-side only (requires browser APIs)
 * - Structured error handling
 *
 * Features (Enhanced October 2025):
 * - View Transitions API support for smooth page morphing
 * - Progressive enhancement (works everywhere, enhanced where supported)
 * - Respects prefers-reduced-motion
 * - Keyboard navigation (Enter/Space)
 *
 * Usage:
 * ```tsx
 * import { useCardNavigation } from '@heyclaude/web-runtime/hooks';
 * import { useRouter } from 'next/navigation';
 *
 * const router = useRouter();
 * const { handleCardClick, handleKeyDown } = useCardNavigation({
 *   path: '/target/path',
 *   router,
 *   useViewTransitions: true, // Smooth card → detail morph
 * });
 *
 * <Card onClick={handleCardClick} onKeyDown={handleKeyDown} tabIndex={0}>
 * ```
 */

import { navigateWithTransition } from '../client/view-transitions.ts';
import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';
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

/**
 * Hook for card navigation with View Transitions support
 *
 * Provides standardized navigation handlers for interactive card components.
 * Supports both standard navigation and View Transitions API for smooth morphing.
 *
 * Architecture:
 * - Next.js-specific (uses Next.js useRouter internally)
 * - Uses web-runtime view transitions utilities
 * - Structured error logging
 *
 * @param pathOrOptions - Either a string path or options object
 * @returns Navigation event handlers
 */
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
    try {
      onBeforeNavigate?.();

      if (useViewTransitions) {
        navigateWithTransition(path, router);
      } else {
        router.push(path);
      }

      onAfterNavigate?.();
    } catch (error) {
      // Log navigation errors but don't crash
      const normalized = normalizeError(error, 'useCardNavigation: Navigation failed');
      logger.error({ err: normalized, hook: 'useCardNavigation',
        path,
        useViewTransitions, }, 'useCardNavigation: Navigation failed');
    }
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
      try {
        onBeforeNavigate?.();

        if (useViewTransitions) {
          navigateWithTransition(path, router);
        } else {
          router.push(path);
        }

        onAfterNavigate?.();
      } catch (error) {
        // Log navigation errors but don't crash
        const normalized = normalizeError(error, 'useCardNavigation: Action navigation failed');
        logger.error({ err: normalized, hook: 'useCardNavigation',
          path,
          useViewTransitions, }, 'useCardNavigation: Action navigation failed');
      }
    },
    [path, router, onBeforeNavigate, onAfterNavigate, useViewTransitions]
  );

  return {
    handleCardClick,
    handleKeyDown,
    handleActionClick,
  };
}
