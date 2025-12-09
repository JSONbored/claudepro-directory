/** Homepage consuming homepageConfigs for runtime-tunable categories */

import { type Database } from '@heyclaude/database-types';
import { trackRPCFailure } from '@heyclaude/web-runtime/core';
import {
  generatePageMetadata,
  getHomepageCategoryIds,
  getHomepageData,
} from '@heyclaude/web-runtime/server';
import { type SearchFilterOptions } from '@heyclaude/web-runtime/types/component.types';
import { HomePageLoading } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { Suspense } from 'react';

import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TopContributors } from '@/src/components/features/community/top-contributors';
import { HeroSearchConnectionProvider } from '@/src/components/features/home/hero-search-connection';
import { HomepageContentServer } from '@/src/components/features/home/homepage-content-server';
import { HomepageHeroServer } from '@/src/components/features/home/homepage-hero-server';
import { HomepageSearchFacetsServer } from '@/src/components/features/home/homepage-search-facets-server';
import { RecentlyViewedRail } from '@/src/components/features/home/recently-viewed-rail';

/**
 * Generate metadata for the root page, deferring execution until request time.
 *
 * Awaits the request-scoped connection to satisfy Cache Component requirements for non-deterministic operations, then produces page metadata for '/'.
 *
 * @returns Page metadata for the root path (`'/'`) as a `Metadata` object.
 *
 * @see generatePageMetadata
 * @see connection
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/');
}

interface HomePageProperties {
  searchParams: Promise<{
    q?: string;
  }>;
}

/**
 * Render the homepage TopContributors component with normalized contributor data.
 *
 * Fetches homepage data for the homepage categories; if the fetch fails the failure
 * is tracked (scope `get_homepage_optimized`, section `top-contributors`) and an
 * empty contributor list is used. Filters out entries missing `id`, `slug`, or
 * `name`, ensures each contributor has `id`, `slug`, `name`, `image`, `bio`, and
 * `work`, defaults `tier` to `"free"` when absent, and sets `created_at` to the
 * database-provided value or the current ISO timestamp as a fallback.
 *
 * This component runs during server rendering and does not declare ISR/revalidation.
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
    created_at?: Date | null | string;
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
    .map((contributor) => {
      // Convert created_at to string - UserProfile requires created_at: string
      let created_at: string;
      if (contributor.created_at) {
        if (typeof contributor.created_at === 'object' && 'toISOString' in contributor.created_at) {
          // Date object
          created_at = contributor.created_at.toISOString();
        } else if (typeof contributor.created_at === 'string') {
          created_at = contributor.created_at;
        } else {
          // Fallback to empty string if unexpected type
          created_at = '';
        }
      } else {
        // Fallback to empty string if missing
        created_at = '';
      }

      return {
        id: contributor.id,
        slug: contributor.slug,
        name: contributor.name,
        image: contributor.image,
        bio: contributor.bio,
        work: contributor.work,
        tier: contributor.tier ?? 'free',
        created_at, // Always present as string
      };
    });

  return <TopContributors contributors={topContributors} />;
}

/**
 * Render the homepage using streaming Suspense boundaries to enable progressive rendering.
 *
 * Awaits connection() to establish request-time dynamic context before resolving non-deterministic data and the provided `searchParams`. Streams the hero, search facets, and main content independently and lazy-loads below-the-fold sections (e.g., top contributors).
 *
 * @param searchParams - A promise that resolves to the page's query parameters (object with optional `q` string)
 * @param searchParams.searchParams
 * @returns The homepage React element composed of streaming Suspense boundaries and lazy-loaded sections
 *
 * @see HomepageHeroServer
 * @see HomepageContentServerWrapper
 * @see TopContributorsServer
 * @see getHomepageData
 * @see trackRPCFailure
 */
export default function HomePage({ searchParams: _searchParams }: HomePageProperties) {
  const searchFiltersPromise = HomepageSearchFacetsServer();

  return (
    <HeroSearchConnectionProvider>
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
    </HeroSearchConnectionProvider>
  );
}

/**
 * Fetches the homepage member count and renders the hero with that value.
 *
 * If fetching fails, records an RPC failure for the hero member-count purpose and falls back to 0.
 *
 * @returns A HomepageHeroServer element rendered with the resolved `memberCount`
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
  // Hero will get search ref from context via client wrapper
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
 * @param root0
 * @param root0.searchFiltersPromise
 * @see HomepageContentServer
 * @see SearchFilterOptions
 
 * @returns {Promise<unknown>} Description of return value*/
async function HomepageContentServerWrapper({
  searchFiltersPromise,
}: {
  searchFiltersPromise: Promise<SearchFilterOptions>;
}) {
  const searchFilters = await searchFiltersPromise;
  return <HomepageContentServer searchFilters={searchFilters} />;
}
