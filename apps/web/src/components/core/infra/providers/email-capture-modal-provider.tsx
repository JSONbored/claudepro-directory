/**
 * Post-Copy Email Modal Provider
 *
 * Global context for managing post-copy email capture modal state.
 * Ensures modal shows once per session and tracks user preferences.
 *
 * Features:
 * - Session-based modal display (once per session)
 * - localStorage persistence for dismissal tracking
 * - Context API for global state management
 * - Type-safe copy context tracking
 *
 * @module components/providers/post-copy-email-provider
 */

'use client';

import { type Database } from '@heyclaude/database-types';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { logClientInfo, logClientWarn, normalizeError } from '@heyclaude/web-runtime/logging/client';
import { ErrorBoundary } from '@heyclaude/web-runtime/ui';

import { NewsletterModal, type NewsletterModalProps } from '@/src/components/features/growth/newsletter/newsletter-modal';

/**
 * Modal context data structure
 */
interface ModalContext {
  category?: Database['public']['Enums']['content_category'];
  copyType: Database['public']['Enums']['copy_type'];
  referrer?: string;
  slug?: string;
}

/**
 * Context value interface
 */
interface PostCopyEmailContextValue {
  /**
   * Whether modal has been shown this session
   */
  hasShownThisSession: boolean;

  /**
   * Show the email capture modal
   */
  showModal: (context: ModalContext) => void;
}

/**
 * LocalStorage key for tracking dismissals
 */
const STORAGE_KEY = 'newsletter-modal-dismissed';

/**
 * Session storage key for tracking if shown this session
 */
const SESSION_KEY = 'newsletter-modal-shown';

/**
 * Create context with undefined default (must use provider)
 */
const PostCopyEmailContext = createContext<PostCopyEmailContextValue | undefined>(undefined);

/**
 * NewsletterModal wrapper with error handling
 * Catches render errors and closes modal gracefully
 */
function NewsletterModalWithErrorHandling({
  onError,
  onOpenChange,
  category,
  slug,
  ...props
}: NewsletterModalProps & { onError?: (error: Error) => void }) {
  // Wrap onOpenChange to also call onError handler if needed
  const handleOpenChange = useCallback((open: boolean) => {
    try {
      onOpenChange(open);
    } catch (error) {
      const normalized = normalizeError(error, 'NewsletterModal onOpenChange error');
      onError?.(normalized);
    }
  }, [onOpenChange, onError]);

  return (
    <NewsletterModal
      {...props}
      onOpenChange={handleOpenChange}
      {...(category && { category })}
      {...(slug && { slug })}
    />
  );
}

/**
 * Props for PostCopyEmailProvider
 */
interface PostCopyEmailProviderProps {
  children: ReactNode;
}

