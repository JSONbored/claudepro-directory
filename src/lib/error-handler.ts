/**
 * Error & Response Handling - Centralized error formatting, success responses, cache headers
 */

import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isDevelopment, isProduction } from '@/src/lib/env-client';
import { logger } from '@/src/lib/logger';
import { ValidationError } from '@/src/lib/security/validators';

type ErrorType =
  | 'ValidationError'
  | 'DatabaseError'
  | 'AuthenticationError'
  | 'AuthorizationError'
  | 'NotFoundError'
  | 'RateLimitError'
  | 'NetworkError'
  | 'FileSystemError'
  | 'ConfigurationError'
  | 'TimeoutError'
  | 'ServiceUnavailableError'
  | 'InternalServerError';

type ErrorContext = Record<string, string | number | boolean>;

type ErrorHandlerConfig = {
  route?: string;
  operation?: string;
  method?: string;
  userId?: string;
  requestId?: string;
  includeStack?: boolean;
  includeDetails?: boolean;
  customMessage?: string;
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  logContext?: ErrorContext;
  sanitizeResponse?: boolean;
  hideInternalErrors?: boolean;
};

type ErrorResponse = {
  success: false;
  error: string;
  message: string;
  code: string;
  timestamp: string;
  requestId?: string;
  details?: Array<{ path?: string; message: string; code?: string }>;
  stack?: string;
  severity?: string;
  type?: string;
};

