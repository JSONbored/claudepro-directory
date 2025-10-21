/**
 * Auto-generated full content file
 * Category: Rules
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { RuleContent } from '@/src/lib/schemas/content/rule.schema';

export const rulesFull: RuleContent[] = [];

export const rulesFullBySlug = new Map(rulesFull.map(item => [item.slug, item]));

export function getRuleFullBySlug(slug: string) {
  return rulesFullBySlug.get(slug) || null;
}

export type RuleFull = typeof rulesFull[number];
