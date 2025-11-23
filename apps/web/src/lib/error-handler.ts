/**
 * Error Handling - Simplified approach using Vercel primitives + BetterStack
 * Replaces 371 LOC custom error handler with 95 LOC utility
 */

import { formatZodError, logger, normalizeError, sanitizeError } from '@heyclaude/web-runtime';
import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Create standardized error response with proper logging
 * Vercel automatically adds: x-vercel-id, timestamp, function name, region, duration
 */
export function createErrorResponse(
  error: unknown,
  context: {
    route?: string;
    operation?: string;
    method?: string;
    userId?: string;
    logContext?: Record<string, string | number | boolean>;
  } = {}
): NextResponse {
  // Log error with full context - BetterStack captures everything
  const normalized = normalizeError(error, 'API error occurred');
  logger.error('API error occurred', normalized, {
    route: context.route || 'unknown',
    operation: context.operation || 'unknown',
    method: context.method || 'unknown',
    ...(context.userId && { userId: context.userId }),
    sanitizedMessage: sanitizeError(error),
    ...context.logContext,
  });

  // Handle Zod validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: formatZodError(error),
      },
      { status: 400 }
    );
  }

  // Handle generic errors
  const isDev = process.env.NODE_ENV === 'development';
  const errorMessage = normalized.message;

  return NextResponse.json(
    {
      success: false,
      error: isDev ? sanitizeError(error) : 'Internal server error',
      message: isDev ? errorMessage : 'An unexpected error occurred',
      ...(isDev && normalized.stack && { stack: normalized.stack }),
    },
    {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  );
}

/**
 * Convenience function for API route error handling
 * Drop-in replacement for old handleApiError
 */
export function handleApiError(
  error: unknown,
  config: {
    route?: string;
    operation?: string;
    method?: string;
    userId?: string;
    logContext?: Record<string, string | number | boolean>;
  } = {}
): NextResponse {
  return createErrorResponse(error, config);
}
