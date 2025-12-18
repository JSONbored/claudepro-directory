'use client';

import { ListTree } from '@heyclaude/web-runtime/icons';
import { type ContentHeadingMetadata } from '@heyclaude/web-runtime/types/component.types';
import { useIsClient } from '@heyclaude/web-runtime/hooks/use-is-client';
import { useMultipleIntersectionObserver } from '@heyclaude/web-runtime/hooks/use-multiple-intersection-observer';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { cn } from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { normalizeHeadings, type NormalizedHeading } from './utils/normalize-headings';

interface DetailTocProps {
  className?: string;
  headings?: ContentHeadingMetadata[] | null;
}

/**
 * Renders a table-of-contents navigation that highlights the currently visible section and lets users jump to headings.
 *
 * The component normalizes the provided headings, observes document headings to keep the active entry in sync with scroll position,
 * updates the URL hash without adding history entries, and scrolls smoothly to targets when items are clicked (honoring reduced-motion).
 *
 * @param props.headings - Array of heading metadata to build the TOC from (may be null or undefined). If fewer than 3 normalized headings are available, nothing is rendered.
 * @param props.className - Optional additional CSS classes applied to the root nav element.
 * @returns A nav element containing the table of contents, or `null` when there are fewer than three headings.
 *
 * @see normalizeHeadings
 */
export function DetailToc({ headings, className }: DetailTocProps) {
  const normalizedHeadings = useMemo(() => normalizeHeadings(headings), [headings]);
  const [activeId, setActiveId] = useState<null | string>(null);
  const isClient = useIsClient();
  const prefersReducedMotion = useReducedMotion();

  const baseLevel = useMemo(() => {
    if (normalizedHeadings.length === 0) return 2;
    return normalizedHeadings.reduce((min, heading) => Math.min(min, heading.level), 6);
  }, [normalizedHeadings]);

  const updateHash = useCallback((id: string) => {
    if (!isClient || !id) return;
    const { pathname, search } = window.location;
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash === id) return;
    const nextUrl = `${pathname}${search ? search : ''}#${id}`;
    window.history.replaceState(null, '', nextUrl);
  }, [isClient]);

  useEffect(() => {
    if (!isClient || normalizedHeadings.length === 0) {
      setActiveId(null);
      return;
    }

    const hash = window.location.hash.replace('#', '');
    if (hash && normalizedHeadings.some((heading) => heading.id === hash)) {
      setActiveId(hash);
      return;
    }

    setActiveId(normalizedHeadings[0]?.id ?? null);
  }, [normalizedHeadings, isClient]);

  useEffect(() => {
    if (!activeId) return;
    updateHash(activeId);
  }, [activeId, updateHash]);

  const activeIdRef = useRef<null | string>(activeId);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  // Use useMultipleIntersectionObserver hook for uniform implementation
  const { observeElements, entries } = useMultipleIntersectionObserver({
    rootMargin: '-35% 0px -50% 0px',
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

    const elementIds = normalizedHeadings.map((heading) => heading.id);
    observeElements(elementIds);
  }, [normalizedHeadings, isClient, observeElements]);

  const handleHeadingClick = useCallback(
    (heading: NormalizedHeading) => {
      if (!isClient || typeof document === 'undefined') return;
      const element = document.getElementById(heading.id);
      if (!element) {
        updateHash(heading.id);
        return;
      }

      // Batch DOM read with scroll operation to avoid forced reflow
      // Use requestAnimationFrame to ensure layout is complete before reading
      requestAnimationFrame(() => {
        const offset = 96;
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

  if (normalizedHeadings.length < 3) {
    return null;
  }

  return (
    <nav
      className={cn(
        'border-border/60 bg-card/70 rounded-2xl border p-4 shadow-sm backdrop-blur',
        'lg:sticky lg:top-28',
        className
      )}
      aria-label="On this page"
    >
      <div className={cn('flex items-center justify-between', 'gap-2')}>
        <div className="flex items-center gap-1.5">
          <ListTree className={cn('text-muted-foreground', 'h-4 w-4')} aria-hidden="true" />
          <p className={cn('text-muted-foreground', 'text-xs', 'font-semibold', 'tracking-wide', 'uppercase')}>
            On this page
          </p>
        </div>
        <span className={cn('text-muted-foreground', 'text-xs')}>{normalizedHeadings.length}</span>
      </div>

      <ul className={cn('mt-4', 'space-y-1.5')}>
        {normalizedHeadings.map((heading) => {
          const depthOffset = Math.max(heading.level - baseLevel, 0);

          return (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => handleHeadingClick(heading)}
                className={cn(
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'w-full rounded-md', 'px-3', 'py-1.5', 'text-left text-sm transition-colors',
                  activeId === heading.id
                    ? 'bg-accent/15 text-foreground'
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                )}
                style={{
                  paddingLeft: depthOffset > 0 ? `${0.5 + depthOffset * 0.5}rem` : undefined,
                }}
                aria-current={activeId === heading.id ? 'true' : undefined}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'h-6 w-6', 'rounded-full',
                      activeId === heading.id ? 'bg-primary' : 'bg-muted-foreground/50'
                    )}
                  />
                  <span className="truncate">{heading.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}