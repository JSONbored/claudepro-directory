/**
 * React Hook for Client-Side Logging
 * 
 * Provides a React hook for consistent client-side logging with automatic
 * component-level context and session ID management.
 * 
 * **⚠️ IMPORTANT: Client-Only Hook**
 * - ✅ **SAFE** to use in client components (`'use client'`)
 * - ❌ **DO NOT** use in server components (uses React hooks and browser APIs)
 * - For server-side logging, use {@link ../logging/server | Server Logging Barrel} instead
 * 
 * **Features:**
 * - Automatic component-level bindings (set once per component mount)
 * - Session ID management (via {@link ../utils/client-session | client-session})
 * - Standardized context creation (via {@link ../utils/client-logger | client-logger})
 * - Performance-optimized (bindings set once, not per log call)
 * 
 * **Consistency:**
 * - Uses existing {@link ../logger | logger} instance (same as server-side)
 * - Uses {@link ../utils/client-logger.createClientLogContext | createClientLogContext} internally
 * - Uses {@link ../utils/client-session.getOrCreateSessionId | getOrCreateSessionId} for session IDs
 * - Message-first API matches server-side patterns
 * 
 * **Related Modules:**
 * - {@link ../logging/client | Client Logging Barrel} - Recommended import path for client components
 * - {@link ../utils/client-logger | Client Logger Utilities} - Lower-level utilities used by this hook
 * - {@link ../utils/client-session | Client Session Management} - Session ID generation
 * - {@link ../logger | Logger Instance} - Main logger instance
 * 
 * @module web-runtime/hooks/use-client-logger
 * @see {@link ../logging/client | Client Logging Barrel} - Recommended import path
 * @see {@link ../utils/client-logger | Client Logger Utilities} - Lower-level utilities
 * @see {@link ../utils/client-session | Client Session Management} - Session ID generation
 * @see {@link ../logger | Logger Instance} - Main logger instance
 */

'use client';

import { useMemo } from 'react';
import { normalizeError } from '../errors.ts';
import { logger, toLogContextValue, type LogContext } from '../logger.ts';
import { getOrCreateSessionId } from '../utils/client-session.ts';
import { createClientLogContext, type ClientLogContext } from '../utils/client-logger.ts';

export interface UseClientLoggerOptions {
  /**
   * Component name (used in logs)
   */
  component: string;
  /**
   * Module path (e.g., 'data/drafts', 'hooks/use-local-storage')
   */
  module?: string;
  /**
   * Additional context to include in all logs
   */
  context?: Record<string, unknown>;
}

export interface ClientLogger {
  /**
   * Log an error
   */
  error: (message: string, error: unknown, action?: string, additionalContext?: Record<string, unknown>) => void;
  /**
   * Log a warning
   */
  warn: (message: string, error?: unknown, action?: string, additionalContext?: Record<string, unknown>) => void;
  /**
   * Log an info message
   */
  info: (message: string, action?: string, additionalContext?: Record<string, unknown>) => void;
  /**
   * Log a debug message
   */
  debug: (message: string, action?: string, additionalContext?: Record<string, unknown>) => void;
  /**
   * Get the current log context (useful for passing to other functions)
   */
  getContext: (action?: string, additionalContext?: Record<string, unknown>) => ClientLogContext;
}

/**
 * React hook for client-side logging with automatic component context
 * 
 * Sets up component-level logger bindings and provides standardized logging methods.
 * 
 * **Performance:**
 * - Bindings set once per component mount (not per log call)
 * - Session ID retrieved once per component (cached via useMemo)
 * - No re-renders triggered by logging
 * 
 * **Automatic Features:**
 * - Component-level bindings (via {@link ../logger.setBindings | logger.setBindings()})
 * - Session ID injection (via {@link ../utils/client-session.getOrCreateSessionId | getOrCreateSessionId()})
 * - Standardized context creation (via {@link ../utils/client-logger.createClientLogContext | createClientLogContext()})
 * 
 * **Consistency:**
 * - Uses same {@link ../logger | logger} instance as server-side
 * - Uses same {@link ../utils/client-logger | client-logger} utilities internally
 * - Message-first API matches server-side patterns
 * 
 * @param options - Component and module information
 * @param options.context - Additional context to include in all logs (should be memoized to avoid unnecessary re-renders)
 * @remarks If passing a context object, ensure it is memoized (e.g., via useMemo) to avoid unnecessary re-renders and stale closures.
 * @returns Logger object with standardized methods (error, warn, info, debug, getContext)
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const log = useClientLogger({
 *     component: 'MyComponent',
 *     module: 'components/my-component',
 *   });
 * 
 *   const handleClick = async () => {
 *     try {
 *       await someAsyncOperation();
 *       log.info('Operation succeeded', 'handleClick');
 *     } catch (error) {
 *       log.error('Operation failed', error, 'handleClick');
 *     }
 *   };
 * 
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 * 
 * @see {@link ../utils/client-logger | Client Logger Utilities} - Lower-level utilities used internally
 * @see {@link ../utils/client-session | Client Session Management} - Session ID generation
 * @see {@link ../logger.setBindings | logger.setBindings} - How bindings are set
 * @see {@link ../hooks/use-logged-async | useLoggedAsync} - Alternative for async operations
 */
