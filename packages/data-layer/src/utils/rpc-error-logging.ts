/**
 * RPC Error Logging Utility
 * 
 * Provides error logging for database RPC calls with business context.
 * 
 * NOTE: This focuses on error logging only, not performance metrics.
 * Use Supabase dashboard for query performance monitoring.
 * 
 * Uses Pino logger with centralized configuration for consistent logging
 * across the codebase. Pino automatically handles:
 * - Error serialization (via stdSerializers.err)
 * - Sensitive data redaction (via redact option in config)
 * 
 * The logger wrapper provides a message-first API (consistent with web-runtime and edge-runtime):
 * - logger.info(message, context?)
 * - logger.error(message, error?, context?)
 * - logger.warn(message, context?)
 * 
 * @module data-layer/utils/rpc-error-logging
 */

import pino from 'pino';
import { createPinoConfig, normalizeError } from '@heyclaude/shared-runtime';

// Create Pino logger instance with centralized configuration
// Pino automatically handles error serialization and redaction
const pinoLogger = pino(createPinoConfig({ service: 'data-layer' }));

/**
 * Logger wrapper with message-first API (consistent with web-runtime and edge-runtime)
 * This ensures all data-layer utilities use the same logger API pattern
 */
export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.info(context || {}, message);
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.warn(context || {}, message);
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const logData: Record<string, unknown> = { ...(context || {}) };
    if (error) {
      // Use normalizeError() for consistent error normalization across codebase
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
    }
    pinoLogger.error(logData, message);
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.debug(context || {}, message);
  },
  trace: (message: string, context?: Record<string, unknown>) => {
    pinoLogger.trace(context || {}, message);
  },
  fatal: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    const logData: Record<string, unknown> = { ...(context || {}) };
    if (error) {
      // Use normalizeError() for consistent error normalization across codebase
      const normalized = normalizeError(error, message);
      logData['err'] = normalized;
    }
    pinoLogger.fatal(logData, message);
  },
  /**
   * Get current logger bindings (context that will be included in all logs)
   */
  bindings: (): Record<string, unknown> => {
    return pinoLogger.bindings();
  },
  /**
   * Update logger bindings dynamically (adds to existing bindings)
   */
  setBindings: (bindings: Record<string, unknown>): void => {
    pinoLogger.setBindings(bindings);
  },
  /**
   * Create a child logger with request-scoped context
   * Use this instead of setBindings() to avoid race conditions in concurrent environments
   */
  child: (bindings: Record<string, unknown>) => {
    const childPino = pinoLogger.child(bindings);
    // Return a wrapped child logger with message-first API
    const createChildLogger = (pinoInstance: pino.Logger) => ({
      info: (message: string, context?: Record<string, unknown>) => {
        pinoInstance.info(context || {}, message);
      },
      warn: (message: string, context?: Record<string, unknown>) => {
        pinoInstance.warn(context || {}, message);
      },
      error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
        const logData: Record<string, unknown> = { ...(context || {}) };
        if (error) {
          // Use normalizeError() for consistent error normalization across codebase
          const normalized = normalizeError(error, message);
          logData['err'] = normalized;
        }
        pinoInstance.error(logData, message);
      },
      debug: (message: string, context?: Record<string, unknown>) => {
        pinoInstance.debug(context || {}, message);
      },
      trace: (message: string, context?: Record<string, unknown>) => {
        pinoInstance.trace(context || {}, message);
      },
      fatal: (message: string, error?: unknown, context?: Record<string, unknown>) => {
        const logData: Record<string, unknown> = { ...(context || {}) };
        if (error) {
          // Use normalizeError() for consistent error normalization across codebase
          const normalized = normalizeError(error, message);
          logData['err'] = normalized;
        }
        pinoInstance.fatal(logData, message);
      },
      bindings: (): Record<string, unknown> => {
        return pinoInstance.bindings();
      },
      setBindings: (newBindings: Record<string, unknown>): void => {
        pinoInstance.setBindings(newBindings);
      },
      child: (childBindings: Record<string, unknown>) => {
        return createChildLogger(pinoInstance.child(childBindings));
      },
      flush: (callback?: (err?: Error) => void): void => {
        pinoInstance.flush(callback);
      },
      isLevelEnabled: (level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean => {
        return pinoInstance.isLevelEnabled(level);
      },
    });
    return createChildLogger(childPino);
  },
  /**
   * Flush buffered logs synchronously
   */
  flush: (callback?: (err?: Error) => void): void => {
    pinoLogger.flush(callback);
  },
  /**
   * Check if a log level is enabled
   */
  isLevelEnabled: (level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal'): boolean => {
    return pinoLogger.isLevelEnabled(level);
  },
};

