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
    if ('code' in error && 'message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }

    // Handle objects with just a message property
    if ('message' in error && typeof (error as any).message === 'string') {
      return (error as any).message;
    }

    // Handle objects with code and message (different structure)
    if ('code' in error && 'message' in error) {
      return `${String((error as any).code)}: ${String((error as any).message)}`;
    }

    // Fallback: never return stack trace or all properties
    return 'An unexpected error occurred';
  }

  return String(error);
}

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
