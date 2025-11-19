/** Pino-based structured logger for production and development */

import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Config via env vars (set from Statsig logger_console/logger_verbose flags)
const loggerConsoleEnabled = process.env['NEXT_PUBLIC_LOGGER_CONSOLE'] === 'true';
const loggerVerbose = process.env['NEXT_PUBLIC_LOGGER_VERBOSE'] === 'true';

// Configure pino with minimal setup
// In development, use basic console output to avoid thread-stream issues with Turbopack
const pinoInstance = isDevelopment
  ? pino({
      level: loggerVerbose ? 'debug' : 'info',
      browser: {
        disabled: !loggerConsoleEnabled,
      },
    })
  : pino({
      level: loggerVerbose ? 'debug' : 'info',
      browser: {
        disabled: !loggerConsoleEnabled,
      },
    });

type LogContext = Record<string, string | number | boolean>;

/**
 * Sanitize log message to prevent log injection
 * Removes control characters including newlines, carriage returns, and tabs, and limits length
 */
function sanitizeLogMessage(message: string): string {
  if (typeof message !== 'string') return String(message);
  // Remove newlines, carriage returns, and tabs to prevent log injection
  // Then remove remaining control characters
  let sanitized = message
    .replace(/[\r\n\t]/g, ' ') // Replace newlines, carriage returns, and tabs with spaces
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Remove all control characters (0x00-0x1F, 0x7F-0x9F)
      return code >= 0x20 && (code < 0x7f || code > 0x9f);
    })
    .join('');
  // Limit length to prevent log flooding
  if (sanitized.length > 1000) {
    sanitized = `${sanitized.slice(0, 1000)}... [truncated]`;
  }
  return sanitized;
}

/**
 * Sanitize log context values to prevent log injection
 * Recursively sanitizes string values in context objects
 */
function sanitizeLogContext(context?: LogContext): LogContext | undefined {
  if (!context) return context;
  // Use Object.create(null) to create a plain object without prototype
  // This prevents prototype pollution attacks since there's no __proto__ to pollute
  const sanitized = Object.create(null) as LogContext;
  for (const [key, value] of Object.entries(context)) {
    // Validate key to prevent prototype pollution: only allow safe property names
    // Skip keys that could be used for attacks (e.g., __proto__, constructor)
    // Also sanitize key to ensure it's a valid identifier
    if (!key || typeof key !== 'string') continue;
    // Only allow alphanumeric, underscore, and hyphen in keys (safe for logging)
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) continue;

    if (typeof value === 'string') {
      // Sanitize string values: remove control characters including newlines and tabs, limit length
      let sanitizedValue = value
        .replace(/[\r\n\t]/g, ' ') // Replace newlines, carriage returns, and tabs with spaces
        .split('')
        .filter((char) => {
          const code = char.charCodeAt(0);
          // Remove all control characters (0x00-0x1F, 0x7F-0x9F)
          return code >= 0x20 && (code < 0x7f || code > 0x9f);
        })
        .join('');
      if (sanitizedValue.length > 500) {
        sanitizedValue = `${sanitizedValue.slice(0, 500)}... [truncated]`;
      }
      sanitized[key] = sanitizedValue;
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// Wrapper to match existing API signature
class Logger {
  debug(message: string, context?: LogContext, metadata?: LogContext): void {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedContext = sanitizeLogContext(context);
    const sanitizedMetadata = sanitizeLogContext(metadata);
    pinoInstance.debug({ ...sanitizedContext, ...sanitizedMetadata }, sanitizedMessage);
  }

  info(message: string, context?: LogContext, metadata?: LogContext): void {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedContext = sanitizeLogContext(context);
    const sanitizedMetadata = sanitizeLogContext(metadata);
    pinoInstance.info({ ...sanitizedContext, ...sanitizedMetadata }, sanitizedMessage);
  }

  warn(message: string, context?: LogContext, metadata?: LogContext): void {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedContext = sanitizeLogContext(context);
    const sanitizedMetadata = sanitizeLogContext(metadata);
    pinoInstance.warn({ ...sanitizedContext, ...sanitizedMetadata }, sanitizedMessage);
  }

  error(
    message: string,
    error?: Error | string,
    context?: LogContext,
    metadata?: LogContext
  ): void {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedContext = sanitizeLogContext(context);
    const sanitizedMetadata = sanitizeLogContext(metadata);
    const logData: Record<string, unknown> = { ...sanitizedContext, ...sanitizedMetadata };
    if (error !== undefined) {
      // For Error objects, extract message safely
      if (error instanceof Error) {
        logData['err'] = {
          message: sanitizeLogMessage(error.message),
          name: error.name,
          stack: error.stack ? sanitizeLogMessage(error.stack) : undefined,
        };
      } else if (typeof error === 'string') {
        logData['err'] = sanitizeLogMessage(error);
      } else {
        // For unknown error types, convert to string and sanitize to prevent log injection
        logData['err'] = sanitizeLogMessage(String(error));
      }
    }
    pinoInstance.error(logData, sanitizedMessage);
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
