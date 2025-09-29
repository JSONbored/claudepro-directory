/**
 * Error Validation Schemas
 * Production-grade validation for error sanitization and handling
 * Protects against error injection and ensures consistent error structure
 */

import { z } from 'zod';
import { logger } from '@/lib/logger';
import { isoDatetimeString, nonEmptyString, stringArray } from '@/lib/schemas/primitives';
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
  MAX_CODE_LENGTH: 50,
} as const;

/**
 * Error severity levels
 */
export const errorSeveritySchema = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Error type classification
 */
export const errorTypeSchema = z.enum([
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
]);

/**
 * Error context validation schema
 */
export const errorContextSchema = z
  .record(
    z.string().max(50, 'Context key too long'),
    z.union([
      z.string().max(ERROR_LIMITS.MAX_CONTEXT_VALUE_LENGTH),
      z.number().finite(),
      z.boolean(),
    ])
  )
  .refine(
    (context) => Object.keys(context).length <= ERROR_LIMITS.MAX_CONTEXT_KEYS,
    `Maximum ${ERROR_LIMITS.MAX_CONTEXT_KEYS} context keys allowed`
  );

/**
 * Basic error object validation
 */
export const basicErrorSchema = z.object({
  name: z.string().max(ERROR_LIMITS.MAX_ERROR_NAME_LENGTH).optional(),
  message: nonEmptyString.max(ERROR_LIMITS.MAX_MESSAGE_LENGTH),
  stack: z.string().max(ERROR_LIMITS.MAX_STACK_TRACE_LENGTH).optional(),
});

/**
 * Production error input validation - strict type safety
 */
export const errorInputSchema = z.union([
  basicErrorSchema,
  z.string().max(ERROR_LIMITS.MAX_MESSAGE_LENGTH, 'Error message is too long'),
  z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
]);

/**
 * Sanitized error response schema
 */
export const sanitizedErrorSchema = z.object({
  error: nonEmptyString.max(200),
  message: z.string().max(200),
  code: z.string().regex(/^[A-Z]{3}_[A-Z0-9]{8,12}$/, 'Invalid error code format'),
  timestamp: isoDatetimeString,
  requestId: requestIdSchema,
  severity: errorSeveritySchema,
});

/**
 * Error sanitization result schema
 */
export const errorSanitizationResultSchema = z.object({
  sanitized: z.string().max(ERROR_LIMITS.MAX_MESSAGE_LENGTH),
  removed: stringArray.max(100),
});

/**
 * Stack trace sanitization schema
 */
export const stackTraceSanitizationSchema = z.object({
  original: z.string().max(ERROR_LIMITS.MAX_STACK_TRACE_LENGTH),
  sanitized: z.string().max(ERROR_LIMITS.MAX_STACK_TRACE_LENGTH),
  isProduction: z.boolean(),
});

/**
 * Error validation result schema - discriminated union for type safety
 */
export const errorValidationResultSchema = z.discriminatedUnion('isValid', [
  z.object({
    isValid: z.literal(true),
    type: z.literal('error'),
    error: basicErrorSchema,
    fallback: z.never().optional(),
  }),
  z.object({
    isValid: z.literal(true),
    type: z.literal('string'),
    error: z.never().optional(),
    fallback: z.string(),
  }),
  z.object({
    isValid: z.literal(false),
    type: z.literal('invalid'),
    error: z.never().optional(),
    fallback: z.string(),
  }),
]);

export type ErrorValidationResult = z.infer<typeof errorValidationResultSchema>;

/**
 * Safe error input validation helper
 * Note: error parameter must be unknown as we're catching thrown errors
 */
