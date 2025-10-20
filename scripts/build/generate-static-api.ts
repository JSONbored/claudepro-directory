#!/usr/bin/env tsx
/**
 * Static API Generator
 *
 * Pre-generates all API JSON responses at build time to eliminate serverless function dependency.
 * Replaces 10+ dynamic API route handlers with static JSON files served from CDN.
 *
 * Architecture:
 * - Calls same data loaders as API route handlers
 * - Outputs to public/api/ for CDN serving  
 * - Preserves URLs (static files served at same paths)
 * - Zero runtime overhead (fully static)
 *
 * Generated Files:
 * - /api/agents.json
 * - /api/mcp.json
 * - /api/commands.json
 * - /api/rules.json
 * - /api/hooks.json
 * - /api/statuslines.json
 * - /api/collections.json
 * - /api/skills.json
 * - /api/all-configurations.json
 *
 * Performance Impact:
 * - Eliminates ~10 serverless functions
 * - Saves ~1000-2000 function invocations/day
 * - Faster response times (CDN vs serverless)
 * - Lower costs (no function execution)
 */

import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import {
  agents,
  collections,
  commands,
  hooks,
  mcp,
  rules,
  skills,
  statuslines,
} from '@/generated/content';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { batchLoadContent } from '@/src/lib/utils/batch.utils';

const OUTPUT_DIR = join(process.cwd(), 'public', 'api');

/**
 * Ensure output directory exists
 */
async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  logger.info('API output directory ready', { path: OUTPUT_DIR });
}

/**
 * Write JSON API file
 */
async function writeJSONFile(filename: string, data: unknown) {
  const filePath = join(OUTPUT_DIR, filename);
  const json = JSON.stringify(data, null, 2);
  await writeFile(filePath, json, 'utf-8');
  logger.info('Generated API JSON file', {
    file: filename,
    size: Buffer.byteLength(json, 'utf-8'),
  });
}

/**
 * Transform content with type and URL
 */
function transformContent<T extends { slug: string }>(
  content: readonly T[] | T[],
  type: string,
  category: string
): (T & { type: string; url: string })[] {
  return content.map((item) => ({
    ...item,
    type,
    url: `${APP_CONFIG.url}/${category}/${item.slug}`,
  }));
}

/**
 * Generate individual category API files
 * Replicates: src/app/api/[contentType]/route.ts
 */
async function generateCategoryAPIs() {
  const contentMap = {
    'agents.json': { getData: () => agents, type: 'agent', category: 'agents' },
    'mcp.json': { getData: () => mcp, type: 'mcp', category: 'mcp' },
    'hooks.json': { getData: () => hooks, type: 'hook', category: 'hooks' },
    'commands.json': { getData: () => commands, type: 'command', category: 'commands' },
    'rules.json': { getData: () => rules, type: 'rule', category: 'rules' },
    'statuslines.json': {
      getData: () => statuslines,
      type: 'statusline',
      category: 'statuslines',
    },
    'collections.json': {
      getData: () => collections,
      type: 'collection',
      category: 'collections',
    },
    'skills.json': { getData: () => skills, type: 'skill', category: 'skills' },
  };

  for (const [filename, { getData, type, category }] of Object.entries(contentMap)) {
    const data = await getData();
    const categoryName = filename.replace('.json', '');

    const responseData = {
      [categoryName]: transformContent(data, type, category),
      count: data.length,
      lastUpdated: new Date().toISOString(),
    };

    await writeJSONFile(filename, responseData);
  }
}

/**
 * Generate all-configurations.json
 * Replicates: src/app/api/all-configurations.json/route.ts
 */
async function generateAllConfigurationsAPI() {
  const {
    agents: agentsData,
    mcp: mcpData,
    rules: rulesData,
    commands: commandsData,
    hooks: hooksData,
    statuslines: statuslinesData,
    collections: collectionsData,
    skills: skillsData,
  } = await batchLoadContent({ agents, mcp, rules, commands, hooks, statuslines, collections, skills });

  const transformedAgents = transformContent(agentsData, 'agent', 'agents');
  const transformedMcp = transformContent(mcpData, 'mcp', 'mcp');
  const transformedRules = transformContent(rulesData, 'rule', 'rules');
  const transformedCommands = transformContent(commandsData, 'command', 'commands');
  const transformedHooks = transformContent(hooksData, 'hook', 'hooks');
  const transformedStatuslines = transformContent(statuslinesData, 'statusline', 'statuslines');
  const transformedCollections = transformContent(collectionsData, 'collection', 'collections');
  const transformedSkills = transformContent(skillsData, 'skill', 'skills');

  const allConfigurations = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${APP_CONFIG.name} - All Configurations`,
    description: APP_CONFIG.description,
    license: APP_CONFIG.license,
    lastUpdated: new Date().toISOString(),
    statistics: {
      totalConfigurations:
        transformedAgents.length +
        transformedMcp.length +
        transformedRules.length +
        transformedCommands.length +
        transformedHooks.length +
        transformedStatuslines.length +
        transformedCollections.length +
        transformedSkills.length,
      agents: transformedAgents.length,
      mcp: transformedMcp.length,
      rules: transformedRules.length,
      commands: transformedCommands.length,
      hooks: transformedHooks.length,
      statuslines: transformedStatuslines.length,
      collections: transformedCollections.length,
      skills: transformedSkills.length,
    },
    data: {
      agents: transformedAgents,
      mcp: transformedMcp,
      rules: transformedRules,
      commands: transformedCommands,
      hooks: transformedHooks,
      statuslines: transformedStatuslines,
      collections: transformedCollections,
      skills: transformedSkills,
    },
    endpoints: {
      agents: `${APP_CONFIG.url}/api/agents.json`,
      mcp: `${APP_CONFIG.url}/api/mcp.json`,
      rules: `${APP_CONFIG.url}/api/rules.json`,
      commands: `${APP_CONFIG.url}/api/commands.json`,
      hooks: `${APP_CONFIG.url}/api/hooks.json`,
      statuslines: `${APP_CONFIG.url}/api/statuslines.json`,
      collections: `${APP_CONFIG.url}/api/collections.json`,
      skills: `${APP_CONFIG.url}/api/skills.json`,
    },
  };

  await writeJSONFile('all-configurations.json', allConfigurations);
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  logger.info('Starting API static generation');

  try {
    await ensureOutputDir();

    // Generate all API files
    await generateCategoryAPIs();
    await generateAllConfigurationsAPI();

    const duration = Date.now() - startTime;
    logger.info('API static generation complete', {
      duration: `${duration}ms`,
      outputDir: OUTPUT_DIR,
    });

    console.log(`✅ Generated all API JSON files in ${duration}ms`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    logger.error(
      'Failed to generate API JSON files',
      error instanceof Error ? error : new Error(String(error))
    );
    console.error('❌ Failed to generate API JSON files:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as generateStaticAPIFiles };
