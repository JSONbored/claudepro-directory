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
import { StructuredData } from '@/src/components/core/infra/structured-data';
import { NavLink } from '@/src/components/core/navigation/nav-link';
import { ChangelogListClient } from '@/src/components/features/changelog/changelog-list-client';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { getAllChangelogEntries } from '@/src/lib/changelog/loader';
import { APP_CONFIG } from '@/src/lib/constants';
import { ArrowLeft } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Generate metadata for changelog list page
 * Includes RSS/Atom feed discovery links (2025 best practice)
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const baseMetadata = await generatePageMetadata('/changelog');

    // Add RSS/Atom feed discovery links
    return {
      ...baseMetadata,
      alternates: {
        types: {
          'application/rss+xml': `${APP_CONFIG.url}/changelog/rss.xml`,
          'application/atom+xml': `${APP_CONFIG.url}/changelog/atom.xml`,
        },
      },
    };
  } catch (error) {
    logger.error(
      'Failed to generate changelog metadata',
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      title: 'Changelog - Claude Pro Directory',
      description: 'Track all updates, features, and improvements to Claude Pro Directory.',
      alternates: {
        types: {
          'application/rss+xml': `${APP_CONFIG.url}/changelog/rss.xml`,
          'application/atom+xml': `${APP_CONFIG.url}/changelog/atom.xml`,
        },
      },
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

    // Calculate category counts for filtering based on change types
    const categoryCounts: Record<string, number> = {
      Added: 0,
      Changed: 0,
      Fixed: 0,
      Removed: 0,
      Deprecated: 0,
      Security: 0,
    };

    // Count entries that have changes in each category
    for (const entry of entries) {
      if (entry.changes && typeof entry.changes === 'object') {
        const changes = entry.changes as Record<string, unknown>;
        for (const category of Object.keys(categoryCounts)) {
          const categoryChanges = changes[category];
          if (Array.isArray(categoryChanges) && categoryChanges.length > 0) {
            if (typeof categoryCounts[category] === 'number') {
              categoryCounts[category]++;
            }
          }
        }
      }
    }

    return (
      <>
        <StructuredData route="/changelog" />

        <div className="container max-w-6xl space-y-8 py-8">
          {/* Header */}
          <div className="space-y-4">
            <NavLink
              href="/"
              className="inline-flex items-center gap-2 text-muted-foreground text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </NavLink>

            <div className="space-y-2">
              <h1 className="font-bold text-4xl tracking-tight">Changelog</h1>
              <p className="text-lg text-muted-foreground">
                Track all updates, new features, bug fixes, and improvements to Claude Pro
                Directory.
              </p>
            </div>

            {/* Stats */}
            <div className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_6} text-muted-foreground text-sm`}>
              <div>
                <span className="font-semibold text-foreground">{entries.length}</span> total
                updates
              </div>
              {entries.length > 0 && entries[0] && (
                <div>
                  Latest:{' '}
                  <time dateTime={entries[0].release_date} className="font-medium text-foreground">
                    {new Date(entries[0].release_date).toLocaleDateString('en-US', {
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
          <ChangelogListClient entries={entries} categoryCounts={categoryCounts} />
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
          <h1 className="font-bold text-4xl tracking-tight">Changelog</h1>
          <p className="text-muted-foreground">
            Unable to load changelog entries. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
