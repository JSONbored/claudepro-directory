/**
 * Production-grade error sanitization for security-hardened responses
 * Removes sensitive information from error messages and stack traces
 * Designed for hostile environments where every error could be exploited
 */

import { logger } from '@/lib/logger';

/**
 * Sensitive patterns that must be removed from error messages
 * These patterns could reveal system internals to attackers
 */
const SENSITIVE_PATTERNS = [
  // File system paths (absolute and relative)
  /\/[a-zA-Z0-9_\-/.]+\.(ts|js|tsx|jsx|json|env|config|yaml|yml)/gi,
  /\b[A-Z]:\\[a-zA-Z0-9_\-\\/.]+/gi,
  /\.\.[/\\]([a-zA-Z0-9_\-/\\.])+/gi,
  /\/home\/[a-zA-Z0-9_\-/.]+/gi,
  /\/Users\/[a-zA-Z0-9_\-/.]+/gi,
  /\/var\/[a-zA-Z0-9_\-/.]+/gi,
  /\/tmp\/[a-zA-Z0-9_\-/.]+/gi,

  // Database connection strings and credentials
  /postgres:\/\/[^@]+@[^/]+\/[^?]+/gi,
  /mysql:\/\/[^@]+@[^/]+\/[^?]+/gi,
  /mongodb:\/\/[^@]+@[^/]+\/[^?]+/gi,
  /redis:\/\/[^@]*@?[^/]+\/[0-9]+/gi,
  /\b(user|username|password|passwd|pass|pwd|secret|key|token)[:=]\s*['"]*[a-zA-Z0-9_\-+/=]{4,}['"]*\b/gi,

  // API keys and tokens
  /\b[a-zA-Z0-9_]{32,}\b/g,
  /\bsk-[a-zA-Z0-9]{48,}\b/gi,
  /\bpk-[a-zA-Z0-9]{48,}\b/gi,
  /\bBearer\s+[a-zA-Z0-9_\-+/=]{20,}\b/gi,
  /\bApiKey\s+[a-zA-Z0-9_\-+/=]{20,}\b/gi,

  // Environment variables and configuration
  /process\.env\.[A-Z_]+/gi,
  /\$\{[A-Z_]+\}/gi,
  /\bNODE_ENV\b/gi,
  /\bPORT\b/gi,
  /\bDATABASE_URL\b/gi,

  // Server internals and hostnames
  /\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0):\d+\b/gi,
  /\b[a-zA-Z0-9.-]+\.(?:local|internal|dev|test|staging)\b/gi,
  /\b[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}\b/gi,

  // Stack trace information
  /\s+at\s+[^\s]+\s+\([^)]+\)/gi,
  /\s+at\s+[^\s]+:[0-9]+:[0-9]+/gi,
  /\bin\s+file:\/\/[^\s]+/gi,

  // Version information that could aid attackers
  /\bversion\s*[:=]\s*['"]*[0-9]+\.[0-9]+\.[0-9]+[^'"]*['"]*\b/gi,
  /\bv[0-9]+\.[0-9]+\.[0-9]+/gi,

  // Memory addresses and system info
  /\b0x[a-fA-F0-9]{8,16}\b/gi,
  /\b[a-fA-F0-9]{32,64}\b/g,

  // SQL fragments that could reveal schema
  /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|TABLE)\b[^.]{0,100}/gi,

  // Common sensitive configuration keys
  /\b(jwt_secret|session_secret|encryption_key|private_key|client_secret)\b/gi,
] as const;

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
 * Error severity levels for logging and response
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Sanitized error response interface
 */
export interface SanitizedError {
  error: string;
  message: string;
  code: string;
  timestamp: string;
  requestId: string;
  severity: ErrorSeverity;
}

/**
 * Context information for error sanitization
 */
