#!/usr/bin/env node

/**
 * Static API Generation Script
 *
 * Pre-generates all API responses at build time to maximize performance.
 * This creates static JSON files that can be served directly by the CDN.
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { z } from 'zod';
import { agents, commands, hooks, mcp, rules } from '../generated/content';
import { APP_CONFIG } from '../lib/constants';
import { buildConfig, env } from '../lib/schemas/env.schema';
import {
  type AppContentType,
  type ContentCategory,
  contentCategorySchema,
} from '../lib/schemas/shared.schema';
import {
  type AllConfigurationsResponse,
  allConfigurationsResponseSchema,
  type CategorySearchIndex,
  type CombinedSearchIndex,
  type ContentTypeApiResponse,
  categorySearchIndexSchema,
  combinedSearchIndexSchema,
  contentTypeApiResponseSchema,
  type GenerationResult,
  type HealthCheckResponse,
  healthCheckResponseSchema,
  type StaticAPISearchableItem,
  staticAPISearchableItemSchema,
  type TransformedContentItem,
  transformedContentItemSchema,
} from '../lib/schemas/static-api.schema';

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
    tags: readonly string[] | string[];
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
      tags: Array.isArray(item.tags) ? [...item.tags] : [],
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
  // Await all content promises
  const [agentsData, mcpData, hooksData, commandsData, rulesData] = await Promise.all([
    agents,
    mcp,
    hooks,
    commands,
    rules,
  ]);

  const contentMap = {
    'agents.json': { data: agentsData, type: 'agent' as AppContentType },
    'mcp.json': { data: mcpData, type: 'mcp' as AppContentType },
    'hooks.json': { data: hooksData, type: 'hook' as AppContentType },
    'commands.json': { data: commandsData, type: 'command' as AppContentType },
    'rules.json': { data: rulesData, type: 'rule' as AppContentType },
  };

  console.log('📦 Generating individual content type APIs...');

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

    console.log(`  ✅ Generated ${filename} (${transformedItems.length} items)`);
  }
}

// Generate all configurations API
async function generateAllConfigurationsAPI() {
  console.log('📦 Generating all-configurations API...');

  // Await all content promises
  const [agentsData, mcpData, rulesData, commandsData, hooksData] = await Promise.all([
    agents,
    mcp,
    rules,
    commands,
    hooks,
  ]);

  const transformedAgents = transformContent(agentsData, 'agent' as AppContentType, 'agents');
  const transformedMcp = transformContent(mcpData, 'mcp' as AppContentType, 'mcp');
  const transformedRules = transformContent(rulesData, 'rule' as AppContentType, 'rules');
  const transformedCommands = transformContent(
    commandsData,
    'command' as AppContentType,
    'commands'
  );
  const transformedHooks = transformContent(hooksData, 'hook' as AppContentType, 'hooks');

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

  console.log(
    `  ✅ Generated all-configurations.json (${validatedConfigurations.statistics.totalConfigurations} total items)`
  );
}

// Generate search indexes
async function generateSearchIndexes() {
  console.log('📦 Generating search indexes...');

  // Await all content promises
  const [agentsData, mcpData, rulesData, commandsData, hooksData] = await Promise.all([
    agents,
    mcp,
    rules,
    commands,
    hooks,
  ]);

  // Create combined searchable dataset
  const allSearchableItems: StaticAPISearchableItem[] = [
    ...toSearchableItems([...agentsData], 'agents'),
    ...toSearchableItems([...mcpData], 'mcp'),
    ...toSearchableItems([...rulesData], 'rules'),
    ...toSearchableItems([...commandsData], 'commands'),
    ...toSearchableItems([...hooksData], 'hooks'),
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

    console.log(`  ✅ Generated search index for ${category} (${categoryItems.length} items)`);
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

  console.log(`  ✅ Generated combined search index (${allSearchableItems.length} items)`);
}

// Generate health check endpoint
async function generateHealthCheck() {
  console.log('📦 Generating health check endpoint...');

  // Await all content promises
  const [agentsData, mcpData, rulesData, commandsData, hooksData] = await Promise.all([
    agents,
    mcp,
    rules,
    commands,
    hooks,
  ]);

  const healthData: HealthCheckResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    generated: 'static' as const,
    version: buildConfig.version,
    environment: env.NODE_ENV,
    counts: {
      agents: agentsData.length,
      mcp: mcpData.length,
      rules: rulesData.length,
      commands: commandsData.length,
      hooks: hooksData.length,
      total:
        agentsData.length +
        mcpData.length +
        rulesData.length +
        commandsData.length +
        hooksData.length,
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

  console.log('  ✅ Generated health check endpoint');
}

// Main generation function
async function generateStaticAPIs(): Promise<GenerationResult> {
  console.log('🚀 Starting static API generation...\n');
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
    console.log();

    await generateAllConfigurationsAPI();
    filesGenerated.push('all-configurations.json');
    console.log();

    await generateSearchIndexes();
    filesGenerated.push(
      'search-indexes/agents.json',
      'search-indexes/mcp.json',
      'search-indexes/rules.json',
      'search-indexes/commands.json',
      'search-indexes/hooks.json',
      'search-indexes/combined.json'
    );
    console.log();

    await generateHealthCheck();
    filesGenerated.push('health.json');
    console.log();

    const duration = performance.now() - startTime;

    // Await all content promises to get lengths
    const [agentsData, mcpData, rulesData, commandsData, hooksData] = await Promise.all([
      agents,
      mcp,
      rules,
      commands,
      hooks,
    ]);
    const totalItems =
      agentsData.length +
      mcpData.length +
      rulesData.length +
      commandsData.length +
      hooksData.length;

    console.log('✅ All static APIs generated successfully!');
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    console.log('🎯 APIs can now be served directly from CDN for maximum performance');

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
      console.error('Validation error during generation:', error.issues);
      errors.push(...error.issues.map((i) => `${i.path.join('.')}: ${i.message}`));
    } else {
      console.error('❌ Failed to generate static APIs:', error);
      errors.push(String(error));
    }

    process.exit(1);
  }
}

// Run if called directly (ESM compatible)
const scriptPath = new URL(import.meta.url).pathname;
const argPath = process.argv[1];

if (scriptPath === argPath) {
  generateStaticAPIs().catch(console.error);
}

export { generateStaticAPIs };
