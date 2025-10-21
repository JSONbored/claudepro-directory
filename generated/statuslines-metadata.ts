/**
 * Auto-generated metadata file
 * Category: Statuslines
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { StatuslineContent } from '@/src/lib/schemas/content/statusline.schema';

export type StatuslineMetadata = Pick<StatuslineContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source'>;

export const statuslinesMetadata: StatuslineMetadata[] = [];

export const statuslinesMetadataBySlug = new Map(statuslinesMetadata.map(item => [item.slug, item]));

export function getStatuslineMetadataBySlug(slug: string): StatuslineMetadata | null {
  return statuslinesMetadataBySlug.get(slug) || null;
}
