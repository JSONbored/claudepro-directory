import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { LazySection } from '@/src/components/infra/lazy-section';
import { getContentByCategory } from '@/src/lib/content/supabase-content-loader';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
  }
);

import { z } from 'zod';
import { TrendingContent } from '@/src/components/shared/trending-content';
import { statsRedis } from '@/src/lib/cache.server';
import { Clock, Star, TrendingUp, Users } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { PagePropsWithSearchParams } from '@/src/lib/schemas/app.schema';

// Inline trending params schema (was in search.schema.ts)
const trendingParamsSchema = z.object({
  category: z.string().optional(),
  period: z.enum(['today', 'week', 'month', 'year', 'all']).optional().default('week'),
  metric: z.enum(['views', 'likes', 'shares', 'downloads', 'all']).optional().default('views'),
  page: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .pipe(z.number().int().positive())
    .optional()
    .default(1),
  limit: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .pipe(z.number().int().positive().max(100))
    .optional()
    .default(20),
});

type TrendingParams = z.infer<typeof trendingParamsSchema>;

function parseSearchParams<T extends z.ZodType>(schema: T, params: unknown): z.infer<T> {
  try {
    return schema.parse(params);
  } catch {
    return schema.parse({});
  }
}

import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { getBatchTrendingData } from '@/src/lib/trending/calculator.server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Generate metadata from centralized registry
export const metadata = generatePageMetadata('/trending');

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
    // Fetch all content from Supabase (parallel queries with ISR caching)
    const [
      rulesData,
      mcpData,
      agentsData,
      commandsData,
      hooksData,
      statuslinesData,
      collectionsData,
      skillsData,
    ] = await Promise.all([
      getContentByCategory('rules'),
      getContentByCategory('mcp'),
      getContentByCategory('agents'),
      getContentByCategory('commands'),
      getContentByCategory('hooks'),
      getContentByCategory('statuslines'),
      getContentByCategory('collections'),
      getContentByCategory('skills'),
    ]);

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
    // Note: getContentByCategory() already includes category field from database
    const trendingData = await getBatchTrendingData(
      {
        agents: agentsData,
        mcp: mcpData,
        rules: rulesData,
        commands: commandsData,
        hooks: hooksData,
        statuslines: statuslinesData,
        collections: collectionsData,
        skills: skillsData,
      },
      { includeSponsored: true } // Enable sponsored content injection
    );

    const algorithm = trendingData.metadata.algorithm;
    logger.info(`Loaded trending data using ${algorithm}`, {
      trendingCount: trendingData.trending.length,
      popularCount: trendingData.popular.length,
      recentCount: trendingData.recent.length,
      algorithm,
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

  const [enrichedTrending = [], enrichedPopular = [], enrichedRecent = []] =
    await statsRedis.enrichMultipleDatasets([trending, popular, recent]);

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
              trending={enrichedTrending}
              popular={enrichedPopular}
              recent={enrichedRecent}
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
