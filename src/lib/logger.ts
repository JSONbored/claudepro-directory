/**
 * Structured logging utility optimized for Vercel environments
 * Provides better observability and error tracking than console statements
 */

import { isDevelopment, isProduction, isVercel } from './env-client';

type LogContext = Record<string, string | number | boolean>;

type LogEntry = {
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  context?: LogContext;
  metadata?: Record<string, string | number | boolean>;
  error?: Error | string;
};

function sanitizeLogMessage(msg: unknown): string {
  const str = String(msg).slice(0, 10000);
  return str.replace(/<script|javascript:|data:/gi, '[BLOCKED]');
}

function validateLogContext(ctx: unknown): LogContext | null {
  if (!ctx || typeof ctx !== 'object') return null;
  const result: LogContext = {};
  for (const [k, v] of Object.entries(ctx as Record<string, unknown>)) {
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      result[k] = v;
    }
  }
  return result;
}

function parseDevelopmentLogComponents(obj: Record<string, unknown>): {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
} {
  return { success: true, data: obj };
}

class Logger {
  private isDevelopment = isDevelopment;
  private isProduction = isProduction;
  private isVercel = isVercel;

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

  private formatForDevelopment(logObject: Record<string, unknown>): string {
    const components = parseDevelopmentLogComponents(logObject);
    if (!(components?.success && components.data)) {
      return `[INVALID LOG] ${JSON.stringify(logObject)}`;
    }

    const { timestamp, level, message, context, metadata, error } = components.data as {
      timestamp?: string;
      level?: string;
      message?: string;
      context?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
      error?: Record<string, unknown>;
    };

    let output = `[${timestamp}] ${String(level).toUpperCase()}: ${message}`;

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

  private output(entry: LogEntry): void {
    if (
      typeof window !== 'undefined' ||
      typeof document !== 'undefined' ||
      typeof navigator !== 'undefined' ||
      process.env.NEXT_RUNTIME === 'edge'
    ) {
      return;
    }

    if (!process?.env) return;
    if (this.isProduction && entry.level === 'debug') return;

    const formattedLog = this.formatLog(entry);

    if (entry.level === 'debug' && this.isDevelopment) {
      // biome-ignore lint/suspicious/noConsole: Development debug logging
      console.debug(`[DEBUG] ${formattedLog}`);
      return;
    }

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

  withContext(baseContext: LogContext): Logger {
    const contextualLogger = new Logger();

    contextualLogger.debug = (
      message: string,
      context?: LogContext,
      metadata?: Record<string, string | number | boolean>
    ) => {
      const finalContext = { ...baseContext, ...context };
      this.debug(message, finalContext, metadata);
    };

    contextualLogger.info = (
      message: string,
      context?: LogContext,
      metadata?: Record<string, string | number | boolean>
    ) => {
      const finalContext = { ...baseContext, ...context };
      this.info(message, finalContext, metadata);
    };

    contextualLogger.warn = (
      message: string,
      context?: LogContext,
      metadata?: Record<string, string | number | boolean>
    ) => {
      const finalContext = { ...baseContext, ...context };
      this.warn(message, finalContext, metadata);
    };

    contextualLogger.error = (
      message: string,
      error?: Error | string,
      context?: LogContext,
      metadata?: Record<string, string | number | boolean>
    ) => {
      const finalContext = { ...baseContext, ...context };
      this.error(message, error, finalContext, metadata);
    };

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

  forRequest(request: Request): Logger {
    const url = new URL(request.url);
    const context: LogContext = {
      method: request.method,
      url: url.pathname + url.search,
      userAgent: request.headers.get('user-agent') || '',
      requestId: request.headers.get('x-request-id') || '',
      timestamp: new Date().toISOString(),
    };

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

  log(message: string, ...args: unknown[]): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const isVerbose = process.env.VERBOSE === 'true';
    const isCI = process.env.CI === 'true' || process.env.VERCEL === '1';

    if (!isProduction || isVerbose || isCI) {
      // biome-ignore lint/suspicious/noConsole: CLI output for scripts
      console.log(message, ...args);
    }
  }

  progress(message: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const isVerbose = process.env.VERBOSE === 'true';
    const isCI = process.env.CI === 'true' || process.env.VERCEL === '1';

    if (!isProduction || isVerbose || isCI) {
      // biome-ignore lint/suspicious/noConsole: Progress logging
      console.log(message);
    }
  }

  success(message: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const isVerbose = process.env.VERBOSE === 'true';
    const isCI = process.env.CI === 'true' || process.env.VERCEL === '1';

    if (!isProduction || isVerbose || isCI) {
      // biome-ignore lint/suspicious/noConsole: CLI output for scripts
      console.log(`? ${message}`);
    }
  }

  failure(message: string): void {
    // biome-ignore lint/suspicious/noConsole: CLI output for scripts
    console.error(`? ${message}`);
  }

  metadataValidation(
    route: string,
    success: boolean,
    details?: {
      titleLength?: number;
      descLength?: number;
      keywordCount?: number;
      errors?: string[];
    }
  ): void {
    if (success) {
      this.debug(`? Metadata validated: ${route}`, {
        route,
        titleLength: details?.titleLength?.toString() || 'unknown',
        descLength: details?.descLength?.toString() || 'unknown',
        keywords: details?.keywordCount?.toString() || '0',
      });
    } else {
      this.error(
        `? Metadata validation failed: ${route}`,
        details?.errors?.join(', ') || 'Unknown validation error',
        { route }
      );
    }
  }

  metadataPerformance(route: string, durationMs: number): void {
    const metadata = {
      route,
      duration: durationMs.toString(),
    };

    if (durationMs > 100) {
      this.warn(`?? Slow metadata generation: ${route} (${durationMs}ms)`, {}, metadata);
    } else if (this.isDevelopment) {
      this.debug(`? Metadata generated: ${route} (${durationMs}ms)`, {}, metadata);
    }
  }

  seoMetrics(metrics: {
    totalRoutes: number;
    validatedRoutes: number;
    failedRoutes: number;
    avgTitleLength: number;
    avgDescLength: number;
  }): void {
    const complianceRate = ((metrics.validatedRoutes / metrics.totalRoutes) * 100).toFixed(1);

    this.info(`?? SEO Compliance: ${complianceRate}%`, {
      totalRoutes: metrics.totalRoutes.toString(),
      validated: metrics.validatedRoutes.toString(),
      failed: metrics.failedRoutes.toString(),
      avgTitleLength: metrics.avgTitleLength.toString(),
      avgDescLength: metrics.avgDescLength.toString(),
    });
  }
}

export const logger = new Logger();
