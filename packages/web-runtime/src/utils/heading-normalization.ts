/**
 * Heading Normalization Utility
 *
 * Shared utility for normalizing table-of-contents headings.
 * Used by both SidebarToc and DetailToc components.
 *
 * @module web-runtime/utils/heading-normalization
 */

/**
 * Raw heading metadata from content
 */
export interface ContentHeadingMetadata {
  id?: string | null;
  title?: string | null;
  anchor?: string | null;
  level?: number | null;
}

/**
 * Normalized heading for TOC display
 */
export interface NormalizedHeading {
  id: string;
  title: string;
  anchor: string;
  level: number;
}

/**
 * Normalizes raw heading metadata into consistent TOC format.
 *
 * Features:
 * - Deduplicates headings by ID
 * - Validates required fields (id, title)
 * - Clamps levels to 2-6 range
 * - Generates anchor from ID if missing
 * - Limits to 50 headings max
 *
 * @param headings - Raw heading metadata from content
 * @returns Normalized headings array
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

  return Array.from(deduped.values());
}
