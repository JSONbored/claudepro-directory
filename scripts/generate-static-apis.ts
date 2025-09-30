#!/usr/bin/env node

/**
 * Static API Generation Script
 *
 * Pre-generates all API responses at build time to maximize performance.
 * This creates static JSON files that can be served directly by the CDN.
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
// Import directly from metadata files for build-time usage (not runtime lazy loaders)
import { agentsMetadata } from '../generated/agents-metadata.js';
import { commandsMetadata } from '../generated/commands-metadata.js';
import { hooksMetadata } from '../generated/hooks-metadata.js';
import { mcpMetadata } from '../generated/mcp-metadata.js';
import { rulesMetadata } from '../generated/rules-metadata.js';
import { APP_CONFIG } from '../lib/constants';
import { scriptLogger } from '../lib/logger.js';
import { buildConfig, env } from '../lib/schemas/env.schema';
import { nonNegativeInt, positiveInt } from '../lib/schemas/primitives/base-numbers';
import {
  isoDatetimeString,
  mediumString,
  nonEmptyString,
  urlString,
} from '../lib/schemas/primitives/base-strings';
import {
  type AppContentType,
  appContentTypeSchema,
  type ContentCategory,
  contentCategorySchema,
} from '../lib/schemas/shared.schema';

/**
 * Static API Generation Schemas (inlined - only used here)
 */
const STATIC_API_LIMITS = {
  MAX_ITEMS_PER_CATEGORY: 10000,
  MAX_TAG_LENGTH: 50,
  MAX_TAGS: 100,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_URL_LENGTH: 2048,
  MAX_SLUG_LENGTH: 200,
  MAX_POPULAR_TAGS: 50,
  MAX_CATEGORY_TAGS: 20,
} as const;

const baseContentItemSchema = z.object({
  slug: nonEmptyString
    .max(STATIC_API_LIMITS.MAX_SLUG_LENGTH)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format'),
  title: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).optional(),
  name: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).optional(),
  description: nonEmptyString.max(STATIC_API_LIMITS.MAX_DESCRIPTION_LENGTH),
  tags: z
    .array(
      nonEmptyString
        .max(STATIC_API_LIMITS.MAX_TAG_LENGTH)
        .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid tag format')
    )
    .max(STATIC_API_LIMITS.MAX_TAGS)
    .default([]),
  category: z.string().optional(),
});

const transformedContentItemSchema = baseContentItemSchema.extend({
  type: appContentTypeSchema,
  url: urlString
    .max(STATIC_API_LIMITS.MAX_URL_LENGTH)
    .regex(/^https:\/\/claudepro\.directory\//, 'Invalid URL format'),
});

const staticAPISearchableItemSchema = z.object({
  title: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH),
  name: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH),
  description: mediumString,
  tags: z.array(z.string().max(STATIC_API_LIMITS.MAX_TAG_LENGTH)).max(STATIC_API_LIMITS.MAX_TAGS),
  category: z.string(),
  popularity: nonNegativeInt.default(0),
  slug: z.string().max(STATIC_API_LIMITS.MAX_SLUG_LENGTH),
});

const contentTypeApiResponseSchema = z.object({
  agents: z.array(transformedContentItemSchema).optional(),
  mcp: z.array(transformedContentItemSchema).optional(),
  hooks: z.array(transformedContentItemSchema).optional(),
  commands: z.array(transformedContentItemSchema).optional(),
  rules: z.array(transformedContentItemSchema).optional(),
  count: nonNegativeInt.max(STATIC_API_LIMITS.MAX_ITEMS_PER_CATEGORY),
  lastUpdated: isoDatetimeString,
  generated: z.literal('static'),
});

const statisticsSchema = z.object({
  totalConfigurations: nonNegativeInt,
  agents: nonNegativeInt,
  mcp: nonNegativeInt,
  rules: nonNegativeInt,
  commands: nonNegativeInt,
  hooks: nonNegativeInt,
});

const endpointsSchema = z.object({
  agents: urlString,
  mcp: urlString,
  rules: urlString,
  commands: urlString,
  hooks: urlString,
});

const allConfigurationsResponseSchema = z.object({
  '@context': z.literal('https://schema.org'),
  '@type': z.literal('Dataset'),
  name: z.string(),
  description: z.string(),
  license: z.string(),
  lastUpdated: isoDatetimeString,
  generated: z.literal('static'),
  statistics: statisticsSchema,
  data: z.object({
    agents: z.array(transformedContentItemSchema),
    mcp: z.array(transformedContentItemSchema),
    rules: z.array(transformedContentItemSchema),
    commands: z.array(transformedContentItemSchema),
    hooks: z.array(transformedContentItemSchema),
  }),
  endpoints: endpointsSchema,
});

