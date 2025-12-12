/**
 * Shared Runtime Logger
 * 
 * **Unified logging solution with perfect Pino alignment.**
 * 
 * This module provides a single, unified logger that perfectly aligns with Pino's native API.
 * All packages should use this for consistent logging across the codebase.
 * 
 * **Key Features:**
 * - ✅ Pino native API (object-first pattern)
 * - ✅ Error normalization (`normalizeError` - Pino doesn't have this)
 * - ✅ Native redaction (sensitive data)
 * - ✅ Standard serializers (error formatting)
 * - ✅ Formatters (log structure)
 * - ✅ Child logger support (request-scoped context)
 * - ✅ Vercel compatibility (proper log level routing)
 * 
 * **Quick Start:**
 * ```typescript
 * import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * try {
 *   // Your code
 * } catch (error) {
 *   const normalized = normalizeError(error, 'Operation failed');
 *   logger.error({ err: normalized, operation: 'MyOp' }, 'Operation failed');
 * }
 * ```
 * 
 * **Usage Patterns:**
 * 
 * 1. **Default Logger (Most Common)**
 *    - Use the default `logger` instance for most cases
 *    - Already configured and ready to use
 *    ```typescript
 *    import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 *    logger.info({ operation: 'MyOp' }, 'Info message');
 *    ```
 * 
 * 2. **Request-Scoped Logging (Server Components, API Routes)**
 *    - Use `logger.child()` to create request-scoped loggers
 *    - Adds context that appears in all logs from that child
 *    ```typescript
 *    const reqLogger = logger.child({
 *      operation: 'MyPage',
 *      route: '/my-route',
 *    });
 *    reqLogger.info({ section: 'data-loading' }, 'Loading data');
 *    ```
 * 
 * 3. **Custom Logger Instances (Special Cases)**
 *    - Use `createLogger()` to create NEW logger instances with custom config
 *    - Use cases: different service names, cache-safe logging, custom levels
 *    ```typescript
 *    // Cache-safe logger (no timestamps - for cached components)
 *    const cacheLogger = createLogger({ timestamp: false });
 *    
 *    // Custom service logger
 *    const serviceLogger = createLogger({ service: 'my-service' });
 *    ```
 * 
 * **Important Distinctions:**
 * 
 * - **`logger` (default instance)**: Use for most cases - already configured
 * - **`logger.child({ context })`**: Creates child logger with request-scoped context (adds to existing logger)
 * - **`createLogger({ options })`**: Creates NEW logger instance with custom configuration (different service, level, etc.)
 * 
 * **Error Normalization:**
 * 
 * Pino does NOT normalize errors - it only serializes Error objects. Use `normalizeError()` to handle:
 * - Error instances (returns as-is)
 * - Strings (wraps in Error)
 * - Objects (JSON stringifies)
 * - Unknown types (uses fallback message)
 * 
 * **Always normalize errors before logging:**
 * ```typescript
 * const normalized = normalizeError(error, 'Fallback message');
 * logger.error({ err: normalized }, 'Error message');
 * ```
 * 
 * **Common Scenarios:**
 * 
 * See detailed examples below for:
 * - Server Components (Next.js pages)
 * - API Routes
 * - Edge Functions
 * - Client Components
 * - Cached Components
 * - Data Layer Functions
 * - Inngest Functions
 * 
 * **Vercel Compatibility:**
 * - Uses level-routing destination to ensure warn/error logs go to stderr
 * - Vercel categorizes logs by output stream: stdout=info, stderr=error
 * - This ensures warn/error logs appear correctly in Vercel's log dashboard
 * 
 * @module shared-runtime/logger
 * @see {@link https://getpino.io/ | Pino Documentation}
 */

import pino from 'pino';

import { createPinoConfig } from './config.ts';
import { normalizeError as normalizeErrorImpl } from '../error-handling.ts';

