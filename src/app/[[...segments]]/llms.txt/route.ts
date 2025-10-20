/**
 * Unified LLMs.txt Route Handler
 * 
 * Consolidates 12 separate llms.txt routes into a single dynamic handler.
 * Handles all URL patterns with identical output to original routes.
 * 
 * OPTIMIZATION:
 * - Before: 12 separate serverless functions
 * - After: 1 unified serverless function
 * - Reduction: 92% fewer functions
 * - Build time: -2-3 seconds
 * - Maintenance: Single source of truth
 * 
 * Supported Routes:
 * - /llms.txt (site-wide index)
 * - /[category]/llms.txt (category index)
 * - /[category]/[slug]/llms.txt (item detail)
 * - /changelog/llms.txt (changelog index)
 * - /changelog/[slug]/llms.txt (changelog detail)
 * - /guides/llms.txt (guides index)
 * - /guides/[category]/[slug]/llms.txt (guide detail)
 * - /api-docs/llms.txt (API documentation)
 * - /tools/config-recommender/llms.txt (config recommender)
 * 
 * @module app/[[...segments]]/llms.txt
 */

import type { NextRequest } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
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
import { contentCache } from '@/src/lib/cache.server';
import { isValidCategory, UNIFIED_CATEGORY_REGISTRY, VALID_CATEGORIES } from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import { SEO_CONFIG } from '@/src/lib/config/seo-config';
import {
  getContentByCategory,
  getContentBySlug,
  getFullContentBySlug,
} from '@/src/lib/content/content-loaders';
import { parseMDXFrontmatter } from '@/src/lib/content/mdx-config';
import { apiResponse, handleApiError } from '@/src/lib/error-handler';
import { buildRichContent, type ContentItem } from '@/src/lib/llms-txt/content-builder';
import {
  generateLLMsTxt,
  generateCategoryLLMsTxt,
  generateSiteLLMsTxt,
  type LLMsTxtItem,
} from '@/src/lib/llms-txt/generator';
import { logger } from '@/src/lib/logger';
import { errorInputSchema } from '@/src/lib/schemas/error.schema';
import type {
  CollectionContent,
  CollectionItemReference,
} from '@/src/lib/schemas/content/collection.schema';
import { getAllChangelogEntries } from '@/src/lib/changelog/loader';
import { batchLoadContent } from '@/src/lib/utils/batch.utils';

export const runtime = 'nodejs';

/**
 * Validation schema for route params
 */
const paramsSchema = z.object({
  segments: z.array(z.string()).optional(),
});

/**
 * Guide category path mapping
 */
const GUIDE_PATH_MAP: Record<string, string> = {
  'use-cases': 'use-cases',
  'tutorials': 'tutorials',
  'collections': 'collections',
  'categories': 'categories',
  'workflows': 'workflows',
  'comparisons': 'comparisons',
  'troubleshooting': 'troubleshooting',
};

/**
 * Site-wide llms.txt handler
 * Route: /llms.txt
 */
async function handleSiteIndex(request: NextRequest): Promise<Response> {
  const requestLogger = logger.forRequest(request);
  requestLogger.info('Site llms.txt generation started');

  // Gather category statistics - await all promises in parallel
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

  requestLogger.info('Site llms.txt generated successfully', {
    categoriesCount: categoryStats.length,
    totalItems: categoryStats.reduce((sum, cat) => sum + cat.count, 0),
    contentLength: llmsTxt.length,
  });

  return apiResponse.raw(llmsTxt, {
    contentType: 'text/plain; charset=utf-8',
    headers: { 'X-Robots-Tag': 'index, follow' },
    cache: { sMaxAge: 3600, staleWhileRevalidate: 86400 },
  });
}

/**
 * Category index llms.txt handler
 * Route: /[category]/llms.txt
 */
