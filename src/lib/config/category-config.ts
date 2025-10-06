/**
 * Category Configuration System
 *
 * Centralized configuration for dynamic category routing and list pages.
 * Defines metadata, display properties, and behavior for all content categories.
 *
 * This config is used by:
 * - app/[category]/page.tsx (list pages)
 * - app/[category]/[slug]/page.tsx (detail pages)
 * - lib/content-loaders.ts (dynamic content loading)
 *
 * Note: This is separate from content-type-configs.tsx which handles detail page rendering.
 * This file handles routing, list pages, and category-level metadata.
 */

import type { LucideIcon } from 'lucide-react';
import { BookOpen, Code, Layers, Sparkles, Terminal, Webhook } from '@/src/lib/icons';

/**
 * Category metadata and display configuration
 *
 * Production Standards:
 * - Index signature allows type compatibility with MetadataContext
 * - All properties remain strongly typed
 * - Used by metadata-registry.ts for centralized SEO metadata
 */
export interface CategoryConfig {
  // Display properties
  title: string;
  pluralTitle: string;
  description: string;
  icon: LucideIcon;

  // SEO
  keywords: string;
  metaDescription: string;

  // List page configuration
  listPage: {
    searchPlaceholder: string;
    badges: Array<{
      icon?: string;
      text: string | ((count: number) => string);
    }>;
    emptyStateMessage?: string;
  };

  // Detail page configuration
  detailPage: {
    displayConfig: boolean;
    configFormat: 'json' | 'multi' | 'hook';
    sections?: Array<{
      id: string;
      title: string;
      order: number;
      customRenderer?: string;
    }>;
  };

  // Routing
  urlSlug: string;

  // Data loading
  contentLoader: string;

  // Index signature for compatibility with MetadataContext
  [key: string]: unknown;
}

/**
 * All content category configurations
 */
