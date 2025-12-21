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
 * - cacheLife('long'): 1 day stale, 6hr revalidate, 30 days expire
 * - Database-cached entry loading
 * - Static params generation for recent entries only
 *
 * Production Standards:
 * - Type-safe with Next.js 16.0.7
 * - Proper error handling with notFound()
 * - Accessibility support
 * - Responsive design
 */
import type { content_category } from '@heyclaude/web-runtime/types/client-safe-enums';
import { getChangelogEntryBySlug } from '@heyclaude/web-runtime/data/changelog';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { ArrowLeft, Calendar } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { Breadcrumbs, NavLink, Separator } from '@heyclaude/web-runtime/ui';
import { formatChangelogDate, getChangelogUrl } from '@heyclaude/web-runtime/utils/changelog';
import { type Metadata } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
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
 * @see getPublishedChangelogSlugs
 * @see STATIC_GENERATION_LIMITS
 */
export async function generateStaticParams() {
  'use cache';
  // Import shared constant for consistency across changelog pages
  const { STATIC_GENERATION_LIMITS } = await import('@heyclaude/web-runtime/data/config/constants');

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/changelog/[slug]',
    operation: 'ChangelogEntryPageStaticParams',
    route: '/changelog',
  });

  try {
    // OPTIMIZATION: Use Prisma directly to get only slugs needed for static generation
    // This avoids unnecessary RPC function calls and data processing
    const { getPublishedChangelogSlugs } = await import('@heyclaude/web-runtime/data/changelog');
    const limit = Math.max(0, STATIC_GENERATION_LIMITS.changelog);
    const slugs = await getPublishedChangelogSlugs(limit);
    const params = (slugs ?? []).map((slug) => ({ slug }));

    // Cache Components requires at least one result for build-time validation
    // If no entries found, return a placeholder that will be handled gracefully by the page component
    if (params.length === 0) {
      reqLogger.warn(
        {
          section: 'data-fetch',
        },
        'ChangelogEntryPage: No entries found in generateStaticParams, returning placeholder'
      );
      // Return placeholder slug (valid format: lowercase, numbers, single hyphens)
      // Page component will handle 404 gracefully for placeholder slug
      return [{ slug: 'placeholder' }];
    }

    return params;
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to generate changelog static params');
    reqLogger.error(
      {
        err: normalized,
        section: 'data-fetch',
      },
      'ChangelogEntryPage: generateStaticParams threw'
    );
    // Cache Components requires at least one result - return placeholder on error
    // Page component will handle 404 gracefully for placeholder slug
    return [{ slug: 'placeholder' }];
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
  'use cache';
  const { slug } = await params;

  // Dynamic route - metadata changes when changelog entry changes
  // Use long cache with content-based invalidation
  cacheLife('long'); // 1 day stale, 6hr revalidate, 30 days expire
  cacheTag('seo-metadata');
  cacheTag(`seo-metadata-changelog-${slug}`);
  cacheTag(`changelog-${slug}`); // Invalidated when changelog entry changes

  // Create request-scoped child logger
  const metadataLogger = logger.child({
    module: 'apps/web/src/app/changelog/[slug]',
    operation: 'ChangelogEntryPageMetadata',
    route: `/changelog/${slug}`,
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
    item: entry,
    params: { slug },
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
export default async function ChangelogEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  'use cache';
  cacheLife('long'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/changelog/[slug]',
    operation: 'ChangelogEntryPage',
    route: '/changelog/[slug]',
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
        err: normalized,
        section: 'data-fetch',
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
      <Pulse category={'changelog' as content_category} slug={entry.slug} variant="view" />

      {/* Structured Data - Pre-generated schemas from database */}
      <StructuredData route={`/changelog/${entry.slug}`} />

      <article className="container max-w-6xl space-y-6 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs categoryLabel="Changelog" currentTitle={entry.title} />

        {/* Navigation */}
        <NavLink
          className="text-muted-foreground flex items-center gap-2 text-sm text-xs leading-normal"
          href={ROUTES.CHANGELOG}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Changelog</span>
        </NavLink>

        {/* Header */}
        <header className="mb-6 space-y-4">
          <div className="text-muted-foreground flex items-center gap-3 text-sm text-xs leading-normal">
            <Calendar className="h-4 w-4" />
            <time
              dateTime={
                entry.release_date instanceof Date
                  ? entry.release_date.toISOString()
                  : entry.release_date
              }
            >
              {formatChangelogDate(entry.release_date)}
            </time>
          </div>

          <h1 className="text-4xl font-bold tracking-tight">{entry.title}</h1>

          {/* Canonical URL */}
          <div className="flex items-center gap-2 text-sm leading-normal">
            <span className="text-muted-foreground text-xs">Permanent link:</span>
            <a
              className="text-primary hover:text-primary/80 truncate transition-all duration-200 ease-out"
              href={canonicalUrl}
            >
              {canonicalUrl}
            </a>
          </div>
        </header>

        <Separator className="my-8" />

        {/* Content */}
        <ChangelogContent hideHeader entry={entry} />
      </article>
    </>
  );
}
