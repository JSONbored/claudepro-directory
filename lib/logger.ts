/**
 * Structured logging utility optimized for Vercel environments
 * Provides better observability and error tracking than console statements
 */

import { env, isDevelopment, isProduction, isVercel } from './schemas/env.schema';
import {
  type LogContext,
  type LogLevel,
  parseDevelopmentLogComponents,
  sanitizeLogMessage,
  validateLogContext,
} from './schemas/logger.schema';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error | string;
  metadata?: Record<string, string | number | boolean>;
}

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

    const { timestamp, level, message, context, metadata, error } = components;

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
   */
  private output(entry: LogEntry): void {
    // In production, only output errors and fatal logs
    if (this.isProduction && entry.level !== 'error' && entry.level !== 'fatal') {
      return;
    }

    const formattedLog = this.formatLog(entry);

    switch (entry.level) {
      case 'debug':
        console.debug(formattedLog);
        break;
      case 'info':
        console.info(formattedLog);
        break;
      case 'warn':
        console.warn(formattedLog);
        break;
      case 'error':
      case 'fatal':
        console.error(formattedLog);
        break;
      default:
        console.log(formattedLog);
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

export default logger;