const popularTagSchema = z.object({
  tag: z.string().max(STATIC_API_LIMITS.MAX_TAG_LENGTH),
  count: positiveInt,
});

const categoryCountSchema = z.object({
  category: z.string(),
  count: nonNegativeInt,
});

const categorySearchIndexSchema = z.object({
  category: contentCategorySchema,
  items: z.array(staticAPISearchableItemSchema).max(STATIC_API_LIMITS.MAX_ITEMS_PER_CATEGORY),
  count: nonNegativeInt,
  lastUpdated: isoDatetimeString,
  generated: z.literal('static'),
  tags: z.array(z.string()).max(STATIC_API_LIMITS.MAX_TAGS * 10),
  popularTags: z.array(popularTagSchema).max(STATIC_API_LIMITS.MAX_CATEGORY_TAGS),
});

const combinedSearchIndexSchema = z.object({
  items: z.array(staticAPISearchableItemSchema),
  count: nonNegativeInt,
  lastUpdated: isoDatetimeString,
  generated: z.literal('static'),
  categories: z.array(categoryCountSchema),
  tags: z.array(z.string()),
  popularTags: z.array(popularTagSchema).max(STATIC_API_LIMITS.MAX_POPULAR_TAGS),
});

const healthCheckResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  timestamp: isoDatetimeString,
  generated: z.literal('static'),
  version: z.string(),
  environment: z.string(),
  counts: z.object({
    agents: nonNegativeInt,
    mcp: nonNegativeInt,
    rules: nonNegativeInt,
    commands: nonNegativeInt,
    hooks: nonNegativeInt,
    total: nonNegativeInt,
  }),
  features: z.object({
    staticGeneration: z.boolean(),
    searchIndexes: z.boolean(),
    redisCache: z.boolean(),
    rateLimit: z.boolean(),
  }),
});

const generationResultSchema = z.object({
  success: z.boolean(),
  outputDir: z.string(),
  filesGenerated: z.array(z.string()),
  totalItems: nonNegativeInt,
  duration: nonNegativeInt,
  errors: z.array(z.string()).optional(),
});

type TransformedContentItem = z.infer<typeof transformedContentItemSchema>;
type StaticAPISearchableItem = z.infer<typeof staticAPISearchableItemSchema>;
type ContentTypeApiResponse = z.infer<typeof contentTypeApiResponseSchema>;
type AllConfigurationsResponse = z.infer<typeof allConfigurationsResponseSchema>;
type CategorySearchIndex = z.infer<typeof categorySearchIndexSchema>;
type CombinedSearchIndex = z.infer<typeof combinedSearchIndexSchema>;
type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
type GenerationResult = z.infer<typeof generationResultSchema>;

// Output directory for static APIs
const OUTPUT_DIR = join(process.cwd(), 'public', 'static-api');

// Helper function to transform content with type and URL
function transformContent<T extends { slug: string }>(
  content: readonly T[] | T[],
  type: AppContentType,
  category: string
): TransformedContentItem[] {
  return content.map((item) => {
    const transformed = {
      ...item,
      type,
      url: `${APP_CONFIG.url}/${category}/${item.slug}`,
    };

    // Validate the transformed item
    return transformedContentItemSchema.parse(transformed);
  });
}

// Convert content items to searchable format
function toSearchableItems<
  T extends {
    title?: string | undefined;
    name?: string | undefined;
    description: string;
    tags?: readonly string[] | string[] | undefined; // Optional tags
    slug: string;
    category?: string | undefined;
    [key: string]: unknown;
  },
>(items: readonly T[] | T[], category: string): StaticAPISearchableItem[] {
  return items.map((item) => {
    const searchable = {
      title: item.title || item.name || '',
      name: item.name || '',
      description: item.description,
      tags: item.tags ? (Array.isArray(item.tags) ? [...item.tags] : []) : [],
      category: item.category || category,
      popularity: 0, // Will be populated from Redis in production
      slug: item.slug,
    };

    // Validate the searchable item - this will throw if validation fails
    return staticAPISearchableItemSchema.parse(searchable);
  });
}

