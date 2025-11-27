/**
 * Logger Helper Utilities for Edge Functions
 * 
 * Provides common patterns for using Phase 1 & Phase 2 Pino features:
 * - trace() logging at request entry/exit
 * - setBindings() for dynamic context (automatically injected via mixin)
 * - isLevelEnabled() checks before expensive operations
 * - bindings() for error context enrichment
 * 
 * Phase 2: Mixin automatically injects bindings into all log calls
 * - No need to manually pass requestId, operation, userId if they're in bindings
 * - Mixin reads from logger.bindings() and injects automatically
 */

import { logTrace, logger, type BaseLogContext } from '@heyclaude/shared-runtime';

/**
 * Initialize request logging with trace and bindings
 * Call this at the start of edge function handlers
 * 
 * Sets bindings that will be automatically injected into all subsequent log calls via mixin.
 * This eliminates the need to manually pass requestId, operation, function in every log call.
 * 
 * @param logContext - Base log context for the request
 * @param additionalBindings - Additional context to set as bindings (will be auto-injected via mixin)
 */
export function initRequestLogging(
  logContext: BaseLogContext,
  additionalBindings?: Record<string, unknown>
): void {
  // Trace request entry for detailed debugging
  logTrace('Request received', logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  // This means you don't need to manually pass requestId, operation, function in log calls
  logger.setBindings({
    requestId: logContext.request_id,
    operation: logContext.action || 'unknown',
    function: logContext.function,
    ...additionalBindings,
  });
}

/**
 * Update request bindings dynamically
 * Use this when context changes (e.g., after authentication, user identified)
 * 
 * @param bindings - Additional context to add to logger bindings
 */
export function updateRequestBindings(bindings: Record<string, unknown>): void {
  logger.setBindings(bindings);
}

/**
 * Trace a processing step
 * Only logs if trace level is enabled (avoids unnecessary work)
 * 
 * @param message - Trace message
 * @param logContext - Log context
 */
export function traceStep(message: string, logContext: BaseLogContext): void {
  logTrace(message, logContext);
}

/**
 * Trace request completion
 * Call this before returning successful responses
 * 
 * @param logContext - Log context
 */
export function traceRequestComplete(logContext: BaseLogContext): void {
  logTrace('Request completed successfully', logContext);
}

/**
 * Check if trace logging is enabled before expensive operations
 * Use this to avoid building expensive log context when trace is disabled
 * 
 * @returns true if trace level is enabled
 */
export function isTraceEnabled(): boolean {
  return logger.isLevelEnabled('trace');
}

/**
 * Get current logger bindings for error context enrichment
 * Use this in error handlers to include current context
 * 
 * @returns Current logger bindings
 */
export function getCurrentBindings(): Record<string, unknown> {
  return logger.bindings();
}
