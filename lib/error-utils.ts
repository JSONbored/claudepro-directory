/**
 * Error Utilities
 *
 * Helper functions for consistent error handling across the codebase
 */

/**
 * Normalizes any value to a proper Error object
 *
 * @param error - The error value to normalize (can be Error, string, unknown, etc.)
 * @param fallbackMessage - Optional fallback message if error has no useful information
 * @returns A proper Error instance
 *
 * @example
 * ```ts
 * try {
 *   throw "something went wrong"; // Bad practice but happens
 * } catch (err) {
 *   const error = normalizeError(err);
 *   logger.error("Failed", error);
 * }
 * ```
 */
export function normalizeError(error: unknown, fallbackMessage?: string): Error {
  // Already an Error instance
  if (error instanceof Error) {
    return error;
  }

  // String error
  if (typeof error === 'string') {
    return new Error(error || fallbackMessage || 'Unknown error');
  }

  // Object with message property
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String(error.message);
    const err = new Error(message || fallbackMessage || 'Unknown error');

    // Preserve stack if available
    if ('stack' in error && typeof error.stack === 'string') {
      err.stack = error.stack;
    }

    // Preserve name if available
    if ('name' in error && typeof error.name === 'string') {
      err.name = error.name;
    }

    return err;
  }

  // Fallback for any other type
  return new Error(fallbackMessage || String(error) || 'Unknown error');
}

/**
 * Type guard to check if a value is an Error instance
 *
 * @param value - The value to check
 * @returns True if value is an Error instance
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Extracts a safe error message from any error value
 *
 * @param error - The error value
 * @param fallback - Fallback message if extraction fails
 * @returns A string message
 */
export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallback;
}

/**
 * Creates an Error with additional context properties
 *
 * @param message - The error message
 * @param context - Additional context to attach to the error
 * @returns An Error with context properties
 */
export function createContextError(
  message: string,
  context: Record<string, unknown>
): Error & { context: Record<string, unknown> } {
  const error = new Error(message) as Error & { context: Record<string, unknown> };
  error.context = context;
  return error;
}
