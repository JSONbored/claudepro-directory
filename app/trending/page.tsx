import { Clock, Star, TrendingUp, Users } from 'lucide-react';
import { TrendingContent } from '@/components/trending-content';
import { Badge } from '@/components/ui/badge';
import { sortByPopularity } from '@/lib/content-sorting';
import { logger } from '@/lib/logger';
import { statsRedis } from '@/lib/redis';
import type { PagePropsWithSearchParams } from '@/lib/schemas/app.schema';
import type { ContentMetadata } from '@/lib/schemas/content.schema';
import {
  parseSearchParams,
  type TrendingParams,
  trendingParamsSchema,
} from '@/lib/schemas/search.schema';
import { contentProcessor } from '@/lib/services/content-processor.service';

// Use Edge Runtime with ISR for better performance
export const runtime = 'edge';
export const revalidate = 3600; // 1 hour - trending data updates frequently

async function getTrendingData(params: TrendingParams) {
  // Validate trending parameters for security
  const validatedParams = Object.keys(params).length > 0 ? params : {};

  // Log trending data access for analytics
  if (Object.keys(validatedParams).length > 0) {
    logger.info('Trending data accessed with parameters', {
      period: params.period,
      metric: params.metric,
      category: params.category,
      page: params.page,
      limit: params.limit,
    });
  }

  // Fetch all content from the content processor
  const allCategories = await contentProcessor.getAllCategories();
  const rules = allCategories.rules as ContentMetadata[];
  const mcp = allCategories.mcp as ContentMetadata[];
  const agents = allCategories.agents as ContentMetadata[];
  const commands = allCategories.commands as ContentMetadata[];
  const hooks = allCategories.hooks as ContentMetadata[];

  // Helper function to get mixed content from categories
  const getMixedContent = (
    categories: { items: ContentMetadata[]; type: string; count: number }[],
    totalCount: number
  ): Array<ContentMetadata & { type: string; viewCount?: number }> => {
    const result: Array<ContentMetadata & { type: string; viewCount?: number }> = [];
    let currentIndex = 0;

    // Round-robin through categories to ensure variety
    while (result.length < totalCount) {
      for (const category of categories) {
        if (category.items.length > currentIndex && result.length < totalCount) {
          const baseItem = category.items[currentIndex];
          if (baseItem) {
            const item = {
              ...baseItem,
              type: category.type,
            } as ContentMetadata & {
              type: string;
              viewCount?: number;
            };
            result.push(item);
          }
        }
      }
      currentIndex++;
      // Break if we've exhausted all categories
      if (categories.every((cat) => cat.items.length <= currentIndex)) break;
    }

    return result;
  };

  if (!statsRedis.isEnabled()) {
    // Fallback to static data if Redis is not available
    // Sort each category by popularity - cast readonly tuple types to ContentMetadata arrays
    const sortedRules = sortByPopularity(rules as readonly ContentMetadata[]);
    const sortedMcp = sortByPopularity(mcp as readonly ContentMetadata[]);
    const sortedAgents = sortByPopularity(agents as readonly ContentMetadata[]);
    const sortedCommands = sortByPopularity(commands as readonly ContentMetadata[]);
    const sortedHooks = sortByPopularity(hooks as readonly ContentMetadata[]);

    // Mix categories for trending (12 items total, ~2-3 per category)
    const trending = getMixedContent(
      [
        { items: sortedRules, type: 'rules', count: 3 },
        { items: sortedMcp, type: 'mcp', count: 3 },
        { items: sortedAgents, type: 'agents', count: 2 },
        { items: sortedCommands, type: 'commands', count: 2 },
        { items: sortedHooks, type: 'hooks', count: 2 },
      ],
      12
    );

    // Popular shows top items from each category (9 items)
    const popular = getMixedContent(
      [
        { items: sortedRules, type: 'rules', count: 2 },
        { items: sortedMcp, type: 'mcp', count: 2 },
        { items: sortedAgents, type: 'agents', count: 2 },
        { items: sortedCommands, type: 'commands', count: 2 },
        { items: sortedHooks, type: 'hooks', count: 1 },
      ],
      9
    );

    // Recent shows newest from each category (simulate by reversing arrays)
    const recent = getMixedContent(
      [
        { items: [...rules].reverse(), type: 'rules', count: 2 },
        { items: [...mcp].reverse(), type: 'mcp', count: 2 },
        { items: [...agents].reverse(), type: 'agents', count: 2 },
        { items: [...commands].reverse(), type: 'commands', count: 2 },
        { items: [...hooks].reverse(), type: 'hooks', count: 1 },
      ],
      9
    );

    return { trending, popular, recent };
  }

  try {
    // Fetch trending data from Redis for each category
    const [trendingAgents, trendingMcp, trendingRules, trendingCommands, trendingHooks] =
      await Promise.all([
        statsRedis.getTrending('agents', 3),
        statsRedis.getTrending('mcp', 3),
        statsRedis.getTrending('rules', 3),
        statsRedis.getTrending('commands', 3),
        statsRedis.getTrending('hooks', 3),
      ]);

    // Fetch popular data from Redis (all-time views)
    const [popularAgents, popularMcp, popularRules, popularCommands, popularHooks] =
      await Promise.all([
        statsRedis.getPopular('agents', 2),
        statsRedis.getPopular('mcp', 2),
        statsRedis.getPopular('rules', 2),
        statsRedis.getPopular('commands', 2),
        statsRedis.getPopular('hooks', 1),
      ]);

    // Map Redis IDs back to actual content items
    const mapToContent = (
      items: string[] | { slug: string; views?: number }[],
      contentArray: readonly ContentMetadata[],
      type: string
    ): Array<ContentMetadata & { type: string; viewCount?: number }> => {
      const result: Array<ContentMetadata & { type: string; viewCount?: number }> = [];

      for (const item of items) {
        const slug = typeof item === 'string' ? item : item.slug;
        const views = typeof item === 'object' ? item.views : undefined;
        const content = contentArray.find((c) => c.slug === slug);

        if (content) {
          result.push({
            ...content,
            type,
            viewCount: views,
          } as ContentMetadata & {
            type: string;
            viewCount?: number;
          });
        }
      }

      return result;
    };

    // Trending - mix from all categories (last 7 days)
    const trending = [
      ...mapToContent(trendingAgents, agents, 'agents'),
      ...mapToContent(trendingMcp, mcp, 'mcp'),
      ...mapToContent(trendingRules, rules, 'rules'),
      ...mapToContent(trendingCommands, commands, 'commands'),
      ...mapToContent(trendingHooks, hooks, 'hooks'),
    ].slice(0, 12);

    // Popular - all-time most viewed
    const popular = [
      ...mapToContent(popularAgents, agents, 'agents'),
      ...mapToContent(popularMcp, mcp, 'mcp'),
      ...mapToContent(popularRules, rules, 'rules'),
      ...mapToContent(popularCommands, commands, 'commands'),
      ...mapToContent(popularHooks, hooks, 'hooks'),
    ].slice(0, 9);

    // Recent - if we don't have enough data, use fallback mixing
    const recentFallback = getMixedContent(
      [
        { items: [...rules].reverse(), type: 'rules', count: 2 },
        { items: [...mcp].reverse(), type: 'mcp', count: 2 },
        { items: [...agents].reverse(), type: 'agents', count: 2 },
        { items: [...commands].reverse(), type: 'commands', count: 2 },
        { items: [...hooks].reverse(), type: 'hooks', count: 1 },
      ],
      9
    );

    return {
      trending: trending.length > 0 ? trending : recentFallback,
      popular: popular.length > 0 ? popular : recentFallback,
      recent: recentFallback,
    };
  } catch (error) {
    logger.error(
      'Failed to fetch trending data on trending page',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'TrendingPage',
      }
    );
    // Use same fallback as non-Redis case - cast readonly tuple types to ContentMetadata arrays
    const sortedRules = sortByPopularity(rules as readonly ContentMetadata[]);
    const sortedMcp = sortByPopularity(mcp as readonly ContentMetadata[]);
    const sortedAgents = sortByPopularity(agents as readonly ContentMetadata[]);
    const sortedCommands = sortByPopularity(commands as readonly ContentMetadata[]);
    const sortedHooks = sortByPopularity(hooks as readonly ContentMetadata[]);

    const trending = getMixedContent(
      [
        { items: sortedRules, type: 'rules', count: 3 },
        { items: sortedMcp, type: 'mcp', count: 3 },
        { items: sortedAgents, type: 'agents', count: 2 },
        { items: sortedCommands, type: 'commands', count: 2 },
        { items: sortedHooks, type: 'hooks', count: 2 },
      ],
      12
    );

    const popular = getMixedContent(
      [
        { items: sortedRules, type: 'rules', count: 2 },
        { items: sortedMcp, type: 'mcp', count: 2 },
        { items: sortedAgents, type: 'agents', count: 2 },
        { items: sortedCommands, type: 'commands', count: 2 },
        { items: sortedHooks, type: 'hooks', count: 1 },
      ],
      9
    );

    const recent = getMixedContent(
      [
        { items: [...rules].reverse(), type: 'rules', count: 2 },
        { items: [...mcp].reverse(), type: 'mcp', count: 2 },
        { items: [...agents].reverse(), type: 'agents', count: 2 },
        { items: [...commands].reverse(), type: 'commands', count: 2 },
        { items: [...hooks].reverse(), type: 'hooks', count: 1 },
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

  // Get total count from content processor
  const allCategories = await contentProcessor.getAllCategories();
  const totalCount =
    allCategories.rules.length +
    allCategories.mcp.length +
    allCategories.agents.length +
    allCategories.commands.length +
    allCategories.hooks.length;

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
