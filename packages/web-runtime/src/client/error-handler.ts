'use client';

import {
  generateRequestId,
  createWebAppContextWithId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';

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

export function createErrorBoundaryFallback(
  error: Error,
  errorInfo: { componentStack: string }
): ErrorResponse {
  try {
    const errorType = determineErrorType(error);
    const requestId = generateRequestId();
    const route = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
    const normalized = normalizeError(error, 'React error boundary triggered');
    
    // Create standardized log context
    const logContext = createWebAppContextWithId(requestId, route, 'ReactErrorBoundary', {
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
      requestId,
      ...(process.env['NODE_ENV'] === 'development' && error.stack && { stack: error.stack }),
    };
  } catch (fallbackError) {
    // Fallback error handling - still try to log
    const fallbackRequestId = generateRequestId();
    const normalized = normalizeError(fallbackError, 'Error boundary fallback failed');
    try {
      const logContext = createWebAppContextWithId(
        fallbackRequestId,
        typeof window !== 'undefined' ? window.location.pathname : 'unknown',
        'ReactErrorBoundary',
        {
          errorBoundary: true,
          fallbackError: true,
        }
      );
      logger.error('Error boundary fallback handler failed', normalized, logContext);
    } catch {
      // Last resort - if even logging fails, just return error response
    }
    return {
      success: false,
      error: 'Internal Error',
      message: 'An unexpected error occurred',
      code: 'INT_FALLBACK',
      timestamp: new Date().toISOString(),
      requestId: fallbackRequestId,
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
    return process.env['NODE_ENV'] !== 'development';
  }
  if (error.message.includes('umami') || error.message.includes('analytics')) {
    return false;
  }
  return true;
}
