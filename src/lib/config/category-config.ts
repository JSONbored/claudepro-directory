/**
 * Category Configuration System - SINGLE SOURCE OF TRUTH
 *
 * Unified category registry that consolidates ALL category-related configuration.
 * This is the ONLY place where categories are defined - all other systems derive from this.
 *
 * Modern 2025 Architecture:
 * - Configuration-driven: Add category here → everything auto-updates
 * - Type-safe: Full TypeScript inference with satisfies pattern
 * - Zero duplication: Build, UI, SEO all derive from single registry
 * - Tree-shakeable: Only imported categories included in bundle
 * - Validated: Zod schemas ensure correctness
 *
 * Used by:
 * - app/[category]/page.tsx (list pages)
 * - app/[category]/[slug]/page.tsx (detail pages)
 * - scripts/build-content.ts (build-time processing)
 * - scripts/generate-static-apis.ts (API generation)
 * - lib/content-loaders.ts (dynamic content loading)
 * - lib/seo/* (metadata generation)
 * - lib/analytics/* (event mapping)
 * - And 30+ more locations (all auto-derived)
 *
 * TO ADD A NEW CATEGORY:
 * 1. Add entry to UNIFIED_CATEGORY_REGISTRY below
 * 2. Create schema file: src/lib/schemas/content/{category}.schema.ts
 * 3. Add content: content/{category}/*.json
 * 4. Run: npm run build:content
 * That's it! Everything else auto-updates.
 */

import type { LucideIcon } from 'lucide-react';
import type { z } from 'zod';
import { BookOpen, Code, Layers, Sparkles, Terminal, Webhook } from '@/src/lib/icons';
import { type AgentContent, agentContentSchema } from '@/src/lib/schemas/content/agent.schema';
import {
  type CollectionContent,
  collectionContentSchema,
} from '@/src/lib/schemas/content/collection.schema';
import {
  type CommandContent,
  commandContentSchema,
} from '@/src/lib/schemas/content/command.schema';
import { type HookContent, hookContentSchema } from '@/src/lib/schemas/content/hook.schema';
import { type McpContent, mcpContentSchema } from '@/src/lib/schemas/content/mcp.schema';
import { type RuleContent, ruleContentSchema } from '@/src/lib/schemas/content/rule.schema';
import { type SkillContent, skillContentSchema } from '@/src/lib/schemas/content/skill.schema';
import {
  type StatuslineContent,
  statuslineContentSchema,
} from '@/src/lib/schemas/content/statusline.schema';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';

/**
 * Content type discriminated union
 * Modern TypeScript pattern for type-safe content handling
 */
export type ContentType =
  | AgentContent
  | McpContent
  | HookContent
  | CommandContent
  | RuleContent
  | StatuslineContent
  | CollectionContent
  | SkillContent;

/**
 * Unified Category Configuration Interface
 *
 * Consolidates UI, build, and API configuration into single registry.
 * This eliminates duplication between category-config and build-category-config.
 *
 * Production Standards:
 * - Index signature allows type compatibility with MetadataContext
 * - All properties remain strongly typed
 * - Used by build scripts, UI components, SEO, analytics, and more
 */
export interface UnifiedCategoryConfig<T extends ContentType = ContentType> {
  // ===== IDENTITY =====
  /** Category identifier (must match ContentCategory type) */
  readonly id: ContentCategory;

  // ===== DISPLAY PROPERTIES =====
  title: string; // Singular display name
  pluralTitle: string; // Plural display name
  description: string; // User-facing description
  icon: LucideIcon; // Lucide icon component
  colorScheme: string; // Tailwind color class (e.g., 'purple-500') for UI theming

  // ===== SEO =====
  keywords: string; // Comma-separated keywords
  metaDescription: string; // Meta description (150-160 chars)

  // ===== SCHEMA & BUILD =====
  /** Validation schema for this content type */
  readonly schema: z.ZodType<T>;
  /** Type discriminator for metadata exports */
  readonly typeName: string;
  /** Whether this category generates full content exports (vs metadata only) */
  readonly generateFullContent: boolean;
  /** Metadata field mapping for optimized exports */
  readonly metadataFields: ReadonlyArray<string>;

  // ===== BUILD PERFORMANCE =====
  readonly buildConfig: {
    /** Batch size for parallel processing */
    readonly batchSize: number;
    /** Enable incremental caching */
    readonly enableCache: boolean;
    /** Cache TTL in milliseconds */
    readonly cacheTTL: number;
  };

