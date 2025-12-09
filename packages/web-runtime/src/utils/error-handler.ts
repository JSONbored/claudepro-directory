/**
 * Error Handling - Simplified approach using Vercel primitives + BetterStack
 * Replaces 371 LOC custom error handler with 95 LOC utility
 * 
 * **⚠️ IMPORTANT: Server-Only Module**
 * - ❌ **DO NOT** import this in client components (`'use client'`)
 * - ✅ **ONLY** import in server components, API routes, or server actions
 * - Uses Next.js `NextResponse` which is server-only
 * 
 * **Client/Server Boundaries:**
 * - This module is designed for API route error handling
 * - For client-side error handling, use {@link ../logging/client | Client Logging Barrel} instead
 * 
 * @module web-runtime/utils/error-handler
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
 * @see {@link ../logging/client | Client Logging Barrel} - Client-side logging utilities
 */

import 'server-only';

import { isDevelopment } from '@heyclaude/shared-runtime/schemas/env';

import { formatZodError, sanitizeError } from '../error-utils.ts';
import { normalizeError } from '../errors.ts';
import { logger } from '../logger.ts';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createWebAppContext } from './log-context.ts';

/**
 * Create standardized error response with proper logging
 * 
 * **⚠️ Server-Only Function**
 * - ❌ **DO NOT** call from client components
 * - ✅ **ONLY** call from API routes or server actions
 * - Uses Next.js `NextResponse` which is server-only
 * 
 * Vercel automatically adds: x-vercel-id, timestamp, function name, region, duration
 * 
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
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
  // Create standardized log context
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
  logger.error({ err: normalized, ...logContext }, 'API error occurred');

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
  const errorMessage = normalized.message;

  return NextResponse.json(
    {
      success: false,
      error: isDevelopment ? sanitizeError(error) : 'Internal server error',
      message: isDevelopment ? errorMessage : 'An unexpected error occurred',
      ...(isDevelopment && normalized.stack && { stack: normalized.stack }),
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
 * 
 * **⚠️ Server-Only Function**
 * - ❌ **DO NOT** call from client components
 * - ✅ **ONLY** call from API routes or server actions
 * - Drop-in replacement for old handleApiError
 * 
 * @see {@link createErrorResponse} - Lower-level function that does the work
 * @see {@link ../logging/server | Server Logging Barrel} - Server-side logging utilities
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