/**
 * Provider component for post-copy email modal
 *
 * Manages global modal state and user preference tracking.
 * Should be placed high in component tree (e.g., in root layout).
 *
 * @param props - Provider props
 * @returns Provider wrapper with modal
 *
 * @example
 * ```tsx
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <PostCopyEmailProvider>
 *           {children}
 *         </PostCopyEmailProvider>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function PostCopyEmailProvider({ children }: PostCopyEmailProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalContext, setModalContext] = useState<ModalContext | null>(null);
  const [hasShownThisSession, setHasShownThisSession] = useState(false);
  const [copyCount, setCopyCount] = useState(0);

  // DEBUG: Log all state changes
  useEffect(() => {
    logClientInfo(
      '[PostCopyEmailProvider] State changed',
      'PostCopyEmailProvider.stateChange',
      {
        component: 'PostCopyEmailProvider',
        action: 'state-change',
        category: 'newsletter',
        isOpen,
        hasModalContext: Boolean(modalContext),
        modalContext: modalContext ? {
          copyType: modalContext.copyType,
          category: modalContext.category,
          hasSlug: Boolean(modalContext.slug),
          hasReferrer: Boolean(modalContext.referrer),
        } : null,
        hasShownThisSession,
        copyCount,
      }
    );
  }, [isOpen, modalContext, hasShownThisSession, copyCount]);

  // Check if modal has been shown this session on mount
  useEffect(() => {
    const shown = sessionStorage.getItem(SESSION_KEY);
    const count = sessionStorage.getItem('copy-count');
    if (shown === 'true') {
      setHasShownThisSession(true);
    }
    if (count) {
      setCopyCount(Number.parseInt(count, 10));
    }
  }, []);

  // Exit-intent detection (mouse leaving viewport)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger on upward mouse movement (toward browser chrome)
      if (e.clientY <= 10 && !hasShownThisSession) {
        const dismissed = localStorage.getItem(STORAGE_KEY);
        if (dismissed === 'true') return;

        // Show modal with exit-intent context
        setModalContext({
          copyType: 'link',
          referrer: 'exit-intent',
        });
        setIsOpen(true);
        setHasShownThisSession(true);
        sessionStorage.setItem(SESSION_KEY, 'true');
      }
    };

    // Only attach listener on high-value pages (content pages, not homepage)
    if (globalThis.window !== undefined && globalThis.location.pathname.includes('/')) {
      document.addEventListener('mouseleave', handleMouseLeave);
      return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }
    return;
  }, [hasShownThisSession]);

  /**
   * Show modal with copy context
   * Triggers after 2nd copy to prove value first (reduce friction)
   */
  const showModal = useCallback(
    (context: ModalContext) => {
      // Increment copy count
      const newCount = copyCount + 1;
      setCopyCount(newCount);
      sessionStorage.setItem('copy-count', String(newCount));

      // Only show after 2nd copy action (user has proven interest)
      if (newCount < 2) {
        return;
      }

      // Don't show if already shown this session
      if (hasShownThisSession) {
        return;
      }

      // Check if user has dismissed permanently (localStorage)
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (dismissed === 'true') {
        return;
      }

      // Show modal and track in session
      // CRITICAL: Set context first, then open - ensures both are set together
      // Use functional updates to ensure state consistency
      setModalContext(context);
      // Use setTimeout to ensure context is set before opening (prevents race condition)
      // This ensures modalContext exists when Dialog renders
      setTimeout(() => {
        setIsOpen(true);
      }, 0);
      setHasShownThisSession(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
      
      logClientInfo(
        '[PostCopyEmailProvider] Modal triggered',
        'PostCopyEmailProvider.showModal',
        {
          component: 'PostCopyEmailProvider',
          action: 'show-modal-triggered',
          category: 'newsletter',
          copyType: context.copyType,
          hasCategory: Boolean(context.category),
          hasSlug: Boolean(context.slug),
          copyCount: newCount,
        }
      );
    },
    [hasShownThisSession, copyCount]
  );

  /**
   * Handle modal close
   */
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setModalContext(null);
    }
  }, []);

  // Safety: Ensure modal closes on unmount or if context is cleared
  // Use useLayoutEffect to run synchronously before paint (prevents backdrop flash)
  useLayoutEffect(() => {
    if (!modalContext && isOpen) {
      logClientWarn(
        '[PostCopyEmailProvider] Modal context cleared but isOpen=true, closing modal',
        normalizeError(new Error('Modal state mismatch'), 'Modal context cleared'),
        'PostCopyEmailProvider.safetyCheck',
        {
          component: 'PostCopyEmailProvider',
          action: 'modal-close-safety',
          category: 'newsletter',
          isOpen,
          hasModalContext: Boolean(modalContext),
        }
      );
      setIsOpen(false);
    }
  }, [modalContext, isOpen]);

  // Safety: Close modal on page unload to prevent stuck backdrop
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isOpen) {
        logClientInfo(
          '[PostCopyEmailProvider] Closing modal on beforeunload',
          'PostCopyEmailProvider.beforeUnload',
          {
            component: 'PostCopyEmailProvider',
            action: 'beforeunload-cleanup',
            category: 'newsletter',
          }
        );
        setIsOpen(false);
        setModalContext(null);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen]);

  // CRITICAL: Only render modal when BOTH conditions are met
  // This prevents backdrop from rendering without content
  const shouldRenderModal = Boolean(modalContext && isOpen);

  // Log render decision for debugging
  useEffect(() => {
    if (isOpen || modalContext) {
      logClientInfo(
        '[PostCopyEmailProvider] Render decision',
        'PostCopyEmailProvider.renderDecision',
        {
          component: 'PostCopyEmailProvider',
          action: 'render-decision',
          category: 'newsletter',
          isOpen,
          hasModalContext: Boolean(modalContext),
          shouldRenderModal,
        }
      );
    }
  }, [isOpen, modalContext, shouldRenderModal]);

  return (
    <PostCopyEmailContext.Provider value={{ showModal, hasShownThisSession }}>
      {children}
      {shouldRenderModal && modalContext ? (
        <ErrorBoundary>
          <NewsletterModalWithErrorHandling
            source="modal"
            open={isOpen}
            onOpenChange={(open) => {
              handleOpenChange(open);
              if (!open) {
                // Ensure cleanup on close
                setModalContext(null);
              }
            }}
            copyType={modalContext.copyType}
            {...(modalContext.category && { category: modalContext.category })}
            {...(modalContext.slug && { slug: modalContext.slug })}
            onError={(error) => {
              logClientWarn(
                '[PostCopyEmailProvider] NewsletterModal render error',
                normalizeError(error, 'NewsletterModal render failed'),
                'PostCopyEmailProvider.modalError',
                {
                  component: 'PostCopyEmailProvider',
                  action: 'modal-render-error',
                  category: 'newsletter',
                  errorMessage: error.message,
                  errorStack: error.stack,
                }
              );
              // Close modal on error to prevent stuck state
              setIsOpen(false);
              setModalContext(null);
            }}
          />
        </ErrorBoundary>
      ) : null}
    </PostCopyEmailContext.Provider>
  );
}

/**
 * Hook to access post-copy email modal context
 *
 * Must be used within PostCopyEmailProvider.
 *
 * @returns Context value with showModal function
 * @throws Error if used outside provider
 *
 * @example
 * ```tsx
 * function CopyButton() {
 *   const { showModal } = usePostCopyEmail();
 *
 *   const handleCopy = async () => {
 *     await copy(content);
 *     showModal({
 *       copyType: 'markdown',
 *       category: 'agents',
 *       slug: 'api-builder'
 *     });
 *   };
 * }
 * ```
 */
export function usePostCopyEmail(): PostCopyEmailContextValue {
  const context = useContext(PostCopyEmailContext);

  if (context === undefined) {
    throw new Error('usePostCopyEmail must be used within PostCopyEmailProvider');
  }

  return context;
}
