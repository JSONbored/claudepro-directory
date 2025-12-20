/**
 * Trending Page - Cached server helper + data API parity
 * Server component uses getTrendingPageData (cached RPC). Data API exposes the same payload for external consumers.
 */

import { content_category as ContentCategory } from '@prisma/client';
import type { content_category } from '@prisma/client';
import { getTrendingPageData } from '@heyclaude/web-runtime/data/content';
import { Clock, Star, TrendingUp, Users } from '@heyclaude/web-runtime/icons';
import { logger } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { type PagePropsWithSearchParams } from '@heyclaude/web-runtime/types/app.schema';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  UnifiedBadge,
} from '@heyclaude/web-runtime/ui';
import {
  mapPopularContent,
  mapRecentContent,
  mapTrendingMetrics,
} from '@heyclaude/web-runtime/utils/content-transforms';
import { type Metadata } from 'next';
import { Suspense } from 'react';

import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TrendingContent } from '@/src/components/core/shared/trending-content';

/**
 * Trending page uses connection() deferral with Suspense streaming to run non-deterministic operations at request time.
 * Content is fetched server-side and cached at the data layer level.
 */

/**
 * Generate metadata for the Trending page route.
 *
 * Ensures a server connection is established so non-deterministic operations (e.g., Date.now())
 * run at request time to satisfy Cache Component requirements, then delegates metadata creation.
 *
 * @returns Metadata for the "/trending" route.
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  'use cache';
  return generatePageMetadata('/trending');
}

/**
 * Renders the Trending page showing trending, popular, and recent configurations, applying
 * category and limit query parameters when present.
 *
 * Fetches cached trending data (see `getTrendingPageData`) and maps it into display-ready
 * lists for the page header, content columns, and newsletter CTA. Category query values are
 * validated; invalid category parameters are logged and ignored. Trending data is periodically
 * refreshed according to the page's revalidation policy.
 *
 * @param props.searchParams - Search parameters from the request; supports `category` (string or single-element array)
 *   and `limit` (number, defaults to 12, clamped to 100).
 * @param root0
 * @param root0.searchParams
 * @returns The React element for the Trending page containing header, content sections, and newsletter CTA.
 *
 * @see getTrendingPageData
 * @see mapTrendingMetrics
 * @see mapPopularContent
 * @see mapRecentContent
 */
export default async function TrendingPage({ searchParams }: PagePropsWithSearchParams) {
  // Note: Cannot use 'use cache' on pages with searchParams - they're dynamic
  // Data layer caching is already in place for optimal performance

  // Await searchParams to establish request context
  await searchParams;

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/trending',
    operation: 'TrendingPage',
    route: '/trending',
  });

  return (
    <Suspense
      fallback={<div className="container mx-auto px-4 py-8">Loading trending content...</div>}
    >
      <TrendingPageContent
        reqLogger={reqLogger}
        searchParams={searchParams ?? Promise.resolve({})}
      />
    </Suspense>
  );
}

/**
 * Renders the Trending page content: validates query params, fetches server-side trending data,
 * maps it into displayable structures, and returns the page UI (header, badges, and content sections).
 *
 * This component resolves and validates `searchParams` on the server, fetches data via the
 * trending data API, and renders `TrendingContent` with mapped display items.
 *
 * @param props.reqLogger - A request-scoped logger used for structured warnings and info about parameter validation and data fetching.
 * @param root0
 * @param root0.reqLogger
 * @param props.searchParams - Promise that resolves to the route's search parameters (may include `category` and `limit`).
 * @param root0.searchParams
 * @returns A React element that displays the trending configurations page (header, badges, and content sections).
 *
 * @see getTrendingPageData
 * @see TrendingContent
 * @see mapTrendingMetrics
 * @see mapPopularContent
 * @see mapRecentContent
 */
