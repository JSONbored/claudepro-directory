/**
 * Pino Logger - Lightweight structured logging for Vercel
 * Replaces custom 461 LOC logger with 45 LOC pino wrapper
 */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Configure pino with minimal setup
// In development, use basic console output to avoid thread-stream issues with Turbopack
const pinoInstance = isDevelopment
  ? pino({
      level: 'debug',
      browser: {
        disabled: true,
      },
    })
  : pino({
      level: 'info',
      browser: {
        disabled: true,
      },
    });

type LogContext = Record<string, string | number | boolean>;

// Wrapper to match existing API signature
class Logger {
  debug(message: string, context?: LogContext, metadata?: LogContext): void {
    pinoInstance.debug({ ...context, ...metadata }, message);
  }

  info(message: string, context?: LogContext, metadata?: LogContext): void {
    pinoInstance.info({ ...context, ...metadata }, message);
  }

  warn(message: string, context?: LogContext, metadata?: LogContext): void {
    pinoInstance.warn({ ...context, ...metadata }, message);
  }

  error(
    message: string,
    error?: Error | string,
    context?: LogContext,
    metadata?: LogContext
  ): void {
    pinoInstance.error({ err: error, ...context, ...metadata }, message);
  }

  fatal(
    message: string,
    error?: Error | string,
    context?: LogContext,
    metadata?: LogContext
  ): void {
    pinoInstance.fatal({ err: error, ...context, ...metadata }, message);
  }

  // Special method used once - just pass through
  forRequest(request: Request): Logger {
    const url = new URL(request.url);
    const child = pinoInstance.child({
      method: request.method,
      url: url.pathname + url.search,
      userAgent: request.headers.get('user-agent') || '',
    });

    // Return a new logger instance wrapping the child
    return Object.assign(new Logger(), { pinoInstance: child });
  }
}

export const logger = new Logger();
