'use client';

import { useCallback } from 'react';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

type ContextValue = string | number | boolean;
type ContextInput = Record<string, ContextValue | undefined> | undefined;

export interface UseLoggedAsyncOptions {
  scope: string;
  /**
   * Default log message when none is supplied for a run invocation.
   */
  defaultMessage?: string;
  /**
   * Default severity to use when logging.
   * @default 'error'
   */
  defaultLevel?: 'warn' | 'error';
  /**
   * Whether caught errors should be rethrown by default.
   * @default true
   */
  defaultRethrow?: boolean;
  /**
   * Optional callback invoked with the normalized error.
   */
  onError?: (error: Error) => void;
}

interface RunOptions {
  /**
   * Override the default message for this run.
   */
  message?: string;
  /**
   * Structured context to include in the log entry.
   */
  context?: ContextInput;
  /**
   * Override the default severity for this run.
   */
  level?: 'warn' | 'error';
  /**
   * Override rethrow behavior for this run.
   */
  rethrow?: boolean;
}

type LoggedAsyncRunner = <T>(
  operation: () => Promise<T>,
  options?: RunOptions
) => Promise<T | undefined>;

function sanitizeContext(context: ContextInput): Record<string, ContextValue> | undefined {
  if (!context) {
    return undefined;
  }

  const entries = Object.entries(context).filter(
    (entry): entry is [string, ContextValue] => entry[1] !== undefined
  );

  if (entries.length === 0) {
    return undefined;
  }

  return Object.fromEntries(entries);
}

/**
 * useLoggedAsync
 *
 * Provides a memoized helper for running async operations with consistent logging,
 * error normalization, and optional rethrow behavior.
 */
export function useLoggedAsync({
  scope,
  defaultMessage = 'Async operation failed',
  defaultLevel = 'error',
  defaultRethrow = true,
  onError,
}: UseLoggedAsyncOptions): LoggedAsyncRunner {
  return useCallback(
    async <T>(operation: () => Promise<T>, options?: RunOptions) => {
      const { message, context, level, rethrow } = options ?? {};
      try {
        return await operation();
      } catch (error) {
        const normalized = normalizeError(error, message ?? defaultMessage);
        const sanitizedContext = sanitizeContext(context);
        const logLabel = `[${scope}] ${message ?? defaultMessage}`;
        const severity = level ?? defaultLevel;

        if (severity === 'warn') {
          logger.warn(logLabel, sanitizedContext, { error: normalized.message });
        } else {
          logger.error(logLabel, normalized, sanitizedContext);
        }

        onError?.(normalized);

        if (rethrow ?? defaultRethrow) {
          throw normalized;
        }

        return undefined;
      }
    },
    [defaultLevel, defaultMessage, defaultRethrow, onError, scope]
  );
}
