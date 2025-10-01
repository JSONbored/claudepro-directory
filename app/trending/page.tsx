import { readFile } from 'fs/promises';
import { join } from 'path';
import { TrendingContent } from '@/components/trending-content';
import { Badge } from '@/components/ui/badge';
import { agents, commands, hooks, mcp, rules } from '@/generated/content';
import { Clock, Star, TrendingUp, Users } from '@/lib/icons';
import { logger } from '@/lib/logger';
import type { PagePropsWithSearchParams } from '@/lib/schemas/app.schema';
import {
  parseSearchParams,
  type TrendingParams,
  trendingParamsSchema,
} from '@/lib/schemas/search.schema';

// ISR Configuration - Revalidate every 5 minutes for trending data
// Static file provides instant load, ISR ensures freshness
export const revalidate = 300; // 5 minutes in seconds
export const dynamic = 'force-static'; // Enable ISR (Incremental Static Regeneration)

// Load static trending data with fallback
async function getTrendingData(params: TrendingParams) {
  // Log trending data access for analytics
  if (Object.keys(params).length > 0) {
    logger.info('Trending data accessed with parameters', {
      period: params.period,
      metric: params.metric,
      category: params.category,
      page: params.page,
      limit: params.limit,
    });
  }

  try {
    // Try to load pre-generated static trending data (fastest path - 1-3ms)
    const staticFilePath = join(process.cwd(), 'public', 'static-api', 'trending.json');
    const fileContent = await readFile(staticFilePath, 'utf-8');
    const staticData = JSON.parse(fileContent);

    // Basic validation - ensure required structure exists
    if (
      !staticData ||
      typeof staticData !== 'object' ||
      !Array.isArray(staticData.trending) ||
      !Array.isArray(staticData.popular) ||
      !Array.isArray(staticData.recent)
    ) {
      throw new Error('Invalid trending data structure');
    }

    logger.info('Loaded trending data from static file', {
      trendingCount: staticData.trending.length,
      popularCount: staticData.popular.length,
      recentCount: staticData.recent.length,
      algorithm: staticData.metadata?.algorithm,
    });

    return {
      trending: staticData.trending,
      popular: staticData.popular,
      recent: staticData.recent,
    };
  } catch (error) {
    // Fallback: Generate data on-demand if static file not available or invalid
    logger.warn('Static trending data not available or invalid, generating on-demand', {
      error: error instanceof Error ? error.message : String(error),
    });

    // Await all content promises
    const [rulesData, mcpData, agentsData, commandsData, hooksData] = await Promise.all([
      rules,
      mcp,
      agents,
      commands,
      hooks,
    ]);

    // Simple popularity-based sorting fallback
    const sortByPop = <T extends Record<string, unknown>>(items: readonly T[]): T[] =>
      [...items].sort((a, b) => {
        const aPop = typeof a.popularity === 'number' ? a.popularity : 0;
        const bPop = typeof b.popularity === 'number' ? b.popularity : 0;
        return bPop - aPop;
      });

    const sortedRules = sortByPop(rulesData);
    const sortedMcp = sortByPop(mcpData);
    const sortedAgents = sortByPop(agentsData);
    const sortedCommands = sortByPop(commandsData);
    const sortedHooks = sortByPop(hooksData);

    // Simple round-robin mixer
    const mix = (
      cats: Array<{ items: Record<string, unknown>[]; type: string; count: number }>,
      total: number
    ): Array<Record<string, unknown> & { type: string }> => {
      const result: Array<Record<string, unknown> & { type: string }> = [];
      let idx = 0;
      while (result.length < total) {
        for (const cat of cats) {
          const item = cat.items[idx];
          if (item && result.length < total) {
            result.push({ ...item, type: cat.type });
          }
        }
        idx++;
        if (cats.every((c) => c.items.length <= idx)) break;
      }
      return result;
    };

    const trending = mix(
      [
        {
          items: sortedRules.slice(0, 5) as unknown as Record<string, unknown>[],
          type: 'rules',
          count: 3,
        },
        {
          items: sortedMcp.slice(0, 5) as unknown as Record<string, unknown>[],
          type: 'mcp',
          count: 3,
        },
        {
          items: sortedAgents.slice(0, 4) as unknown as Record<string, unknown>[],
          type: 'agents',
          count: 2,
        },
        {
          items: sortedCommands.slice(0, 4) as unknown as Record<string, unknown>[],
          type: 'commands',
          count: 2,
        },
        {
          items: sortedHooks.slice(0, 4) as unknown as Record<string, unknown>[],
          type: 'hooks',
          count: 2,
        },
      ],
      12
    );

    const popular = mix(
      [
        {
          items: sortedRules.slice(0, 4) as unknown as Record<string, unknown>[],
          type: 'rules',
          count: 2,
        },
        {
          items: sortedMcp.slice(0, 4) as unknown as Record<string, unknown>[],
          type: 'mcp',
          count: 2,
        },
        {
          items: sortedAgents.slice(0, 3) as unknown as Record<string, unknown>[],
          type: 'agents',
          count: 2,
        },
        {
          items: sortedCommands.slice(0, 3) as unknown as Record<string, unknown>[],
          type: 'commands',
          count: 2,
        },
        {
          items: sortedHooks.slice(0, 2) as unknown as Record<string, unknown>[],
          type: 'hooks',
          count: 1,
        },
      ],
      9
    );

    const recent = mix(
      [
        {
          items: rulesData.slice(-4).reverse() as unknown as Record<string, unknown>[],
          type: 'rules',
          count: 2,
        },
        {
          items: mcpData.slice(-4).reverse() as unknown as Record<string, unknown>[],
          type: 'mcp',
          count: 2,
        },
        {
          items: agentsData.slice(-3).reverse() as unknown as Record<string, unknown>[],
          type: 'agents',
          count: 2,
        },
        {
          items: commandsData.slice(-3).reverse() as unknown as Record<string, unknown>[],
          type: 'commands',
          count: 2,
        },
        {
          items: hooksData.slice(-2).reverse() as unknown as Record<string, unknown>[],
          type: 'hooks',
          count: 1,
        },
      ],
      9
    );

    return { trending, popular, recent };
  }
}

