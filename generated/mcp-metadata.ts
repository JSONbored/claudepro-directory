/**
 * Auto-generated metadata file
 * Category: MCP Servers
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { McpContent } from '@/src/lib/schemas/content/mcp.schema';

export type McpMetadata = Pick<McpContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source'>;

export const mcpMetadata: McpMetadata[] = [];

export const mcpMetadataBySlug = new Map(mcpMetadata.map(item => [item.slug, item]));

export function getMcpMetadataBySlug(slug: string): McpMetadata | null {
  return mcpMetadataBySlug.get(slug) || null;
}
