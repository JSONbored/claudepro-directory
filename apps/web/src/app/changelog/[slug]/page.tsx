/**
 * Changelog Detail Page
 *
 * Individual changelog entry page with full content and metadata.
 * Follows existing [category]/[slug]/page.tsx pattern with ISR.
 *
 * Architecture:
 * - Server component with ISR (10-minute revalidation)
 * - Static generation for all entries at build time
 * - SEO-optimized with metadata and structured data
 * - View tracking integration
 *
 * Performance:
 * - ISR: 600s (10 minutes) for fresh content
 * - Database-cached entry loading
 * - Static params generation
 *
 * Production Standards:
 * - Type-safe with Next.js 15.5.4
 * - Proper error handling with notFound()
 * - Accessibility support
 * - Responsive design
 */
/**
 * ISR: 2 hours (7200s) - Changelog entries are stable after publication
 */
import { Constants } from '@heyclaude/database-types';
import {
  generatePageMetadata,
  getAllChangelogEntries,
  getChangelogEntryBySlug,
} from '@heyclaude/web-runtime/data';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import {
  cluster,
  iconSize,
  spaceY,
  muted,
  weight,
  size,
  padding,
  maxWidth,
} from '@heyclaude/web-runtime/design-system';
import { ArrowLeft, Calendar } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { NavLink, Separator } from '@heyclaude/web-runtime/ui';
import { formatChangelogDate, getChangelogUrl } from '@heyclaude/web-runtime/utils/changelog';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ReadProgress } from '@/src/components/content/read-progress';
import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { ChangelogContent } from '@/src/components/features/changelog/changelog-content';

export const revalidate = 7200;
export const dynamicParams = true; // Allow older changelog entries to be rendered on-demand

/**
 * Provide static route parameters for a subset of recent changelog entries to pre-render at build time.
 *
 * Pre-renders the most recent changelog entries (limited to a top subset) so the build only generates a bounded number
 * of changelog pages; older entries are available on-demand via ISR (revalidate = 7200s).
 *
 * @returns An array of parameter objects of the form `{ slug: string }` for entries that should be statically generated.
 * @throws Throws a normalized error if changelog entries cannot be loaded.
 * @see getAllChangelogEntries
 * @see revalidate
 */
export async function generateStaticParams() {
  // Limit to top 20 changelog entries (most recent) to optimize build time
  const MAX_STATIC_ENTRIES = 20;

  // Generate requestId for static params generation (build-time)
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'ChangelogEntryPageStaticParams',
    route: '/changelog',
    module: 'apps/web/src/app/changelog/[slug]',
  });

  try {
    const entries = await getAllChangelogEntries();

    // Only pre-render the most recent entries to optimize build time
    return entries.slice(0, MAX_STATIC_ENTRIES).map((entry) => ({
      slug: entry.slug,
    }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to generate changelog static params');
    reqLogger.error('ChangelogEntryPage: generateStaticParams threw', normalized);
    // Re-throw so callers/CI see a hard failure rather than masking it
    throw normalized;
  }
}

/**
 * Create page metadata for a changelog detail page using the provided route parameters.
 *
 * Attempts to load the changelog entry identified by `slug` and uses the entry (when available)
 * to populate the metadata; if the entry cannot be loaded, metadata generation proceeds with a null item.
 *
 * @param params - A promise resolving to route parameters containing `slug`
 * @returns The metadata object for the changelog detail page
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

  // Generate requestId for metadata generation (separate from page render)
  const metadataRequestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const metadataLogger = logger.child({
    requestId: metadataRequestId,
    operation: 'ChangelogEntryPageMetadata',
    route: `/changelog/${slug}`,
    module: 'apps/web/src/app/changelog/[slug]',
  });

  let entry: Awaited<ReturnType<typeof getChangelogEntryBySlug>>;
  try {
    entry = await getChangelogEntryBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load changelog entry for metadata');
    metadataLogger.error('ChangelogEntryPage: metadata loader threw', normalized, {
      operation: 'generateMetadata',
    });
    entry = null;
  }

  return generatePageMetadata('/changelog/:slug', {
    params: { slug },
    item: entry,
    slug,
  });
}

/**
 * Render the changelog detail page for a given entry slug, loading the entry and producing the full entry view.
 *
 * Loads the changelog entry identified by `slug`, renders metadata, view-tracking, structured data, canonical link, and the changelog content; if the entry is missing a 404 is triggered.
 *
 * @param params - Promise resolving to an object with the route params; must resolve to `{ slug: string }`.
 * @returns The rendered React element for the changelog entry page.
 * @throws A normalized error if loading the changelog entry fails.
 * @see getChangelogEntryBySlug
 * @see ReadProgress
 * @see Pulse
 * @see StructuredData
 * @see ChangelogContent
 */
export default async function ChangelogEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'ChangelogEntryPage',
    route: `/changelog/${slug}`,
    module: 'apps/web/src/app/changelog/[slug]',
  });

  let entry: Awaited<ReturnType<typeof getChangelogEntryBySlug>>;
  try {
    entry = await getChangelogEntryBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load changelog entry');
    reqLogger.error('ChangelogEntryPage: getChangelogEntryBySlug threw', normalized);
    throw normalized;
  }

  if (!entry) {
    reqLogger.warn('ChangelogEntryPage: entry not found');
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
        category={Constants.public.Enums.content_category[10]} // 'changelog'
        slug={entry.slug}
      />

      {/* Structured Data - Pre-generated schemas from database */}
      <StructuredData route={`/changelog/${entry.slug}`} />

      <article className={`container ${maxWidth['4xl']} ${spaceY.loose} ${padding.yRelaxed}`}>
        {/* Navigation */}
        <NavLink href={ROUTES.CHANGELOG} className={`inline-${cluster.compact} ${muted.sm}`}>
          <ArrowLeft className={iconSize.sm} />
          <span>Back to Changelog</span>
        </NavLink>

        {/* Header */}
        <header className={`${spaceY.comfortable} pb-6`}>
          <div className={`${cluster.default} ${muted.sm}`}>
            <Calendar className={iconSize.sm} />
            <time dateTime={entry.release_date}>{formatChangelogDate(entry.release_date)}</time>
          </div>

          <h1 className={`${weight.bold} ${size['4xl']} tracking-tight`}>{entry.title}</h1>

          {/* Canonical URL */}
          <div className={`${cluster.compact} ${size.sm}`}>
            <span className={muted.default}>Permanent link:</span>
            <a
              href={canonicalUrl}
              className="text-primary hover:text-primary/80 truncate transition-colors"
            >
              {canonicalUrl}
            </a>
          </div>
        </header>

        <Separator className="my-6" />

        {/* Content */}
        <ChangelogContent entry={entry} />
      </article>
    </>
  );
}