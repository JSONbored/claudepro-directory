/**
 * Auto-generated full content file
 * Category: Collections
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { CollectionContent } from '@/src/lib/schemas/content/collection.schema';

export const collectionsFull: CollectionContent[] = [];

export const collectionsFullBySlug = new Map(collectionsFull.map(item => [item.slug, item]));

export function getCollectionFullBySlug(slug: string) {
  return collectionsFullBySlug.get(slug) || null;
}

export type CollectionFull = typeof collectionsFull[number];
