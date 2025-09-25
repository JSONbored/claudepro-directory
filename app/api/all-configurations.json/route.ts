import { type NextRequest, NextResponse } from 'next/server';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import { logger } from '@/lib/logger';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';
import { contentCache } from '@/lib/redis';

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
    requestLogger.info('All configurations API request started');

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
  } catch (error) {
    requestLogger.error(
      'API Error in all-configurations route',
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate configurations dataset',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting to the GET handler
export async function GET(request: NextRequest) {
  return withRateLimit(request, rateLimiters.api, handleGET, request);
}
