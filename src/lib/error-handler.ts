/**
 * Error Handling - Simplified approach using Vercel primitives + BetterStack
 * Replaces 371 LOC custom error handler with 95 LOC utility
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from './logger';

/**
 * Sanitize error messages - strip file paths and sensitive info
 */
export function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/\/Users\/[^/\s]+/g, '[USER]')
    .replace(/\/var\/[^/\s]+/g, '[PATH]')
    .replace(/\/home\/[^/\s]+/g, '[PATH]')
    .replace(/file:\/\/.*?\//g, '[FILE]');
}

/**
 * Format Zod validation errors for API responses
 */
export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join('.') || 'root',
    message: issue.message,
    code: issue.code,
  }));
}

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
  logger.error('API error occurred', error instanceof Error ? error : new Error(String(error)), {
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
  const errorMessage = error instanceof Error ? error.message : 'An error occurred';

  return NextResponse.json(
    {
      success: false,
      error: isDev ? sanitizeError(error) : 'Internal server error',
      message: isDev ? errorMessage : 'An unexpected error occurred',
      ...(isDev && error instanceof Error && error.stack && { stack: error.stack }),
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
