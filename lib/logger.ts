/**
 * Structured logging utility optimized for Vercel environments
 * Provides better observability and error tracking than console statements
 */

import { env, isDevelopment, isProduction, isVercel } from './schemas/env.schema';
import {
  type LogContext,
  type LogEntry,
  parseDevelopmentLogComponents,
  sanitizeLogMessage,
  validateLogContext,
} from './schemas/logger.schema';

// Re-export type for backward compatibility
export type { LogEntry };

class Logger {
  private isDevelopment = isDevelopment;
  private isProduction = isProduction;
  private isVercel = isVercel;

  /**
   * Format log entry for structured output
   */
  private formatLog(entry: LogEntry): string {
    const timestamp = new Date().toISOString();

    const logObject: Record<string, unknown> = {
      timestamp,
      level: entry.level,
      message: entry.message,
    };

    if (entry.context) {
      logObject.context = entry.context;
    }

    if (entry.metadata) {
      logObject.metadata = entry.metadata;
    }

    if (entry.error) {
      logObject.error = {
        name: entry.error instanceof Error ? entry.error.name : 'UnknownError',
        message: entry.error instanceof Error ? entry.error.message : String(entry.error),
        stack: entry.error instanceof Error ? entry.error.stack : undefined,
      };
    }

    return this.isDevelopment ? this.formatForDevelopment(logObject) : JSON.stringify(logObject);
  }

  /**
   * Format logs for better readability in development
   */
  private formatForDevelopment(logObject: Record<string, unknown>): string {
    // Use safe parsing with Zod validation
    const components = parseDevelopmentLogComponents(logObject);
    if (!components) {
      return `[INVALID LOG] ${JSON.stringify(logObject)}`;
    }

    if (!components.success) {
      return `[INVALID LOG] ${components.error}`;
    }

    const { timestamp, level, message, context, metadata, error } = components.data;

    let output = `[${timestamp}] ${level.toUpperCase()}: ${message}`;

    if (context && Object.keys(context).length > 0) {
      output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }

    if (metadata && Object.keys(metadata).length > 0) {
      output += `\n  Metadata: ${JSON.stringify(metadata, null, 2)}`;
    }

    if (error) {
      output += `\n  Error: ${JSON.stringify(error, null, 2)}`;
    }

    return output;
  }

  /**
   * Output log entry using appropriate method
   * IMPORTANT: True server-only logging - never expose to browser console
   */
  private output(entry: LogEntry): void {
    // Multiple checks to ensure we're truly server-side only
    if (
      typeof window !== 'undefined' ||
      typeof document !== 'undefined' ||
      typeof navigator !== 'undefined' ||
      process.env.NEXT_RUNTIME === 'edge'
    ) {
      return;
    }

    // Additional check for Node.js server environment
    if (!process?.env || typeof process.stdout === 'undefined') {
      return;
    }

    // In production, only output errors and fatal logs
    if (this.isProduction && entry.level !== 'error' && entry.level !== 'fatal') {
      return;
    }

    // For debug logs, write directly to process.stdout to avoid SSR leakage
    const formattedLog = this.formatLog(entry);

    if (entry.level === 'debug' && this.isDevelopment) {
      // Use process.stdout.write for debug logs to prevent SSR console leakage
      process.stdout.write(`[DEBUG] ${formattedLog}\n`);
      return;
    }

    // Server-only console output for non-debug levels
    switch (entry.level) {
      case 'info':
        // biome-ignore lint/suspicious/noConsole: Server-only logger implementation
        console.info(`[SERVER] ${formattedLog}`);
        break;
      case 'warn':
        // biome-ignore lint/suspicious/noConsole: Server-only logger implementation
        console.warn(`[SERVER] ${formattedLog}`);
        break;
      case 'error':
      case 'fatal':
        // biome-ignore lint/suspicious/noConsole: Server-only logger implementation
        console.error(`[SERVER] ${formattedLog}`);
        break;
      default:
        // biome-ignore lint/suspicious/noConsole: Server-only logger implementation
        console.log(`[SERVER] ${formattedLog}`);
    }
  }