function determineErrorType(error: unknown): ErrorType {
  if (!(error instanceof Error)) return 'InternalServerError';

  const name = error.name.toLowerCase();
  const msg = error.message.toLowerCase();

  if (name.includes('validation') || msg.includes('validation')) return 'ValidationError';
  if (name.includes('database') || msg.includes('database')) return 'DatabaseError';
  if (name.includes('auth') && msg.includes('auth')) return 'AuthenticationError';
  if (msg.includes('access denied') || msg.includes('forbidden')) return 'AuthorizationError';
  if (msg.includes('not found') || name.includes('notfound')) return 'NotFoundError';
  if (msg.includes('rate limit') || msg.includes('too many')) return 'RateLimitError';
  if (msg.includes('network') || msg.includes('connection')) return 'NetworkError';
  if (msg.includes('timeout') || name.includes('timeout')) return 'TimeoutError';
  if (msg.includes('unavailable') || msg.includes('service')) return 'ServiceUnavailableError';
  if (name.includes('file') || msg.includes('file')) return 'FileSystemError';
  if (msg.includes('config')) return 'ConfigurationError';

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

const ERROR_STATUS_MAP: Record<ErrorType, number> = {
  ValidationError: 400,
  DatabaseError: 500,
  AuthenticationError: 401,
  AuthorizationError: 403,
  NotFoundError: 404,
  RateLimitError: 429,
  NetworkError: 502,
  FileSystemError: 500,
  ConfigurationError: 500,
  TimeoutError: 504,
  ServiceUnavailableError: 503,
  InternalServerError: 500,
} as const;

const USER_FRIENDLY_MESSAGES: Record<ErrorType, string> = {
  ValidationError: 'The provided data is invalid. Please check your input and try again.',
  DatabaseError: 'A database error occurred. Please try again later.',
  AuthenticationError: 'Authentication failed. Please check your credentials.',
  AuthorizationError: 'You do not have permission to access this resource.',
  NotFoundError: 'The requested resource was not found.',
  RateLimitError: 'Too many requests. Please try again later.',
  NetworkError: 'A network error occurred. Please try again.',
  FileSystemError: 'A file system error occurred. Please try again later.',
  ConfigurationError: 'A configuration error occurred. Please contact support.',
  TimeoutError: 'The request timed out. Please try again.',
  ServiceUnavailableError: 'The service is temporarily unavailable. Please try again later.',
  InternalServerError: 'An internal server error occurred. Please try again later.',
} as const;

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: unknown, config: ErrorHandlerConfig = {}): ErrorResponse {
    const startTime = performance.now();

    try {
      const errorType = determineErrorType(error);
      const requestId = config.requestId || this.generateRequestId();

      const baseContext: ErrorContext = {
        route: config.route || 'unknown',
        operation: config.operation || 'unknown',
        method: config.method || 'unknown',
        errorType,
        timestamp: new Date().toISOString(),
      };

      const fullContext = validateErrorContext({
        ...baseContext,
        ...config.logContext,
        requestId,
        userId: config.userId,
        processingTime: `${(performance.now() - startTime).toFixed(2)}ms`,
      });

      this.logError(error, errorType, fullContext, config.logLevel || 'error');

      if (error instanceof z.ZodError) {
        return this.handleZodError(error, requestId, config);
      }

      if (error instanceof ValidationError) {
        return this.handleValidationError(error, requestId, config);
      }

      const errorObj = error instanceof Error ? error : new Error(String(error));
      return this.handleGenericError(errorObj, errorType, requestId, config);
    } catch (handlerError) {
      logger.fatal(
        'Error handler failed',
        handlerError instanceof Error ? handlerError : new Error(String(handlerError)),
        {
          originalError: error instanceof Error ? error.message : String(error),
          handlerError: handlerError instanceof Error ? handlerError.message : String(handlerError),
        }
      );

      return this.createFallbackErrorResponse(config.requestId);
    }
  }

  private handleZodError(
    zodError: z.ZodError,
    requestId: string,
    config: ErrorHandlerConfig
  ): ErrorResponse {
    const details = zodError.issues.map((issue) => ({
      path: issue.path.join('.') || 'root',
      message: issue.message,
      code: issue.code.toUpperCase(),
    }));

    const mainMessage =
      config.customMessage || `Validation failed: ${details[0]?.message || 'Invalid input'}`;

    return {
      success: false,
      error: 'Validation Error',
      message: mainMessage,
      code: 'VALIDATION_FAILED',
      timestamp: new Date().toISOString(),
      requestId,
      ...(config.includeDetails !== false && { details }),
      ...(config.includeStack && isDevelopment && zodError.stack && { stack: zodError.stack }),
    };
  }

  private handleValidationError(
    validationError: ValidationError,
    requestId: string,
    config: ErrorHandlerConfig
  ): ErrorResponse {
    return this.handleZodError(validationError.details, requestId, {
      ...config,
      customMessage: config.customMessage || validationError.message,
    });
  }

  private handleGenericError(
    error: Error,
    errorType: ErrorType,
    requestId: string,
    config: ErrorHandlerConfig
  ): ErrorResponse {
    const userMessage =
      config.customMessage ||
      (config.hideInternalErrors !== false && isProduction
        ? USER_FRIENDLY_MESSAGES[errorType] || error.message
        : error.message);

    const response: ErrorResponse = {
      success: false,
      error: errorType.replace('Error', ' Error'),
      message: userMessage,
      code: this.generateErrorCode(errorType),
      timestamp: new Date().toISOString(),
      requestId,
    };

    if ((isDevelopment || config.includeStack) && error.stack) {
      response.stack = error.stack;
    }

    return response;
  }

  private createFallbackErrorResponse(requestId?: string): ErrorResponse {
    return {
      success: false,
      error: 'Internal Server Error',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      requestId: requestId || this.generateRequestId(),
    };
  }

  private logError(
    error: unknown,
    errorType: ErrorType,
    context: ErrorContext,
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logMessage = `${errorType}: ${errorMessage}`;

    const logContext = context;
    const metadata: Record<string, string | number | boolean> = {
      errorType,
      errorConstructor: error?.constructor?.name || 'Unknown',
      hasStack: error instanceof Error && Boolean(error.stack),
    };

    switch (level) {
      case 'debug':
        logger.debug(logMessage, logContext, metadata);
        break;
      case 'info':
        logger.info(logMessage, logContext, metadata);
        break;
      case 'warn':
        logger.warn(logMessage, logContext, metadata);
        break;
      case 'error':
        logger.error(
          logMessage,
          error instanceof Error ? error : new Error(String(error)),
          logContext,
          metadata
        );
        break;
      case 'fatal':
        logger.fatal(
          logMessage,
          error instanceof Error ? error : new Error(String(error)),
          logContext,
          metadata
        );
        break;
      default:
        logger.error(
          logMessage,
          error instanceof Error ? error : new Error(String(error)),
          logContext,
          metadata
        );
    }
  }

  private generateRequestId(): string {
    return randomUUID();
  }

  private generateErrorCode(errorType: ErrorType): string {
    const typeCode = errorType.replace('Error', '').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${typeCode.slice(0, 3)}_${timestamp.slice(-8)}`;
  }

  public createNextResponse(error: unknown, config: ErrorHandlerConfig = {}): NextResponse {
    const errorResponse = this.handleError(error, config);
    const statusCode = this.getStatusCodeForError(error);

    return NextResponse.json(errorResponse, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': errorResponse.requestId || '',
      },
    });
  }

  private getStatusCodeForError(error: unknown): number {
    const errorType = determineErrorType(error);
    return ERROR_STATUS_MAP[errorType] || 500;
  }

  public async handleAsync<T>(
    operation: () => Promise<T>,
    config: ErrorHandlerConfig = {}
  ): Promise<{ success: true; data: T } | { success: false; error: ErrorResponse }> {
    try {
      const data = await operation();
      return { success: true, data };
    } catch (error) {
      const errorResponse = this.handleError(error, config);
      return { success: false, error: errorResponse };
    }
  }

  public handleMiddlewareError(
    error: unknown,
    request: Request,
    config: Partial<ErrorHandlerConfig> = {}
  ): NextResponse {
    const url = new URL(request.url);
    const headerRequestId = request.headers.get('x-request-id');
    const requestId = headerRequestId || this.generateRequestId();

    const fullConfig: ErrorHandlerConfig = {
      route: url.pathname,
      method: request.method,
      requestId,
      logContext: {
        userAgent: request.headers.get('user-agent') || '',
        ip: request.headers.get('x-forwarded-for') || '',
        referer: request.headers.get('referer') || '',
      },
      ...config,
    };

    return this.createNextResponse(error, fullConfig);
  }
}

const errorHandler = ErrorHandler.getInstance();

export const handleApiError = (error: unknown, config: ErrorHandlerConfig = {}): NextResponse => {
  return errorHandler.createNextResponse(error, {
    hideInternalErrors: true,
    sanitizeResponse: true,
    logLevel: 'error',
    ...config,
  });
};

export const handleValidationError = (
  validationError: ValidationError,
  config: ErrorHandlerConfig = {}
): NextResponse => {
  return errorHandler.createNextResponse(validationError, {
    includeDetails: true,
    logLevel: 'warn',
    ...config,
  });
};

// React component error boundary helper moved to @/src/lib/error-handler/client
// to avoid bundling server-only code in client components
// Import from '@/src/lib/error-handler/client' instead
