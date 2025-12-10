/**
 * Changelog Detail Page
 *
 * Individual changelog entry page with full content and metadata.
 * Follows existing [category]/[slug]/page.tsx pattern with use cache + Suspense.
 *
 * Architecture:
 * - Server component with 'use cache' directive and Suspense boundaries
 * - Static generation for recent entries, dynamic rendering via Suspense fallback
 * - SEO-optimized with metadata and structured data
 * - View tracking integration
 *
 * Performance:
 * - cacheLife('static'): 5min stale, 1day revalidate, 1week expire
 * - Database-cached entry loading
 * - Static params generation for recent entries only
 *
 * Production Standards:
 * - Type-safe with Next.js 16.0.7
 * - Proper error handling with notFound()
 * - Accessibility support
 * - Responsive design
 */
import { Constants } from '@heyclaude/database-types';
import {
  generatePageMetadata,
  getAllChangelogEntries,
  getChangelogEntryBySlug,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { ArrowLeft, Calendar } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  UI_CLASSES,
  NavLink,
  Separator,
  ANIMATION_CONSTANTS,
  Breadcrumbs,
} from '@heyclaude/web-runtime/ui';
import { formatChangelogDate, getChangelogUrl } from '@heyclaude/web-runtime/utils/changelog';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { ReadProgress } from '@/src/components/content/read-progress';
import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { ChangelogContent } from '@/src/components/features/changelog/changelog-content';

import ChangelogEntryLoading from './loading';

/**
 * Build static route params for the most recent changelog entries to seed Next.js static generation.
 *
 * Returns up to the configured STATIC_GENERATION_LIMITS.changelog newest entries. If no entries are available
 * or an error occurs while loading entries, returns an empty array. Suspense boundaries will handle dynamic rendering.
 *
 * @returns An array of param objects `{ slug: string }` used by Next.js to statically generate routes, or an empty array when no entries are available or an error occurs.
 *
 * @see getAllChangelogEntries
 * @see STATIC_GENERATION_LIMITS
 */
