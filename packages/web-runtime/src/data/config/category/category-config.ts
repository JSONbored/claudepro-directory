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
import type { UnifiedCategoryConfig } from '../../../types/category.ts';

type ContentCategory = Database['public']['Enums']['content_category'];

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Terminal,
  Webhook,
  BookOpen,
  Server,
  Layers,
  Briefcase,
  FileText,
  Code,
};

// Import enum values
const CATEGORIES = Constants.public.Enums.content_category;
const CONFIG_FORMATS = Constants.public.Enums.config_format;
const ACTION_TYPES = Constants.public.Enums.primary_action_type;

export const CATEGORY_CONFIGS: Record<ContentCategory, UnifiedCategoryConfig<ContentCategory>> = {
  [CATEGORIES[1]]: {
    id: CATEGORIES[1],
    title: "MCP Server",
    pluralTitle: "MCP Servers",
    description: "Model Context Protocol servers that extend Claude's capabilities with external tools and data sources.",
    icon: ICON_MAP['Server'] ?? FileText,
    colorScheme: "orange-500",
    showOnHomepage: true,
    keywords: "MCP servers, Model Context Protocol, Claude Desktop, external tools, API integration",
    metaDescription: "MCP servers for Claude Desktop. Extend Claude with file systems, databases, APIs, and custom tools via Model Context Protocol for enhanced functionality.",
    typeName: "MCP Server",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search MCP servers...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: true,
      configFormat: CONFIG_FORMATS[0],
    },
    sections: {
      features: true,
      installation: true,
      use_cases: true,
      configuration: true,
      security: true,
      troubleshooting: true,
      examples: true,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "Download .mcpb",
      type: ACTION_TYPES[4],
    },
    urlSlug: CATEGORIES[1],
    contentLoader: CATEGORIES[1],
  },
  [CATEGORIES[4]]: {
    id: CATEGORIES[4],
    title: "Hook",
    pluralTitle: "Hooks",
    description: "Event-driven automation hooks that trigger during Claude Code operations.",
    icon: ICON_MAP['Webhook'] ?? FileText,
    colorScheme: "green-500",
    showOnHomepage: true,
    keywords: "Claude hooks, event hooks, automation, Claude Code hooks, git hooks",
    metaDescription: "Event-driven hooks for Claude Code. Automate workflows with pre-commit, post-merge, and custom event triggers to enhance development workflow and quality.",
    typeName: "Hook",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search hooks...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: true,
      configFormat: CONFIG_FORMATS[2],
    },
    sections: {
      features: true,
      installation: true,
      use_cases: true,
      configuration: true,
      security: false,
      troubleshooting: true,
      examples: false,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "View on GitHub",
      type: ACTION_TYPES[5],
    },
    urlSlug: CATEGORIES[4],
    contentLoader: CATEGORIES[4],
  },
  [CATEGORIES[6]]: {
    id: CATEGORIES[6],
    title: "Skill",
    pluralTitle: "Skills",
    description: "Task-focused capability guides for Claude (PDF, DOCX, PPTX, XLSX, and more) with requirements and runnable examples.",
    icon: ICON_MAP['Sparkles'] ?? FileText,
    colorScheme: "pink-500",
    showOnHomepage: true,
    keywords: "Claude skills, AI capabilities, task guides, skill packages, Claude Desktop skills",
    metaDescription: "Claude skills and capability packages. Downloadable packages with requirements, examples, and detailed instructions for specific tasks, workflows, use cases.",
    typeName: "Skill",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search skills...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: false,
      configFormat: CONFIG_FORMATS[0],
    },
    sections: {
      features: true,
      installation: true,
      use_cases: true,
      configuration: false,
      security: false,
      troubleshooting: true,
      examples: true,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "Download Skill",
      type: ACTION_TYPES[4],
    },
    urlSlug: CATEGORIES[6],
    contentLoader: CATEGORIES[6],
  },
  [CATEGORIES[3]]: {
    id: CATEGORIES[3],
    title: "Command",
    pluralTitle: "Commands",
    description: "Custom slash commands to enhance your Claude Code workflow with reusable prompts and actions.",
    icon: ICON_MAP['Terminal'] ?? FileText,
    colorScheme: "blue-500",
    showOnHomepage: true,
    keywords: "Claude commands, slash commands, custom commands, Claude Code, CLI",
    metaDescription: "Custom slash commands for Claude Code. Community-created prompt templates, automation commands, and workflow shortcuts to streamline your development process.",
    typeName: "Command",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search commands...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: false,
      configFormat: CONFIG_FORMATS[0],
    },
    sections: {
      features: true,
      installation: true,
      use_cases: true,
      configuration: false,
      security: false,
      troubleshooting: true,
      examples: false,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "Copy Command",
      type: ACTION_TYPES[1],
    },
    urlSlug: CATEGORIES[3],
    contentLoader: CATEGORIES[3],
  },
  [CATEGORIES[10]]: {
    id: CATEGORIES[10],
    title: "Changelog Entry",
    pluralTitle: "Changelog",
    description: "Product updates, new features, bug fixes, and improvements to the ClaudePro Directory.",
    icon: ICON_MAP['FileText'] ?? FileText,
    colorScheme: "gray-500",
    showOnHomepage: false,
    keywords: "changelog, updates, release notes, new features, bug fixes",
    metaDescription: "ClaudePro Directory changelog. Track new features, improvements, bug fixes, and version history. Stay updated with latest releases and development progress.",
    typeName: "Changelog Entry",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search changelog...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: false,
      configFormat: CONFIG_FORMATS[0],
    },
    sections: {
      features: false,
      installation: false,
      use_cases: false,
      configuration: false,
      security: false,
      troubleshooting: false,
      examples: false,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "Read Update",
      type: ACTION_TYPES[3],
    },
    urlSlug: CATEGORIES[10],
    contentLoader: CATEGORIES[10],
  },
  [CATEGORIES[9]]: {
    id: CATEGORIES[9],
    title: "Job",
    pluralTitle: "Jobs",
    description: "Job listings for Claude-related positions, AI engineering roles, and opportunities to work with AI technology.",
    icon: ICON_MAP['Briefcase'] ?? FileText,
    colorScheme: "emerald-500",
    showOnHomepage: false,
    keywords: "Claude jobs, AI jobs, engineering jobs, remote AI positions",
    metaDescription: "Job opportunities in Claude and AI. Find roles working with Claude, AI engineering positions, remote opportunities, and cutting-edge AI careers worldwide.",
    typeName: "Job",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search jobs...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: false,
      configFormat: CONFIG_FORMATS[0],
    },
    sections: {
      features: false,
      installation: false,
      use_cases: false,
      configuration: false,
      security: false,
      troubleshooting: false,
      examples: false,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "View Job",
      type: ACTION_TYPES[3],
    },
    urlSlug: CATEGORIES[9],
    contentLoader: CATEGORIES[9],
  },
  [CATEGORIES[7]]: {
    id: CATEGORIES[7],
    title: "Collection",
    pluralTitle: "Collections",
    description: "Curated bundles of related content items organized by theme, use case, or workflow for easy discovery.",
    icon: ICON_MAP['Layers'] ?? FileText,
    colorScheme: "indigo-500",
    showOnHomepage: true,
    keywords: "Claude collections, curated content, workflow bundles, themed collections",
    metaDescription: "Curated Claude collections. Pre-assembled bundles of agents, commands, and tools for specific use cases and workflows to boost your productivity and efficiency.",
    typeName: "Collection",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search collections...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: false,
      configFormat: CONFIG_FORMATS[0],
    },
    sections: {
      features: false,
      installation: false,
      use_cases: true,
      configuration: false,
      security: false,
      troubleshooting: false,
      examples: false,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "View Collection",
      type: ACTION_TYPES[3],
    },
    urlSlug: CATEGORIES[7],
    contentLoader: CATEGORIES[7],
  },
  [CATEGORIES[2]]: {
    id: CATEGORIES[2],
    title: "Rule",
    pluralTitle: "Rules",
    description: "Custom rules to guide Claude's behavior and responses in your projects.",
    icon: ICON_MAP['BookOpen'] ?? FileText,
    colorScheme: "red-500",
    showOnHomepage: true,
    keywords: "Claude rules, custom rules, behavior rules, project rules, .cursorrules",
    metaDescription: "Custom rules for Claude in October 2025. Define coding standards, architectural guidelines, and project-specific behavior for consistent AI assistance.",
    typeName: "Rule",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search rules...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: true,
      configFormat: CONFIG_FORMATS[0],
    },
    sections: {
      features: true,
      installation: false,
      use_cases: true,
      configuration: true,
      security: false,
      troubleshooting: true,
      examples: true,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "Use Rule",
      type: ACTION_TYPES[0],
    },
    urlSlug: CATEGORIES[2],
    contentLoader: CATEGORIES[2],
  },
  [CATEGORIES[0]]: {
    id: CATEGORIES[0],
    title: "AI Agent",
    pluralTitle: "AI Agents",
    description: "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities.",
    icon: ICON_MAP['Sparkles'] ?? FileText,
    colorScheme: "purple-500",
    showOnHomepage: true,
    keywords: "Claude agents, AI agents, specialized assistants, workflow automation, Claude AI",
    metaDescription: "Specialized Claude AI agents for October 2025. Community-contributed coding, writing, research, and automation configurations ready for Claude Desktop and Code.",
    typeName: "AI Agent",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search AI agents...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: true,
      configFormat: CONFIG_FORMATS[0],
    },
    sections: {
      features: true,
      installation: true,
      use_cases: true,
      configuration: true,
      security: false,
      troubleshooting: true,
      examples: false,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "Deploy Agent",
      type: ACTION_TYPES[0],
    },
    urlSlug: CATEGORIES[0],
    contentLoader: CATEGORIES[0],
  },
  [CATEGORIES[5]]: {
    id: CATEGORIES[5],
    title: "Statusline",
    pluralTitle: "Statuslines",
    description: "Customizable status line configurations for Claude Code CLI with real-time session information.",
    icon: ICON_MAP['Terminal'] ?? FileText,
    colorScheme: "cyan-500",
    showOnHomepage: true,
    keywords: "Claude statusline, CLI statusline, terminal status, Claude Code customization",
    metaDescription: "Statusline scripts for Claude Code CLI. Display git status, project info, and custom metrics in your terminal for enhanced productivity and workflow visibility.",
    typeName: "Statusline",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search statuslines...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: true,
      configFormat: CONFIG_FORMATS[0],
    },
    sections: {
      features: true,
      installation: true,
      use_cases: true,
      configuration: true,
      security: false,
      troubleshooting: true,
      examples: false,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "Copy Script",
      type: ACTION_TYPES[2],
    },
    urlSlug: CATEGORIES[5],
    contentLoader: CATEGORIES[5],
  },
  [CATEGORIES[8]]: {
    id: CATEGORIES[8],
    title: "Guide",
    pluralTitle: "Guides",
    description: "Comprehensive guides, tutorials, comparisons, and workflows for Claude. SEO-optimized content covering best practices, use cases, and troubleshooting.",
    icon: ICON_MAP['FileText'] ?? FileText,
    colorScheme: "yellow-500",
    showOnHomepage: false,
    keywords: "Claude guides, tutorials, how-to guides, best practices, workflows",
    metaDescription: "Comprehensive guides for Claude. Tutorials, comparisons, workflows, and troubleshooting for Claude Desktop and Code. Learn best practices and techniques.",
    typeName: "Guide",
    generateFullContent: true,
    metadataFields: ["title","description","category","slug","created_at","updated_at"],
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 300_000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: "Search guides...",
      badges: [{ text: (count: number) => `{count} items`.replace('{count}', String(count)) }],
      
    },
    detailPage: {
      displayConfig: false,
      configFormat: CONFIG_FORMATS[0],
    },
    sections: {
      features: false,
      installation: false,
      use_cases: true,
      configuration: false,
      security: false,
      troubleshooting: false,
      examples: true,
      requirements: false,
    },
    metadata: {
      showGitHubLink: true,
    },
    primaryAction: {
      label: "Read Guide",
      type: ACTION_TYPES[3],
    },
    urlSlug: CATEGORIES[8],
    contentLoader: CATEGORIES[8],
  }
};

export const ALL_CATEGORY_IDS = [CATEGORIES[0], CATEGORIES[10], CATEGORIES[7], CATEGORIES[3], CATEGORIES[8], CATEGORIES[4], CATEGORIES[9], CATEGORIES[1], CATEGORIES[2], CATEGORIES[6], CATEGORIES[5]] as const;

export const HOMEPAGE_CATEGORY_IDS = [CATEGORIES[0], CATEGORIES[7], CATEGORIES[3], CATEGORIES[4], CATEGORIES[1], CATEGORIES[2], CATEGORIES[6], CATEGORIES[5]] as const;

export const CACHEABLE_CATEGORY_IDS = [CATEGORIES[0], CATEGORIES[7], CATEGORIES[3], CATEGORIES[8], CATEGORIES[4], CATEGORIES[1], CATEGORIES[2], CATEGORIES[6], CATEGORIES[5]] as const;
