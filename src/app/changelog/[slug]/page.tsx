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
 * - Redis-cached entry loading
 * - Static params generation
 *
 * Production Standards:
 * - Type-safe with Next.js 15.5.4
 * - Proper error handling with notFound()
 * - Accessibility support
 * - Responsive design
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChangelogContent } from '@/src/components/changelog/changelog-content';
import { UnifiedTracker } from '@/src/components/infra/unified-tracker';
import { BreadcrumbSchema } from '@/src/components/structured-data/breadcrumb-schema';
import { ChangelogArticleStructuredData } from '@/src/components/structured-data/changelog-structured-data';
import { Separator } from '@/src/components/ui/separator';
import { getAllChangelogEntries, getChangelogEntryBySlug } from '@/src/lib/changelog/loader';
import { formatChangelogDate, getChangelogUrl } from '@/src/lib/changelog/utils';
import { APP_CONFIG } from '@/src/lib/constants';
import { ROUTES } from '@/src/lib/constants/routes';
import { ArrowLeft, Calendar } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// ISR - revalidate every 10 minutes
export const revalidate = 900;

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
    logger.error(
      'Failed to generate changelog static params',
      error instanceof Error ? error : new Error(String(error))
    );
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

  // Load changelog entry for metadata generation
  const entry = await getChangelogEntryBySlug(slug);

  return generatePageMetadata('/changelog/:slug', {
    params: { slug },
    item: entry || undefined,
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
  try {
    const { slug } = await params;
    const entry = await getChangelogEntryBySlug(slug);

    // Show 404 if entry not found
    if (!entry) {
      notFound();
    }

    const canonicalUrl = getChangelogUrl(entry.slug);

    return (
      <>
        {/* View Tracker - Track page views */}
        <UnifiedTracker variant="view" category="changelog" slug={entry.slug} />

        {/* Structured Data - TechArticle Schema */}
        <ChangelogArticleStructuredData entry={entry} />

        {/* Breadcrumb Schema - SEO optimization */}
        {
          await (
            <BreadcrumbSchema
              items={[
                {
                  name: 'Changelog',
                  url: `${APP_CONFIG.url}/changelog`,
                },
                {
                  name: entry.title,
                  url: `${APP_CONFIG.url}/changelog/${entry.slug}`,
                },
              ]}
            />
          )
        }

        <article className="container max-w-4xl py-8 space-y-8">
          {/* Navigation */}
          <Link
            href={ROUTES.CHANGELOG}
            className={
              'inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
            }
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Changelog</span>
          </Link>

          {/* Header */}
          <header className="space-y-4 pb-6">
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_3} text-sm text-muted-foreground`}>
              <Calendar className="h-4 w-4" />
              <time dateTime={entry.date}>{formatChangelogDate(entry.date)}</time>
            </div>

            <h1 className="text-4xl font-bold tracking-tight">{entry.title}</h1>

            {/* Canonical URL */}
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-sm`}>
              <span className="text-muted-foreground">Permanent link:</span>
              <a
                href={canonicalUrl}
                className="text-primary hover:text-primary/80 transition-colors truncate"
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
  } catch (error) {
    logger.error(
      'Failed to load changelog entry page',
      error instanceof Error ? error : new Error(String(error))
    );

    // Fallback UI on error
    return (
      <div className="container max-w-4xl py-8">
        <div className="space-y-4">
          <Link
            href={ROUTES.CHANGELOG}
            className={
              'inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
            }
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Changelog</span>
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Error Loading Entry</h1>
          <p className="text-muted-foreground">
            Unable to load this changelog entry. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
