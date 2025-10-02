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
import { BookOpen, Code, Sparkles, Terminal, Webhook } from '@/lib/icons';

/**
 * Category metadata and display configuration
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
      "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities.",

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
      "Model Context Protocol servers that extend Claude's capabilities with external tools and data sources.",

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
      'Custom slash commands to enhance your Claude Code workflow with reusable prompts and actions.',

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
    metaDescription: "Custom rules to guide Claude's behavior and responses in your projects.",

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
    metaDescription: 'Event-driven automation hooks that trigger during Claude Code operations.',

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
      'Customizable status line configurations for Claude Code CLI with real-time session information.',

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
        { id: 'preview', title: 'Preview', order: 1, customRenderer: 'StatuslinePreview' },
        { id: 'script', title: 'Script Content', order: 2 },
        { id: 'configuration', title: 'Installation', order: 3 },
      ],
    },

    urlSlug: 'statuslines',
    contentLoader: 'statuslines',
  },
};

/**
 * Get valid category slugs for routing validation
 */
export const VALID_CATEGORIES = Object.keys(CATEGORY_CONFIGS);

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
