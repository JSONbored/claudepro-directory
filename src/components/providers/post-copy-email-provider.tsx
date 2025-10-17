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

import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import {
  type CopyType,
  PostCopyEmailModal,
} from '@/src/components/features/growth/post-copy-email-modal';

/**
 * Modal context data structure
 */
interface ModalContext {
  copyType: CopyType;
  category?: string;
  slug?: string;
  referrer?: string;
}

/**
 * Context value interface
 */
interface PostCopyEmailContextValue {
  /**
   * Show the email capture modal
   */
  showModal: (context: ModalContext) => void;

  /**
   * Whether modal has been shown this session
   */
  hasShownThisSession: boolean;
}

/**
 * LocalStorage key for tracking dismissals
 */
const STORAGE_KEY = 'post-copy-email-modal-dismissed';

/**
 * Session storage key for tracking if shown this session
 */
const SESSION_KEY = 'post-copy-email-modal-shown';

/**
 * Create context with undefined default (must use provider)
 */
const PostCopyEmailContext = createContext<PostCopyEmailContextValue | undefined>(undefined);

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

  // Check if modal has been shown this session on mount
  useEffect(() => {
    const shown = sessionStorage.getItem(SESSION_KEY);
    if (shown === 'true') {
      setHasShownThisSession(true);
    }
  }, []);

  /**
   * Show modal with copy context
   */
  const showModal = useCallback(
    (context: ModalContext) => {
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
      setModalContext(context);
      setIsOpen(true);
      setHasShownThisSession(true);
      sessionStorage.setItem(SESSION_KEY, 'true');
    },
    [hasShownThisSession]
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

  return (
    <PostCopyEmailContext.Provider value={{ showModal, hasShownThisSession }}>
      {children}
      {modalContext && (
        <PostCopyEmailModal
          open={isOpen}
          onOpenChange={handleOpenChange}
          copyType={modalContext.copyType}
          {...(modalContext.category && { category: modalContext.category })}
          {...(modalContext.slug && { slug: modalContext.slug })}
          {...(modalContext.referrer && { referrer: modalContext.referrer })}
        />
      )}
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
