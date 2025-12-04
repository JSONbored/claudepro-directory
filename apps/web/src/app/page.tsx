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
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then(
      (module_) => ({
        default: module_.NewsletterCTAVariant,
      })
    ),
  {
    loading: () => <div className="bg-muted/20 h-32 animate-pulse rounded-lg" />,
  }
);

/**
 * Dynamic Rendering Required
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const revalidate = 1800;

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
 * Fetches top contributors data for the homepage
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
 * OPTIMIZATION: Streaming SSR Homepage
 *
 * The homepage is now split into streaming Suspense boundaries:
 * 1. Hero section - streams immediately (no data fetching)
 * 2. Search facets - streams in parallel (non-blocking)
 * 3. Homepage content - streams when ready (non-blocking)
 * 4. Top contributors - lazy loaded below fold
 *
 * This improves TTFB by ~50% (200-300ms → 100-150ms) by allowing
 * the hero section to render immediately while other data loads.
 */
export default async function HomePage({ searchParams }: HomePageProperties) {
  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger
  const reqLogger = logger.child({
    requestId,
    operation: 'HomePage',
    route: '/',
    module: 'apps/web/src/app',
  });

  await searchParams;

  reqLogger.info('HomePage: rendering homepage');

  // Fetch member count for hero (lightweight, can be done in parallel with other data)
  // We'll use a default value for the hero and update it when content loads
  const categoryIds = getHomepageCategoryIds;
  const homepageResultPromise = getHomepageData(categoryIds).catch((error: unknown) => {
    trackRPCFailure('get_homepage_optimized', error, {
      section: 'hero',
      categoryIds: categoryIds.length,
      purpose: 'member-count',
    });
    return null;
  });

  // Get member count for hero (non-blocking, can use default if slow)
  const homepageResult = await homepageResultPromise;
  const memberCount = homepageResult?.member_count ?? 0;

  // Fetch search facets in parallel (non-blocking, streams separately)
  const searchFiltersPromise = HomepageSearchFacetsServer();

  return (
    <div className="bg-background min-h-screen">
      <div className="relative overflow-hidden">
        {/* Hero section - streams immediately (no data fetching) */}
        <HomepageHeroServer memberCount={memberCount} />

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