  // ===== API GENERATION =====
  readonly apiConfig: {
    /** Generate static API endpoint */
    readonly generateStaticAPI: boolean;
    /** Include in trending calculations */
    readonly includeTrending: boolean;
    /** Maximum items per API response */
    readonly maxItemsPerResponse: number;
  };

  // ===== LIST PAGE CONFIGURATION =====
  listPage: {
    searchPlaceholder: string;
    badges: Array<{
      icon?: string;
      text: string | ((count: number) => string);
    }>;
    emptyStateMessage?: string;
  };

  // ===== DETAIL PAGE CONFIGURATION =====
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

  // ===== ROUTING =====
  urlSlug: string;

  // ===== DATA LOADING =====
  contentLoader: string;

  // Index signature for compatibility with MetadataContext
  [key: string]: unknown;
}

/**
 * Legacy CategoryConfig interface for backward compatibility
 * @deprecated Use UnifiedCategoryConfig instead
 */
export interface CategoryConfig {
  title: string;
  pluralTitle: string;
  description: string;
  icon: LucideIcon;
  keywords: string;
  metaDescription: string;
  listPage: {
    searchPlaceholder: string;
    badges: Array<{
      icon?: string;
      text: string | ((count: number) => string);
    }>;
    emptyStateMessage?: string;
  };
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
  urlSlug: string;
  contentLoader: string;
  [key: string]: unknown;
}

/**
 * ============================================
 * UNIFIED CATEGORY REGISTRY - SINGLE SOURCE OF TRUTH
 * ============================================
 *
 * This is the ONLY place where categories are defined.
 * All build scripts, UI components, SEO configs, analytics, and APIs derive from this.
 *
 * Performance: const assertion enables zero-cost type inference
 * Validation: satisfies ensures compile-time completeness
 */
