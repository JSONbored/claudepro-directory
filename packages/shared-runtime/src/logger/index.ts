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
import { createPinoConfig } from '@heyclaude/shared-runtime/logger/config.ts';

/**
 * Create a Pino logger instance with centralized configuration
 * 
 * Supports ALL Pino features via the comprehensive PinoConfigOptions interface.
 * 
 * **Important:** The `destination` parameter is NOT a config option - it's passed as the second argument.
 * Use this function's second parameter for destinations (files, streams, etc.).
 * 
 * @param options - Optional configuration overrides (includes EVERY Pino feature)
 * @param destination - Optional destination stream/file (use `pino.destination()` or `pino.multistream()`)
 * @returns Pino logger instance with all features available
 * 
 * @remarks
 * **Performance:** By default, logs to stdout/stderr (async, optimal performance).
 * For file logging, use `pino.destination()` for optimal performance (uses SonicBoom).
 * 
 * **Vercel Compatibility:** Default destination (stdout) works perfectly with Vercel logs.
 * No additional configuration needed - all JSON logs are automatically captured.
 * 
 * **Future-Proof for External Services:**
 * - Use `transport` option in config for external services (Datadog, BetterStack, etc.)
 * - Or use `destination` parameter for file logging
 * - Both can be used together (transport for external, destination for local)
 * 
 * @example
 * ```typescript
 * import { createLogger } from '@heyclaude/shared-runtime/logger';
 * 
 * // Basic usage (logs to stdout - works with Vercel)
 * const logger = createLogger({ service: 'my-service' });
 * logger.info({ userId: '123' }, 'Hello world');
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
 * // Advanced: File destination (CORRECT way)
 * import { destination } from 'pino';
 * const fileLogger = createLogger(
 *   { service: 'file-logger' },
 *   destination('./app.log') // Second parameter, not in options!
 * );
 * 
 * // Advanced: Multiple destinations (CORRECT way)
 * import { multistream } from 'pino';
 * const multiLogger = createLogger(
 *   { service: 'multi' },
 *   multistream([
 *     { stream: process.stdout, level: 'info' },
 *     { stream: process.stderr, level: 'error' }
 *   ]) // Second parameter, not in options!
 * );
 * 
 * // Advanced: Transport (for external services)
 * const transportLogger = createLogger({
 *   service: 'transport',
 *   transport: {
 *     target: 'pino-pretty', // Development only
 *     options: { colorize: true }
 *   }
 * });
 * 
 * // Advanced: Transport + Destination (both together)
 * const hybridLogger = createLogger(
 *   {
 *     service: 'hybrid',
 *     transport: {
 *       target: 'pino-datadog-transport',
 *       options: { ddClientConf: { ... } }
 *     }
 *   },
 *   destination('./local.log') // Also log to file
 * );
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
 * 
 * @see {@link https://getpino.io/#/docs/api#pino-options-destination | Pino Destination Documentation}
 * @see {@link https://getpino.io/#/docs/api#pino-destination | pino.destination()}
 * @see {@link https://getpino.io/#/docs/api#pino-multistream | pino.multistream()}
 */
export function createLogger(
  options?: Parameters<typeof createPinoConfig>[0],
  destination?: pino.DestinationStream
): pino.Logger {
  const config = createPinoConfig(options);
  return destination ? pino(config, destination) : pino(config);
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
} from '@heyclaude/shared-runtime/logger/config.ts';

// Re-export Pino utilities for advanced usage
export { 
  destination as pinoDestination,
  multistream as pinoMultistream,
  transport as pinoTransport,
  stdSerializers,
  stdTimeFunctions
} from 'pino';

/**
 * About pino-pretty:
 * 
 * pino-pretty is a development tool that formats Pino's JSON logs into human-readable, colorized output.
 * 
 * **Usage:**
 * - Development only (not for production)
 * - As transport: `transport: { target: 'pino-pretty', options: { colorize: true } }`
 * - As CLI: `node app.js | pino-pretty`
 * 
 * **Installation:** `npm install -D pino-pretty`
 * 
 * @see {@link https://github.com/pinojs/pino-pretty | pino-pretty GitHub}
 * 
 * About pino-final:
 * 
 * pino-final is a separate package for handling logger finalization on process exit.
 * It ensures logs are flushed before the process exits.
 * 
 * **Note:** Pino v7+ transports already handle this automatically via `process.on('beforeExit')` and `process.on('exit')` listeners.
 * You only need pino-final if:
 * - You're using Pino v6 or earlier
 * - You need custom exit handling beyond what transports provide
 * 
 * **Installation:** `npm install pino-final`
 * 
 * **Usage:**
 * ```typescript
 * import pinoFinal from 'pino-final';
 * const finalLogger = pinoFinal(logger, (err, finalLogger) => {
 *   finalLogger.info('Process exiting');
 *   process.exit(err ? 1 : 0);
 * });
 * ```
 * 
 * @see {@link https://github.com/pinojs/pino-final | pino-final GitHub}
 */
