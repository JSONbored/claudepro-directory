/**
 * Trending Page - Cached server helper + data API parity
 * Server component uses getTrendingPageData (cached RPC). Data API exposes the same payload for external consumers.
 */

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { UnifiedBadge } from '@/src/components/core/domain/badges/category-badge';
import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TrendingContent } from '@/src/components/core/shared/trending-content';
import { isValidCategory } from '@/src/lib/data/config/category';
import { getTrendingPageData } from '@/src/lib/data/content/trending';
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

export const metadata: Promise<Metadata> = generatePageMetadata('/trending');

export default async function TrendingPage({ searchParams }: PagePropsWithSearchParams) {
  const rawParams = await searchParams;
  const categoryParam = rawParams?.['category'] as string | undefined;
  const limit = Math.min(Number(rawParams?.['limit']) || 12, 100);
  const normalizedCategory = categoryParam && isValidCategory(categoryParam) ? categoryParam : null;

  if (categoryParam && !normalizedCategory) {
    logger.warn('TrendingPage: invalid category parameter provided', {
      category: categoryParam,
    });
  }

  logger.info('Trending page accessed', {
    category: normalizedCategory ?? 'all',
    limit,
  });

  const pageData = await getTrendingPageData({
    category: normalizedCategory,
    limit,
  });

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
