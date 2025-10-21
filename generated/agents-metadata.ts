/**
 * Auto-generated metadata file
 * Category: AI Agents
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { AgentContent } from '@/src/lib/schemas/content/agent.schema';

export type AgentMetadata = Pick<AgentContent, 'slug' | 'title' | 'seoTitle' | 'description' | 'author' | 'tags' | 'category' | 'dateAdded' | 'source'>;

export const agentsMetadata: AgentMetadata[] = [];

export const agentsMetadataBySlug = new Map(agentsMetadata.map(item => [item.slug, item]));

export function getAgentMetadataBySlug(slug: string): AgentMetadata | null {
  return agentsMetadataBySlug.get(slug) || null;
}