  /**
   * Debug level logging
   */
  debug(
    message: string,
    context?: LogContext,
    metadata?: Record<string, string | number | boolean>
  ): void {
    if (this.isDevelopment) {
      const entry: LogEntry = {
        level: 'debug',
        message: sanitizeLogMessage(message),
      };

      const validatedContext = validateLogContext(context);
      if (validatedContext) entry.context = validatedContext;

      const validatedMetadata = validateLogContext(metadata);
      if (validatedMetadata) entry.metadata = validatedMetadata;

      this.output(entry);
    }
  }

  /**
   * Info level logging
   */
  info(
    message: string,
    context?: LogContext,
    metadata?: Record<string, string | number | boolean>
  ): void {
    const entry: LogEntry = {
      level: 'info',
      message: sanitizeLogMessage(message),
    };

    const validatedContext = validateLogContext(context);
    if (validatedContext) entry.context = validatedContext;

    const validatedMetadata = validateLogContext(metadata);
    if (validatedMetadata) entry.metadata = validatedMetadata;

    this.output(entry);
  }

  /**
   * Warning level logging
   */
  warn(
    message: string,
    context?: LogContext,
    metadata?: Record<string, string | number | boolean>
  ): void {
    const entry: LogEntry = {
      level: 'warn',
      message: sanitizeLogMessage(message),
    };

    const validatedContext = validateLogContext(context);
    if (validatedContext) entry.context = validatedContext;

    const validatedMetadata = validateLogContext(metadata);
    if (validatedMetadata) entry.metadata = validatedMetadata;

    this.output(entry);
  }

  /**
   * Error level logging
   */
  error(
    message: string,
    error?: Error | string,
    context?: LogContext,
    metadata?: Record<string, string | number | boolean>
  ): void {
    const entry: LogEntry = {
      level: 'error',
      message: sanitizeLogMessage(message),
    };

    if (error) entry.error = error;

    const validatedContext = validateLogContext(context);
    if (validatedContext) entry.context = validatedContext;

    const validatedMetadata = validateLogContext(metadata);
    if (validatedMetadata) entry.metadata = validatedMetadata;

    this.output(entry);
  }

  /**
   * Fatal level logging for critical errors
   */
  fatal(
    message: string,
    error?: Error | string,
    context?: LogContext,
    metadata?: Record<string, string | number | boolean>
  ): void {
    const entry: LogEntry = {
      level: 'fatal',
      message: sanitizeLogMessage(message),
    };

    if (error) entry.error = error;

    const validatedContext = validateLogContext(context);
    if (validatedContext) entry.context = validatedContext;

    const validatedMetadata = validateLogContext(metadata);
    if (validatedMetadata) entry.metadata = validatedMetadata;

    this.output(entry);
  }

  /**
   * Create contextual logger with predefined context
   */
  withContext(baseContext: LogContext): Logger {
    const contextualLogger = new Logger();

    // Override debug method
    contextualLogger.debug = (
      message: string,
      context?: LogContext,
      metadata?: Record<string, string | number | boolean>
    ) => {
      const finalContext = { ...baseContext, ...context };
      this.debug(message, finalContext, metadata);
    };

    // Override info method
    contextualLogger.info = (
      message: string,
      context?: LogContext,
      metadata?: Record<string, string | number | boolean>
    ) => {
      const finalContext = { ...baseContext, ...context };
      this.info(message, finalContext, metadata);
    };

    // Override warn method
    contextualLogger.warn = (
      message: string,
      context?: LogContext,
      metadata?: Record<string, string | number | boolean>
    ) => {
      const finalContext = { ...baseContext, ...context };
      this.warn(message, finalContext, metadata);
    };

    // Override error method
    contextualLogger.error = (
      message: string,
      error?: Error | string,
      context?: LogContext,
      metadata?: Record<string, string | number | boolean>
    ) => {
      const finalContext = { ...baseContext, ...context };
      this.error(message, error, finalContext, metadata);
    };

    // Override fatal method
    contextualLogger.fatal = (
      message: string,
      error?: Error | string,
      context?: LogContext,
      metadata?: Record<string, string | number | boolean>
    ) => {
      const finalContext = { ...baseContext, ...context };
      this.fatal(message, error, finalContext, metadata);
    };

    return contextualLogger;
  }

