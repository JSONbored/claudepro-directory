import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { agents, collections, commands, hooks, mcp, rules, statuslines } from '@/generated/content';
import { APP_CONFIG } from '@/src/lib/constants';
import { handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';
import { rateLimiters, withRateLimit } from '@/src/lib/rate-limiter';
import { contentCache } from '@/src/lib/redis';
import { apiSchemas, ValidationError } from '@/src/lib/security/validators';

export const runtime = 'nodejs';

// Streaming query parameters validation schema
const streamingQuerySchema = z
  .object({
    stream: z
      .enum(['true', 'false'])
      .default('false')
      .transform((val) => val === 'true')
      .describe('Enable streaming response for large datasets'),
    format: z
      .enum(['json', 'ndjson'])
      .default('json')
      .describe('Response format: standard JSON or newline-delimited JSON (NDJSON)'),
    batchSize: z.coerce
      .number()
      .min(10)
      .max(100)
      .default(50)
      .describe('Number of items per batch in streaming mode (10-100)'),
  })
  .merge(apiSchemas.paginationQuery.partial());

// Helper function to transform content with type and URL
function transformContent<T extends { slug: string }>(
  content: readonly T[] | T[],
  type: string,
  category: string
): (T & { type: string; url: string })[] {
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
  const [
    agentsData,
    mcpData,
    rulesData,
    commandsData,
    hooksData,
    statuslinesData,
    collectionsData,
  ] = await Promise.all([agents, mcp, rules, commands, hooks, statuslines, collections]);
  const transformedAgents = transformContent(agentsData, 'agent', 'agents');
  const transformedMcp = transformContent(mcpData, 'mcp', 'mcp');
  const transformedRules = transformContent(rulesData, 'rule', 'rules');
  const transformedCommands = transformContent(commandsData, 'command', 'commands');
  const transformedHooks = transformContent(hooksData, 'hook', 'hooks');
  const transformedStatuslines = transformContent(statuslinesData, 'statusline', 'statuslines');
  const transformedCollections = transformContent(collectionsData, 'collection', 'collections');

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
        transformedHooks.length +
        transformedStatuslines.length +
        transformedCollections.length,
      agents: transformedAgents.length,
      mcp: transformedMcp.length,
      rules: transformedRules.length,
      commands: transformedCommands.length,
      hooks: transformedHooks.length,
      statuslines: transformedStatuslines.length,
      collections: transformedCollections.length,
    },
    endpoints: {
      agents: `${APP_CONFIG.url}/api/agents.json`,
      mcp: `${APP_CONFIG.url}/api/mcp.json`,
      rules: `${APP_CONFIG.url}/api/rules.json`,
      commands: `${APP_CONFIG.url}/api/commands.json`,
      hooks: `${APP_CONFIG.url}/api/hooks.json`,
      statuslines: `${APP_CONFIG.url}/api/statuslines.json`,
      collections: `${APP_CONFIG.url}/api/collections.json`,
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
      { name: 'statuslines', data: transformedStatuslines },
      { name: 'collections', data: transformedCollections },
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
      { name: 'statuslines', data: transformedStatuslines },
      { name: 'collections', data: transformedCollections },
    ];

    for (const [categoryIndex, category] of categories.entries()) {
      yield `    "${category.name}": [\n`;

      for (let i = 0; i < category.data.length; i += batchSize) {
        const batch = category.data.slice(i, i + batchSize);
        for (const [j, item] of batch.entries()) {
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
    const [
      agentsData,
      mcpData,
      rulesData,
      commandsData,
      hooksData,
      statuslinesData,
      collectionsData,
    ] = await Promise.all([agents, mcp, rules, commands, hooks, statuslines, collections]);
    const transformedAgents = transformContent(agentsData, 'agent', 'agents');
    const transformedMcp = transformContent(mcpData, 'mcp', 'mcp');
    const transformedRules = transformContent(rulesData, 'rule', 'rules');
    const transformedCommands = transformContent(commandsData, 'command', 'commands');
    const transformedHooks = transformContent(hooksData, 'hook', 'hooks');
    const transformedStatuslines = transformContent(statuslinesData, 'statusline', 'statuslines');
    const transformedCollections = transformContent(collectionsData, 'collection', 'collections');

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
          transformedHooks.length +
          transformedStatuslines.length +
          transformedCollections.length,
        agents: transformedAgents.length,
        mcp: transformedMcp.length,
        rules: transformedRules.length,
        commands: transformedCommands.length,
        hooks: transformedHooks.length,
        statuslines: transformedStatuslines.length,
        collections: transformedCollections.length,
      },
      data: {
        agents: transformedAgents,
        mcp: transformedMcp,
        rules: transformedRules,
        commands: transformedCommands,
        hooks: transformedHooks,
        statuslines: transformedStatuslines,
        collections: transformedCollections,
      },
      endpoints: {
        agents: `${APP_CONFIG.url}/api/agents.json`,
        mcp: `${APP_CONFIG.url}/api/mcp.json`,
        rules: `${APP_CONFIG.url}/api/rules.json`,
        commands: `${APP_CONFIG.url}/api/commands.json`,
        hooks: `${APP_CONFIG.url}/api/hooks.json`,
        statuslines: `${APP_CONFIG.url}/api/statuslines.json`,
        collections: `${APP_CONFIG.url}/api/collections.json`,
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
    // Use centralized error handler for all errors
    return handleApiError(error instanceof Error ? error : new Error(String(error)), {
      route: '/api/all-configurations.json',
      method: 'GET',
      operation: 'generate_dataset',
      logLevel: 'error',
      includeDetails: error instanceof z.ZodError || error instanceof ValidationError,
    });
  }
}

// Apply rate limiting to the GET handler
export async function GET(request: NextRequest) {
  return withRateLimit(request, rateLimiters.api, handleGET, request);
}
