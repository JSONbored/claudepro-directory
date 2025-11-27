'use client';

import { getTimeoutConfig } from '../config/static-configs.ts';
import { logger } from '../entries/core.ts';
import { useCallback, useEffect, useRef, useState } from 'react';

// Clipboard reset delay (loaded from static config)
let DEFAULT_CLIPBOARD_RESET_DELAY = 2000;

// Load config from static defaults on client mount (moved from module-level to prevent build-time execution)
// This will be initialized in useEffect on first hook usage

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
  const { onSuccess, onError, resetDelay = DEFAULT_CLIPBOARD_RESET_DELAY, context } = options;

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const configLoadedRef = useRef(false);

  // Load config from static defaults
  useEffect(() => {
    if (configLoadedRef.current) return;
    configLoadedRef.current = true;

    const config = getTimeoutConfig();
    DEFAULT_CLIPBOARD_RESET_DELAY = config['timeout.ui.clipboard_reset_delay_ms'];
  }, []);

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
      // OPTIMISTIC UI: Set copied immediately
      setCopied(true);
      setError(null);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      try {
        await navigator.clipboard.writeText(text);

        // Success - schedule reset
        timeoutRef.current = setTimeout(() => {
          setCopied(false);
          timeoutRef.current = null;
        }, resetDelay);

        onSuccess?.();
        return true;
      } catch (err) {
        // ROLLBACK on error
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