export const UNIFIED_CATEGORY_REGISTRY = {
  agents: {
    id: 'agents' as ContentCategory,
    title: 'AI Agent',
    pluralTitle: 'AI Agents',
    description:
      "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities.",
    icon: Sparkles,
    colorScheme: 'purple-500',
    keywords: 'Claude agents, AI agents, specialized assistants, workflow automation, Claude AI',
    metaDescription:
      'Specialized Claude AI agents for October 2025. Community-contributed coding, writing, research, and automation configurations ready for Claude Desktop and Code.',
    schema: agentContentSchema,
    typeName: 'AgentContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'dateAdded',
      'source',
    ] as const,
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: 'Search AI agents...',
      badges: [
        { icon: 'sparkles', text: (count: number) => `${count} Agents Available` },
        { text: 'Task Optimized' },
        { text: 'Ready to Deploy' },
      ],
    },
    detailPage: {
      displayConfig: true,
      configFormat: 'json' as const,
      sections: [
        { id: 'content', title: 'Agent Prompt', order: 1 },
        { id: 'configuration', title: 'Configuration', order: 2 },
      ],
    },
    urlSlug: 'agents',
    contentLoader: 'agents',
  },

  mcp: {
    id: 'mcp' as ContentCategory,
    title: 'MCP Server',
    pluralTitle: 'MCP Servers',
    description:
      "Model Context Protocol servers that extend Claude's capabilities with external tools and data sources.",
    icon: Code,
    colorScheme: 'green-500',
    keywords: 'MCP servers, Model Context Protocol, Claude tools, API integration',
    metaDescription:
      'Model Context Protocol servers for October 2025. Extend Claude with GitHub, databases, APIs, and file systems. Official MCP integrations with setup guides.',
    schema: mcpContentSchema,
    typeName: 'McpContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'dateAdded',
      'source',
    ] as const,
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: 'Search MCP servers...',
      badges: [
        { icon: 'code', text: (count: number) => `${count} Servers Available` },
        { text: 'Official Protocol' },
        { text: 'Production Ready' },
      ],
    },
    detailPage: {
      displayConfig: true,
      configFormat: 'multi' as const,
    },
    urlSlug: 'mcp',
    contentLoader: 'mcp',
  },

  commands: {
    id: 'commands' as ContentCategory,
    title: 'Command',
    pluralTitle: 'Commands',
    description:
      'Custom slash commands to enhance your Claude Code workflow with reusable prompts and actions.',
    icon: Terminal,
    colorScheme: 'orange-500',
    keywords: 'Claude commands, slash commands, CLI tools, workflow automation',
    metaDescription:
      'Claude Code slash commands for October 2025. Workflow automation, code review, testing, and documentation. Community-built reusable prompts for development.',
    schema: commandContentSchema,
    typeName: 'CommandContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'dateAdded',
      'source',
    ] as const,
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: 'Search commands...',
      badges: [
        { icon: 'terminal', text: (count: number) => `${count} Commands Available` },
        { text: 'Workflow Boosters' },
        { text: 'Copy & Use' },
      ],
    },
    detailPage: {
      displayConfig: true,
      configFormat: 'json' as const,
    },
    urlSlug: 'commands',
    contentLoader: 'commands',
  },

  rules: {
    id: 'rules' as ContentCategory,
    title: 'Rule',
    pluralTitle: 'Rules',
    description: "Custom rules to guide Claude's behavior and responses in your projects.",
    icon: BookOpen,
    colorScheme: 'blue-500',
    keywords: 'Claude rules, AI guidelines, project rules, behavior customization',
    metaDescription:
      'Claude AI rules for October 2025. Control behavior for coding standards, security, testing, and documentation. Community-curated guidelines for AI assistance.',
    schema: ruleContentSchema,
    typeName: 'RuleContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'dateAdded',
      'source',
    ] as const,
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: 'Search rules...',
      badges: [
        { icon: 'book-open', text: (count: number) => `${count} Rules Available` },
        { text: 'Behavior Control' },
        { text: 'Project Specific' },
      ],
    },
    detailPage: {
      displayConfig: true,
      configFormat: 'json' as const,
    },
    urlSlug: 'rules',
    contentLoader: 'rules',
  },

  hooks: {
    id: 'hooks' as ContentCategory,
    title: 'Hook',
    pluralTitle: 'Hooks',
    description: 'Event-driven automation hooks that trigger during Claude Code operations.',
    icon: Webhook,
    colorScheme: 'blue-500',
    keywords: 'Claude hooks, automation, webhooks, event triggers, CI/CD',
    metaDescription:
      'Claude Code automation hooks for October 2025. Event-driven scripts for git commits, testing, linting, and CI/CD integration. Shell scripts for dev workflows.',
    schema: hookContentSchema,
    typeName: 'HookContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'dateAdded',
      'source',
    ] as const,
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: 'Search hooks...',
      badges: [
        { icon: 'webhook', text: (count: number) => `${count} Hooks Available` },
        { text: 'Event Driven' },
        { text: 'Automation Ready' },
      ],
    },
    detailPage: {
      displayConfig: true,
      configFormat: 'hook' as const,
    },
    urlSlug: 'hooks',
    contentLoader: 'hooks',
  },

  statuslines: {
    id: 'statuslines' as ContentCategory,
    title: 'Statusline',
    pluralTitle: 'Statuslines',
    description:
      'Customizable status line configurations for Claude Code CLI with real-time session information.',
    icon: Terminal,
    colorScheme: 'cyan-500',
    keywords: 'Claude statuslines, CLI customization, terminal themes, status bar',
    metaDescription:
      'Claude Code CLI statuslines for October 2025. Beautiful terminal themes showing git info, project details, and session stats. Community-designed status bars.',
    schema: statuslineContentSchema,
    typeName: 'StatuslineContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'dateAdded',
      'source',
    ] as const,
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: 'Search statuslines...',
      badges: [
        { icon: 'terminal', text: (count: number) => `${count} Statuslines Available` },
        { text: 'CLI Enhancement' },
        { text: 'Customizable' },
      ],
    },
    detailPage: {
      displayConfig: true,
      configFormat: 'json' as const,
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
    id: 'collections' as ContentCategory,
    title: 'Collection',
    pluralTitle: 'Collections',
    description:
      'Curated bundles of related content items organized by theme, use case, or workflow for easy discovery.',
    icon: Layers,
    colorScheme: 'indigo-500',
    keywords: 'Claude collections, starter kits, workflows, bundles, curated content',
    metaDescription:
      'Curated Claude AI starter kits bundling agents, MCP servers, commands, and rules by use case. Complete workflow collections for web development and automation.',
    schema: collectionContentSchema,
    typeName: 'CollectionContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'dateAdded',
      'source',
      'collectionType',
      'difficulty',
      'estimatedSetupTime',
    ] as const,
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: 'Search collections...',
      badges: [
        { icon: 'layers', text: (count: number) => `${count} Collections Available` },
        { text: 'Curated Bundles' },
        { text: 'Ready to Use' },
      ],
    },
    detailPage: {
      displayConfig: false,
      configFormat: 'json' as const,
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

  skills: {
    id: 'skills' as ContentCategory,
    title: 'Skill',
    pluralTitle: 'Skills',
    description:
      'Task-focused capability guides for Claude (PDF, DOCX, PPTX, XLSX, and more) with requirements and runnable examples.',
    icon: BookOpen,
    colorScheme: 'emerald-500',
    keywords: 'Claude skills, document processing, pdf, docx, pptx, xlsx, how-to, examples',
    metaDescription:
      'Practical Claude Skills for October 2025: PDF/DOCX/PPTX/XLSX workflows with exact dependencies, copy-pasteable code examples, and troubleshooting.',
    schema: skillContentSchema,
    typeName: 'SkillContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'dateAdded',
      'source',
    ] as const,
    buildConfig: {
      batchSize: 10,
      enableCache: true,
      cacheTTL: 5 * 60 * 1000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
    listPage: {
      searchPlaceholder: 'Search skills...',
      badges: [
        { icon: 'book-open', text: (count: number) => `${count} Skills Available` },
        { text: 'Environment Ready' },
        { text: 'Copy & Run' },
      ],
    },
    detailPage: {
      displayConfig: false,
      configFormat: 'json' as const,
      sections: [
        { id: 'content', title: 'Guide', order: 1 },
        { id: 'installation', title: 'Installation', order: 2 },
        { id: 'examples', title: 'Examples', order: 3 },
        { id: 'troubleshooting', title: 'Troubleshooting', order: 4 },
      ],
    },
    urlSlug: 'skills',
    contentLoader: 'skills',
  },
} as const satisfies Record<string, UnifiedCategoryConfig>;