async function TrendingPageContent({
  reqLogger,
  searchParams,
}: {
  reqLogger: ReturnType<typeof logger.child>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParameters = await searchParams;

  // Use shared query parameter helpers for consistency
  const { parseCategoryParam, parseLimitParam } =
    await import('@heyclaude/web-runtime/api/query-helpers');
  const categoryParameter = rawParameters['category'];
  const normalizedCategory = parseCategoryParam(categoryParameter);
  const limit = parseLimitParam(
    typeof rawParameters['limit'] === 'string' ? rawParameters['limit'] : undefined,
    1,
    100,
    12
  );

  // Section: Category Validation
  if (categoryParameter && !normalizedCategory) {
    reqLogger.warn(
      { category: categoryParameter, section: 'data-fetch' },
      'TrendingPage: invalid category parameter provided'
    );
  }

  // Section: Trending Data Fetch
  const pageData = await getTrendingPageData({
    category: normalizedCategory,
    limit,
  });
  reqLogger.info(
    {
      category: normalizedCategory ?? 'all',
      limit,
      popularCount: pageData.popular.length,
      recentCount: pageData.recent.length,
      section: 'data-fetch',
      trendingCount: pageData.trending.length,
    },
    'Trending page accessed'
  );

  const trendingDisplay = mapTrendingMetrics(
    pageData.trending,
    normalizedCategory ?? DEFAULT_CATEGORY
  );
  const popularDisplay = mapPopularContent(
    pageData.popular,
    normalizedCategory ?? DEFAULT_CATEGORY
  );
  const recentDisplay = mapRecentContent(pageData.recent, normalizedCategory ?? DEFAULT_CATEGORY);

  const pageTitleId = 'trending-page-title';

  return (
    <div className="bg-background min-h-screen">
      <section aria-labelledby={pageTitleId} className="relative overflow-hidden px-4 py-4">
        <div className="container mx-auto text-center">
          <div className="mx-auto max-w-3xl">
            <UnifiedBadge
              className="border-accent/20 bg-accent/5 text-accent mb-6"
              style="outline"
              variant="base"
            >
              <TrendingUp aria-hidden="true" className="text-accent mr-0.5 h-3 w-3" />
              Trending
            </UnifiedBadge>

            <h1 className="mb-6 text-4xl font-bold md:text-6xl" id={pageTitleId}>
              Trending Configurations
            </h1>

            <p className="text-muted-foreground mb-8 text-xl leading-relaxed">
              Discover the most popular and trending Claude configurations in our community. Stay up
              to date with what developers are using and loving.
            </p>

            <ul className="flex list-none flex-wrap justify-center gap-2">
              <li>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <UnifiedBadge style="secondary" variant="base">
                          <Clock aria-hidden="true" className="mr-0.5 h-3 w-3" />
                          Real-time updates
                        </UnifiedBadge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Real-time updates</p>
                      <p className="text-muted-foreground text-xs">
                        Trending data refreshes automatically
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </li>
              <li>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <UnifiedBadge style="secondary" variant="base">
                          <Star aria-hidden="true" className="mr-0.5 h-3 w-3" />
                          Based on views
                        </UnifiedBadge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Based on views</p>
                      <p className="text-muted-foreground text-xs">
                        Ranked by view count and engagement
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </li>
              <li>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <UnifiedBadge style="secondary" variant="base">
                          <Users aria-hidden="true" className="mr-0.5 h-3 w-3" />
                          {trendingDisplay.length} total configs
                        </UnifiedBadge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Community-driven</p>
                      <p className="text-muted-foreground text-xs">
                        Rankings reflect community usage and engagement
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-label="Trending configurations content" className="container mx-auto px-4 py-4">
        <Suspense fallback={null}>
          <LazySection delay={0.1} variant="slide-up">
            <TrendingContent
              popular={popularDisplay}
              recent={recentDisplay}
              trending={trendingDisplay}
            />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}

// OPTIMIZATION: Use shared content transformation utilities from @heyclaude/web-runtime/server
// Local implementations removed - using mapTrendingMetrics, mapPopularContent, mapRecentContent, toHomepageContentItem

const DEFAULT_CATEGORY: content_category = ContentCategory.agents;
