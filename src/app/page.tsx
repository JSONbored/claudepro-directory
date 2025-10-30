/**
 * Homepage - Database-First Configuration Directory
 * All content from Supabase with ISR caching, dynamic category loading from UNIFIED_CATEGORY_REGISTRY.
 */

import { unstable_cache } from 'next/cache';
import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';
import { TopContributors } from '@/src/components/features/community/top-contributors';
import { HomePageClient } from '@/src/components/features/home';
import { LazySection } from '@/src/components/infra/lazy-section';
import { LoadingSkeleton } from '@/src/components/primitives/loading-skeleton';

const RollingText = dynamicImport(
  () => import('@/src/components/magic/rolling-text').then((mod) => ({ default: mod.RollingText })),
  {
    loading: () => <span className="text-accent">enthusiasts</span>,
  }
);

const NumberTicker = dynamicImport(
  () =>
    import('@/src/components/magic/number-ticker').then((mod) => ({ default: mod.NumberTicker })),
  {
    loading: () => <span className="font-semibold text-accent">0</span>,
  }
);

const UnifiedNewsletterCapture = dynamicImport(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
  }
);

import { type CategoryId, getHomepageCategoryIds } from '@/src/lib/config/category-config';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';

export const revalidate = 900; // 15 minutes ISR

type CategoryMetadata = ContentItem & { category: CategoryId };
type EnrichedMetadata = CategoryMetadata & { viewCount: number; copyCount: number };

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

async function HomeContentSection({ searchQuery }: { searchQuery: string }) {
  const categoryIds = getHomepageCategoryIds();

  try {
    const supabase = createAnonClient();

    // Single RPC call replaces 135 lines of TypeScript enrichment logic
    const { data, error } = await supabase.rpc('get_homepage_content_enriched', {
      p_category_ids: categoryIds,
    });

    if (error) {
      logger.error('Failed to load homepage content', error, {
        source: 'HomePage',
        operation: 'get_homepage_content_enriched',
      });
      throw error;
    }

    const enrichedData = data as {
      categoryData: Record<string, EnrichedMetadata[]>;
      stats: Record<string, number>;
      weekStart: string;
    };

    // Extract featured content (items with _featured flag)
    const featuredByCategory: Record<string, ContentItem[]> = {};
    for (const [category, items] of Object.entries(enrichedData.categoryData)) {
      if (category === 'allConfigs') continue; // Skip allConfigs for featured

      const featured = items
        .filter((item: any) => item._featured)
        .sort((a: any, b: any) => a._featured.rank - b._featured.rank)
        .slice(0, 6);

      if (featured.length > 0) {
        featuredByCategory[category] = featured as ContentItem[];
      }
    }

    const initialData: Record<string, ContentItem[]> = enrichedData.categoryData as Record<
      string,
      ContentItem[]
    >;

    return (
      <HomePageClient
        initialData={initialData}
        initialSearchQuery={searchQuery}
        featuredByCategory={featuredByCategory}
        stats={enrichedData.stats}
      />
    );
  } catch (error) {
    logger.error(
      'Homepage content error',
      error instanceof Error ? error : new Error(String(error)),
      {
        source: 'HomePage',
        operation: 'HomeContentSection',
      }
    );

    // Return empty state on error
    const emptyData: Record<string, ContentItem[]> = {};
    categoryIds.forEach((id) => {
      emptyData[id] = [];
    });
    emptyData.allConfigs = [];

    return (
      <HomePageClient
        initialData={emptyData}
        initialSearchQuery={searchQuery}
        featuredByCategory={{}}
        stats={Object.fromEntries(categoryIds.map((id) => [id, 0]))}
      />
    );
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const initialSearchQuery = resolvedParams.q || '';

  // Cache user stats queries (15min revalidation) - 70% faster
  // MUST use createAnonClient() - createClient() uses cookies() which is forbidden in unstable_cache()
  const getCachedUserStats = unstable_cache(
    async () => {
      const supabase = createAnonClient();
      const [memberCountResult, topContributorsResult] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('public', true),
        supabase
          .from('users')
          .select('*')
          .eq('public', true)
          .order('reputation_score', { ascending: false })
          .limit(6),
      ]);
      return {
        memberCount: memberCountResult.count,
        topContributors: topContributorsResult.data || [],
      };
    },
    ['homepage-user-stats'],
    {
      revalidate: 900, // 15 minutes
      tags: ['homepage-stats', 'users'],
    }
  );

  const { memberCount, topContributors } = await getCachedUserStats();

  return (
    <div className={'min-h-screen bg-background'}>
      <div className="relative overflow-hidden">
        <section className={'relative border-b border-border/50'} aria-label="Homepage hero">
          <div className={'relative container mx-auto px-4 py-10 sm:py-16 lg:py-24'}>
            <div className={'text-center max-w-4xl mx-auto'}>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 text-foreground tracking-tight">
                The home for Claude{' '}
                <RollingText
                  words={['enthusiasts', 'developers', 'power users', 'beginners', 'builders']}
                  duration={3000}
                  className="text-accent"
                />
              </h1>

              <p
                className={
                  'text-sm sm:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed'
                }
              >
                Join{' '}
                <NumberTicker
                  value={memberCount || 0}
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
            <HomeContentSection searchQuery={initialSearchQuery} />
          </Suspense>
        </div>
      </div>

      {topContributors.length > 0 && <TopContributors contributors={topContributors as never[]} />}

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
