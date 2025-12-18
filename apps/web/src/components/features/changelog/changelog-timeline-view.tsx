/**
 * Changelog Timeline View Component
 *
 * Two-column timeline layout with sticky scroll behavior.
 * Left column: Sticky timeline markers that stack as you scroll
 * Right column: Full changelog content for each entry
 *
 * Database-first: All content comes from database entries.
 */

'use client';

import type { changelogModel } from '@heyclaude/data-layer/prisma';
import { useInfiniteScroll } from '@heyclaude/web-runtime/hooks';
import { getChangelogPath } from '@heyclaude/web-runtime/utils/changelog';
import Link from 'next/link';

import { ChangelogContent } from './changelog-content';

type ChangelogEntry = changelogModel;


interface ChangelogTimelineViewProps {
  entries: ChangelogEntry[];
}

/**
 * Render a two-column changelog timeline with sticky left-side markers and scroll-linked content sections.
 *
 * The component displays timeline markers (hidden on small screens) and corresponding changelog content sections;
 * it tracks which section is currently prominent using IntersectionObserver and highlights the matching marker.
 * Clicking a marker smoothly scrolls the associated content section into view.
 *
 * @param entries - Ordered array of changelog entries used to render timeline markers and their corresponding content sections.
 *
 * @see ChangelogContent
 */
export function ChangelogTimelineView({ entries }: ChangelogTimelineViewProps) {
  // Lazy loading: Only render first 10 entries initially, load more on scroll
  const { displayCount, sentinelRef } = useInfiniteScroll({
    totalItems: entries.length,
    batchSize: 10,
    rootMargin: '800px', // Load 800px before viewport
  });

  const displayedEntries = entries.slice(0, displayCount);

  // Format date helper - EXACTLY matches Magic UI template format
  // Handle both Date objects (from Prisma) and string dates (from RPC)
  const formatDate = (date: Date | string): string => {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Extract tags from entry (if available in metadata or keywords)
  const getTags = (entry: ChangelogEntry): string[] => {
    // Try to get tags from metadata first
    if (entry.metadata && typeof entry.metadata === 'object' && 'tags' in entry.metadata) {
      const tags = (entry.metadata as { tags?: string[] }).tags;
      if (Array.isArray(tags)) return tags;
    }
    // Fallback to keywords if available
    if (Array.isArray(entry.keywords) && entry.keywords.length > 0) {
      return entry.keywords;
    }
    return [];
  };

  // Extract version from entry (if available in metadata)
  const getVersion = (entry: ChangelogEntry): string | null => {
    if (entry.metadata && typeof entry.metadata === 'object' && 'version' in entry.metadata) {
      const version = (entry.metadata as { version?: string }).version;
      if (typeof version === 'string') return version;
    }
    return null;
  };

  return (
    <>
      {displayedEntries.map((entry) => {
        const date = new Date(entry.release_date);
        const formattedDate = formatDate(date);
        const tags = getTags(entry);
        const version = getVersion(entry);

        return (
          <div key={entry.slug} className="relative">
            <div className="flex flex-col md:flex-row gap-y-6">
              <div className="md:w-48 flex-shrink-0">
                <div className="md:sticky md:top-8 pb-4">
                  <time className="mb-2 block text-muted-foreground text-sm font-medium">
                    {formattedDate}
                  </time>

                  {version && (
                    <div className="relative z-10 inline-flex h-10 w-10 items-center justify-center card-base border-border text-sm font-bold text-foreground">
                      {version}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Content */}
              <div className="relative flex-1 pb-4 md:pl-8">
                {/* Vertical timeline line */}
                <div className="absolute left-0 top-2 hidden h-full w-px bg-border md:block">
                  {/* Timeline dot */}
                  <div className="absolute z-10 size-3 -translate-x-1/2 rounded-full bg-primary md:block" />
                </div>

                <div className="space-y-6">
                  <div className="relative z-10 flex flex-col gap-1">
                    <Link
                      href={getChangelogPath(entry.slug)}
                      className="block transition-colors hover:text-primary"
                    >
                      <h2 className="text-balance text-2xl font-semibold tracking-tight">
                        {entry.title}
                      </h2>
                    </Link>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="flex h-6 w-fit items-center justify-center rounded-full border bg-muted px-1 text-xs-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="prose max-w-none prose-headings:scroll-mt-8 prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-balance prose-p:tracking-tight prose-p:text-balance prose-a:no-underline dark:prose-invert">
                    <ChangelogContent entry={entry} hideHeader={true} onHeaderRef={() => {}} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Sentinel for infinite scroll - Load more entries when this comes into view */}
      {displayCount < entries.length && (
        <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true" />
      )}
    </>
  );
}