// Module-level flag to track if pino-pretty debug message has been logged
// This avoids logging the message multiple times when createLogger is called multiple times
let hasLoggedPinoPretty = false;

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
 * Create a NEW logger instance - **ONLY for cache-safe logging.**
 * 
 * **⚠️ CRITICAL: Use the default `logger` instance for 99% of cases!**
 * 
 * **When to Use `createLogger()`:**
 * 
 * ✅ **ONLY for cache-safe logging** (cached components that can't use Date.now())
 *    ```typescript
 *    // For cached Next.js components
 *    const cacheLogger = createLogger({ timestamp: false });
 *    ```
 * 
 * **When NOT to Use `createLogger()`:**
 * 
 * ❌ **For request-scoped context** → Use `logger.child({ context })` instead
 * ❌ **For most cases** → Use the default `logger` instance
 * ❌ **For different service names** → Use the default `logger` (service is set automatically)
 * ❌ **For custom log levels** → Use the default `logger` (level is set via env)
 * ❌ **For adding context** → Use `logger.child()` instead
 * 
 * **Why consistency matters:**
 * - All logs should use the same configuration
 * - Same redaction rules, same serializers, same format
 * - Easier debugging and log analysis
 * - Prevents configuration drift
 * 
 * **Examples:**
 * 
 * ```typescript
 * // ✅ CORRECT: Cache-safe logger for cached components
 * import { createLogger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * const cacheLogger = createLogger({ timestamp: false });
 * 
 * export default async function CachedPage() {
 *   try {
 *     // ...
 *   } catch (error) {
 *     const normalized = normalizeError(error, 'Page failed');
 *     cacheLogger.error({ err: normalized }, 'Page failed');
 *   }
 * }
 * ```
 * 
 * ```typescript
 * // ❌ WRONG: Don't create new logger for request context
 * const reqLogger = createLogger({ service: 'my-service' });
 * 
 * // ✅ CORRECT: Use child logger for request context
 * const reqLogger = logger.child({ operation: 'MyPage', route: '/my-page' });
 * ```
 * 
 * @param {Parameters<typeof createPinoConfig>[0]} options - Optional Pino configuration overrides. **Only use `{ timestamp: false }` for cache-safe logging.**
 * @param {pino.DestinationStream} [destination] - Optional Pino destination stream (e.g., `pino.destination()` or `pino.multistream()`); when provided it is passed directly to `pino(config, destination)`.
 * @returns {pino.Logger} A Pino logger instance configured with the provided options and destination (or the module's default/vercel-compatible destination when `destination` is not supplied).
 *
 * @remarks
 * - Performance: Default behavior logs to stdout/stderr (async, high-performance). For file-based logging prefer `pino.destination()` (uses SonicBoom).
 * - Vercel compatibility: When no explicit destination is provided, the function attempts to use an internal Vercel-compatible destination that routes messages to console methods so Vercel correctly classifies log levels.
 * - Use `transport` in `options` for external services and/or provide a `destination` for local/file logging; both can be used together.
 *
 * @see {@link https://getpino.io/#/docs/api#pino-options-destination}
 * @see {@link https://getpino.io/#/docs/api#pino-destination}
 * @see {@link https://getpino.io/#/docs/api#pino-multistream}
 * @see logger.child - For creating request-scoped loggers (not custom instances)
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
  
  // CRITICAL: Pino does NOT support using both transport and destination together!
  // When a destination is passed to pino(), it overrides any transport.
  // Strategy:
  // - Development: Use pino-pretty as a stream (colored, readable logs) - same as old logger
  // - Production: Use Vercel-compatible destination (proper log level routing for Vercel)
  const isDevelopment = typeof process !== 'undefined' && process.env?.['NODE_ENV'] !== 'production';
  const isServer = typeof window === 'undefined';
  const hasTransport = config.transport !== undefined;
  
  // Use pino-pretty as a stream in development (same pattern as old logger)
  // This avoids worker thread issues and ensures colored output works correctly
  if (isServer && isDevelopment && hasTransport && config.transport && typeof config.transport === 'object' && 'target' in config.transport && config.transport.target === 'pino-pretty') {
    // Try to load pino-pretty dynamically to avoid Next.js bundling issues
    // Use the same pattern as the old logger for consistency
    let prettyStream: ReturnType<typeof require> | null = null;
    try {
      // Split the module name to prevent static analysis
      // Turbopack can't analyze string concatenation in this context
      const moduleNameParts = ['pino', '-', 'pretty'];
      const moduleName = moduleNameParts.join('');
      
      // Use eval to create a truly dynamic require that Next.js can't analyze
      // This is safe because we're only requiring a known dev dependency
      // eslint-disable-next-line @typescript-eslint/no-implied-eval, @typescript-eslint/no-require-imports, no-eval -- Dynamic require to avoid Next.js/Turbopack static analysis
      const pretty = eval(`require('${moduleName}')`);
      const transportOptions = 'options' in config.transport && typeof config.transport.options === 'object' ? config.transport.options : {};
      prettyStream = pretty({
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
        singleLine: false,
        errorLikeObjectKeys: ['err', 'error'],
        ...transportOptions,
      });
    } catch (error) {
      // pino-pretty not available - will fall back to Vercel destination
      // Don't log here to avoid noise
      prettyStream = null;
    }

    if (prettyStream) {
      // Remove transport from config (we're using stream instead)
      const configWithoutTransport = { ...config };
      delete configWithoutTransport.transport;

      // Increase max listeners on the stream to prevent MaxListenersExceededWarning
      // This is safe because we're using a singleton pattern - only one logger instance exists
      if (typeof process !== 'undefined' && process.stdout && typeof process.stdout.setMaxListeners === 'function') {
        process.stdout.setMaxListeners(20);
      }
      if (typeof process !== 'undefined' && process.stderr && typeof process.stderr.setMaxListeners === 'function') {
        process.stderr.setMaxListeners(20);
      }

      // Debug: Log that pino-pretty stream is active (only once)
      // Use module-level variable instead of globalThis for better compatibility
      if (!hasLoggedPinoPretty) {
        // eslint-disable-next-line no-console -- Debug logging for development
        console.log('[Logger] Development mode: Using pino-pretty stream (colored)');
        hasLoggedPinoPretty = true;
      }

      // Create logger with pretty stream (same pattern as old logger)
      // eslint-disable-next-line architectural-rules/detect-outdated-logging-patterns -- This is the intended usage: createPinoConfig() returns config, pino() creates the logger
      return pino(configWithoutTransport, prettyStream);
    }
  }
  
  // If custom transport is provided (not pino-pretty), use it as transport
  if (hasTransport && isDevelopment && !isServer) {
    // Browser/Edge: Use transport if configured
    // eslint-disable-next-line architectural-rules/detect-outdated-logging-patterns -- This is the intended usage: createPinoConfig() returns config, pino() creates the logger
    return pino(config);
  }
  
  // Production or no transport: Use Vercel-compatible destination
  // This ensures Vercel properly detects log levels via console methods:
  // - console.error() → error (red)
  // - console.warn() → warning (orange in streaming functions)
  // - console.log() → info (gray)
  // IMPORTANT: Remove transport from config before passing destination
  // (Pino will error if both are present)
  const configWithoutTransport = { ...config };
  delete configWithoutTransport.transport;
  const vercelDest = createVercelCompatibleDestination();
  if (vercelDest) {
    // eslint-disable-next-line architectural-rules/detect-outdated-logging-patterns -- This is the intended usage: createPinoConfig() returns config, pino() creates the logger
    return pino(configWithoutTransport, vercelDest);
  }
  
  // Browser/Edge fallback: use default Pino destination (stdout)
  // eslint-disable-next-line architectural-rules/detect-outdated-logging-patterns -- This is the intended usage: createPinoConfig() returns config, pino() creates the logger
  return pino(configWithoutTransport);
}

/**
 * Default logger instance - Use this for most cases.
 * 
 * **When to Use:**
 * - ✅ Most logging needs (already configured and ready)
 * - ✅ Simple logging without request context
 * - ✅ Utility functions, helpers, shared code
 * 
 * **When NOT to Use:**
 * - ❌ Request-scoped logging → Use `logger.child({ context })` instead
 * - ❌ Cache-safe logging → Use `createLogger({ timestamp: false })` instead
 * - ❌ Custom service names → Use `createLogger({ service: 'name' })` instead
 * 
 * **Basic Usage:**
 * ```typescript
 * import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * // Simple logging
 * logger.info({ operation: 'MyOp' }, 'Info message');
 * logger.warn({ operation: 'MyOp' }, 'Warning message');
 * 
 * // Error logging (always normalize first)
 * try {
 *   // ...
 * } catch (error) {
 *   const normalized = normalizeError(error, 'Operation failed');
 *   logger.error({ err: normalized, operation: 'MyOp' }, 'Operation failed');
 * }
 * ```
 * 
 * **Creating Request-Scoped Loggers:**
 * ```typescript
 * // Create child logger with request context
 * const reqLogger = logger.child({
 *   operation: 'MyPage',
 *   route: '/my-route',
 * });
 * 
 * // All logs from child include the context
 * reqLogger.info({ section: 'data-loading' }, 'Loading data');
 * // Log includes: operation, route, section
 * ```
 * 
 * **Vercel Compatibility:**
 * - Uses level-routing destination by default
 * - warn/error/fatal logs go to stderr (shown as error in Vercel)
 * - trace/debug/info logs go to stdout (shown as info in Vercel)
 * 
 * @example
 * ```typescript
 * import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * // Simple logging
 * logger.info({ operation: 'MyOp' }, 'Hello world');
 * 
 * // Error logging
 * try {
 *   // ...
 * } catch (error) {
 *   const normalized = normalizeError(error, 'Operation failed');
 *   logger.error({ err: normalized, operation: 'MyOp' }, 'Error occurred');
 * }
 * 
 * // Request-scoped logging
 * const reqLogger = logger.child({ operation: 'MyOp', route: '/my-route' });
 * reqLogger.info({ step: 'step1' }, 'Processing');
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
  // Suppress shutdown log for CLI tools (generators) to reduce noise
  // Only log for beforeExit in non-CLI contexts (web servers, API routes, etc.)
  // Check for pnpm-specific env vars or generator/bin script paths
  const isCliTool = process.env['PNPM_SCRIPT_SRC_DIR'] !== undefined ||
                    process.env['PNPM_PACKAGE_NAME'] !== undefined ||
                    process.argv[1]?.includes('generators') ||
                    process.argv[1]?.includes('bin/');
  
  // Only log shutdown message for non-CLI tools or for actual termination signals (SIGTERM/SIGINT)
  if (!isCliTool || (signal !== 'beforeExit')) {
    // Log the shutdown signal (this log will be flushed)
    // Pino API is object-first, but we structure it to emphasize the message
    // eslint-disable-next-line architectural-rules/enforce-message-first-logger-api -- Pino's native API is object-first
    logger.info({ signal }, 'Process shutting down, flushing logs...');
  }
  
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
// Conditional Logging - Use Pino Native API
// ============================================================================

/**
 * @fileoverview Conditional Logging
 * 
 * **Use Pino's native API directly - no wrappers needed:**
 * 
 * Pino provides all level checking methods natively:
 * 
 * ```typescript
 * import { logger } from '@heyclaude/shared-runtime/logger';
 * 
 * // Check if level is enabled (Pino native)
 * if (logger.isLevelEnabled('debug')) {
 *   const debugData = computeExpensiveDebugInfo();
 *   logger.debug({ data: debugData }, 'Debug info');
 * }
 * 
 * // Get current level (Pino native)
 * const currentLevel = logger.level;    // 'info' (string)
 * const levelValue = logger.levelVal;    // 30 (number)
 * ```
 * 
 * **Available Pino Native Methods:**
 * - `logger.isLevelEnabled(level)` - Check if a level is enabled
 * - `logger.level` - Current level name (string: 'trace', 'debug', 'info', 'warn', 'error', 'fatal')
 * - `logger.levelVal` - Current level value (number: 10, 20, 30, 40, 50, 60)
 * - `logger.child({ context })` - Create child logger with context
 * 
 * **Why no wrappers?**
 * - Pino already provides all these methods natively
 * - Wrappers add unnecessary complexity and maintenance burden
 * - Direct Pino API is more maintainable and aligns with Pino best practices
 * 
 * @see {@link https://getpino.io/#/docs/api#logger-islevelenabled-level | Pino isLevelEnabled}
 * @see {@link https://getpino.io/#/docs/api#logger-level | Pino level property}
 * @see {@link https://getpino.io/#/docs/api#logger-child | Pino child logger}
 */

// ============================================================================
// Error Normalization
// ============================================================================

/**
 * Normalize any error value into an Error instance.
 * 
 * **Why this is needed:**
 * - Pino has `stdSerializers.err` (serializes Error objects)
 * - Pino does NOT normalize unknown types → Error
 * - This function fills that gap
 * 
 * **Always normalize errors before logging:**
 * ```typescript
 * import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * try {
 *   // ...
 * } catch (error) {
 *   const normalized = normalizeError(error, 'Operation failed');
 *   logger.error({ err: normalized, operation: 'MyOp' }, 'Operation failed');
 * }
 * ```
 * 
 * **Handles all error types:**
 * - ✅ Error instances → Returns as-is
 * - ✅ Strings → Wraps in new Error
 * - ✅ Objects → JSON stringifies
 * - ✅ Unknown types → Uses fallback message
 * 
 * @param error - The error to normalize (can be any type: Error, string, object, unknown)
 * @param fallbackMessage - Message to use if error cannot be converted (default: 'Unknown error')
 * @returns An Error instance that can be safely logged with Pino
 * 
 * @example
 * ```typescript
 * // Error instance
 * const err1 = normalizeError(new Error('Something went wrong'), 'Fallback');
 * // Returns: Error('Something went wrong')
 * 
 * // String
 * const err2 = normalizeError('String error', 'Fallback');
 * // Returns: Error('String error')
 * 
 * // Object
 * const err3 = normalizeError({ code: 500, message: 'Server error' }, 'Fallback');
 * // Returns: Error('{"code":500,"message":"Server error"}')
 * 
 * // Unknown type
 * const err4 = normalizeError(null, 'Fallback');
 * // Returns: Error('Fallback')
 * ```
 */
export function normalizeError(error: unknown, fallbackMessage = 'Unknown error'): Error {
  return normalizeErrorImpl(error, fallbackMessage);
}

// ============================================================================
// Usage Patterns & Examples
// ============================================================================

/**
 * @fileoverview Comprehensive Usage Patterns
 * 
 * This section documents common usage patterns for different scenarios.
 * All examples use Pino's native object-first API.
 * 
 * **Key Principles:**
 * 1. Always normalize errors before logging
 * 2. Use object-first API: `logger.error({ err, ...context }, 'message')`
 * 3. Use `logger.child()` for request-scoped context (not `createLogger()`)
 * 4. Use `createLogger()` only for custom logger instances (cache-safe, different service, etc.)
 * 
 * **Pattern 1: Server Components (Next.js Pages)**
 * 
 * Use request-scoped child logger for proper context tracking:
 * 
 * ```typescript
 * import { connection } from 'next/server';
 * import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * export default async function MyPage() {
 *   // Defer to request time (required for Cache Components)
 *   await connection();
 * 
 *   // Create request-scoped logger with context
 *   const reqLogger = logger.child({
 *     operation: 'MyPage',
 *     route: '/my-page',
 *   });
 * 
 *   try {
 *     reqLogger.info({ section: 'data-loading' }, 'Loading data');
 *     const data = await fetchData();
 *     reqLogger.info({ section: 'complete' }, 'Page rendered');
 *     return <div>{data}</div>;
 *   } catch (error) {
 *     const normalized = normalizeError(error, 'Page failed');
 *     reqLogger.error({ err: normalized, section: 'error' }, 'Page failed');
 *     throw normalized;
 *   }
 * }
 * ```
 * 
 * **Pattern 2: API Routes**
 * 
 * Use request-scoped logger with route context:
 * 
 * ```typescript
 * import { NextRequest, NextResponse } from 'next/server';
 * import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * export async function POST(request: NextRequest) {
 *   const reqLogger = logger.child({
 *     operation: 'POST',
 *     route: '/api/endpoint',
 *     method: 'POST',
 *   });
 * 
 *   try {
 *     const body = await request.json();
 *     reqLogger.info({ bodySize: JSON.stringify(body).length }, 'Processing request');
 *     // ...
 *     return NextResponse.json({ success: true });
 *   } catch (error) {
 *     const normalized = normalizeError(error, 'API request failed');
 *     reqLogger.error({ err: normalized }, 'API request failed');
 *     return NextResponse.json({ error: 'Failed' }, { status: 500 });
 *   }
 * }
 * ```
 * 
 * **Pattern 3: Edge Functions**
 * 
 * Use request-scoped logger and flush before returning:
 * 
 * ```typescript
 * import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * export async function handler(request: Request) {
 *   const reqLogger = logger.child({
 *     function: 'my-handler',
 *   });
 * 
 *   try {
 *     // ...
 *     return Response.json({ success: true });
 *   } catch (error) {
 *     const normalized = normalizeError(error, 'Handler failed');
 *     reqLogger.error({ err: normalized }, 'Handler failed');
 *     
 *     // Flush before returning (edge functions may terminate quickly)
 *     await new Promise<void>((resolve) => {
 *       reqLogger.flush(() => resolve());
 *     });
 *     
 *     return Response.json({ error: 'Failed' }, { status: 500 });
 *   }
 * }
 * ```
 * 
 * **Pattern 4: Cached Components (Cache-Safe Logging)**
 * 
 * Use `createLogger({ timestamp: false })` to avoid Date.now() in cached components:
 * 
 * ```typescript
 * import { createLogger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * // Create cache-safe logger (no timestamps)
 * const cacheLogger = createLogger({ timestamp: false });
 * 
 * export default async function CachedPage() {
 *   try {
 *     const data = await fetchData();
 *     return <div>{data}</div>;
 *   } catch (error) {
 *     const normalized = normalizeError(error, 'Page failed');
 *     cacheLogger.error({ err: normalized }, 'Page failed');
 *     throw normalized;
 *   }
 * }
 * ```
 * 
 * **Pattern 5: Data Layer Functions**
 * 
 * Receive request-scoped logger from parent component:
 * 
 * ```typescript
 * import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * export async function fetchUserData(
 *   userId: string,
 *   reqLogger: ReturnType<typeof logger.child>
 * ) {
 *   try {
 *     reqLogger.info({ rpcName: 'get_user', userId }, 'Calling RPC');
 *     const { data, error } = await supabase.rpc('get_user', { user_id: userId });
 *     
 *     if (error) throw error;
 *     
 *     reqLogger.info({ rpcName: 'get_user', userId }, 'RPC completed');
 *     return data;
 *   } catch (error) {
 *     const normalized = normalizeError(error, 'RPC failed');
 *     reqLogger.error({ 
 *       err: normalized, 
 *       rpcName: 'get_user', 
 *       userId 
 *     }, 'RPC failed');
 *     throw normalized;
 *   }
 * }
 * 
 * // Usage in parent component:
 * const reqLogger = logger.child({ operation: 'MyPage', route: '/my-page' });
 * const userData = await fetchUserData(userId, reqLogger);
 * ```
 * 
 * **Pattern 6: Client Components**
 * 
 * Use `useLoggedAsync` hook for automatic error logging:
 * 
 * ```typescript
 * 'use client';
 * 
 * import { useLoggedAsync } from '@heyclaude/web-runtime/hooks';
 * 
 * export function MyComponent() {
 *   const runLoggedAsync = useLoggedAsync({
 *     scope: 'MyComponent',
 *     defaultMessage: 'Action failed',
 *   });
 * 
 *   const handleClick = async () => {
 *     await runLoggedAsync(async () => {
 *       await doSomething();
 *     });
 *   };
 * 
 *   return <button onClick={handleClick}>Click</button>;
 * }
 * ```
 * 
 * **Pattern 7: Inngest Functions**
 * 
 * Use request-scoped logger with function context:
 * 
 * ```typescript
 * import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * export const myFunction = inngest.createFunction(
 *   { id: 'my-function' },
 *   { event: 'my.event' },
 *   async ({ event, step }) => {
 *     const reqLogger = logger.child({
 *       functionId: 'my-function',
 *       eventId: event.id,
 *     });
 * 
 *     try {
 *       reqLogger.info({ step: 'processing' }, 'Processing event');
 *       // ...
 *     } catch (error) {
 *       const normalized = normalizeError(error, 'Function failed');
 *       reqLogger.error({ err: normalized }, 'Function failed');
 *       throw normalized;
 *     }
 *   }
 * );
 * ```
 * 
 * **Pattern 8: Utility Functions (No Request Context)**
 * 
 * Use default logger for simple utilities:
 * 
 * ```typescript
 * import { logger, normalizeError } from '@heyclaude/shared-runtime/logger';
 * 
 * export function myUtility(input: string) {
 *   try {
 *     logger.debug({ input }, 'Processing utility');
 *     // ...
 *     return result;
 *   } catch (error) {
 *     const normalized = normalizeError(error, 'Utility failed');
 *     logger.error({ err: normalized, input }, 'Utility failed');
 *     throw normalized;
 *   }
 * }
 * ```
 * 
 * **Common Mistakes to Avoid:**
 * 
 * ❌ **Don't use `createLogger()` for request context:**
 * ```typescript
 * // WRONG - creates new logger instance
 * const reqLogger = createLogger({ operation: 'MyPage' });
 * 
 * // CORRECT - creates child logger with context
 * const reqLogger = logger.child({ operation: 'MyPage', route: '/my-page' });
 * ```
 * 
 * ❌ **Don't use message-first API:**
 * ```typescript
 * // WRONG - message-first (contradicts Pino)
 * logger.error('Message', error, { context });
 * 
 * // CORRECT - object-first (Pino native)
 * const normalized = normalizeError(error, 'Message');
 * logger.error({ err: normalized, ...context }, 'Message');
 * ```
 * 
 * ❌ **Don't skip error normalization:**
 * ```typescript
 * // WRONG - may fail if error is not Error instance
 * logger.error({ err: error }, 'Failed');
 * 
 * // CORRECT - always normalize first
 * const normalized = normalizeError(error, 'Failed');
 * logger.error({ err: normalized }, 'Failed');
 * ```
 * 
 * **Summary:**
 * 
 * - **Default logger**: Use for most cases
 * - **`logger.child({ context })`**: Use for request-scoped logging (adds context)
 * - **`createLogger({ options })`**: Use for custom logger instances (cache-safe, different service, etc.)
 * - **Always normalize errors**: Use `normalizeError()` before logging
 * - **Object-first API**: Always use `logger.error({ err, ...context }, 'message')`
 */