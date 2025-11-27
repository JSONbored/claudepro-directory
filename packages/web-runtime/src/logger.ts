/**
 * Web Runtime Logger
 * 
 * Main logger instance for web-runtime package.
 * Uses centralized Pino configuration with browser-specific optimizations.
 * 
 * **⚠️ IMPORTANT: Universal Module (Client & Server Compatible)**
 * - ✅ **SAFE** to import in client components (`'use client'`)
 * - ✅ **SAFE** to import in server components (server-only)
 * - This logger instance works in both contexts, but usage patterns differ:
 *   - **Client-side**: Use {@link ../logging/client | Client Logging Barrel} utilities
 *   - **Server-side**: Use {@link ../logging/server | Server Logging Barrel} utilities
 * 
 * **Browser Configuration:**
 * - Console logging: Disabled in production (users don't see logs)
 * - Transmit: Enabled in production to forward error/warn logs to server
 * - Performance: Fire-and-forget, batched, only error/warn levels
 * 
 * **Usage:**
 * - **Client components**: Import from {@link ../logging/client | Client Logging Barrel} (don't import logger directly)
 * - **Server components**: Import from {@link ../logging/server | Server Logging Barrel} (logger exported there)
 * 
 * **Related Modules:**
 * - {@link ../logging/client | Client Logging Barrel} - Use for client-side logging
 * - {@link ../logging/server | Server Logging Barrel} - Use for server-side logging
 * - {@link @heyclaude/shared-runtime/logger/config | Pino Configuration} - Centralized config
 * - {@link ../app/api/logs/client/route | Client Logs API} - Server endpoint for log forwarding
 * 
 * @module web-runtime/logger
 * @see {@link ../logging/client | Client Logging Barrel} - Recommended for client-side files
 * @see {@link ../logging/server | Server Logging Barrel} - Recommended for server-side files
 * @see {@link @heyclaude/shared-runtime/logger/config | Pino Configuration} - Centralized config
 */
import pino from 'pino';
import { createPinoConfig } from '@heyclaude/shared-runtime/logger/config';
import { normalizeError } from './errors';
const pinoInstance = pino(
  createPinoConfig({
    service: 'web-runtime',
    // Browser configuration: Disable console in production, enable transmit
    browser: (() => {
        const transmitConfig = (() => {
        // Only enable in browser environment
        if (typeof window === 'undefined') {
          return undefined;
        }

        const isProduction = typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production';
        const consoleEnabled = typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_LOGGER_CONSOLE'] === 'true';

        // Enable transmit in production (always) or development (if console enabled)
        // This ensures we capture client-side errors even when console is disabled
        if (!isProduction && !consoleEnabled) {
          return undefined;
        }

        return {
          level: 'warn' as pino.LevelOrString, // Only send warn and error logs (reduces network traffic)
          send: (level: pino.Level, logEvent: pino.LogEvent) => {
            // Fire-and-forget: Don't await, don't block UI
            // Performance: Pino batches logs automatically, so this is efficient
            // Security: Redaction happens before transmit, so no sensitive data sent
            // Level parameter is the numeric log level (10=trace, 20=debug, 30=info, 40=warn, 50=error, 60=fatal)
            // We use it to ensure only warn (40) and error (50+) logs are sent (double-check, though transmit.level already filters)
            // Convert level to number if it's a string (Pino.Level can be string or number)
            const numericLevel = typeof level === 'number' ? level : (logEvent.level?.value ?? 40);
            if (numericLevel >= 40) {
              fetch('/api/logs/client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...logEvent,
                  level, // Include numeric level for server-side processing
                }),
                // Keepalive ensures request completes even if page unloads
                keepalive: true,
              }).catch(() => {
                // Silently fail - don't log errors about logging
                // Prevents infinite loops if logging endpoint fails
              });
            }
          },
        };
      })();

      return {
        // Console logging: Only enabled if NEXT_PUBLIC_LOGGER_CONSOLE=true
        // In production, this is false (users don't see logs in browser console)
        disabled: typeof process !== 'undefined' && process.env?.['NEXT_PUBLIC_LOGGER_CONSOLE'] !== 'true',
        // Serialize all objects for proper formatting
        serialize: true,
        // Enable transmit for error/warn logs (sends to /api/logs/client)
        // This is the ONLY way logs appear in production (users don't see them)
        ...(transmitConfig && { transmit: transmitConfig }),
      };
    })(),
  })
);

export type LogContextValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly string[]
  | readonly number[]
  | readonly boolean[]
  | ReadonlyArray<LogContextValue>
  | { readonly [key: string]: LogContextValue }
  | Error; // Allow Error objects for Pino's err serializer

export type LogContext = Record<string, LogContextValue>;

export function toLogContextValue(value: unknown): LogContextValue {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(toLogContextValue) as ReadonlyArray<LogContextValue>;
  }
  if (typeof value === 'object') {
    const result: Record<string, LogContextValue> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = toLogContextValue(val);
    }
    return result as { readonly [key: string]: LogContextValue };
  }
  return String(value);
}

// Manual sanitization functions removed - now using Pino's native redaction
// Pino automatically handles:
// - Sensitive data redaction (via redact option in config)
// - Error serialization (via stdSerializers.err)
// - Context sanitization (via redaction paths)

class Logger {
  debug(message: string, context?: LogContext, metadata?: LogContext): void {
    // Pino handles redaction automatically via config
    // Mixin automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
    pinoInstance.debug({ ...context, ...metadata }, message);
  }