// Generate individual content type APIs
async function generateContentTypeAPIs() {
  const contentMap = {
    'agents.json': { data: agentsMetadata, type: 'agent' as AppContentType },
    'mcp.json': { data: mcpMetadata, type: 'mcp' as AppContentType },
    'hooks.json': { data: hooksMetadata, type: 'hook' as AppContentType },
    'commands.json': { data: commandsMetadata, type: 'command' as AppContentType },
    'rules.json': { data: rulesMetadata, type: 'rule' as AppContentType },
  };

  scriptLogger.progress('Generating individual content type APIs...');

  for (const [filename, { data, type }] of Object.entries(contentMap)) {
    const category = filename.replace('.json', '') as ContentCategory;

    // Validate category
    const validatedCategory = contentCategorySchema.parse(category);

    // Transform and validate items
    const transformedItems = data.map((item) => {
      const transformed = {
        ...item,
        type,
        url: `${APP_CONFIG.url}/${validatedCategory}/${item.slug}`,
      };
      return transformedContentItemSchema.parse(transformed);
    });

    const responseData: ContentTypeApiResponse = {
      [validatedCategory]: transformedItems,
      count: transformedItems.length,
      lastUpdated: new Date().toISOString(),
      generated: 'static' as const,
    };

    // Validate the full response
    const validatedResponse = contentTypeApiResponseSchema.parse(responseData);

    const outputFile = join(OUTPUT_DIR, filename);
    await writeFile(outputFile, JSON.stringify(validatedResponse, null, 2));

    scriptLogger.success(`Generated ${filename} (${transformedItems.length} items)`);
  }
}

