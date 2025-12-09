/**
 * Shared utility for normalizing heading metadata for table of contents rendering.
 *
 * This function is used by both SidebarToc and DetailToc components to ensure
 * consistent normalization logic across the codebase.
 *
 * @module normalize-headings
 */

import { type ContentHeadingMetadata } from '@heyclaude/web-runtime/types/component.types';

export interface NormalizedHeading {
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
 * @returns An array of `NormalizedHeading` objects ready for use in table of contents components.
 */
export function normalizeHeadings(
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