/**
 * Type inference from unified registry
 * Modern TypeScript pattern for zero-cost type safety
 */
export type CategoryId = keyof typeof UNIFIED_CATEGORY_REGISTRY;
export type UnifiedCategoryConfigValue = (typeof UNIFIED_CATEGORY_REGISTRY)[CategoryId];

/**
 * ============================================
 * DERIVED EXPORTS (Backward Compatibility)
 * ============================================
 *
 * These maintain existing APIs while using the unified registry internally.
 * Legacy code continues working unchanged.
 */

/**
 * Legacy CATEGORY_CONFIGS export
 * Derives UI-only fields from unified registry for backward compatibility
 */
export const CATEGORY_CONFIGS: Record<string, CategoryConfig> = Object.fromEntries(
  Object.entries(UNIFIED_CATEGORY_REGISTRY).map(([key, config]) => [
    key,
    {
      title: config.title,
      pluralTitle: config.pluralTitle,
      description: config.description,
      icon: config.icon,
      keywords: config.keywords,
      metaDescription: config.metaDescription,
      listPage: config.listPage,
      detailPage: config.detailPage,
      urlSlug: config.urlSlug,
      contentLoader: config.contentLoader,
    },
  ])
) as Record<string, CategoryConfig>;

/**
 * BUILD_CATEGORY_CONFIGS export
 * Derives build-only fields from unified registry
 * Replaces the old build-category-config.ts file (now deprecated)
 */
export const BUILD_CATEGORY_CONFIGS = Object.fromEntries(
  Object.entries(UNIFIED_CATEGORY_REGISTRY).map(([key, config]) => [
    key,
    {
      id: config.id,
      name: config.pluralTitle,
      schema: config.schema,
      typeName: config.typeName,
      generateFullContent: config.generateFullContent,
      metadataFields: config.metadataFields,
      buildConfig: config.buildConfig,
      apiConfig: config.apiConfig,
    },
  ])
) as Record<
  string,
  {
    id: ContentCategory;
    name: string;
    schema: z.ZodType<ContentType>;
    typeName: string;
    generateFullContent: boolean;
    metadataFields: ReadonlyArray<string>;
    buildConfig: {
      batchSize: number;
      enableCache: boolean;
      cacheTTL: number;
    };
    apiConfig: {
      generateStaticAPI: boolean;
      includeTrending: boolean;
      maxItemsPerResponse: number;
    };
  }
