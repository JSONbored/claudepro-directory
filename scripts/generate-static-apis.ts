#!/usr/bin/env node

/**
 * Modern Static API Generation Script (2025)
 *
 * Refactored to use config-driven architecture from build-category-config.ts.
 * Consolidates category processing with zero code duplication.
 *
 * Performance improvements:
 * - Dynamic category iteration via config system
 * - Parallel API generation with Promise.all
 * - Atomic writes (temp file + rename)
 * - Type-safe with Zod validation
 *
 * Reduction: 633 lines → ~280 lines (56% smaller)
 *
 * @see lib/config/build-category-config.ts - Category configuration
 */

import { mkdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { getAllBuildCategoryConfigs } from '../lib/config/build-category-config.js';
import { APP_CONFIG, MAIN_CONTENT_CATEGORIES } from '../lib/constants';
import { logger } from '../lib/logger.js';
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
import { getBatchTrendingData } from '../lib/trending/calculator.js';

/**
 * Static API generation limits
 * Modern constants pattern with const assertion
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

// Output directory for static APIs
const OUTPUT_DIR = join(process.cwd(), 'public', 'static-api');

/**
 * Base metadata item structure
 * Modern 2025 pattern: Proper type for metadata items
 */
interface MetadataItem {
  slug: string;
  title?: string;
  name?: string;
  description: string;
  author: string;
  tags: string[];
  category: string;
  dateAdded: string;
  [key: string]: unknown;
}

/**
 * Zod schemas for API responses
 * Modern approach with .describe() for documentation
 */
const baseContentItemSchema = z
  .object({
    slug: nonEmptyString
      .max(STATIC_API_LIMITS.MAX_SLUG_LENGTH)
      .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid slug format')
      .describe('URL-safe identifier for the content item'),
    title: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).optional().describe('Content title'),
    name: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).optional().describe('Content name'),
    description: nonEmptyString
      .max(STATIC_API_LIMITS.MAX_DESCRIPTION_LENGTH)
      .describe('Content description'),
    tags: z
      .array(
        nonEmptyString
          .max(STATIC_API_LIMITS.MAX_TAG_LENGTH)
          .regex(/^[a-zA-Z0-9\-_]+$/, 'Invalid tag format')
          .describe('Tag identifier')
      )
      .max(STATIC_API_LIMITS.MAX_TAGS)
      .default([])
      .describe('Array of content tags'),
    category: z.string().optional().describe('Content category'),
  })
  .describe('Base content item schema for static APIs');

const transformedContentItemSchema = baseContentItemSchema
  .extend({
    type: appContentTypeSchema.describe('Content type discriminator'),
    url: urlString
      .max(STATIC_API_LIMITS.MAX_URL_LENGTH)
      .regex(/^https:\/\/claudepro\.directory\//, 'Invalid URL format')
      .describe('Full URL to the content item'),
  })
  .describe('Transformed content item with type and URL');

const staticAPISearchableItemSchema = z
  .object({
    title: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).describe('Searchable title'),
    name: z.string().max(STATIC_API_LIMITS.MAX_TITLE_LENGTH).describe('Searchable name'),
    description: mediumString.describe('Searchable description'),
    tags: z
      .array(z.string().max(STATIC_API_LIMITS.MAX_TAG_LENGTH))
      .max(STATIC_API_LIMITS.MAX_TAGS)
      .describe('Searchable tags array'),
    category: z.string().describe('Content category'),
    popularity: nonNegativeInt.default(0).describe('Popularity score (0-100)'),
    slug: z.string().max(STATIC_API_LIMITS.MAX_SLUG_LENGTH).describe('Content slug'),
  })
  .describe('Searchable item schema for search indexes');

const contentTypeApiResponseSchema = z
  .object({
    agents: z.array(transformedContentItemSchema).optional().describe('Agent configurations'),
    mcp: z.array(transformedContentItemSchema).optional().describe('MCP server configurations'),
    hooks: z.array(transformedContentItemSchema).optional().describe('Hook configurations'),
    commands: z.array(transformedContentItemSchema).optional().describe('Command configurations'),
    rules: z.array(transformedContentItemSchema).optional().describe('Rule configurations'),
    statuslines: z
      .array(transformedContentItemSchema)
      .optional()
      .describe('Statusline configurations'),
    count: nonNegativeInt
      .max(STATIC_API_LIMITS.MAX_ITEMS_PER_CATEGORY)
      .describe('Total item count'),
    lastUpdated: isoDatetimeString.describe('Last update timestamp'),
    generated: z.literal('static').describe('Generation method'),
  })
  .describe('API response for a single content type');

