import { type NextRequest, NextResponse } from 'next/server';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import { sanitizeApiError } from '@/lib/error-sanitizer';
import { logger } from '@/lib/logger';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
import { contentCache } from '@/lib/redis';
import { apiSchemas, ValidationError, validation } from '@/lib/validation';

export const runtime = 'nodejs';
export const revalidate = 14400; // 4 hours

// Helper function to transform content with type and URL
function transformContent<T extends { slug: string }>(
  content: T[],
  type: string,
  category: string
): (T & { type: string; url: string })[] {
  return content.map((item) => ({
    ...item,
    type,
    url: `https://claudepro.directory/${category}/${item.slug}`,
  }));
}

async function handleGET(request: NextRequest) {
  const requestLogger = logger.forRequest(request);

  try {
    // Validate query parameters if any exist
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams);

    if (Object.keys(queryParams).length > 0) {
      // Only validate if there are query parameters
      const validatedQuery = validation.validateQuery(
        apiSchemas.paginationQuery.partial(),
        queryParams,
        'all-configurations query parameters'
      );
      requestLogger.info('All configurations API request started', {
        queryPage: validatedQuery.page || 1,
        queryLimit: validatedQuery.limit || 50,
        validated: true,
      });
    } else {
      requestLogger.info('All configurations API request started', { validated: true });
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
    const transformedAgents = transformContent(agents, 'agent', 'agents');
    const transformedMcp = transformContent(mcp, 'mcp', 'mcp');
    const transformedRules = transformContent(rules, 'rule', 'rules');
    const transformedCommands = transformContent(commands, 'command', 'commands');
    const transformedHooks = transformContent(hooks, 'hook', 'hooks');

    const allConfigurations = {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: 'Claude Pro Directory - All Configurations',
      description: 'Complete database of Claude AI configurations',
      license: 'MIT',
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
        agents: 'https://claudepro.directory/api/agents.json',
        mcp: 'https://claudepro.directory/api/mcp.json',
        rules: 'https://claudepro.directory/api/rules.json',
        commands: 'https://claudepro.directory/api/commands.json',
        hooks: 'https://claudepro.directory/api/hooks.json',
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
  } catch (error: unknown) {
    // Handle validation errors specifically
    if (error instanceof ValidationError) {
      requestLogger.warn('Validation error in all-configurations API', {
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
