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

import pino from 'pino';
import { createPinoConfig } from '@heyclaude/shared-runtime/logger/config';

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
  info(message: string, meta?: LogMeta) {
    // Pino handles redaction automatically via config
    pinoLogger.info(meta || {}, message);
  },

  warn(message: string, meta?: LogMeta) {
    // Pino handles redaction automatically via config
    pinoLogger.warn(meta || {}, message);
  },

  error(message: string, error?: unknown, meta?: LogMeta) {
    // Pino's stdSerializers.err automatically handles error serialization
    const logData: Record<string, unknown> = { ...(meta || {}) };
    if (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logData['err'] = errorObj;
    }
    pinoLogger.error(logData, message);
  },

  debug(message: string, meta?: LogMeta) {
    // Pino handles level filtering automatically
    pinoLogger.debug(meta || {}, message);
  },
};
