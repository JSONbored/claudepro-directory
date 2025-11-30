'use client';

import { ListTree } from '@heyclaude/web-runtime/icons';
import type { ContentHeadingMetadata } from '@heyclaude/web-runtime/types/component.types';
import { normalizeHeadings, type NormalizedHeading } from '@heyclaude/web-runtime/utils/heading-normalization';
import { cn } from '@heyclaude/web-runtime/ui';
import { focusRing } from '@heyclaude/web-runtime/design-system';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface DetailTocProps {
  headings?: ContentHeadingMetadata[] | null;
  className?: string;
}

export function DetailToc({ headings, className }: DetailTocProps) {
  const normalizedHeadings = useMemo(() => normalizeHeadings(headings), [headings]);
  const [activeId, setActiveId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!activeId) return;
    updateHash(activeId);
  }, [activeId, updateHash]);

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
      if (typeof window === 'undefined') return;
      const element = document.getElementById(heading.id);
      if (!element) {
        updateHash(heading.id);
        return;
      }

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
        'rounded-2xl border border-border/60 bg-card/70 p-4 shadow-sm backdrop-blur',
        'lg:sticky lg:top-28',
        className
      )}
      aria-label="On this page"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ListTree className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <p className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
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
                  focusRing.default,
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
