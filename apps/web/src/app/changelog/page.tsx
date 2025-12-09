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
import { APP_CONFIG, QUERY_LIMITS } from '@heyclaude/web-runtime/data/config/constants';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { cacheLife } from 'next/cache';
import { Suspense } from 'react';

import { StructuredData } from '@/src/components/core/infra/structured-data';
import { ChangelogContentSkeleton } from '@/src/components/features/changelog/changelog-content-skeleton';
import { ChangelogTimelineView } from '@/src/components/features/changelog/changelog-timeline-view';

/**
 * Generate page metadata for the /changelog route, including RSS and Atom feed alternates.
 *
 * If metadata generation fails, returns a sensible fallback metadata object with a default
 * title and description while preserving the feed alternates.
 *
 * @returns Page metadata for the changelog route. `alternates.types` contains
 *          `application/rss+xml` and `application/atom+xml` entries pointing to the site's feed URLs.
 *
 * @see generatePageMetadata
 * @see APP_CONFIG
 */
export async function generateMetadata(): Promise<Metadata> {
  // Create request-scoped child logger
  const metadataLogger = logger.child({
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
    metadataLogger.error(
      {
        err: normalized,
        section: 'metadata-generation',
      },
      'Failed to generate changelog metadata'
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
 * Render the Changelog page with a static header and a Suspense-wrapped timeline that streams changelog content.
 *
 * This server component awaits a server connection to establish a request-scoped logger, then renders page
 * structured data, a header matching the site template, and a Suspense boundary that loads changelog entries
 * via the server-side ChangelogContentWithData component so the timeline can stream progressively.
 *
 * @returns A React element containing the page layout, header, and a Suspense-wrapped changelog timeline.
 *
 * @see getChangelogOverview
 * @see ChangelogContentWithData
 * @see ChangelogContentSkeleton
 * @see StructuredData
 */
export default function ChangelogPage() {
  'use cache';
  cacheLife('static'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  // Create request-scoped child logger
  const reqLogger = logger.child({
    operation: 'ChangelogPage',
    route: '/changelog',
    module: 'apps/web/src/app/changelog',
  });

  return (
    <>
      <StructuredData route="/changelog" />

      <div className="bg-background relative min-h-screen">
        {/* Header - EXACTLY matches Magic UI template */}
        <div className="border-border/50 border-b">
          <div className="relative mx-auto max-w-5xl">
            <div className="flex items-center justify-between p-3">
              <h1 className="text-3xl font-semibold tracking-tight">Changelog</h1>
              {/* ThemeToggle would go here if we had it */}
            </div>
          </div>
        </div>

        {/* Timeline - EXACTLY matches Magic UI template */}
        <Suspense fallback={<ChangelogContentSkeleton />}>
          <ChangelogContentWithData reqLogger={reqLogger} />
        </Suspense>
      </div>
    </>
  );
}

/**
 * Fetches published changelog entries server-side, normalizes fields, sorts them by release date (newest first), and renders the changelog timeline or an error card.
 *
 * Performs server-side data loading intended to be used inside a Suspense boundary; normalizes `keywords` and `contributors` to never be null and transforms overview entries to match the frontend changelog row schema before rendering.
 *
 * @param reqLogger - Request-scoped logger used to record errors during data fetching
 * @param reqLogger.reqLogger
 * @returns JSX element containing the changelog timeline populated with sorted entries, or an error card if loading fails
 *
 * @see getChangelogOverview
 * @see ChangelogTimelineView
 */
async function ChangelogContentWithData({
  reqLogger,
}: {
  reqLogger: ReturnType<typeof logger.child>;
}) {
  // Fetch data outside JSX construction - handle errors before rendering
  let sortedEntries: Database['public']['Tables']['changelog']['Row'][] = [];
  let hasError = false;

  try {
    // Load changelog overview with entries, metadata, and featured (database-cached)
    // This replaces getAllChangelogEntries() + client-side category counting
    const overview = await getChangelogOverview({
      publishedOnly: true, // Only get published entries
      limit: QUERY_LIMITS.changelog.max,
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

    // Sort entries by date (newest first) - EXACTLY matches Magic UI template
    sortedEntries = [...publishedEntries].toSorted((a, b) => {
      const dateA = new Date(a.release_date).getTime();
      const dateB = new Date(b.release_date).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load changelog content');
    reqLogger.error(
      {
        section: 'data-fetch',
        err: normalized,
      },
      'Failed to load changelog content'
    );
    hasError = true;
  }

  // Return JSX outside try/catch - errors are handled above
  if (hasError) {
    return (
      <div className="border-border bg-card/50 overflow-hidden rounded-lg border p-4 shadow-sm backdrop-blur-sm sm:p-6">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Changelog</h2>
          <p className="text-muted-foreground">
            Unable to load changelog entries. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pt-10 lg:px-10">
      <div className="relative">
        <ChangelogTimelineView entries={sortedEntries} />
      </div>
    </div>
  );
}
