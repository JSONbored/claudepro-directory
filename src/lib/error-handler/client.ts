/**
 * Client-Safe Error Handler Utilities
 *
 * This module contains error handling utilities that are safe to use in client components.
 * It does NOT import any server-only code (Redis, node:crypto, node:zlib, etc.).
 *
 * **Bundle Optimization:**
 * - Zero server dependencies = no webpack fallback needed
 * - Lightweight client bundle (< 5KB)
 * - Tree-shakeable exports
 *
 * @see {@link src/lib/error-handler.ts} - Full error handler with server utilities
 */

import { createRequestId } from '@/src/lib/schemas/branded-types.schema';
import {
  determineErrorType,
  type ErrorContext,
  type ErrorResponse,
  validateErrorContext,
} from '@/src/lib/schemas/error.schema';

// Client-safe environment check - doesn't trigger server env validation
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Minimal logger for client-side error handling
 * Avoids importing the full logger which may have server dependencies
 */
const clientLogger = {
  error: (message: string, error: Error, context?: Record<string, unknown>) => {
    if (isDevelopment) {
      console.error(`[Error Handler] ${message}`, {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        context,
      });
    }
  },
};

/**
 * Handle errors in React Error Boundaries (client-side only)
 *
 * This is a lightweight version of the server-side error handler,
 * designed specifically for client components.
 *
 * @param error - The error thrown by a React component
 * @param errorInfo - Component stack information from React
 * @returns Structured error response for logging and analytics
 *
 * @example
 * ```tsx
 * function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
 *   const errorResponse = createErrorBoundaryFallback(error, {
 *     componentStack: errorInfo.componentStack || '',
 *   });
 *
 *   // Use errorResponse for analytics tracking
 *   window.umami?.track('error_boundary_triggered', {
 *     request_id: errorResponse.requestId,
 *     error_type: error.name,
 *   });
 *
 *   return <div>Error UI...</div>;
 * }
 * ```
 */
export function createErrorBoundaryFallback(
  error: Error,
  errorInfo: { componentStack: string }
): ErrorResponse {
  const startTime = performance.now();

  try {
    // Determine error type for context
    const errorType = determineErrorType(error);

    // Generate request ID for correlation
    const requestId = createRequestId();

    // Create error context
    const baseContext: ErrorContext = {
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      operation: 'react_render',
      method: 'unknown',
      errorType,
      timestamp: new Date().toISOString(),
    };

    // Merge with component stack info
    const fullContext = validateErrorContext({
      ...baseContext,
      requestId,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      processingTime: `${(performance.now() - startTime).toFixed(2)}ms`,
    });

    // Log error (client-side console in development)
    clientLogger.error(
      `Error Boundary: ${error.name || 'Unknown'}: ${error.message}`,
      error,
      fullContext
    );

    // Return structured error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: error.name || 'React Error',
      message: error.message || 'An error occurred during rendering',
      code: generateErrorCode(errorType),
      timestamp: new Date().toISOString(),
      requestId,
      // Include stack in development only
      ...(isDevelopment && error.stack && { stack: error.stack }),
    };

    return errorResponse;
  } catch (handlerError) {
    // Fallback if error handler itself fails
    const fallbackError = handlerError instanceof Error ? handlerError : new Error('Unknown error');
    clientLogger.error('Error boundary fallback failed', fallbackError, {
      originalError: error.message,
    });

    return {
      success: false,
      error: 'Internal Error',
      message: 'An unexpected error occurred',
      code: 'INT_FALLBACK',
      timestamp: new Date().toISOString(),
      requestId: createRequestId(),
    };
  }
}

/**
 * Generate structured error codes (client-side version)
 */
function generateErrorCode(errorType: string): string {
  const typeCode = errorType.replace('Error', '').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${typeCode.slice(0, 3)}_${timestamp.slice(-8)}`;
}

/**
 * Client-safe error formatter for display in UI
 *
 * @param error - Error to format
 * @returns User-friendly error message
 */
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
 * Check if error should be reported to analytics
 *
 * @param error - Error to check
 * @returns true if error should be tracked
 */
export function shouldReportError(error: Error | unknown): boolean {
  if (!(error instanceof Error)) return false;

  // Don't report development-only errors
  if (error.message.includes('hydration') || error.message.includes('HMR')) {
    return !isDevelopment;
  }

  // Don't report network errors from ad blockers or extensions
  if (error.message.includes('umami') || error.message.includes('analytics')) {
    return false;
  }

  return true;
}