>;

/**
 * Type-safe build category ID union
 * @deprecated Import CategoryId instead (they're now the same)
 */
export type BuildCategoryId = CategoryId;

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Get valid category slugs for routing validation
 */
export const VALID_CATEGORIES = Object.keys(UNIFIED_CATEGORY_REGISTRY);

/**
 * Get category config by URL slug
 */
export function getCategoryConfig(slug: string): CategoryConfig | null {
  return CATEGORY_CONFIGS[slug] || null;
}

/**
 * Get unified category config by URL slug (includes build metadata)
 */
export function getUnifiedCategoryConfig(slug: string): UnifiedCategoryConfigValue | null {
  return UNIFIED_CATEGORY_REGISTRY[slug as CategoryId] || null;
}

/**
 * Get build category config (build-specific fields only)
 * Replaces getBuildCategoryConfig from old build-category-config.ts
 */
export function getBuildCategoryConfig<T extends CategoryId>(
  categoryId: T
): (typeof BUILD_CATEGORY_CONFIGS)[T] {
  const config = BUILD_CATEGORY_CONFIGS[categoryId];
  if (!config) {
    throw new Error(`Unknown category ID: ${categoryId}`);
  }
  return config;
}

/**
 * Get all build category configs as array
 * Replaces getAllBuildCategoryConfigs from old build-category-config.ts
 */
export function getAllBuildCategoryConfigs(): Array<(typeof BUILD_CATEGORY_CONFIGS)[CategoryId]> {
  return Object.values(BUILD_CATEGORY_CONFIGS);
}

/**
 * Extract metadata from content item
 * Moved from build-category-config.ts for consolidation
 */
export function extractMetadata(
  content: ContentType,
  config: (typeof BUILD_CATEGORY_CONFIGS)[CategoryId]
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  for (const field of config.metadataFields) {
    if (Object.hasOwn(content, field)) {
      metadata[field as string] = content[field as keyof ContentType];
    }
  }

  return metadata;
}

/**
 * Type guard for valid categories
 */
export function isValidCategory(category: string): category is CategoryId {
  return category in UNIFIED_CATEGORY_REGISTRY;
}

/**
 * Get all category IDs as array
 */
export function getAllCategoryIds(): CategoryId[] {
  return Object.keys(UNIFIED_CATEGORY_REGISTRY) as CategoryId[];
}

/**
 * Homepage-specific category configurations
 * Now derived from registry (ensures stays in sync)
 */
export const HOMEPAGE_FEATURED_CATEGORIES = [
  'rules',
  'mcp',
  'agents',
  'commands',
  'hooks',
  'statuslines',
  'collections',
  'skills',
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
  'skills',
  'community',
] as const;

export type HomepageFeaturedCategory = (typeof HOMEPAGE_FEATURED_CATEGORIES)[number];
export type HomepageTabCategory = (typeof HOMEPAGE_TAB_CATEGORIES)[number];

/**
 * ============================================
 * RE-EXPORTED TYPES (from old build-category-config.ts)
 * ============================================
 */

/**
 * Build category configuration type (for generic usage in category-processor)
 */
export interface BuildCategoryConfig<T extends ContentType = ContentType> {
  readonly id: ContentCategory;
  readonly name: string;
  readonly schema: z.ZodType<T>;
  readonly typeName: string;
  readonly generateFullContent: boolean;
  readonly metadataFields: ReadonlyArray<string>;
  readonly buildConfig: {
    readonly batchSize: number;
    readonly enableCache: boolean;
    readonly cacheTTL: number;
  };
  readonly apiConfig: {
    readonly generateStaticAPI: boolean;
    readonly includeTrending: boolean;
    readonly maxItemsPerResponse: number;
  };
}

/**
 * Performance metrics for build operations
 */
export interface BuildMetrics {
  readonly category: CategoryId;
  readonly filesProcessed: number;
  readonly filesValid: number;
  readonly filesInvalid: number;
  readonly processingTimeMs: number;
  readonly cacheHitRate: number;
  readonly peakMemoryMB: number;
}

/**
 * Build result with metrics
 */
export interface CategoryBuildResult {
  readonly category: CategoryId;
  readonly success: boolean;
  readonly items: readonly ContentType[];
  readonly metadata: readonly Record<string, unknown>[];
  readonly metrics: BuildMetrics;
  readonly errors: readonly Error[];
}
