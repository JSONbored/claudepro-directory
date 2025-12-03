'use client';

import { ListTree } from '@heyclaude/web-runtime/icons';
import type { ContentHeadingMetadata } from '@heyclaude/web-runtime/types/component.types';
import { normalizeHeadings, type NormalizedHeading } from '@heyclaude/web-runtime/utils/heading-normalization';
import { cn } from '@heyclaude/web-runtime/ui';
import {
  alignItems,
  backdrop,
  borderColor,
  cluster,
  display,
  focusRing,
  gap,
  hoverBg,
  iconSize,
  justify,
  marginTop,
  muted,
  padding,
  radius,
  shadow,
  size,
  spaceY,
  textAlign,
  textColor,
  tracking,
  transition,
  truncate,
  weight,
  width,
  bgColor,
  transform,
} from '@heyclaude/web-runtime/design-system';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface DetailTocProps {
  headings?: ContentHeadingMetadata[] | null;
  className?: string;
}

/**
 * Renders a "On this page" table of contents for document headings and manages active heading state.
 *
 * Displays a navigable list of normalized headings (when there are three or more). Highlights the
 * currently visible heading, updates the browser URL hash to reflect the active heading, and scrolls
 * to a heading when it is clicked (respecting the user's reduced-motion preference). The component
 * also computes indentation based on heading levels.
 *
 * @param props.headings - Array of content heading metadata to include in the table of contents; may be null or undefined.
 * @param props.className - Optional additional class name(s) applied to the outer nav element.
 * @returns The rendered navigation element or `null` when there are fewer than three headings.
 *
 * @see normalizeHeadings from @heyclaude/web-runtime/utils/heading-normalization
 * @see ListTree (icon used in the header)
 */
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
        `${radius['2xl']} border ${borderColor['border/60']} ${bgColor['card/70']} ${padding.default} ${shadow.sm} ${backdrop.default}`,
        'lg:sticky lg:top-28',
        className
      )}
      aria-label="On this page"
    >
      <div className={`${display.flex} ${alignItems.center} ${justify.between} ${gap.default}`}>
        <div className={cluster.compact}>
          <ListTree className={`${iconSize.sm} ${muted.default}`} aria-hidden="true" />
          <p className={`${weight.semibold} ${muted.default} ${size.xs} ${transform.uppercase} ${tracking.wide}`}>
            On this page
          </p>
        </div>
        <span className={`${muted.default} ${size.xs}`}>{normalizedHeadings.length}</span>
      </div>

      <ul className={`${marginTop.default} ${spaceY.snug}`}>
        {normalizedHeadings.map((heading) => {
          const depthOffset = Math.max(heading.level - baseLevel, 0);

          return (
            <li key={heading.id}>
              <button
                type="button"
                onClick={() => handleHeadingClick(heading)}
                className={cn(
                  focusRing.default,
                  `${width.full} ${radius.md} ${padding.xTight} ${padding.ySnug} ${textAlign.left} ${size.sm} ${transition.colors}`,
                  activeId === heading.id
                    ? `${bgColor['accent/15']} ${textColor.foreground}`
                    : `${muted.default} ${hoverBg.default} hover:${textColor.foreground}`
                )}
                style={{
                  paddingLeft: depthOffset > 0 ? `${0.5 + depthOffset * 0.5}rem` : undefined,
                }}
                aria-current={activeId === heading.id ? 'true' : undefined}
              >
                <span className={cluster.compact}>
                  <span
                    className={cn(
                      `${iconSize.xs} ${radius.full}`,
                      activeId === heading.id ? bgColor.primary : bgColor['mutedForeground/50']
                    )}
                  />
                  <span className={truncate.single}>{heading.title}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}