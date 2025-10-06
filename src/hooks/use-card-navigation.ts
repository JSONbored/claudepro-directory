/**
 * Card Navigation Hook
 *
 * Provides standardized navigation behavior for interactive card components.
 * Handles click events, keyboard navigation, and router transitions.
 *
 * Usage:
 * ```tsx
 * const { handleCardClick, handleKeyDown } = useCardNavigation('/target/path');
 * <Card onClick={handleCardClick} onKeyDown={handleKeyDown} tabIndex={0}>
 * ```
 */

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export interface UseCardNavigationOptions {
  /** Target path for navigation */
  path: string;
  /** Optional callback before navigation */
  onBeforeNavigate?: () => void;
  /** Optional callback after navigation is initiated */
  onAfterNavigate?: () => void;
}

export function useCardNavigation(
  pathOrOptions: string | UseCardNavigationOptions,
) {
  const router = useRouter();

  // Normalize options
  const options: UseCardNavigationOptions =
    typeof pathOrOptions === "string" ? { path: pathOrOptions } : pathOrOptions;

  const { path, onBeforeNavigate, onAfterNavigate } = options;

  /**
   * Handle card click - navigates to target path
   */
  const handleCardClick = useCallback(() => {
    onBeforeNavigate?.();
    router.push(path);
    onAfterNavigate?.();
  }, [path, router, onBeforeNavigate, onAfterNavigate]);

  /**
   * Handle keyboard navigation - Enter or Space key triggers navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleCardClick();
      }
    },
    [handleCardClick],
  );

  /**
   * Handle action button click - navigates without card click propagation
   */
  const handleActionClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onBeforeNavigate?.();
      router.push(path);
      onAfterNavigate?.();
    },
    [path, router, onBeforeNavigate, onAfterNavigate],
  );

  return {
    handleCardClick,
    handleKeyDown,
    handleActionClick,
  };
}