export function validateErrorInput(error: unknown): ErrorValidationResult {
  try {
    // Try to parse as Error object first
    if (error instanceof Error) {
      const validated = basicErrorSchema.parse({
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return { isValid: true, type: 'error', error: validated };
    }

    // Try to parse as string
    if (typeof error === 'string') {
      return {
        isValid: true,
        type: 'string',
        fallback: error.slice(0, ERROR_LIMITS.MAX_MESSAGE_LENGTH),
      };
    }

    // Try to parse as object
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

    // Sanitize context object
    const sanitized: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(context)) {
      // Validate key format
      if (typeof key === 'string' && key.length <= 50) {
        // Validate value type and sanitize
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
 * Safe sanitized error validation helper
 */
export function validateSanitizedError(
  error: unknown
): z.infer<typeof sanitizedErrorSchema> | null {
  try {
    return sanitizedErrorSchema.parse(error);
  } catch (validationError) {
    logger.error(
      'Sanitized Error Validation: Failed to validate sanitized error',
      validationError instanceof Error ? validationError : new Error(String(validationError)),
      {
        error:
          validationError instanceof z.ZodError
            ? validationError.issues.join(', ')
            : String(validationError),
        errorKeys: typeof error === 'object' && error ? Object.keys(error).length : 0,
        errorType: typeof error,
      }
    );
    return null;
  }
}

/**
 * Type guard for sanitized errors using Zod validation
 */
export function isSanitizedError(obj: unknown): obj is z.infer<typeof sanitizedErrorSchema> {
  return validateSanitizedError(obj) !== null;
}

/**
 * Error type determination helper with validation
 */
export function determineErrorType(error: unknown): z.infer<typeof errorTypeSchema> {
  const validatedError = validateErrorInput(error);

  if (!validatedError.isValid) {
    return 'InternalServerError';
  }

  // Use discriminated union to safely access properties
  let errorData: z.infer<typeof basicErrorSchema> | undefined;
  let fallbackMessage = '';

  if (validatedError.type === 'error') {
    errorData = validatedError.error;
  } else {
    fallbackMessage = validatedError.fallback;
  }

  const errorName = errorData?.name || '';
  const errorMessage = (errorData?.message || fallbackMessage).toLowerCase();

  // Check for specific error types using safe patterns
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
 * Error handler configuration schema
 */
export const errorHandlerConfigSchema = z.object({
  // Context information
  route: z.string().max(500).optional(),
  operation: z.string().max(100).optional(),
  method: z.string().max(10).optional(),
  userId: z.string().max(100).optional(),
  requestId: requestIdSchema.optional(),

  // Response configuration
  includeStack: z.boolean().optional(),
  includeDetails: z.boolean().optional(),
  customMessage: z.string().max(500).optional(),

  // Logging configuration
  logLevel: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).optional(),
  logContext: z.record(nonEmptyString, z.union([z.string(), z.number(), z.boolean()])).optional(),

  // Security configuration
  sanitizeResponse: z.boolean().optional(),
  hideInternalErrors: z.boolean().optional(),
});

/**
 * Standardized error response schema
 */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: nonEmptyString.max(200),
  message: nonEmptyString.max(1000),
  code: nonEmptyString.max(50),
  timestamp: isoDatetimeString,
  requestId: requestIdSchema.optional(),
  details: z
    .array(
      z.object({
        field: z.string().max(100).optional(),
        message: z.string().max(500),
        code: z.string().max(50).optional(),
      })
    )
    .optional(),
  stack: z.string().max(ERROR_LIMITS.MAX_STACK_TRACE_LENGTH).optional(),
  severity: errorSeveritySchema.optional(),
  type: errorTypeSchema.optional(),
});

/**
 * Type exports
 */
export type ErrorSeverity = z.infer<typeof errorSeveritySchema>;
export type ErrorType = z.infer<typeof errorTypeSchema>;
export type ErrorContext = z.infer<typeof errorContextSchema>;
export type BasicError = z.infer<typeof basicErrorSchema>;
export type SanitizedError = z.infer<typeof sanitizedErrorSchema>;
export type ErrorSanitizationResult = z.infer<typeof errorSanitizationResultSchema>;
export type StackTraceSanitization = z.infer<typeof stackTraceSanitizationSchema>;
export type ErrorInput = z.infer<typeof errorInputSchema>;
export type ErrorHandlerConfig = z.infer<typeof errorHandlerConfigSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;
