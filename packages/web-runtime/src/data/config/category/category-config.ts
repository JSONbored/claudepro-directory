/**
 * Category Configuration
 *
 * Hardcoded category metadata for all content types.
 * This configuration defines the structure, metadata, and behavior for each category
 * (MCP servers, agents, skills, etc.).
 *
 * Previously fetched from database at build time, now maintained as TypeScript constants
 * for better performance and reliability.
 *
 * To update: Edit this file and redeploy.
 */

import { Constants, type Database } from '@heyclaude/database-types';

import {
  BookOpen,
  Briefcase,
  Code,
  FileText,
  Layers,
  type LucideIcon,
  Server,
  Sparkles,
  Terminal,
  Webhook,
} from '../../../icons.tsx';
import { type UnifiedCategoryConfig } from '../../../types/category.ts';

type ContentCategory = Database['public']['Enums']['content_category'];

// Type-safe icon map with explicit key-value pairs
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Briefcase,
  Code,
  FileText,
  Layers,
  Server,
  Sparkles,
  Terminal,
  Webhook,
};

// Helper function to safely get icon from map
function getIcon(key: string): LucideIcon {
  const icon: LucideIcon | undefined = ICON_MAP[key];
  if (icon) {
    return icon;
  }
  return FileText;
}

// Import enum values
const CONFIG_FORMATS = Constants.public.Enums.config_format;
const ACTION_TYPES = Constants.public.Enums.primary_action_type;

