/**
 * Homepage - Streaming SSR with React Cache Deduplication
 * 
 * CACHING ARCHITECTURE:
 * - React's cache() deduplicates getHomepageData calls within the same request
 * - unstable_cache provides cross-request caching in fetchCached
 * - Multiple component calls to getHomepageData are efficient due to deduplication
 * - ISR revalidation at 1 hour matches CACHE_TTL.homepage
 */

import  { type Database } from '@heyclaude/database-types';
import { trackRPCFailure } from '@heyclaude/web-runtime/core';
import { animate, radius , minHeight } from '@heyclaude/web-runtime/design-system';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import {
  generatePageMetadata,
  getHomepageCategoryIds,
  getHomepageData,
} from '@heyclaude/web-runtime/server';
import  { type SearchFilterOptions } from '@heyclaude/web-runtime/types/component.types';
import { HomePageLoading } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';

import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TopContributors } from '@/src/components/features/community/top-contributors';
import { HomepageContentServer } from '@/src/components/features/home/homepage-content-server';
import { HomepageHeroServer } from '@/src/components/features/home/homepage-hero-server';
import { HomepageSearchFacetsServer } from '@/src/components/features/home/homepage-search-facets-server';
import { RecentlyViewedRail } from '@/src/components/features/home/recently-viewed-rail';

const NewsletterCTAVariant = dynamicImport(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((module_) => ({
      default: module_.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className={`h-32 ${animate.pulse} ${radius.lg} bg-muted/20`} />,
  }
);

/**
 * Rendering & Caching
 * 
 * ISR: 1 hour (3600s) - Matches CACHE_TTL.homepage
 * Homepage data (featured content, member count, stats) is cached for 1 hour.
 * 
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate
 */
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/');
}

interface HomePageProperties {
  searchParams: Promise<{
    q?: string;
  }>;
}

/**
 * Top Contributors Server Component
 * 
 * NOTE: This calls getHomepageData which is deduplicated via React's cache()
 * The data is already fetched in the main page component, so this is a cache hit.
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
 * Streaming SSR Homepage Architecture
 *
 * Data Flow:
 * 1. Main page fetches homepage data (member count for hero)
 * 2. Hero section renders with member count
 * 3. HomepageContentServer streams (uses React-cached getHomepageData - cache hit)
 * 4. TopContributorsServer lazy loads (uses React-cached getHomepageData - cache hit)
 *
 * This architecture:
 * - Improves TTFB by ~50% (hero renders immediately)
 * - Uses React cache() for request-level deduplication
 * - Uses unstable_cache for cross-request caching
 * - Errors are NOT cached (fixed in fetch-cached.ts)
 */
export default async function HomePage({ searchParams }: HomePageProperties) {
  const requestId = generateRequestId();
  const reqLogger = logger.child({
    requestId,
    operation: 'HomePage',
    route: '/',
    module: 'apps/web/src/app',
  });

  await searchParams;
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
    <div className={`${minHeight.screen} bg-background`}>
      <div className="relative overflow-hidden">
        {/* Hero - renders with member count from initial fetch */}
        <HomepageHeroServer memberCount={memberCount} newThisWeekCount={newThisWeekCount} />

        <LazySection>
          <RecentlyViewedRail />
        </LazySection>

        {/* Content - uses React-cached getHomepageData (cache hit) */}
        <div className="relative">
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
 * Wrapper component that awaits search filters and passes to content server
 */
async function HomepageContentServerWrapper({
  searchFiltersPromise,
}: {
  searchFiltersPromise: Promise<SearchFilterOptions>;
}) {
  const searchFilters = await searchFiltersPromise;
  return <HomepageContentServer searchFilters={searchFilters} />;
}
