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

import { type changelogModel } from '@heyclaude/data-layer/prisma';
import { generatePageMetadata } from '@heyclaude/web-runtime/seo';
import { getChangelogOverview } from '@heyclaude/web-runtime/data/changelog';
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
  'use cache';
  // Create request-scoped child logger
  const metadataLogger = logger.child({
    module: 'apps/web/src/app/changelog',
    operation: 'ChangelogPageMetadata',
    route: '/changelog',
  });

  try {
    const baseMetadata = await generatePageMetadata('/changelog');

    // Add RSS/Atom feed discovery links
    return {
      ...baseMetadata,
      alternates: {
        types: {
          'application/atom+xml': `${APP_CONFIG.url}/changelog/atom.xml`,
          'application/rss+xml': `${APP_CONFIG.url}/changelog/rss.xml`,
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
      alternates: {
        types: {
          'application/atom+xml': `${APP_CONFIG.url}/changelog/atom.xml`,
          'application/rss+xml': `${APP_CONFIG.url}/changelog/rss.xml`,
        },
      },
      description: 'Track all updates, features, and improvements to Claude Pro Directory.',
      title: 'Changelog - Claude Pro Directory',
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
export default async function ChangelogPage() {
  'use cache';
  cacheLife('long'); // 1 day stale, 6hr revalidate, 30 days expire - Low traffic, content rarely changes

  // Create request-scoped child logger
  const reqLogger = logger.child({
    module: 'apps/web/src/app/changelog',
    operation: 'ChangelogPage',
    route: '/changelog',
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
  let sortedEntries: changelogModel[] = [];
  let hasError = false;

  try {
    // Load changelog overview with entries, metadata, and featured (database-cached)
    // This replaces getAllChangelogEntries() + client-side category counting
    const overview = await getChangelogOverview({
      limit: QUERY_LIMITS.changelog.max,
      offset: 0,
      publishedOnly: true, // Only get published entries
    });

    // Database returns nullable array - ensure it's always an array
    // filter_jobs_result.jobs is jobs[] (nullable), changelog_overview_result.entries is changelog_overview_entry[] (nullable)
    const entriesArray = overview && Array.isArray(overview.entries) ? overview.entries : [];

    // Convert RPC return data (string dates) to Prisma types (Date objects)
    // RPC returns CompositeType (changelog_overview_entry) with string dates
    // Prisma expects Date objects for timestamps
    // changelog_overview_entry has keywords but not contributors, so we default contributors to []
    const publishedEntries = entriesArray.map((entry) => {
      // keywords is already text[] in database (may be null in overview)
      // contributors is not in changelog_overview_entry, so default to []
      const keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
      const contributors: string[] = [];

      return {
        ...entry,
        canonical_url: null,
        changes: entry.changes ?? {},
        commit_count: null,
        content: entry.content ?? '',
        contributors,
        created_at: new Date(entry.created_at ?? ''),
        git_commit_sha: null,
        json_ld: null,
        keywords,
        og_image: null,
        og_type: null,
        release_date: entry.release_date ? new Date(entry.release_date) : new Date(),
        robots_follow: null,
        robots_index: null,
        seo_description: entry.seo_description ?? null,
        seo_title: entry.seo_title ?? null,
        source: null,
        twitter_card: null,
        updated_at: new Date(entry.updated_at ?? ''),
      } as changelogModel;
    });

    // Sort entries by date (newest first) - EXACTLY matches Magic UI template
    sortedEntries = [...publishedEntries].toSorted((a, b) => {
      const dateA =
        a.release_date instanceof Date
          ? a.release_date.getTime()
          : new Date(a.release_date).getTime();
      const dateB =
        b.release_date instanceof Date
          ? b.release_date.getTime()
          : new Date(b.release_date).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load changelog content');
    reqLogger.error(
      {
        err: normalized,
        section: 'data-fetch',
      },
      'Failed to load changelog content'
    );
    hasError = true;
  }

  // Return JSX outside try/catch - errors are handled above
  if (hasError) {
    return (
      <div className="border-border bg-card/50 card-base overflow-hidden p-4 shadow-sm backdrop-blur-sm sm:p-6">
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
    <div className="mx-auto max-w-5xl px-6 pt-6 lg:px-4">
      <div className="relative">
        <ChangelogTimelineView entries={sortedEntries} />
      </div>
    </div>
  );
}
