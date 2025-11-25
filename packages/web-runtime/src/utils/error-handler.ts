/**
 * Error Handling - Simplified approach using Vercel primitives + BetterStack
 * Replaces 371 LOC custom error handler with 95 LOC utility
 */

import { formatZodError, sanitizeError } from '../error-utils.ts';
import { normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createWebAppContext } from './log-context.ts';

/**
 * Create standardized error response with proper logging
 * Vercel automatically adds: x-vercel-id, timestamp, function name, region, duration
 */
export async function createErrorResponse(
  error: unknown,
  context: {
    route?: string;
    operation?: string;
    method?: string;
    userId?: string;
    logContext?: Record<string, string | number | boolean>;
  } = {}
): Promise<NextResponse> {
  // Create standardized log context with single requestId
  const logContext = createWebAppContext(
    context.route || 'unknown',
    context.operation || 'unknown',
    {
      method: context.method || 'unknown',
      ...(context.userId && { userId: context.userId }),
      sanitizedMessage: sanitizeError(error),
      ...context.logContext,
    }
  );
  
  // Log error with full context - Pino logger outputs to stdout (Vercel captures these logs)
  const normalized = normalizeError(error, 'API error occurred');
  logger.error('API error occurred', normalized, logContext);

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
export async function handleApiError(
  error: unknown,
  config: {
    route?: string;
    operation?: string;
    method?: string;
    userId?: string;
    logContext?: Record<string, string | number | boolean>;
  } = {}
): Promise<NextResponse> {
  return createErrorResponse(error, config);
}
