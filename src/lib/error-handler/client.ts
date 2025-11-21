/**
 * Client-Safe Error Handler Utilities
 */

import { randomUUID } from 'node:crypto';
import { logger } from '@/src/lib/logger';
import { normalizeError } from '@/src/lib/utils/error.utils';

const isDevelopment = process.env.NODE_ENV === 'development';

type ErrorContext = Record<string, string | number | boolean>;

type ErrorResponse = {
  success: false;
  error: string;
  message: string;
  code: string;
  timestamp: string;
  requestId?: string;
  stack?: string;
};

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

function validateErrorContext(ctx: unknown): ErrorContext {
  if (!ctx || typeof ctx !== 'object') return {};
  const result: ErrorContext = {};
  for (const [k, v] of Object.entries(ctx as Record<string, unknown>)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      result[k] = v;
    }
  }
  return result;
}

export function createErrorBoundaryFallback(
  error: Error,
  errorInfo: { componentStack: string }
): ErrorResponse {
  const startTime = performance.now();

  try {
    const errorType = determineErrorType(error);
    const requestId = randomUUID();

    const baseContext: ErrorContext = {
      route: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      operation: 'react_render',
      method: 'unknown',
      errorType,
      timestamp: new Date().toISOString(),
    };

    const fullContext = validateErrorContext({
      ...baseContext,
      requestId,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      processingTime: `${(performance.now() - startTime).toFixed(2)}ms`,
    });

    const normalized = normalizeError(
      error,
      `Error Boundary: ${error.name || 'Unknown'}: ${error.message}`
    );
    logger.error(
      `Error Boundary: ${error.name || 'Unknown'}: ${error.message}`,
      normalized,
      fullContext
    );

    const errorResponse: ErrorResponse = {
      success: false,
      error: error.name || 'React Error',
      message: error.message || 'An error occurred during rendering',
      code: generateErrorCode(errorType),
      timestamp: new Date().toISOString(),
      requestId,
      ...(isDevelopment && error.stack && { stack: error.stack }),
    };

    return errorResponse;
  } catch (handlerError) {
    const normalized = normalizeError(handlerError, 'Error boundary fallback failed');
    logger.error('Error boundary fallback failed', normalized, {
      originalError: error.message,
    });

    return {
      success: false,
      error: 'Internal Error',
      message: 'An unexpected error occurred',
      code: 'INT_FALLBACK',
      timestamp: new Date().toISOString(),
      requestId: randomUUID(),
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
