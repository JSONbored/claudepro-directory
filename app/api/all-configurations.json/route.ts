import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { APP_CONFIG } from '@/lib/constants';
import { sanitizeApiError } from '@/lib/error-sanitizer';
import { logger } from '@/lib/logger';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
import { contentCache } from '@/lib/redis';
import { createRequestId } from '@/lib/schemas/branded-types.schema';
import type { UnifiedContentItem } from '@/lib/schemas/components';
import { contentProcessor } from '@/lib/services/content-processor.service';
import { apiSchemas, ValidationError } from '@/lib/validation';

export const runtime = 'edge'; // Use Edge Runtime for better performance
export const revalidate = 14400; // 4 hours

// Streaming query parameters validation schema
const streamingQuerySchema = z
  .object({
    stream: z
      .enum(['true', 'false'])
      .default('false')
      .transform((val) => val === 'true'),
    format: z.enum(['json', 'ndjson']).default('json'),
    batchSize: z.coerce.number().min(10).max(100).default(50),
  })
  .merge(apiSchemas.paginationQuery.partial());

// Helper function to transform content with type and URL
function transformContent(
  content: UnifiedContentItem[],
  type: string,
  category: string
): (UnifiedContentItem & { type: string; url: string })[] {
  return content.map((item) => ({
    ...item,
    type,
    url: `${APP_CONFIG.url}/${category}/${item.slug}`,
  }));
}

