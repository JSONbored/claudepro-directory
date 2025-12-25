/**
 * Copy to Clipboard with Email Capture Hook
 *
 * Production-grade hook that combines clipboard functionality with post-copy email modal.
 * Extends useCopyToClipboard with integrated email capture modal triggering.
 *
 * Architecture:
 * - Composition over modification (wraps useCopyToClipboard)
 * - Type-safe copy context tracking
 * - Automatic modal triggering on successful copy
 * - Respects user preferences and session state
 *
 * @module hooks/use-copy-with-email-capture
 */

'use client';

import type { content_category, copy_type } from '@heyclaude/web-runtime/types/client-safe-enums';
import { type UseCopyToClipboardOptions } from '@heyclaude/web-runtime/hooks/use-copy-to-clipboard';
import { useCopyToClipboard } from '@heyclaude/web-runtime/hooks/use-copy-to-clipboard';
import { useCallback } from 'react';

/**
 * Email capture context for copy actions
 */
export interface EmailCaptureContext {
  /**
   * Content category (agents, mcp, etc.)
   */
  category?: content_category;

  /**
   * Type of content being copied
   */
  copyType: copy_type;

  /**
   * Referrer URL for attribution
   */
  referrer?: string;

  /**
   * Content slug identifier
   */
  slug?: string;
}

/**
 * Options for copy with email capture
 */
export interface UseCopyWithEmailCaptureOptions extends Omit<
  UseCopyToClipboardOptions,
  'onSuccess'
> {
  /**
   * Email capture context
   */
  emailContext: EmailCaptureContext;

  /**
   * Whether to enable email modal (default: true)
   */
  enableEmailModal?: boolean;

  /**
   * Custom success callback (called before modal trigger)
   */
  onSuccess?: () => void;
}

/**
 * Hook for copying with automatic email capture modal
 *
 * Combines clipboard functionality with post-copy email modal triggering.
 * Respects session state - modal only shows once per session.
 *
 * @param options - Configuration options
 * @returns Same interface as useCopyToClipboard
 *
 * @example
 * ```tsx
 * function CopyMarkdownButton({ category, slug }) {
 *   const { copied, copy } = useCopyWithEmailCapture({
 *     emailContext: {
 *       copyType: 'markdown',
 *       category,
 *       slug
 *     }
 *   });
 *
 *   return (
 *     <button onClick={() => copy(markdownContent)}>
 *       {copied ? 'Copied!' : 'Copy'}
 *     </button>
 *   );
 * }
 * ```
 */
export function useCopyWithEmailCapture(options: UseCopyWithEmailCaptureOptions) {
  const { emailContext, onSuccess, enableEmailModal = true, ...clipboardOptions } = options;

  // Wrap success callback (email modal removed)
  const handleSuccess = useCallback(() => {
    // Call user's onSuccess
    onSuccess?.();
  }, [onSuccess]);

  // Use standard clipboard hook with wrapped success handler
  return useCopyToClipboard({
    ...clipboardOptions,
    onSuccess: handleSuccess,
  });
}
