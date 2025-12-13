import { type Database } from '@heyclaude/database-types';

const CATEGORY_DISPLAY_NAMES: Record<
  Database['public']['Enums']['content_category'],
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

export function getCategoryDisplayName(
  category: Database['public']['Enums']['content_category']
): { pluralTitle: string; description: string } {
  return CATEGORY_DISPLAY_NAMES[category] ?? {
    pluralTitle: category,
    description: 'Content category',
  };
}
