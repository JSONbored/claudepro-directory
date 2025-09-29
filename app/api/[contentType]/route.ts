import { type NextRequest, NextResponse } from 'next/server';
import { APP_CONFIG } from '@/lib/constants';
import { handleApiError, handleValidationError } from '@/lib/error-handler';

import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
import { contentCache } from '@/lib/redis';
import { errorInputSchema } from '@/lib/schemas/error.schema';
import { contentProcessor } from '@/lib/services/content-processor.service';
import { apiSchemas, ValidationError, validation } from '@/lib/validation';

export const runtime = 'edge'; // Use Edge Runtime for better performance
export const revalidate = 14400; // 4 hours

// Content type mapping
const contentTypeMap = {
  'agents.json': { category: 'agents', type: 'agent' },
  'mcp.json': { category: 'mcp', type: 'mcp' },
  'hooks.json': { category: 'hooks', type: 'hook' },
  'commands.json': { category: 'commands', type: 'command' },
  'rules.json': { category: 'rules', type: 'rule' },
} as const;

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ contentType: string }> }
) {
  // Extract request metadata for error context
  const requestUrl = request.url;
  const userAgent = request.headers.get('user-agent') || 'unknown';

  try {
    const rawParams = await params;

    // Validate parameters with strict schema
    const validatedParams = validation.validateParams(
      apiSchemas.contentTypeParams,
      rawParams,
      'content type route parameters'
    );

    const { contentType } = validatedParams;

    // Try to get from cache first
    const cacheKey = `content-api:${contentType}`;
    const cachedResponse = await contentCache.getAPIResponse(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
          'X-Cache': 'HIT',
        },
      });
    }

    // Check if the content type is valid
    if (!(contentType in contentTypeMap)) {
      return NextResponse.json(
        {
          error: 'Content type not found',
          message: `Available content types: ${Object.keys(contentTypeMap).join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const { category, type } = contentTypeMap[contentType as keyof typeof contentTypeMap];

    // Fetch content from content processor
    const data = await contentProcessor.getContentByCategory(category);

    if (!data) {
      return NextResponse.json(
        {
          error: 'Content not available',
          message: `No content found for ${category}`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const responseData = {
      [category]: data.map((item) => ({
        ...item,
        type,
        url: `${APP_CONFIG.url}/${category}/${item.slug}`,
      })),
      count: data.length,
      lastUpdated: new Date().toISOString(),
    };

    // Cache the response for 1 hour
    await contentCache.cacheAPIResponse(cacheKey, responseData, 60 * 60);

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
          requestUrl,
          userAgent,
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
          requestUrl,
          userAgent,
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
