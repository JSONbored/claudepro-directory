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
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((mod) => ({
      default: mod.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { getHomepageFeaturedCategories } from '@/src/lib/data/config/category';
import { getHomepageData } from '@/src/lib/data/content/homepage';
import { logger } from '@/src/lib/logger';
import type { GetGetHomepageCompleteReturn } from '@/src/types/database-overrides';

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
  homepageContentData: GetGetHomepageCompleteReturn['content'];
  featuredJobs: GetGetHomepageCompleteReturn['featured_jobs'];
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
    const emptyData: GetGetHomepageCompleteReturn['content']['categoryData'] =
      {} as GetGetHomepageCompleteReturn['content']['categoryData'];

    return (
      <HomePageClient
        initialData={emptyData}
        featuredByCategory={{} as GetGetHomepageCompleteReturn['content']['categoryData']}
        stats={
          Object.fromEntries(
            categoryIds.map((id: string) => [id, { total: 0, featured: 0 }])
          ) as GetGetHomepageCompleteReturn['content']['stats']
        }
        featuredJobs={[]}
      />
    );
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  await searchParams;

  const categoryIds = await getHomepageFeaturedCategories();

  // Extract member_count and top_contributors from consolidated response
  // Type-safe RPC return using centralized type definition
  const homepageResult = await getHomepageData(categoryIds);

  const memberCount = homepageResult?.member_count ?? 0;
  const featuredJobs = homepageResult?.featured_jobs ?? [];
  const topContributors = homepageResult?.top_contributors ?? [];

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
                homepageResult?.content ??
                ({
                  categoryData: {} as GetGetHomepageCompleteReturn['content']['categoryData'],
                  stats: {} as GetGetHomepageCompleteReturn['content']['stats'],
                  weekStart: '',
                } as GetGetHomepageCompleteReturn['content'])
              }
              featuredJobs={featuredJobs}
              categoryIds={categoryIds}
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
