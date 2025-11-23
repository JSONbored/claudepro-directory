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

import {
  generatePageMetadata,
  getAllChangelogEntries,
  getChangelogEntryBySlug,
  logger,
  normalizeError,
  UI_CLASSES,
} from '@heyclaude/web-runtime';
import { ArrowLeft, Calendar } from '@heyclaude/web-runtime/icons';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReadProgress } from '@/src/components/content/read-progress';
import { Pulse } from '@/src/components/core/infra/pulse';
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { NavLink } from '@/src/components/core/navigation/navigation-link';
import { ChangelogContent } from '@/src/components/features/changelog/changelog-content';
import { Separator } from '@/src/components/primitives/ui/separator';
import { formatChangelogDate, getChangelogUrl } from '@/src/lib/changelog/utils';
import { ROUTES } from '@/src/lib/data/config/constants';

/**
 * Generate static params for all changelog entries
 */
export async function generateStaticParams() {
  try {
    const entries = await getAllChangelogEntries();

    return entries.map((entry) => ({
      slug: entry.slug,
    }));
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to generate changelog static params');
    logger.error('ChangelogEntryPage: generateStaticParams threw', normalized);
    return [];
  }
}

/**
 * Generate metadata for changelog detail page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  let entry: Awaited<ReturnType<typeof getChangelogEntryBySlug>> | null = null;
  try {
    entry = await getChangelogEntryBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load changelog entry for metadata');
    logger.error('ChangelogEntryPage: metadata loader threw', normalized, { slug });
  }

  return generatePageMetadata('/changelog/:slug', {
    params: { slug },
    item: entry ?? undefined,
    slug,
  });
}

/**
 * Changelog Detail Page Component
 */
export default async function ChangelogEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let entry: Awaited<ReturnType<typeof getChangelogEntryBySlug>> | null = null;
  try {
    entry = await getChangelogEntryBySlug(slug);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load changelog entry');
    logger.error('ChangelogEntryPage: getChangelogEntryBySlug threw', normalized, { slug });
    throw normalized;
  }

  if (!entry) {
    logger.warn('ChangelogEntryPage: entry not found', { slug });
    notFound();
  }

  const canonicalUrl = getChangelogUrl(entry.slug);

  return (
    <>
      {/* Read Progress Bar - Shows reading progress at top of page */}
      <ReadProgress />

      {/* View Tracker - Track page views */}
      <Pulse variant="view" category="changelog" slug={entry.slug} />

      {/* Structured Data - Pre-generated schemas from database */}
      <StructuredData route={`/changelog/${entry.slug}`} />

      <article className="container max-w-4xl space-y-8 py-8">
        {/* Navigation */}
        <NavLink
          href={ROUTES.CHANGELOG}
          className="inline-flex items-center gap-2 text-muted-foreground text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Changelog</span>
        </NavLink>

        {/* Header */}
        <header className="space-y-4 pb-6">
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} text-muted-foreground text-sm`}>
            <Calendar className="h-4 w-4" />
            <time dateTime={entry.release_date ?? undefined}>
              {formatChangelogDate(entry.release_date)}
            </time>
          </div>

          <h1 className="font-bold text-4xl tracking-tight">{entry.title}</h1>

          {/* Canonical URL */}
          <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm`}>
            <span className="text-muted-foreground">Permanent link:</span>
            <a
              href={canonicalUrl}
              className="truncate text-primary transition-colors hover:text-primary/80"
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
