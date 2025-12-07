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
import { cn, STATE_PATTERNS } from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface SidebarTocProps {
  className?: string;
  headings?: ContentHeadingMetadata[] | null;
  /** Minimum headings required to render (default: 2) */
  minHeadings?: number;
}

interface NormalizedHeading {
  anchor: string;
  id: string;
  level: number;
  title: string;
}

/**
 * Normalize and sanitize an array of heading metadata for rendering in the table of contents.
 *
 * Processes the input list by trimming title/id strings, skipping invalid entries, deduplicating by `id`,
 * clamping heading `level` to the range 2–6 (default 2), ensuring each heading has an `anchor` that begins with `#`
 * (falling back to `#id`), and limiting the result to the first 50 unique headings.
 *
 * @param headings - Array of heading metadata objects to normalize; may be `null` or `undefined`.
 * @returns An array of `NormalizedHeading` objects ready for use in the sidebar TOC.
 */
function normalizeHeadings(
  headings: ContentHeadingMetadata[] | null | undefined
): NormalizedHeading[] {
  if (!Array.isArray(headings)) return [];

  const deduped = new Map<string, NormalizedHeading>();

  for (const heading of headings) {
    if (!heading || typeof heading !== 'object') continue;
    const rawId = typeof heading.id === 'string' ? heading.id.trim() : '';
    const rawTitle = typeof heading.title === 'string' ? heading.title.trim() : '';

    if (!(rawId && rawTitle)) continue;

    if (deduped.has(rawId)) {
      continue;
    }

    const level =
      typeof heading.level === 'number' && Number.isFinite(heading.level)
        ? Math.min(Math.max(Math.round(heading.level), 2), 6)
        : 2;

    const anchor =
      typeof heading.anchor === 'string' && heading.anchor.startsWith('#')
        ? heading.anchor
        : `#${rawId}`;

    deduped.set(rawId, {
      id: rawId,
      anchor,
      level,
      title: rawTitle,
    });

    if (deduped.size >= 50) {
      break;
    }
  }

  return [...deduped.values()];
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
 * @see STATE_PATTERNS
 * @see cn
 */
export function SidebarToc({ headings, className, minHeadings = 2 }: SidebarTocProps) {
  const normalizedHeadings = useMemo(() => normalizeHeadings(headings), [headings]);
  const [activeId, setActiveId] = useState<null | string>(null);
  const activeIdRef = useRef<null | string>(activeId);

  // Keep ref in sync with activeId state
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const baseLevel = useMemo(() => {
    if (normalizedHeadings.length === 0) return 2;
    return normalizedHeadings.reduce((min: number, heading: NormalizedHeading) => Math.min(min, heading.level), 6);
  }, [normalizedHeadings]);

  const updateHash = useCallback((id: string) => {
    if (typeof window === 'undefined' || !id) return;
    const { pathname, search } = window.location;
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash === id) return;
    const nextUrl = `${pathname}${search ? search : ''}#${id}`;
    window.history.replaceState(null, '', nextUrl);
  }, []);

  // Initialize active heading from URL hash or first heading
  useEffect(() => {
    if (typeof window === 'undefined' || normalizedHeadings.length === 0) {
      setActiveId(null);
      return;
    }

    const hash = window.location.hash.replace('#', '');
    if (hash && normalizedHeadings.some((heading: NormalizedHeading) => heading.id === hash)) {
      setActiveId(hash);
      return;
    }

    setActiveId(normalizedHeadings[0]?.id ?? null);
  }, [normalizedHeadings]);

  // Sync URL hash when active changes
  useEffect(() => {
    if (!activeId) return;
    updateHash(activeId);
  }, [activeId, updateHash]);

  // IntersectionObserver for scroll-linked highlighting
  useEffect(() => {
    if (typeof window === 'undefined' || normalizedHeadings.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
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
            // Use ref to avoid stale closure
            if (nextActiveId && nextActiveId !== activeIdRef.current) {
              setActiveId(nextActiveId);
            }
          }
        }
      },
      {
        rootMargin: '-20% 0px -60% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    const elements = normalizedHeadings
      .map((heading: NormalizedHeading) => document.getElementById(heading.id))
      .filter((el: HTMLElement | null): el is HTMLElement => el !== null);

    for (const el of elements) {
      observer.observe(el);
    }

    return () => observer.disconnect();
  }, [normalizedHeadings]);

  const handleHeadingClick = useCallback(
    (heading: NormalizedHeading) => {
      if (typeof window === 'undefined') return;
      const element = document.getElementById(heading.id);
      if (!element) {
        updateHash(heading.id);
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      const offset = 96; // Account for sticky header
      const top = window.scrollY + element.getBoundingClientRect().top - offset;

      window.scrollTo({
        top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });

      setActiveId(heading.id);
      updateHash(heading.id);
    },
    [updateHash]
  );

  // Don't render if not enough headings
  if (normalizedHeadings.length < minHeadings) {
    return null;
  }

  return (
    <nav className={cn('py-2', className)} aria-label="On this page">
      {/* Header - Supabase style uppercase */}
      <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wider uppercase">
        On this page
      </p>

      {/* Heading list with left border indicator */}
      <ul className="space-y-0.5">
        {normalizedHeadings.map((heading: NormalizedHeading) => {
          const depthOffset = Math.max(heading.level - baseLevel, 0);
          const isActive = activeId === heading.id;

          return (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => handleHeadingClick(heading)}
                className={cn(
                  STATE_PATTERNS.FOCUS_RING,
                  'group relative w-full py-1.5 text-left text-[13px] leading-snug transition-colors',
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