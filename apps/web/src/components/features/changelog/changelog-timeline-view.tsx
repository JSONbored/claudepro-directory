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

import type { Database } from '@heyclaude/database-types';
import { sanitizeSlug } from '@heyclaude/web-runtime/core';
import { useEffect, useRef, useState } from 'react';
import { ChangelogContent } from './changelog-content';
import { TimelineMarker } from './timeline-marker';

type ChangelogEntry = Database['public']['Tables']['changelog']['Row'];

/**
 * Validates a changelog slug according to the project's allowed format.
 *
 * @param slug - The slug to validate; must be 3–100 characters long and use only lowercase letters (`a–z`), digits (`0–9`), or hyphens (`-`).
 * @returns `true` if `slug` meets the length and character constraints, `false` otherwise.
 *
 * @see getSafeChangelogPath
 * @see isValidInternalPath
 */
function isValidChangelogSlug(slug: string): boolean {
  if (typeof slug !== 'string' || slug.length < 3 || slug.length > 100) return false;
  return /^[a-z0-9-]+$/.test(slug);
}

/**
 * Determine whether a string is a safe internal URL path suitable for in-app navigation.
 *
 * Accepts paths that start with a single leading slash and contain only common URL path/query/fragment characters.
 *
 * @param path - The candidate internal path to validate (e.g., `/changelog/my-entry`).
 * @returns `true` if the path is a well-formed internal path starting with `/`, `false` otherwise.
 *
 * @see getSafeChangelogPath
 * @see isValidChangelogSlug
 */
function isValidInternalPath(path: string): boolean {
  if (typeof path !== 'string' || path.length === 0) return false;
  if (!path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  // Protocol check removed as redundant: paths starting with / cannot match protocol patterns (javascript:, data:, etc.)
  return /^\/[a-zA-Z0-9/?#\-_.~!*'();:@&=+$,%[\]]*$/.test(path);
}

/**
 * Produce a safe internal changelog path for a given slug.
 *
 * @param slug - The candidate changelog slug (may be null or undefined).
 * @returns The internal path `/changelog/{sanitized-slug}` if the slug is valid and safe, `null` otherwise.
 *
 * @see isValidChangelogSlug
 * @see isValidInternalPath
 * @see sanitizeSlug
 */
function getSafeChangelogPath(slug: string | null | undefined): string | null {
  if (!slug || typeof slug !== 'string') return null;
  if (!isValidChangelogSlug(slug)) return null;
  const sanitized = sanitizeSlug(slug).toLowerCase();
  if (!isValidChangelogSlug(sanitized) || sanitized.length === 0) return null;
  const url = `/changelog/${sanitized}`;
  if (!isValidInternalPath(url)) return null;
  return url;
}

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
 * @see TimelineMarker
 * @see getSafeChangelogPath
 */
export function ChangelogTimelineView({ entries }: ChangelogTimelineViewProps) {
  const [activeSlug, setActiveSlug] = useState<string | null>(entries[0]?.slug ?? null);
  const contentRefs = useRef<Map<string, HTMLElement>>(new Map());
  const observerRefs = useRef<Map<string, IntersectionObserver>>(new Map());

  // Set up Intersection Observer for each content section
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Clean up existing observers
    observerRefs.current.forEach((observer) => observer.disconnect());
    observerRefs.current.clear();

    // Create observers for each entry
    entries.forEach((entry) => {
      const element = contentRefs.current.get(entry.slug);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([intersectionEntry]) => {
          if (intersectionEntry?.isIntersecting) {
            // Calculate which section is most visible
            const rect = intersectionEntry.boundingClientRect;
            const viewportHeight = window.innerHeight;
            const visibilityRatio = Math.max(
              0,
              Math.min(1, (viewportHeight - Math.max(0, -rect.top)) / viewportHeight)
            );

            // Only update if this section is significantly visible (at least 20% from top)
            if (visibilityRatio > 0.2) {
              setActiveSlug(entry.slug);
            }
          }
        },
        {
          rootMargin: '-20% 0px -70% 0px', // Trigger when 20% from top
          threshold: [0, 0.25, 0.5, 0.75, 1],
        }
      );

      observer.observe(element);
      observerRefs.current.set(entry.slug, observer);
    });

    // Cleanup on unmount
    return () => {
      observerRefs.current.forEach((observer) => observer.disconnect());
      observerRefs.current.clear();
    };
  }, [entries]);

  // Scroll to content handler
  const scrollToContent = (slug: string) => {
    const element = contentRefs.current.get(slug);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Set ref for content section
  const setContentRef = (slug: string) => (element: HTMLElement | null) => {
    if (element) {
      contentRefs.current.set(slug, element);
    } else {
      contentRefs.current.delete(slug);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr] md:gap-8 lg:gap-12">
      {/* Timeline Column (Left) - Minimal design */}
      <div className="relative hidden md:block">
        {/* Vertical timeline line - Subtle */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-border/40" aria-hidden="true" />

        {/* Timeline markers */}
        <div className="relative pl-8">
          {entries.map((entry) => {
            const targetPath = getSafeChangelogPath(entry.slug);
            if (!targetPath) return null;

            return (
              <TimelineMarker
                key={entry.slug}
                entry={entry}
                isActive={activeSlug === entry.slug}
                targetPath={targetPath}
                onClick={() => scrollToContent(entry.slug)}
              />
            );
          })}
        </div>
      </div>

      {/* Content Column (Right) - Aligned with timeline markers */}
      <div className="space-y-0">
        {entries.map((entry) => (
          <section
            key={entry.slug}
            id={`changelog-entry-${entry.slug}`}
            ref={setContentRef(entry.slug)}
            className="scroll-mt-24 pt-6 md:pt-8 pb-12 md:pb-20 border-b border-border/20 last:border-b-0 last:pb-0"
          >
            <ChangelogContent entry={entry} hideHeader={true} />
          </section>
        ))}
      </div>
    </div>
  );
}