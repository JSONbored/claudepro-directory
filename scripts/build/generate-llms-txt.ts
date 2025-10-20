#!/usr/bin/env tsx
/**
 * Static LLMs.txt Generator
 *
 * Pre-generates all LLMs.txt files at build time to eliminate serverless function dependency.
 * Replaces 15+ dynamic route handlers with static files served from CDN.
 *
 * Architecture:
 * - Calls same generator functions as route handlers
 * - Outputs to public/llms-txt/ for CDN serving
 * - Preserves URLs via rewrites in next.config.mjs
 * - Zero runtime overhead (fully static)
 *
 * Generated Files:
 * - /llms-txt/site.txt → /llms.txt
 * - /llms-txt/changelog.txt → /changelog/llms.txt
 * - /llms-txt/guides.txt → /guides/llms.txt
 * - /llms-txt/api-docs.txt → /api-docs/llms.txt
 * - /llms-txt/config-recommender.txt → /tools/config-recommender/llms.txt
 * - /llms-txt/agents.txt → /agents/llms.txt
 * - /llms-txt/agents-code-reviewer.txt → /agents/code-reviewer/llms.txt
 * - ... etc (all categories + all items)
 *
 * Performance Impact:
 * - Eliminates ~15 serverless functions
 * - Saves ~500-1000 function invocations/day
 * - Faster response times (CDN vs serverless)
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
import { getAllChangelogEntries, getChangelogEntryBySlug } from '@/src/lib/changelog/loader';
import { formatChangelogDate, getChangelogUrl } from '@/src/lib/changelog/utils';
import { isValidCategory, UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import {
  getContentByCategory,
  getContentBySlug,
  getFullContentBySlug,
} from '@/src/lib/content/content-loaders';
import { apiResponse } from '@/src/lib/error-handler';
import { buildRichContent } from '@/src/lib/llms-txt/content-builder';
import {
  generateCategoryLLMsTxt,
  generateLLMsTxt,
  generateSiteLLMsTxt,
  type LLMsTxtItem,
} from '@/src/lib/llms-txt/generator';
import { logger } from '@/src/lib/logger';
import type {
  CollectionContent,
  CollectionItemReference,
} from '@/src/lib/schemas/content/collection.schema';
import { batchLoadContent } from '@/src/lib/utils/batch.utils';

const OUTPUT_DIR = join(process.cwd(), 'public', 'llms-txt');

/**
 * Ensure output directory exists
 */
async function ensureOutputDir() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  logger.info('LLMs.txt output directory ready', { path: OUTPUT_DIR });
}

/**
 * Write LLMs.txt file
 */
async function writeLLMsTxtFile(filename: string, content: string) {
  const filePath = join(OUTPUT_DIR, filename);
  await writeFile(filePath, content, 'utf-8');
  logger.info('Generated LLMs.txt file', {
    file: filename,
    size: Buffer.byteLength(content, 'utf-8'),
  });
}

/**
 * Generate site-wide llms.txt
 * Replicates: src/app/llms.txt/route.ts
 */
async function generateSiteLLMs() {
  const {
    mcp: mcpItems,
    commands: commandsItems,
    hooks: hooksItems,
    rules: rulesItems,
    agents: agentsItems,
    statuslines: statuslinesItems,
    collections: collectionsItems,
  } = await batchLoadContent({
    mcp,
    commands,
    hooks,
    rules,
    agents,
    statuslines,
    collections,
    skills,
  });

  const categoryStats = [
    {
      name: 'MCP Servers',
      count: mcpItems.length,
      url: '/mcp',
      description:
        'Model Context Protocol servers for extending Claude with external tools and data sources',
    },
    {
      name: 'Commands',
      count: commandsItems.length,
      url: '/commands',
      description: 'Custom slash commands for Claude Code to streamline development workflows',
    },
    {
      name: 'Hooks',
      count: hooksItems.length,
      url: '/hooks',
      description: 'Automation hooks that trigger on events in Claude Code sessions',
    },
    {
      name: 'Rules',
      count: rulesItems.length,
      url: '/rules',
      description:
        'Custom instructions and system prompts to modify Claude behavior for specific tasks',
    },
    {
      name: 'Agents',
      count: agentsItems.length,
      url: '/agents',
      description: 'Specialized AI agents with predefined roles and expertise areas',
    },
    {
      name: 'Statuslines',
      count: statuslinesItems.length,
      url: '/statuslines',
      description: 'Custom status line configurations for Claude Code workspace displays',
    },
    {
      name: 'Collections',
      count: collectionsItems.length,
      url: '/collections',
      description: 'Curated bundles of related configurations for specific use cases',
    },
    {
      name: 'Skills',
      count: (await skills).length,
      url: '/skills',
      description:
        'Task-focused capability guides with dependencies, examples, and troubleshooting for document/data workflows',
    },
  ];

  const llmsTxt = await generateSiteLLMsTxt(categoryStats);
  await writeLLMsTxtFile('site.txt', llmsTxt);
}