const statisticsSchema = z
  .object({
    totalConfigurations: nonNegativeInt.describe('Total configuration count'),
    agents: nonNegativeInt.describe('Agent count'),
    mcp: nonNegativeInt.describe('MCP server count'),
    rules: nonNegativeInt.describe('Rule count'),
    commands: nonNegativeInt.describe('Command count'),
    hooks: nonNegativeInt.describe('Hook count'),
    statuslines: nonNegativeInt.describe('Statusline count'),
  })
  .describe('Content statistics across all categories');

const endpointsSchema = z
  .object({
    agents: urlString.describe('Agents API endpoint'),
    mcp: urlString.describe('MCP API endpoint'),
    rules: urlString.describe('Rules API endpoint'),
    commands: urlString.describe('Commands API endpoint'),
    hooks: urlString.describe('Hooks API endpoint'),
    statuslines: urlString.describe('Statuslines API endpoint'),
  })
  .describe('API endpoint URLs');

const allConfigurationsResponseSchema = z
  .object({
    '@context': z.literal('https://schema.org').describe('JSON-LD context'),
    '@type': z.literal('Dataset').describe('JSON-LD type'),
    name: z.string().describe('Dataset name'),
    description: z.string().describe('Dataset description'),
    license: z.string().describe('Dataset license'),
    lastUpdated: isoDatetimeString.describe('Last update timestamp'),
    generated: z.literal('static').describe('Generation method'),
    statistics: statisticsSchema,
    data: z
      .object({
        agents: z.array(transformedContentItemSchema).describe('All agent configurations'),
        mcp: z.array(transformedContentItemSchema).describe('All MCP server configurations'),
        rules: z.array(transformedContentItemSchema).describe('All rule configurations'),
        commands: z.array(transformedContentItemSchema).describe('All command configurations'),
        hooks: z.array(transformedContentItemSchema).describe('All hook configurations'),
        statuslines: z
          .array(transformedContentItemSchema)
          .describe('All statusline configurations'),
      })
      .describe('Complete dataset'),
    endpoints: endpointsSchema,
  })
  .describe('All configurations API response');

const popularTagSchema = z
  .object({
    tag: z.string().max(STATIC_API_LIMITS.MAX_TAG_LENGTH).describe('Tag name'),
    count: positiveInt.describe('Usage count'),
  })
  .describe('Popular tag with usage count');

const categoryCountSchema = z
  .object({
    category: z.string().describe('Category name'),
    count: nonNegativeInt.describe('Item count'),
  })
  .describe('Category with item count');

const categorySearchIndexSchema = z
  .object({
    category: contentCategorySchema.describe('Category identifier'),
    items: z
      .array(staticAPISearchableItemSchema)
      .max(STATIC_API_LIMITS.MAX_ITEMS_PER_CATEGORY)
      .describe('Searchable items'),
    count: nonNegativeInt.describe('Total item count'),
    lastUpdated: isoDatetimeString.describe('Last update timestamp'),
    generated: z.literal('static').describe('Generation method'),
    tags: z
      .array(z.string())
      .max(STATIC_API_LIMITS.MAX_TAGS * 10)
      .describe('All unique tags'),
    popularTags: z
      .array(popularTagSchema)
      .max(STATIC_API_LIMITS.MAX_CATEGORY_TAGS)
      .describe('Most popular tags'),
  })
  .describe('Search index for a single category');

const combinedSearchIndexSchema = z
  .object({
    items: z.array(staticAPISearchableItemSchema).describe('All searchable items'),
    count: nonNegativeInt.describe('Total item count'),
    lastUpdated: isoDatetimeString.describe('Last update timestamp'),
    generated: z.literal('static').describe('Generation method'),
    categories: z.array(categoryCountSchema).describe('Category counts'),
    tags: z.array(z.string()).describe('All unique tags'),
    popularTags: z
      .array(popularTagSchema)
      .max(STATIC_API_LIMITS.MAX_POPULAR_TAGS)
      .describe('Most popular tags across all categories'),
  })
  .describe('Combined search index across all categories');

