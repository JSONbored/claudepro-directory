/**
 * Edge Runtime Logger
 * 
 * Logger wrapper for edge-runtime utilities with consistent API.
 * Uses the same wrapper pattern as shared-runtime but with service='edge-runtime'
 * to properly identify logs from edge runtime utilities.
 * 
 * The logger wrapper provides a message-first API:
 * - logger.info(message, context?)
 * - logger.error(message, error?, context?)
 * - logger.warn(message, context?)
 * 
 * Pino automatically handles:
 * - Error serialization (via stdSerializers.err)
 * - Sensitive data redaction (via redact option in config)
 * - ISO timestamps
 * - Base context (env, service='edge-runtime')
 * - Mixin function automatically injects bindings (requestId, operation, userId, etc.)
 * 
 * @module edge-runtime/utils/logger
 */

import pino from 'pino';
import { createPinoConfig, normalizeError } from '@heyclaude/shared-runtime';

// Create Pino logger instance with edge-runtime service name
// This ensures logs from edge-runtime utilities are properly identified
const pinoLogger = pino(createPinoConfig({ service: 'edge-runtime' }));

/**
 * Logger wrapper with message-first API (consistent with shared-runtime)
 * This ensures all edge runtime utilities use the same logger API pattern
 */
export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.info(context || {}, message);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.warn(context || {}, message);
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const logData: Record<string, unknown> = { ...(context || {}) };
    if (error) {
      // Use normalizeError() for consistent error normalization across codebase
      // Pino's stdSerializers.err will automatically serialize the Error object
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
    }
    pinoLogger.error(logData, message);
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.debug(context || {}, message);
  },
  trace: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.trace(context || {}, message);
  },
  fatal: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const logData: Record<string, unknown> = { ...(context || {}) };
    if (error) {
      // Use normalizeError() for consistent error normalization across codebase
      // Pino's stdSerializers.err will automatically serialize the Error object
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
    }
    pinoLogger.fatal(logData, message);
  },
  /**
   * Get current logger bindings (context that will be included in all logs)
   */
  bindings: (): Record<string, unknown> => {
    return pinoLogger.bindings();
  },
  /**
   * Update logger bindings dynamically (adds to existing bindings)
   * 
   * @deprecated Use child() instead to avoid race conditions in concurrent environments.
   * setBindings() mutates shared state which can cause issues when handling multiple
   * concurrent requests. Create a child logger with request-specific context instead:
   * 
   * @example
   * ```typescript
   * // ❌ Avoid: Shared state, race condition risk
   * logger.setBindings({ requestId: 'req-123' });
   * 
   * // ✅ Preferred: Isolated context per request
   * const requestLogger = logger.child({ requestId: 'req-123' });
   * ```
   */
  setBindings: (bindings: Record<string, unknown>): void => {
    // Warn in development mode about deprecation
    if (typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'development') {
      console.warn(
        '[Logger] setBindings() is deprecated. Use child() instead to avoid race conditions in concurrent environments.'
      );
    }
    pinoLogger.setBindings(bindings);
  },
  /**
   * Create a child logger with request-scoped context
   * 
   * Use this instead of setBindings() to avoid race conditions in concurrent environments.
   * Each child logger has its own isolated context that won't interfere with other requests.
   * 
   * @param bindings - Key-value pairs to add to child logger context
   * @returns Child logger with merged context
   * 
   * @example
   * ```typescript
   * const requestLogger = logger.child({ requestId: 'req-123', userId: 'user-456' });
   * requestLogger.info('Processing request'); // Includes requestId and userId
   * ```
   */
  child: (bindings: Record<string, unknown>) => {
    const childPino = pinoLogger.child(bindings);
    // Return a wrapped child logger with the same message-first API
    return {
      info: (message: string, context?: Record<string, unknown>) => {
        childPino.info(context || {}, message);
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        childPino.warn(context || {}, message);
      },
      error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
        const logData: Record<string, unknown> = { ...(context || {}) };
        if (error) {
          const normalized = normalizeError(error, message);
          logData['err'] = normalized;
        }
        childPino.error(logData, message);
      },
      debug: (message: string, context?: Record<string, unknown>) => {
        childPino.debug(context || {}, message);
      },
      trace: (message: string, context?: Record<string, unknown>) => {
        childPino.trace(context || {}, message);
      },
      fatal: (message: string, error?: unknown, context?: Record<string, unknown>) => {
        const logData: Record<string, unknown> = { ...(context || {}) };
        if (error) {
          const normalized = normalizeError(error, message);
          logData['err'] = normalized;
        }
        childPino.fatal(logData, message);
      },
      bindings: (): Record<string, unknown> => childPino.bindings(),
      flush: (callback?: (err?: Error) => void): void => childPino.flush(callback),
      isLevelEnabled: (level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean => 
        childPino.isLevelEnabled(level),
    };
  },
  /**
   * Flush buffered logs synchronously
   */
  flush: (callback?: (err?: Error) => void): void => {
    pinoLogger.flush(callback);
  },
  /**
   * Check if a log level is enabled
   */
  isLevelEnabled: (level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean => {
    return pinoLogger.isLevelEnabled(level);
  },
};