export const CATEGORY_CONFIGS: Record<ContentCategory, UnifiedCategoryConfig<ContentCategory>> = {
  agents: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'purple-500',
    contentLoader: 'agents',
    description:
      "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities.",
    detailPage: {
      configFormat: CONFIG_FORMATS[0],
      displayConfig: true,
    },
    generateFullContent: true,
    icon: ICON_MAP['Sparkles'] ?? FileText,
    id: 'agents' as const,
    keywords: 'Claude agents, AI agents, specialized assistants, workflow automation, Claude AI',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search AI agents...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription: `Specialized Claude AI agents. Community-contributed coding, writing, research, and automation configurations ready for Claude Desktop and Code.`,
    pluralTitle: 'AI Agents',
    primaryAction: {
      label: 'Deploy Agent',
      type: ACTION_TYPES[0],
    },
    sections: {
      configuration: true,
      description: true,
      examples: true,
      features: true,
      installation: true,
      requirements: true,
      security: true,
      troubleshooting: true,
      use_cases: true,
    },
    showOnHomepage: true,
    title: 'AI Agent',
    typeName: 'AI Agent',
    urlSlug: 'agents',
  },
  changelog: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'gray-500',
    contentLoader: 'changelog',
    description:
      'Product updates, new features, bug fixes, and improvements to the ClaudePro Directory.',
    detailPage: {
      configFormat: CONFIG_FORMATS[0],
      displayConfig: false,
    },
    generateFullContent: true,
    icon: ICON_MAP['FileText'] ?? FileText,
    id: 'changelog' as const,
    keywords: 'changelog, updates, release notes, new features, bug fixes',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search changelog...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription:
      'ClaudePro Directory changelog. Track new features, improvements, bug fixes, and version history. Stay updated with latest releases and development progress.',
    pluralTitle: 'Changelog',
    primaryAction: {
      label: 'Read Update',
      type: ACTION_TYPES[3],
    },
    sections: {
      configuration: false,
      description: true,
      examples: false,
      features: false,
      installation: false,
      requirements: false,
      security: false,
      troubleshooting: false,
      use_cases: false,
    },
    showOnHomepage: false,
    title: 'Changelog Entry',
    typeName: 'Changelog Entry',
    urlSlug: 'changelog',
  },
  collections: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'indigo-500',
    contentLoader: 'collections',
    description:
      'Curated bundles of related content items organized by theme, use case, or workflow for easy discovery.',
    detailPage: {
      configFormat: CONFIG_FORMATS[0],
      displayConfig: false,
    },
    generateFullContent: true,
    icon: ICON_MAP['Layers'] ?? FileText,
    id: 'collections' as const,
    keywords: 'Claude collections, curated content, workflow bundles, themed collections',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search collections...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription:
      'Curated Claude collections. Pre-assembled bundles of agents, commands, and tools for specific use cases and workflows to boost your productivity and efficiency.',
    pluralTitle: 'Collections',
    primaryAction: {
      label: 'View Collection',
      type: ACTION_TYPES[3],
    },
    sections: {
      configuration: false,
      description: true,
      examples: false,
      features: false,
      installation: false,
      requirements: false,
      security: false,
      troubleshooting: false,
      use_cases: true,
    },
    showOnHomepage: true,
    title: 'Collection',
    typeName: 'Collection',
    urlSlug: 'collections',
  },
  commands: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'blue-500',
    contentLoader: 'commands',
    description:
      'Custom slash commands to enhance your Claude Code workflow with reusable prompts and actions.',
    detailPage: {
      configFormat: CONFIG_FORMATS[0],
      displayConfig: false,
    },
    generateFullContent: true,
    icon: ICON_MAP['Terminal'] ?? FileText,
    id: 'commands' as const,
    keywords: 'Claude commands, slash commands, custom commands, Claude Code, CLI',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search commands...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription:
      'Custom slash commands for Claude Code. Community-created prompt templates, automation commands, and workflow shortcuts to streamline your development process.',
    pluralTitle: 'Commands',
    primaryAction: {
      label: 'Copy Command',
      type: ACTION_TYPES[1],
    },
    sections: {
      configuration: true,
      description: true,
      examples: true,
      features: true,
      installation: true,
      requirements: true,
      security: true,
      troubleshooting: true,
      use_cases: true,
    },
    showOnHomepage: true,
    title: 'Command',
    typeName: 'Command',
    urlSlug: 'commands',
  },
  guides: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'yellow-500',
    contentLoader: 'guides',
    description:
      'Comprehensive guides, tutorials, comparisons, and workflows for Claude. SEO-optimized content covering best practices, use cases, and troubleshooting.',
    detailPage: {
      configFormat: CONFIG_FORMATS[0],
      displayConfig: false,
    },
    generateFullContent: true,
    icon: ICON_MAP['FileText'] ?? FileText,
    id: 'guides' as const,
    keywords: 'Claude guides, tutorials, how-to guides, best practices, workflows',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search guides...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription:
      'Comprehensive guides for Claude. Tutorials, comparisons, workflows, and troubleshooting for Claude Desktop and Code. Learn best practices and techniques.',
    pluralTitle: 'Guides',
    primaryAction: {
      label: 'Read Guide',
      type: ACTION_TYPES[3],
    },
    sections: {
      configuration: false,
      description: true,
      examples: true,
      features: false,
      installation: false,
      requirements: false,
      security: false,
      troubleshooting: false,
      use_cases: true,
    },
    showOnHomepage: false,
    title: 'Guide',
    typeName: 'Guide',
    urlSlug: 'guides',
  },
  hooks: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'green-500',
    contentLoader: 'hooks',
    description: 'Event-driven automation hooks that trigger during Claude Code operations.',
    detailPage: {
      configFormat: CONFIG_FORMATS[2],
      displayConfig: true,
    },
    generateFullContent: true,
    icon: ICON_MAP['Webhook'] ?? FileText,
    id: 'hooks' as const,
    keywords: 'Claude hooks, event hooks, automation, Claude Code hooks, git hooks',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search hooks...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription:
      'Event-driven hooks for Claude Code. Automate workflows with pre-commit, post-merge, and custom event triggers to enhance development workflow and quality.',
    pluralTitle: 'Hooks',
    primaryAction: {
      label: 'View on GitHub',
      type: ACTION_TYPES[5],
    },
    sections: {
      configuration: true,
      description: true,
      examples: true,
      features: true,
      installation: true,
      requirements: true,
      security: true,
      troubleshooting: true,
      use_cases: true,
    },
    showOnHomepage: true,
    title: 'Hook',
    typeName: 'Hook',
    urlSlug: 'hooks',
  },
  jobs: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'emerald-500',
    contentLoader: 'jobs',
    description:
      'Job listings for Claude-related positions, AI engineering roles, and opportunities to work with AI technology.',
    detailPage: {
      configFormat: CONFIG_FORMATS[0],
      displayConfig: false,
    },
    generateFullContent: true,
    icon: ICON_MAP['Briefcase'] ?? FileText,
    id: 'jobs' as const,
    keywords: 'Claude jobs, AI jobs, engineering jobs, remote AI positions',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search jobs...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription:
      'Job opportunities in Claude and AI. Find roles working with Claude, AI engineering positions, remote opportunities, and cutting-edge AI careers worldwide.',
    pluralTitle: 'Jobs',
    primaryAction: {
      label: 'View Job',
      type: ACTION_TYPES[3],
    },
    sections: {
      configuration: false,
      description: true,
      examples: false,
      features: false,
      installation: false,
      requirements: false,
      security: false,
      troubleshooting: false,
      use_cases: false,
    },
    showOnHomepage: false,
    title: 'Job',
    typeName: 'Job',
    urlSlug: 'jobs',
  },
  mcp: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'orange-500',
    contentLoader: 'mcp',
    description:
      "Model Context Protocol servers that extend Claude's capabilities with external tools and data sources.",
    detailPage: {
      configFormat: CONFIG_FORMATS[0],
      displayConfig: true,
    },
    generateFullContent: true,
    icon: getIcon('Server'),
    id: 'mcp' as const,
    keywords:
      'MCP servers, Model Context Protocol, Claude Desktop, external tools, API integration',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search MCP servers...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription:
      'MCP servers for Claude Desktop. Extend Claude with file systems, databases, APIs, and custom tools via Model Context Protocol for enhanced functionality.',
    pluralTitle: 'MCP Servers',
    primaryAction: {
      label: 'Download .mcpb',
      type: ACTION_TYPES[4],
    },
    sections: {
      configuration: true,
      description: true,
      examples: true,
      features: true,
      installation: true,
      requirements: true,
      security: true,
      troubleshooting: true,
      use_cases: true,
    },
    showOnHomepage: true,
    title: 'MCP Server',
    typeName: 'MCP Server',
    urlSlug: 'mcp',
  },
  rules: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'red-500',
    contentLoader: 'rules',
    description: "Custom rules to guide Claude's behavior and responses in your projects.",
    detailPage: {
      configFormat: CONFIG_FORMATS[0],
      displayConfig: true,
    },
    generateFullContent: true,
    icon: ICON_MAP['BookOpen'] ?? FileText,
    id: 'rules' as const,
    keywords: 'Claude rules, custom rules, behavior rules, project rules, .cursorrules',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search rules...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription: `Custom rules for Claude. Define coding standards, architectural guidelines, and project-specific behavior for consistent AI assistance.`,
    pluralTitle: 'CLAUDE.md',
    primaryAction: {
      label: 'Use Rule',
      type: ACTION_TYPES[0],
    },
    sections: {
      configuration: true,
      description: true,
      examples: true,
      features: true,
      installation: true,
      requirements: true,
      security: true,
      troubleshooting: true,
      use_cases: true,
    },
    showOnHomepage: true,
    title: 'CLAUDE.md',
    typeName: 'CLAUDE.md',
    urlSlug: 'rules',
  },
  skills: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'pink-500',
    contentLoader: 'skills',
    description:
      'Task-focused capability guides for Claude (PDF, DOCX, PPTX, XLSX, and more) with requirements and runnable examples.',
    detailPage: {
      configFormat: CONFIG_FORMATS[0],
      displayConfig: false,
    },
    generateFullContent: true,
    icon: ICON_MAP['Sparkles'] ?? FileText,
    id: 'skills' as const,
    keywords: 'Claude skills, AI capabilities, task guides, skill packages, Claude Desktop skills',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search skills...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription:
      'Claude skills and capability packages. Downloadable packages with requirements, examples, and detailed instructions for specific tasks, workflows, use cases.',
    pluralTitle: 'Skills',
    primaryAction: {
      label: 'Download Skill',
      type: ACTION_TYPES[4],
    },
    sections: {
      configuration: true,
      description: true,
      examples: true,
      features: true,
      installation: true,
      requirements: true,
      security: true,
      troubleshooting: true,
      use_cases: true,
    },
    showOnHomepage: true,
    title: 'Skill',
    typeName: 'Skill',
    urlSlug: 'skills',
  },
  statuslines: {
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    buildConfig: {
      batchSize: 10,
      cacheTTL: 300_000,
      enableCache: true,
    },
    colorScheme: 'cyan-500',
    contentLoader: 'statuslines',
    description:
      'Customizable status line configurations for Claude Code CLI with real-time session information.',
    detailPage: {
      configFormat: CONFIG_FORMATS[0],
      displayConfig: true,
    },
    generateFullContent: true,
    icon: ICON_MAP['Terminal'] ?? FileText,
    id: 'statuslines' as const,
    keywords: 'Claude statusline, CLI statusline, terminal status, Claude Code customization',
    listPage: {
      badges: [{ text: (count: number) => `${count} items` }],
      searchPlaceholder: 'Search statuslines...',
    },
    metadata: {
      showGitHubLink: true,
    },
    metadataFields: ['title', 'description', 'category', 'slug', 'created_at', 'updated_at'],
    metaDescription:
      'Statusline scripts for Claude Code CLI. Display git status, project info, and custom metrics in your terminal for enhanced productivity and workflow visibility.',
    pluralTitle: 'Statuslines',
    primaryAction: {
      label: 'Copy Script',
      type: ACTION_TYPES[2],
    },
    sections: {
      configuration: true,
      description: true,
      examples: true,
      features: true,
      installation: true,
      requirements: true,
      security: true,
      troubleshooting: true,
      use_cases: true,
    },
    showOnHomepage: true,
    title: 'Statusline',
    typeName: 'Statusline',
    urlSlug: 'statuslines',
  },
};

export const ALL_CATEGORY_IDS = [
  'agents',
  'changelog',
  'collections',
  'commands',
  'guides',
  'hooks',
  'jobs',
  'mcp',
  'rules',
  'skills',
  'statuslines',
] as const;

export const HOMEPAGE_CATEGORY_IDS = [
  'agents',
  'collections',
  'commands',
  'hooks',
  'mcp',
  'rules',
  'skills',
  'statuslines',
] as const;

export const CACHEABLE_CATEGORY_IDS = [
  'agents',
  'collections',
  'commands',
  'guides',
  'hooks',
  'mcp',
  'rules',
  'skills',
  'statuslines',
] as const;