  /**
   * Create request-scoped logger with HTTP context
   */
  forRequest(request: Request): Logger {
    const url = new URL(request.url);
    const context: LogContext = {
      method: request.method,
      url: url.pathname + url.search,
      userAgent: request.headers.get('user-agent') || '',
      requestId: request.headers.get('x-request-id') || '',
      timestamp: new Date().toISOString(),
    };

    // Add Vercel-specific headers if available
    if (this.isVercel) {
      const vercelContext = {
        region: request.headers.get('x-vercel-id') || undefined,
        deployment: env.VERCEL_URL || undefined,
        environment: env.VERCEL_ENV || undefined,
      };
      Object.assign(context, vercelContext);
    }

    return this.withContext(context);
  }

  /**
   * Performance timing helper
   */
  time<T>(label: string, fn: () => T | Promise<T>, context?: LogContext): Promise<T> {
    return this.timeAsync(label, fn, context);
  }

  private async timeAsync<T>(
    label: string,
    fn: () => T | Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = performance.now();
    this.debug(`Starting: ${label}`, context);

    try {
      const result = await fn();
      const duration = performance.now() - start;

      this.info(`Completed: ${label}`, context, {
        duration: `${duration.toFixed(2)}ms`,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - start;

      this.error(
        `Failed: ${label}`,
        error instanceof Error ? error : new Error(String(error)),
        context,
        {
          duration: `${duration.toFixed(2)}ms`,
          success: false,
        }
      );

      throw error;
    }
  }

  /**
   * CLI-specific logging methods for scripts and build processes
   * Provides environment-aware output suitable for command line interfaces
   */

  /**
   * Simple console log for CLI scripts (environment-aware)
   */
  log(message: string, ...args: unknown[]): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const isVerbose = process.env.VERBOSE === 'true';

    if (!isProduction || isVerbose) {
      // biome-ignore lint/suspicious/noConsole: CLI output for scripts
      console.log(message, ...args);
    }
  }

  /**
   * Progress indicator for long-running operations
   */
  progress(message: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const isVerbose = process.env.VERBOSE === 'true';
    const isCI = process.env.CI === 'true';

    if (!isProduction || isVerbose || isCI) {
      process.stdout.write(`${message}\r`);
    }
  }

  /**
   * Success message with emoji for CLI
   */
  success(message: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const isVerbose = process.env.VERBOSE === 'true';

    if (!isProduction || isVerbose) {
      // biome-ignore lint/suspicious/noConsole: CLI output for scripts
      console.log(`✅ ${message}`);
    }
  }

  /**
   * Failure message with emoji for CLI (always shown)
   */
  failure(message: string): void {
    // Always log failures
    // biome-ignore lint/suspicious/noConsole: CLI output for scripts
    console.error(`❌ ${message}`);
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for backward compatibility
export const log = {
  debug: (
    message: string,
    context?: LogContext,
    metadata?: Record<string, string | number | boolean>
  ) => logger.debug(message, context, metadata),

  info: (
    message: string,
    context?: LogContext,
    metadata?: Record<string, string | number | boolean>
  ) => logger.info(message, context, metadata),

  warn: (
    message: string,
    context?: LogContext,
    metadata?: Record<string, string | number | boolean>
  ) => logger.warn(message, context, metadata),

  error: (
    message: string,
    error?: Error | string,
    context?: LogContext,
    metadata?: Record<string, string | number | boolean>
  ) => logger.error(message, error, context, metadata),

  fatal: (
    message: string,
    error?: Error | string,
    context?: LogContext,
    metadata?: Record<string, string | number | boolean>
  ) => logger.fatal(message, error, context, metadata),
};

// Export scriptLogger for backward compatibility with CLI scripts
export const scriptLogger = {
  log: (message: string, ...args: unknown[]) => logger.log(message, ...args),
  info: (message: string, ..._args: unknown[]) => logger.info(message),
  warn: (message: string, ..._args: unknown[]) => logger.warn(message),
  error: (message: string, ...args: unknown[]) =>
    logger.error(message, args[0] instanceof Error ? args[0] : undefined),
  debug: (message: string) => logger.debug(message),
  progress: (message: string) => logger.progress(message),
  success: (message: string) => logger.success(message),
  failure: (message: string) => logger.failure(message),
};

export default logger;