export async function generateStaticParams() {
  // Import shared constant for consistency across changelog pages
  const { STATIC_GENERATION_LIMITS } = await import('@heyclaude/web-runtime/data/config/constants');

  // Create request-scoped child logger
  const reqLogger = logger.child({
    operation: 'ChangelogEntryPageStaticParams',
    route: '/changelog',
    module: 'apps/web/src/app/changelog/[slug]',
  });

  try {
    const entries = await getAllChangelogEntries();

    // Only pre-render the most recent entries to optimize build time
    const limit = Math.max(0, STATIC_GENERATION_LIMITS.changelog);
    // Return empty array if no entries found - Suspense boundaries will handle dynamic rendering
    // This follows Next.js best practices by avoiding placeholder patterns
    return entries.slice(0, limit).map((entry) => ({
      slug: entry.slug,
    }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to generate changelog static params');
    reqLogger.error(
      {
        section: 'data-fetch',
        err: normalized,
      },
      'ChangelogEntryPage: generateStaticParams threw'
    );
    // Return empty array on error - Suspense boundaries will handle dynamic rendering
    return [];
  }
}

/**
 * Produce route metadata for a changelog entry identified by `slug`.
 *
 * @param params - Promise that resolves to an object containing the route `slug` to load metadata for
 * @param params.params
 * @returns Metadata for the `/changelog/:slug` route; if the entry cannot be loaded, the metadata will be generated with `item: null`
 *
 * @see getChangelogEntryBySlug
 * @see generatePageMetadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  // Create request-scoped child logger
  const metadataLogger = logger.child({
    operation: 'ChangelogEntryPageMetadata',
    route: `/changelog/${slug}`,
    module: 'apps/web/src/app/changelog/[slug]',
  });

  let entry: Awaited<ReturnType<typeof getChangelogEntryBySlug>>;
  try {
    entry = await getChangelogEntryBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load changelog entry for metadata');
    metadataLogger.error(
      {
        err: normalized,
        operation: 'generateMetadata',
      },
      'ChangelogEntryPage: metadata loader threw'
    );
    entry = null;
  }

  return generatePageMetadata('/changelog/:slug', {
    params: { slug },
    item: entry,
    slug,
  });
}

/**
 * Renders the changelog detail page for the entry identified by `slug`.
 *
 * Loads the changelog entry, triggers a 404 when the entry is not found, and renders
 * page chrome (read progress, view tracking, structured data) alongside the entry content.
 *
 * @param params - Promise resolving to an object containing the `slug` of the changelog entry to render
 * @param params.params
 * @returns The server-rendered React element for the changelog entry page
 * @throws A normalized error when loading the changelog entry fails
 *
 * @see getChangelogEntryBySlug
 * @see getChangelogUrl
 * @see ChangelogContent
 * @see StructuredData
 */
export default function ChangelogEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  // Create request-scoped child logger
  const reqLogger = logger.child({
    operation: 'ChangelogEntryPage',
    route: '/changelog/[slug]',
    module: 'apps/web/src/app/changelog/[slug]',
  });

  return (
    <Suspense fallback={<ChangelogEntryLoading />}>
      <ChangelogEntryPageContent params={params} reqLogger={reqLogger} />
    </Suspense>
  );
}

/**
 * Renders the changelog entry page for a given slug by loading the entry and composing the page UI.
 *
 * Loads the changelog entry for `params.slug`; if the entry cannot be loaded a normalized error is thrown,
 * and if the entry is not found the Next.js `notFound()` helper is invoked to render a 404.
 *
 * @param params - A promise resolving to an object with the `slug` of the changelog entry to render.
 * @param params.params
 * @param reqLogger - Route-scoped logger used for request-scoped logging.
 * @param params.reqLogger
 * @returns The rendered changelog entry page JSX including read progress, view tracking, structured data, header, and content.
 *
 * @throws A normalized error when fetching the changelog entry fails.
 *
 * @see getChangelogEntryBySlug
 * @see getChangelogUrl
 * @see ChangelogContent
 * @see ReadProgress
 * @see Pulse
 * @see StructuredData
 */
async function ChangelogEntryPageContent({
  params,
  reqLogger,
}: {
  params: Promise<{ slug: string }>;
  reqLogger: ReturnType<typeof logger.child>;
}) {
  const { slug } = await params;
  const route = `/changelog/${slug}`;

  // Create route-specific logger
  const routeLogger = reqLogger.child({ route });

  let entry: Awaited<ReturnType<typeof getChangelogEntryBySlug>>;
  try {
    entry = await getChangelogEntryBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load changelog entry');
    routeLogger.error(
      {
        section: 'data-fetch',
        err: normalized,
      },
      'ChangelogEntryPage: getChangelogEntryBySlug threw'
    );
    throw normalized;
  }

  if (!entry) {
    routeLogger.warn({ section: 'data-fetch' }, 'ChangelogEntryPage: entry not found');
    notFound();
  }

  const canonicalUrl = getChangelogUrl(entry.slug);

  return (
    <>
      {/* Read Progress Bar - Shows reading progress at top of page */}
      <ReadProgress />

      {/* View Tracker - Track page views */}
      <Pulse
        variant="view"
        category={'changelog' as typeof Constants.public.Enums.content_category[number]}
        slug={entry.slug}
      />

      {/* Structured Data - Pre-generated schemas from database */}
      <StructuredData route={`/changelog/${entry.slug}`} />

      <article
        className={`container max-w-6xl ${UI_CLASSES.FORM_SECTION_SPACING} ${UI_CLASSES.PADDING_Y_RELAXED}`}
      >
        {/* Breadcrumbs */}
        <Breadcrumbs categoryLabel="Changelog" currentTitle={entry.title} />

        {/* Navigation */}
        <NavLink
          href={ROUTES.CHANGELOG}
          className={`${UI_CLASSES.TEXT_HELPER} ${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.TEXT_BODY_SM}`}
        >
          <ArrowLeft className={UI_CLASSES.ICON_SM} />
          <span>Back to Changelog</span>
        </NavLink>

        {/* Header */}
        <header className={`${UI_CLASSES.FORM_GROUP_SPACING} ${UI_CLASSES.MARGIN_COMFORTABLE}`}>
          <div
            className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} ${UI_CLASSES.TEXT_HELPER} ${UI_CLASSES.TEXT_BODY_SM}`}
          >
            <Calendar className={UI_CLASSES.ICON_SM} />
            <time dateTime={entry.release_date}>{formatChangelogDate(entry.release_date)}</time>
          </div>

          <h1 className={UI_CLASSES.HEADING_H1}>{entry.title}</h1>

          {/* Canonical URL */}
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} ${UI_CLASSES.TEXT_BODY_SM}`}>
            <span className={UI_CLASSES.TEXT_HELPER}>Permanent link:</span>
            <a
              href={canonicalUrl}
              className={`text-primary hover:text-primary/80 truncate ${ANIMATION_CONSTANTS.CSS_TRANSITION_DEFAULT}`}
            >
              {canonicalUrl}
            </a>
          </div>
        </header>

        <Separator className={UI_CLASSES.MARGIN_Y_RELAXED} />

        {/* Content */}
        <ChangelogContent entry={entry} hideHeader />
      </article>
    </>
  );
}
