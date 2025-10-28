/**
 * Changelog List Page
 *
 * Main changelog page displaying all entries with category filtering.
 * Follows existing category list page patterns with ISR.
 *
 * Architecture:
 * - Server component with ISR (5-minute revalidation)
 * - Client-side filtering via CategoryFilter component
 * - Chronological display (newest first)
 * - SEO-optimized with metadata
 *
 * Performance:
 * - ISR: 300s (5 minutes) for fresh content
 * - Database-cached entry loading
 * - Static generation at build time
 *
 * Production Standards:
 * - Type-safe with Next.js 15.5.4
 * - Proper error handling
 * - Accessibility support
 * - Responsive design
 */

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChangelogListClient } from '@/src/components/features/changelog/changelog-list-client';
import { ChangelogBlogStructuredData } from '@/src/components/infra/structured-data/changelog-structured-data';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
  }
);

import { getAllChangelogEntries } from '@/src/lib/changelog/loader';
import { ArrowLeft } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Generate metadata for changelog list page
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    return generatePageMetadata('/changelog');
  } catch (error) {
    logger.error(
      'Failed to generate changelog metadata',
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      title: 'Changelog - Claude Pro Directory',
      description: 'Track all updates, features, and improvements to Claude Pro Directory.',
    };
  }
}

/**
 * Changelog List Page Component
 */
export default async function ChangelogPage() {
  try {
    // Load all changelog entries (database-cached)
    const entries = await getAllChangelogEntries();

    return (
      <>
        {/* Structured Data - Blog Schema */}
        <ChangelogBlogStructuredData entries={entries} />

        <div className="container max-w-6xl py-8 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Link
              href="/"
              className={
                'inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors'
              }
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight">Changelog</h1>
              <p className="text-lg text-muted-foreground">
                Track all updates, new features, bug fixes, and improvements to Claude Pro
                Directory.
              </p>
            </div>

            {/* Stats */}
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_6} text-sm text-muted-foreground`}>
              <div>
                <span className="font-semibold text-foreground">{entries.length}</span> total
                updates
              </div>
              {entries.length > 0 && entries[0] && (
                <div>
                  Latest:{' '}
                  <time dateTime={entries[0].date} className="font-medium text-foreground">
                    {new Date(entries[0].date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
              )}
            </div>
          </div>

          {/* Client-side filtered list */}
          <ChangelogListClient entries={entries} />
        </div>

        {/* Email CTA - Footer section (matching homepage pattern) */}
        <section className={'mx-auto px-4 py-12'}>
          <UnifiedNewsletterCapture source="content_page" variant="hero" context="changelog-page" />
        </section>
      </>
    );
  } catch (error) {
    logger.error(
      'Failed to load changelog page',
      error instanceof Error ? error : new Error(String(error))
    );

    // Fallback UI on error
    return (
      <div className="container max-w-6xl py-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Changelog</h1>
          <p className="text-muted-foreground">
            Unable to load changelog entries. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
