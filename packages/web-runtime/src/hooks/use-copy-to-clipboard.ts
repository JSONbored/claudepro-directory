'use client';

import { getTimeoutConfig } from '../config/static-configs.ts';
import { logger, normalizeError } from '../entries/core.ts';
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
        const normalized = normalizeError(err, 'Failed to copy to clipboard');
        setError(normalized);
        setCopied(false);

        logger.warn({ err: normalized,
          category: 'clipboard',
          component: context?.component ?? 'useCopyToClipboard',
          recoverable: true,
          userRetryable: true,
          action: context?.action ?? 'copy',
          textLength: text.length, }, '[Clipboard] Copy failed');

        onError?.(normalized);
        return false;
      }
    },
    [resetDelay, onSuccess, onError, context]
  );

  return { copied, copy, error, reset };
}

// =============================================================================
// useButtonSuccess - Temporary success state for buttons
// =============================================================================

/**
 * Options for useButtonSuccess hook
 */
export interface UseButtonSuccessOptions {
  /**
   * Duration in milliseconds before resetting success state
   * @default Loaded from config, falls back to 2000ms
   */
  duration?: number;
}

/**
 * Return type for useButtonSuccess hook
 */
export interface UseButtonSuccessReturn {
  /** Whether the button is currently showing success state */
  isSuccess: boolean;
  /** Trigger the success state (will auto-reset after duration) */
  triggerSuccess: () => void;
  /** Manually reset the success state */
  reset: () => void;
}

/**
 * React hook for managing temporary button success state with auto-reset.
 *
 * Useful for showing feedback after successful actions like form submissions,
 * copy operations, or bookmark toggles.
 *
 * @example
 * ```tsx
 * const { isSuccess, triggerSuccess } = useButtonSuccess({ duration: 2000 });
 *
 * const handleSave = async () => {
 *   await saveData();
 *   triggerSuccess();
 * };
 *
 * return (
 *   <Button onClick={handleSave}>
 *     {isSuccess ? <Check /> : 'Save'}
 *   </Button>
 * );
 * ```
 *
 * @param options - Configuration options
 * @returns Object with success state and trigger functions
 */
export function useButtonSuccess(options: UseButtonSuccessOptions = {}): UseButtonSuccessReturn {
  const { duration } = options;

  // Load config synchronously per hook instance (static config, no async needed)
  const defaultDuration = (() => {
    try {
      const config = getTimeoutConfig();
      return config['timeout.ui.button_success_duration_ms'] ?? 2000;
    } catch {
      return 2000; // Safe fallback
    }
  })();

  const actualDuration = duration ?? defaultDuration;
  const [isSuccess, setIsSuccess] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const triggerSuccess = useCallback(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setIsSuccess(true);
    timeoutRef.current = setTimeout(() => {
      setIsSuccess(false);
      timeoutRef.current = null;
    }, actualDuration);
  }, [actualDuration]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsSuccess(false);
  }, []);

  return { isSuccess, triggerSuccess, reset };
}
