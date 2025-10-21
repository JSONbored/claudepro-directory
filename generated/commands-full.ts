/**
 * Auto-generated full content file
 * Category: Commands
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { CommandContent } from '@/src/lib/schemas/content/command.schema';

export const commandsFull: CommandContent[] = [];

export const commandsFullBySlug = new Map(commandsFull.map(item => [item.slug, item]));

export function getCommandFullBySlug(slug: string) {
  return commandsFullBySlug.get(slug) || null;
}

export type CommandFull = typeof commandsFull[number];
