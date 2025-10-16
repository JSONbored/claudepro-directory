/**
 * Dynamic Content Loader for E2E Tests
 *
 * Imports GENERATED TypeScript content that's actually served to users.
 * This ensures tests validate the real production content, not source files.
 *
 * **Architecture:**
 * - Imports from `generated/*.ts` files created by build process
 * - These files contain all metadata for content displayed on site
 * - Automatically discovers ALL content (no manual test updates needed)
 * - Type-safe with full TypeScript validation
 *
 * **Benefits:**
 * - Tests actual production content (not source files)
 * - Single test definition tests ALL content pages dynamically
 * - Automatic coverage of new content (zero maintenance)
 * - 100% type-safe with compile-time validation
 *
 * @module tests/e2e/helpers/content-loader
 */

import fs from 'node:fs';
import path from 'node:path';
import { agentsMetadata } from '../../../generated/agents-metadata';
import { collectionsMetadata } from '../../../generated/collections-metadata';
import { commandsMetadata } from '../../../generated/commands-metadata';
import { hooksMetadata } from '../../../generated/hooks-metadata';
import { mcpMetadata } from '../../../generated/mcp-metadata';
import { rulesMetadata } from '../../../generated/rules-metadata';
import { statuslinesMetadata } from '../../../generated/statuslines-metadata';

export interface ContentMetadata {
  slug: string;
  category: string;
  path: string;
  title?: string;
  description?: string;
}

export interface GuideMetadata {
  slug: string;
  category?: string;
  path: string;
  title?: string;
}

export interface CollectionMetadata {
  slug: string;
  path: string;
  title?: string;
}

/**
 * Get all category content from generated TypeScript files
 *
 * This is the ACTUAL content that users see on the website.
 * Source of truth: generated/*.ts files
 *
 * Dynamically includes ALL content across all categories.
 * When you add new content and rebuild, it's automatically tested.
 *
 * @returns Array of ALL content metadata objects across all categories
 *
 * @example
 * ```ts
 * const content = getAllCategoryContent();
 * // Returns ALL content: agents, mcp, rules, commands, hooks, statuslines
 *
 * // Use with Playwright parameterized tests
 * for (const item of content) {
 *   test(`SEO: ${item.path}`, async ({ page }) => {
 *     await page.goto(item.path);
 *     // ... assertions
 *   });
 * }
 * ```
 */
export function getAllCategoryContent(): ContentMetadata[] {
  const content: ContentMetadata[] = [];

  // Agents
  for (const agent of agentsMetadata) {
    content.push({
      slug: agent.slug,
      category: 'agents',
      path: `/agents/${agent.slug}`,
      title: agent.title,
      description: agent.description,
    });
  }

  // MCP Servers
  for (const mcp of mcpMetadata) {
    content.push({
      slug: mcp.slug,
      category: 'mcp',
      path: `/mcp/${mcp.slug}`,
      title: mcp.title,
      description: mcp.description,
    });
  }

  // Rules
  for (const rule of rulesMetadata) {
    content.push({
      slug: rule.slug,
      category: 'rules',
      path: `/rules/${rule.slug}`,
      title: rule.title,
      description: rule.description,
    });
  }

  // Commands
  for (const command of commandsMetadata) {
    content.push({
      slug: command.slug,
      category: 'commands',
      path: `/commands/${command.slug}`,
      title: command.title,
      description: command.description,
    });
  }

  // Hooks
  for (const hook of hooksMetadata) {
    content.push({
      slug: hook.slug,
      category: 'hooks',
      path: `/hooks/${hook.slug}`,
      title: hook.title,
      description: hook.description,
    });
  }

  // Statuslines
  for (const statusline of statuslinesMetadata) {
    content.push({
      slug: statusline.slug,
      category: 'statuslines',
      path: `/statuslines/${statusline.slug}`,
      title: statusline.title,
      description: statusline.description,
    });
  }

  return content;
}

/**
 * Get all guide content
 *
 * Guides are stored as MDX files in content/guides/
 * They're organized by category (tutorials, comparisons, workflows, etc.)
 *
 * Dynamically discovers ALL guides. When you add new guides, they're automatically tested.
 *
 * @returns Array of ALL guide metadata objects
 */
export function getAllGuides(): GuideMetadata[] {
  // TODO: Import guides metadata when it's generated
  // For now, we'll dynamically scan filesystem
  const guides: GuideMetadata[] = [];
  const guidesDir = path.join(process.cwd(), 'content', 'guides');

  if (!fs.existsSync(guidesDir)) {
    return guides;
  }

  const categories = fs
    .readdirSync(guidesDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  for (const category of categories) {
    const categoryDir = path.join(guidesDir, category);
    const files = fs.readdirSync(categoryDir);

    for (const file of files) {
      if (file.endsWith('.mdx')) {
        const slug = file.replace('.mdx', '');
        guides.push({
          slug,
          category,
          path: `/guides/${category}/${slug}`,
        });
      }
    }
  }

  return guides;
}

/**
 * Get all collections from generated TypeScript files
 *
 * Dynamically includes ALL collections. When you add new collections and rebuild, they're automatically tested.
 *
 * @returns Array of ALL collection metadata objects
 */
export function getAllCollections(): CollectionMetadata[] {
  const collections: CollectionMetadata[] = [];

  for (const collection of collectionsMetadata) {
    collections.push({
      slug: collection.slug,
      path: `/collections/${collection.slug}`,
      title: collection.title,
    });
  }

  return collections;
}

/**
 * Get all changelog entries
 *
 * @returns Array of changelog metadata objects
 */
export function getAllChangelogs(): CollectionMetadata[] {
  // TODO: Import changelog metadata when it's generated
  const changelogs: CollectionMetadata[] = [];
  const changelogDir = path.join(process.cwd(), 'content', 'changelog');

  if (!fs.existsSync(changelogDir)) {
    return changelogs;
  }

  const files = fs.readdirSync(changelogDir);

  for (const file of files) {
    if (file.endsWith('.mdx')) {
      const slug = file.replace('.mdx', '');
      changelogs.push({
        slug,
        path: `/changelog/${slug}`,
      });
    }
  }

  return changelogs;
}

/**
 * Get content by category from generated files
 *
 * @param category - Category slug (agents, mcp, rules, etc.)
 * @returns Array of content metadata for that category
 *
 * @example
 * ```ts
 * const mcpServers = getContentByCategory('mcp');
 * // Returns 40 MCP server items
 * ```
 */
export function getContentByCategory(category: string): ContentMetadata[] {
  return getAllCategoryContent().filter((item) => item.category === category);
}

/**
 * Get all static routes that need SEO testing
 *
 * These are routes without dynamic parameters that should have proper SEO metadata.
 *
 * @returns Array of ALL static route paths
 */
export function getAllStaticRoutes(): string[] {
  return [
    '/',
    '/trending',
    '/submit',
    '/collections',
    '/guides',
    '/changelog',
    '/community',
    '/companies',
    '/for-you',
    '/jobs',
    '/partner',
    '/api-docs',
    '/login',
    '/board',
    '/tools/config-recommender',
    // Category pages (6 items)
    '/agents',
    '/mcp',
    '/rules',
    '/commands',
    '/hooks',
    '/statuslines',
  ];
}
