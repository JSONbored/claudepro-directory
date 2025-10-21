/**
 * Auto-generated metadata file
 * Category: Hooks
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { HookContent } from '@/src/lib/schemas/content/hook.schema';

export type HookMetadata = Pick<HookContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source'>;

export const hooksMetadata: HookMetadata[] = [];

export const hooksMetadataBySlug = new Map(hooksMetadata.map(item => [item.slug, item]));

export function getHookMetadataBySlug(slug: string): HookMetadata | null {
  return hooksMetadataBySlug.get(slug) || null;
}
