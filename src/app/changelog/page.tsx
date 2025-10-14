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
 * - Redis-cached entry loading
 * - Static generation at build time
 *
 * Production Standards:
 * - Type-safe with Next.js 15.5.4
 * - Proper error handling
 * - Accessibility support
 * - Responsive design
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { ChangelogListClient } from '@/src/components/changelog/changelog-list-client';
import { InlineEmailCTA } from '@/src/components/shared/inline-email-cta';
import { ChangelogBlogStructuredData } from '@/src/components/structured-data/changelog-structured-data';
import { getAllChangelogEntries } from '@/src/lib/changelog/loader';
import { ArrowLeft } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// ISR - revalidate every 5 minutes for fresh changelog entries
export const revalidate = 300;

/**
 * Generate metadata for changelog list page
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    return await generatePageMetadata('/changelog');
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
    // Load all changelog entries (cached with Redis)
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
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_6} ${UI_CLASSES.TEXT_SM} ${UI_CLASSES.TEXT_MUTED_FOREGROUND}`}>
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
        <section className={`${UI_CLASSES.MX_AUTO} px-4 py-12`}>
          <InlineEmailCTA
            variant="hero"
            context="changelog-page"
            headline="Join 1,000+ Claude Power Users"
            description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
          />
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
