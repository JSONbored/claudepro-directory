import { logger, type LogContextValue } from './logger.ts';

type LoggerContext = Record<string, LogContextValue>;
type ContextInput = Record<string, LogContextValue | undefined> | undefined;

function sanitizeContext(context: ContextInput): LoggerContext | undefined {
  if (!context) return undefined;
  const entries = Object.entries(context).filter(
    (entry): entry is [string, LogContextValue] => entry[1] !== undefined
  );
  if (entries.length === 0) {
    return undefined;
  }
  return Object.fromEntries(entries) as LoggerContext;
}

export function normalizeError(error: unknown, fallbackMessage = 'Unknown error'): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(fallbackMessage);
  }
}

export function logActionFailure(
  actionName: string,
  error: unknown,
  context?: ContextInput
): Error {
  const normalized = normalizeError(error);
  logger.error(`[Action] ${actionName} failed`, normalized, sanitizeContext(context));
  return normalized;
}

export function logClientWarning(
  message: string,
  error: unknown,
  context?: ContextInput
): Error {
  const normalized = normalizeError(error);
  const sanitized = sanitizeContext(context);
  logger.warn(message, { ...(sanitized ?? {}), error: normalized.message });
  return normalized;
}

export function logUnhandledPromise(
  promiseName: string,
  error: unknown,
  context?: ContextInput
): Error {
  const normalized = normalizeError(error);
  logger.error(`[Promise] ${promiseName} rejected`, normalized, sanitizeContext(context));
  return normalized;
}
