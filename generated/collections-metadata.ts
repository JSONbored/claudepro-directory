/**
 * Auto-generated metadata file
 * Category: Collections
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { CollectionContent } from '@/src/lib/schemas/content/collection.schema';

export type CollectionMetadata = Pick<CollectionContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source' | 'collectionType' | 'difficulty' | 'estimatedSetupTime'>;

export const collectionsMetadata: CollectionMetadata[] = [];

export const collectionsMetadataBySlug = new Map(collectionsMetadata.map(item => [item.slug, item]));

export function getCollectionMetadataBySlug(slug: string): CollectionMetadata | null {
  return collectionsMetadataBySlug.get(slug) || null;
}
