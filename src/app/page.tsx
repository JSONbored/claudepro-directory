/** Homepage consuming homepageConfigs for runtime-tunable categories */

import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';
import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TopContributors } from '@/src/components/features/community/top-contributors';
import { HomePageClient } from '@/src/components/features/home/home-sections';
import { AnimatedGradientText } from '@/src/components/primitives/animation/gradient-text';
import { ParticlesBackground } from '@/src/components/primitives/animation/particles-background';
import { HomePageLoading } from '@/src/components/primitives/feedback/loading-factory';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import type { Database } from '@/src/types/database.types';

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

import type { Metadata } from 'next';
import { getHomepageCategoryIds } from '@/src/lib/data/config/category';
import { getHomepageData } from '@/src/lib/data/content/homepage';
import { logger } from '@/src/lib/logger';

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/');
}

/**
 * ISR Configuration: Homepage revalidates every 60 seconds
 * This ensures dynamic data (featured content, jobs, stats) stays fresh
 * while still benefiting from edge caching for performance
 */
export const revalidate = 60;

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
  homepageContentData: {
    categoryData: Record<string, unknown[]>;
    stats: Record<string, { total: number; featured: number }>;
    weekStart: string;
  };
  featuredJobs: Array<unknown>;
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
      />
    );
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  await searchParams;

  // Dynamic configs are server/middleware only - use static defaults for static generation
  // getHomepageFeaturedCategories() accesses flags.ts which triggers Edge Config during build
  // Client components can fetch dynamic configs via server actions at runtime
  const categoryIds = getHomepageCategoryIds; // Use static default for static generation

  // Extract member_count and top_contributors from consolidated response
  // Type-safe RPC return using centralized type definition
  const homepageResult = await getHomepageData(categoryIds);

  const memberCount = homepageResult?.member_count ?? 0;
  // Cast featured_jobs from Json to array (it's jsonb from get_featured_jobs RPC)
  const featuredJobs = (homepageResult?.featured_jobs as Array<unknown> | null) ?? [];
  // Map top_contributors to UserProfile format (add created_at and ensure non-null required fields)
  const topContributors = (homepageResult?.top_contributors ?? [])
    .filter((c): c is typeof c & { id: string; slug: string; name: string } =>
      Boolean(c.id && c.slug && c.name)
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
