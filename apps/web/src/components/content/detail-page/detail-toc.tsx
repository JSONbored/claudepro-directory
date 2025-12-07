'use client';

import { ListTree } from '@heyclaude/web-runtime/icons';
import { type ContentHeadingMetadata } from '@heyclaude/web-runtime/types/component.types';
import { cn, STATE_PATTERNS } from '@heyclaude/web-runtime/ui';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface DetailTocProps {
  className?: string;
  headings?: ContentHeadingMetadata[] | null;
}

interface NormalizedHeading {
  anchor: string;
  id: string;
  level: number;
  title: string;
}

/**
 * Convert raw heading metadata into a deduplicated, normalized list suitable for rendering a table of contents.
 *
 * @param headings - Array of raw heading objects (or null/undefined). Each item is expected to contain `id`, `title`, and optionally `level` and `anchor`. Non-array inputs return an empty array.
 * @returns An array of NormalizedHeading objects: `id` and `title` are trimmed strings, `level` is rounded and clamped to the range 2–6 (default 2), `anchor` always begins with `#` (uses `#<id>` if missing), entries are unique by `id`, and the result contains at most 50 headings.
 *
 * @see NormalizedHeading
 * @see DetailToc
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

  const baseLevel = useMemo(() => {
    if (normalizedHeadings.length === 0) return 2;
    return normalizedHeadings.reduce((min, heading) => Math.min(min, heading.level), 6);
  }, [normalizedHeadings]);

  const updateHash = useCallback((id: string) => {
    if (globalThis.window === undefined || !id) return;
    const { pathname, search } = globalThis.location;
    const currentHash = globalThis.location.hash.replace('#', '');
    if (currentHash === id) return;
    const nextUrl = `${pathname}${search ? search : ''}#${id}`;
    globalThis.history.replaceState(null, '', nextUrl);
  }, []);

  useEffect(() => {
    if (globalThis.window === undefined || normalizedHeadings.length === 0) {
      setActiveId(null);
      return;
    }

    const hash = globalThis.location.hash.replace('#', '');
    if (hash && normalizedHeadings.some((heading) => heading.id === hash)) {
      setActiveId(hash);
      return;
    }

    setActiveId(normalizedHeadings[0]?.id ?? null);
  }, [normalizedHeadings]);

  useEffect(() => {
    if (!activeId) return;
    updateHash(activeId);
  }, [activeId, updateHash]);

  useEffect(() => {
    if (globalThis.window === undefined || normalizedHeadings.length === 0) {
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
            if (nextActiveId && nextActiveId !== activeId) {
              setActiveId(nextActiveId);
            }
          }
        }
      },
      {
        rootMargin: '-35% 0px -50% 0px',
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
  }, [normalizedHeadings, activeId]);

  const handleHeadingClick = useCallback(
    (heading: NormalizedHeading) => {
      if (globalThis.window === undefined) return;
      const element = document.getElementById(heading.id);
      if (!element) {
        updateHash(heading.id);
        return;
      }

      const prefersReducedMotion = globalThis.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      const offset = 96;
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
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListTree className="text-muted-foreground h-4 w-4" aria-hidden="true" />
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            On this page
          </p>
        </div>
        <span className="text-muted-foreground text-xs">{normalizedHeadings.length}</span>
      </div>

      <ul className="mt-4 space-y-1.5">
        {normalizedHeadings.map((heading) => {
          const depthOffset = Math.max(heading.level - baseLevel, 0);

          return (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => handleHeadingClick(heading)}
                className={cn(
                  STATE_PATTERNS.FOCUS_RING,
                  'w-full rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                  activeId === heading.id
                    ? 'bg-accent/15 text-foreground'
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                )}
                style={{
                  paddingLeft: depthOffset > 0 ? `${0.5 + depthOffset * 0.5}rem` : undefined,
                }}
                aria-current={activeId === heading.id ? 'true' : undefined}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
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