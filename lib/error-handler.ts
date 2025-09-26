/**
 * Centralized Error Handling System
 *
 * Production-grade error handling for all Zod validation errors and general errors.
 * Provides consistent error formatting, logging, and user-friendly responses.
 * Designed with security-first approach for open-source production codebase.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { isDevelopment, isProduction } from '@/lib/schemas/env.schema';
import {
  determineErrorType,
  type ErrorContext,
  type ErrorType,
  validateErrorContext,
  validateErrorInput,
} from '@/lib/schemas/error.schema';
import { ValidationError } from '@/lib/validation';

/**
 * Error handler configuration
 */
export interface ErrorHandlerConfig {
  // Context information
  route?: string;
  operation?: string;
  method?: string;
  userId?: string;
  requestId?: string;

  // Response configuration
  includeStack?: boolean;
  includeDetails?: boolean;
  customMessage?: string;

  // Logging configuration
  logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  logContext?: Record<string, unknown>;

  // Security configuration
  sanitizeResponse?: boolean;
  hideInternalErrors?: boolean;
}

/**
 * Standardized error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  code: string;
  timestamp: string;
  requestId?: string;
  details?: Array<{
    path: string;
    message: string;
    code: string;
  }>;
  stack?: string;
}

/**
 * HTTP status code mapping for different error types
 */
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

/**
 * User-friendly error messages
 */
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

/**
 * Central error handler class
 */
export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle any error and return standardized response
   */
  public handleError(error: unknown, config: ErrorHandlerConfig = {}): ErrorResponse {
    const startTime = performance.now();

    try {
      // Validate and extract error information
      const { error: validatedError, fallback } = validateErrorInput(error);
      const errorType = determineErrorType(error);

      // Generate request ID if not provided
      const requestId = config.requestId || this.generateRequestId();

      // Create base error context
      const baseContext: ErrorContext = {
        route: config.route || 'unknown',
        operation: config.operation || 'unknown',
        method: config.method || 'unknown',
        errorType,
        timestamp: new Date().toISOString(),
      };

      // Merge with provided context
      const fullContext = validateErrorContext({
        ...baseContext,
        ...config.logContext,
        requestId,
        userId: config.userId,
        processingTime: `${(performance.now() - startTime).toFixed(2)}ms`,
      });

      // Log the error with appropriate level
      this.logError(error, errorType, fullContext, config.logLevel || 'error');

      // Handle specific error types
      if (error instanceof z.ZodError) {
        return this.handleZodError(error, requestId, config);
      }

      if (error instanceof ValidationError) {
        return this.handleValidationError(error, requestId, config);
      }

      // Handle generic errors - create a proper Error object
      const errorToHandle = validatedError
        ? new Error(validatedError.message)
        : new Error(fallback || 'Unknown error');

      // Copy properties if they exist
      if (validatedError) {
        if (validatedError.name) errorToHandle.name = validatedError.name;
        if (validatedError.stack) errorToHandle.stack = validatedError.stack;
      }

      return this.handleGenericError(errorToHandle, errorType, requestId, config);
    } catch (handlerError) {
      // Fallback error handling if the error handler itself fails
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

  /**
   * Handle Zod validation errors specifically
   */
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

  /**
   * Handle custom ValidationError instances
   */
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

  /**
   * Handle generic errors
   */
  private handleGenericError(
    error: Error,
    errorType: ErrorType,
    requestId: string,
    config: ErrorHandlerConfig
  ): ErrorResponse {
    const userMessage =
      config.customMessage ||
      (config.hideInternalErrors !== false && isProduction
        ? USER_FRIENDLY_MESSAGES[errorType]
        : error.message);

    const response: ErrorResponse = {
      success: false,
      error: errorType.replace('Error', ' Error'),
      message: userMessage,
      code: this.generateErrorCode(errorType),
      timestamp: new Date().toISOString(),
      requestId,
    };

    // Include stack trace in development or if explicitly requested
    if ((isDevelopment || config.includeStack) && error.stack) {
      response.stack = error.stack;
    }

    return response;
  }

  /**
   * Create fallback error response when error handler fails
   */
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

  /**
   * Log errors with appropriate level and context
   */
  private logError(
    error: unknown,
    errorType: ErrorType,
    context: ErrorContext | null,
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal'
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logMessage = `${errorType}: ${errorMessage}`;

    const logContext = context || {};
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

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate structured error codes
   */
  private generateErrorCode(errorType: ErrorType): string {
    const typeCode = errorType.replace('Error', '').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${typeCode.slice(0, 3)}_${timestamp.slice(-8)}`;
  }

  /**
   * Create Next.js Response from ErrorResponse
   */
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

  /**
   * Get appropriate HTTP status code for error
   */
  private getStatusCodeForError(error: unknown): number {
    const errorType = determineErrorType(error);
    return ERROR_STATUS_MAP[errorType] || 500;
  }

  /**
   * Async error handler for use in try-catch blocks
   */
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

  /**
   * Middleware-friendly error handler for Next.js
   */
  public handleMiddlewareError(
    error: unknown,
    request: NextRequest,
    config: Partial<ErrorHandlerConfig> = {}
  ): NextResponse {
    const url = new URL(request.url);
    const requestId = request.headers.get('x-request-id') || this.generateRequestId();

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

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Convenience functions for common use cases
export const handleApiError = (error: unknown, config: ErrorHandlerConfig = {}): NextResponse => {
  return errorHandler.createNextResponse(error, {
    hideInternalErrors: true,
    sanitizeResponse: true,
    logLevel: 'error',
    ...config,
  });
};

export const handleZodError = (
  zodError: z.ZodError,
  config: ErrorHandlerConfig = {}
): NextResponse => {
  return errorHandler.createNextResponse(zodError, {
    includeDetails: true,
    logLevel: 'warn',
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

// Middleware helper for consistent error handling
export const withErrorHandling = (
  handler: (request: NextRequest) => Promise<NextResponse | Response>
) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const response = await handler(request);
      return response instanceof NextResponse
        ? response
        : new NextResponse(response.body, response);
    } catch (error) {
      return errorHandler.handleMiddlewareError(error, request);
    }
  };
};

// React component error boundary helper
export const createErrorBoundaryFallback = (
  error: Error,
  errorInfo: { componentStack: string }
) => {
  const errorResponse = errorHandler.handleError(error, {
    operation: 'react_render',
    logLevel: 'error',
    includeStack: isDevelopment,
    logContext: {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    },
  });

  return errorResponse;
};

export default errorHandler;
