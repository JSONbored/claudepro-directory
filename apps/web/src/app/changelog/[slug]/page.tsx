/**
 * Changelog Detail Page
 *
 * Individual changelog entry page with full content and metadata.
 * Follows existing [category]/[slug]/page.tsx pattern with ISR.
 *
 * Architecture:
 * - Server component with ISR (2-hour revalidation)
 * - Static generation for recent entries, older ones via on-demand ISR
 * - SEO-optimized with metadata and structured data
 * - View tracking integration
 *
 * Performance:
 * - ISR: 7200s (2 hours) for stable changelog content
 * - Database-cached entry loading
 * - Static params generation for recent entries only
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
import { ArrowLeft, Calendar } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  UI_CLASSES,
  NavLink,
  Separator,
  ANIMATION_CONSTANTS,
  Breadcrumbs,
} from '@heyclaude/web-runtime/ui';
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
 * Build the list of static route params for the most recent changelog entries.
 *
 * Pre-renders up to STATIC_GENERATION_LIMITS.changelog of the latest entries to reduce build time;
 * older entries are rendered on-demand via ISR (revalidate = 7200 seconds).
 *
 * @returns An array of param objects of the form `{ slug: string }` for Next.js static generation
 *
 * @throws {Error} When loading changelog entries fails — the error is normalized and re-thrown.
 *
 * @see getAllChangelogEntries
 * @see STATIC_GENERATION_LIMITS
 */
export async function generateStaticParams() {
  // Import shared constant for consistency across changelog pages
  const { STATIC_GENERATION_LIMITS } = await import('@heyclaude/web-runtime/data/config/constants');

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
    const limit = Math.max(0, STATIC_GENERATION_LIMITS.changelog);
    return entries.slice(0, limit).map((entry) => ({
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
 * Produce route metadata for a changelog entry identified by `slug`.
 *
 * @param params - Promise that resolves to an object containing the route `slug` to load metadata for
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
 * Render the changelog detail page for the entry identified by `slug`.
 *
 * Fetches the changelog entry, triggers a 404 when the entry is not found, and renders
 * page chrome (read progress, view tracking, structured data) and the entry content.
 *
 * @param params - Promise that resolves to an object containing the `slug` of the changelog entry to render.
 * @returns The server-rendered React element for the changelog entry page.
 * @throws A normalized error when loading the changelog entry fails.
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
        <ChangelogContent entry={entry} />
      </article>
    </>
  );
}
