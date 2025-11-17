/**
 * Database error handling utilities
 * Provides consistent error handling for database operations
 */

import { badRequestResponse, errorResponse, jsonResponse, publicCorsHeaders } from './http.ts';
import type { BaseLogContext } from './logging.ts';
import { logError } from './logging.ts';

/**
 * Handle database errors with appropriate responses
 * Returns Response if error should be returned, null if should be re-thrown
 */
export function handleDatabaseError(
  error: unknown,
  logContext: BaseLogContext,
  context: string
): Response | null {
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

  logError('Database operation failed', logContext, new Error(errorMessage));
  return errorResponse(new Error(`Database operation failed: ${errorMessage}`), context);
}
