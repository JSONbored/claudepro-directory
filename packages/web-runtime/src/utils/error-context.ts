/**
 * Error Context Utilities
 * 
 * Provides standardized error context creation for consistent logging
 * across all data fetching functions and API routes.
 */

import type { LogContext } from '../logger.ts';

export interface ErrorContextOptions {
  operation: string;
  userId?: string;
  additionalContext?: Record<string, unknown>;
}

/**
 * Create standardized error context for logging
 * Ensures all errors have operation and optional userId
 */
export function createErrorContext(options: ErrorContextOptions): LogContext {
  const { operation, userId, additionalContext } = options;
  
  return {
    operation,
    ...(userId && { userId }),
    ...additionalContext,
  };
}
