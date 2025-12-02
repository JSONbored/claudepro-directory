/**
 * Changelog Detail Page
 *
 * Individual changelog entry page with full content and metadata.
 * Follows existing [category]/[slug]/page.tsx pattern with ISR.
 *
 * Architecture:
 * - Server component with ISR (2-hour revalidation)
 * - Static generation for top 20 entries at build time (most recent)
 * - Older entries served via ISR on first request
 * - SEO-optimized with metadata and structured data
 * - View tracking integration
 *
 * Performance:
 * - ISR: 7200s (2 hours) for stable changelog content
 * - Database-cached entry loading
 * - Static params generation (top 20)
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
  gap,
  iconSize,
  maxWidth,
  muted,
  padding,
  size,
  spaceY,
  textColor,
  tracking,
  transition,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { ArrowLeft, Calendar } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { NavLink, Separator   } from '@heyclaude/web-runtime/ui';
import { formatChangelogDate, getChangelogUrl } from '@heyclaude/web-runtime/utils/changelog';
import  { type Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ReadProgress } from '@/src/components/content/read-progress';
import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { ChangelogContent } from '@/src/components/features/changelog/changelog-content';

export const revalidate = 7200;
export const dynamicParams = true; // Allow older changelog entries to be rendered on-demand

/**
 * Generate static route parameters for the most recent changelog entries.
 *
 * Pre-renders the top 20 changelog entries to limit build-time work; older entries
 * are available on-demand via ISR (revalidate = 7200s) when requested.
 *
 * @returns An array of params objects `{ slug: string }` for the changelog entries to pre-render, limited to the most recent 20 entries.
 *
 * @see getAllChangelogEntries
 * @see export const revalidate
 * @see export const dynamicParams
 * @see getChangelogEntryBySlug
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
 * Generate page metadata for a changelog entry identified by its slug.
 *
 * Attempts to load the changelog entry and produces canonical metadata used by Next.js for the detail page.
 *
 * @param params - A promise resolving to route params containing `slug`
 * @returns Metadata for the changelog entry page; if the entry cannot be loaded, returns metadata generated without item data
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
 * Render the changelog entry page for the given slug.
 *
 * Fetches the changelog entry, renders page-level UI (read progress, view tracking, structured data),
 * and returns the complete article for the changelog entry. If the entry cannot be found the route
 * will trigger a 404 response.
 *
 * @param params - A promise that resolves to an object with the route params: `{ slug: string }`
 * @returns The React element that renders the changelog entry page
 * @throws A normalized error if loading the changelog entry fails
 *
 * @see getChangelogEntryBySlug
 * @see ReadProgress
 * @see Pulse
 * @see StructuredData
 * @see ChangelogContent
 * @see revalidate — ISR interval for this page (defined in the same module)
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
        <NavLink
          href={ROUTES.CHANGELOG}
          className={`inline-flex items-center ${gap.compact} ${muted.sm}`}
        >
          <ArrowLeft className={iconSize.sm} />
          <span>Back to Changelog</span>
        </NavLink>

        {/* Header */}
        <header className={`${spaceY.comfortable} pb-6`}>
          <div className={`${cluster.default} ${muted.sm}`}>
            <Calendar className={iconSize.sm} />
            <time dateTime={entry.release_date}>
              {formatChangelogDate(entry.release_date)}
            </time>
          </div>

          <h1 className={`${weight.bold} ${size['4xl']} ${tracking.tight}`}>{entry.title}</h1>

          {/* Canonical URL */}
          <div className={`${cluster.compact} ${size.sm}`}>
            <span className={muted.default}>Permanent link:</span>
            <a
              href={canonicalUrl}
              className={`truncate ${textColor.primary} ${transition.colors} hover:text-primary/80`}
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