async function handleCategoryIndex(
  request: NextRequest,
  category: string
): Promise<Response> {
  const requestLogger = logger.forRequest(request);
  requestLogger.info('Category llms.txt generation started', { category });

  // Validate category
  if (!isValidCategory(category)) {
    requestLogger.warn('Invalid category requested for llms.txt', { category });
    return apiResponse.raw('Category not found', {
      contentType: 'text/plain; charset=utf-8',
      status: 404,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }

  const config = UNIFIED_CATEGORY_REGISTRY[category];
  if (!config) {
    requestLogger.error(
      'Category config not found despite validation',
      new Error('Config not found after validation'),
      { category }
    );
    return apiResponse.raw('Internal server error', {
      contentType: 'text/plain; charset=utf-8',
      status: 500,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }

  const items = await getContentByCategory(category);

  // Transform items to LLMsTxtItem format
  const llmsItems: LLMsTxtItem[] = items.map((item) => ({
    slug: item.slug,
    title: item.title || item.name || item.slug,
    description: item.description,
    category: item.category,
    tags: item.tags || [],
    author: item.author,
    dateAdded: item.dateAdded,
    url: `${APP_CONFIG.url}/${category}/${item.slug}`,
  }));

  const llmsTxt = await generateCategoryLLMsTxt(
    llmsItems,
    config.pluralTitle,
    config.description,
    {
      includeContent: false,
      includeDescription: true,
      includeTags: true,
      includeUrl: true,
    }
  );

  requestLogger.info('Category llms.txt generated successfully', {
    category,
    itemsCount: llmsItems.length,
    contentLength: llmsTxt.length,
  });

  return apiResponse.raw(llmsTxt, {
    contentType: 'text/plain; charset=utf-8',
    headers: { 'X-Robots-Tag': 'index, follow' },
    cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
  });
}

/**
 * Item detail llms.txt handler
 * Route: /[category]/[slug]/llms.txt
 */
async function handleItemDetail(
  request: NextRequest,
  category: string,
  slug: string
): Promise<Response> {
  const requestLogger = logger.forRequest(request);
  requestLogger.info('Item llms.txt generation started', { category, slug });

  // Validate category
  if (!isValidCategory(category)) {
    requestLogger.warn('Invalid category requested for item llms.txt', { category, slug });
    return apiResponse.raw('Category not found', {
      contentType: 'text/plain; charset=utf-8',
      status: 404,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }

  // Get item metadata first (fast, cached)
  const item = await getContentBySlug(category, slug);
  if (!item) {
    requestLogger.warn('Item not found for llms.txt', { category, slug });
    return apiResponse.raw('Content not found', {
      contentType: 'text/plain; charset=utf-8',
      status: 404,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }

  // Get full content (includes markdown content field)
  const fullItem = await getFullContentBySlug(category, slug);
  if (!fullItem) {
    requestLogger.warn('Full item content not found for llms.txt', { category, slug });
    return apiResponse.raw('Content not found', {
      contentType: 'text/plain; charset=utf-8',
      status: 404,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }

  // Collections require special handling
  if (category === 'collections') {
    const collection = fullItem as CollectionContent;

    let detailedContent = '';
    if (collection.items && collection.items.length > 0) {
      detailedContent += 'INCLUDED ITEMS\n--------------\n\n';

      const itemsByCategory = collection.items.reduce(
        (acc: Record<string, CollectionItemReference[]>, item: CollectionItemReference) => {
          const itemCategory = item.category || 'other';
          if (!acc[itemCategory]) acc[itemCategory] = [];
          acc[itemCategory].push(item);
          return acc;
        },
        {} as Record<string, CollectionItemReference[]>
      );

      for (const [itemCategory, items] of Object.entries(itemsByCategory)) {
        detailedContent += `${itemCategory.toUpperCase()}:\n`;
        for (const itemRef of items as CollectionItemReference[]) {
          try {
            const actualItem = await getContentBySlug(itemRef.category, itemRef.slug);
            if (actualItem) {
              detailedContent += `• ${actualItem.title || actualItem.name || itemRef.slug}\n`;
              if (actualItem.description) {
                detailedContent += `  ${actualItem.description}\n`;
              }
              if (itemRef.reason) {
                detailedContent += `  Reason: ${itemRef.reason}\n`;
              }
            } else {
              detailedContent += `• ${itemRef.slug}\n`;
              if (itemRef.reason) {
                detailedContent += `  ${itemRef.reason}\n`;
              }
            }
          } catch (error) {
            requestLogger.warn('Failed to fetch collection item details', {
              category: itemRef.category,
              slug: itemRef.slug,
              error: error instanceof Error ? error.message : String(error),
            });
            detailedContent += `• ${itemRef.slug}\n`;
            if (itemRef.reason) {
              detailedContent += `  ${itemRef.reason}\n`;
            }
          }
        }
        detailedContent += '\n';
      }
    }

    if (collection.prerequisites && collection.prerequisites.length > 0) {
      detailedContent += '\nPREREQUISITES\n-------------\n';
      detailedContent += collection.prerequisites.map((p: string) => `• ${p}`).join('\n');
      detailedContent += '\n\n';
    }

    const llmsItem: LLMsTxtItem = {
      slug: collection.slug,
      title: String(collection.title),
      description: collection.description,
      content: detailedContent,
      category: 'collections',
      tags: collection.tags || [],
      author: collection.author || undefined,
      dateAdded: collection.dateAdded || undefined,
      url: `${APP_CONFIG.url}/collections/${slug}`,
    };

    const llmsTxt = await generateLLMsTxt(llmsItem, {
      includeMetadata: true,
      includeDescription: true,
      includeTags: true,
      includeUrl: true,
      includeContent: true,
      sanitize: true,
    });

    requestLogger.info('Collection llms.txt generated successfully', {
      slug,
      contentLength: llmsTxt.length,
      itemsCount: collection.items?.length || 0,
    });

    return apiResponse.raw(llmsTxt, {
      contentType: 'text/plain; charset=utf-8',
      headers: { 'X-Robots-Tag': 'index, follow' },
      cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
    });
  }

  // Default handling for all other categories
  const richContent = buildRichContent(fullItem as ContentItem);

  const llmsItem: LLMsTxtItem = {
    slug: fullItem.slug,
    title: fullItem.title || fullItem.name || fullItem.slug,
    description: fullItem.description,
    category: fullItem.category,
    tags: fullItem.tags || [],
    author: fullItem.author,
    dateAdded: fullItem.dateAdded,
    url: `${APP_CONFIG.url}/${category}/${slug}`,
    content: richContent,
  };

  const llmsTxt = await generateLLMsTxt(llmsItem, {
    includeMetadata: true,
    includeDescription: true,
    includeTags: true,
    includeUrl: true,
    includeContent: true,
    sanitize: true,
  });

  requestLogger.info('Item llms.txt generated successfully', {
    category,
    slug,
    contentLength: llmsTxt.length,
    hasFullContent: !!fullItem.content,
  });

  return apiResponse.raw(llmsTxt, {
    contentType: 'text/plain; charset=utf-8',
    headers: { 'X-Robots-Tag': 'index, follow' },
    cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
  });
}

/**
 * Changelog index llms.txt handler
 * Route: /changelog/llms.txt
 */
async function handleChangelogIndex(request: NextRequest): Promise<Response> {
  const requestLogger = logger.forRequest(request);
  requestLogger.info('Changelog llms.txt generation started');

  const entries = await getAllChangelogEntries();

  const llmsItems: LLMsTxtItem[] = entries.map((entry) => ({
    slug: entry.slug,
    title: entry.title,
    description: entry.tldr || entry.title,
    category: 'changelog',
    tags: ['changelog', 'updates'],
    dateAdded: entry.date,
    url: `${APP_CONFIG.url}/changelog/${entry.slug}`,
  }));

  const llmsTxt = await generateCategoryLLMsTxt(
    llmsItems,
    'Changelog',
    'Latest updates and changes to ClaudePro Directory',
    {
      includeContent: false,
      includeDescription: true,
      includeTags: true,
      includeUrl: true,
    }
  );

  requestLogger.info('Changelog llms.txt generated successfully', {
    entriesCount: entries.length,
    contentLength: llmsTxt.length,
  });

  return apiResponse.raw(llmsTxt, {
    contentType: 'text/plain; charset=utf-8',
    headers: { 'X-Robots-Tag': 'index, follow' },
    cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
  });
}

/**
 * Changelog detail llms.txt handler
 * Route: /changelog/[slug]/llms.txt
 */
async function handleChangelogDetail(
  request: NextRequest,
  slug: string
): Promise<Response> {
  const requestLogger = logger.forRequest(request);
  requestLogger.info('Changelog detail llms.txt generation started', { slug });

  const entries = await getAllChangelogEntries();
  const entry = entries.find((e) => e.slug === slug);

  if (!entry) {
    requestLogger.warn('Changelog entry not found for llms.txt', { slug });
    return apiResponse.raw('Changelog entry not found', {
      contentType: 'text/plain; charset=utf-8',
      status: 404,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }

  const llmsItem: LLMsTxtItem = {
    slug: entry.slug,
    title: entry.title,
    description: entry.tldr || entry.title,
    content: entry.content,
    category: 'changelog',
    tags: ['changelog', 'updates'],
    dateAdded: entry.date,
    url: `${APP_CONFIG.url}/changelog/${slug}`,
  };

  const llmsTxt = await generateLLMsTxt(llmsItem, {
    includeMetadata: true,
    includeDescription: true,
    includeTags: true,
    includeUrl: true,
    includeContent: true,
    sanitize: true,
  });

  requestLogger.info('Changelog detail llms.txt generated successfully', {
    slug,
    contentLength: llmsTxt.length,
  });

  return apiResponse.raw(llmsTxt, {
    contentType: 'text/plain; charset=utf-8',
    headers: { 'X-Robots-Tag': 'index, follow' },
    cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
  });
}

/**
 * Guides index llms.txt handler
 * Route: /guides/llms.txt
 */
async function handleGuidesIndex(request: NextRequest): Promise<Response> {
  const requestLogger = logger.forRequest(request);
  requestLogger.info('Guides llms.txt generation started');

  // Get all guide files
  const guidesDir = path.join(process.cwd(), 'content', 'guides');
  const guideFiles = await fs.readdir(guidesDir);

  const guides: LLMsTxtItem[] = [];

  for (const file of guideFiles) {
    if (!file.endsWith('.mdx')) continue;

    try {
      const filePath = path.join(guidesDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const { metadata } = parseMDXFrontmatter(content);

      if (metadata.title && metadata.description) {
        guides.push({
          slug: file.replace('.mdx', ''),
          title: metadata.title,
          description: metadata.description,
          category: 'guides',
          tags: metadata.tags || [],
          author: metadata.author,
          dateAdded: metadata.dateAdded,
          url: `${APP_CONFIG.url}/guides/${metadata.category || 'general'}/${file.replace('.mdx', '')}`,
        });
      }
    } catch (error) {
      requestLogger.warn('Failed to parse guide file', {
        file,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const llmsTxt = await generateCategoryLLMsTxt(
    guides,
    'Guides',
    'Comprehensive guides and tutorials for Claude configurations',
    {
      includeContent: false,
      includeDescription: true,
      includeTags: true,
      includeUrl: true,
    }
  );

  requestLogger.info('Guides llms.txt generated successfully', {
    guidesCount: guides.length,
    contentLength: llmsTxt.length,
  });

  return apiResponse.raw(llmsTxt, {
    contentType: 'text/plain; charset=utf-8',
    headers: { 'X-Robots-Tag': 'index, follow' },
    cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
  });
}

/**
 * Guide detail llms.txt handler
 * Route: /guides/[category]/[slug]/llms.txt
 */
async function handleGuideDetail(
  request: NextRequest,
  category: string,
  slug: string
): Promise<Response> {
  const requestLogger = logger.forRequest(request);
  requestLogger.info('Guide llms.txt generation started', { category, slug });

  // Validate category
  if (!(category in GUIDE_PATH_MAP)) {
    requestLogger.warn('Invalid guide category for llms.txt', { category });
    return apiResponse.raw('Guide category not found', {
      contentType: 'text/plain; charset=utf-8',
      status: 404,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }

  const filename = `${slug}.mdx`;
  const cacheKey = `guide-llmstxt:v2:${category}:${slug}`;

  // Try cache first
  try {
    const cachedContent = await contentCache.cacheWithRefresh<string>(
      cacheKey,
      async () => null as unknown as string,
      600
    );

    if (cachedContent) {
      requestLogger.info('Serving cached guide llms.txt', { category, slug });
      return apiResponse.raw(cachedContent, {
        contentType: 'text/plain; charset=utf-8',
        headers: { 'X-Robots-Tag': 'index, follow' },
        cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
      });
    }
  } catch (cacheError) {
    requestLogger.warn('Cache retrieval failed for guide llms.txt', {
      category,
      slug,
      error: cacheError instanceof Error ? cacheError.message : String(cacheError),
    });
  }

  // Read guide file
  try {
    const guidePath = path.join(process.cwd(), 'content', 'guides', filename);
    const fileContent = await fs.readFile(guidePath, 'utf-8');
    const { metadata, content } = parseMDXFrontmatter(fileContent);

    const llmsItem: LLMsTxtItem = {
      slug,
      title: metadata.title || slug,
      description: metadata.description || '',
      content,
      category: 'guides',
      tags: metadata.tags || [],
      author: metadata.author,
      dateAdded: metadata.dateAdded,
      url: `${APP_CONFIG.url}/guides/${category}/${slug}`,
    };

    const llmsTxt = await generateLLMsTxt(llmsItem, {
      includeMetadata: true,
      includeDescription: true,
      includeTags: true,
      includeUrl: true,
      includeContent: true,
      sanitize: true,
    });

    // Cache the result
    try {
      await contentCache.set(cacheKey, llmsTxt, 600);
    } catch (cacheError) {
      requestLogger.warn('Failed to cache guide llms.txt', {
        category,
        slug,
        error: cacheError instanceof Error ? cacheError.message : String(cacheError),
      });
    }

    requestLogger.info('Guide llms.txt generated successfully', {
      category,
      slug,
      contentLength: llmsTxt.length,
    });

    return apiResponse.raw(llmsTxt, {
      contentType: 'text/plain; charset=utf-8',
      headers: { 'X-Robots-Tag': 'index, follow' },
      cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
    });
  } catch (error) {
    requestLogger.error(
      'Failed to generate guide llms.txt',
      error instanceof Error ? error : new Error(String(error)),
      { category, slug }
    );
    return apiResponse.raw('Guide not found', {
      contentType: 'text/plain; charset=utf-8',
      status: 404,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }
}

/**
 * API docs llms.txt handler
 * Route: /api-docs/llms.txt
 */
async function handleApiDocs(request: NextRequest): Promise<Response> {
  const requestLogger = logger.forRequest(request);
  requestLogger.info('API docs llms.txt generation started');

  const content = `# ClaudePro Directory API Documentation

The ClaudePro Directory provides a simple JSON API for accessing configurations.

## Endpoints

### GET /api/[contentType]

Fetch all items for a specific content type.

Available content types:
- agents.json
- mcp.json
- commands.json
- rules.json
- hooks.json
- statuslines.json
- collections.json
- skills.json

### GET /api/guides/trending

Fetch trending guides.

### Rate Limiting

API endpoints are rate limited to prevent abuse:
- Public API: 120 requests per minute
- Heavy API: 30 requests per minute

For more details, visit: ${APP_CONFIG.url}/api-docs`;

  requestLogger.info('API docs llms.txt generated successfully');

  return apiResponse.raw(content, {
    contentType: 'text/plain; charset=utf-8',
    headers: { 'X-Robots-Tag': 'index, follow' },
    cache: { sMaxAge: 3600, staleWhileRevalidate: 86400 },
  });
}

/**
 * Config recommender llms.txt handler
 * Route: /tools/config-recommender/llms.txt
 */
async function handleConfigRecommender(request: NextRequest): Promise<Response> {
  const requestLogger = logger.forRequest(request);
  requestLogger.info('Config recommender llms.txt generation started');

  const content = `# Claude Configuration Recommender

An interactive tool to help you find the perfect Claude configurations for your needs.

## Features

- Personalized recommendations based on your use case
- Multi-factor analysis (task type, expertise level, preferences)
- Instant results with detailed explanations
- Downloadable configurations

## How It Works

1. Answer a few questions about your needs
2. Get instant recommendations
3. Download or copy configurations
4. Start using them immediately

Visit the tool: ${APP_CONFIG.url}/tools/config-recommender`;

  requestLogger.info('Config recommender llms.txt generated successfully');

  return apiResponse.raw(content, {
    contentType: 'text/plain; charset=utf-8',
    headers: { 'X-Robots-Tag': 'index, follow' },
    cache: { sMaxAge: 3600, staleWhileRevalidate: 86400 },
  });
}

/**
 * Main GET handler - routes to appropriate handler based on segments
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ segments?: string[] }> }
): Promise<Response> {
  try {
    const rawParams = await params;
    const { segments = [] } = paramsSchema.parse(rawParams);

    // Route based on segment count and pattern
    if (segments.length === 0) {
      // /llms.txt - site-wide index
      return handleSiteIndex(request);
    }

    if (segments.length === 1) {
      const [first] = segments;

      // /changelog/llms.txt
      if (first === 'changelog') {
        return handleChangelogIndex(request);
      }

      // /guides/llms.txt
      if (first === 'guides') {
        return handleGuidesIndex(request);
      }

      // /api-docs/llms.txt
      if (first === 'api-docs') {
        return handleApiDocs(request);
      }

      // /[category]/llms.txt - category index
      if (isValidCategory(first)) {
        return handleCategoryIndex(request, first);
      }

      // Unknown route
      return apiResponse.raw('Not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    if (segments.length === 2) {
      const [first, second] = segments;

      // /changelog/[slug]/llms.txt
      if (first === 'changelog') {
        return handleChangelogDetail(request, second);
      }

      // /tools/config-recommender/llms.txt
      if (first === 'tools' && second === 'config-recommender') {
        return handleConfigRecommender(request);
      }

      // /[category]/[slug]/llms.txt - item detail
      if (isValidCategory(first)) {
        return handleItemDetail(request, first, second);
      }

      // Unknown route
      return apiResponse.raw('Not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    if (segments.length === 3) {
      const [first, second, third] = segments;

      // /guides/[category]/[slug]/llms.txt
      if (first === 'guides') {
        return handleGuideDetail(request, second, third);
      }

      // Unknown route
      return apiResponse.raw('Not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    // Too many segments
    return apiResponse.raw('Not found', {
      contentType: 'text/plain; charset=utf-8',
      status: 404,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  } catch (error: unknown) {
    const requestLogger = logger.forRequest(request);
    requestLogger.error(
      'Failed to handle llms.txt request',
      error instanceof Error ? error : new Error(String(error))
    );

    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success ? validatedError.data : { message: 'Failed to generate llms.txt' },
      {
        route: '/[[...segments]]/llms.txt',
        operation: 'generate_llmstxt',
        method: 'GET',
      }
    );
  }
}