export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  agents: {
    title: 'AI Agent',
    pluralTitle: 'AI Agents',
    description:
      "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities.",
    icon: Sparkles,
    keywords: 'Claude agents, AI agents, specialized assistants, workflow automation, Claude AI',
    metaDescription:
      'Specialized Claude AI agents for coding, writing, research, and workflow automation. Community-contributed configurations with copy-paste setup for Claude Desktop and Code.',

    listPage: {
      searchPlaceholder: 'Search AI agents...',
      badges: [
        { icon: 'sparkles', text: (count) => `${count} Agents Available` },
        { text: 'Task Optimized' },
        { text: 'Ready to Deploy' },
      ],
    },

    detailPage: {
      displayConfig: true,
      configFormat: 'json',
      sections: [
        { id: 'content', title: 'Agent Prompt', order: 1 },
        { id: 'configuration', title: 'Configuration', order: 2 },
      ],
    },

    urlSlug: 'agents',
    contentLoader: 'agents',
  },

  mcp: {
    title: 'MCP Server',
    pluralTitle: 'MCP Servers',
    description:
      "Model Context Protocol servers that extend Claude's capabilities with external tools and data sources.",
    icon: Code,
    keywords: 'MCP servers, Model Context Protocol, Claude tools, API integration',
    metaDescription:
      'Ever-growing collection of Model Context Protocol servers extending Claude with GitHub, databases, APIs, and file systems. Official MCP integrations with setup guides.',

    listPage: {
      searchPlaceholder: 'Search MCP servers...',
      badges: [
        { icon: 'code', text: (count) => `${count} Servers Available` },
        { text: 'Official Protocol' },
        { text: 'Production Ready' },
      ],
    },

    detailPage: {
      displayConfig: true,
      configFormat: 'multi', // Special: claudeDesktop, claudeCode, http, sse
    },

    urlSlug: 'mcp',
    contentLoader: 'mcp',
  },

  commands: {
    title: 'Command',
    pluralTitle: 'Commands',
    description:
      'Custom slash commands to enhance your Claude Code workflow with reusable prompts and actions.',
    icon: Terminal,
    keywords: 'Claude commands, slash commands, CLI tools, workflow automation',
    metaDescription:
      'Custom Claude Code slash commands for workflow automation, code review, testing, and documentation. Community-built reusable prompts ready to enhance your development.',

    listPage: {
      searchPlaceholder: 'Search commands...',
      badges: [
        { icon: 'terminal', text: (count) => `${count} Commands Available` },
        { text: 'Workflow Boosters' },
        { text: 'Copy & Use' },
      ],
    },

    detailPage: {
      displayConfig: true,
      configFormat: 'json',
    },

    urlSlug: 'commands',
    contentLoader: 'commands',
  },

  rules: {
    title: 'Rule',
    pluralTitle: 'Rules',
    description: "Custom rules to guide Claude's behavior and responses in your projects.",
    icon: BookOpen,
    keywords: 'Claude rules, AI guidelines, project rules, behavior customization',
    metaDescription:
      'Project-specific rules controlling Claude AI behavior for coding standards, security, testing, and documentation. Community-curated guidelines for better AI assistance.',

    listPage: {
      searchPlaceholder: 'Search rules...',
      badges: [
        { icon: 'book-open', text: (count) => `${count} Rules Available` },
        { text: 'Behavior Control' },
        { text: 'Project Specific' },
      ],
    },

    detailPage: {
      displayConfig: true,
      configFormat: 'json',
    },

    urlSlug: 'rules',
    contentLoader: 'rules',
  },

  hooks: {
    title: 'Hook',
    pluralTitle: 'Hooks',
    description: 'Event-driven automation hooks that trigger during Claude Code operations.',
    icon: Webhook,
    keywords: 'Claude hooks, automation, webhooks, event triggers, CI/CD',
    metaDescription:
      'Event-driven Claude Code automation hooks for git commits, testing, linting, and CI/CD integration. Ever-growing library of shell scripts for development workflows.',

    listPage: {
      searchPlaceholder: 'Search hooks...',
      badges: [
        { icon: 'webhook', text: (count) => `${count} Hooks Available` },
        { text: 'Event Driven' },
        { text: 'Automation Ready' },
      ],
    },

    detailPage: {
      displayConfig: true,
      configFormat: 'hook', // Special: hookConfig + scriptContent
    },

    urlSlug: 'hooks',
    contentLoader: 'hooks',
  },

  statuslines: {
    title: 'Statusline',
    pluralTitle: 'Statuslines',
    description:
      'Customizable status line configurations for Claude Code CLI with real-time session information.',
    icon: Terminal,
    keywords: 'Claude statuslines, CLI customization, terminal themes, status bar',
    metaDescription:
      'Beautiful Claude Code CLI statusline themes displaying git info, project details, and session stats. Customize your terminal with community-designed status bars.',

    listPage: {
      searchPlaceholder: 'Search statuslines...',
      badges: [
        { icon: 'terminal', text: (count) => `${count} Statuslines Available` },
        { text: 'CLI Enhancement' },
        { text: 'Customizable' },
      ],
    },

    detailPage: {
      displayConfig: true,
      configFormat: 'json',
      sections: [
        {
          id: 'preview',
          title: 'Preview',
          order: 1,
          customRenderer: 'StatuslinePreview',
        },
        { id: 'script', title: 'Script Content', order: 2 },
        { id: 'configuration', title: 'Installation', order: 3 },
      ],
    },

    urlSlug: 'statuslines',
    contentLoader: 'statuslines',
  },

  collections: {
    title: 'Collection',
    pluralTitle: 'Collections',
    description:
      'Curated bundles of related content items organized by theme, use case, or workflow for easy discovery.',
    icon: Layers,
    keywords: 'Claude collections, starter kits, workflows, bundles, curated content',
    metaDescription:
      'Curated Claude AI starter kits bundling agents, MCP servers, commands, and rules by use case. Complete workflow collections for web development and automation.',

    listPage: {
      searchPlaceholder: 'Search collections...',
      badges: [
        { icon: 'layers', text: (count) => `${count} Collections Available` },
        { text: 'Curated Bundles' },
        { text: 'Ready to Use' },
      ],
    },

    detailPage: {
      displayConfig: false,
      configFormat: 'json',
      sections: [
        { id: 'items', title: "What's Included", order: 1 },
        { id: 'prerequisites', title: 'Prerequisites', order: 2 },
        { id: 'installation', title: 'Installation Order', order: 3 },
        { id: 'compatibility', title: 'Compatibility', order: 4 },
      ],
    },

    urlSlug: 'collections',
    contentLoader: 'collections',
  },
};

/**
 * Get valid category slugs for routing validation
 */
export const VALID_CATEGORIES = Object.keys(CATEGORY_CONFIGS);

/**
 * Homepage-specific category configurations
 * These determine which categories appear on the homepage
 */
export const HOMEPAGE_FEATURED_CATEGORIES = [
  'rules',
  'mcp',
  'agents',
  'commands',
  'hooks',
  'statuslines',
  'collections',
] as const;

export const HOMEPAGE_TAB_CATEGORIES = [
  'all',
  'rules',
  'mcp',
  'agents',
  'commands',
  'hooks',
  'statuslines',
  'collections',
  'community',
] as const;

export type HomepageFeaturedCategory = (typeof HOMEPAGE_FEATURED_CATEGORIES)[number];
export type HomepageTabCategory = (typeof HOMEPAGE_TAB_CATEGORIES)[number];

/**
 * Get category config by URL slug
 */
export function getCategoryConfig(slug: string): CategoryConfig | null {
  return CATEGORY_CONFIGS[slug] || null;
}

/**
 * Type guard for valid categories
 */
export function isValidCategory(category: string): category is keyof typeof CATEGORY_CONFIGS {
  return category in CATEGORY_CONFIGS;
}
