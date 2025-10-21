/**
 * Auto-generated metadata file
 * Category: Commands
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { CommandContent } from '@/src/lib/schemas/content/command.schema';

export type CommandMetadata = Pick<CommandContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source'>;

export const commandsMetadata: CommandMetadata[] = [];

export const commandsMetadataBySlug = new Map(commandsMetadata.map(item => [item.slug, item]));

export function getCommandMetadataBySlug(slug: string): CommandMetadata | null {
  return commandsMetadataBySlug.get(slug) || null;
}