export interface ErrorContext {
  route?: string;
  operation?: string;
  method?: string;
  component?: string;
  key?: string;
  contentType?: string;
  [key: string]: string | number | boolean;
}

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
  private sanitizeMessage(message: string): { sanitized: string; removed: string[] } {
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
   * Convert unknown error to Error instance
   */
  private normalizeError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'string') {
      return new Error(error);
    }
    if (typeof error === 'object' && error !== null) {
      return new Error(JSON.stringify(error));
    }
    return new Error('Unknown error occurred');
  }

  /**
   * Determine error type from error object
   */
  private determineErrorType(error: Error): keyof typeof SAFE_ERROR_MESSAGES {
    const errorName = error.name || error.constructor.name;
    const errorMessage = error.message.toLowerCase();

    // Check for specific error types
    if (errorName.includes('Validation') || errorMessage.includes('validation')) {
      return 'ValidationError';
    }
    if (errorName.includes('Database') || errorMessage.includes('database')) {
      return 'DatabaseError';
    }
    if (errorName.includes('Auth') && errorMessage.includes('auth')) {
      return 'AuthenticationError';
    }
    if (errorMessage.includes('access denied') || errorMessage.includes('forbidden')) {
      return 'AuthorizationError';
    }
    if (errorMessage.includes('not found') || errorName.includes('NotFound')) {
      return 'NotFoundError';
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
      return 'RateLimitError';
    }
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      return 'NetworkError';
    }
    if (errorMessage.includes('timeout') || errorName.includes('Timeout')) {
      return 'TimeoutError';
    }
    if (errorMessage.includes('unavailable') || errorMessage.includes('service')) {
      return 'ServiceUnavailableError';
    }
    if (errorName.includes('File') || errorMessage.includes('file')) {
      return 'FileSystemError';
    }
    if (errorMessage.includes('config')) {
      return 'ConfigurationError';
    }

    return 'InternalServerError';
  }

  /**
   * Determine error severity based on error type and content
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
      return ErrorSeverity.CRITICAL;
    }

    // High severity errors
    if (
      errorType === 'DatabaseError' ||
      errorType === 'AuthenticationError' ||
      message.includes('crash') ||
      message.includes('corruption')
    ) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity errors
    if (
      errorType === 'NetworkError' ||
      errorType === 'TimeoutError' ||
      errorType === 'ServiceUnavailableError'
    ) {
      return ErrorSeverity.MEDIUM;
    }

    // Low severity errors
    if (errorType === 'ValidationError' || errorType === 'NotFoundError') {
      return ErrorSeverity.LOW;
    }

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Generate a safe error code that doesn't reveal internals
   */
  private generateErrorCode(severity: ErrorSeverity): string {
    const prefixes = {
      [ErrorSeverity.LOW]: 'USR',
      [ErrorSeverity.MEDIUM]: 'SYS',
      [ErrorSeverity.HIGH]: 'SVR',
      [ErrorSeverity.CRITICAL]: 'SEC',
    };

    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefixes[severity]}_${timestamp}`;
  }

  /**
   * Main sanitization method - converts any error into a safe response
   */
  public sanitizeError(
    inputError: unknown,
    context: ErrorContext = {},
    requestId = 'unknown'
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
    if (process.env.NODE_ENV === 'production') {
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
    return [ErrorSeverity.MEDIUM, ErrorSeverity.HIGH, ErrorSeverity.CRITICAL].includes(severity);
  }
}

/**
 * Convenience function to get sanitizer instance
 */
export const errorSanitizer = ErrorSanitizer.getInstance();

/**
 * Helper function for sanitizing errors in API routes
 */
export function sanitizeApiError(
  error: unknown,
  context: ErrorContext = {},
  requestId = 'unknown'
): SanitizedError {
  return errorSanitizer.sanitizeError(error, context, requestId);
}

/**
 * Type guard to check if error is a sanitized error
 */
export function isSanitizedError(obj: object): obj is SanitizedError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    'message' in obj &&
    'timestamp' in obj &&
    'severity' in obj &&
    'code' in obj &&
    'requestId' in obj
  );
}

export default ErrorSanitizer;
