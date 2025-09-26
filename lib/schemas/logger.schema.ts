/**
 * Logger Validation Schemas
 * Production-grade validation for structured logging operations
 * Ensures log data integrity and prevents injection attacks
 */

import { z } from 'zod';

/**
 * Security constants for logging
 */
const LOGGER_LIMITS = {
  MAX_MESSAGE_LENGTH: 10000,
  MAX_CONTEXT_VALUE_LENGTH: 1000,
  MAX_CONTEXT_KEYS: 50,
  MAX_STACK_TRACE_LENGTH: 50000,
  MAX_ERROR_NAME_LENGTH: 200,
  MAX_ERROR_MESSAGE_LENGTH: 5000,
} as const;

/**
 * Log level validation
 */
export const logLevelSchema = z.enum(['debug', 'info', 'warn', 'error', 'fatal']);

/**
 * Log context validation with security constraints
 */
export const logContextSchema = z
  .record(
    z.string().max(100, 'Context key too long'),
    z.union([z.string(), z.number(), z.boolean()]).refine((value) => {
      if (typeof value === 'string') {
        return value.length <= LOGGER_LIMITS.MAX_CONTEXT_VALUE_LENGTH;
      }
      return true;
    }, 'Context value too long')
  )
  .refine(
    (data) => Object.keys(data).length <= LOGGER_LIMITS.MAX_CONTEXT_KEYS,
    `Too many context keys (max ${LOGGER_LIMITS.MAX_CONTEXT_KEYS})`
  );

/**
 * Error object validation
 */
export const logErrorSchema = z.object({
  name: z.string().max(LOGGER_LIMITS.MAX_ERROR_NAME_LENGTH),
  message: z.string().max(LOGGER_LIMITS.MAX_ERROR_MESSAGE_LENGTH),
  stack: z.string().max(LOGGER_LIMITS.MAX_STACK_TRACE_LENGTH).optional(),
});

/**
 * Complete log object validation
 */
export const logObjectSchema = z
  .object({
    timestamp: z.string().datetime(),
    level: logLevelSchema,
    message: z.string().max(LOGGER_LIMITS.MAX_MESSAGE_LENGTH),
    context: logContextSchema.optional(),
    metadata: logContextSchema.optional(),
    error: logErrorSchema.optional(),
  })
  .strict(); // Only allow defined properties

/**
 * Development log format components validation
 */
export const developmentLogComponentsSchema = z.object({
  timestamp: z.string().datetime(),
  level: logLevelSchema,
  message: z.string().max(LOGGER_LIMITS.MAX_MESSAGE_LENGTH),
  context: logContextSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  error: logErrorSchema.optional(),
});

/**
 * Request context validation for HTTP logging
 */
export const requestContextSchema = z
  .object({
    method: z
      .string()
      .max(10)
      .regex(/^[A-Z]+$/, 'Invalid HTTP method'),
    url: z
      .string()
      .max(2048)
      .regex(/^[^\s<>'"]+$/, 'Invalid URL format'),
    userAgent: z
      .string()
      .max(512)
      // Validate user agent - must not contain control characters
      .refine((val) => {
        // Check for control characters (ASCII 0-31 and 127)
        for (let i = 0; i < val.length; i++) {
          const code = val.charCodeAt(i);
          if ((code >= 0 && code <= 31) || code === 127) {
            return false;
          }
        }
        return true;
      }, 'Invalid user agent: contains control characters'),
    requestId: z
      .string()
      .max(100)
      .regex(/^[a-zA-Z0-9\-_]*$/, 'Invalid request ID'),
    timestamp: z.string().datetime(),
    region: z.string().max(50).optional(),
    deployment: z.string().max(100).optional(),
    environment: z.string().max(20).optional(),
  })
  .strict();

/**
 * Performance timing metadata validation
 */
export const performanceMetadataSchema = z.object({
  duration: z.string().regex(/^\d+\.\d{2}ms$/, 'Invalid duration format'),
  success: z.boolean(),
});

/**
 * Safe log object parser with validation
 */
export function parseLogObject(
  logObject: Record<string, unknown>
): z.infer<typeof logObjectSchema> | null {
  try {
    return logObjectSchema.parse(logObject);
  } catch (error) {
    console.error('Failed to parse log object:', {
      error: error instanceof z.ZodError ? error.issues : String(error),
      objectKeys: Object.keys(logObject),
    });
    return null;
  }
}

/**
 * Safe development log components parser
 */
export function parseDevelopmentLogComponents(
  logObject: Record<string, unknown>
): z.infer<typeof developmentLogComponentsSchema> | null {
  try {
    return developmentLogComponentsSchema.parse(logObject);
  } catch (error) {
    console.error('Failed to parse development log components:', {
      error: error instanceof z.ZodError ? error.issues : String(error),
      objectKeys: Object.keys(logObject),
    });
    return null;
  }
}

/**
 * Sanitize log message to prevent injection attacks
 */
export function sanitizeLogMessage(message: unknown): string {
  if (typeof message !== 'string') {
    return String(message).slice(0, LOGGER_LIMITS.MAX_MESSAGE_LENGTH);
  }

  // Remove potential injection patterns
  // Remove control characters (ASCII 0-31 and 127) for security
  let sanitized = '';
  for (let i = 0; i < message.length; i++) {
    const code = message.charCodeAt(i);
    // Skip control characters
    if ((code >= 0 && code <= 31) || code === 127) {
      continue;
    }
    sanitized += message[i];
  }

  return sanitized
    .replace(/\${.*?}/g, '[TEMPLATE]') // Remove template literals
    .replace(/<script.*?<\/script>/gi, '[SCRIPT]') // Remove script tags
    .slice(0, LOGGER_LIMITS.MAX_MESSAGE_LENGTH);
}

/**
 * Validate and sanitize context data
 */
export function validateLogContext(context: unknown): z.infer<typeof logContextSchema> | null {
  try {
    if (context === null || context === undefined) {
      return null;
    }

    // Ensure context is an object
    if (typeof context !== 'object') {
      return null;
    }

    // Sanitize string values in context
    const sanitized = {} as Record<string, string | number | boolean>;
    for (const [key, value] of Object.entries(context as Record<string, unknown>)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeLogMessage(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      }
      // Skip other types for security
    }

    return logContextSchema.parse(sanitized);
  } catch (error) {
    console.error('Failed to validate log context:', {
      error: error instanceof z.ZodError ? error.issues : String(error),
    });
    return null;
  }
}

/**
 * Type exports
 */
export type LogLevel = z.infer<typeof logLevelSchema>;
export type LogContext = z.infer<typeof logContextSchema>;
export type LogError = z.infer<typeof logErrorSchema>;
export type LogObject = z.infer<typeof logObjectSchema>;
export type DevelopmentLogComponents = z.infer<typeof developmentLogComponentsSchema>;
export type RequestContext = z.infer<typeof requestContextSchema>;
export type PerformanceMetadata = z.infer<typeof performanceMetadataSchema>;
