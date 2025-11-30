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
 * **Vercel Compatibility:**
 * - Uses level-routing destination to ensure warn/error logs go to stderr
 * - Vercel categorizes logs by output stream: stdout=info, stderr=error
 * - This ensures warn/error logs appear correctly in Vercel's log dashboard
 * 
 * @module shared-runtime/logger
 */

import pino from 'pino';

import { createPinoConfig } from './config.ts';

/**
 * Creates a destination stream that uses console methods for proper Vercel log level detection.
 * 
 * **Why this is needed:**
 * Vercel determines log levels by which CONSOLE METHOD is used:
 * - console.log() → info (gray)
 * - console.warn() → warning (orange in streaming functions)
 * - console.error() → error (red)
 * 
 * Pino by default writes everything to stdout, which Vercel sees as "info".
 * This destination uses the actual console methods so Vercel properly detects log levels.
 * 
 * **Performance:**
 * Uses a fast regex to find the levelValue in the JSON without full parsing.
 * The levelValue is added by our formatter: `{ "level": "error", "levelValue": 50, ... }`
 * 
 * @returns A Pino-compatible destination stream, or undefined if in browser environment
 */
function createVercelCompatibleDestination(): pino.DestinationStream | undefined {
  // Only use in Node.js server environment
  // Browser environment already uses console methods via Pino's browser config
   
  if (globalThis.window !== undefined) {
    return undefined;
  }
  
  return {
    write(chunk: string) {
      // Quick regex to find levelValue in the JSON (added by our formatter)
      // Our formatter outputs: { "level": "info", "levelValue": 30, ... }
      // Level values: trace=10, debug=20, info=30, warn=40, error=50, fatal=60
      const levelMatch = /"levelValue"\s*:\s*(\d+)/.exec(chunk);
      const levelValue = levelMatch?.[1] === undefined 
        ? 30 
        : Number.parseInt(levelMatch[1], 10);
      
      // Remove trailing newline for cleaner console output
      const logLine = chunk.trimEnd();
      
      // Use console methods for proper Vercel log level detection
      // console.warn → warning (orange) in streaming functions
      // console.error → error (red)
      // console.log → info (gray)
      /* eslint-disable architectural-rules/no-console-in-production-enhanced -- Required for Vercel log level detection */
      if (levelValue >= 50) { // error=50, fatal=60
        console.error(logLine);
      } else if (levelValue >= 40) { // warn=40
        console.warn(logLine);
      } else {
        console.log(logLine);
      }
      /* eslint-enable architectural-rules/no-console-in-production-enhanced */
    },
  } as pino.DestinationStream;
}

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
 * // Audit & Security logging (use structured tags, not custom levels)
 * // This approach works with standard Pino types and any log aggregator
 * logger.info('User action logged', { audit: true, userId: 'user-123', action: 'login' });
 * logger.error('Security violation', { securityEvent: true, severity: 'high', ... });
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
  
  // If custom destination provided, use it
  if (destination) {
    // eslint-disable-next-line architectural-rules/detect-outdated-logging-patterns -- This is the intended usage: createPinoConfig() returns config, pino() creates the logger
    return pino(config, destination);
  }
  
  // Create Vercel-compatible destination that uses console methods
  // This ensures Vercel properly detects log levels:
  // - console.error() → error (red)
  // - console.warn() → warning (orange in streaming functions)
  // - console.log() → info (gray)
  const vercelDest = createVercelCompatibleDestination();
  
  if (vercelDest) {
    // eslint-disable-next-line architectural-rules/detect-outdated-logging-patterns -- This is the intended usage: createPinoConfig() returns config, pino() creates the logger
    return pino(config, vercelDest);
  }
  
  // Browser/Edge fallback: use default Pino destination (stdout)
  // eslint-disable-next-line architectural-rules/detect-outdated-logging-patterns -- This is the intended usage: createPinoConfig() returns config, pino() creates the logger
  return pino(config);
}

/**
 * Default logger instance
 * Use this for simple logging needs
 * 
 * **Vercel Compatibility:**
 * - Uses level-routing destination by default
 * - warn/error/fatal logs go to stderr (shown as error in Vercel)
 * - trace/debug/info logs go to stdout (shown as info in Vercel)
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

// ============================================================================
// Graceful Shutdown Handler
// ============================================================================

/**
 * Flag to track if shutdown handlers have been registered
 * Prevents duplicate registration in case this module is imported multiple times
 */
let shutdownHandlersRegistered = false;

/**
 * Flush logs synchronously before exit
 * Uses a callback-based approach for maximum compatibility
 */
function flushAndExit(signal: string): void {
  // Log the shutdown signal (this log will be flushed)
  // Pino API is object-first, but we structure it to emphasize the message
  // eslint-disable-next-line architectural-rules/enforce-message-first-logger-api -- Pino's native API is object-first
  logger.info({ signal }, 'Process shutting down, flushing logs...');
  
  // Flush all buffered logs
  logger.flush((err?: Error) => {
    if (err) {
      // Use console.error as a last resort since logger may not work
      // This is inside a flush callback, so the rule allows it (checks for 'flush' in surrounding text)
      console.error('Failed to flush logs on shutdown:', err);
    }
    
    // Exit process after flush completes (only for termination signals, not beforeExit)
    if (signal === 'SIGTERM' || signal === 'SIGINT') {
      // eslint-disable-next-line unicorn/no-process-exit, n/no-process-exit -- Intentional process termination after signal
      process.exit(err ? 1 : 0);
    }
  });
}

