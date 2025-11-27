/**
 * Shared Runtime Logger
 * 
 * Exports the centralized logger configuration and factory functions.
 * All packages should use this for consistent logging across the codebase.
 * 
 * Includes all Pino features:
 * - Native redaction
 * - Standard serializers
 * - Formatters
 * - Hooks (logMethod, onChild, streamWrite)
 * - Mixin for dynamic context
 * - Child logger support with bindings
 * 
 * @module shared-runtime/logger
 */

import pino from 'pino';
import { createPinoConfig } from './config.ts';

/**
 * Create a Pino logger instance with centralized configuration
 * 
 * Supports ALL Pino features via the comprehensive PinoConfigOptions interface.
 * 
 * @param options - Optional configuration overrides (includes EVERY Pino feature)
 * @returns Pino logger instance with all features available
 * 
 * @example
 * ```typescript
 * import { createLogger } from '@heyclaude/shared-runtime/logger';
 * 
 * // Basic usage
 * const logger = createLogger({ service: 'my-service' });
 * logger.info('Hello world', { userId: '123' });
 * logger.error({ err: new Error('Something went wrong') }, 'Error occurred');
 * 
 * // Create child logger with additional context
 * const childLogger = logger.child({ requestId: 'req-123' });
 * childLogger.info('Processing request');
 * 
 * // Update bindings dynamically
 * childLogger.setBindings({ userId: 'user-456' });
 * childLogger.info('User action');
 * 
 * // Advanced: Custom levels
 * const auditLogger = createLogger({
 *   service: 'audit',
 *   customLevels: { audit: 35, security: 55 },
 *   level: 'audit'
 * });
 * auditLogger.audit('User action logged');
 * 
 * // Advanced: Custom serializers
 * const apiLogger = createLogger({
 *   service: 'api',
 *   serializers: {
 *     user: (user) => ({ id: user.id, email: user.email }),
 *   }
 * });
 * 
 * // Advanced: File destination
 * import { destination } from 'pino';
 * const fileLogger = createLogger({
 *   service: 'file-logger',
 *   destination: destination('./app.log')
 * });
 * 
 * // Advanced: Multiple destinations
 * import { multistream } from 'pino';
 * const multiLogger = createLogger({
 *   service: 'multi',
 *   destination: multistream([
 *     { stream: process.stdout, level: 'info' },
 *     { stream: process.stderr, level: 'error' }
 *   ])
 * });
 * 
 * // Advanced: Transport
 * const transportLogger = createLogger({
 *   service: 'transport',
 *   transport: {
 *     target: 'pino-pretty',
 *     options: { colorize: true }
 *   }
 * });
 * 
 * // Advanced: Browser transmit
 * const browserLogger = createLogger({
 *   service: 'browser',
 *   browser: {
 *     transmit: {
 *       level: 'error',
 *       send: (level, logEvent) => {
 *         fetch('/api/logs', {
 *           method: 'POST',
 *           body: JSON.stringify(logEvent)
 *         });
 *       }
 *     }
 *   }
 * });
 * ```
 */
export function createLogger(options?: Parameters<typeof createPinoConfig>[0]): pino.Logger {
  return pino(createPinoConfig(options));
}

/**
 * Default logger instance
 * Use this for simple logging needs
 * 
 * @example
 * ```typescript
 * import { logger } from '@heyclaude/shared-runtime/logger';
 * 
 * logger.info('Hello world');
 * logger.error({ err: new Error('Something went wrong') }, 'Error occurred');
 * 
 * // Access bindings
 * const bindings = logger.bindings();
 * 
 * // Update bindings dynamically
 * logger.setBindings({ correlationId: 'corr-123' });
 * ```
 */
export const logger = createLogger();

// Re-export config for advanced usage
export { 
  createPinoConfig, 
  SENSITIVE_PATTERNS, 
  BASE_CONTEXT,
  type PinoConfigOptions 
} from './config.ts';

// Re-export Pino utilities for advanced usage
export { 
  destination as pinoDestination,
  multistream as pinoMultistream,
  transport as pinoTransport,
  stdSerializers,
  stdTimeFunctions
} from 'pino';

// Note: pino.final is a separate package 'pino-final' - import separately if needed
// import pinoFinal from 'pino-final';
