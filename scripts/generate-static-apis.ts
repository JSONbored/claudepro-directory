#!/usr/bin/env node

/**
 * Static API Generation Script
 *
 * Pre-generates all API responses at build time to maximize performance.
 * This creates static JSON files that can be served directly by the CDN.
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { agents, commands, hooks, mcp, rules } from '../generated/content';
import type { SearchableItem } from '../lib/search-cache';

// Output directory for static APIs
const OUTPUT_DIR = join(process.cwd(), 'public', 'static-api');

// Helper function to transform content with type and URL
function transformContent<T extends { slug: string }>(
  content: T[],
  type: string,
  category: string
): (T & { type: string; url: string })[] {
  return content.map((item) => ({
    ...item,
    type,
    url: `https://claudepro.directory/${category}/${item.slug}`,
  }));
}

// Convert content items to searchable format
function toSearchableItems<
  T extends {
    title?: string;
    name?: string;
    description: string;
    tags: string[];
    slug: string;
    id: string;
    category?: string;
  },
>(items: T[], category: string): SearchableItem[] {
  return items.map((item) => ({
    title: item.title || item.name || '',
    name: item.name || '',
    description: item.description,
    tags: item.tags,
    category: item.category || category,
    popularity: 0, // Will be populated from Redis in production
    slug: item.slug,
    id: item.id,
  }));
}

// Generate individual content type APIs
async function generateContentTypeAPIs() {
  const contentMap = {
    'agents.json': { data: agents, type: 'agent' },
    'mcp.json': { data: mcp, type: 'mcp' },
    'hooks.json': { data: hooks, type: 'hook' },
    'commands.json': { data: commands, type: 'command' },
    'rules.json': { data: rules, type: 'rule' },
  } as const;

  console.log('📦 Generating individual content type APIs...');

  for (const [filename, { data, type }] of Object.entries(contentMap)) {
    const category = filename.replace('.json', '');

    const responseData = {
      [category]: data.map((item) => ({
        ...item,
        type,
        url: `https://claudepro.directory/${category}/${item.slug}`,
      })),
      count: data.length,
      lastUpdated: new Date().toISOString(),
      generated: 'static',
    };

    const outputFile = join(OUTPUT_DIR, filename);
    await writeFile(outputFile, JSON.stringify(responseData, null, 2));

    console.log(`  ✅ Generated ${filename} (${data.length} items)`);
  }
}

// Generate all configurations API
async function generateAllConfigurationsAPI() {
  console.log('📦 Generating all-configurations API...');

  const transformedAgents = transformContent(agents, 'agent', 'agents');
  const transformedMcp = transformContent(mcp, 'mcp', 'mcp');
  const transformedRules = transformContent(rules, 'rule', 'rules');
  const transformedCommands = transformContent(commands, 'command', 'commands');
  const transformedHooks = transformContent(hooks, 'hook', 'hooks');

  const allConfigurations = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Claude Pro Directory - All Configurations',
    description: 'Complete database of Claude AI configurations',
    license: 'MIT',
    lastUpdated: new Date().toISOString(),
    generated: 'static',
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
      agents: 'https://claudepro.directory/api/agents.json',
      mcp: 'https://claudepro.directory/api/mcp.json',
      rules: 'https://claudepro.directory/api/rules.json',
      commands: 'https://claudepro.directory/api/commands.json',
      hooks: 'https://claudepro.directory/api/hooks.json',
    },
  };

  const outputFile = join(OUTPUT_DIR, 'all-configurations.json');
  await writeFile(outputFile, JSON.stringify(allConfigurations, null, 2));

  console.log(
    `  ✅ Generated all-configurations.json (${allConfigurations.statistics.totalConfigurations} total items)`
  );
}

// Generate search indexes
async function generateSearchIndexes() {
  console.log('📦 Generating search indexes...');

  // Create combined searchable dataset
  const allSearchableItems: SearchableItem[] = [
    ...toSearchableItems(agents, 'agents'),
    ...toSearchableItems(mcp, 'mcp'),
    ...toSearchableItems(rules, 'rules'),
    ...toSearchableItems(commands, 'commands'),
    ...toSearchableItems(hooks, 'hooks'),
  ];

  // Generate category-specific indexes
  const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks'];

  for (const category of categories) {
    const categoryItems = allSearchableItems.filter((item) => item.category === category);

    const searchIndex = {
      category,
      items: categoryItems,
      count: categoryItems.length,
      lastUpdated: new Date().toISOString(),
      generated: 'static',
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

    const outputFile = join(OUTPUT_DIR, 'search-indexes', `${category}.json`);
    await writeFile(outputFile, JSON.stringify(searchIndex, null, 2));

    console.log(`  ✅ Generated search index for ${category} (${categoryItems.length} items)`);
  }

  // Generate combined search index
  const combinedSearchIndex = {
    items: allSearchableItems,
    count: allSearchableItems.length,
    lastUpdated: new Date().toISOString(),
    generated: 'static',
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

  const combinedOutputFile = join(OUTPUT_DIR, 'search-indexes', 'combined.json');
  await writeFile(combinedOutputFile, JSON.stringify(combinedSearchIndex, null, 2));

  console.log(`  ✅ Generated combined search index (${allSearchableItems.length} items)`);
}

// Generate health check endpoint
async function generateHealthCheck() {
  console.log('📦 Generating health check endpoint...');

  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    generated: 'static',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    counts: {
      agents: agents.length,
      mcp: mcp.length,
      rules: rules.length,
      commands: commands.length,
      hooks: hooks.length,
      total: agents.length + mcp.length + rules.length + commands.length + hooks.length,
    },
    features: {
      staticGeneration: true,
      searchIndexes: true,
      redisCache: true,
      rateLimit: true,
    },
  };

  const outputFile = join(OUTPUT_DIR, 'health.json');
  await writeFile(outputFile, JSON.stringify(healthData, null, 2));

  console.log(`  ✅ Generated health check endpoint`);
}

// Main generation function
async function generateStaticAPIs() {
  console.log('🚀 Starting static API generation...\n');

  try {
    // Ensure output directories exist
    await mkdir(OUTPUT_DIR, { recursive: true });
    await mkdir(join(OUTPUT_DIR, 'search-indexes'), { recursive: true });

    // Generate all static APIs
    await generateContentTypeAPIs();
    console.log();

    await generateAllConfigurationsAPI();
    console.log();

    await generateSearchIndexes();
    console.log();

    await generateHealthCheck();
    console.log();

    console.log('✅ All static APIs generated successfully!');
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
    console.log('🎯 APIs can now be served directly from CDN for maximum performance');
  } catch (error) {
    console.error('❌ Failed to generate static APIs:', error);
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