export default async function TrendingPage({ searchParams }: PagePropsWithSearchParams) {
  const rawParams = await searchParams;

  // Validate and parse search parameters with Zod
  const params = parseSearchParams(trendingParamsSchema, rawParams, 'trending page');

  // Log validated parameters for monitoring
  logger.info('Trending page accessed', {
    period: params.period,
    metric: params.metric,
    category: params.category,
    page: params.page,
    limit: params.limit,
  });

  const { trending, popular, recent } = await getTrendingData(params);

  // Await all content promises to calculate total count
  const [rulesData, mcpData, agentsData, commandsData, hooksData] = await Promise.all([
    rules,
    mcp,
    agents,
    commands,
    hooks,
  ]);
  const totalCount =
    rulesData.length + mcpData.length + agentsData.length + commandsData.length + hooksData.length;

  // This is a server component, so we'll use a static ID
  const pageTitleId = 'trending-page-title';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden" aria-labelledby={pageTitleId}>
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-6 border-accent/20 bg-accent/5 text-accent">
              <TrendingUp className="h-3 w-3 mr-1 text-accent" aria-hidden="true" />
              Trending
            </Badge>

            <h1 id={pageTitleId} className="text-4xl md:text-6xl font-bold mb-6">
              Trending Configurations
            </h1>

            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Discover the most popular and trending Claude configurations in our community. Stay up
              to date with what developers are using and loving.
            </p>

            <ul className="flex flex-wrap gap-2 justify-center list-none">
              <li>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                  Updated hourly
                </Badge>
              </li>
              <li>
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1" aria-hidden="true" />
                  Community curated
                </Badge>
              </li>
              <li>
                <Badge variant="secondary">
                  <Users className="h-3 w-3 mr-1" aria-hidden="true" />
                  {totalCount} total configs
                </Badge>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trending Content */}
      <section
        className="container mx-auto px-4 py-16"
        aria-label="Trending configurations content"
      >
        <TrendingContent trending={trending} popular={popular} recent={recent} />
      </section>
    </div>
  );
}
