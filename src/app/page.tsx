/** Homepage consuming homepageConfigs for runtime-tunable categories */

import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';
import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TopContributors } from '@/src/components/features/community/top-contributors';
import { HomePageClient } from '@/src/components/features/home/home-sections';
import { HomePageLoading } from '@/src/components/primitives/feedback/loading-factory';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

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
    import('@/src/components/features/growth/newsletter').then((mod) => mod.NewsletterCTAVariant),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { getHomepageFeaturedCategories } from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { GetHomepageCompleteReturn } from '@/src/types/database-overrides';

export const metadata = generatePageMetadata('/');

export const revalidate = false;

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

async function HomeContentSection({
  homepageContentData,
  featuredJobs,
  categoryIds,
}: {
  homepageContentData: GetHomepageCompleteReturn['content'];
  featuredJobs: GetHomepageCompleteReturn['featured_jobs'];
  categoryIds: readonly string[];
}) {
  try {
    return (
      <HomePageClient
        initialData={homepageContentData.categoryData}
        featuredByCategory={homepageContentData.categoryData}
        stats={homepageContentData.stats}
        featuredJobs={featuredJobs}
      />
    );
  } catch (error) {
    logger.error(
      'Homepage content section error',
      error instanceof Error ? error : new Error(String(error))
    );
    const emptyData: GetHomepageCompleteReturn['content']['categoryData'] = {};

    return (
      <HomePageClient
        initialData={emptyData}
        featuredByCategory={{}}
        stats={Object.fromEntries(categoryIds.map((id: string) => [id, 0]))}
        featuredJobs={[]}
      />
    );
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  await searchParams;

  const categoryIds = await getHomepageFeaturedCategories();

  const supabase = createAnonClient();
  const { data: homepageData, error: homepageError } = await supabase.rpc('get_homepage_complete', {
    p_category_ids: [...categoryIds],
  });

  if (homepageError) {
    logger.error('Homepage RPC error', homepageError, {
      rpcFunction: 'get_homepage_complete',
      phase: 'homepage-render',
    });
  }

  // Extract member_count and top_contributors from consolidated response
  // Type-safe RPC return using centralized type definition
  const homepageResult = homepageData as GetHomepageCompleteReturn | null;

  const memberCount = homepageError || !homepageResult ? 0 : homepageResult.member_count || 0;
  const featuredJobs = homepageError || !homepageResult ? [] : homepageResult.featured_jobs || [];
  const topContributors =
    homepageError || !homepageResult ? [] : homepageResult.top_contributors || [];

  return (
    <div className={'min-h-screen bg-background'}>
      <div className="relative overflow-hidden">
        <section className={'relative border-border/50 border-b'} aria-label="Homepage hero">
          <div className={'container relative mx-auto px-4 py-10 sm:py-16 lg:py-24'}>
            <div className={'mx-auto max-w-4xl text-center'}>
              <h1 className="mb-4 font-bold text-4xl text-foreground tracking-tight sm:mb-6 sm:text-5xl lg:text-7xl">
                The home for Claude{' '}
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
                homepageResult?.content || {
                  categoryData: {},
                  stats: {},
                  weekStart: '',
                }
              }
              featuredJobs={featuredJobs}
              categoryIds={categoryIds}
            />
          </Suspense>
        </div>
      </div>

      {Array.isArray(topContributors) && topContributors.length > 0 && (
        <TopContributors contributors={topContributors as never[]} />
      )}

      <section className={'container mx-auto px-4 py-12'}>
        <Suspense fallback={null}>
          <LazySection variant="fade-in" delay={0.15}>
            <NewsletterCTAVariant variant="hero" source="homepage" />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}
