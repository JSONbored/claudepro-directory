/**
 * Auto-generated metadata file
 * Category: Rules
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { RuleContent } from '@/src/lib/schemas/content/rule.schema';

export type RuleMetadata = Pick<RuleContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source'>;

export const rulesMetadata: RuleMetadata[] = [];

export const rulesMetadataBySlug = new Map(rulesMetadata.map(item => [item.slug, item]));

export function getRuleMetadataBySlug(slug: string): RuleMetadata | null {
  return rulesMetadataBySlug.get(slug) || null;
}
