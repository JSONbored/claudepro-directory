import pino from 'pino';

const isDevelopment = process.env['NODE_ENV'] === 'development';
const loggerConsoleEnabled = process.env['NEXT_PUBLIC_LOGGER_CONSOLE'] === 'true';
const loggerVerbose = process.env['NEXT_PUBLIC_LOGGER_VERBOSE'] === 'true';

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
  | { readonly [key: string]: LogContextValue };

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

export function sanitizeLogMessage(message: string): string {
  if (typeof message !== 'string') return String(message);
  // Remove all ASCII control characters (except space), including line breaks and tabs
  let sanitized = message.replace(/[\r\n\t\x00-\x1F]/g, '');
  if (sanitized.length > 1000) {
    sanitized = `${sanitized.slice(0, 1000)}... [truncated]`;
  }
  return sanitized;
}

function sanitizeStringValue(value: string, maxLength = 500): string {
  let sanitized = value
    .replace(/[\r\n\t]/g, ' ')
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 0x20 && (code < 0x7f || code > 0x9f);
    })
    .join('');
  if (sanitized.length > maxLength) {
    sanitized = `${sanitized.slice(0, maxLength)}... [truncated]`;
  }
  return sanitized;
}

export function sanitizeLogContext(
  context?: LogContext,
  depth = 0,
  sizeLimit = 10 * 1024
): LogContext | undefined {
  if (!context) return context;
  if (depth > 5) {
    return { '[error]': 'Context too deeply nested' } as LogContext;
  }
  const sanitized = Object.create(null) as LogContext;
  let currentSize = 0;

  for (const [key, value] of Object.entries(context)) {
    if (!key || typeof key !== 'string') continue;
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) continue;

    const keySize = key.length;
    if (currentSize + keySize > sizeLimit) {
      sanitized['[truncated]'] = 'Context size limit exceeded';
      break;
    }
    currentSize += keySize;

    if (value === null) {
      sanitized[key] = null;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeStringValue(value);
      currentSize += sanitized[key].length;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = value;
      currentSize += 8;
    } else if (Array.isArray(value)) {
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
          const nested = sanitizeLogContext(item as LogContext, depth + 1, sizeLimit - currentSize);
          if (nested) {
            sanitizedArray.push(nested);
            currentSize += JSON.stringify(nested).length;
          }
        } else if (Array.isArray(item)) {
          sanitizedArray.push('[nested array truncated]');
        }
      }
      sanitized[key] = sanitizedArray;
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      const nested = sanitizeLogContext(value as LogContext, depth + 1, sizeLimit - currentSize);
      if (nested) {
        sanitized[key] = nested;
        currentSize += JSON.stringify(nested).length;
      }
    }
  }

  return sanitized;
}

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

  error(message: string, error?: Error | string, context?: LogContext, metadata?: LogContext): void {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedContext = sanitizeLogContext(context);
    const sanitizedMetadata = sanitizeLogContext(metadata);
    const logData: Record<string, unknown> = { ...sanitizedContext, ...sanitizedMetadata };
    if (error !== undefined) {
      if (error instanceof Error) {
        logData['err'] = {
          message: sanitizeLogMessage(error.message),
          name: error.name,
          stack: error.stack ? sanitizeLogMessage(error.stack) : undefined,
        };
      } else if (typeof error === 'string') {
        logData['err'] = sanitizeLogMessage(error);
      } else {
        logData['err'] = sanitizeLogMessage(String(error));
      }
    }
    pinoInstance.error(logData, sanitizedMessage);
  }

  fatal(message: string, error?: Error | string, context?: LogContext, metadata?: LogContext): void {
    const sanitizedMessage = sanitizeLogMessage(message);
    const sanitizedContext = sanitizeLogContext(context);
    const sanitizedMetadata = sanitizeLogContext(metadata);
    const logData: Record<string, unknown> = { ...sanitizedContext, ...sanitizedMetadata };
    if (error !== undefined) {
      if (error instanceof Error) {
        logData['err'] = {
          message: sanitizeLogMessage(error.message),
          name: error.name,
          stack: error.stack ? sanitizeLogMessage(error.stack) : undefined,
        };
      } else if (typeof error === 'string') {
        logData['err'] = sanitizeLogMessage(error);
      } else {
        logData['err'] = sanitizeLogMessage(String(error));
      }
    }
    pinoInstance.fatal(logData, sanitizedMessage);
  }

  forRequest(request: Request): Logger {
    const url = new URL(request.url);
    const child = pinoInstance.child({
      method: request.method,
      url: url.pathname + url.search,
      userAgent: request.headers.get('user-agent') || '',
    });
    return Object.assign(new Logger(), { pinoInstance: child });
  }
}

export const logger = new Logger();
