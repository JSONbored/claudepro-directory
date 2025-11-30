/**
 * Trending Page - Cached server helper + data API parity
 * Server component uses getTrendingPageData (cached RPC). Data API exposes the same payload for external consumers.
 */

import { Constants, type Database } from '@heyclaude/database-types';
import { isValidCategory } from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getTrendingPageData } from '@heyclaude/web-runtime/data';
import { Clock, Star, TrendingUp, Users } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import  { type PagePropsWithSearchParams } from '@heyclaude/web-runtime/types/app.schema';
import  {
  type DisplayableContent,
  type HomepageContentItem,
} from '@heyclaude/web-runtime/types/component.types';
import { UnifiedBadge  } from '@heyclaude/web-runtime/ui';
import  { type Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import { Suspense } from 'react';

import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TrendingContent } from '@/src/components/core/shared/trending-content';

const NewsletterCTAVariant = dynamicImport(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((module_) => ({
      default: module_.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const revalidate = 900; /**
 * Produce metadata for the /trending route.
 *
 * @returns A Metadata object describing the /trending page.
 * @see generatePageMetadata
 * @see revalidate
 */

export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/trending');
}

/**
 * Render the Trending page showing trending, popular, and recent configurations based on URL search parameters.
 *
 * Fetches server-side data (trending, popular, recent) according to the provided `searchParams`, maps results into displayable items, and renders the page layout including header badges, content sections, and a newsletter CTA.
 *
 * @param searchParams - Object of URL search parameters. Recognized keys:
 *   - `category`: optional string or string[] to scope results; when an array the first value is used.
 *   - `limit`: optional numeric limit for items; defaults to 12 and is capped at 100.
 * @returns A React element representing the complete Trending page populated with fetched content.
 *
 * @remarks This server component performs data fetching and participates in Next.js incremental static regeneration; the file-level `revalidate` is set to 900 (15 minutes).
 *
 * @see getTrendingPageData
 * @see mapTrendingMetrics
 * @see mapPopularContent
 * @see mapRecentContent
 * @see TrendingContent
 * @see NewsletterCTAVariant
 */
export default async function TrendingPage({ searchParams }: PagePropsWithSearchParams) {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'TrendingPage',
    route: '/trending',
    module: 'apps/web/src/app/trending',
  });

  const rawParameters = await searchParams;
  const categoryParameter = (() => {
    const category = rawParameters?.['category'];
    if (Array.isArray(category)) {
      return category.length > 0 ? category[0] : undefined;
    }
    return category;
  })();
  const limit = Math.min(Number(rawParameters?.['limit']) || 12, 100);
  const normalizedCategory = categoryParameter && isValidCategory(categoryParameter) ? categoryParameter : null;

  // Section: Category Validation
  if (categoryParameter && !normalizedCategory) {
    reqLogger.warn('TrendingPage: invalid category parameter provided', {
      section: 'category-validation',
      category: categoryParameter,
    });
  }

  // Section: Trending Data Fetch
  const pageData = await getTrendingPageData({
    category: normalizedCategory,
    limit,
  });
  reqLogger.info('Trending page accessed', {
    section: 'trending-data-fetch',
    category: normalizedCategory ?? 'all',
    limit,
    trendingCount: pageData.trending.length,
    popularCount: pageData.popular.length,
    recentCount: pageData.recent.length,
  });

  const trendingDisplay = mapTrendingMetrics(pageData.trending, normalizedCategory);
  const popularDisplay = mapPopularContent(pageData.popular, normalizedCategory);
  const recentDisplay = mapRecentContent(pageData.recent, normalizedCategory);

  const pageTitleId = 'trending-page-title';

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden px-4 py-24" aria-labelledby={pageTitleId}>
        <div className="container mx-auto text-center">
          <div className="mx-auto max-w-3xl">
            <UnifiedBadge
              variant="base"
              style="outline"
              className="mb-6 border-accent/20 bg-accent/5 text-accent"
            >
              <TrendingUp className="mr-1 h-3 w-3 text-accent" aria-hidden="true" />
              Trending
            </UnifiedBadge>

            <h1 id={pageTitleId} className="mb-6 font-bold text-4xl md:text-6xl">
              Trending Configurations
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed">
              Discover the most popular and trending Claude configurations in our community. Stay up
              to date with what developers are using and loving.
            </p>

            <ul className="flex flex-wrap gap-2 list-none justify-center">
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
                  {trendingDisplay.length} total configs
                </UnifiedBadge>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        className="container mx-auto px-4 py-16"
        aria-label="Trending configurations content"
      >
        <Suspense fallback={null}>
          <LazySection variant="slide-up" delay={0.1}>
            <TrendingContent
              trending={trendingDisplay}
              popular={popularDisplay}
              recent={recentDisplay}
            />
          </LazySection>
        </Suspense>
      </section>

      <section className="container mx-auto px-4 py-12">
        <Suspense fallback={null}>
          <LazySection variant="fade-in" delay={0.15}>
            <NewsletterCTAVariant
              source="content_page"
              variant="hero"
              {...(normalizedCategory ? { category: normalizedCategory } : {})}
              headline="Never Miss Trending Tools"
              description="Get weekly updates on what's hot in the Claude community. No spam, unsubscribe anytime."
            />
          </LazySection>
        </Suspense>
      </section>
    </div>
  );
}

