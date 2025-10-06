/**
 * Error Sanitizer
 * Production-grade error sanitization for security-hardened responses
 * Removes sensitive information from error messages and stack traces
 * Part of unified lib/security/ module
 */

import { logger } from '@/src/lib/logger';
import type { RequestId } from '@/src/lib/schemas/branded-types.schema';
import { isProduction } from '@/src/lib/schemas/env.schema';
import {
  determineErrorType,
  type ErrorContext,
  type ErrorSeverity,
  errorSeveritySchema,
  type SanitizedError,
  validateErrorInput,
} from '@/src/lib/schemas/error.schema';
import { SENSITIVE_PATTERNS } from './patterns';

// Merge with extended patterns from original file

/**
 * Generic safe error messages for different error types
 */
const SAFE_ERROR_MESSAGES = {
  ValidationError: 'Invalid input provided',
  DatabaseError: 'Database operation failed',
  AuthenticationError: 'Authentication failed',
  AuthorizationError: 'Access denied',
  NotFoundError: 'Resource not found',
  RateLimitError: 'Too many requests',
  NetworkError: 'Network request failed',
  FileSystemError: 'File operation failed',
  ConfigurationError: 'Configuration error',
  TimeoutError: 'Request timeout',
  ServiceUnavailableError: 'Service temporarily unavailable',
  InternalServerError: 'Internal server error',
  default: 'An error occurred while processing your request',
} as const;

/**
 * Error sanitization utility class
 */
export class ErrorSanitizer {
  private static instance: ErrorSanitizer;

  private constructor() {}

  public static getInstance(): ErrorSanitizer {
    if (!ErrorSanitizer.instance) {
      ErrorSanitizer.instance = new ErrorSanitizer();
    }
    return ErrorSanitizer.instance;
  }

  /**
   * Sanitize error message by removing sensitive patterns
   */
  private sanitizeMessage(message: string): {
    sanitized: string;
    removed: string[];
  } {
    let sanitized = message;
    const removed: string[] = [];

    // Remove sensitive patterns
    for (const pattern of SENSITIVE_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        removed.push(...matches);
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      }
    }

    // Additional sanitization for common sensitive info
    sanitized = sanitized
      .replace(/password\s*[:=]\s*[^\s]+/gi, 'password=[REDACTED]')
      .replace(/token\s*[:=]\s*[^\s]+/gi, 'token=[REDACTED]')
      .replace(/key\s*[:=]\s*[^\s]+/gi, 'key=[REDACTED]')
      .replace(/secret\s*[:=]\s*[^\s]+/gi, 'secret=[REDACTED]');

    return { sanitized, removed };
  }

  /**
   * Convert unknown error to Error instance using Zod validation
   */
  private normalizeError(error: unknown): Error {
    const validatedInput = validateErrorInput(error);

    if (validatedInput.isValid && validatedInput.type === 'error') {
      // Create Error instance from validated data
      const err = new Error(validatedInput.error.message);
      if (validatedInput.error.name) {
        err.name = validatedInput.error.name;
      }
      if (validatedInput.error.stack) {
        err.stack = validatedInput.error.stack;
      }
      return err;
    }

    if (validatedInput.isValid && validatedInput.type === 'string') {
      return new Error(validatedInput.fallback);
    }

    if (!validatedInput.isValid) {
      return new Error(validatedInput.fallback);
    }

    return new Error('Unknown error occurred');
  }

  /**
   * Determine error type from error object using schema validation
   */
  private determineErrorType(error: Error): keyof typeof SAFE_ERROR_MESSAGES {
    return determineErrorType(error);
  }

  /**
   * Determine error severity based on error type and content using schema validation
   */
  private determineErrorSeverity(error: Error, errorType: string): ErrorSeverity {
    const message = error.message.toLowerCase();

    // Critical errors that indicate security issues
    if (
      message.includes('injection') ||
      message.includes('exploit') ||
      message.includes('unauthorized') ||
      message.includes('breach') ||
      errorType === 'AuthorizationError'
    ) {
      return errorSeveritySchema.parse('critical');
    }

    // High severity errors
    if (
      errorType === 'DatabaseError' ||
      errorType === 'AuthenticationError' ||
      message.includes('crash') ||
      message.includes('corruption')
    ) {
      return errorSeveritySchema.parse('high');
    }

    // Medium severity errors
    if (
      errorType === 'NetworkError' ||
      errorType === 'TimeoutError' ||
      errorType === 'ServiceUnavailableError'
    ) {
      return errorSeveritySchema.parse('medium');
    }

    // Low severity errors
    if (errorType === 'ValidationError' || errorType === 'NotFoundError') {
      return errorSeveritySchema.parse('low');
    }

    return errorSeveritySchema.parse('medium');
  }

  /**
   * Generate a safe error code that doesn't reveal internals
   */
  private generateErrorCode(severity: ErrorSeverity): string {
    const prefixes: Record<ErrorSeverity, string> = {
      low: 'USR',
      medium: 'SYS',
      high: 'SVR',
      critical: 'SEC',
    };

    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefixes[severity]}_${timestamp}`;
  }

  /**
   * Main sanitization method - converts any error into a safe response
   */
  public sanitizeError(
    inputError: unknown,
    requestId: RequestId,
    context: ErrorContext = {}
  ): SanitizedError {
    const error = this.normalizeError(inputError);
    const errorType = this.determineErrorType(error);
    const severity = this.determineErrorSeverity(error, errorType);
    const errorCode = this.generateErrorCode(severity);

    const originalMessage = error.message || error.toString();
    const { sanitized: sanitizedMessage, removed } = this.sanitizeMessage(originalMessage);

    // Log the full error details internally (never expose to client)
    logger.error(`Error sanitized [${errorCode}]`, error, {
      errorType,
      severity,
      removedPatternsCount: removed.length,
      contextKeys: Object.keys(context).join(','),
      requestId,
    });

    // Return safe, sanitized error for client response
    return {
      error: SAFE_ERROR_MESSAGES[errorType] || SAFE_ERROR_MESSAGES.default,
      message: sanitizedMessage.substring(0, 200), // Limit message length
      code: errorCode,
      timestamp: new Date().toISOString(),
      requestId,
      severity,
    };
  }

  /**
   * Sanitize stack trace for development environments
   * Only use in non-production environments
   */
  public sanitizeStackTrace(stackTrace: string): string {
    if (isProduction) {
      return '[Stack trace hidden in production]';
    }

    const { sanitized } = this.sanitizeMessage(stackTrace);
    return sanitized
      .split('\n')
      .filter((line) => !line.includes('node_modules'))
      .slice(0, 10) // Limit stack trace depth
      .join('\n');
  }

  /**
   * Check if an error should be reported to external services
   * (e.g., Sentry, error tracking services)
   */
  public shouldReportError(severity: ErrorSeverity): boolean {
    // Only report medium and above severity errors
    const reportableSeverities: ErrorSeverity[] = ['medium', 'high', 'critical'];
    return reportableSeverities.includes(severity);
  }
}

/**
 * Convenience function to get sanitizer instance
 */
const errorSanitizer = ErrorSanitizer.getInstance();

/**
 * Helper function for sanitizing errors in API routes
 */
export function sanitizeApiError(
  error: unknown,
  requestId: RequestId,
  context: ErrorContext = {}
): SanitizedError {
  return errorSanitizer.sanitizeError(error, requestId, context);
}
