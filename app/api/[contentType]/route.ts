import { type NextRequest, NextResponse } from 'next/server';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import { handleApiError, handleValidationError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
import { contentCache } from '@/lib/redis';
import { errorInputSchema } from '@/lib/schemas';
import { apiSchemas, ValidationError, validation } from '@/lib/security';

export const runtime = 'nodejs';
export const revalidate = 14400; // 4 hours

// Content type mapping with async data getters
const contentMap = {
  'agents.json': { getData: () => agents, type: 'agent' },
  'mcp.json': { getData: () => mcp, type: 'mcp' },
  'hooks.json': { getData: () => hooks, type: 'hook' },
  'commands.json': { getData: () => commands, type: 'command' },
  'rules.json': { getData: () => rules, type: 'rule' },
} as const;

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ contentType: string }> }
) {
  const requestLogger = logger.forRequest(request);

  try {
    const rawParams = await params;

    // Validate parameters with strict schema
    const validatedParams = validation.validateParams(
      apiSchemas.contentTypeParams,
      rawParams,
      'content type route parameters'
    );

    const { contentType } = validatedParams;
    requestLogger.info('Content type API request started', { contentType, validated: true });

    // Try to get from cache first
    const cacheKey = `content-api:${contentType}`;
    const cachedResponse = await contentCache.getAPIResponse(cacheKey);
    if (cachedResponse) {
      requestLogger.info('Serving cached content API response', {
        contentType,
        source: 'redis-cache',
      });
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
          'X-Cache': 'HIT',
        },
      });
    }

    // Check if the content type is valid
    if (!(contentType in contentMap)) {
      requestLogger.warn('Invalid content type requested', {
        contentType,
        availableTypesCount: Object.keys(contentMap).length,
        sampleType: Object.keys(contentMap)[0] || '',
      });

      return NextResponse.json(
        {
          error: 'Content type not found',
          message: `Available content types: ${Object.keys(contentMap).join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const { getData, type } = contentMap[contentType as keyof typeof contentMap];
    const data = await getData();
    const contentCategory = contentType.replace('.json', '');

    const responseData = {
      [contentCategory]: data.map((item) => ({
        ...item,
        type,
        url: `https://claudepro.directory/${contentCategory}/${item.slug}`,
      })),
      count: data.length,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the response for 1 hour
    await contentCache.cacheAPIResponse(cacheKey, responseData, 60 * 60);

    requestLogger.info('Content type API request completed successfully', {
      contentType,
      count: data.length,
    });

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
        'X-Cache': 'MISS',
      },
    });
  } catch (error: unknown) {
    // Get content type for error context
    const rawParams = await params.catch(() => ({ contentType: 'unknown' }));
    const { contentType: errorContentType } = rawParams;

    // Use centralized error handling for consistent responses
    if (error instanceof ValidationError) {
      return handleValidationError(error, {
        route: '[contentType]',
        operation: 'get_content',
        method: 'GET',
        logContext: {
          contentType: errorContentType,
        },
      });
    }

    // Handle all other errors with centralized handler
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success ? validatedError.data : { message: 'API error occurred' },
      {
        route: '[contentType]',
        operation: 'get_content',
        method: 'GET',
        logContext: {
          contentType: errorContentType,
        },
      }
    );
  }
}

// Apply rate limiting to the GET handler
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ contentType: string }> }
) {
  return withRateLimit(request, rateLimiters.api, handleGET, request, context);
}
