/**
 * Homepage - Streaming SSR with React Cache Deduplication
 * 
 * CACHING ARCHITECTURE:
 * - React's cache() deduplicates getHomepageData calls within the same request
 * - unstable_cache provides cross-request caching in fetchCached
 * - Multiple component calls to getHomepageData are efficient due to deduplication
 * - ISR revalidation at 1 hour matches CACHE_TTL.homepage
 */

import { type Database } from '@heyclaude/database-types';
import { trackRPCFailure } from '@heyclaude/web-runtime/core';
import {
  bgColor,
  minHeight,
  overflow,
  position,
} from '@heyclaude/web-runtime/design-system';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
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
import { NewsletterCTAVariant } from '@/src/components/features/growth/newsletter/newsletter-cta-variants';
import { HomepageContentServer } from '@/src/components/features/home/homepage-content-server';
import { HomepageHeroServer } from '@/src/components/features/home/homepage-hero-server';
import { HomepageSearchFacetsServer } from '@/src/components/features/home/homepage-search-facets-server';
import { RecentlyViewedRail } from '@/src/components/features/home/recently-viewed-rail';

/**
 * Rendering & Caching
 * 
 * ISR: 1 hour (3600s) - Matches CACHE_TTL.homepage
 * Homepage data (featured content, member count, stats) is cached for 1 hour.
 * 
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
 */
export const revalidate = 3600;

/**
 * Generate the Metadata for the homepage (root route).
 *
 * Used by Next.js to provide page metadata for '/'.
 *
 * @returns The `Metadata` object representing the homepage.
 * @see generatePageMetadata
 */
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/');
}

/**
 * Render the TopContributors section using cached homepage data.
 *
 * Fetch homepage data, extract entries from `top_contributors` that include `id`, `slug`, and `name`, normalize each contributor (default `tier` to `'free'` and add a `created_at` timestamp), and return a TopContributors React element. If fetching homepage data fails, report the failure via `trackRPCFailure` and render with an empty contributor list.
 *
 * @returns A JSX element rendering `TopContributors` populated with the normalized contributor objects.
 *
 * @see getHomepageData
 * @see getHomepageCategoryIds
 * @see TopContributors
 * @see trackRPCFailure
 */
async function TopContributorsServer() {
  const categoryIds = getHomepageCategoryIds;
  // React's cache() ensures this is deduplicated with the main page's call
  const homepageResult = await getHomepageData(categoryIds).catch((error: unknown) => {
    trackRPCFailure('get_homepage_optimized', error, {
      section: 'top-contributors',
      categoryIds: categoryIds.length,
    });
    return null;
  });

  interface TopContributor {
    bio: null | string;
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
      created_at: new Date().toISOString(),
    }));

  return <TopContributors contributors={topContributors} />;
}

/**
 * Render the server-side homepage with a fast-rendering hero and progressively streamed content and lazy-loaded sections.
 *
 * The hero is rendered immediately using cached homepage data to provide `memberCount` and a "new this week" indicator; fetch errors degrade to safe defaults. Main content and additional sections (recently viewed, top contributors, newsletter) are streamed progressively using Suspense and LazySection while search facets are fetched in parallel.
 *
 * @returns The server-rendered React element tree for the homepage.
 *
 * @see getHomepageData
 * @see HomepageHeroServer
 * @see HomepageContentServerWrapper
 * @see TopContributorsServer
 * @see HomepageSearchFacetsServer
 */
export default async function HomePage() {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'HomePage',
    route: '/',
    module: 'apps/web/src/app',
  });

  reqLogger.info('HomePage: rendering homepage');

  // Fetch homepage data - React's cache() ensures subsequent calls are deduplicated
  const categoryIds = getHomepageCategoryIds;
  const homepageResult = await getHomepageData(categoryIds).catch((error: unknown) => {
    trackRPCFailure('get_homepage_optimized', error, {
      section: 'hero',
      categoryIds: categoryIds.length,
    });
    return null;
  });

  const memberCount = homepageResult?.member_count ?? 0;

  // Count items added in last 7 days for "new this week" indicator
  const newThisWeekCount = (() => {
    // Early return if no homepage data
    if (!homepageResult) return 0;
    
    const content = homepageResult.content as undefined | { categoryData?: Record<string, Array<{ date_added?: string }>> };
    if (!content?.categoryData) return 0;

    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let count = 0;

    for (const items of Object.values(content.categoryData)) {
      if (Array.isArray(items)) {
        count += items.filter((item) => {
          const dateAdded = item.date_added;
          if (!dateAdded) return false;
          return new Date(dateAdded).getTime() > cutoff;
        }).length;
      }
    }
    return count;
  })();

  // Start search facets fetch (streams in parallel)
  const searchFiltersPromise = HomepageSearchFacetsServer();

  return (
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      <div className={`${position.relative} ${overflow.hidden}`}>
        {/* Hero - renders with member count from initial fetch */}
        <HomepageHeroServer memberCount={memberCount} newThisWeekCount={newThisWeekCount} />

        <LazySection>
          <RecentlyViewedRail />
        </LazySection>

        {/* Content - uses React-cached getHomepageData (cache hit) */}
        <div className={position.relative}>
          <Suspense fallback={<HomePageLoading />}>
            <HomepageContentServerWrapper searchFiltersPromise={searchFiltersPromise} />
          </Suspense>
        </div>

        {/* Top contributors - lazy loaded, uses React-cached getHomepageData (cache hit) */}
        <LazySection rootMargin="0px 0px -500px 0px">
          <Suspense fallback={null}>
            <TopContributorsServer />
          </Suspense>
        </LazySection>

        <LazySection rootMargin="0px 0px -500px 0px">
          <NewsletterCTAVariant variant="hero" source="homepage" />
        </LazySection>
      </div>
    </div>
  );
}

/**
 * Await a SearchFilterOptions promise and render HomepageContentServer with the resolved filters.
 *
 * Blocks server rendering until `searchFiltersPromise` resolves, then supplies the resulting
 * SearchFilterOptions to the child server component.
 *
 * @param searchFiltersPromise - A promise that resolves to SearchFilterOptions used to populate search filters.
 * @returns A React element rendering HomepageContentServer with the resolved search filters.
 *
 * @see HomepageContentServer
 * @see HomepageSearchFacetsServer
 */
async function HomepageContentServerWrapper({
  searchFiltersPromise,
}: {
  searchFiltersPromise: Promise<SearchFilterOptions>;
}) {
  const searchFilters = await searchFiltersPromise;
  return <HomepageContentServer searchFilters={searchFilters} />;
}