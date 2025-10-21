/**
 * Auto-generated full content file
 * Category: MCP Servers
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { McpContent } from '@/src/lib/schemas/content/mcp.schema';

export const mcpFull: McpContent[] = [];

export const mcpFullBySlug = new Map(mcpFull.map(item => [item.slug, item]));

export function getMcpFullBySlug(slug: string) {
  return mcpFullBySlug.get(slug) || null;
}

export type McpFull = typeof mcpFull[number];
