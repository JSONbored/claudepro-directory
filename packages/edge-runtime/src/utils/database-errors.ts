/**
 * Database error handling utilities
 * Provides consistent error handling for database operations
 */

import { errorToString } from '@heyclaude/shared-runtime';
import { badRequestResponse, errorResponse, jsonResponse, publicCorsHeaders } from './http.ts';
import type { BaseLogContext } from '@heyclaude/shared-runtime';
import { logError } from '@heyclaude/shared-runtime';

/**
 * Handle database errors with appropriate responses
 * Returns Response if error should be returned, null if should be re-thrown
 */
export async function handleDatabaseError(
  error: unknown,
  logContext: BaseLogContext,
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
