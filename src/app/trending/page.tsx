/**
 * Trending Page - Database-First RPC Architecture
 * Single RPC call to get_trending_page() - all logic in PostgreSQL
 */

import { unstable_cache } from 'next/cache';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import { LazySection } from '@/src/components/infra/lazy-section';
import { TrendingContent } from '@/src/components/shared/trending-content';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { Clock, Star, TrendingUp, Users } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { PagePropsWithSearchParams } from '@/src/lib/schemas/app.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Database } from '@/src/types/database.types';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

export const revalidate = 300; // 5 minutes ISR

export const metadata = generatePageMetadata('/trending');

type TrendingPeriod = Database['public']['Enums']['trending_period'];
type TrendingMetric = Database['public']['Enums']['trending_metric'];

export default async function TrendingPage({ searchParams }: PagePropsWithSearchParams) {
  const rawParams = await searchParams;
  const supabase = createAnonClient();

  const period = (rawParams?.period as TrendingPeriod) || 'week';
  const metric = (rawParams?.metric as TrendingMetric) || 'views';
  const category = rawParams?.category as string | undefined;
  const page = Number(rawParams?.page) || 1;
  const limit = Math.min(Number(rawParams?.limit) || 20, 100);

  logger.info('Trending page accessed', {
    period,
    metric,
    category: category || 'all',
    page,
    limit,
  });

  // Wrapped in unstable_cache for additional performance boost
  const { data, error } = await unstable_cache(
    async () => {
      return supabase.rpc('get_trending_page', {
        p_period: period,
        p_metric: metric,
        ...(category && { p_category: category }),
        p_page: page,
        p_limit: limit,
      });
    },
    [`trending-${period}-${metric}-${category || ''}-${page}-${limit}`],
    {
      revalidate: 300, // 5 minutes (matches page ISR)
      tags: ['trending', ...(category ? [`trending-${category}`] : [])],
    }
  )();

  if (error) {
    logger.error('Failed to load trending page data', error);
  }

  const pageData = (data || {
    trending: [],
    popular: [],
    recent: [],
    totalCount: 0,
    metadata: { period, metric, category: null, page, limit, algorithm: 'fallback' },
  }) as {
    trending: ContentItem[];
    popular: ContentItem[];
    recent: ContentItem[];
    totalCount: number;
    metadata: Record<string, unknown>;
  };

  const pageTitleId = 'trending-page-title';

  return (
    <div className={'min-h-screen bg-background'}>
      <section className={'relative overflow-hidden px-4 py-24'} aria-labelledby={pageTitleId}>
        <div className={'container mx-auto text-center'}>
          <div className={'mx-auto max-w-3xl'}>
            <UnifiedBadge
              variant="base"
              style="outline"
              className={'mb-6 border-accent/20 bg-accent/5 text-accent'}
            >
              <TrendingUp className="mr-1 h-3 w-3 text-accent" aria-hidden="true" />
              Trending
            </UnifiedBadge>

            <h1 id={pageTitleId} className="mb-6 font-bold text-4xl md:text-6xl">
              Trending Configurations
            </h1>

            <p className={UI_CLASSES.TEXT_HEADING_LARGE}>
              Discover the most popular and trending Claude configurations in our community. Stay up
              to date with what developers are using and loving.
            </p>

            <ul className={`${UI_CLASSES.FLEX_WRAP_GAP_2} list-none justify-center`}>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Clock className="mr-1 h-3 w-3" aria-hidden="true" />
                  Real-time updates
                </UnifiedBadge>
              </li>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Star className="mr-1 h-3 w-3" aria-hidden="true" />
                  Based on views
                </UnifiedBadge>
              </li>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Users className="mr-1 h-3 w-3" aria-hidden="true" />
                  {pageData.totalCount} total configs
                </UnifiedBadge>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        className={'container mx-auto px-4 py-16'}
        aria-label="Trending configurations content"
      >
        <Suspense fallback={null}>
          <LazySection variant="slide-up" delay={0.1}>
            <TrendingContent
              trending={pageData.trending}
              popular={pageData.popular}
              recent={pageData.recent}
            />
          </LazySection>
        </Suspense>
      </section>

      <section className={'container mx-auto px-4 py-12'}>
        <Suspense fallback={null}>
          <LazySection variant="fade-in" delay={0.15}>
            <UnifiedNewsletterCapture
              source="content_page"
              variant="hero"
              context="trending-page"
              headline="Never Miss Trending Tools"
              description="Get weekly updates on what's hot in the Claude community. No spam, unsubscribe anytime."
            />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}