/**
 * Register graceful shutdown handlers for the logger
 * 
 * This ensures all buffered logs are flushed before the process exits.
 * Handlers are registered for:
 * - `beforeExit`: Normal exit (all work done, event loop empty)
 * - `SIGTERM`: Container/orchestrator shutdown signal
 * - `SIGINT`: Ctrl+C interrupt signal
 * 
 * **Note:** These handlers are automatically registered when this module is imported.
 * They are idempotent (only registered once even if module is imported multiple times).
 * 
 * **Vercel Note:** Vercel's infrastructure handles log flushing automatically,
 * but these handlers provide additional safety for local development and
 * self-hosted deployments.
 */
function registerShutdownHandlers(): void {
  // Only run in Node.js environment (not browser)
  if (typeof process === 'undefined' || typeof process.on !== 'function') {
    return;
  }

  // Prevent duplicate registration
  if (shutdownHandlersRegistered) {
    return;
  }
  shutdownHandlersRegistered = true;

  // Register handlers
  // beforeExit: Fired when Node.js empties the event loop and has no additional work to schedule
  process.on('beforeExit', () => {
    flushAndExit('beforeExit');
  });

  // SIGTERM: Standard termination signal (used by Docker, Kubernetes, Vercel, etc.)
  process.on('SIGTERM', () => {
    flushAndExit('SIGTERM');
  });

  // SIGINT: Interrupt signal (Ctrl+C in terminal)
  process.on('SIGINT', () => {
    flushAndExit('SIGINT');
  });
}

// Automatically register shutdown handlers when this module is imported
registerShutdownHandlers();

/**
 * Manually flush all buffered logs
 * 
 * Use this in critical paths (e.g., before throwing an error that will crash the process)
 * to ensure all logs are written.
 * 
 * @param callback - Optional callback when flush completes
 * 
 * @example
 * ```typescript
 * import { flushLogs } from '@heyclaude/shared-runtime/logger';
 * 
 * // Flush before critical error
 * logger.error('Critical error occurred');
 * flushLogs(() => {
 *   process.exit(1);
 * });
 * ```
 */
export function flushLogs(callback?: (err?: Error) => void): void {
  logger.flush(callback);
}

// ============================================================================
// Conditional Logging Utilities
// ============================================================================

/**
 * Log levels and their numeric values
 * Use these for conditional logging checks
 */
export const LOG_LEVELS = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

/**
 * Check if a log level is enabled for a logger
 * 
 * Use this to avoid expensive computations when the log level is disabled.
 * This prevents unnecessary work when debug/trace logging is off.
 * 
 * @param loggerInstance - The Pino logger instance to check
 * @param level - The log level to check (trace, debug, info, warn, error, fatal)
 * @returns true if the level is enabled, false otherwise
 * 
 * @example
 * ```typescript
 * import { logger, isLevelEnabled } from '@heyclaude/shared-runtime/logger';
 * 
 * // Basic usage - avoid expensive computation when debug is disabled
 * if (isLevelEnabled(logger, 'debug')) {
 *   const debugData = computeExpensiveDebugInfo(); // Only runs if debug is enabled
 *   logger.debug({ data: debugData }, 'Debug info');
 * }
 * 
 * // For trace-level logging with heavy data processing
 * if (isLevelEnabled(logger, 'trace')) {
 *   const traceDetails = {
 *     memoryUsage: process.memoryUsage(),
 *     fullRequest: serializeFullRequest(req), // expensive operation
 *   };
 *   logger.trace(traceDetails, 'Request trace');
 * }
 * ```
 * 
 * @remarks
 * **When to use:**
 * - Before expensive string interpolation or object creation
 * - Before database queries or API calls for debug data
 * - Before complex object serialization
 * 
 * **When NOT needed:**
 * - Simple log calls without expensive data preparation
 * - Error logging (usually always enabled)
 * - Info-level logs in production
 * 
 * @see {@link https://getpino.io/#/docs/api#logger-islevelenabled-level | Pino isLevelEnabled}
 */
export function isLevelEnabled(loggerInstance: pino.Logger, level: LogLevel): boolean {
  return loggerInstance.isLevelEnabled(level);
}

/**
 * Get numeric value for a log level
 * 
 * @param level - The log level name
 * @returns The numeric value for the level
 * 
 * @example
 * ```typescript
 * import { getLevelValue } from '@heyclaude/shared-runtime/logger';
 * 
 * const debugValue = getLevelValue('debug'); // 20
 * const errorValue = getLevelValue('error'); // 50
 * ```
 */
export function getLevelValue(level: LogLevel): number {
  return LOG_LEVELS[level];
}

/**
 * Get the current log level name for a logger
 * 
 * @param loggerInstance - The Pino logger instance
 * @returns The current log level name
 * 
 * @example
 * ```typescript
 * import { logger, getCurrentLevel } from '@heyclaude/shared-runtime/logger';
 * 
 * const level = getCurrentLevel(logger); // 'info' (default)
 * ```
 */
export function getCurrentLevel(loggerInstance: pino.Logger): string {
  return loggerInstance.level;
}

/**
 * Get the current log level numeric value for a logger
 * 
 * @param loggerInstance - The Pino logger instance
 * @returns The current log level numeric value
 * 
 * @example
 * ```typescript
 * import { logger, getCurrentLevelValue } from '@heyclaude/shared-runtime/logger';
 * 
 * const value = getCurrentLevelValue(logger); // 30 (info)
 * ```
 */
export function getCurrentLevelValue(loggerInstance: pino.Logger): number {
  return loggerInstance.levelVal;
}
