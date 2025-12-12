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

import { type Database } from '@heyclaude/database-types';
import { useInfiniteScroll } from '@heyclaude/web-runtime/hooks';
import { getChangelogPath } from '@heyclaude/web-runtime/utils/changelog';
import Link from 'next/link';

import { ChangelogContent } from './changelog-content';

type ChangelogEntry = Database['public']['Tables']['changelog']['Row'];


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
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
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
                <div className="md:sticky md:top-8 pb-10">
                  <time className="text-sm font-medium text-muted-foreground block mb-3">
                    {formattedDate}
                  </time>

                  {version && (
                    <div className="inline-flex relative z-10 items-center justify-center w-10 h-10 text-foreground border border-border rounded-lg text-sm font-bold">
                      {version}
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Content */}
              <div className="flex-1 md:pl-8 relative pb-10">
                {/* Vertical timeline line */}
                <div className="hidden md:block absolute top-2 left-0 w-px h-full bg-border">
                  {/* Timeline dot */}
                  <div className="hidden md:block absolute -translate-x-1/2 size-3 bg-primary rounded-full z-10" />
                </div>

                <div className="space-y-6">
                  <div className="relative z-10 flex flex-col gap-2">
                    <Link
                      href={getChangelogPath(entry.slug)}
                      className="block hover:text-primary transition-colors"
                    >
                      <h2 className="text-2xl font-semibold tracking-tight text-balance">
                        {entry.title}
                      </h2>
                    </Link>

                    {/* Tags */}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="h-6 w-fit px-2 text-xs font-medium bg-muted text-muted-foreground rounded-full border flex items-center justify-center"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="prose dark:prose-invert max-w-none prose-headings:scroll-mt-8 prose-headings:font-semibold prose-a:no-underline prose-headings:tracking-tight prose-headings:text-balance prose-p:tracking-tight prose-p:text-balance">
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
