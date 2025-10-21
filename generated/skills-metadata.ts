/**
 * Auto-generated metadata file
 * Category: Skills
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { SkillContent } from '@/src/lib/schemas/content/skill.schema';

export type SkillMetadata = Pick<SkillContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source'>;

export const skillsMetadata: SkillMetadata[] = [];

export const skillsMetadataBySlug = new Map(skillsMetadata.map(item => [item.slug, item]));

export function getSkillMetadataBySlug(slug: string): SkillMetadata | null {
  return skillsMetadataBySlug.get(slug) || null;
}