  info(message: string, context?: LogContext, metadata?: LogContext): void {
    // Pino handles redaction automatically via config
    // Mixin automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
    pinoInstance.info({ ...context, ...metadata }, message);
  }

  warn(message: string, context?: LogContext, metadata?: LogContext): void {
    // Pino handles redaction automatically via config
    // Mixin automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
    pinoInstance.warn({ ...context, ...metadata }, message);
  }

  error(message: string, error?: Error | string, context?: LogContext, metadata?: LogContext): void {
    // Pino's stdSerializers.err automatically handles error serialization
    // Mixin automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
    // Pass error as 'err' key - Pino will serialize it properly
    const logData: Record<string, unknown> = { ...context, ...metadata };
    if (error !== undefined) {
      // Use normalizeError() for consistent error normalization across codebase
      // This handles Error instances, strings, objects, and unknown types
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
    }
    pinoInstance.error(logData, message);
  }

  fatal(message: string, error?: Error | string, context?: LogContext, metadata?: LogContext): void {
    // Pino's stdSerializers.err automatically handles error serialization
    // Mixin automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
    const logData: Record<string, unknown> = { ...context, ...metadata };
    if (error !== undefined) {
      // Use normalizeError() for consistent error normalization across codebase
      // This handles Error instances, strings, objects, and unknown types
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
    }
    pinoInstance.fatal(logData, message);
  }

  trace(message: string, context?: LogContext, metadata?: LogContext): void {
    // Trace level for finest-grained logging (detailed debugging, performance tracing)
    pinoInstance.trace({ ...context, ...metadata }, message);
  }

  /**
   * Get current logger bindings (context that will be included in all logs)
   * @returns Current bindings object
   */
  bindings(): Record<string, unknown> {
    return pinoInstance.bindings();
  }

  /**
   * Update logger bindings dynamically (adds to existing bindings)
   * Use this to add context that will be included in all subsequent logs
   * @param bindings - Key-value pairs to add to logger context
   * @deprecated Use child() instead to avoid race conditions in concurrent environments
   */
  setBindings(bindings: Record<string, unknown>): void {
    pinoInstance.setBindings(bindings);
  }

  /**
   * Create a child logger with request-scoped context
   * Use this instead of setBindings() to avoid race conditions in concurrent environments
   * @param bindings - Key-value pairs to add to child logger context
   * @returns New Logger instance with merged context
   */
  child(bindings: Record<string, unknown>): Logger {
    const childPino = pinoInstance.child(bindings);
    return new RequestLogger(childPino);
  }

  /**
   * Flush buffered logs synchronously
   * Use this in critical paths (shutdown, critical errors) to ensure logs are written
   * @param callback - Optional callback when flush completes
   */
  flush(callback?: (err?: Error) => void): void {
    pinoInstance.flush(callback);
  }

  /**
   * Check if a log level is enabled
   * Use this before expensive operations to avoid unnecessary work
   * @param level - Log level to check ('trace', 'debug', 'info', 'warn', 'error', 'fatal')
   * @returns true if the level is enabled, false otherwise
   */
  isLevelEnabled(level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean {
    return pinoInstance.isLevelEnabled(level);
  }

  forRequest(request: Request): Logger {
    const url = new URL(request.url);
    // Create child logger with request context
    // Pino's child() method creates a new logger with merged context
    // Mixin will automatically inject these bindings into all log calls
    const childPino = pinoInstance.child({
      method: request.method,
      url: url.pathname + url.search,
      userAgent: request.headers.get('user-agent') || '',
    });
    // Create a new Logger instance that wraps the child Pino instance
    return new RequestLogger(childPino);
  }
}

/**
 * Logger for request-specific context
 * Wraps a Pino child logger instance
 */
class RequestLogger extends Logger {
  private childPino: pino.Logger;

  constructor(childPino: pino.Logger) {
    super();
    this.childPino = childPino;
  }

  override debug(message: string, context?: LogContext, metadata?: LogContext): void {
    this.childPino.debug({ ...context, ...metadata }, message);
  }

  override info(message: string, context?: LogContext, metadata?: LogContext): void {
    this.childPino.info({ ...context, ...metadata }, message);
  }

  override warn(message: string, context?: LogContext, metadata?: LogContext): void {
    this.childPino.warn({ ...context, ...metadata }, message);
  }

  override error(message: string, error?: Error | string, context?: LogContext, metadata?: LogContext): void {
    const logData: Record<string, unknown> = { ...context, ...metadata };
    if (error !== undefined) {
      // Use normalizeError() for consistent error normalization across codebase
      // This handles Error instances, strings, objects, and unknown types
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
    }
    this.childPino.error(logData, message);
  }

  override fatal(message: string, error?: Error | string, context?: LogContext, metadata?: LogContext): void {
    const logData: Record<string, unknown> = { ...context, ...metadata };
    if (error !== undefined) {
      // Use normalizeError() for consistent error normalization across codebase
      // This handles Error instances, strings, objects, and unknown types
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
    }
    this.childPino.fatal(logData, message);
  }

  override trace(message: string, context?: LogContext, metadata?: LogContext): void {
    this.childPino.trace({ ...context, ...metadata }, message);
  }

  override bindings(): Record<string, unknown> {
    return this.childPino.bindings();
  }

  override setBindings(bindings: Record<string, unknown>): void {
    this.childPino.setBindings(bindings);
  }

  override flush(callback?: (err?: Error) => void): void {
    this.childPino.flush(callback);
  }

  override isLevelEnabled(level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean {
    return this.childPino.isLevelEnabled(level);
  }
}

export const logger = new Logger();
