import { type NextRequest, NextResponse } from 'next/server';
import { cacheWarmer } from '@/src/lib/cache';
import { handleApiError, handleValidationError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { errorInputSchema } from '@/src/lib/schemas/error.schema';
import {
  apiSchemas,
  baseSchemas,
  ValidationError,
  validation,
} from '@/src/lib/security/validators';

/**
 * API endpoint to manually trigger cache warming
 * POST /api/cache/warm
 *
 * Rate limiting: 10 requests per hour (handled by middleware)
 * - Admin dashboard
 * - Cron job (Vercel Cron or GitHub Actions)
 * - Manual trigger for testing
 *
 * Security: Protected by Arcjet + endpoint-specific rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication header if present
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      validation.validate(
        baseSchemas.authToken,
        authHeader.replace('Bearer ', ''),
        'authorization header'
      );
    }

    // Validate request body if present
    let validatedBody: Record<string, unknown> = {};
    if (request.headers.get('content-type')?.includes('application/json')) {
      try {
        const rawBody = await request.json();
        validatedBody = validation.validateBody(
          apiSchemas.cacheWarmParams,
          rawBody,
          'cache warming parameters'
        );
      } catch (jsonError) {
        // If JSON parsing fails, treat as empty body
        logger.warn('Invalid JSON in cache warm request body', {
          error: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parse error',
        });
      }
    }

    // Log cache warming trigger
    logger.info('Cache warming triggered manually', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      hasParams: Object.keys(validatedBody).length > 0,
      validated: true,
    });

    // Trigger cache warming
    const result = await cacheWarmer.triggerManualWarming();

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          message: result.message,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: result.message,
        timestamp: new Date().toISOString(),
      },
      { status: 429 } // Too Many Requests if already running
    );
  } catch (error: unknown) {
    // Use centralized error handling for consistent responses
    if (error instanceof ValidationError) {
      return handleValidationError(error, {
        route: 'cache/warm',
        operation: 'cache_warming',
        method: 'POST',
      });
    }

    // Handle all other errors with centralized handler
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success ? validatedError.data : { message: 'Cache warm error occurred' },
      {
        route: 'cache/warm',
        operation: 'cache_warming',
        method: 'POST',
      }
    );
  }
}

/**
 * GET endpoint to check cache warming status
 */
export async function GET(request: NextRequest) {
  try {
    // Validate query parameters if any
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    if (Object.keys(queryParams).length > 0) {
      // Validate only known query parameters
      const allowedParams = validation.validate(
        apiSchemas.paginationQuery.partial().pick({ limit: true }),
        queryParams,
        'cache status query parameters'
      );
      logger.info('Cache status request with parameters', {
        limit: allowedParams.limit || 0,
        validated: true,
      });
    }

    const status = await cacheWarmer.getStatus();

    return NextResponse.json(
      {
        ...(typeof status === 'object' && status !== null ? status : {}),
        currentTime: new Date().toISOString(),
        validated: true,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Use centralized error handling for consistent responses
    if (error instanceof ValidationError) {
      return handleValidationError(error, {
        route: 'cache/warm',
        operation: 'get_status',
        method: 'GET',
      });
    }

    // Handle all other errors with centralized handler
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success ? validatedError.data : { message: 'Cache warm error occurred' },
      {
        route: 'cache/warm',
        operation: 'get_status',
        method: 'GET',
      }
    );
  }
}
