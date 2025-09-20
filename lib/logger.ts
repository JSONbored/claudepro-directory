/**
 * Structured logging utility optimized for Vercel environments
 * Provides better observability and error tracking than console statements
 */

export interface LogContext {
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  timestamp?: string;
  requestId?: string;
  [key: string]: string | number | boolean;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error | string;
  metadata?: Record<string, string | number | boolean>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isVercel = process.env.VERCEL === '1';

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
    const timestamp = logObject.timestamp as string;
    const level = logObject.level as string;
    const message = logObject.message as string;
    const context = logObject.context as LogContext | undefined;
    const metadata = logObject.metadata as Record<string, unknown> | undefined;
    const error = logObject.error as { name: string; message: string; stack?: string } | undefined;

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
      const entry: LogEntry = { level: 'debug', message };
      if (context) entry.context = context;
      if (metadata) entry.metadata = metadata;
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
    const entry: LogEntry = { level: 'info', message };
    if (context) entry.context = context;
    if (metadata) entry.metadata = metadata;
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
    const entry: LogEntry = { level: 'warn', message };
    if (context) entry.context = context;
    if (metadata) entry.metadata = metadata;
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
    const entry: LogEntry = { level: 'error', message };
    if (error) entry.error = error;
    if (context) entry.context = context;
    if (metadata) entry.metadata = metadata;
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
    const entry: LogEntry = { level: 'fatal', message };
    if (error) entry.error = error;
    if (context) entry.context = context;
    if (metadata) entry.metadata = metadata;
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
        deployment: process.env.VERCEL_URL || undefined,
        environment: process.env.VERCEL_ENV || undefined,
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
