'use client';

import { isDevelopment } from '@heyclaude/shared-runtime/schemas/env';

import {
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { createWebAppContextWithIdClient } from '@heyclaude/web-runtime/logging/client';

type ErrorResponse = {
  success: false;
  error: string;
  message: string;
  code: string;
  timestamp: string;
  stack?: string;
};

/**
 * Classifies an arbitrary error value into a standardized error type string.
 *
 * @param error - The value to classify; may be any value (not necessarily an `Error`).
 * @returns `'ValidationError'`, `'DatabaseError'`, `'AuthenticationError'`, `'NotFoundError'`, or `'InternalServerError'` indicating the determined error category.
 */
function determineErrorType(error: unknown): string {
  if (!(error instanceof Error)) return 'InternalServerError';
  const name = error.name.toLowerCase();
  const msg = error.message.toLowerCase();
  if (name.includes('validation') || msg.includes('validation')) return 'ValidationError';
  if (name.includes('database') || msg.includes('database')) return 'DatabaseError';
  if (name.includes('auth') && msg.includes('auth')) return 'AuthenticationError';
  if (msg.includes('not found') || name.includes('notfound')) return 'NotFoundError';
  return 'InternalServerError';
}

/**
 * Build a standardized ErrorResponse for a React error boundary and record a client-safe structured log entry.
 *
 * @param error - The Error instance caught by the React error boundary
 * @param errorInfo - The React error boundary info object; expects a `componentStack` string
 * @returns An ErrorResponse containing `success: false`, `error`, `message`, `code`, `timestamp`, and, when available in development, `stack`
 */
export function createErrorBoundaryFallback(
  error: Error,
  errorInfo: { componentStack: string }
): ErrorResponse {
  try {
    const errorType = determineErrorType(error);
    const route = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
    const normalized = normalizeError(error, 'React error boundary triggered');
    
    // Create standardized log context (client-safe version)
    const logContext = createWebAppContextWithIdClient(route, 'ReactErrorBoundary', {
      errorType,
      componentStack: errorInfo.componentStack || '',
      errorBoundary: true,
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent || '' : '',
      url: typeof window !== 'undefined' ? window.location?.href || '' : '',
    });
    
    // Use structured logging instead of console.error
    logger.error('React error boundary caught error', normalized, logContext);
    
    return {
      success: false,
      error: error.name || 'React Error',
      message: error.message || 'An error occurred during rendering',
      code: generateErrorCode(errorType),
      timestamp: new Date().toISOString(),
      ...(isDevelopment && error.stack && { stack: error.stack }),
    };
  } catch (fallbackError) {
    // Fallback error handling - still try to log
    const normalized = normalizeError(fallbackError, 'Error boundary fallback failed');
    try {
      const logContext = createWebAppContextWithIdClient(
        typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        'ReactErrorBoundary',
        {
          errorBoundary: true,
          fallbackError: true,
        }
      );
      logger.error('Error boundary fallback handler failed', normalized, logContext, undefined);
    } catch {
      // Last resort - if even logging fails, just return error response
    }
    return {
      success: false,
      error: 'Internal Error',
      message: 'An unexpected error occurred',
      code: 'INT_FALLBACK',
      timestamp: new Date().toISOString(),
    };
  }
}

function generateErrorCode(errorType: string): string {
  const typeCode = errorType.replace('Error', '').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${typeCode.slice(0, 3)}_${timestamp.slice(-8)}`;
}

export function formatErrorForDisplay(error: Error | unknown): string {
  if (error instanceof Error) {
    return error.message || 'An unexpected error occurred';
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Determines whether an error should be reported to logging/monitoring.
 *
 * Evaluates the provided value and returns `true` when it should be reported:
 * non-Error values are not reported; errors whose messages mention "umami" or "analytics" are not reported;
 * errors mentioning "hydration" or "HMR" are reported only outside of development.
 *
 * @param error - The value to evaluate; only `Error` instances are considered reportable
 * @returns `true` if the error should be reported, `false` otherwise
 */
export function shouldReportError(error: Error | unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.message.includes('hydration') || error.message.includes('HMR')) {
    return !isDevelopment;
  }
  if (error.message.includes('umami') || error.message.includes('analytics')) {
    return false;
  }
  return true;
}