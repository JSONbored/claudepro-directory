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
 * Create a Pino-compatible destination stream that routes logs to console methods so Vercel can detect log levels correctly.
 *
 * This destination inspects the log JSON for a numeric `levelValue` (e.g., 30, 40, 50) and calls `console.log`, `console.warn`, or `console.error`
 * so Vercel classifies messages as info, warning, or error respectively. If `levelValue` cannot be found, the function treats the message
 * as info (levelValue 30). The function returns `undefined` when running in a browser-like environment (when `globalThis.window` is defined)
 * so the default browser console behavior is preserved.
 *
 * Edge cases:
 * - If the log chunk does not contain a parsable `levelValue`, the destination assumes level 30 (info).
 * - The implementation uses a lightweight regex to locate `levelValue` and does not JSON-parse the chunk.
 *
 * @returns {pino.DestinationStream | undefined} A destination stream object with a `write(chunk: string)` method that routes to console methods, or `undefined` when running in a browser environment.
 * @see createLogger - integrates this destination when no explicit destination is provided for Vercel compatibility.
 * @example
 * // Used internally by createLogger when no destination is supplied:
 * const dest = createVercelCompatibleDestination();
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
 * Create and return a configured Pino logger instance, optionally bound to a specific destination stream.
 *
 * @param {Parameters<typeof createPinoConfig>[0]} options - Optional Pino configuration overrides (see PinoConfigOptions); include serializers, transport, level, service, browser transmit, etc.
 * @param {pino.DestinationStream} [destination] - Optional Pino destination stream (e.g., `pino.destination()` or `pino.multistream()`); when provided it is passed directly to `pino(config, destination)`.
 * @returns {pino.Logger} A Pino logger instance configured with the provided options and destination (or the module's default/vercel-compatible destination when `destination` is not supplied).
 *
 * @remarks
 * - Performance: Default behavior logs to stdout/stderr (async, high-performance). For file-based logging prefer `pino.destination()` (uses SonicBoom).
 * - Vercel compatibility: When no explicit destination is provided, the function attempts to use an internal Vercel-compatible destination that routes messages to console methods so Vercel correctly classifies log levels.
 * - Use `transport` in `options` for external services and/or provide a `destination` for local/file logging; both can be used together.
 *
 * @example
 * const logger = createLogger({ service: 'my-service' });
 * const fileLogger = createLogger({ service: 'file' }, pino.destination('./app.log'));
 *
 * @see {@link https://getpino.io/#/docs/api#pino-options-destination}
 * @see {@link https://getpino.io/#/docs/api#pino-destination}
 * @see {@link https://getpino.io/#/docs/api#pino-multistream}
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