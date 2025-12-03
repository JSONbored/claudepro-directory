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

import { type Database } from '@heyclaude/database-types';
import { generatePageMetadata, getChangelogOverview } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import {
  cluster,
  iconSize,
  maxWidth,
  muted,
  padding,
  size,
  spaceY,
  textColor,
  tracking,
  weight,
  marginX,
} from '@heyclaude/web-runtime/design-system';
import { ArrowLeft } from '@heyclaude/web-runtime/icons';
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { NavLink } from '@heyclaude/web-runtime/ui';
import { type Metadata } from 'next';

import { StructuredData } from '@/src/components/core/infra/structured-data';
import { ChangelogListClient } from '@/src/components/features/changelog/changelog-list-client';
import { WhatsNewSummary } from '@/src/components/features/changelog/whats-new-summary';
import { NewsletterCTAVariant } from '@/src/components/features/growth/newsletter/newsletter-cta-variants';

/**
 * ISR: 1 hour (3600s) - Changelog list updates periodically
 * Uses ISR for better performance while keeping content fresh
 */
export const revalidate = 3600;

/**
 * Builds page metadata for the /changelog route, including RSS and Atom feed alternates.
 *
 * On failure, returns a fallback metadata object containing a default title and description
 * while preserving the RSS and Atom alternates for feed discovery.
 *
 * @returns Page metadata for the `/changelog` route. Includes feed discovery URLs under
 *          `alternates.types` for `application/rss+xml` and `application/atom+xml`.
 *
 * @see generatePageMetadata
 * @see APP_CONFIG
 * @see revalidate
 */
export async function generateMetadata(): Promise<Metadata> {
  // Generate requestId for metadata generation (separate from page render)
  const metadataRequestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const metadataLogger = logger.child({
    requestId: metadataRequestId,
    operation: 'ChangelogPageMetadata',
    route: '/changelog',
    module: 'apps/web/src/app/changelog',
  });

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
    const normalized = normalizeError(error, 'Failed to generate changelog metadata');
    metadataLogger.error('Failed to generate changelog metadata', normalized, {
      section: 'metadata-generation',
    });
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
 * Render the Changelog page including server-loaded entries, structured data, client-side filtering, and a newsletter CTA.
 *
 * Loads published changelog overview (entries and server-calculated category counts), normalizes entry shapes for client consumption, and renders SEO structured data, a header with totals and latest release date, a "What's New" summary, a client-side filterable changelog list, and a newsletter CTA. On failure, returns a minimal fallback UI with an error message and logs the error.
 *
 * @returns The React element for the changelog page; when data loading fails, a minimal fallback UI element is returned.
 *
 * @see getChangelogOverview
 * @see ChangelogListClient
 * @see StructuredData
 * @see WhatsNewSummary
 * @see NewsletterCTAVariant
 * @see revalidate (ISR configuration exported from this module)
 */
export default async function ChangelogPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();
  
  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'ChangelogPage',
    route: '/changelog',
    module: 'apps/web/src/app/changelog',
  });

  try {
    // Load changelog overview with entries, metadata, and featured (database-cached)
    // This replaces getAllChangelogEntries() + client-side category counting
    const overview = await getChangelogOverview({
      publishedOnly: true, // Only get published entries
      limit: 10_000,
      offset: 0,
    });

    // Normalize entries: ensure contributors and keywords are arrays (never null)
    // changelog_overview_entry has keywords but not contributors, so we default contributors to []
    const publishedEntries = (overview.entries ?? []).map((entry) => {
      // keywords is already text[] in database (may be null in overview)
      // contributors is not in changelog_overview_entry, so default to []
      const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
      const contributors: string[] = [];

      return {
        ...entry,
        canonical_url: null,
        commit_count: null,
        contributors,
        git_commit_sha: null,
        json_ld: null,
        keywords,
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
      } as Database['public']['Tables']['changelog']['Row'];
    });

    // Get category counts from metadata (database-calculated, not client-side)
    // Cast category_counts from Json to Record<string, number>
    const categoryCountsJson = overview.metadata?.category_counts as null | Record<string, number>;
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

        <div className={`container ${maxWidth['6xl']} ${spaceY.loose} ${padding.yRelaxed}`}>
          {/* Header */}
          <div className={spaceY.comfortable}>
            <NavLink
              href="/"
              className={`${cluster.compact} ${muted.sm}`}
            >
              <ArrowLeft className={iconSize.sm} />
              <span>Back to Home</span>
            </NavLink>

            <div className={spaceY.compact}>
              <h1 className={`${weight.bold} ${size['4xl']} ${tracking.tight}`}>Changelog</h1>
              <p className={muted.lg}>
                Track all updates, new features, bug fixes, and improvements to Claude Pro
                Directory.
              </p>
            </div>

            {/* Stats */}
            <div className={`${cluster.relaxed} ${muted.sm}`}>
              <div>
                <span className={`${weight.semibold} ${textColor.foreground}`}>
                  {overview.metadata?.total_entries ?? publishedEntries.length}
                </span>{' '}
                total updates
              </div>
              {publishedEntries.length > 0 &&
                publishedEntries[0]?.release_date ? <div>
                    Latest:{' '}
                    <time
                      dateTime={publishedEntries[0].release_date}
                      className={`${weight.medium} ${textColor.foreground}`}
                    >
                      {new Date(publishedEntries[0].release_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </time>
                  </div> : null}
            </div>
          </div>

          {/* WhatsNewSummary handles display logic internally and only shows content when recent updates exist */}
          <WhatsNewSummary
            entries={publishedEntries.map((entry) => ({
              slug: entry.slug,
              title: entry.title,
              release_date: entry.release_date,
              changes: entry.changes as Record<string, unknown>,
            }))}
            daysBack={7}
          />

          {/* Client-side filtered list */}
          <ChangelogListClient entries={publishedEntries} categoryCounts={categoryCounts} />
        </div>

        {/* Email CTA - Footer section (matching homepage pattern) */}
        <section className={`${marginX.auto} ${padding.xDefault} ${padding.ySection}`}>
          <NewsletterCTAVariant
            source="content_page"
            variant="hero"
            category="changelog"
          />
        </section>
      </>
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load changelog page');
    reqLogger.error('Failed to load changelog page', normalized, {
      section: 'data-fetch',
    });

    // Fallback UI on error
    return (
      <div className={`container ${maxWidth['6xl']} ${padding.yRelaxed}`}>
        <div className={spaceY.comfortable}>
          <h1 className={`${weight.bold} ${size['4xl']} ${tracking.tight}`}>Changelog</h1>
          <p className={muted.default}>
            Unable to load changelog entries. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}