export function useClientLogger(options: UseClientLoggerOptions): ClientLogger {
  const { component, module, context: additionalContext } = options;

  // Get session ID once per component
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  // Create per-component child logger to avoid race conditions from global setBindings
  const componentLogger = useMemo(() => {
    const bindings: Record<string, unknown> = {
      component,
      sessionId,
      ...(module && { module }),
      ...additionalContext,
    };
    return logger.child(bindings);
  }, [component, module, sessionId, additionalContext]);

  // Create logger methods with standardized context
  const log: ClientLogger = useMemo(() => {
    const createOperation = (action?: string): string => {
      return action ? `${component}.${action}` : component;
    };

    return {
      error: (message: string, error: unknown, action?: string, extraContext?: Record<string, unknown>) => {
        const operation = createOperation(action);
        const clientContext = createClientLogContext(operation, {
          ...(component !== undefined && { component }),
          ...(module !== undefined && { module }),
          ...(action !== undefined && { action }),
          ...additionalContext,
          ...extraContext,
        });
        // Convert ClientLogContext to LogContext (convert unknown values to LogContextValue)
        const logContext: LogContext = Object.fromEntries(
          Object.entries(clientContext).map(([key, value]) => [key, toLogContextValue(value)])
        ) as LogContext;
        const normalized = normalizeError(error, message);
        componentLogger.error({ err: normalized, ...logContext }, message);
      },

      warn: (message: string, error?: unknown, action?: string, extraContext?: Record<string, unknown>) => {
        const operation = createOperation(action);
        const clientContext = createClientLogContext(operation, {
          ...(component !== undefined && { component }),
          ...(module !== undefined && { module }),
          ...(action !== undefined && { action }),
          ...additionalContext,
          ...extraContext,
        });
        // Convert ClientLogContext to LogContext (convert unknown values to LogContextValue)
        const logContext: LogContext = Object.fromEntries(
          Object.entries(clientContext).map(([key, value]) => [key, toLogContextValue(value)])
        ) as LogContext;
        if (error !== undefined) {
          const normalized = normalizeError(error, message);
          componentLogger.warn({ err: normalized, ...logContext }, message);
        } else {
          componentLogger.warn(logContext, message);
        }
      },

      info: (message: string, action?: string, extraContext?: Record<string, unknown>) => {
        const operation = createOperation(action);
        const clientContext = createClientLogContext(operation, {
          ...(component !== undefined && { component }),
          ...(module !== undefined && { module }),
          ...(action !== undefined && { action }),
          ...additionalContext,
          ...extraContext,
        });
        // Convert ClientLogContext to LogContext (convert unknown values to LogContextValue)
        const logContext: LogContext = Object.fromEntries(
          Object.entries(clientContext).map(([key, value]) => [key, toLogContextValue(value)])
        ) as LogContext;
        componentLogger.info(logContext, message);
      },

      debug: (message: string, action?: string, extraContext?: Record<string, unknown>) => {
        const operation = createOperation(action);
        const clientContext = createClientLogContext(operation, {
          ...(component !== undefined && { component }),
          ...(module !== undefined && { module }),
          ...(action !== undefined && { action }),
          ...additionalContext,
          ...extraContext,
        });
        // Convert ClientLogContext to LogContext (convert unknown values to LogContextValue)
        const logContext: LogContext = Object.fromEntries(
          Object.entries(clientContext).map(([key, value]) => [key, toLogContextValue(value)])
        ) as LogContext;
        componentLogger.debug(logContext, message);
      },

      getContext: (action?: string, extraContext?: Record<string, unknown>): ClientLogContext => {
        const operation = createOperation(action);
        return createClientLogContext(operation, {
          ...(component !== undefined && { component }),
          ...(module !== undefined && { module }),
          ...(action !== undefined && { action }),
          ...additionalContext,
          ...extraContext,
        });
      },
    };
  }, [component, module, sessionId, additionalContext, componentLogger]);

  return log;
}