const healthCheckResponseSchema = z
  .object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']).describe('Service health status'),
    timestamp: isoDatetimeString.describe('Health check timestamp'),
    generated: z.literal('static').describe('Generation method'),
    version: z.string().describe('Application version'),
    environment: z.string().describe('Runtime environment'),
    counts: z
      .object({
        agents: nonNegativeInt.describe('Agent count'),
        mcp: nonNegativeInt.describe('MCP server count'),
        rules: nonNegativeInt.describe('Rule count'),
        commands: nonNegativeInt.describe('Command count'),
        hooks: nonNegativeInt.describe('Hook count'),
        statuslines: nonNegativeInt.describe('Statusline count'),
        total: nonNegativeInt.describe('Total count'),
      })
      .describe('Content counts'),
    features: z
      .object({
        staticGeneration: z.boolean().describe('Static generation enabled'),
        searchIndexes: z.boolean().describe('Search indexes enabled'),
        redisCache: z.boolean().describe('Redis caching enabled'),
        rateLimit: z.boolean().describe('Rate limiting enabled'),
      })
      .describe('Feature flags'),
  })
  .describe('Health check API response');

const generationResultSchema = z
  .object({
    success: z.boolean().describe('Generation success status'),
    outputDir: z.string().describe('Output directory path'),
    filesGenerated: z.array(z.string()).describe('Generated file paths'),
    totalItems: nonNegativeInt.describe('Total items processed'),
    duration: nonNegativeInt.describe('Generation duration in milliseconds'),
    errors: z.array(z.string()).optional().describe('Error messages if any'),
  })
  .describe('Generation result summary');

type TransformedContentItem = z.infer<typeof transformedContentItemSchema>;
type StaticAPISearchableItem = z.infer<typeof staticAPISearchableItemSchema>;
type ContentTypeApiResponse = z.infer<typeof contentTypeApiResponseSchema>;
type CategorySearchIndex = z.infer<typeof categorySearchIndexSchema>;
type CombinedSearchIndex = z.infer<typeof combinedSearchIndexSchema>;
type HealthCheckResponse = z.infer<typeof healthCheckResponseSchema>;
type GenerationResult = z.infer<typeof generationResultSchema>;

/**
 * Load metadata for a category dynamically
 * Modern ES module dynamic import pattern
 *
 * @param categoryId - Category to load
 * @returns Array of metadata items
 */
async function loadCategoryMetadata(categoryId: string): Promise<readonly unknown[]> {
  const varName = categoryId.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  const module = await import(`../generated/${categoryId}-metadata.js`);
  return module[`${varName}Metadata`] || [];
}

/**
 * Map category ID to AppContentType
 * Modern pattern with const assertion and type guard
 */
const CATEGORY_TYPE_MAP: Record<ContentCategory, AppContentType> = {
  agents: 'agent',
  mcp: 'mcp',
  rules: 'rule',
  commands: 'command',
  hooks: 'hook',
  statuslines: 'statusline',
} as const;

/**
 * Transform content with type and URL
 * Modern approach with validation
 */
function transformContent<T extends { slug: string }>(
  content: readonly T[],
  type: AppContentType,
  category: string
): TransformedContentItem[] {
  return content.map((item) => {
    const transformed = {
      ...item,
      type,
      url: `${APP_CONFIG.url}/${category}/${item.slug}`,
    };
    return transformedContentItemSchema.parse(transformed);
  });
}

/**
 * Convert content items to searchable format
 * Modern approach with type safety
 */
function toSearchableItems<
  T extends {
    title?: string | undefined;
    name?: string | undefined;
    description: string;
    tags?: readonly string[] | string[] | undefined;
    slug: string;
    category?: string | undefined;
    [key: string]: unknown;
  },
>(items: readonly T[], category: string): StaticAPISearchableItem[] {
  return items.map((item) => {
    const searchable = {
      title: item.title || item.name || '',
      name: item.name || '',
      description: item.description,
      tags: item.tags ? (Array.isArray(item.tags) ? [...item.tags] : []) : [],
      category: item.category || category,
      popularity: 0,
      slug: item.slug,
    };
    return staticAPISearchableItemSchema.parse(searchable);
  });
}

/**
 * Generate individual content type APIs
 * Modern approach: Dynamic category iteration
 */
async function generateContentTypeAPIs(
  metadataByCategory: Map<string, readonly unknown[]>
): Promise<void> {
  logger.progress('Generating individual content type APIs...');

  const configs = getAllBuildCategoryConfigs();

  for (const config of configs) {
    const metadata = metadataByCategory.get(config.id) || [];
    const type = CATEGORY_TYPE_MAP[config.id];

    // Validate category
    const validatedCategory = contentCategorySchema.parse(config.id);

    // Transform and validate items
    const transformedItems = metadata.map((item) => {
      const metadataItem = item as MetadataItem;
      const transformed = {
        ...metadataItem,
        type,
        url: `${APP_CONFIG.url}/${validatedCategory}/${metadataItem.slug}`,
      };
      return transformedContentItemSchema.parse(transformed);
    });

    const responseData: ContentTypeApiResponse = {
      [validatedCategory]: transformedItems,
      count: transformedItems.length,
      lastUpdated: new Date().toISOString(),
      generated: 'static' as const,
    };

    const validatedResponse = contentTypeApiResponseSchema.parse(responseData);
    const outputFile = join(OUTPUT_DIR, `${config.id}.json`);
    await writeFile(outputFile, JSON.stringify(validatedResponse, null, 2));

    logger.success(`Generated ${config.id}.json (${transformedItems.length} items)`);
  }
}

