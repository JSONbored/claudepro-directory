/**
 * Auto-generated full content file
 * Category: Statuslines
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { StatuslineContent } from '@/src/lib/schemas/content/statusline.schema';

export const statuslinesFull: StatuslineContent[] = [];

export const statuslinesFullBySlug = new Map(statuslinesFull.map(item => [item.slug, item]));

export function getStatuslineFullBySlug(slug: string) {
  return statuslinesFullBySlug.get(slug) || null;
}

export type StatuslineFull = typeof statuslinesFull[number];
