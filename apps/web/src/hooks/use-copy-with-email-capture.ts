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

import type { Database } from '@heyclaude/database-types';
import type { UseCopyToClipboardOptions } from '@heyclaude/web-runtime/core';
import { useCopyToClipboard } from '@heyclaude/web-runtime/hooks';
import { useCallback } from 'react';
import { usePostCopyEmail } from '@/src/components/core/infra/providers/email-capture-modal-provider';

/**
 * Email capture context for copy actions
 */
export interface EmailCaptureContext {
  /**
   * Type of content being copied
   */
  copyType: Database['public']['Enums']['copy_type'];

  /**
   * Content category (agents, mcp, etc.)
   */
  category?: Database['public']['Enums']['content_category'];

  /**
   * Content slug identifier
   */
  slug?: string;

  /**
   * Referrer URL for attribution
   */
  referrer?: string;
}

/**
 * Options for copy with email capture
 */
export interface UseCopyWithEmailCaptureOptions
  extends Omit<UseCopyToClipboardOptions, 'onSuccess'> {
  /**
   * Email capture context
   */
  emailContext: EmailCaptureContext;

  /**
   * Custom success callback (called before modal trigger)
   */
  onSuccess?: () => void;

  /**
   * Whether to enable email modal (default: true)
   */
  enableEmailModal?: boolean;
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

  // Get modal context
  const { showModal } = usePostCopyEmail();

  // Wrap success callback to trigger modal
  const handleSuccess = useCallback(() => {
    // Call user's onSuccess first
    onSuccess?.();

    // Trigger email modal if enabled
    if (enableEmailModal) {
      showModal({
        copyType: emailContext.copyType,
        ...(emailContext.category && { category: emailContext.category }),
        ...(emailContext.slug && { slug: emailContext.slug }),
        ...(emailContext.referrer && { referrer: emailContext.referrer }),
      });
    }
  }, [onSuccess, enableEmailModal, showModal, emailContext]);

  // Use standard clipboard hook with wrapped success handler
  return useCopyToClipboard({
    ...clipboardOptions,
    onSuccess: handleSuccess,
  });
}