/**
 * Generate category llms.txt files
 * Replicates: src/app/[category]/llms.txt/route.ts
 */
async function generateCategoryLLMs() {
  const categories = Object.keys(UNIFIED_CATEGORY_REGISTRY);

  for (const category of categories) {
    if (!isValidCategory(category)) continue;

    const config = UNIFIED_CATEGORY_REGISTRY[category];
    const itemsData = await getContentByCategory(category);

    const items: LLMsTxtItem[] = itemsData.map((item) => ({
      ...item,
      category,
      url: `${APP_CONFIG.url}/${category}/${item.slug}`,
    }));

    const llmsTxt = await generateCategoryLLMsTxt(
      category,
      config.pluralTitle,
      config.description,
      items
    );

    await writeLLMsTxtFile(`${category}.txt`, llmsTxt);
  }
}

/**
 * Generate individual item llms.txt files
 * Replicates: src/app/[category]/[slug]/llms.txt/route.ts
 */
async function generateItemLLMs() {
  const categories = Object.keys(UNIFIED_CATEGORY_REGISTRY);

  for (const category of categories) {
    if (!isValidCategory(category)) continue;

    const itemsData = await getContentByCategory(category);

    for (const item of itemsData) {
      try {
        const fullItem = await getFullContentBySlug(category, item.slug);
        if (!fullItem) continue;

        // Build rich content
        const contentItem = buildRichContent(fullItem, category);

        // Generate llms.txt
        const llmsTxt = await generateLLMsTxt([contentItem], {
          includeContent: true,
          includeMetadata: true,
        });

        // Write file: category-slug.txt
        const filename = `${category}-${item.slug}.txt`;
        await writeLLMsTxtFile(filename, llmsTxt);
      } catch (error) {
        logger.warn('Failed to generate item LLMs.txt', {
          category,
          slug: item.slug,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

/**
 * Generate changelog llms.txt files
 * Replicates: src/app/changelog/llms.txt/route.ts + src/app/changelog/[slug]/llms.txt/route.ts
 */
async function generateChangelogLLMs() {
  const entries = await getAllChangelogEntries();

  // Main changelog index
  let llmsTxt = `# ${APP_CONFIG.name} - Changelog

> Track all platform updates, new features, bug fixes, and improvements

URL: ${APP_CONFIG.url}/changelog
Total Updates: ${entries.length}
Latest Update: ${entries[0]?.date ? formatChangelogDate(entries[0].date) : 'N/A'}

---

## All Changelog Entries

`;

  for (const entry of entries) {
    const entryUrl = getChangelogUrl(entry.slug);

    const categoryStats = [];
    if (entry.categories.Added.length > 0) {
      categoryStats.push(`${entry.categories.Added.length} Added`);
    }
    if (entry.categories.Changed.length > 0) {
      categoryStats.push(`${entry.categories.Changed.length} Changed`);
    }
    if (entry.categories.Fixed.length > 0) {
      categoryStats.push(`${entry.categories.Fixed.length} Fixed`);
    }
    if (entry.categories.Removed.length > 0) {
      categoryStats.push(`${entry.categories.Removed.length} Removed`);
    }
    if (entry.categories.Deprecated.length > 0) {
      categoryStats.push(`${entry.categories.Deprecated.length} Deprecated`);
    }
    if (entry.categories.Security.length > 0) {
      categoryStats.push(`${entry.categories.Security.length} Security`);
    }

    llmsTxt += `### ${formatChangelogDate(entry.date)} - ${entry.title}

URL: ${entryUrl}
Categories: ${categoryStats.join(', ') || 'None'}
${entry.tldr ? `\nSummary: ${entry.tldr}` : ''}

${entry.content}

---

`;
  }

  llmsTxt += `
## Additional Resources

- RSS Feed: ${APP_CONFIG.url}/changelog/rss.xml
- Atom Feed: ${APP_CONFIG.url}/changelog/atom.xml
- Full Website: ${APP_CONFIG.url}/changelog

---

This changelog follows the Keep a Changelog specification.
Last generated: ${new Date().toISOString()}
`;

  await writeLLMsTxtFile('changelog.txt', llmsTxt);

  // Individual changelog entries
  for (const entry of entries) {
    const entryUrl = getChangelogUrl(entry.slug);

    const categoryStats = [];
    if (entry.categories.Added.length > 0) {
      categoryStats.push(`${entry.categories.Added.length} Added`);
    }
    if (entry.categories.Changed.length > 0) {
      categoryStats.push(`${entry.categories.Changed.length} Changed`);
    }
    if (entry.categories.Fixed.length > 0) {
      categoryStats.push(`${entry.categories.Fixed.length} Fixed`);
    }
    if (entry.categories.Removed.length > 0) {
      categoryStats.push(`${entry.categories.Removed.length} Removed`);
    }
    if (entry.categories.Deprecated.length > 0) {
      categoryStats.push(`${entry.categories.Deprecated.length} Deprecated`);
    }
    if (entry.categories.Security.length > 0) {
      categoryStats.push(`${entry.categories.Security.length} Security`);
    }

    const entryContent = `# ${APP_CONFIG.name} - ${entry.title}

> ${entry.tldr || entry.description}

URL: ${entryUrl}
Date: ${formatChangelogDate(entry.date)}
Categories: ${categoryStats.join(', ') || 'None'}

---

${entry.content}

---

**Related Links:**
- All Changelog Entries: ${APP_CONFIG.url}/changelog
- RSS Feed: ${APP_CONFIG.url}/changelog/rss.xml
- Atom Feed: ${APP_CONFIG.url}/changelog/atom.xml

Last updated: ${new Date().toISOString()}
`;

    await writeLLMsTxtFile(`changelog-${entry.slug}.txt`, entryContent);
  }
}

/**
 * Generate guides llms.txt
 * Replicates: src/app/guides/llms.txt/route.ts
 */
async function generateGuidesLLMs() {
  // For now, create a simple guides index
  // In production, you'd scan the guides directory
  const content = `# ${APP_CONFIG.name} - Guides

> Comprehensive tutorials and documentation for getting started

URL: ${APP_CONFIG.url}/guides

All guides are available on the website.

---

Last generated: ${new Date().toISOString()}
`;

  await writeLLMsTxtFile('guides.txt', content);
}

/**
 * Generate API docs llms.txt
 * Replicates: src/app/api-docs/llms.txt/route.ts
 */
async function generateAPIDocsLLMs() {
  const content = `# ${APP_CONFIG.name} - API Documentation

> RESTful API for accessing Claude configurations programmatically

Base URL: ${APP_CONFIG.url}/api
Documentation: ${APP_CONFIG.url}/api-docs

## Available Endpoints

- GET /api/agents.json - All AI agents
- GET /api/mcp.json - All MCP servers
- GET /api/commands.json - All commands
- GET /api/rules.json - All rules
- GET /api/hooks.json - All hooks
- GET /api/statuslines.json - All statuslines
- GET /api/collections.json - All collections
- GET /api/all-configurations.json - Complete dataset

## Authentication

Public API - No authentication required

## Rate Limits

- 60 requests per minute per IP
- Moderate limits to prevent abuse

## Response Format

JSON with consistent structure across all endpoints

---

Last generated: ${new Date().toISOString()}
`;

  await writeLLMsTxtFile('api-docs.txt', content);
}

/**
 * Generate config recommender llms.txt
 * Replicates: src/app/tools/config-recommender/llms.txt/route.ts
 */
async function generateConfigRecommenderLLMs() {
  const content = `# Configuration Recommender - ${APP_CONFIG.name}

> AI-powered tool for finding the perfect Claude configuration

## Overview

The Configuration Recommender is an interactive tool that analyzes user needs and recommends the most suitable Claude AI configurations from our catalog of 147+ community-curated options.

URL: ${APP_CONFIG.url}/tools/config-recommender

## How It Works

### Algorithm
- **Type**: Rule-based scoring algorithm with weighted multi-factor analysis
- **Execution Time**: <100ms for complete catalog analysis
- **Cost**: Zero (no LLM API calls, purely computational)
- **Accuracy**: Deterministic results based on user input

---

Last generated: ${new Date().toISOString()}
`;

  await writeLLMsTxtFile('config-recommender.txt', content);
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now();
  logger.info('Starting LLMs.txt static generation');

  try {
    await ensureOutputDir();

    // Generate all llms.txt files
    await generateSiteLLMs();
    await generateCategoryLLMs();
    await generateItemLLMs();
    await generateChangelogLLMs();
    await generateGuidesLLMs();
    await generateAPIDocsLLMs();
    await generateConfigRecommenderLLMs();

    const duration = Date.now() - startTime;
    logger.info('LLMs.txt static generation complete', {
      duration: `${duration}ms`,
      outputDir: OUTPUT_DIR,
    });

    console.log(`✅ Generated all LLMs.txt files in ${duration}ms`);
    console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  } catch (error) {
    logger.error(
      'Failed to generate LLMs.txt files',
      error instanceof Error ? error : new Error(String(error))
    );
    console.error('❌ Failed to generate LLMs.txt files:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as generateLLMsTxtFiles };
