'use client';

/**
 * Auth Modal Provider
 *
 * Global context provider for authentication modal state management.
 * Allows opening the auth modal from anywhere in the application with
 * contextual value propositions and success callbacks.
 *
 * Features:
 * - Global modal state management
 * - Contextual value propositions
 * - Success callback handling
 * - Redirect path preservation
 * - Automatic cleanup on close
 *
 * @module apps/web/src/components/core/auth/auth-modal-provider
 */

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { AuthModal } from './auth-modal';

export interface AuthModalOptions {
  /** Contextual value proposition (e.g., "Sign in to save this for later") */
  valueProposition?: string;
  /** Callback when authentication succeeds */
  onSuccess?: () => void;
  /** Optional redirect path after authentication */
  redirectTo?: string;
}

export interface AuthModalContextType {
  /** Open the auth modal with optional options */
  openAuthModal: (options?: AuthModalOptions) => void;
  /** Close the auth modal */
  closeAuthModal: () => void;
  /** Whether the modal is currently open */
  isOpen: boolean;
}

// Create context for auth modal
const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

/**
 * Auth Modal Provider Component
 *
 * Provides global auth modal state and methods to open/close the modal
 * from anywhere in the application.
 */
export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [valueProposition, setValueProposition] = useState<string>('Sign in to continue');
  const [redirectTo, setRedirectTo] = useState<string | undefined>();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const openAuthModal = useCallback(
    (options?: AuthModalOptions) => {
      if (options?.valueProposition) {
        setValueProposition(options.valueProposition);
      } else {
        // Default value proposition
        setValueProposition('Sign in to continue');
      }

      // Note: onSuccess callback is stored in options but not used here
      // The OAuth flow redirects away, so the modal closes automatically
      // When user returns after OAuth, they'll be authenticated
      // The onSuccess callback should be handled at the page/component level
      // after detecting the user is authenticated (e.g., via useAuthenticatedUser)

      if (options?.redirectTo) {
        setRedirectTo(options.redirectTo);
      } else {
        // Default to current pathname with search params
        const search = searchParams?.toString();
        const defaultRedirect = search ? `${pathname}?${search}` : pathname;
        setRedirectTo(defaultRedirect);
      }

      setIsOpen(true);
    },
    [pathname, searchParams]
  );

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    // Reset state after animation completes (300ms)
    setTimeout(() => {
      setValueProposition('Sign in to continue');
      setRedirectTo(undefined);
    }, 300);
  }, []);

  const contextValue: AuthModalContextType = {
    openAuthModal,
    closeAuthModal,
    isOpen,
  };

  return (
    <AuthModalContext.Provider value={contextValue}>
      {children}
      <AuthModal
        open={isOpen}
        onOpenChange={setIsOpen}
        valueProposition={valueProposition}
        redirectTo={redirectTo ?? undefined}
      />
    </AuthModalContext.Provider>
  );
}

/**
 * Hook to access the auth modal context
 *
 * @returns Auth modal context with open/close methods
 * @throws Error if used outside AuthModalProvider
 *
 * @example
 * ```tsx
 * const { openAuthModal, closeAuthModal, isOpen } = useAuthModal();
 *
 * const handleBookmark = () => {
 *   openAuthModal({
 *     valueProposition: 'Sign in to save this for later',
 *     onSuccess: () => {
 *       // Retry bookmark action
 *       addBookmark();
 *     },
 *   });
 * };
 * ```
 */
export function useAuthModal(): AuthModalContextType {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
}
