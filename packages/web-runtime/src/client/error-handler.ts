'use client';

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

function randomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

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
  try {
    const errorType = determineErrorType(error);
    const requestId = randomId();
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
    });
    console.error('Error Boundary', {
      ...fullContext,
      message: error.message,
    });
    return {
      success: false,
      error: error.name || 'React Error',
      message: error.message || 'An error occurred during rendering',
      code: generateErrorCode(errorType),
      timestamp: new Date().toISOString(),
      requestId,
      ...(process.env['NODE_ENV'] === 'development' && error.stack && { stack: error.stack }),
    };
  } catch {
    return {
      success: false,
      error: 'Internal Error',
      message: 'An unexpected error occurred',
      code: 'INT_FALLBACK',
      timestamp: new Date().toISOString(),
      requestId: randomId(),
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
