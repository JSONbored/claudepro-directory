/**
 * Trending Page - Edge Function Architecture
 * Calls trending edge function with CDN caching - all logic in PostgreSQL + edge function
 */

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TrendingContent } from '@/src/components/core/shared/trending-content';
import type { ContentItem } from '@/src/lib/content/supabase-content-loader';
import { Clock, Star, TrendingUp, Users } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { PagePropsWithSearchParams } from '@/src/lib/schemas/app.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

const NewsletterCTAVariant = dynamic(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((mod) => ({
      default: mod.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

export const revalidate = false;

export const metadata = generatePageMetadata('/trending');

export default async function TrendingPage({ searchParams }: PagePropsWithSearchParams) {
  const rawParams = await searchParams;
  const category = rawParams?.category as string | undefined;
  const limit = Math.min(Number(rawParams?.limit) || 12, 100);

  logger.info('Trending page accessed', {
    category: category || 'all',
    limit,
  });

  // Fetch from edge function (with CDN caching)
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hgtjdifxfapoltfflowc.supabase.co';

  const [trendingData, popularData, recentData] = await Promise.all([
    fetch(
      `${baseUrl}/functions/v1/trending?mode=page&tab=trending${category ? `&category=${category}` : ''}&limit=${limit}`,
      {
        next: { revalidate: 86400, tags: ['trending'] },
      }
    )
      .then((r) => r.json())
      .catch(() => ({ trending: [], totalCount: 0 })),

    fetch(
      `${baseUrl}/functions/v1/trending?mode=page&tab=popular${category ? `&category=${category}` : ''}&limit=${limit}`,
      {
        next: { revalidate: 86400, tags: ['trending'] },
      }
    )
      .then((r) => r.json())
      .catch(() => ({ popular: [] })),

    fetch(
      `${baseUrl}/functions/v1/trending?mode=page&tab=recent${category ? `&category=${category}` : ''}&limit=${limit}`,
      {
        next: { revalidate: 86400, tags: ['trending'] },
      }
    )
      .then((r) => r.json())
      .catch(() => ({ recent: [] })),
  ]);

  const pageData = {
    trending: (trendingData.trending || []) as ContentItem[],
    popular: (popularData.popular || []) as ContentItem[],
    recent: (recentData.recent || []) as ContentItem[],
    totalCount: trendingData.totalCount || 0,
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
            <NewsletterCTAVariant
              source="content_page"
              variant="hero"
              headline="Never Miss Trending Tools"
              description="Get weekly updates on what's hot in the Claude community. No spam, unsubscribe anytime."
            />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}
