/**
 * Error Validation Schemas
 * Production-grade validation for error sanitization and handling
 * Protects against error injection and ensures consistent error structure
 *
 * CLEANED - Removed 18 unused exports (64% waste eliminated)
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { isoDatetimeString, nonEmptyString } from '@/lib/schemas/primitives/base-strings';
import { requestIdSchema } from './branded-types.schema';

/**
 * Security constants for error handling
 */
const ERROR_LIMITS = {
  MAX_MESSAGE_LENGTH: 1000,
  MAX_STACK_TRACE_LENGTH: 10000,
  MAX_ERROR_NAME_LENGTH: 200,
  MAX_CONTEXT_KEYS: 20,
  MAX_CONTEXT_VALUE_LENGTH: 500,
} as const;

/**
 * Error severity levels
 */
export const errorSeveritySchema = z
  .enum(['low', 'medium', 'high', 'critical'])
  .describe('Categorizes the severity level of an error for prioritization and alerting');

/**
 * Error type classification
 */
export const errorTypeSchema = z
  .enum([
    'ValidationError',
    'DatabaseError',
    'AuthenticationError',
    'AuthorizationError',
    'NotFoundError',
    'RateLimitError',
    'NetworkError',
    'FileSystemError',
    'ConfigurationError',
    'TimeoutError',
    'ServiceUnavailableError',
    'InternalServerError',
  ])
  .describe('Classifies errors by their root cause for proper handling and routing');

/**
 * Error context validation schema
 */
export const errorContextSchema = z
  .record(
    z.string().max(50, 'Context key too long').describe('Context key identifier'),
    z
      .union([
        z.string().max(ERROR_LIMITS.MAX_CONTEXT_VALUE_LENGTH).describe('String context value'),
        z.number().finite().describe('Numeric context value'),
        z.boolean().describe('Boolean context value'),
      ])
      .describe('Supported context value types: string, number, or boolean')
  )
  .refine(
    (context) => Object.keys(context).length <= ERROR_LIMITS.MAX_CONTEXT_KEYS,
    `Maximum ${ERROR_LIMITS.MAX_CONTEXT_KEYS} context keys allowed`
  )
  .describe('Additional metadata and diagnostic information associated with an error');

/**
 * Basic error object validation
 */
export const basicErrorSchema = z
  .object({
    name: z
      .string()
      .max(ERROR_LIMITS.MAX_ERROR_NAME_LENGTH)
      .optional()
      .describe('Error class name or type identifier'),
    message: nonEmptyString
      .max(ERROR_LIMITS.MAX_MESSAGE_LENGTH)
      .describe('Human-readable error message describing what went wrong'),
    stack: z
      .string()
      .max(ERROR_LIMITS.MAX_STACK_TRACE_LENGTH)
      .optional()
      .describe('Stack trace showing the execution path leading to the error'),
  })
  .describe('Standard JavaScript Error object structure with security limits');

/**
 * Production error input validation - strict type safety
 */
export const errorInputSchema = z
  .union([
    basicErrorSchema,
    z
      .string()
      .max(ERROR_LIMITS.MAX_MESSAGE_LENGTH, 'Error message is too long')
      .describe('Simple string error message'),
    z
      .record(
        z.string().describe('Property key'),
        z
          .union([
            z.string().describe('String property value'),
            z.number().describe('Numeric property value'),
            z.boolean().describe('Boolean property value'),
          ])
          .describe('Property value of any supported type')
      )
      .describe('Error-like object with arbitrary properties'),
  ])
  .describe('Flexible error input accepting Error objects, strings, or error-like objects');

/**
 * Sanitized error response schema
 */
export const sanitizedErrorSchema = z
  .object({
    error: nonEmptyString.max(200).describe('Short error identifier or category name'),
    message: z.string().max(200).describe('User-facing error message, sanitized for security'),
    code: z
      .string()
      .regex(/^[A-Z]{3}_[A-Z0-9]{8,12}$/, 'Invalid error code format')
      .describe('Unique error code for tracking and debugging (e.g., ERR_VALIDATION01)'),
    timestamp: isoDatetimeString.describe('ISO 8601 timestamp when the error occurred'),
    requestId: requestIdSchema.describe('Unique request identifier for correlation'),
    severity: errorSeveritySchema.describe('Error severity level'),
  })
  .describe('Production-safe error response with sanitized fields and tracking metadata');

