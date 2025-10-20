import { Suspense } from 'react';
import {
  agents,
  collections,
  commands,
  hooks,
  mcp,
  rules,
  skills,
  statuslines,
} from '@/generated/content';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { UnifiedNewsletterCapture } from '@/src/components/features/growth/unified-newsletter-capture';
import { LazySection } from '@/src/components/infra/lazy-section';
import { TrendingContent } from '@/src/components/shared/trending-content';
import { Clock, Star, TrendingUp, Users } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { PagePropsWithSearchParams } from '@/src/lib/schemas/app.schema';
import {
  parseSearchParams,
  type TrendingParams,
  trendingParamsSchema,
} from '@/src/lib/schemas/search.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { getBatchTrendingData } from '@/src/lib/trending/calculator.server';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { batchLoadContent } from '@/src/lib/utils/batch.utils';

// Generate metadata from centralized registry
export const metadata = generatePageMetadata('/trending');

// OPTIMIZATION: Increased from 300s (5min) to 3600s (1hr)
// Saves ~1,152 Redis commands/day - trending data cached longer
export const revalidate = 3600;

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
    const {
      rules: rulesData,
      mcp: mcpData,
      agents: agentsData,
      commands: commandsData,
      hooks: hooksData,
      statuslines: statuslinesData,
      collections: collectionsData,
      skills: skillsData,
    } = await batchLoadContent({
      rules,
      mcp,
      agents,
      commands,
      hooks,
      statuslines,
      collections,
      skills,
    });

    // Calculate total count
    const totalCount =
      rulesData.length +
      mcpData.length +
      agentsData.length +
      commandsData.length +
      hooksData.length +
      statuslinesData.length +
      collectionsData.length +
      skillsData.length;

    // Use Redis-based trending calculator with sponsored content injection
    const trendingData = await getBatchTrendingData(
      {
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
        skills: skillsData.map((item: { [key: string]: unknown }) => ({
          ...item,
          category: 'skills' as const,
        })),
      },
      { includeSponsored: true } // Enable sponsored content injection
    );

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

  // OPTIMIZATION: getBatchTrendingData already enriches content with view counts
  // Removed duplicate enrichMultipleDatasets call - saves ~1,500 commands/day
  const { trending, popular, recent, totalCount } = await getTrendingData(params);

  // This is a server component, so we'll use a static ID
  const pageTitleId = 'trending-page-title';

  return (
    <div className={'min-h-screen bg-background'}>
      {/* Hero Section */}
      <section className={'relative py-24 px-4 overflow-hidden'} aria-labelledby={pageTitleId}>
        <div className={'container mx-auto text-center'}>
          <div className={'max-w-3xl mx-auto'}>
            <UnifiedBadge
              variant="base"
              style="outline"
              className={'mb-6 border-accent/20 bg-accent/5 text-accent'}
            >
              <TrendingUp className="h-3 w-3 mr-1 text-accent" aria-hidden="true" />
              Trending
            </UnifiedBadge>

            <h1 id={pageTitleId} className="text-4xl md:text-6xl font-bold mb-6">
              Trending Configurations
            </h1>

            <p className={UI_CLASSES.TEXT_HEADING_LARGE}>
              Discover the most popular and trending Claude configurations in our community. Stay up
              to date with what developers are using and loving.
            </p>

            <ul className={`${UI_CLASSES.FLEX_WRAP_GAP_2} justify-center list-none`}>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Clock className="h-3 w-3 mr-1" aria-hidden="true" />
                  Real-time updates
                </UnifiedBadge>
              </li>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Star className="h-3 w-3 mr-1" aria-hidden="true" />
                  Based on views
                </UnifiedBadge>
              </li>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Users className="h-3 w-3 mr-1" aria-hidden="true" />
                  {totalCount} total configs
                </UnifiedBadge>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trending Content - Slide up animation for below-fold */}
      <section
        className={'container mx-auto px-4 py-16'}
        aria-label="Trending configurations content"
      >
        <Suspense fallback={null}>
          <LazySection variant="slide-up" delay={0.1}>
            <TrendingContent
              trending={trending}
              popular={popular}
              recent={recent}
            />
          </LazySection>
        </Suspense>
      </section>

      {/* Email CTA - Fade in animation */}
      <section className={'container mx-auto px-4 py-12'}>
        <Suspense fallback={null}>
          <LazySection variant="fade-in" delay={0.15}>
            <UnifiedNewsletterCapture
              source="content_page"
              variant="hero"
              context="trending-page"
              headline="Never Miss Trending Tools"
              description="Get weekly updates on what's hot in the Claude community. No spam, unsubscribe anytime."
            />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}
