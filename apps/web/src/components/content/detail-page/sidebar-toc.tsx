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

import type { ContentHeadingMetadata } from '@heyclaude/web-runtime/types/component.types';
import { normalizeHeadings, type NormalizedHeading } from '@heyclaude/web-runtime/utils/heading-normalization';
import { cn } from '@heyclaude/web-runtime/ui';
import { focusRing } from '@heyclaude/web-runtime/design-system';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface SidebarTocProps {
  headings?: ContentHeadingMetadata[] | null;
  className?: string;
  /** Minimum headings required to render (default: 2) */
  minHeadings?: number;
}

/**
 * Render a right-side table of contents that highlights the currently visible section and enables in-page navigation.
 *
 * The component normalizes provided headings, keeps the active heading in sync with the URL hash and scroll position,
 * and scrolls smoothly (respecting reduced-motion) when a TOC entry is clicked.
 *
 * @param props.headings - Array of heading metadata (ContentHeadingMetadata) or `null`/`undefined`. Headings are normalized internally.
 * @param props.className - Optional additional class names to apply to the root nav container.
 * @param props.minHeadings - Minimum number of headings required to render the TOC (default: 2).
 *
 * @returns A navigation element containing the page table of contents, or `null` if the number of headings is below `minHeadings`.
 *
 * @see normalizeHeadings
 * @see NormalizedHeading
 */
export function SidebarToc({ headings, className, minHeadings = 2 }: SidebarTocProps) {
  const normalizedHeadings = useMemo(() => normalizeHeadings(headings), [headings]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeIdRef = useRef<string | null>(activeId);

  // Keep ref in sync with activeId state
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const baseLevel = useMemo(() => {
    if (normalizedHeadings.length === 0) return 2;
    return normalizedHeadings.reduce((min, heading) => Math.min(min, heading.level), 6);
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
    if (hash && normalizedHeadings.some((heading) => heading.id === hash)) {
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
      .map((heading) => document.getElementById(heading.id))
      .filter((el): el is HTMLElement => el !== null);

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

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
        On this page
      </p>

      {/* Heading list with left border indicator */}
      <ul className="space-y-0.5">
        {normalizedHeadings.map((heading) => {
          const depthOffset = Math.max(heading.level - baseLevel, 0);
          const isActive = activeId === heading.id;

          return (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => handleHeadingClick(heading)}
                className={cn(
                  focusRing.default,
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