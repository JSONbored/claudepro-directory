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
import { generateRequestId, logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { StructuredData } from '@/src/components/core/infra/structured-data';
import { ChangelogContentSkeleton } from '@/src/components/features/changelog/changelog-content-skeleton';
import { ChangelogTimelineView } from '@/src/components/features/changelog/changelog-timeline-view';

/**
 * ISR: 1 hour (3600s) - Changelog list updates periodically
 * Uses ISR for better performance while keeping content fresh
 */

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
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate requestId for metadata generation (separate from page render, after connection() to allow Date.now())
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
 * Render the Changelog page using Suspense boundaries for streaming content.
 *
 * Architecture:
 * - Header and breadcrumbs render immediately (static)
 * - Changelog content streams in via Suspense boundary
 * - Background container styling matches consulting page pattern
 * - Uses Suspense instead of loading.tsx for better granular control
 *
 * Server-side behavior:
 * - Fetches changelog overview via getChangelogOverview with publishedOnly=true.
 * - Uses server-side data to populate the client list and category counts.
 * - Page is intended to be served with ISR (revalidation configured at the file level).
 *
 * @returns A React element representing the changelog page with Suspense boundaries.
 *
 * @see getChangelogOverview
 * @see ChangelogListClient
 * @see ChangelogContentSkeleton
 * @see StructuredData
 */
export default async function ChangelogPage() {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Generate single requestId for this page request (after connection() to allow Date.now())
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
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
 * Server component that fetches changelog data and renders the content.
 *
 * Wrapped in Suspense to allow streaming. Renders stats and changelog list
 * inside a background container matching the consulting page pattern.
 *
 * @param reqLogger - Request-scoped logger for error tracking
 * @returns The changelog content with stats and list
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

    // Sort entries by date (newest first) - EXACTLY matches Magic UI template
    sortedEntries = [...publishedEntries].sort((a, b) => {
      const dateA = new Date(a.release_date).getTime();
      const dateB = new Date(b.release_date).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to load changelog content');
    reqLogger.error('Failed to load changelog content', normalized, {
      section: 'data-fetch',
    });
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
