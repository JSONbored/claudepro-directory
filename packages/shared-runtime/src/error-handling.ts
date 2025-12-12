/**
 * Error handling utilities
 * Provides consistent error normalization across all functions
 */

/**
 * Normalizes any error value into an Error instance.
 *
 * This is the standard way to handle errors throughout the codebase:
 * - If already an Error, returns as-is
 * - If a string, wraps in new Error
 * - If an object, attempts JSON stringification
 * - Falls back to provided message
 *
 * Usage patterns:
 * - In catch blocks: `const err = normalizeError(error, 'Operation failed');`
 * - For message only: `normalizeError(error, 'Failed').message`
 *
 * @param error - The error to normalize (can be any type)
 * @param fallbackMessage - Message to use if error cannot be converted
 * @returns An Error instance
 */
export function normalizeError(error: unknown, fallbackMessage = 'Unknown error'): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  // Handle PostgrestError objects - extract message field instead of stringifying entire object
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    const postgrestError = error as { code: unknown; message: string; details?: unknown; hint?: unknown };
    // Use the message field directly instead of JSON.stringify
    return new Error(postgrestError.message);
  }
  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error(fallbackMessage);
  }
}
