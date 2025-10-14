/**
 * Centralized Cron Authentication Middleware
 *
 * Single source of truth for cron job authentication across all /api/cron/* routes.
 * Provides timing-safe secret comparison to prevent timing attacks.
 *
 * Security Features:
 * - Timing-safe comparison using crypto.timingSafeEqual()
 * - Prevents information leakage through response time analysis
 * - Consistent error responses
 * - Proper logging for security auditing
 *
 * Benefits:
 * - Eliminates 75 lines of duplication across 5 cron routes
 * - Single place to update authentication logic
 * - Improved security with timing-safe comparison
 * - Consistent error handling and logging
 *
 * Usage:
 * ```typescript
 * export async function GET(request: Request) {
 *   const authResult = await withCronAuth(request, async () => {
 *     // Your cron job logic here
 *     return NextResponse.json({ success: true });
 *   });
 *
 *   return authResult;
 * }
 * ```
 *
 * @module lib/middleware/cron-auth
 */

import { timingSafeEqual } from 'node:crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { apiResponse } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';

/**
 * Timing-safe secret verification
 *
 * Uses crypto.timingSafeEqual() to prevent timing attacks where an attacker
 * could determine the correct secret character-by-character by measuring response times.
 *
 * @param request - Next.js request object
 * @returns true if authentication is valid, false otherwise
 */
function verifyCronSecret(request: Request | NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // Check if secret is configured
  if (!cronSecret) {
    logger.warn('CRON_SECRET not configured - cron auth will fail', {
      route: request.url,
      type: 'cron_auth_config',
    });
    return false;
  }

  // Check if authorization header is present
  if (!authHeader) {
    logger.warn('Missing authorization header in cron request', {
      route: request.url,
      type: 'cron_auth_missing',
    });
    return false;
  }

  // Expected format: "Bearer <secret>"
  const expectedValue = `Bearer ${cronSecret}`;

  // Timing-safe comparison to prevent timing attacks
  // Both strings must be the same length for timingSafeEqual
  try {
    // If lengths don't match, return false immediately
    if (authHeader.length !== expectedValue.length) {
      logger.warn('Invalid authorization header length in cron request', {
        route: request.url,
        expectedLength: expectedValue.length,
        actualLength: authHeader.length,
        type: 'cron_auth_invalid',
      });
      return false;
    }

    // Convert both strings to buffers for timing-safe comparison
    const authBuffer = Buffer.from(authHeader, 'utf-8');
    const expectedBuffer = Buffer.from(expectedValue, 'utf-8');

    // Perform timing-safe comparison
    const isValid = timingSafeEqual(authBuffer, expectedBuffer);

    if (!isValid) {
      logger.warn('Invalid cron secret provided', {
        route: request.url,
        type: 'cron_auth_invalid_secret',
      });
    }

    return isValid;
  } catch (error) {
    // timingSafeEqual throws if buffers are different lengths (shouldn't happen due to our check)
    logger.error(
      'Cron auth verification failed',
      error instanceof Error ? error : new Error(String(error)),
      {
        route: request.url,
        type: 'cron_auth_error',
      }
    );
    return false;
  }
}

/**
 * Cron authentication wrapper for route handlers
 *
 * Wraps a cron job handler with authentication checking.
 * Returns 401 Unauthorized if authentication fails.
 *
 * @param request - Next.js request object
 * @param handler - The cron job handler function to execute if authentication succeeds
 * @returns NextResponse from handler or 401 error
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   return withCronAuth(request, async () => {
 *     // Your authenticated cron logic here
 *     const result = await performCronTask();
 *     return NextResponse.json({ success: true, result });
 *   });
 * }
 * ```
 */
export async function withCronAuth(
  request: Request | NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  // Verify cron authentication
  if (!verifyCronSecret(request)) {
    return apiResponse.okRaw(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing cron secret',
        timestamp: new Date().toISOString(),
      },
      { status: 401, sMaxAge: 0, staleWhileRevalidate: 0 }
    );
  }

  // Authentication successful - execute handler
  try {
    return await handler();
  } catch (error) {
    // Let the handler's own error handling take precedence
    // This catch is just a safety net
    logger.error(
      'Unexpected error in cron handler',
      error instanceof Error ? error : new Error(String(error)),
      {
        route: request.url,
        type: 'cron_handler_error',
      }
    );

    return apiResponse.okRaw(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500, sMaxAge: 0, staleWhileRevalidate: 0 }
    );
  }
}

/**
 * Alternative: Verify cron secret without wrapping handler
 *
 * Use this if you prefer manual authentication checking rather than the wrapper pattern.
 * Useful for routes that need more control over the response.
 *
 * @param request - Next.js request object
 * @returns Null if authorized, NextResponse (401) if unauthorized
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const authError = verifyCronAuth(request);
 *   if (authError) return authError;
 *
 *   // Your cron logic here
 *   return NextResponse.json({ success: true });
 * }
 * ```
 */
export function verifyCronAuth(request: Request | NextRequest): NextResponse | null {
  if (!verifyCronSecret(request)) {
    return apiResponse.okRaw(
      {
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing cron secret',
        timestamp: new Date().toISOString(),
      },
      { status: 401, sMaxAge: 0, staleWhileRevalidate: 0 }
    );
  }

  return null;
}