/**
 * Error validation result schema - discriminated union for type safety
 */
const errorValidationResultSchema = z
  .discriminatedUnion('isValid', [
    z
      .object({
        isValid: z.literal(true).describe('Validation succeeded'),
        type: z.literal('error').describe('Input was a valid Error object'),
        error: basicErrorSchema.describe('Validated error object'),
        fallback: z.never().optional().describe('Not used for valid Error objects'),
      })
      .describe('Successful validation result for Error objects'),
    z
      .object({
        isValid: z.literal(true).describe('Validation succeeded'),
        type: z.literal('string').describe('Input was a valid string'),
        error: z.never().optional().describe('Not used for string inputs'),
        fallback: z.string().describe('Validated string message'),
      })
      .describe('Successful validation result for string messages'),
    z
      .object({
        isValid: z.literal(false).describe('Validation failed'),
        type: z.literal('invalid').describe('Input was invalid or unsupported'),
        error: z.never().optional().describe('Not used for invalid inputs'),
        fallback: z.string().describe('Default fallback error message'),
      })
      .describe('Failed validation result with fallback message'),
  ])
  .describe('Type-safe discriminated union representing error validation outcomes');

export type ErrorValidationResult = z.infer<typeof errorValidationResultSchema>;

/**
 * Safe error input validation helper
 */