/**
 * Context for RPC error logging
 */
export interface RpcErrorLogContext {
  rpcName: string;
  requestId?: string;
  userId?: string;
  operation?: string;
  args?: Record<string, unknown>;
  isMutation?: boolean;
}

/**
 * Wrapper for RPC calls that logs errors with business context
 * 
 * NOTE: This does NOT log performance metrics. Use Supabase dashboard
 * for query performance monitoring.
 * 
 * @param rpcCall - The RPC call function
 * @param context - Logging context
 * @returns The result of the RPC call
 * 
 * @example
 * ```typescript
 * return withRpcErrorLogging(
 *   async () => {
 *     const { data, error } = await this.supabase.rpc('my_rpc', args);
 *     if (error) throw error;
 *     return data;
 *   },
 *   {
 *     rpcName: 'my_rpc',
 *     requestId: 'abc123',
 *     operation: 'searchContent',
 *   }
 * );
 * ```
 */
export async function withRpcErrorLogging<T>(
  rpcCall: () => Promise<T>,
  context: RpcErrorLogContext
): Promise<T> {
  try {
    const result = await rpcCall();
    
    // Only log critical operations (mutations) for audit trail
    if (context.isMutation) {
      // Use dbQuery serializer for consistent database query formatting
      // Mixin automatically injects requestId, operation, userId from logger.bindings()
      const logContext: Record<string, unknown> = {
        dbQuery: {
          rpcName: context.rpcName,
          isMutation: true,
        },
        // Note: requestId, operation, userId are automatically injected via mixin from logger.bindings()
      };
      
      logger.info('Critical RPC operation completed', logContext);
    }
    
    return result;
  } catch (error) {
    // Use dbQuery and args serializers for consistent formatting
    // Mixin automatically injects requestId, operation, userId from logger.bindings()
    const logContext: Record<string, unknown> = {
      dbQuery: {
        rpcName: context.rpcName,
        ...(context.args && { args: context.args }), // Will be redacted by Pino's redact config
      },
      // Note: requestId, operation, userId are automatically injected via mixin from logger.bindings()
    };
    
    // Pino's stdSerializers.err automatically handles error serialization
    // Pass error as second parameter - wrapper will serialize it properly
    // Mixin automatically injects requestId, operation, userId from logger.bindings()
    logger.error('RPC call failed', error, logContext);
    
    throw error;
  }
}

/**
 * Simple error logging for RPC calls (when wrapper is not used)
 * 
 * Use this directly in service methods for simple error logging.
 * 
 * @param error - The error to log
 * @param context - Logging context
 * 
 * @example
 * ```typescript
 * const { data, error } = await this.supabase.rpc('my_rpc', args);
 * if (error) {
 *   logRpcError(error, {
 *     rpcName: 'my_rpc',
 *     requestId: 'abc123',
 *     operation: 'searchContent',
 *   });
 *   throw error;
 * }
 * ```
 */
export function logRpcError(error: unknown, context: RpcErrorLogContext): void {
  // Use dbQuery serializer for consistent database query formatting
  // Mixin automatically injects requestId, operation, userId from logger.bindings()
  const logContext: Record<string, unknown> = {
    dbQuery: {
      rpcName: context.rpcName,
      ...(context.args && { args: context.args }), // Will be redacted by Pino's redact config
    },
    // Note: requestId, operation, userId are automatically injected via mixin from logger.bindings()
  };
  
  // Pino's stdSerializers.err automatically handles error serialization
  // Pass error as second parameter - wrapper will serialize it properly
  // Mixin automatically injects requestId, operation, userId from logger.bindings()
  logger.error('RPC call failed', error, logContext);
}
