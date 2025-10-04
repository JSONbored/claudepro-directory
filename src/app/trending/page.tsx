import { agents, collections, commands, hooks, mcp, rules, statuslines } from '@/generated/content';
import { TrendingContent } from '@/src/components/shared/trending-content';
import { Badge } from '@/src/components/ui/badge';
import { Clock, Star, TrendingUp, Users } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { PagePropsWithSearchParams } from '@/src/lib/schemas/app.schema';
import {
  parseSearchParams,
  type TrendingParams,
  trendingParamsSchema,
} from '@/src/lib/schemas/search.schema';
import { getBatchTrendingData } from '@/src/lib/trending/calculator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// ISR Configuration - Revalidate every 5 minutes for fresh Redis view counts
export const revalidate = 300; // 5 minutes - Updates trending data while keeping static content

/**
 * Load trending data using Redis-based view counts
 *
 * @description Queries Redis for real-time view counts and calculates trending content
 * based on actual user engagement. Automatically falls back to static popularity field
 * if Redis is unavailable. Also returns total count to avoid duplicate content fetching.
 */
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
    // Await all content promises (single fetch for both trending data and total count)
    const [
      rulesData,
      mcpData,
      agentsData,
      commandsData,
      hooksData,
      statuslinesData,
      collectionsData,
    ] = await Promise.all([rules, mcp, agents, commands, hooks, statuslines, collections]);

    // Calculate total count
    const totalCount =
      rulesData.length +
      mcpData.length +
      agentsData.length +
      commandsData.length +
      hooksData.length +
      statuslinesData.length +
      collectionsData.length;

    // Use Redis-based trending calculator
    const trendingData = await getBatchTrendingData({
      agents: agentsData.map((item: { [key: string]: unknown }) => ({
        ...item,
        category: 'agents' as const,
      })),
      mcp: mcpData.map((item: { [key: string]: unknown }) => ({
        ...item,
        category: 'mcp' as const,
      })),
      rules: rulesData.map((item: { [key: string]: unknown }) => ({
        ...item,
        category: 'rules' as const,
      })),
      commands: commandsData.map((item: { [key: string]: unknown }) => ({
        ...item,
        category: 'commands' as const,
      })),
      hooks: hooksData.map((item: { [key: string]: unknown }) => ({
        ...item,
        category: 'hooks' as const,
      })),
      statuslines: statuslinesData.map((item: { [key: string]: unknown }) => ({
        ...item,
        category: 'statuslines' as const,
      })),
      collections: collectionsData.map((item: { [key: string]: unknown }) => ({
        ...item,
        category: 'collections' as const,
      })),
    });

    const algorithm = trendingData.metadata.redisEnabled ? 'redis-views' : 'popularity-fallback';
    logger.info(`Loaded trending data using ${algorithm}`, {
      trendingCount: trendingData.trending.length,
      popularCount: trendingData.popular.length,
      recentCount: trendingData.recent.length,
      redisEnabled: trendingData.metadata.redisEnabled,
      totalCount,
    });

    return {
      trending: trendingData.trending,
      popular: trendingData.popular,
      recent: trendingData.recent,
      totalCount,
    };
  } catch (error) {
    logger.error(
      'Failed to load trending data',
      error instanceof Error ? error : new Error(String(error))
    );

    // Ultimate fallback - return empty arrays
    return {
      trending: [],
      popular: [],
      recent: [],
      totalCount: 0,
    };
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

  const { trending, popular, recent, totalCount } = await getTrendingData(params);

  // This is a server component, so we'll use a static ID
  const pageTitleId = 'trending-page-title';

  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      {/* Hero Section */}
      <section
        className={`relative py-24 px-4 ${UI_CLASSES.OVERFLOW_HIDDEN}`}
        aria-labelledby={pageTitleId}
      >
        <div className={`container ${UI_CLASSES.MX_AUTO} text-center`}>
          <div className={`${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO}`}>
            <Badge
              variant="outline"
              className={`mb-6 border-accent/20 ${UI_CLASSES.BG_ACCENT_5} text-accent`}
            >
              <TrendingUp className="h-3 w-3 mr-1 text-accent" aria-hidden="true" />
              Trending
            </Badge>

            <h1 id={pageTitleId} className="text-4xl md:text-6xl font-bold mb-6">
              Trending Configurations
            </h1>

            <p className={UI_CLASSES.TEXT_HEADING_LARGE}>
              Discover the most popular and trending Claude configurations in our community. Stay up
              to date with what developers are using and loving.
            </p>

            <ul className={`${UI_CLASSES.FLEX_WRAP_GAP_2} ${UI_CLASSES.JUSTIFY_CENTER} list-none`}>
              <li>
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                  Real-time updates
                </Badge>
              </li>
              <li>
                <Badge variant="secondary">
                  <Star className="h-3 w-3 mr-1" aria-hidden="true" />
                  Based on views
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
        className={`container ${UI_CLASSES.MX_AUTO} px-4 py-16`}
        aria-label="Trending configurations content"
      >
        <TrendingContent trending={trending} popular={popular} recent={recent} />
      </section>
    </div>
  );
}
