'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TIME_CONSTANTS } from '@/lib/constants';
import { logger } from '@/lib/logger';

export interface UseCopyToClipboardOptions {
  /**
   * Callback to execute on successful copy
   */
  onSuccess?: () => void;
  /**
   * Callback to execute on copy error
   */
  onError?: (error: Error) => void;
  /**
   * Duration in milliseconds before resetting copied state
   * @default 2000
   */
  resetDelay?: number;
  /**
   * Context information for error logging
   */
  context?: {
    component?: string;
    action?: string;
  };
}

export interface UseCopyToClipboardReturn {
  /**
   * Current copied state
   */
  copied: boolean;
  /**
   * Function to copy text to clipboard
   */
  copy: (text: string) => Promise<boolean>;
  /**
   * Error object if copy failed
   */
  error: Error | null;
  /**
   * Reset copied state manually
   */
  reset: () => void;
}

/**
 * React hook for copying text to clipboard with state management
 *
 * @example
 * ```tsx
 * const { copied, copy } = useCopyToClipboard({ resetDelay: 2000 });
 *
 * <button onClick={() => copy('Hello World')}>
 *   {copied ? 'Copied!' : 'Copy'}
 * </button>
 * ```
 *
 * @param options - Configuration options
 * @returns Object with copy function and state
 */
export function useCopyToClipboard(
  options: UseCopyToClipboardOptions = {}
): UseCopyToClipboardReturn {
  const { onSuccess, onError, resetDelay = 2 * TIME_CONSTANTS.SECOND, context } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        // Clear any existing timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        await navigator.clipboard.writeText(text);

        setCopied(true);
        setError(null);

        // Reset after delay
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, resetDelay);

        onSuccess?.();
        return true;
      } catch (err) {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj);
        setCopied(false);

        logger.error('Failed to copy to clipboard', errorObj, {
          component: context?.component || 'useCopyToClipboard',
          action: context?.action || 'copy',
          textLength: text.length,
        });

        onError?.(errorObj);
        return false;
      }
    },
    [resetDelay, onSuccess, onError, context]
  );

  return { copied, copy, error, reset };
}