// Generate all configurations API
async function generateAllConfigurationsAPI() {
  scriptLogger.progress('Generating all-configurations API...');

  const transformedAgents = transformContent(agentsMetadata, 'agent' as AppContentType, 'agents');
  const transformedMcp = transformContent(mcpMetadata, 'mcp' as AppContentType, 'mcp');
  const transformedRules = transformContent(rulesMetadata, 'rule' as AppContentType, 'rules');
  const transformedCommands = transformContent(
    commandsMetadata,
    'command' as AppContentType,
    'commands'
  );
  const transformedHooks = transformContent(hooksMetadata, 'hook' as AppContentType, 'hooks');

  const allConfigurations: AllConfigurationsResponse = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${APP_CONFIG.name} - All Configurations`,
    description: APP_CONFIG.description,
    license: APP_CONFIG.license,
    lastUpdated: new Date().toISOString(),
    generated: 'static' as const,
    statistics: {
      totalConfigurations:
        transformedAgents.length +
        transformedMcp.length +
        transformedRules.length +
        transformedCommands.length +
        transformedHooks.length,
      agents: transformedAgents.length,
      mcp: transformedMcp.length,
      rules: transformedRules.length,
      commands: transformedCommands.length,
      hooks: transformedHooks.length,
    },
    data: {
      agents: transformedAgents,
      mcp: transformedMcp,
      rules: transformedRules,
      commands: transformedCommands,
      hooks: transformedHooks,
    },
    endpoints: {
      agents: `${APP_CONFIG.url}/api/agents.json`,
      mcp: `${APP_CONFIG.url}/api/mcp.json`,
      rules: `${APP_CONFIG.url}/api/rules.json`,
      commands: `${APP_CONFIG.url}/api/commands.json`,
      hooks: `${APP_CONFIG.url}/api/hooks.json`,
    },
  };

  // Validate the full response
  const validatedConfigurations = allConfigurationsResponseSchema.parse(allConfigurations);

  const outputFile = join(OUTPUT_DIR, 'all-configurations.json');
  await writeFile(outputFile, JSON.stringify(validatedConfigurations, null, 2));

  scriptLogger.success(
    `Generated all-configurations.json (${validatedConfigurations.statistics.totalConfigurations} total items)`
  );
}

// Generate search indexes
async function generateSearchIndexes() {
  scriptLogger.progress('Generating search indexes...');

  // Create combined searchable dataset
  const allSearchableItems: StaticAPISearchableItem[] = [
    ...toSearchableItems([...agentsMetadata], 'agents'),
    ...toSearchableItems([...mcpMetadata], 'mcp'),
    ...toSearchableItems([...rulesMetadata], 'rules'),
    ...toSearchableItems([...commandsMetadata], 'commands'),
    ...toSearchableItems([...hooksMetadata], 'hooks'),
  ];

  // Generate category-specific indexes
  const categories: ContentCategory[] = ['agents', 'mcp', 'rules', 'commands', 'hooks'];

  for (const category of categories) {
    const categoryItems = allSearchableItems.filter((item) => item.category === category);

    const searchIndex: CategorySearchIndex = {
      category,
      items: categoryItems,
      count: categoryItems.length,
      lastUpdated: new Date().toISOString(),
      generated: 'static' as const,
      // Pre-computed search metadata
      tags: [...new Set(categoryItems.flatMap((item) => item.tags))].sort(),
      popularTags: [...new Set(categoryItems.flatMap((item) => item.tags))]
        .map((tag) => ({
          tag,
          count: categoryItems.filter((item) => item.tags.includes(tag)).length,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
    };

    // Validate the search index
    const validatedIndex = categorySearchIndexSchema.parse(searchIndex);

    const outputFile = join(OUTPUT_DIR, 'search-indexes', `${category}.json`);
    await writeFile(outputFile, JSON.stringify(validatedIndex, null, 2));

    scriptLogger.success(`Generated search index for ${category} (${categoryItems.length} items)`);
  }

  // Generate combined search index
  const combinedSearchIndex: CombinedSearchIndex = {
    items: allSearchableItems,
    count: allSearchableItems.length,
    lastUpdated: new Date().toISOString(),
    generated: 'static' as const,
    categories: categories.map((category) => ({
      category,
      count: allSearchableItems.filter((item) => item.category === category).length,
    })),
    tags: [...new Set(allSearchableItems.flatMap((item) => item.tags))].sort(),
    popularTags: [...new Set(allSearchableItems.flatMap((item) => item.tags))]
      .map((tag) => ({
        tag,
        count: allSearchableItems.filter((item) => item.tags.includes(tag)).length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50),
  };

  // Validate the combined index
  const validatedCombinedIndex = combinedSearchIndexSchema.parse(combinedSearchIndex);

  const combinedOutputFile = join(OUTPUT_DIR, 'search-indexes', 'combined.json');
  await writeFile(combinedOutputFile, JSON.stringify(validatedCombinedIndex, null, 2));

  scriptLogger.success(`Generated combined search index (${allSearchableItems.length} items)`);
}

// Generate health check endpoint
async function generateHealthCheck() {
  scriptLogger.progress('Generating health check endpoint...');

  const healthData: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    generated: 'static' as const,
    version: buildConfig.version,
    environment: env.NODE_ENV,
    counts: {
      agents: agentsMetadata.length,
      mcp: mcpMetadata.length,
      rules: rulesMetadata.length,
      commands: commandsMetadata.length,
      hooks: hooksMetadata.length,
      total:
        agentsMetadata.length +
        mcpMetadata.length +
        rulesMetadata.length +
        commandsMetadata.length +
        hooksMetadata.length,
    },
    features: {
      staticGeneration: true,
      searchIndexes: true,
      redisCache: true,
      rateLimit: true,
    },
  };

  // Validate health check response
  const validatedHealth = healthCheckResponseSchema.parse(healthData);

  const outputFile = join(OUTPUT_DIR, 'health.json');
  await writeFile(outputFile, JSON.stringify(validatedHealth, null, 2));

  scriptLogger.success('Generated health check endpoint');
}

// Main generation function
async function generateStaticAPIs(): Promise<GenerationResult> {
  scriptLogger.progress('Starting static API generation...');
  const startTime = performance.now();
  const filesGenerated: string[] = [];
  const errors: string[] = [];

  try {
    // Ensure output directories exist
    await mkdir(OUTPUT_DIR, { recursive: true });
    await mkdir(join(OUTPUT_DIR, 'search-indexes'), { recursive: true });

    // Generate all static APIs
    await generateContentTypeAPIs();
    filesGenerated.push('agents.json', 'mcp.json', 'hooks.json', 'commands.json', 'rules.json');

    await generateAllConfigurationsAPI();
    filesGenerated.push('all-configurations.json');

    await generateSearchIndexes();
    filesGenerated.push(
      'search-indexes/agents.json',
      'search-indexes/mcp.json',
      'search-indexes/rules.json',
      'search-indexes/commands.json',
      'search-indexes/hooks.json',
      'search-indexes/combined.json'
    );

    await generateHealthCheck();
    filesGenerated.push('health.json');

    const duration = performance.now() - startTime;

    const totalItems =
      agentsMetadata.length +
      mcpMetadata.length +
      rulesMetadata.length +
      commandsMetadata.length +
      hooksMetadata.length;

    scriptLogger.success('All static APIs generated successfully!');
    scriptLogger.log(`Output directory: ${OUTPUT_DIR}`);
    scriptLogger.log('APIs can now be served directly from CDN for maximum performance');

    return {
      success: true,
      outputDir: OUTPUT_DIR,
      filesGenerated,
      totalItems,
      duration,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      scriptLogger.error(
        `Validation error during generation: ${error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`
      );
      errors.push(...error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    } else {
      scriptLogger.failure(
        `Failed to generate static APIs: ${error instanceof Error ? error.message : String(error)}`
      );
      errors.push(String(error));
    }

    process.exit(1);
  }
}

// Run if called directly (ESM compatible)
if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (
    process.argv[1] &&
    (process.argv[1] === modulePath || process.argv[1].endsWith('generate-static-apis.ts'))
  ) {
    generateStaticAPIs()
      .then(() => process.exit(0))
      .catch((error) => {
        scriptLogger.error(
          'Unexpected error:',
          error instanceof Error ? error : new Error(String(error))
        );
        process.exit(1);
      });
  }
}

export { generateStaticAPIs };
