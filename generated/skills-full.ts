/**
 * Auto-generated full content file
 * Category: Skills
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { SkillContent } from '@/src/lib/schemas/content/skill.schema';

export const skillsFull: SkillContent[] = [];

export const skillsFullBySlug = new Map(skillsFull.map(item => [item.slug, item]));

export function getSkillFullBySlug(slug: string) {
  return skillsFullBySlug.get(slug) || null;
}

export type SkillFull = typeof skillsFull[number];
