/**
 * Error handling utilities for edge functions
 * Provides consistent error stringification across all functions
 */

/**
 * Safely converts any error to a string message
 * Handles Error instances, PostgrestError objects, and plain objects
 *
 * @param error - The error to stringify
 * @returns A human-readable error message
 */
export function errorToString(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null) {
    // Handle Supabase PostgrestError (has code and message)
    if ('code' in error && 'message' in error && typeof error.message === 'string') {
      return error.message;
    }

    // Handle objects with just a message property
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    // Handle objects with code and message (different structure)
    if ('code' in error && 'message' in error) {
      return `${String(error.code)}: ${String(error.message)}`;
    }

    // Fallback: stringify the object with all properties
    try {
      return JSON.stringify(error, Object.getOwnPropertyNames(error));
    } catch {
      return String(error);
    }
  }

  return String(error);
}