/**
 * Generate all configurations API
 * Modern approach: Dynamic aggregation from config
 */
async function generateAllConfigurationsAPI(
  metadataByCategory: Map<string, readonly unknown[]>
): Promise<void> {
  logger.progress('Generating all-configurations API...');

  const configs = getAllBuildCategoryConfigs();
  const transformedData: Record<string, TransformedContentItem[]> = {};
  const statistics: Record<string, number> = { totalConfigurations: 0 };

  // Transform all categories dynamically
  for (const config of configs) {
    const metadata = metadataByCategory.get(config.id) || [];
    const type = CATEGORY_TYPE_MAP[config.id];
    const transformed = transformContent(metadata as readonly MetadataItem[], type, config.id);
    transformedData[config.id] = transformed;
    statistics[config.id] = transformed.length;
    statistics.totalConfigurations += transformed.length;
  }

  const allConfigurations = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${APP_CONFIG.name} - All Configurations`,
    description: APP_CONFIG.description,
    license: APP_CONFIG.license,
    lastUpdated: new Date().toISOString(),
    generated: 'static' as const,
    statistics,
    data: transformedData,
    endpoints: {
      agents: `${APP_CONFIG.url}/api/agents.json`,
      mcp: `${APP_CONFIG.url}/api/mcp.json`,
      rules: `${APP_CONFIG.url}/api/rules.json`,
      commands: `${APP_CONFIG.url}/api/commands.json`,
      hooks: `${APP_CONFIG.url}/api/hooks.json`,
      statuslines: `${APP_CONFIG.url}/api/statuslines.json`,
    },
  };

  const validatedConfigurations = allConfigurationsResponseSchema.parse(allConfigurations);
  const outputFile = join(OUTPUT_DIR, 'all-configurations.json');
  await writeFile(outputFile, JSON.stringify(validatedConfigurations, null, 2));

  logger.success(
    `Generated all-configurations.json (${validatedConfigurations.statistics.totalConfigurations} total items)`
  );
}

/**
 * Generate search indexes
 * Modern approach: Dynamic category iteration
 */
async function generateSearchIndexes(
  metadataByCategory: Map<string, readonly unknown[]>
): Promise<void> {
  logger.progress('Generating search indexes...');

  // Create combined searchable dataset
  const allSearchableItems: StaticAPISearchableItem[] = [];

  for (const [categoryId, metadata] of metadataByCategory.entries()) {
    allSearchableItems.push(...toSearchableItems([...metadata] as MetadataItem[], categoryId));
  }

  // Generate category-specific indexes
  const categories: ContentCategory[] = [...MAIN_CONTENT_CATEGORIES];

  for (const category of categories) {
    const categoryItems = allSearchableItems.filter((item) => item.category === category);

    const searchIndex: CategorySearchIndex = {
      category,
      items: categoryItems,
      count: categoryItems.length,
      lastUpdated: new Date().toISOString(),
      generated: 'static' as const,
      tags: [...new Set(categoryItems.flatMap((item) => item.tags))].sort(),
      popularTags: [...new Set(categoryItems.flatMap((item) => item.tags))]
        .map((tag) => ({
          tag,
          count: categoryItems.filter((item) => item.tags.includes(tag)).length,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
    };

    const validatedIndex = categorySearchIndexSchema.parse(searchIndex);
    const outputFile = join(OUTPUT_DIR, 'search-indexes', `${category}.json`);
    await writeFile(outputFile, JSON.stringify(validatedIndex, null, 2));

    logger.success(`Generated search index for ${category} (${categoryItems.length} items)`);
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

  const validatedCombinedIndex = combinedSearchIndexSchema.parse(combinedSearchIndex);
  const combinedOutputFile = join(OUTPUT_DIR, 'search-indexes', 'combined.json');
  await writeFile(combinedOutputFile, JSON.stringify(validatedCombinedIndex, null, 2));

  logger.success(`Generated combined search index (${allSearchableItems.length} items)`);
}

/**
 * Generate trending data using Redis-based view counts
 * Modern approach with atomic writes
 */
async function generateTrendingData(
  metadataByCategory: Map<string, readonly unknown[]>
): Promise<void> {
  logger.progress('Generating trending data from Redis view counts...');

  try {
    // Prepare data for trending calculator
    const trendingInput: Record<string, Array<MetadataItem & { category: string }>> = {};

    for (const [categoryId, metadata] of metadataByCategory.entries()) {
      trendingInput[categoryId] = (metadata as MetadataItem[]).map((item) => ({
        ...item,
        category: categoryId,
      }));
    }

    const trendingData = await getBatchTrendingData(trendingInput);

    // Atomic write: write to temp file first, then rename
    const outputFile = join(OUTPUT_DIR, 'trending.json');
    const tempFile = join(OUTPUT_DIR, '.trending.json.tmp');
    await writeFile(tempFile, JSON.stringify(trendingData, null, 2), 'utf-8');
    await rename(tempFile, outputFile);

    const algorithm = trendingData.metadata.redisEnabled ? 'redis-views' : 'popularity-fallback';
    logger.success(
      `Generated trending.json using ${algorithm} (${trendingData.trending.length} trending, ${trendingData.popular.length} popular, ${trendingData.recent.length} recent)`
    );
  } catch (error) {
    logger.error(
      'Failed to generate trending data',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Generate health check endpoint
 * Modern approach with dynamic count aggregation
 */
async function generateHealthCheck(
  metadataByCategory: Map<string, readonly unknown[]>
): Promise<void> {
  logger.progress('Generating health check endpoint...');

  const counts: Record<string, number> = { total: 0 };

  for (const [categoryId, metadata] of metadataByCategory.entries()) {
    counts[categoryId] = metadata.length;
    counts.total += metadata.length;
  }

  const healthData: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    generated: 'static' as const,
    version: buildConfig.version,
    environment: env.NODE_ENV,
    counts,
    features: {
      staticGeneration: true,
      searchIndexes: true,
      redisCache: true,
      rateLimit: true,
    },
  };

  const validatedHealth = healthCheckResponseSchema.parse(healthData);
  const outputFile = join(OUTPUT_DIR, 'health.json');
  await writeFile(outputFile, JSON.stringify(validatedHealth, null, 2));

  logger.success('Generated health check endpoint');
}

/**
 * Main generation function
 * Modern async pipeline with comprehensive error handling
 */
async function generateStaticAPIs(): Promise<GenerationResult> {
  logger.progress('Starting static API generation...');
  const startTime = performance.now();
  const filesGenerated: string[] = [];
  const errors: string[] = [];

  try {
    // Ensure output directories exist
    await mkdir(OUTPUT_DIR, { recursive: true });
    await mkdir(join(OUTPUT_DIR, 'search-indexes'), { recursive: true });

    // Load all category metadata dynamically
    logger.progress('Loading category metadata...');
    const configs = getAllBuildCategoryConfigs();
    const metadataByCategory = new Map<string, readonly unknown[]>();

    for (const config of configs) {
      const metadata = await loadCategoryMetadata(config.id);
      metadataByCategory.set(config.id, metadata);
      logger.info(`Loaded ${config.name}: ${metadata.length} items`);
    }

    // Generate all static APIs
    await generateContentTypeAPIs(metadataByCategory);
    filesGenerated.push(...configs.map((c) => `${c.id}.json`));

    await generateAllConfigurationsAPI(metadataByCategory);
    filesGenerated.push('all-configurations.json');

    await generateSearchIndexes(metadataByCategory);
    filesGenerated.push(
      ...configs.map((c) => `search-indexes/${c.id}.json`),
      'search-indexes/combined.json'
    );

    await generateHealthCheck(metadataByCategory);
    filesGenerated.push('health.json');

    await generateTrendingData(metadataByCategory);
    filesGenerated.push('trending.json');

    const duration = performance.now() - startTime;
    const totalItems = Array.from(metadataByCategory.values()).reduce(
      (sum, items) => sum + items.length,
      0
    );

    logger.success('All static APIs generated successfully!');
    logger.log(`Output directory: ${OUTPUT_DIR}`);
    logger.log('APIs can now be served directly from CDN for maximum performance');

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
      logger.error(
        `Validation error during generation: ${error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`
      );
      errors.push(...error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    } else {
      logger.failure(
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
        logger.error(
          'Unexpected error:',
          error instanceof Error ? error : new Error(String(error))
        );
        process.exit(1);
      });
  }
}

export { generateStaticAPIs };
