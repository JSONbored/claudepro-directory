/**
 * Error Utilities for Cloudflare Workers
 *
 * Provides error normalization and handling utilities compatible with
 * Cloudflare Workers runtime.
 */

import { normalizeError as sharedNormalizeError } from '@heyclaude/shared-runtime';

/**
 * Normalize error for Cloudflare Workers
 *
 * Wraps the shared normalizeError function for use in Workers.
 * Ensures all errors are Error objects with proper messages and stack traces.
 *
 * @param error - Error to normalize (can be Error, string, or unknown)
 * @param fallbackMessage - Fallback message if error cannot be normalized
 * @returns Normalized Error object
 */
export function normalizeError(error: unknown, fallbackMessage: string): Error {
  return sharedNormalizeError(error, fallbackMessage);
}

/**
 * Create error response for Cloudflare Workers
 *
 * Creates a standardized error response with proper status code and headers.
 *
 * @param error - Normalized error
 * @param status - HTTP status code (default: 500)
 * @param headers - Additional headers to include
 * @returns Response object
 */
export function createErrorResponse(
  error: Error,
  status: number = 500,
  headers: HeadersInit = {}
): Response {
  return new Response(
    JSON.stringify({
      error: error.message,
      // Only include stack in development
      ...(process.env['NODE_ENV'] === 'development' ? { stack: error.stack } : {}),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}
