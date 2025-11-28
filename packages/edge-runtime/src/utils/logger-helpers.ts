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

import { logTrace, logger } from '@heyclaude/shared-runtime';

/**
 * Initialize request-scoped logging: emit an entry trace and set logger bindings for the request.
 *
 * The function emits a trace "Request received" using the provided `logContext` and sets logger
 * bindings that will be injected into subsequent log calls. Standard fields are extracted from
 * `logContext` when present: `request_id` -> `requestId`, `action` -> `operation`, and
 * `function` -> `function` (defaults for `operation` and `function` are `"unknown"`; `requestId`
 * is left `undefined` if not a string).
 *
 * @param logContext - Arbitrary request log context; may contain `request_id`, `action`, and `function`
 *                      keys used to populate bindings
 * @param additionalBindings - Extra key/value pairs to merge into the logger bindings
 */
export function initRequestLogging(
  logContext: Record<string, unknown>,
  additionalBindings?: Record<string, unknown>
): void {
  // Trace request entry for detailed debugging
  logTrace('Request received', logContext);
  
  // Set bindings for this request - mixin will automatically inject these into all subsequent logs
  // This means you don't need to manually pass requestId, operation, function in log calls
  // Extract standard fields from logContext (function, action, request_id) if present
  logger.setBindings({
    requestId: typeof logContext['request_id'] === 'string' ? logContext['request_id'] : undefined,
    operation: typeof logContext['action'] === 'string' ? logContext['action'] : 'unknown',
    function: typeof logContext['function'] === 'string' ? logContext['function'] : 'unknown',
    ...additionalBindings,
  });
}

/**
 * Update the current request's logger bindings with the provided fields.
 *
 * @param bindings - Fields to apply to the logger's current bindings for the request
 */
export function updateRequestBindings(bindings: Record<string, unknown>): void {
  logger.setBindings(bindings);
}

/**
 * Log a processing step at trace level using the provided context.
 *
 * @param message - Human-readable trace message describing the step
 * @param logContext - Contextual bindings to include with the trace (e.g., `request_id`, `action`, `function`)
 */
export function traceStep(message: string, logContext: Record<string, unknown>): void {
  logTrace(message, logContext);
}

/**
 * Log a trace-level message indicating the request completed successfully.
 *
 * @param logContext - Context object whose string-keyed properties are attached to the trace
 */
export function traceRequestComplete(logContext: Record<string, unknown>): void {
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
 * Retrieve the current logger bindings for the active logging context.
 *
 * @returns The current logger bindings object
 */
export function getCurrentBindings(): Record<string, unknown> {
  return logger.bindings();
}