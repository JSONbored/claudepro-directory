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

/**
 * Log context value type - supports primitives, arrays, and nested objects
 * Recursive type allows nested structures while maintaining type safety
 */
export type LogContextValue =
  | string
  | number
  | boolean
  | null
  | readonly string[]
  | readonly number[]
  | readonly boolean[]
  | ReadonlyArray<LogContextValue>
  | { readonly [key: string]: LogContextValue };

type LogContext = Record<string, LogContextValue>;

/**
 * Convert a value to LogContextValue safely
 * Handles Json types from database and plain objects
 * This function ensures type safety when converting complex types to LogContextValue
 */
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
  // Fallback: convert to string for unknown types
  return String(value);
}

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
 * Sanitize a single string value to prevent log injection
 */
function sanitizeStringValue(value: string, maxLength = 500): string {
  let sanitized = value
    .replace(/[\r\n\t]/g, ' ') // Replace newlines, carriage returns, and tabs with spaces
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Remove all control characters (0x00-0x1F, 0x7F-0x9F)
      return code >= 0x20 && (code < 0x7f || code > 0x9f);
    })
    .join('');
  if (sanitized.length > maxLength) {
    sanitized = `${sanitized.slice(0, maxLength)}... [truncated]`;
  }
  return sanitized;
}

/**
 * Sanitize log context values to prevent log injection
 * Recursively sanitizes string values in context objects, arrays, and nested structures
 * @param context - The context object to sanitize
 * @param depth - Current recursion depth (default: 0, max: 5)
 * @param sizeLimit - Maximum size in bytes for the entire context (default: 10KB)
 * @returns Sanitized context object
 */
function sanitizeLogContext(
  context?: LogContext,
  depth = 0,
  sizeLimit = 10 * 1024
): LogContext | undefined {
  if (!context) return context;

  // Prevent deep nesting attacks (max depth: 5)
  if (depth > 5) {
    return { '[error]': 'Context too deeply nested' } as LogContext;
  }

  // Use Object.create(null) to create a plain object without prototype
  // This prevents prototype pollution attacks since there's no __proto__ to pollute
  const sanitized = Object.create(null) as LogContext;
  let currentSize = 0;

  for (const [key, value] of Object.entries(context)) {
    // Validate key to prevent prototype pollution: only allow safe property names
    // Skip keys that could be used for attacks (e.g., __proto__, constructor)
    // Also sanitize key to ensure it's a valid identifier
    if (!key || typeof key !== 'string') continue;
    // Only allow alphanumeric, underscore, and hyphen in keys (safe for logging)
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) continue;

    // Estimate size (rough approximation)
    const keySize = key.length;
    if (currentSize + keySize > sizeLimit) {
      sanitized['[truncated]'] = 'Context size limit exceeded';
      break;
    }
    currentSize += keySize;

    // Handle different value types
    if (value === null) {
      sanitized[key] = null;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeStringValue(value);
      currentSize += sanitized[key].length;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
      currentSize += 8; // Rough estimate for number/boolean
    } else if (Array.isArray(value)) {
      // Recursively sanitize array elements
      const sanitizedArray: LogContextValue[] = [];
      for (const item of value) {
        if (currentSize > sizeLimit) {
          sanitizedArray.push('[truncated]');
          break;
        }
        if (typeof item === 'string') {
          const sanitizedItem = sanitizeStringValue(item);
          sanitizedArray.push(sanitizedItem);
          currentSize += sanitizedItem.length;
        } else if (typeof item === 'number' || typeof item === 'boolean') {
          sanitizedArray.push(item);
          currentSize += 8;
        } else if (item === null) {
          sanitizedArray.push(null);
        } else if (typeof item === 'object' && !Array.isArray(item)) {
          // Recursively sanitize nested objects in arrays
          const nested = sanitizeLogContext(item as LogContext, depth + 1, sizeLimit - currentSize);
          if (nested) {
            sanitizedArray.push(nested);
            currentSize += JSON.stringify(nested).length;
          }
        } else if (Array.isArray(item)) {
          // Handle nested arrays (flatten or truncate)
          sanitizedArray.push('[nested array truncated]');
        }
      }
      sanitized[key] = sanitizedArray;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // Recursively sanitize nested objects
      const nested = sanitizeLogContext(value as LogContext, depth + 1, sizeLimit - currentSize);
      if (nested) {
        sanitized[key] = nested;
        currentSize += JSON.stringify(nested).length;
      }
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
    pinoInstance.fatal(logData, sanitizedMessage);
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
