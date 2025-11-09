/**
 * Homepage - Database-First Configuration Directory
 * All content from Supabase with ISR caching, dynamic category loading from PostgreSQL.
 */

import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';
import { TopContributors } from '@/src/components/features/community/top-contributors';
import { HomePageClient } from '@/src/components/features/home';
import { LazySection } from '@/src/components/infra/lazy-section';
import { LoadingSkeleton } from '@/src/components/primitives/loading-skeleton';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { RESPONSIVE_PATTERNS } from '@/src/lib/ui-constants';

const RollingText = dynamicImport(
  () => import('@/src/components/magic/rolling-text').then((mod) => mod.RollingText),
  {
    loading: () => <span className="text-accent">enthusiasts</span>,
  }
);

const NumberTicker = dynamicImport(
  () => import('@/src/components/magic/number-ticker').then((mod) => mod.NumberTicker),
  {
    loading: () => <span className="font-semibold text-accent">0</span>,
  }
);

const UnifiedNewsletterCapture = dynamicImport(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then(
      (mod) => mod.UnifiedNewsletterCapture
    ),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { type CategoryId, getHomepageCategoryIds } from '@/src/lib/config/category-config';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import type { Tables } from '@/src/types/database.types';

export const metadata = generatePageMetadata('/');

export const revalidate = false; // Static + on-demand ISR via content trigger

type CategoryMetadata = ContentItem & { category: CategoryId };
type EnrichedMetadata = CategoryMetadata & { viewCount: number; copyCount: number };

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

async function HomeContentSection({
  homepageContentData,
}: {
  homepageContentData: {
    categoryData: Record<string, EnrichedMetadata[]>;
    stats: Record<string, number>;
    weekStart: string;
  };
}) {
  const categoryIds = getHomepageCategoryIds();

  try {
    const enrichedData = homepageContentData;

    const featuredByCategory = enrichedData.categoryData as Record<string, EnrichedMetadata[]>;
    const initialData = enrichedData.categoryData as Record<string, unknown[]>;

    return (
      <HomePageClient
        initialData={initialData as Record<string, ContentItem[]>}
        featuredByCategory={featuredByCategory as Record<string, ContentItem[]>}
        stats={enrichedData.stats}
      />
    );
  } catch (error) {
    logger.error(
      'Homepage content section error',
      error instanceof Error ? error : new Error(String(error))
    );
    const emptyData: Record<string, ContentItem[]> = {};
    for (const id of categoryIds) {
      emptyData[id] = [];
    }

    return (
      <HomePageClient
        initialData={emptyData}
        featuredByCategory={{}}
        stats={Object.fromEntries(categoryIds.map((id) => [id, 0]))}
      />
    );
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  await searchParams;

  // Consolidated homepage data: get_homepage_complete() returns everything (67% fewer DB calls)
  const supabase = createAnonClient();
  const { data: homepageData, error: homepageError } = await supabase.rpc('get_homepage_complete', {
    p_category_ids: getHomepageCategoryIds(),
  });

  if (homepageError) {
    logger.error('Homepage RPC error', homepageError, {
      rpcFunction: 'get_homepage_complete',
      phase: 'homepage-render',
    });
  }

  // Extract member_count and top_contributors from consolidated response
  type UserRow = Pick<Tables<'users'>, 'id' | 'slug' | 'name' | 'image' | 'bio' | 'work' | 'tier'>;

  const memberCount = homepageError
    ? 0
    : (homepageData as { member_count?: number })?.member_count || 0;
  const topContributors = homepageError
    ? []
    : (homepageData as { top_contributors?: UserRow[] })?.top_contributors || [];

  return (
    <div className={'min-h-screen bg-background'}>
      <div className="relative overflow-hidden">
        <section className={'relative border-border/50 border-b'} aria-label="Homepage hero">
          <div className={'container relative mx-auto px-4 py-10 sm:py-16 lg:py-24'}>
            <div className={'mx-auto max-w-4xl text-center'}>
              <h1
                className={`mb-4 font-bold text-foreground tracking-tight sm:mb-6 ${RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_2XL}`}
              >
                The home for Claude{' '}
                <RollingText
                  words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
                  duration={3000}
                  className="text-accent"
                />
              </h1>

              <p
                className={`mx-auto max-w-3xl text-muted-foreground leading-relaxed ${RESPONSIVE_PATTERNS.TEXT_RESPONSIVE_MD}`}
              >
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
          <Suspense fallback={<LoadingSkeleton />}>
            <HomeContentSection
              homepageContentData={
                (
                  homepageData as {
                    content: {
                      categoryData: Record<string, EnrichedMetadata[]>;
                      stats: Record<string, number>;
                      weekStart: string;
                    };
                  }
                )?.content || {
                  categoryData: {},
                  stats: {},
                  weekStart: '',
                }
              }
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
            <UnifiedNewsletterCapture variant="hero" source="homepage" context="homepage" />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}
