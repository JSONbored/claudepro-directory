/**
 * Generators Logger
 * 
 * Pino logger instance for CLI generators with centralized configuration.
 * All generator commands should use this logger for consistent structured logging.
 * 
 * Uses Pino with centralized configuration for:
 * - Error serialization (via stdSerializers.err)
 * - Sensitive data redaction (via redact option in config)
 * - ISO timestamps
 * - Base context (env, service)
 * 
 * @module generators/toolkit/logger
 */

import { createPinoConfig, normalizeError } from '@heyclaude/shared-runtime';
import pino from 'pino';

// Create Pino logger instance with centralized configuration
// For CLI tools, we use a pretty-printed format for better readability
const pinoLogger = pino(
  createPinoConfig({
    service: 'generators',
    // For CLI, we can add pretty printing if needed via transport
    // For now, structured JSON is fine (can be piped to jq for formatting)
  })
);

type LogMeta = Record<string, unknown> | undefined;

/**
 * Generators Logger
 * Compatible with previous logger interface, now using Pino
 */
export const logger = {
  /**
   * Log a message at info level
   */
  info(message: string, meta?: LogMeta) {
    // Pino handles redaction automatically via config
    pinoLogger.info(meta ?? {}, message);
  },

  /**
   * Log a message at warn level
   */
  warn(message: string, meta?: LogMeta) {
    // Pino handles redaction automatically via config
    pinoLogger.warn(meta ?? {}, message);
  },

  /**
   * Log an error message with optional error object
   */
  error(message: string, error?: unknown, meta?: LogMeta) {
    // Pino's stdSerializers.err automatically handles error serialization
    const logData: Record<string, unknown> = { ...meta };
    if (error !== undefined && error !== null) {
      const errorObj = normalizeError(error, message);
      logData['err'] = errorObj;
    }
    pinoLogger.error(logData, message);
  },

  /**
   * Log a message at debug level
   */
  debug(message: string, meta?: LogMeta) {
    // Pino handles level filtering automatically
    pinoLogger.debug(meta ?? {}, message);
  },

  /**
   * Log plain output for CLI tools (console.log equivalent)
   * Used for help text, prompts, and unstructured CLI output
   */
  log(...args: unknown[]) {
    // For CLI output, use console.log directly for plain text
    // This is intentional for CLI tools that need unstructured output
    // biome-ignore lint/suspicious/noConsole: CLI tools need plain console output
    console.log(...args);
  },
};
