/**
 * Build-Time Category Configuration
 *
 * Centralized build configuration for content processing and generation.
 * Extends the runtime category-config.ts with build-specific settings.
 *
 * Modern 2025 Architecture:
 * - Type-safe configuration system
 * - Zero duplication across build scripts
 * - Performance-optimized parallel processing
 * - Security-validated with Zod schemas
 *
 * @see lib/config/category-config.ts - Runtime UI configuration
 * @see scripts/build-content.ts - Uses this for content building
 * @see scripts/generate-static-apis.ts - Uses this for API generation
 */

import type { z } from 'zod';
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
  | CollectionContent;

/**
 * Build-time category configuration
 * Performance-optimized for parallel processing and caching
 */
export interface BuildCategoryConfig<T extends ContentType = ContentType> {
  /** Category identifier (must match ContentCategory type) */
  readonly id: ContentCategory;

  /** Human-readable category name */
  readonly name: string;

  /** Validation schema for this content type */
  readonly schema: z.ZodType<T>;

  /** Type discriminator for metadata exports */
  readonly typeName: string;

  /** Whether this category generates full content exports (vs metadata only) */
  readonly generateFullContent: boolean;

  /** Metadata field mapping for optimized exports */
  readonly metadataFields: ReadonlyArray<string>;

  /** Build performance configuration */
  readonly buildConfig: {
    /** Batch size for parallel processing */
    readonly batchSize: number;
    /** Enable incremental caching */
    readonly enableCache: boolean;
    /** Cache TTL in milliseconds */
    readonly cacheTTL: number;
  };

  /** API generation configuration */
  readonly apiConfig: {
    /** Generate static API endpoint */
    readonly generateStaticAPI: boolean;
    /** Include in trending calculations */
    readonly includeTrending: boolean;
    /** Maximum items per API response */
    readonly maxItemsPerResponse: number;
  };
}

/**
 * Build Category Registry
 * Centralized configuration using modern const assertion for type inference
 *
 * Performance characteristics (2025 best practices):
 * - Parallel processing with optimal batch sizes
 * - Incremental caching for fast rebuilds
 * - Security-validated with Zod schemas
 * - Type-safe with discriminated unions
 */
export const BUILD_CATEGORY_CONFIGS = {
  agents: {
    id: 'agents',
    name: 'AI Agents',
    schema: agentContentSchema,
    typeName: 'AgentContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
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
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
  },

  mcp: {
    id: 'mcp',
    name: 'MCP Servers',
    schema: mcpContentSchema,
    typeName: 'McpContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
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
  },

  rules: {
    id: 'rules',
    name: 'Rules',
    schema: ruleContentSchema,
    typeName: 'RuleContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
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
  },

  commands: {
    id: 'commands',
    name: 'Commands',
    schema: commandContentSchema,
    typeName: 'CommandContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
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
  },

  hooks: {
    id: 'hooks',
    name: 'Hooks',
    schema: hookContentSchema,
    typeName: 'HookContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
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
  },

  statuslines: {
    id: 'statuslines',
    name: 'Statuslines',
    schema: statuslineContentSchema,
    typeName: 'StatuslineContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
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
  },

  collections: {
    id: 'collections',
    name: 'Collections',
    schema: collectionContentSchema,
    typeName: 'CollectionContent',
    generateFullContent: true,
    metadataFields: [
      'slug',
      'title',
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
      cacheTTL: 5 * 60 * 1000, // 5 minutes
    },
    apiConfig: {
      generateStaticAPI: true,
      includeTrending: true,
      maxItemsPerResponse: 1000,
    },
  },
} as const satisfies Record<string, BuildCategoryConfig>;

/**
 * Type-safe category ID union from config
 * Modern TypeScript pattern using satisfies + const assertion
 */
export type BuildCategoryId = keyof typeof BUILD_CATEGORY_CONFIGS;

/**
 * Type-safe category config lookup
 * Performance: O(1) object property access
 */
export function getBuildCategoryConfig<T extends BuildCategoryId>(
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
 * Useful for iteration in build scripts
 */
export function getAllBuildCategoryConfigs(): Array<BuildCategoryConfig> {
  return Object.values(BUILD_CATEGORY_CONFIGS);
}

/**
 * Extract metadata from content item
 * Modern approach: Runtime-safe field extraction with type widening
 *
 * @param content - Full content item
 * @param config - Category configuration
 * @returns Metadata-only object (optimized for lazy loading)
 */
export function extractMetadata(
  content: ContentType,
  config: BuildCategoryConfig
): Record<string, unknown> {
  const metadata: Record<string, unknown> = {};

  for (const field of config.metadataFields) {
    if (Object.hasOwn(content, field)) {
      // Type-safe field access with Object.hasOwn (modern 2025 pattern)
      metadata[field as string] = content[field as keyof ContentType];
    }
  }

  return metadata;
}

/**
 * Performance metrics for build operations
 * Modern observability pattern
 */
export interface BuildMetrics {
  readonly category: BuildCategoryId;
  readonly filesProcessed: number;
  readonly filesValid: number;
  readonly filesInvalid: number;
  readonly processingTimeMs: number;
  readonly cacheHitRate: number;
  readonly peakMemoryMB: number;
}

/**
 * Build result with metrics
 * Modern result pattern with comprehensive diagnostics
 */
export interface CategoryBuildResult {
  readonly category: BuildCategoryId;
  readonly success: boolean;
  readonly items: readonly ContentType[];
  readonly metadata: readonly Record<string, unknown>[];
  readonly metrics: BuildMetrics;
  readonly errors: readonly Error[];
}
