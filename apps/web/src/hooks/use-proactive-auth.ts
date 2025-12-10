'use client';

/**
 * useProactiveAuth Hook
 *
 * Hook for proactive authentication checks before performing actions.
 * Automatically opens the auth modal if user is not authenticated,
 * then retries the action after successful authentication.
 *
 * Features:
 * - Automatic auth check before actions
 * - Contextual value propositions
 * - Action retry after successful auth
 * - Loading state handling
 *
 * @module apps/web/src/hooks/use-proactive-auth
 */

import { useAuthenticatedUser } from '@heyclaude/web-runtime/hooks';
import { useCallback } from 'react';

import { useAuthModal } from './use-auth-modal';

export interface UseProactiveAuthOptions {
  /** Contextual value proposition for auth modal */
  valueProposition?: string;
  /** Context name for logging */
  context?: string;
}

export interface UseProactiveAuthReturn {
  /** Current user (null if not authenticated) */
  user: ReturnType<typeof useAuthenticatedUser>['user'];
  /** Authentication status */
  status: ReturnType<typeof useAuthenticatedUser>['status'];
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth check is loading */
  isLoading: boolean;
  /** Require authentication before executing an action */
  requireAuth: (action: () => void | Promise<void>) => void;
}

/**
 * Hook for proactive authentication checks
 *
 * Automatically opens the auth modal if user is not authenticated,
 * then retries the action after successful authentication.
 *
 * @param options - Configuration options
 * @returns Auth state and requireAuth function
 *
 * @example
 * ```tsx
 * const { requireAuth, isAuthenticated } = useProactiveAuth({
 *   valueProposition: 'Sign in to bookmark this',
 *   context: 'BookmarkButton',
 * });
 *
 * const handleBookmark = () => {
 *   requireAuth(async () => {
 *     await addBookmark(itemId);
 *     toasts.success.bookmarked();
 *   });
 * };
 * ```
 */
export function useProactiveAuth(
  options?: UseProactiveAuthOptions
): UseProactiveAuthReturn {
  const { user, status } = useAuthenticatedUser({
    context: options?.context || 'ProactiveAuth',
  });
  const { openAuthModal } = useAuthModal();

  const requireAuth = useCallback(
    (action: () => void | Promise<void>) => {
      // Wait for auth check to complete
      if (status === 'loading') {
        return;
      }

      // If not authenticated, open auth modal
      if (!user) {
        openAuthModal({
          valueProposition: options?.valueProposition || 'Sign in to continue',
          onSuccess: () => {
            // Retry the action after successful auth
            // Note: User will be authenticated after OAuth redirect,
            // so this will be called after the redirect completes
            action();
          },
        });
        return;
      }

      // User is authenticated, proceed with action
      action();
    },
    [user, status, openAuthModal, options?.valueProposition]
  );

  return {
    user,
    status,
    isAuthenticated: !!user,
    isLoading: status === 'loading',
    requireAuth,
  };
}
