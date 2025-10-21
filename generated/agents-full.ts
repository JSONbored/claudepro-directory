/**
 * Auto-generated full content file
 * Category: AI Agents
 *
 * DO NOT EDIT MANUALLY
 * @see scripts/build-content.ts
 */

import type { AgentContent } from '@/src/lib/schemas/content/agent.schema';

export const agentsFull: AgentContent[] = [];

export const agentsFullBySlug = new Map(agentsFull.map(item => [item.slug, item]));

export function getAgentFullBySlug(slug: string) {
  return agentsFullBySlug.get(slug) || null;
}

export type AgentFull = typeof agentsFull[number];
