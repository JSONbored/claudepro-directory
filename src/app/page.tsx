/**
 * Homepage - Database-First Configuration Directory
 * All content from Supabase with ISR caching, dynamic category loading from UNIFIED_CATEGORY_REGISTRY.
 */

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

import { getAllChangelogEntries } from '@/src/lib/changelog/loader';
import { type CategoryId, getHomepageCategoryIds } from '@/src/lib/config/category-config';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { getContentByCategory } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import { batchFetch, batchMap } from '@/src/lib/utils/batch.utils';
import { getCurrentWeekStartISO } from '@/src/lib/utils/data.utils';

export const dynamic = 'force-dynamic';

type CategoryMetadata = ContentItem & { category: CategoryId };
type EnrichedMetadata = CategoryMetadata & { viewCount: number; copyCount: number };

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

async function HomeContentSection({ searchQuery }: { searchQuery: string }) {
  const categoryIds = getHomepageCategoryIds();

  // Initialize category data storage
  const categoryData: Record<CategoryId, ContentItem[]> = {} as Record<CategoryId, ContentItem[]>;
  const featuredByCategory: Record<string, ContentItem[]> = {};

  try {
    const loaders = categoryIds.map((id) => getContentByCategory(id));
    const results = await batchFetch(loaders);

    categoryIds.forEach((id, index) => {
      categoryData[id] = (results[index] as ContentItem[]) || [];
    });

    const supabase = createAnonClient();
    const weekStart = getCurrentWeekStartISO();

    const { data: featuredRecords, error: featuredError } = await supabase
      .from('featured_configs')
      .select('content_type, content_slug, rank, final_score')
      .eq('week_start', weekStart)
      .order('rank', { ascending: true });

    if (!featuredError && featuredRecords && featuredRecords.length > 0) {
      const contentByCategory = await batchMap(categoryIds, async (category) => ({
        category,
        items: categoryData[category] || [],
      }));

      const contentMap = new Map<string, ContentItem>();
      for (const { category, items } of contentByCategory) {
        for (const item of items) {
          contentMap.set(`${category}:${item.slug}`, item);
        }
      }

      const tempFeaturedByCategory: Record<string, ContentItem[]> = {};

      for (const record of featuredRecords) {
        const key = `${record.content_type}:${record.content_slug}`;
        const item = contentMap.get(key);

        if (item) {
          if (!tempFeaturedByCategory[record.content_type]) {
            tempFeaturedByCategory[record.content_type] = [];
          }

          const enrichedItem: ContentItem = {
            ...item,
            _featured: {
              rank: record.rank,
              score: record.final_score,
            },
          } as unknown as ContentItem;

          tempFeaturedByCategory[record.content_type]?.push(enrichedItem);
        }
      }

      for (const [category, items] of Object.entries(tempFeaturedByCategory)) {
        featuredByCategory[category] = items
          .sort((a, b) => {
            const aRank =
              (a as ContentItem & { _featured?: { rank: number } })._featured?.rank ?? 999;
            const bRank =
              (b as ContentItem & { _featured?: { rank: number } })._featured?.rank ?? 999;
            return aRank - bRank;
          })
          .slice(0, 6);
      }
    }
  } catch (error) {
    logger.error(
      'Failed to load homepage content',
      error instanceof Error ? error : new Error(String(error)),
      {
        source: 'HomePage',
        operation: 'loadContentMetadata',
      }
    );

    categoryIds.forEach((id) => {
      categoryData[id] = [];
    });
  }

  const supabase = createAnonClient();
  const { data: analyticsData } = await supabase
    .from('mv_analytics_summary')
    .select('category, slug, view_count, copy_count');

  const analyticsMap = new Map<string, { viewCount: number; copyCount: number }>();
  if (analyticsData) {
    for (const row of analyticsData) {
      analyticsMap.set(`${row.category}:${row.slug}`, {
        viewCount: row.view_count ?? 0,
        copyCount: row.copy_count ?? 0,
      });
    }
  }

  const enrichedCategoryData: Record<CategoryId, EnrichedMetadata[]> = {} as Record<
    CategoryId,
    EnrichedMetadata[]
  >;
  for (const id of categoryIds) {
    enrichedCategoryData[id] = categoryData[id].map((item) => {
      const analytics = analyticsMap.get(`${id}:${item.slug}`) ?? { viewCount: 0, copyCount: 0 };
      return {
        ...item,
        category: id,
        viewCount: analytics.viewCount,
        copyCount: analytics.copyCount,
      };
    });
  }

  const enrichedFeaturedByCategory: Record<string, ContentItem[]> = {};
  for (const [category, items] of Object.entries(featuredByCategory)) {
    enrichedFeaturedByCategory[category] = items.map((item) => {
      const analytics = analyticsMap.get(`${item.category}:${item.slug}`) ?? {
        viewCount: 0,
        copyCount: 0,
      };
      return { ...item, viewCount: analytics.viewCount, copyCount: analytics.copyCount };
    });
  }

  const allConfigsWithDuplicates = categoryIds.flatMap((id) => enrichedCategoryData[id] || []);
  const allConfigsMap = new Map(allConfigsWithDuplicates.map((item) => [item.slug, item]));
  const allConfigs = Array.from(allConfigsMap.values()) as ContentItem[];

  const initialData: Record<string, ContentItem[]> = {
    ...enrichedCategoryData,
    allConfigs,
  };

  let guidesCount = 0;
  let changelogCount = 0;

  try {
    const [guidesData, changelogData] = await batchFetch([
      getContentByCategory('guides'),
      getAllChangelogEntries(),
    ]);
    guidesCount = guidesData.length;
    changelogCount = changelogData.length;
  } catch (error) {
    logger.error(
      'Failed to load guides/changelog counts',
      error instanceof Error ? error : new Error(String(error)),
      {
        source: 'HomePage',
        operation: 'loadGuidesChangelogCounts',
      }
    );
  }

  return (
    <HomePageClient
      initialData={initialData}
      initialSearchQuery={searchQuery}
      featuredByCategory={enrichedFeaturedByCategory}
      stats={{
        ...Object.fromEntries(categoryIds.map((id) => [id, enrichedCategoryData[id]?.length || 0])),
        guides: guidesCount,
        changelog: changelogCount,
      }}
    />
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = await searchParams;
  const initialSearchQuery = resolvedParams.q || '';

  const supabase = await import('@/src/lib/supabase/server').then((mod) => mod.createClient());
  const [memberCountResult, topContributorsResult] = await Promise.all([
    (await supabase).from('users').select('*', { count: 'exact', head: true }).eq('public', true),
    (await supabase)
      .from('users')
      .select('*')
      .eq('public', true)
      .order('reputation_score', { ascending: false })
      .limit(6),
  ]);

  const memberCount = memberCountResult.count;
  const topContributors = topContributorsResult.data || [];

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
