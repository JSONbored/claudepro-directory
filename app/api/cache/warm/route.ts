import { type NextRequest, NextResponse } from 'next/server';
import { cacheWarmer } from '@/lib/cache-warmer';
import { sanitizeApiError } from '@/lib/error-sanitizer';
import { logger } from '@/lib/logger';
import { apiSchemas, baseSchemas, ValidationError, validation } from '@/lib/validation';

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
    if (authHeader && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Only validate non-cron tokens
      validation.validate(
        baseSchemas.authToken,
        authHeader.replace('Bearer ', ''),
        'authorization header'
      );
    }

    // Validate request body if present
    let validatedBody: any = {};
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

    // Check if this is a scheduled cron job (Vercel Cron)
    const isScheduledJob = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (isScheduledJob) {
      logger.info('Cache warming triggered by scheduled job', {
        hasParams:
          typeof validatedBody === 'object' ? Object.keys(validatedBody).length > 0 : false,
      });
    } else {
      logger.info('Cache warming triggered manually', {
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        hasParams: Object.keys(validatedBody).length > 0,
        validated: true,
      });
    }

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
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          timestamp: new Date().toISOString(),
        },
        { status: 429 } // Too Many Requests if already running
      );
    }
  } catch (error: unknown) {
    // Handle validation errors specifically
    if (error instanceof ValidationError) {
      logger.warn('Validation error in cache warm API', {
        error: error.message,
        detailsCount: error.details.errors.length,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: error.message,
          details: error.details.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Handle other errors with sanitization
    const sanitizedError = sanitizeApiError(error, {
      route: 'cache/warm',
      operation: 'cache_warming',
      method: 'POST',
    });

    return NextResponse.json(
      {
        success: false,
        ...sanitizedError,
      },
      { status: 500 }
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
        ...status,
        currentTime: new Date().toISOString(),
        validated: true,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Handle validation errors specifically
    if (error instanceof ValidationError) {
      logger.warn('Validation error in cache status API', {
        error: error.message,
        detailsCount: error.details.errors.length,
      });

      return NextResponse.json(
        {
          error: 'Validation failed',
          message: error.message,
          details: error.details.errors.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Handle other errors with sanitization
    const sanitizedError = sanitizeApiError(error, {
      route: 'cache/warm',
      operation: 'get_status',
      method: 'GET',
    });

    return NextResponse.json(sanitizedError, { status: 500 });
  }
}
