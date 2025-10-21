/**
 * Auto-generated full content file
 * Category: Hooks
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { HookContent } from '@/src/lib/schemas/content/hook.schema';

export const hooksFull: HookContent[] = [];

export const hooksFullBySlug = new Map(hooksFull.map(item => [item.slug, item]));

export function getHookFullBySlug(slug: string) {
  return hooksFullBySlug.get(slug) || null;
}

export type HookFull = typeof hooksFull[number];
