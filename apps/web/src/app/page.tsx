/** Homepage consuming homepageConfigs for runtime-tunable categories */

import { type Database } from '@heyclaude/database-types';
import { trackRPCFailure } from '@heyclaude/web-runtime/core';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import {
  generatePageMetadata,
  getHomepageCategoryIds,
  getHomepageData,
} from '@heyclaude/web-runtime/server';
import { type SearchFilterOptions } from '@heyclaude/web-runtime/types/component.types';
import { HomePageLoading } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TopContributors } from '@/src/components/features/community/top-contributors';
import { HomepageContentServer } from '@/src/components/features/home/homepage-content-server';
import { HomepageHeroServer } from '@/src/components/features/home/homepage-hero-server';
import { HomepageSearchFacetsServer } from '@/src/components/features/home/homepage-search-facets-server';
import { RecentlyViewedRail } from '@/src/components/features/home/recently-viewed-rail';

export async function generateMetadata(): Promise<Metadata> {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();
  return generatePageMetadata('/');
}

interface HomePageProperties {
  searchParams: Promise<{
    q?: string;
  }>;
}

/**
 * Server component that renders the homepage top contributors.
 *
 * Fetches homepage data for the homepage categories, filters out entries missing
 * required identity fields, and normalizes each contributor by ensuring `id`,
 * `slug`, and `name` are present, defaulting `tier` to `"free"` when absent,
 * and adding a `created_at` ISO timestamp. If fetching homepage data fails,
 * the failure is tracked with scope `top-contributors` and the component
 * renders with an empty contributor list.
 *
 * This component runs during server rendering and does not declare its own ISR.
 *
 * @returns A React element rendering TopContributors populated with the processed contributors.
 *
 * @see getHomepageData
 * @see getHomepageCategoryIds
 * @see trackRPCFailure
 * @see TopContributors
 */
async function TopContributorsServer() {
  const categoryIds = getHomepageCategoryIds;
  const homepageResult = await getHomepageData(categoryIds).catch((error: unknown) => {
    trackRPCFailure('get_homepage_optimized', error, {
      section: 'top-contributors',
      categoryIds: categoryIds.length,
    });
    return null;
  });

  interface TopContributor {
    bio: null | string;
    created_at?: null | string;
    id: string;
    image: null | string;
    name: string;
    slug: string;
    tier: Database['public']['Enums']['user_tier'] | null;
    work: null | string;
  }

  const topContributors = (homepageResult?.top_contributors ?? [])
    .filter((c): c is TopContributor => {
      return 'id' in c && 'slug' in c && 'name' in c && Boolean(c.id && c.slug && c.name);
    })
    .map((contributor) => ({
      id: contributor.id,
      slug: contributor.slug,
      name: contributor.name,
      image: contributor.image,
      bio: contributor.bio,
      work: contributor.work,
      tier: contributor.tier ?? 'free',
      // Use actual created_at from database if available, otherwise use current timestamp as fallback
      created_at: contributor.created_at ?? new Date().toISOString(),
    }));

  return <TopContributors contributors={topContributors} />;
}

/**
 * Server component that renders the homepage using streaming Suspense boundaries to reduce time-to-first-byte.
 *
 * Renders the page as a set of streaming sections so the hero can appear immediately while other data loads:
 * - Hero: renders immediately and receives a best-effort member count fetched from `getHomepageData` (falls back to 0 on failure).
 * - Search facets: fetched in parallel and streamed independently.
 * - Homepage content: rendered within a Suspense boundary and streamed when its data is ready.
 * - Top contributors and newsletter CTA: lazy-loaded below the fold.
 *
 * @param searchParams - A promise resolving to the page's query parameters (awaited so search params are available before render).
 * @returns The homepage React element composed of streaming Suspense boundaries and lazy sections.
 *
 * @see HomepageHeroServer
 * @see HomepageContentServerWrapper
 * @see TopContributorsServer
 * @see getHomepageData
 * @see trackRPCFailure
 * @see revalidate
 */
export default async function HomePage({ searchParams }: HomePageProperties) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  // MUST be called before accessing searchParams (uncached data)
  await connection();

  // Access searchParams after connection() to establish dynamic context
  await searchParams;

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger
  const reqLogger = logger.child({
    requestId,
    operation: 'HomePage',
    route: '/',
    module: 'apps/web/src/app',
  });

  reqLogger.info('HomePage: rendering homepage');

  // Fetch search facets in parallel (non-blocking, streams separately)
  const searchFiltersPromise = HomepageSearchFacetsServer();

  return (
    <div className="bg-background min-h-screen">
      <div className="relative overflow-hidden">
        {/* Hero section - streams immediately with Suspense boundary for member count */}
        <Suspense fallback={<HomepageHeroServer memberCount={0} />}>
          <HomepageHeroWithMemberCount />
        </Suspense>

        <LazySection>
          <RecentlyViewedRail />
        </LazySection>

        {/* Homepage content - streams when ready (non-blocking) */}
        <div className="relative">
          <Suspense fallback={<HomePageLoading />}>
            <HomepageContentServerWrapper searchFiltersPromise={searchFiltersPromise} />
          </Suspense>
        </div>

        {/* Top contributors - lazy loaded below fold */}
        <LazySection rootMargin="0px 0px -500px 0px">
          <Suspense fallback={null}>
            <TopContributorsServer />
          </Suspense>
        </LazySection>
      </div>
    </div>
  );
}

/**
 * Server component that fetches member count and renders the homepage hero.
 *
 * This component is wrapped in a Suspense boundary to allow the hero to stream
 * immediately with a fallback value, then update when the actual member count loads.
 *
 * @returns The HomepageHeroServer component with the fetched member count
 *
 * @see HomepageHeroServer
 * @see getHomepageData
 * @see trackRPCFailure
 */
async function HomepageHeroWithMemberCount() {
  const categoryIds = getHomepageCategoryIds;
  const homepageResult = await getHomepageData(categoryIds).catch((error: unknown) => {
    trackRPCFailure('get_homepage_optimized', error, {
      section: 'hero',
      categoryIds: categoryIds.length,
      purpose: 'member-count',
    });
    return null;
  });

  const memberCount = homepageResult?.member_count ?? 0;
  return <HomepageHeroServer memberCount={memberCount} />;
}

/**
 * Resolves provided search filter options and renders HomepageContentServer with those filters.
 *
 * This server-side wrapper ensures the `searchFiltersPromise` is fulfilled before rendering the content
 * server, preventing the child component from rendering without the required search filters.
 *
 * @param props.searchFiltersPromise - A promise that resolves to the search filter options to pass to HomepageContentServer.
 *
 * @see HomepageContentServer
 * @see SearchFilterOptions
 */
async function HomepageContentServerWrapper({
  searchFiltersPromise,
}: {
  searchFiltersPromise: Promise<SearchFilterOptions>;
}) {
  const searchFilters = await searchFiltersPromise;
  return <HomepageContentServer searchFilters={searchFilters} />;
}
