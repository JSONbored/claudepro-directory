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
import { NavLink } from '@/src/components/core/navigation/navigation-link';
import { ChangelogListClient } from '@/src/components/features/changelog/changelog-list-client';

const NewsletterCTAVariant = dynamic(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((mod) => ({
      default: mod.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

import { getChangelogOverview } from '@/src/lib/data/changelog';
import { APP_CONFIG } from '@/src/lib/data/config/constants';
import { ArrowLeft } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Tables } from '@/src/types/database-overrides';

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
    // Load changelog overview with entries, metadata, and featured (database-cached)
    // This replaces getAllChangelogEntries() + client-side category counting
    const overview = await getChangelogOverview({
      publishedOnly: false, // Get all for static generation
      limit: 10000,
      offset: 0,
    });

    const entries = overview.entries ?? [];

    // Get category counts from metadata (database-calculated, not client-side)
    // Cast category_counts from Json to Record<string, number>
    const categoryCountsJson = overview.metadata?.category_counts as Record<string, number> | null;
    const categoryCounts: Record<string, number> = {
      All: overview.metadata?.total_entries ?? 0,
      Added: categoryCountsJson?.['Added'] ?? 0,
      Changed: categoryCountsJson?.['Changed'] ?? 0,
      Fixed: categoryCountsJson?.['Fixed'] ?? 0,
      Removed: categoryCountsJson?.['Removed'] ?? 0,
      Deprecated: categoryCountsJson?.['Deprecated'] ?? 0,
      Security: categoryCountsJson?.['Security'] ?? 0,
    };

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
                <span className="font-semibold text-foreground">
                  {overview.metadata?.total_entries ?? entries.length}
                </span>{' '}
                total updates
              </div>
              {entries.length > 0 && entries[0] && entries[0].release_date && (
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
          <ChangelogListClient
            entries={
              entries.map((entry) => ({
                ...entry,
                canonical_url: null,
                commit_count: null,
                contributors: null,
                git_commit_sha: null,
                json_ld: null,
                og_image: null,
                og_type: null,
                robots_follow: null,
                robots_index: null,
                source: null,
                twitter_card: null,
                content: entry.content ?? '',
                changes: entry.changes ?? {},
                created_at: entry.created_at ?? '',
                updated_at: entry.updated_at ?? '',
              })) as Tables<'changelog'>[]
            }
            categoryCounts={categoryCounts}
          />
        </div>

        {/* Email CTA - Footer section (matching homepage pattern) */}
        <section className={'mx-auto px-4 py-12'}>
          <NewsletterCTAVariant source="content_page" variant="hero" />
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
