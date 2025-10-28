/**
 * Slug Generation Utilities
 * URL-safe slug generation for content identifiers
 *
 * Database-first: Moved from content-generation.schema.ts during Phase 2
 */

/**
 * Generate slug from filename
 * Removes extension, converts to lowercase, replaces special chars with hyphens
 *
 * @param filename - Filename to convert (e.g., "my-agent.json")
 * @returns URL-safe slug (e.g., "my-agent")
 *
 * @example
 * generateSlugFromFilename("typescript-expert.json") // "typescript-expert"
 * generateSlugFromFilename("My Cool Agent.json") // "my-cool-agent"
 * generateSlugFromFilename("agent_v2.json") // "agent-v2"
 */
export function generateSlugFromFilename(filename: string): string {
  return filename
    .replace(/\.json$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
