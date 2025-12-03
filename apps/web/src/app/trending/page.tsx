/**
 * Trending Page - Cached server helper + data API parity
 * Server component uses getTrendingPageData (cached RPC). Data API exposes the same payload for external consumers.
 */

import { Constants, type Database } from '@heyclaude/database-types';
import { isValidCategory } from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getTrendingPageData } from '@heyclaude/web-runtime/data';
import {
  bgColor,
  borderColor,
  flexWrap,
  gap,
  iconLeading,
  justify,
  marginBottom,
  marginTop,
  maxWidth,
  minHeight,
  muted,
  overflow,
  padding,
  size,
  textColor,
  weight,
  display,
  position,
  container,
  marginX,
  textAlign,
  listStyle,
} from '@heyclaude/web-runtime/design-system';
import { Clock, Star, TrendingUp, Users } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger } from '@heyclaude/web-runtime/logging/server';
import { type PagePropsWithSearchParams } from '@heyclaude/web-runtime/types/app.schema';
import {
  type DisplayableContent,
  type HomepageContentItem,
} from '@heyclaude/web-runtime/types/component.types';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';
import { Suspense } from 'react';

import { LazySection } from '@/src/components/core/infra/scroll-animated-section';
import { TrendingContent } from '@/src/components/core/shared/trending-content';
import { NewsletterCTAVariant } from '@/src/components/features/growth/newsletter/newsletter-cta-variants';

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const revalidate = 900;

/**
 * Generate metadata for the trending page.
 *
 * @returns A Metadata object describing the /trending page.
 * @see generatePageMetadata
 * @see revalidate
 */

/**
 * Provide page metadata for the /trending route.
 *
 * Returns metadata consumed by Next.js (title, description, Open Graph, and other SEO-related fields)
 * to populate the /trending page head and social previews.
 *
 * @returns The `Metadata` object for the /trending page
 *
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
    <div className={`${minHeight.screen} ${bgColor.background}`}>
      <section className={`${position.relative} ${overflow.hidden} ${padding.xDefault} ${padding.yXl}`} aria-labelledby={pageTitleId}>
        <div className={`${container.default} ${textAlign.center}`}>
          <div className={`${marginX.auto} ${maxWidth['3xl']}`}>
            <UnifiedBadge
              variant="base"
              style="outline"
              className={`${marginBottom.comfortable} ${borderColor['accent/20']} ${bgColor['accent/5']} ${textColor.accent}`}
            >
              <TrendingUp className={`${iconLeading.xs} ${textColor.accent}`} aria-hidden="true" />
              Trending
            </UnifiedBadge>

            <h1 id={pageTitleId} className={`${marginBottom.comfortable} ${weight.bold} ${size['4xl']} md:text-6xl`}>
              Trending Configurations
            </h1>

            <p className={`${marginX.auto} ${marginTop.comfortable} ${maxWidth['2xl']} ${muted.lg}`}>
              Discover the most popular and trending Claude configurations in our community. Stay up
              to date with what developers are using and loving.
            </p>

            <ul className={`${display.flex} ${flexWrap.wrap} ${gap.compact} ${listStyle.none} ${justify.center}`}>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Clock className={iconLeading.xs} aria-hidden="true" />
                  Real-time updates
                </UnifiedBadge>
              </li>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Star className={iconLeading.xs} aria-hidden="true" />
                  Based on views
                </UnifiedBadge>
              </li>
              <li>
                <UnifiedBadge variant="base" style="secondary">
                  <Users className={iconLeading.xs} aria-hidden="true" />
                  {trendingDisplay.length} total configs
                </UnifiedBadge>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        className={`${container.default} ${padding.xDefault} ${padding.yHero}`}
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

      <section className={`${container.default} ${padding.xDefault} ${padding.ySection}`}>
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

/**
 * Convert database "popular" rows into normalized DisplayableContent items for the homepage.
 *
 * @param rows - Result rows from the database function `get_popular_content`
 * @param category - Optional category override; when `null` the row's category is used. Invalid categories will fall back to `DEFAULT_CATEGORY`.
 * @returns An array of DisplayableContent items with normalized fields and a 1-based popularity rank
 *
 * @see toHomepageContentItem
 * @see isValidCategory
 * @see DEFAULT_CATEGORY
 */
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

/**
 * Convert recent-content rows into homepage-ready DisplayableContent items.
 *
 * @param rows - Raw rows returned by the `get_recent_content` database function.
 * @param category - Optional category override applied to every item; if `null` the row's category is used. Invalid categories fall back to `DEFAULT_CATEGORY`.
 * @returns An array of `DisplayableContent` items suitable for homepage rendering; each item has `created_at` and `date_added` set from the row and `featuredRank` set to the item's 1-based position.
 *
 * @see toHomepageContentItem
 * @see DEFAULT_CATEGORY
 * @see isValidCategory
 */
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
 * Convert a raw content record into a normalized HomepageContentItem for homepage lists.
 *
 * Ensures required fields are present by applying sensible defaults: derives a timestamp from
 * `created_at` or `date_added` (falls back to the current time), defaults missing strings and arrays,
 * ensures numeric counts are present, and sets `featured` when `featuredScore` is greater than zero.
 *
 * @param input - Raw content values from the database or API; optional fields will be normalized.
 * @returns A HomepageContentItem with normalized `slug`, `title`, `description`, `author`, `tags`, `source`,
 * `created_at`, `date_added`, `category`, `view_count`, `copy_count`, and `featured`.
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
    featured: typeof input.featuredScore === 'number' && input.featuredScore > 0,
  };
}