const DEFAULT_CATEGORY: Database['public']['Enums']['content_category'] =
  Constants.public.Enums.content_category[0]; // 'agents'

function mapTrendingMetrics(
  rows: Database['public']['Functions']['get_trending_metrics_with_content']['Returns'],
  category: Database['public']['Enums']['content_category'] | null
): DisplayableContent[] {
  if (rows.length === 0) return [];
  return rows.map((row, index) => {
    const resolvedCategory = category ?? row.category;
    const validCategory = isValidCategory(resolvedCategory) ? resolvedCategory : DEFAULT_CATEGORY;
    return toHomepageContentItem({
      slug: row.slug,
      category: validCategory,
      title: row.title,
      description: row.description,
      author: row.author,
      tags: row.tags,
      source: row.source,
      viewCount: row.views_total,
      copyCount: row.copies_total,
      featuredScore: row.trending_score,
      featuredRank: index + 1,
    });
  });
}

function mapPopularContent(
  rows: Database['public']['Functions']['get_popular_content']['Returns'],
  category: Database['public']['Enums']['content_category'] | null
): DisplayableContent[] {
  if (rows.length === 0) return [];
  return rows.map((row, index) => {
    const resolvedCategory = category ?? row.category;
    const validCategory = isValidCategory(resolvedCategory) ? resolvedCategory : DEFAULT_CATEGORY;
    return toHomepageContentItem({
      slug: row.slug,
      category: validCategory,
      title: row.title,
      description: row.description,
      author: row.author,
      tags: row.tags,
      viewCount: row.view_count,
      copyCount: row.copy_count,
      featuredScore: row.popularity_score,
      featuredRank: index + 1,
    });
  });
}

function mapRecentContent(
  rows: Database['public']['Functions']['get_recent_content']['Returns'],
  category: Database['public']['Enums']['content_category'] | null
): DisplayableContent[] {
  if (rows.length === 0) return [];
  return rows.map((row, index) => {
    const resolvedCategory = category ?? row.category;
    const validCategory = isValidCategory(resolvedCategory) ? resolvedCategory : DEFAULT_CATEGORY;
    return toHomepageContentItem({
      slug: row.slug,
      category: validCategory,
      title: row.title,
      description: row.description,
      author: row.author,
      tags: row.tags,
      created_at: row.created_at,
      date_added: row.created_at,
      featuredRank: index + 1,
    });
  });
}

/**
 * Normalize a raw content record into a HomepageContentItem for homepage display.
 *
 * Produces consistent defaults for missing fields, resolves a timestamp from `created_at` or `date_added`
 * (falling back to the current time), ensures arrays and counts are present, and marks the item as featured
 * when a `featuredScore` is provided.
 *
 * @param input - Raw content values from the database or API; optional fields will be normalized.
 * @returns A `HomepageContentItem` with normalized `slug`, `title`, `description`, `author`, `tags`, `source`,
 * `created_at`, `date_added`, `category`, `view_count`, `copy_count`, and a boolean `featured` flag.
 *
 * @see mapTrendingMetrics
 * @see mapPopularContent
 * @see mapRecentContent
 */
function toHomepageContentItem(input: {
  author?: null | string;
  category: Database['public']['Enums']['content_category'];
  copyCount?: null | number;
  created_at?: null | string;
  date_added?: null | string;
  description?: null | string;
  featuredRank?: null | number;
  featuredScore?: null | number;
  slug: string;
  source?: null | string;
  tags?: null | string[];
  title?: null | string;
  viewCount?: null | number;
}): HomepageContentItem {
  const timestamp = input.created_at ?? input.date_added ?? new Date().toISOString();

  return {
    slug: input.slug,
    title: input.title ?? input.slug,
    description: input.description ?? '',
    author: input.author ?? 'Community',
    tags: Array.isArray(input.tags) ? input.tags : [],
    source: input.source ?? 'community',
    created_at: input.created_at ?? timestamp,
    date_added: input.date_added ?? timestamp,
    category: input.category,
    view_count: input.viewCount ?? 0,
    copy_count: input.copyCount ?? 0,
    featured: input.featuredScore !== undefined,
  };
}