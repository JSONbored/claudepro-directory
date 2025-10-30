/**
 * Category Configuration - Single source of truth for all 11 content categories
 * Configuration-driven system where adding a category auto-updates build/UI/SEO/analytics
 */

import type { z } from 'zod';
import {
  BookOpen,
  Briefcase,
  Code,
  FileText,
  Layers,
  type LucideIcon,
  Sparkles,
  Terminal,
  Webhook,
} from '@/src/lib/icons';
import {
  publicChangelogRowSchema,
  publicContentRowSchema,
  publicJobsRowSchema,
} from '@/src/lib/schemas/generated/db-schemas';
import type { Tables } from '@/src/types/database.types';

/**
 * Content type - unified content table
 * All categories (agents, mcp, commands, rules, hooks, statuslines, collections, skills, guides) use the unified content table
 */
export type ContentType = Tables<'content'> | Tables<'jobs'> | Tables<'changelog_entries'>;

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
export interface UnifiedCategoryConfig<
  T extends ContentType = ContentType,
  TId extends string = string,
> {
  // ===== IDENTITY =====
  /** Category identifier - type-safe literal from UNIFIED_CATEGORY_REGISTRY keys */
  readonly id: TId;

  // ===== DISPLAY PROPERTIES =====
  title: string; // Singular display name
  pluralTitle: string; // Plural display name
  description: string; // User-facing description
  icon: LucideIcon; // Lucide icon component
  colorScheme: string; // Tailwind color class (e.g., 'purple-500') for UI theming
  showOnHomepage: boolean; // Whether category appears in homepage "All" section

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

/** Unified category registry - all 11 content types with configuration */
export const UNIFIED_CATEGORY_REGISTRY = {
  agents: {
    id: 'agents',
    title: 'AI Agent',
    pluralTitle: 'AI Agents',
    description:
      "Browse specialized AI agents designed for specific tasks and workflows using Claude's capabilities.",
    icon: Sparkles,
    colorScheme: 'purple-500',
    showOnHomepage: true,
    keywords: 'Claude agents, AI agents, specialized assistants, workflow automation, Claude AI',
    metaDescription:
      'Specialized Claude AI agents for October 2025. Community-contributed coding, writing, research, and automation configurations ready for Claude Desktop and Code.',
    schema: publicContentRowSchema,
    typeName: 'Database["public"]["Tables"]["content"]["Row"]',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'date_added',
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
    id: 'mcp',
    title: 'MCP Server',
    pluralTitle: 'MCP Servers',
    description:
      "Model Context Protocol servers that extend Claude's capabilities with external tools and data sources.",
    icon: Code,
    colorScheme: 'green-500',
    showOnHomepage: true,
    keywords: 'MCP servers, Model Context Protocol, Claude tools, API integration',
    metaDescription:
      'Model Context Protocol servers for October 2025. Extend Claude with GitHub, databases, APIs, and file systems. Official MCP integrations with setup guides.',
    schema: publicContentRowSchema,
    typeName: 'Database["public"]["Tables"]["content"]["Row"]',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'date_added',
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
    id: 'commands',
    title: 'Command',
    pluralTitle: 'Commands',
    description:
      'Custom slash commands to enhance your Claude Code workflow with reusable prompts and actions.',
    icon: Terminal,
    colorScheme: 'orange-500',
    showOnHomepage: true,
    keywords: 'Claude commands, slash commands, CLI tools, workflow automation',
    metaDescription:
      'Claude Code slash commands for October 2025. Workflow automation, code review, testing, and documentation. Community-built reusable prompts for development.',
    schema: publicContentRowSchema,
    typeName: 'Database["public"]["Tables"]["content"]["Row"]',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'date_added',
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
    id: 'rules',
    title: 'Rule',
    pluralTitle: 'Rules',
    description: "Custom rules to guide Claude's behavior and responses in your projects.",
    icon: BookOpen,
    colorScheme: 'blue-500',
    showOnHomepage: true,
    keywords: 'Claude rules, AI guidelines, project rules, behavior customization',
    metaDescription:
      'Claude AI rules for October 2025. Control behavior for coding standards, security, testing, and documentation. Community-curated guidelines for AI assistance.',
    schema: publicContentRowSchema,
    typeName: 'Database["public"]["Tables"]["content"]["Row"]',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'date_added',
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
    id: 'hooks',
    title: 'Hook',
    pluralTitle: 'Hooks',
    description: 'Event-driven automation hooks that trigger during Claude Code operations.',
    icon: Webhook,
    colorScheme: 'blue-500',
    showOnHomepage: true,
    keywords: 'Claude hooks, automation, webhooks, event triggers, CI/CD',
    metaDescription:
      'Claude Code automation hooks for October 2025. Event-driven scripts for git commits, testing, linting, and CI/CD integration. Shell scripts for dev workflows.',
    schema: publicContentRowSchema,
    typeName: 'Database["public"]["Tables"]["content"]["Row"]',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'date_added',
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
    id: 'statuslines',
    title: 'Statusline',
    pluralTitle: 'Statuslines',
    description:
      'Customizable status line configurations for Claude Code CLI with real-time session information.',
    icon: Terminal,
    colorScheme: 'cyan-500',
    showOnHomepage: true,
    keywords: 'Claude statuslines, CLI customization, terminal themes, status bar',
    metaDescription:
      'Claude Code CLI statuslines for October 2025. Beautiful terminal themes showing git info, project details, and session stats. Community-designed status bars.',
    schema: publicContentRowSchema,
    typeName: 'Database["public"]["Tables"]["content"]["Row"]',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'date_added',
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
    id: 'collections',
    title: 'Collection',
    pluralTitle: 'Collections',
    description:
      'Curated bundles of related content items organized by theme, use case, or workflow for easy discovery.',
    icon: Layers,
    colorScheme: 'indigo-500',
    showOnHomepage: true,
    keywords: 'Claude collections, starter kits, workflows, bundles, curated content',
    metaDescription:
      'Curated Claude AI starter kits bundling agents, MCP servers, commands, and rules by use case. Complete workflow collections for web development and automation.',
    schema: publicContentRowSchema,
    typeName: 'Database["public"]["Tables"]["content"]["Row"]',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'date_added',
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
    id: 'skills',
    title: 'Skill',
    pluralTitle: 'Skills',
    description:
      'Task-focused capability guides for Claude (PDF, DOCX, PPTX, XLSX, and more) with requirements and runnable examples.',
    icon: BookOpen,
    colorScheme: 'emerald-500',
    showOnHomepage: true,
    keywords: 'Claude skills, document processing, pdf, docx, pptx, xlsx, how-to, examples',
    metaDescription:
      'Practical Claude Skills for October 2025: PDF/DOCX/PPTX/XLSX workflows with exact dependencies, copy-pasteable code examples, and troubleshooting guides.',
    schema: publicContentRowSchema,
    typeName: 'Database["public"]["Tables"]["content"]["Row"]',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'date_added',
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

  guides: {
    id: 'guides',
    title: 'Guide',
    pluralTitle: 'Guides',
    description:
      'Comprehensive guides, tutorials, comparisons, and workflows for Claude. SEO-optimized content covering best practices, use cases, and troubleshooting.',
    icon: FileText,
    colorScheme: 'blue-500',
    showOnHomepage: false,
    keywords:
      'Claude guides, tutorials, comparisons, workflows, use cases, troubleshooting, best practices',
    metaDescription:
      'Expert Claude guides for October 2025: In-depth tutorials, feature comparisons, workflow automation, use case examples, troubleshooting, and best practices.',
    schema: publicContentRowSchema,
    typeName: 'Database["public"]["Tables"]["content"]["Row"]',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
      'seoTitle',
      'description',
      'author',
      'tags',
      'category',
      'subcategory',
      'date_added',
      'source',
      'keywords',
      'difficulty',
      'readingTime',
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
      searchPlaceholder: 'Search guides...',
      badges: [
        { icon: 'file-text', text: (count: number) => `${count} Guides Available` },
        { text: 'SEO Optimized' },
        { text: 'Expert Content' },
      ],
    },
    detailPage: {
      displayConfig: false,
      configFormat: 'json' as const,
      sections: [
        { id: 'content', title: 'Guide Content', order: 1 },
        { id: 'related', title: 'Related Guides', order: 2 },
      ],
    },
    urlSlug: 'guides',
    contentLoader: 'guides',
  },

  jobs: {
    id: 'jobs',
    title: 'Job',
    pluralTitle: 'Jobs',
    description:
      'AI and Claude-related job listings. Find opportunities in AI development, prompt engineering, and Claude integration.',
    icon: Briefcase,
    colorScheme: 'indigo-500',
    showOnHomepage: false,
    keywords: 'AI jobs, Claude jobs, prompt engineering, AI development, remote AI jobs',
    metaDescription:
      'AI job board for October 2025: Claude-related positions, prompt engineering roles, AI development opportunities. Remote and on-site positions available.',
    schema: publicJobsRowSchema,
    typeName: 'Database["public"]["Tables"]["jobs"]["Row"]',
    generateFullContent: false,
    metadataFields: [
      'id',
      'slug',
      'title',
      'company',
      'location',
      'type',
      'remote',
      'salary',
      'posted_at',
    ] as const,
    buildConfig: {
      batchSize: 20,
      enableCache: true,
      cacheTTL: 2 * 60 * 1000,
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: false,
      maxItemsPerResponse: 100,
    },
    listPage: {
      searchPlaceholder: 'Search jobs...',
      badges: [
        { icon: 'briefcase', text: (count: number) => `${count} Open Positions` },
        { text: 'Remote Available' },
        { text: 'Updated Daily' },
      ],
    },
    detailPage: {
      displayConfig: false,
      configFormat: 'json' as const,
    },
    urlSlug: 'jobs',
    contentLoader: 'jobs',
  },

  changelog: {
    id: 'changelog',
    title: 'Changelog',
    pluralTitle: 'Changelog',
    description:
      'Product updates, new features, and improvements to the Claude Pro Directory platform.',
    icon: FileText,
    colorScheme: 'slate-500',
    showOnHomepage: false,
    keywords: 'changelog, updates, new features, improvements, release notes',
    metaDescription:
      'Claude Pro Directory changelog for October 2025: Latest features, improvements, bug fixes, platform updates, new integrations, and performance enhancements.',
    schema: publicChangelogRowSchema as any,
    typeName: 'Database["public"]["Tables"]["changelog"]["Row"]',
    generateFullContent: true,
    metadataFields: ['slug', 'title', 'description', 'date_added'] as const,
    buildConfig: {
      batchSize: 5,
      enableCache: true,
      cacheTTL: 10 * 60 * 1000,
    },
    apiConfig: {
      generateStaticAPI: false,
      includeTrending: false,
      maxItemsPerResponse: 50,
    },
    listPage: {
      searchPlaceholder: 'Search changelog...',
      badges: [{ icon: 'file-text', text: 'Release History' }, { text: 'Product Updates' }],
    },
    detailPage: {
      displayConfig: false,
      configFormat: 'json' as const,
    },
    urlSlug: 'changelog',
    contentLoader: 'changelog',
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
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Get valid category slugs for routing validation
 *
 * @architecture DERIVED FROM REGISTRY
 * Uses Object.keys() to dynamically extract category IDs from UNIFIED_CATEGORY_REGISTRY.
 * TypeScript types this as string[] by default, but we know these are CategoryId values.
 *
 * This is the ONE acceptable cast in the entire system because:
 * 1. Object.keys() ALWAYS returns the registry keys
 * 2. CategoryId is derived from registry keys via `keyof typeof UNIFIED_CATEGORY_REGISTRY`
 * 3. Therefore the cast is safe by construction - the runtime value matches the type
 *
 * All other code should use isValidCategory() type guard or iterate this array - NO OTHER CASTS.
 */
export const VALID_CATEGORIES = Object.keys(UNIFIED_CATEGORY_REGISTRY) as CategoryId[];

/**
 * Get category config by URL slug
 * Returns unified category configuration from UNIFIED_CATEGORY_REGISTRY
 */
export function getCategoryConfig(slug: string): UnifiedCategoryConfigValue | null {
  if (!isValidCategory(slug)) {
    return null;
  }
  return UNIFIED_CATEGORY_REGISTRY[slug];
}

/**
 * Type guard for valid categories
 */
export function isValidCategory(category: string): category is CategoryId {
  return category in UNIFIED_CATEGORY_REGISTRY;
}

/**
 * Get all category IDs as array
 *
 * @returns Array of all category IDs from UNIFIED_CATEGORY_REGISTRY
 *
 * @architecture Just returns VALID_CATEGORIES (which is Object.keys(registry))
 */
export function getAllCategoryIds(): CategoryId[] {
  return VALID_CATEGORIES;
}

/**
 * Get category IDs that should appear on homepage "All" section
 * Filters based on showOnHomepage flag in registry
 */
export function getHomepageCategoryIds(): CategoryId[] {
  return VALID_CATEGORIES.filter((id) => UNIFIED_CATEGORY_REGISTRY[id].showOnHomepage);
}

/**
 * Get cacheable category IDs (categories with generateFullContent: true)
 * Used for build-time content generation and caching
 */
export function getCacheableCategoryIds(): CategoryId[] {
  return VALID_CATEGORIES.filter((id) => UNIFIED_CATEGORY_REGISTRY[id].generateFullContent);
}

// REMOVED: Registry validation check - no longer needed
// Schema is now derived from registry, so they're always in sync by definition

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
 * HOMEPAGE STATS DISPLAY CONFIGURATION
 * ============================================
 *
 * Configuration for dynamic stats display on homepage.
 * Associates each category with its icon and display text.
 *
 * Modern 2025 Architecture:
 * - Configuration-driven stats rendering
 * - Zero hardcoded stat displays
 * - Icons pulled from category config
 * - Display text auto-generated from pluralTitle
 */

export interface CategoryStatsConfig {
  readonly categoryId: CategoryId;
  readonly icon: LucideIcon;
  readonly displayText: string;
  readonly delay: number; // Animation delay in ms
}

/**
 * Get stats configuration for homepage display
 * Dynamically generates from registry with animation stagger
 *
 * @returns Array of category stats configurations
 */
export function getCategoryStatsConfig(): readonly CategoryStatsConfig[] {
  return getAllCategoryIds().map((id, index) => {
    const config = UNIFIED_CATEGORY_REGISTRY[id];
    return {
      categoryId: id,
      icon: config.icon,
      displayText: config.pluralTitle,
      delay: index * 100, // Stagger animations by 100ms
    };
  });
}

/**
 * Calculate total resource count from stats object
 * Used for dynamic newsletter CTA copy
 *
 * @param stats - Stats object with category counts (from homepage)
 * @returns Total number of resources across all categories
 */
export function getTotalResourceCount(stats: Record<string, number>): number {
  return Object.values(stats).reduce((sum, count) => sum + count, 0);
}

/**
 * Newsletter CTA Copy Configuration
 * Honest, conversion-optimized messaging based on 2025 best practices
 */
export const NEWSLETTER_CTA_CONFIG = {
  /** Headline for main CTA (3-5 words, benefit-driven) */
  headline: 'Discover New Claude Tools',

  /** Subheadline explaining value (single line) */
  description:
    'Weekly picks, exclusive guides, and early access to new features. Join our growing community.',

  /** Button text (2-4 words, first-person for 371% higher conversion) */
  buttonText: 'Count Me In',

  /** Footer text (social proof without lying) */
  footerText: 'No spam • Unsubscribe anytime',

  /** Early adopter appeal for smaller sites */
  earlyAdopterBadge: 'Founding Member Access',
} as const;
