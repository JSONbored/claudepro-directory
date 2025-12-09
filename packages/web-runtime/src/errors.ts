/**
 * Error Normalization Utilities
 * 
 * Provides error normalization functions that work in both client and server contexts.
 * 
 * **⚠️ IMPORTANT: Universal Module (Client & Server Compatible)**
 * - ✅ **SAFE** to import in client components (`'use client'`)
 * - ✅ **SAFE** to import in server components (server-only)
 * - Error normalization is context-agnostic (no browser or server APIs)
 * 
 * **Usage:**
 * - **Client components**: Import from {@link ../logging/client | Client Logging Barrel}
 * - **Server components**: Import from {@link ../logging/server | Server Logging Barrel}
 * 
 * @module web-runtime/errors
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 */

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

/**
 * Normalize unknown error types to Error objects
 * 
 * **Universal Function (Client & Server Compatible)**
 * - ✅ **SAFE** to call from client components
 * - ✅ **SAFE** to call from server components
 * - No browser or server-specific dependencies
 * 
 * **Usage:**
 * - **Client components**: Import from {@link ../logging/client | Client Logging Barrel}
 * - **Server components**: Import from {@link ../logging/server | Server Logging Barrel}
 * 
 * @param error - Unknown error value (Error, string, object, etc.)
 * @param fallbackMessage - Fallback message if error cannot be converted
 * @returns Normalized Error object
 * 
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 */
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
  
  // Note: Errors are logged with operation and context
  // Client-side errors (client components)
  // Server actions will have context from their logger
  logger.error(`[Action] ${actionName} failed`, normalized, {
    ...sanitizeContext(context),
  });
  return normalized;
}

export function logClientWarning(
  message: string,
  error: unknown,
  context?: ContextInput
): Error {
  const normalized = normalizeError(error);
  const sanitized = sanitizeContext(context);
  // Pino's stdSerializers.err automatically handles error serialization
  // Pass error as 'err' key for proper formatting
  logger.warn(message, { ...(sanitized ?? {}), err: normalized });
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
