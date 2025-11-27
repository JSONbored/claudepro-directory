import pino from 'pino';
import { createPinoConfig } from '@heyclaude/shared-runtime/logger/config';

// Create Pino instance with centralized configuration
// This uses the shared config which includes:
// - Native redaction (replaces manual sanitization)
// - Standard error serializers (replaces manual error serialization)
// - ISO timestamps
// - Base context (env, service)
const pinoInstance = pino(createPinoConfig({ service: 'web-runtime' }));

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
      if (error instanceof Error) {
        // Pino's stdSerializers.err handles this automatically
        logData['err'] = error;
      } else if (typeof error === 'string') {
        logData['err'] = new Error(error);
      } else {
        logData['err'] = new Error(String(error));
      }
    }
    pinoInstance.error(logData, message);
  }

  fatal(message: string, error?: Error | string, context?: LogContext, metadata?: LogContext): void {
    // Pino's stdSerializers.err automatically handles error serialization
    // Mixin automatically injects context from logger.bindings() (requestId, operation, userId, etc.)
    const logData: Record<string, unknown> = { ...context, ...metadata };
    if (error !== undefined) {
      if (error instanceof Error) {
        // Pino's stdSerializers.err handles this automatically
        logData['err'] = error;
      } else if (typeof error === 'string') {
        logData['err'] = new Error(error);
      } else {
        logData['err'] = new Error(String(error));
      }
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
   */
  setBindings(bindings: Record<string, unknown>): void {
    pinoInstance.setBindings(bindings);
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
      if (error instanceof Error) {
        logData['err'] = error;
      } else if (typeof error === 'string') {
        logData['err'] = new Error(error);
      } else {
        logData['err'] = new Error(String(error));
      }
    }
    this.childPino.error(logData, message);
  }

  override fatal(message: string, error?: Error | string, context?: LogContext, metadata?: LogContext): void {
    const logData: Record<string, unknown> = { ...context, ...metadata };
    if (error !== undefined) {
      if (error instanceof Error) {
        logData['err'] = error;
      } else if (typeof error === 'string') {
        logData['err'] = new Error(error);
      } else {
        logData['err'] = new Error(String(error));
      }
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
