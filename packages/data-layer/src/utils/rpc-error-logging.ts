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
 * @module data-layer/utils/rpc-error-logging
 */

import pino from 'pino';
import { createPinoConfig } from '@heyclaude/shared-runtime/logger/config.ts';

// Create Pino logger instance with centralized configuration
// Pino automatically handles error serialization and redaction
export const logger = pino(createPinoConfig({ service: 'data-layer' }));

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
      
      logger.info(logContext, 'Critical RPC operation completed');
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
    // Pass error as 'err' key - Pino will serialize it properly
    // Mixin automatically injects requestId, operation, userId from logger.bindings()
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error({ ...logContext, err: errorObj }, 'RPC call failed');
    
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
  // Pass error as 'err' key - Pino will serialize it properly
  // Mixin automatically injects requestId, operation, userId from logger.bindings()
  const errorObj = error instanceof Error ? error : new Error(String(error));
  logger.error({ ...logContext, err: errorObj }, 'RPC call failed');
}
