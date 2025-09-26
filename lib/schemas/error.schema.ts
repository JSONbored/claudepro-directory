/**
 * Error Validation Schemas
 * Production-grade validation for error sanitization and handling
 * Protects against error injection and ensures consistent error structure
 */

import { z } from 'zod';

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
  message: z.string().max(ERROR_LIMITS.MAX_MESSAGE_LENGTH),
  stack: z.string().max(ERROR_LIMITS.MAX_STACK_TRACE_LENGTH).optional(),
});

/**
 * Error input validation - handles unknown error types
 */
export const errorInputSchema = z.union([
  basicErrorSchema,
  z.string().max(ERROR_LIMITS.MAX_MESSAGE_LENGTH, 'Error message is too long'),
  z.record(z.string(), z.unknown()),
  z.unknown(),
]);

/**
 * Sanitized error response schema
 */
export const sanitizedErrorSchema = z.object({
  error: z.string().min(1).max(200),
  message: z.string().max(200),
  code: z.string().regex(/^[A-Z]{3}_[A-Z0-9]{8,12}$/, 'Invalid error code format'),
  timestamp: z.string().datetime(),
  requestId: z.string().min(1).max(100),
  severity: errorSeveritySchema,
});

/**
 * Error sanitization result schema
 */
export const errorSanitizationResultSchema = z.object({
  sanitized: z.string().max(ERROR_LIMITS.MAX_MESSAGE_LENGTH),
  removed: z.array(z.string()).max(100),
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
 * Safe error input validation helper
 */
export function validateErrorInput(error: unknown): {
  isValid: boolean;
  error?: z.infer<typeof basicErrorSchema>;
  fallback?: string;
} {
  try {
    // Try to parse as Error object first
    if (error instanceof Error) {
      const validated = basicErrorSchema.parse({
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      return { isValid: true, error: validated };
    }

    // Try to parse as string
    if (typeof error === 'string') {
      return { isValid: true, fallback: error.slice(0, ERROR_LIMITS.MAX_MESSAGE_LENGTH) };
    }

    // Try to parse as object
    if (error && typeof error === 'object') {
      const obj = error as Record<string, unknown>;
      if ('message' in obj && typeof obj.message === 'string') {
        const validated = basicErrorSchema.parse({
          name: typeof obj.name === 'string' ? obj.name : 'Error',
          message: obj.message,
          stack: typeof obj.stack === 'string' ? obj.stack : undefined,
        });
        return { isValid: true, error: validated };
      }
    }

    return { isValid: false, fallback: 'Unknown error occurred' };
  } catch (validationError) {
    console.error('[Error Validation] Failed to validate error input:', {
      validationError:
        validationError instanceof z.ZodError ? validationError.issues : String(validationError),
      errorType: typeof error,
      errorConstructor: error?.constructor?.name,
    });
    return { isValid: false, fallback: 'Error validation failed' };
  }
}

/**
 * Safe error context validation helper
 */
export function validateErrorContext(context: unknown): z.infer<typeof errorContextSchema> | null {
  try {
    if (!context || typeof context !== 'object') {
      return null;
    }

    // Sanitize context object
    const sanitized: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(context as Record<string, unknown>)) {
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
    console.error('[Error Context Validation] Failed to validate context:', {
      error: error instanceof z.ZodError ? error.issues : String(error),
      contextType: typeof context,
    });
    return null;
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
    console.error('[Sanitized Error Validation] Failed to validate sanitized error:', {
      error:
        validationError instanceof z.ZodError ? validationError.issues : String(validationError),
      errorKeys: typeof error === 'object' && error ? Object.keys(error) : 'not-object',
    });
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

  const errorData = validatedError.error;
  const fallbackMessage = validatedError.fallback || '';

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
