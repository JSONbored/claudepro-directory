import { type NextRequest, NextResponse } from 'next/server';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import { logger } from '@/lib/logger';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';

export const runtime = 'nodejs';
export const revalidate = 14400; // 4 hours

// Content type mapping
const contentMap = {
  'agents.json': { data: agents, type: 'agent' },
  'mcp.json': { data: mcp, type: 'mcp' },
  'hooks.json': { data: hooks, type: 'hook' },
  'commands.json': { data: commands, type: 'command' },
  'rules.json': { data: rules, type: 'rule' },
} as const;

async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ contentType: string }> }
) {
  const requestLogger = logger.forRequest(request);

  try {
    const { contentType } = await params;
    requestLogger.info('Content type API request started', { contentType });

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

    const { data, type } = contentMap[contentType as keyof typeof contentMap];
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

    requestLogger.info('Content type API request completed successfully', {
      contentType,
      count: data.length,
    });

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    const { contentType: errorContentType } = await params;
    requestLogger.error(
      'API Error in [contentType] route',
      error instanceof Error ? error : new Error(String(error)),
      { contentType: errorContentType }
    );

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to process request',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
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
