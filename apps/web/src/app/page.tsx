/** Homepage consuming homepageConfigs for runtime-tunable categories */

import type { Database } from '@heyclaude/database-types';
import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';
import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TopContributors } from '@/src/components/features/community/top-contributors';
import { HomePageClient } from '@/src/components/features/home/home-sections';
import { AnimatedGradientText } from '@/src/components/primitives/animation/gradient-text';
import { ParticlesBackground } from '@/src/components/primitives/animation/particles-background';
import { HomePageLoading } from '@/src/components/primitives/feedback/loading-factory';

const RollingText = dynamicImport(
  () => import('@/src/components/primitives/animation/rolling-text').then((mod) => mod.RollingText),
  {
    loading: () => <span className="text-accent">enthusiasts</span>,
  }
);

const NumberTicker = dynamicImport(
  () =>
    import('@/src/components/primitives/animation/number-ticker').then((mod) => mod.NumberTicker),
  {
    loading: () => <span className="font-semibold text-accent">0</span>,
  }
);

const NewsletterCTAVariant = dynamicImport(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((mod) => ({
      default: mod.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { logger, normalizeError } from '@heyclaude/web-runtime/core';
import type { SearchFacetAggregate } from '@heyclaude/web-runtime/server';
import {
  generatePageMetadata,
  getHomepageCategoryIds,
  getHomepageData,
  getSearchFacets,
} from '@heyclaude/web-runtime/server';
import type { SearchFilterOptions } from '@heyclaude/web-runtime/types/component.types';
import type { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/');
}

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

async function HomeContentSection({
  homepageContentData,
  featuredJobs,
  categoryIds,
  searchFilters,
}: {
  homepageContentData: {
    categoryData: Record<string, unknown[]>;
    stats: Record<string, { total: number; featured: number }>;
    weekStart: string;
  };
  featuredJobs: Array<unknown>;
  categoryIds: readonly string[];
  searchFilters: SearchFilterOptions;
}) {
  try {
    return (
      <HomePageClient
        initialData={homepageContentData.categoryData}
        featuredByCategory={homepageContentData.categoryData}
        stats={homepageContentData.stats}
        featuredJobs={featuredJobs}
        searchFilters={searchFilters}
        weekStart={homepageContentData.weekStart}
      />
    );
  } catch (error) {
    logger.error(
      'Homepage content section error',
      error instanceof Error ? error : new Error(String(error))
    );
    const emptyData: Record<string, unknown[]> = {};

    return (
      <HomePageClient
        initialData={emptyData}
        featuredByCategory={{}}
        stats={
          Object.fromEntries(
            categoryIds.map((id: string) => [id, { total: 0, featured: 0 }])
          ) as Record<string, { total: number; featured: number }>
        }
        featuredJobs={[]}
        searchFilters={searchFilters}
        weekStart={homepageContentData.weekStart}
      />
    );
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  await searchParams;

  // Use static default for static generation
  const categoryIds = getHomepageCategoryIds;

  // Extract member_count and top_contributors from consolidated response
  // Type-safe RPC return using centralized type definition
  const emptyFacets: SearchFacetAggregate = {
    facets: [],
    tags: [],
    authors: [],
    categories: [],
  };

  const facetData = await getSearchFacets().catch((error: unknown) => {
    const normalized = normalizeError(error, 'Homepage search facets fetch failed');
    logger.error('HomePage: getSearchFacets invocation failed', normalized);
    return emptyFacets;
  });

  const [homepageResult] = await Promise.all([getHomepageData(categoryIds)]);

  const searchFilters: SearchFilterOptions = {
    tags: facetData.tags,
    authors: facetData.authors,
    categories: facetData.categories,
  };

  const memberCount = homepageResult?.member_count ?? 0;
  // Cast featured_jobs from Json to array (it's jsonb from get_featured_jobs RPC)
  const featuredJobs = (homepageResult?.featured_jobs as Array<unknown> | null) ?? [];
  // Map top_contributors to UserProfile format (add created_at and ensure non-null required fields)
  interface TopContributor {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    bio: string | null;
    work: string | null;
    tier: Database['public']['Enums']['user_tier'] | null;
  }

  const topContributors = (homepageResult?.top_contributors ?? [])
    .filter((c): c is TopContributor =>
      Boolean(
        c &&
          typeof c === 'object' &&
          'id' in c &&
          'slug' in c &&
          'name' in c &&
          c.id &&
          c.slug &&
          c.name
      )
    ) // Filter out invalid entries
    .map((contributor) => ({
      id: contributor.id,
      slug: contributor.slug,
      name: contributor.name,
      image: contributor.image,
      bio: contributor.bio,
      work: contributor.work,
      tier: (contributor.tier ?? 'free') as Database['public']['Enums']['user_tier'],
      created_at: new Date().toISOString(), // Default since not in RPC return
    }));

  return (
    <div className={'min-h-screen bg-background'}>
      <div className="relative overflow-hidden">
        <section className={'relative border-border/50 border-b'} aria-label="Homepage hero">
          {/* Particles Background */}
          <ParticlesBackground />

          <div className={'container relative z-10 mx-auto px-4 py-10 sm:py-16 lg:py-24'}>
            <div className={'mx-auto max-w-4xl text-center'}>
              <h1 className="mb-4 font-bold text-4xl tracking-tight sm:mb-6 sm:text-5xl lg:text-7xl">
                <AnimatedGradientText className="mr-2">The Ultimate Directory</AnimatedGradientText>{' '}
                for Claude{' '}
                <RollingText
                  words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
                  duration={3000}
                  className="text-accent"
                />
              </h1>

              <p className="mx-auto max-w-3xl text-muted-foreground text-sm leading-relaxed sm:text-base lg:text-lg">
                Join{' '}
                <NumberTicker
                  value={memberCount}
                  className="font-semibold text-accent"
                  suffix="+"
                />{' '}
                members discovering and sharing the best Claude configurations. Explore expert
                rules, powerful MCP servers, specialized agents, automation hooks, and connect with
                the community building the future of AI.
              </p>
            </div>
          </div>
        </section>

        <div className={'relative'}>
          <Suspense fallback={<HomePageLoading />}>
            <HomeContentSection
              homepageContentData={
                (homepageResult?.content as {
                  categoryData: Record<string, unknown[]>;
                  stats: Record<string, { total: number; featured: number }>;
                  weekStart: string;
                } | null) ?? {
                  categoryData: {},
                  stats: {},
                  weekStart: '',
                }
              }
              featuredJobs={featuredJobs}
              categoryIds={categoryIds}
              searchFilters={searchFilters}
            />
          </Suspense>
        </div>

        <LazySection>
          <TopContributors contributors={topContributors} />
        </LazySection>

        <LazySection>
          <NewsletterCTAVariant variant="hero" source="homepage" />
        </LazySection>
      </div>
    </div>
  );
}