// Streaming response generator for large datasets
async function* createStreamingResponse(
  batchSize: number,
  format: 'json' | 'ndjson'
): AsyncGenerator<string, void, unknown> {
  // Fetch all content from content processor
  const allContent = await contentProcessor.getAllCategories();

  const transformedAgents = transformContent(allContent.agents, 'agent', 'agents');
  const transformedMcp = transformContent(allContent.mcp, 'mcp', 'mcp');
  const transformedRules = transformContent(allContent.rules, 'rule', 'rules');
  const transformedCommands = transformContent(allContent.commands, 'command', 'commands');
  const transformedHooks = transformContent(allContent.hooks, 'hook', 'hooks');

  const metadata = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${APP_CONFIG.name} - All Configurations`,
    description: APP_CONFIG.description,
    license: APP_CONFIG.license,
    lastUpdated: new Date().toISOString(),
    statistics: {
      totalConfigurations:
        transformedAgents.length +
        transformedMcp.length +
        transformedRules.length +
        transformedCommands.length +
        transformedHooks.length,
      agents: transformedAgents.length,
      mcp: transformedMcp.length,
      rules: transformedRules.length,
      commands: transformedCommands.length,
      hooks: transformedHooks.length,
    },
    endpoints: {
      agents: `${APP_CONFIG.url}/api/agents.json`,
      mcp: `${APP_CONFIG.url}/api/mcp.json`,
      rules: `${APP_CONFIG.url}/api/rules.json`,
      commands: `${APP_CONFIG.url}/api/commands.json`,
      hooks: `${APP_CONFIG.url}/api/hooks.json`,
    },
  };

  if (format === 'ndjson') {
    // NDJSON format - each line is a separate JSON object
    yield `${JSON.stringify({ type: 'metadata', ...metadata })}\n`;

    // Stream each category in batches
    const categories = [
      { name: 'agents', data: transformedAgents },
      { name: 'mcp', data: transformedMcp },
      { name: 'rules', data: transformedRules },
      { name: 'commands', data: transformedCommands },
      { name: 'hooks', data: transformedHooks },
    ];

    for (const category of categories) {
      for (let i = 0; i < category.data.length; i += batchSize) {
        const batch = category.data.slice(i, i + batchSize);
        yield `${JSON.stringify({ type: 'data', category: category.name, items: batch })}\n`;
      }
    }
  } else {
    // JSON format - stream as valid JSON with chunked data
    yield '{\n';
    yield `  "metadata": ${JSON.stringify(metadata, null, 2)},\n`;
    yield '  "data": {\n';

    const categories = [
      { name: 'agents', data: transformedAgents },
      { name: 'mcp', data: transformedMcp },
      { name: 'rules', data: transformedRules },
      { name: 'commands', data: transformedCommands },
      { name: 'hooks', data: transformedHooks },
    ];

    for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
      const category = categories[categoryIndex]!;
      yield `    "${category.name}": [\n`;

      for (let i = 0; i < category.data.length; i += batchSize) {
        const batch = category.data.slice(i, i + batchSize);
        for (let j = 0; j < batch.length; j++) {
          const item = batch[j]!;
          const isLastInBatch = j === batch.length - 1;
          const isLastBatch = i + batchSize >= category.data.length;
          const isLastItem = isLastInBatch && isLastBatch;

          yield `      ${JSON.stringify(item)}${isLastItem ? '' : ','}\n`;
        }
      }

      const isLastCategory = categoryIndex === categories.length - 1;
      yield `    ]${isLastCategory ? '' : ','}\n`;
    }

    yield '  }\n';
    yield '}\n';
  }
}

async function handleGET(request: NextRequest) {
  const requestLogger = logger.forRequest(request);

  try {
    // Parse and validate query parameters with streaming support
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    const validatedQuery = streamingQuerySchema.parse(queryParams);

    requestLogger.info('All configurations API request started', {
      streaming: validatedQuery.stream,
      format: validatedQuery.format,
      batchSize: validatedQuery.batchSize,
      queryPage: validatedQuery.page || 1,
      queryLimit: validatedQuery.limit || 50,
      validated: true,
    });

    // Handle streaming response
    if (validatedQuery.stream) {
      const responseHeaders = {
        'Content-Type':
          validatedQuery.format === 'ndjson'
            ? 'application/x-ndjson; charset=utf-8'
            : 'application/json; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'public, s-maxage=7200, stale-while-revalidate=86400', // Shorter cache for streaming
        'X-Stream': 'true',
        'X-Format': validatedQuery.format,
      };

      // Create streaming response using ReadableStream
      const stream = new ReadableStream({
        async start(controller) {
          try {
            const encoder = new TextEncoder();

            for await (const chunk of createStreamingResponse(
              validatedQuery.batchSize,
              validatedQuery.format
            )) {
              controller.enqueue(encoder.encode(chunk));
            }

            controller.close();

            requestLogger.info('Streaming response completed successfully', {
              format: validatedQuery.format,
              batchSize: validatedQuery.batchSize,
            });
          } catch (error) {
            requestLogger.error('Streaming response failed', error as Error, {
              format: validatedQuery.format,
              batchSize: validatedQuery.batchSize,
            });
            controller.error(error);
          }
        },
      });

      return new Response(stream, { headers: responseHeaders });
    }

    // Try to get from cache first
    const cacheKey = 'all-configurations';
    const cachedResponse = await contentCache.getAPIResponse(cacheKey);
    if (cachedResponse) {
      requestLogger.info('Serving cached all-configurations response', {
        source: 'redis-cache',
      });
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
          'X-Cache': 'HIT',
        },
      });
    }
    // Fetch all content from content processor
    const allContent = await contentProcessor.getAllCategories();

    const transformedAgents = transformContent(allContent.agents, 'agent', 'agents');
    const transformedMcp = transformContent(allContent.mcp, 'mcp', 'mcp');
    const transformedRules = transformContent(allContent.rules, 'rule', 'rules');
    const transformedCommands = transformContent(allContent.commands, 'command', 'commands');
    const transformedHooks = transformContent(allContent.hooks, 'hook', 'hooks');

    const allConfigurations = {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: `${APP_CONFIG.name} - All Configurations`,
      description: APP_CONFIG.description,
      license: APP_CONFIG.license,
      lastUpdated: new Date().toISOString(),
      statistics: {
        totalConfigurations:
          transformedAgents.length +
          transformedMcp.length +
          transformedRules.length +
          transformedCommands.length +
          transformedHooks.length,
        agents: transformedAgents.length,
        mcp: transformedMcp.length,
        rules: transformedRules.length,
        commands: transformedCommands.length,
        hooks: transformedHooks.length,
      },
      data: {
        agents: transformedAgents,
        mcp: transformedMcp,
        rules: transformedRules,
        commands: transformedCommands,
        hooks: transformedHooks,
      },
      endpoints: {
        agents: `${APP_CONFIG.url}/api/agents.json`,
        mcp: `${APP_CONFIG.url}/api/mcp.json`,
        rules: `${APP_CONFIG.url}/api/rules.json`,
        commands: `${APP_CONFIG.url}/api/commands.json`,
        hooks: `${APP_CONFIG.url}/api/hooks.json`,
      },
    };

    // Cache the response for 2 hours (this is a large dataset)
    await contentCache.cacheAPIResponse(cacheKey, allConfigurations, 2 * 60 * 60);

    requestLogger.info('All configurations API request completed successfully', {
      totalConfigurations: allConfigurations.statistics.totalConfigurations,
    });

    return NextResponse.json(allConfigurations, {
      headers: {
        'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    // Handle Zod validation errors from streaming query schema
    if (error instanceof z.ZodError) {
      requestLogger.warn('Streaming query validation error in all-configurations API', {
        error: 'Invalid query parameters',
        issuesCount: error.issues.length,
        firstIssue: error.issues[0]?.message || 'Validation error',
      });

      return NextResponse.json(
        {
          error: 'Query validation failed',
          message: 'Invalid query parameters for streaming API',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
          })),
          timestamp: new Date().toISOString(),
          availableParams: {
            stream: 'true|false (default: false)',
            format: 'json|ndjson (default: json)',
            batchSize: 'number 10-100 (default: 50)',
          },
        },
        { status: 400 }
      );
    }

    // Handle validation errors specifically
    if (error instanceof ValidationError) {
      requestLogger.warn('Validation error in all-configurations API', {
        error: error.message,
        detailsCount: error.details.issues.length,
      });

      return NextResponse.json(
        {
          error: 'Validation failed',
          message: error.message,
          details: error.details.issues.map((e) => ({
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
    const sanitizedError = sanitizeApiError(error, createRequestId(), {
      route: 'all-configurations',
      operation: 'generate_dataset',
    });

    return NextResponse.json(sanitizedError, { status: 500 });
  }
}

// Apply rate limiting to the GET handler
export async function GET(request: NextRequest) {
  return withRateLimit(request, rateLimiters.api, handleGET, request);
}