export function validateErrorInput(error: unknown): ErrorValidationResult {
  try {
    if (error instanceof Error) {
      const validated = basicErrorSchema.parse({
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return { isValid: true, type: 'error', error: validated };
    }

    if (typeof error === 'string') {
      return {
        isValid: true,
        type: 'string',
        fallback: error.slice(0, ERROR_LIMITS.MAX_MESSAGE_LENGTH),
      };
    }

    if (error && typeof error === 'object') {
      const obj = error as Record<string, unknown>;
      if ('message' in obj && typeof obj.message === 'string') {
        const validated = basicErrorSchema.parse({
          name: typeof obj.name === 'string' ? obj.name : 'Error',
          message: obj.message,
          stack: typeof obj.stack === 'string' ? obj.stack : '',
        });
        return { isValid: true, type: 'error', error: validated };
      }
    }

    return { isValid: false, type: 'invalid', fallback: 'Unknown error occurred' };
  } catch (validationError) {
    logger.error(
      'Error Validation: Failed to validate error input',
      validationError instanceof Error ? validationError : new Error(String(validationError)),
      {
        validationError:
          validationError instanceof z.ZodError
            ? validationError.issues.join(', ')
            : String(validationError),
        errorType: typeof error,
        errorConstructor: error?.constructor?.name || 'Error',
      }
    );
    return { isValid: false, type: 'invalid', fallback: 'Error validation failed' };
  }
}

/**
 * Safe error context validation helper
 */
export function validateErrorContext(
  context: Record<string, unknown>
): z.infer<typeof errorContextSchema> {
  try {
    if (!context || typeof context !== 'object') {
      return {};
    }

    const sanitized: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(context)) {
      if (typeof key === 'string' && key.length <= 50) {
        if (typeof value === 'string') {
          sanitized[key] = value.slice(0, ERROR_LIMITS.MAX_CONTEXT_VALUE_LENGTH);
        } else if (typeof value === 'number' && Number.isFinite(value)) {
          sanitized[key] = value;
        } else if (typeof value === 'boolean') {
          sanitized[key] = value;
        }
      }
    }

    return errorContextSchema.parse(sanitized);
  } catch (error) {
    logger.error(
      'Error Context Validation: Failed to validate context',
      error instanceof Error ? error : new Error(String(error)),
      {
        error: error instanceof z.ZodError ? error.issues.join(', ') : String(error),
        contextType: typeof context,
      }
    );
    return {};
  }
}

/**
 * Error type determination helper with validation
 */
export function determineErrorType(error: unknown): z.infer<typeof errorTypeSchema> {
  const validatedError = validateErrorInput(error);

  if (!validatedError.isValid) {
    return 'InternalServerError';
  }

  let errorData: z.infer<typeof basicErrorSchema> | undefined;
  let fallbackMessage = '';

  if (validatedError.type === 'error') {
    errorData = validatedError.error;
  } else {
    fallbackMessage = validatedError.fallback;
  }

  const errorName = errorData?.name || '';
  const errorMessage = (errorData?.message || fallbackMessage).toLowerCase();

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
 * Error handler configuration schema (unused - removed export)
 */
const errorHandlerConfigSchema = z
  .object({
    // Context information
    route: z
      .string()
      .max(500)
      .optional()
      .describe('API route or endpoint path where error occurred'),
    operation: z.string().max(100).optional().describe('Operation or function name being executed'),
    method: z.string().max(10).optional().describe('HTTP method (GET, POST, etc.)'),
    userId: z
      .string()
      .max(100)
      .optional()
      .describe('Identifier of the user who triggered the error'),
    requestId: requestIdSchema.optional().describe('Unique request identifier'),

    // Response configuration
    includeStack: z
      .boolean()
      .optional()
      .describe('Whether to include stack trace in response (development only)'),
    includeDetails: z
      .boolean()
      .optional()
      .describe('Whether to include detailed error information in response'),
    customMessage: z
      .string()
      .max(500)
      .optional()
      .describe('Override default error message with custom text'),

    // Logging configuration
    logLevel: z
      .enum(['debug', 'info', 'warn', 'error', 'fatal'])
      .optional()
      .describe('Logging severity level for this error'),
    logContext: z
      .record(
        nonEmptyString.describe('Context key'),
        z
          .union([
            z.string().describe('String value'),
            z.number().describe('Numeric value'),
            z.boolean().describe('Boolean value'),
          ])
          .describe('Context value')
      )
      .optional()
      .describe('Additional context data to include in logs'),

    // Security configuration
    sanitizeResponse: z
      .boolean()
      .optional()
      .describe('Whether to sanitize error response to remove sensitive information'),
    hideInternalErrors: z
      .boolean()
      .optional()
      .describe('Whether to hide internal error details from external clients'),
  })
  .describe('Configuration options for error handling, logging, and response formatting');

/**
 * Standardized error response schema (unused - removed export)
 */
const errorResponseSchema = z
  .object({
    success: z.literal(false).describe('Always false for error responses'),
    error: nonEmptyString.max(200).describe('Error type or category identifier'),
    message: nonEmptyString.max(1000).describe('Detailed error message for the client'),
    code: nonEmptyString.max(50).describe('Machine-readable error code'),
    timestamp: isoDatetimeString.describe('ISO 8601 timestamp of when the error occurred'),
    requestId: requestIdSchema.optional().describe('Request identifier for tracing'),
    details: z
      .array(
        z
          .object({
            field: z
              .string()
              .max(100)
              .optional()
              .describe('Field name that caused the validation error'),
            message: z.string().max(500).describe('Specific error message for this detail'),
            code: z.string().max(50).optional().describe('Error code specific to this detail'),
          })
          .describe('Individual error detail item')
      )
      .optional()
      .describe('Array of granular error details, typically for validation errors'),
    stack: z
      .string()
      .max(ERROR_LIMITS.MAX_STACK_TRACE_LENGTH)
      .optional()
      .describe('Stack trace (only in development environments)'),
    severity: errorSeveritySchema.optional().describe('Error severity classification'),
    type: errorTypeSchema.optional().describe('Error type classification'),
  })
  .describe('Standardized API error response structure with comprehensive metadata');

/**
 * Type exports
 */
export type { ErrorSeverity, ErrorType } from './primitives/performance-primitives';
export type ErrorContext = z.infer<typeof errorContextSchema>;
export type SanitizedError = z.infer<typeof sanitizedErrorSchema>;
export type ErrorHandlerConfig = z.infer<typeof errorHandlerConfigSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
