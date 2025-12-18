import type { content_category } from '@heyclaude/data-layer/prisma';

/**
 * Category display name mappings
 * 
 * Maps content category enum values to user-friendly display names and descriptions.
 * Used for page titles, meta descriptions, and UI labels.
 */
const CATEGORY_DISPLAY_NAMES: Record<
  content_category,
  { pluralTitle: string; description: string }
> = {
  agents: {
    pluralTitle: 'AI Agents',
    description: "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities.",
  },
  mcp: {
    pluralTitle: 'MCP Servers',
    description: 'Model Context Protocol servers that extend Claude with external data and capabilities.',
  },
  rules: {
    pluralTitle: 'Rules',
    description: 'CLAUDE.md rule files that configure Claude Desktop behavior and capabilities.',
  },
  commands: {
    pluralTitle: 'Commands',
    description: 'Custom commands and shortcuts for Claude Desktop workflows.',
  },
  hooks: {
    pluralTitle: 'Hooks',
    description: 'Automation hooks that trigger actions in Claude Desktop.',
  },
  statuslines: {
    pluralTitle: 'Statuslines',
    description: 'Custom status line configurations for Claude Desktop.',
  },
  skills: {
    pluralTitle: 'Skills',
    description: 'Agent skills and capabilities for specialized tasks.',
  },
  collections: {
    pluralTitle: 'Collections',
    description: 'Curated collections of related configurations and resources.',
  },
  guides: {
    pluralTitle: 'Guides',
    description: 'Tutorials and guides for using Claude effectively.',
  },
  jobs: {
    pluralTitle: 'Jobs',
    description: 'Job listings and career opportunities.',
  },
  changelog: {
    pluralTitle: 'Changelog',
    description: 'Release notes and changelog entries.',
  },
};

/**
 * Get display name and description for a content category.
 * 
 * Returns user-friendly plural title and description for a given content category.
 * Falls back to the category enum value if no mapping exists.
 * 
 * @param category - Content category enum value
 * @returns Object with `pluralTitle` (e.g., "AI Agents") and `description` (e.g., "Browse specialized AI agents...")
 * 
 * @example
 * ```ts
 * getCategoryDisplayName('agents')
 * // Returns: { pluralTitle: 'AI Agents', description: 'Browse specialized AI agents...' }
 * 
 * getCategoryDisplayName('unknown-category')
 * // Returns: { pluralTitle: 'unknown-category', description: 'Content category' }
 * ```
 */
export function getCategoryDisplayName(
  category: content_category
): { pluralTitle: string; description: string } {
  return CATEGORY_DISPLAY_NAMES[category] ?? {
    pluralTitle: category,
    description: 'Content category',
  };
}
