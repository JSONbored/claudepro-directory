/**
 * Database error handling utilities
 * Provides consistent error handling for database operations
 */

import { errorToString } from '@heyclaude/shared-runtime';
import { badRequestResponse, errorResponse, jsonResponse, publicCorsHeaders } from './http.ts';
import { logError } from '@heyclaude/shared-runtime';

/**
 * Produce an HTTP response for known database errors or indicate the error should be re-thrown.
 *
 * Handles specific database error cases (unique-constraint and rate-limit) and logs other errors before
 * converting them to a standardized error response.
 *
 * @param logContext - Additional fields to include with the logged error
 * @param context - Context identifier used when building the standardized error response
 * @returns A `Response` representing the appropriate HTTP error for handled database errors, or `null` to signal the caller should re-throw the original error
 */
export async function handleDatabaseError(
  error: unknown,
  logContext: Record<string, unknown>,
  context: string
): Promise<Response | null> {
  // Type guard for Supabase PostgrestError which has 'code' and 'message' properties
  const isPostgrestError = typeof error === 'object' && error !== null && 'code' in error;

  if (isPostgrestError && error.code === '23505') {
    // Email already exists (UNIQUE constraint violation)
    return badRequestResponse('This email is already subscribed to our newsletter');
  }

  const errorMessage =
    isPostgrestError && 'message' in error && typeof error.message === 'string'
      ? error.message
      : String(error);

  if (errorMessage.includes('Rate limit')) {
    // Rate limit exceeded (triggered by database trigger)
    return jsonResponse(
      {
        error: 'Rate limit exceeded',
        message: 'Too many subscription attempts. Please try again later.',
      },
      429,
      publicCorsHeaders
    );
  }

  // Use errorToString for consistent error message extraction
  const normalizedError = error instanceof Error ? error : new Error(errorToString(error));
  // Await to ensure logs are flushed before returning response
  await logError('Database operation failed', logContext, normalizedError);
  return await errorResponse(normalizedError, context);
}