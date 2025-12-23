'use client';

/**
 * SidebarToc - Supabase-style minimal Table of Contents for right sidebar
 *
 * Features:
 * - Minimal borderless design (no card wrapper)
 * - Left border indicator for active section
 * - Scroll-linked highlighting via IntersectionObserver
 * - Smooth scroll to section on click
 * - Respects prefers-reduced-motion
 *
 * Design inspired by Supabase docs "ON THIS PAGE" sidebar
 */

import { type ContentHeadingMetadata } from '@heyclaude/web-runtime/types/component.types';
import { useIsClient } from '@heyclaude/web-runtime/hooks/use-is-client';
import { useMultipleIntersectionObserver } from '@heyclaude/web-runtime/hooks/use-multiple-intersection-observer';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { cn } from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { normalizeHeadings, type NormalizedHeading } from './utils/normalize-headings';

interface SidebarTocProps {
  className?: string;
  headings?: ContentHeadingMetadata[] | null;
  /** Minimum headings required to render (default: 2) */
  minHeadings?: number;
}

/**
 * Renders a right-side, scroll-synced table of contents for a page with heading links.
 *
 * Renders nothing when the provided headings are fewer than `minHeadings`. Displays a hierarchical list of headings, highlights the active item based on scroll position or URL hash, and updates the URL hash when an item becomes active or is clicked. Clicking a heading scrolls to its section with smooth behavior unless the user prefers reduced motion.
 *
 * @param headings - Array of heading metadata to show in the TOC; may be null or undefined. Headings are normalized, deduplicated, and capped before rendering.
 * @param className - Optional additional CSS class names applied to the root nav element.
 * @param minHeadings - Minimum number of headings required to render the TOC; defaults to 2.
 * @returns The rendered navigation element containing the table of contents, or `null` when not rendered.
 *
 * @see normalizeHeadings
 * @see cn
 */
export function SidebarToc({ headings, className, minHeadings = 2 }: SidebarTocProps) {
  const normalizedHeadings = useMemo(() => normalizeHeadings(headings), [headings]);
  const [activeId, setActiveId] = useState<null | string>(null);
  const activeIdRef = useRef<null | string>(activeId);
  const isClient = useIsClient();
  const prefersReducedMotion = useReducedMotion();

  // Keep ref in sync with activeId state
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const baseLevel = useMemo(() => {
    if (normalizedHeadings.length === 0) return 2;
    return normalizedHeadings.reduce(
      (min: number, heading: NormalizedHeading) => Math.min(min, heading.level),
      6
    );
  }, [normalizedHeadings]);

  const updateHash = useCallback(
    (id: string) => {
      if (!isClient || !id) return;
      const { pathname, search } = window.location;
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash === id) return;
      const nextUrl = `${pathname}${search ? search : ''}#${id}`;
      window.history.replaceState(null, '', nextUrl);
    },
    [isClient]
  );

  // Initialize active heading from URL hash or first heading
  useEffect(() => {
    if (!isClient || normalizedHeadings.length === 0) {
      setActiveId(null);
      return;
    }

    const hash = window.location.hash.replace('#', '');
    if (hash && normalizedHeadings.some((heading: NormalizedHeading) => heading.id === hash)) {
      setActiveId(hash);
      return;
    }

    setActiveId(normalizedHeadings[0]?.id ?? null);
  }, [normalizedHeadings, isClient]);

  // Sync URL hash when active changes
  useEffect(() => {
    if (!activeId) return;
    updateHash(activeId);
  }, [activeId, updateHash]);

  // Use useMultipleIntersectionObserver hook for uniform implementation
  const { observeElements, entries } = useMultipleIntersectionObserver({
    rootMargin: '-20% 0px -60% 0px',
    threshold: [0, 0.25, 0.5, 0.75, 1],
  });

  // OPTIMIZATION: Defer intersection processing to avoid blocking main thread
  // Use requestAnimationFrame to batch intersection updates
  useEffect(() => {
    if (entries.size === 0) return;

    // Defer processing to next animation frame to avoid blocking scroll
    const rafId = requestAnimationFrame(() => {
      // Find most visible element (same logic as getMostVisibleId but computed here)
      const visibleEntries = Array.from(entries.values())
        .filter((entry) => entry.isIntersecting || entry.intersectionRatio > 0)
        .sort(
          (a, b) =>
            b.intersectionRatio - a.intersectionRatio ||
            a.boundingClientRect.top - b.boundingClientRect.top
        );

      if (visibleEntries.length > 0) {
        const firstEntry = visibleEntries[0];
        if (firstEntry) {
          const nextActiveId = firstEntry.target.id;
          if (nextActiveId && nextActiveId !== activeIdRef.current) {
            setActiveId(nextActiveId);
          }
        }
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [entries]);

  // Observe all heading elements
  useEffect(() => {
    if (!isClient || normalizedHeadings.length === 0) {
      return;
    }

    const elementIds = normalizedHeadings.map((heading: NormalizedHeading) => heading.id);
    observeElements(elementIds);
  }, [normalizedHeadings, isClient, observeElements]);

  const handleHeadingClick = useCallback(
    (heading: NormalizedHeading) => {
      if (!isClient) return;
      const element = document.getElementById(heading.id);
      if (!element) {
        updateHash(heading.id);
        return;
      }

      // Batch DOM read with scroll operation to avoid forced reflow
      // Use requestAnimationFrame to ensure layout is complete before reading
      requestAnimationFrame(() => {
        const offset = 96; // Account for sticky header
        // Read layout properties in same frame as scroll
        const top = window.scrollY + element.getBoundingClientRect().top - offset;

        window.scrollTo({
          top,
          behavior: prefersReducedMotion ? 'auto' : 'smooth',
        });
      });

      setActiveId(heading.id);
      updateHash(heading.id);
    },
    [updateHash, isClient, prefersReducedMotion]
  );

  // Don't render if not enough headings
  if (normalizedHeadings.length < minHeadings) {
    return null;
  }

  return (
    <nav className={cn('py-2', className)} aria-label="On this page">
      {/* Header - Supabase style uppercase */}
      <p className="text-muted-foreground text-xs-medium mb-2 tracking-wider uppercase">
        On this page
      </p>

      {/* Heading list with left border indicator */}
      <ul className="space-y-1.5">
        {normalizedHeadings.map((heading: NormalizedHeading) => {
          const depthOffset = Math.max(heading.level - baseLevel, 0);
          const isActive = activeId === heading.id;

          return (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => handleHeadingClick(heading)}
                className={cn(
                  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  'group relative w-full py-1.5 text-left text-base leading-snug transition-colors', // 13px
                  'hover:text-foreground',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
                style={{
                  paddingLeft: `${0.75 + depthOffset * 0.75}rem`,
                }}
                aria-current={isActive ? 'true' : undefined}
              >
                {/* Left border indicator */}
                <span
                  className={cn(
                    'absolute top-0 bottom-0 left-0 w-0.5 rounded-full transition-all duration-200',
                    isActive
                      ? 'bg-accent opacity-100'
                      : 'bg-border opacity-0 group-hover:opacity-50'
                  )}
                  aria-hidden="true"
                />
                <span className="line-clamp-2">{heading.title}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
