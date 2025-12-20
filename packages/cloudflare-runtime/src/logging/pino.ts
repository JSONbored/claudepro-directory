/**
 * Pino Logger Configuration for Cloudflare Workers
 *
 * Cloudflare Workers automatically capture console.log output as structured logs.
 * This module provides a Pino logger configured for Workers that outputs
 * structured JSON logs compatible with Workers Logs.
 */

import pino from 'pino';

/**
 * Create Pino logger for Cloudflare Workers
 *
 * Workers Logs automatically captures console output, so we configure Pino
 * to output to console with structured JSON format.
 *
 * @param options - Logger options
 * @returns Pino logger instance
 */
export function createLogger(options: { level?: string; name?: string } = {}) {
  const { level = 'info', name = 'heyclaude-mcp' } = options;

  // Pino configuration for Cloudflare Workers
  // Workers Logs automatically captures console output, so no transport needed
  return pino({
    name,
    level,
    // Use structured JSON format for Workers Logs
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    // Timestamp in ISO format
    timestamp: pino.stdTimeFunctions.isoTime,
    // Redact sensitive fields
    redact: ['password', 'token', 'authorization', 'cookie', 'secret'],
  });
}

/**
 * Default logger instance
 *
 * Create a default logger that can be used throughout the application.
 * For request-scoped logging, create child loggers using logger.child().
 */
export const logger = createLogger();

/**
 * Logger type for use in function signatures
 */
export type Logger = ReturnType<typeof createLogger>;
