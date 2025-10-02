/**
 * Logger Validation Schemas
 * Production-grade validation for structured logging operations
 * Ensures log data integrity and prevents injection attacks
 */

import { z } from 'zod';
import { isoDatetimeString, nonEmptyString } from '@/lib/schemas/primitives/base-strings';

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
export const logLevelSchema = z
  .enum(['debug', 'info', 'warn', 'error', 'fatal'])
  .describe('Log severity level for structured logging operations');

/**
 * Log context validation with security constraints
 */
export const logContextSchema = z
  .record(
    nonEmptyString.max(100, 'Context key too long').describe('Context key identifier'),
    z
      .union([
        z.string().describe('String context value'),
        z.number().describe('Numeric context value'),
        z.boolean().describe('Boolean context value'),
      ])
      .describe('Context value supporting string, number, or boolean types')
      .refine((value) => {
        if (typeof value === 'string') {
          return value.length <= LOGGER_LIMITS.MAX_CONTEXT_VALUE_LENGTH;
        }
        return true;
      }, 'Context value too long')
  )
  .describe('Key-value pairs providing contextual information for log entries')
  .refine(
    (data) => Object.keys(data).length <= LOGGER_LIMITS.MAX_CONTEXT_KEYS,
    `Too many context keys (max ${LOGGER_LIMITS.MAX_CONTEXT_KEYS})`
  );

/**
 * Log entry schema for structured logging
 */
export const logEntrySchema = z
  .object({
    level: logLevelSchema.describe('Severity level of the log entry'),
    message: nonEmptyString
      .max(LOGGER_LIMITS.MAX_MESSAGE_LENGTH)
      .describe('Primary log message content'),
    context: logContextSchema.optional().describe('Optional contextual key-value data'),
    error: z
      .union([
        z.instanceof(Error).describe('Native Error object'),
        z.string().max(LOGGER_LIMITS.MAX_ERROR_MESSAGE_LENGTH).describe('Error message string'),
      ])
      .optional()
      .describe('Optional error information for exception logging'),
    metadata: z
      .record(
        nonEmptyString.describe('Metadata key'),
        z
          .union([
            z.string().describe('String metadata value'),
            z.number().describe('Numeric metadata value'),
            z.boolean().describe('Boolean metadata value'),
          ])
          .describe('Metadata value')
      )
      .optional()
      .describe('Additional metadata key-value pairs for the log entry'),
  })
  .describe('Complete log entry structure for application logging');

export type LogEntry = z.infer<typeof logEntrySchema>;

/**
 * Error object validation
 */
export const logErrorSchema = z
  .object({
    name: nonEmptyString
      .max(LOGGER_LIMITS.MAX_ERROR_NAME_LENGTH)
      .describe('Error type or class name'),
    message: nonEmptyString
      .max(LOGGER_LIMITS.MAX_ERROR_MESSAGE_LENGTH)
      .describe('Error message describing what went wrong'),
    stack: z
      .string()
      .max(LOGGER_LIMITS.MAX_STACK_TRACE_LENGTH)
      .optional()
      .describe('Optional stack trace for debugging'),
  })
  .describe('Structured error object for consistent error logging');

/**
 * Complete log object validation
 */
export const logObjectSchema = z
  .object({
    timestamp: isoDatetimeString.describe('ISO 8601 timestamp when the log was created'),
    level: logLevelSchema.describe('Log severity level'),
    message: z.string().max(LOGGER_LIMITS.MAX_MESSAGE_LENGTH).describe('Log message content'),
    context: logContextSchema.optional().describe('Optional contextual data'),
    metadata: logContextSchema.optional().describe('Optional additional metadata'),
    error: logErrorSchema.optional().describe('Optional error information'),
  })
  .strict()
  .describe('Complete validated log object for production logging'); // Only allow defined properties

/**
 * Development log format components validation
 */
export const developmentLogComponentsSchema = z
  .object({
    timestamp: isoDatetimeString.describe('ISO 8601 timestamp of the log event'),
    level: logLevelSchema.describe('Log severity level'),
    message: z.string().max(LOGGER_LIMITS.MAX_MESSAGE_LENGTH).describe('Log message text'),
    context: logContextSchema.optional().describe('Optional context information'),
    metadata: z
      .record(nonEmptyString.describe('Metadata key'), z.unknown().describe('Any metadata value'))
      .optional()
      .describe('Optional metadata with flexible value types for development'),
    error: logErrorSchema.optional().describe('Optional error details'),
  })
  .describe('Log components used in development environment with relaxed validation');

/**
 * Request context validation for HTTP logging
 */
export const requestContextSchema = z
  .object({
    method: nonEmptyString
      .max(10)
      .regex(/^[A-Z]+$/, 'Invalid HTTP method')
      .describe('HTTP method (GET, POST, PUT, DELETE, etc.)'),
    url: nonEmptyString
      .max(2048)
      .regex(/^[^\s<>'"]+$/, 'Invalid URL format')
      .describe('Request URL path'),
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
      }, 'Invalid user agent: contains control characters')
      .describe('Client user agent string'),
    requestId: nonEmptyString
      .max(100)
      .regex(/^[a-zA-Z0-9\-_]*$/, 'Invalid request ID')
      .describe('Unique identifier for request tracing'),
    timestamp: isoDatetimeString.describe('ISO 8601 timestamp of the request'),
    region: z.string().max(50).optional().describe('Geographic region of the request'),
    deployment: z.string().max(100).optional().describe('Deployment identifier or environment'),
    environment: z
      .string()
      .max(20)
      .optional()
      .describe('Environment name (production, staging, etc.)'),
  })
  .strict()
  .describe('HTTP request context for structured request logging');

/**
 * Performance timing metadata validation
 */
export const performanceMetadataSchema = z
  .object({
    duration: z
      .string()
      .regex(/^\d+\.\d{2}ms$/, 'Invalid duration format')
      .describe('Execution duration in milliseconds (formatted as "123.45ms")'),
    success: z.boolean().describe('Whether the operation completed successfully'),
  })
  .describe('Performance metrics for operation timing and success tracking');

/**
 * Safe log object parser with validation
 */
export function parseLogObject(
  logObject: Record<string, unknown>
): { success: true; data: z.infer<typeof logObjectSchema> } | { success: false; error: string } {
  try {
    const parsed = logObjectSchema.parse(logObject);
    return { success: true, data: parsed };
  } catch {
    return { success: false, error: 'Validation failed' };
  }
}

/**
 * Safe development log components parser
 */
export function parseDevelopmentLogComponents(
  logObject: Record<string, unknown>
):
  | { success: true; data: z.infer<typeof developmentLogComponentsSchema> }
  | { success: false; error: string } {
  try {
    const parsed = developmentLogComponentsSchema.parse(logObject);
    return { success: true, data: parsed };
  } catch {
    return { success: false, error: 'Validation failed' };
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
  } catch {
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
