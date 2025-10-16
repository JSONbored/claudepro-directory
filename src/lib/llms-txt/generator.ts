/**
 * LLMs.txt Content Generator
 * Generates AI-optimized plain text content for LLM consumption
 *
 * @module llms-txt/generator
 * @see {@link https://llmstxt.org} - LLMs.txt specification by Jeremy Howard
 */

import { z } from 'zod';
import { SEO_CONFIG } from '@/src/lib/config/seo-config';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { type SanitizationOptions, sanitizeContent } from './content-sanitizer';
import { type ConversionOptions, markdownToPlainText } from './markdown-to-plain';

/**
 * Schema for content item metadata
 * @description Minimal required fields for generating llms.txt content
 */
export const llmsTxtItemSchema = z
  .object({
    slug: z.string().min(1).describe('Content item slug/identifier'),
    title: z.string().min(1).describe('Content title (no length limit for AI consumption)'),
    description: z
      .string()
      .min(1)
      .describe('Content description (short summary - no artificial length limits)'),
    content: z
      .string()
      .optional()
      .describe('Full content (markdown/plain text) - unlimited length for complete AI context'),
    category: z.string().min(1).describe('Content category (agents, mcp, rules, etc)'),
    tags: z.array(z.string()).default([]).describe('Content tags'),
    author: z.string().optional().describe('Content author'),
    dateAdded: z.string().optional().describe('Date added (ISO format)'),
    url: z.string().url().optional().describe('Full URL to content'),
  })
  .describe('Content item for llms.txt generation - no length limits for AI consumption');

/**
 * Schema for llms.txt generation options
 * @description Configuration for content generation behavior
 */
export const llmsTxtOptionsSchema = z
  .object({
    includeMetadata: z.boolean().default(true).describe('Include metadata (author, date, tags)'),
    includeUrl: z.boolean().default(true).describe('Include canonical URL'),
    includeDescription: z.boolean().default(true).describe('Include content description'),
    includeTags: z.boolean().default(true).describe('Include tags list'),
    includeContent: z.boolean().default(true).describe('Include full content (if available)'),
    sanitize: z.boolean().default(true).describe('Apply PII sanitization'),
    markdownOptions: z
      .custom<Partial<ConversionOptions>>()
      .optional()
      .describe('Markdown conversion options'),
    sanitizationOptions: z
      .custom<Partial<SanitizationOptions>>()
      .optional()
      .describe('Content sanitization options'),
  })
  .describe('Options for llms.txt generation');

/**
 * Type exports
 */
export type LLMsTxtItem = z.infer<typeof llmsTxtItemSchema>;
export type LLMsTxtOptions = z.infer<typeof llmsTxtOptionsSchema>;

/**
 * Format date for display
 * @param dateStr - ISO date string
 * @returns Formatted date (Month YYYY)
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generate llms.txt header section
 * @param title - Page title
 * @param description - Page description
 * @returns Formatted header
 *
 * @internal
 */
function generateHeader(title: string, description: string): string {
  return `# ${title}

${description}

---

`;
}

/**
 * Generate llms.txt footer section
 * @param url - Canonical URL (optional)
 * @returns Formatted footer
 *
 * @internal
 */
function generateFooter(url?: string): string {
  let footer = '\n\n---\n\n';
  footer += `Source: ${APP_CONFIG.name}\n`;
  footer += `Website: ${APP_CONFIG.url}\n`;

  if (url) {
    footer += `URL: ${url}\n`;
  }

  footer += '\nThis content is optimized for Large Language Models (LLMs).\n';
  footer += 'For full formatting and interactive features, visit the website.\n';

  return footer;
}

/**
 * Generate llms.txt content for a single item
 *
 * @param item - Content item to generate llms.txt for
 * @param options - Generation options (optional)
 * @returns Plain text optimized for LLM consumption
 *
 * @throws {Error} If item validation fails or generation encounters errors
 *
 * @example
 * ```ts
 * const llmsTxt = await generateLLMsTxt({
 *   slug: "github-mcp-server",
 *   title: "GitHub MCP Server",
 *   description: "Official GitHub MCP server...",
 *   category: "mcp",
 *   tags: ["github", "git", "api"],
 *   content: "# GitHub MCP Server\n\n...",
 *   url: "https://claudepro.directory/mcp/github-mcp-server"
 * });
 * ```
 */
export async function generateLLMsTxt(
  item: LLMsTxtItem,
  options?: Partial<LLMsTxtOptions>
): Promise<string> {
  try {
    // Validate input
    const validatedItem = llmsTxtItemSchema.parse(item);
    const opts = llmsTxtOptionsSchema.parse(options || {});

    const sections: string[] = [];

    // Header
    sections.push(generateHeader(validatedItem.title, validatedItem.description));

    // Metadata section (H2 per llmstxt.org spec)
    if (opts.includeMetadata) {
      const metadata: string[] = [];

      metadata.push('## Metadata');
      metadata.push('');

      // Add Title field for validation compatibility
      metadata.push(`**Title:** ${validatedItem.title}`);

      if (validatedItem.category) {
        metadata.push(`**Category:** ${validatedItem.category}`);
      }

      if (validatedItem.author && opts.includeMetadata) {
        metadata.push(`**Author:** ${validatedItem.author}`);
      }

      if (validatedItem.dateAdded) {
        metadata.push(`**Added:** ${formatDate(validatedItem.dateAdded)}`);
      }

      if (validatedItem.tags && validatedItem.tags.length > 0 && opts.includeTags) {
        metadata.push(`**Tags:** ${validatedItem.tags.join(', ')}`);
      }

      if (validatedItem.url && opts.includeUrl) {
        metadata.push(`**URL:** ${validatedItem.url}`);
      }

      sections.push(metadata.join('\n'));
      sections.push(''); // Empty line
    }

    // Description section (H2 per llmstxt.org spec)
    if (opts.includeDescription && validatedItem.description) {
      sections.push('## Overview');
      sections.push('');
      sections.push(validatedItem.description);
      sections.push(''); // Empty line
    }

    // Content section (H2 per llmstxt.org spec)
    if (opts.includeContent && validatedItem.content) {
      sections.push('## Content');
      sections.push('');

      // Convert markdown to plain text
      const plainText = await markdownToPlainText(validatedItem.content, opts.markdownOptions);

      // Sanitize if requested
      let finalContent = plainText;
      if (opts.sanitize) {
        finalContent = sanitizeContent(finalContent, opts.sanitizationOptions);
      }

      sections.push(finalContent);
    }

    // Footer
    sections.push(generateFooter(opts.includeUrl ? validatedItem.url : undefined));

    // Join all sections
    const result = sections.join('\n');

    return result;
  } catch (error) {
    logger.error(
      'Failed to generate llms.txt content',
      error instanceof Error ? error : new Error(String(error)),
      {
        slug: item?.slug || 'unknown',
        category: item?.category || 'unknown',
        hasContent: !!item?.content,
      }
    );
    throw new Error(`Failed to generate llms.txt for ${item?.slug || 'unknown'}`);
  }
}

/**
 * Generate llms.txt content for a category/collection of items
 *
 * @param items - Array of content items
 * @param categoryName - Category name (e.g., "MCP Servers", "Commands")
 * @param categoryDescription - Category description
 * @param options - Generation options (optional)
 * @returns Plain text index optimized for LLM consumption
 *
 * @example
 * ```ts
 * const llmsTxt = await generateCategoryLLMsTxt(
 *   mcpServers,
 *   "MCP Servers",
 *   "Collection of Model Context Protocol servers for Claude",
 *   { includeContent: false } // Summary only
 * );
 * ```
 */
export async function generateCategoryLLMsTxt(
  items: LLMsTxtItem[],
  categoryName: string,
  categoryDescription: string,
  options?: Partial<LLMsTxtOptions>
): Promise<string> {
  try {
    const opts = llmsTxtOptionsSchema.parse(options || {});

    const sections: string[] = [];

    // Header with category marker for validation
    sections.push(`# Category: ${categoryName}\n`);
    sections.push(categoryDescription);
    sections.push('\n---\n');

    // Index section (H2 per llmstxt.org spec)
    sections.push('## Index');
    sections.push('');
    sections.push(`Total items: ${items.length}\n`);

    // List each item with enhanced details
    for (const item of items) {
      const validatedItem = llmsTxtItemSchema.parse(item);

      // Item title as bullet point
      sections.push(`• **${validatedItem.title}**`);

      // Description (truncated for index)
      if (opts.includeDescription && validatedItem.description) {
        sections.push(
          `  ${validatedItem.description.substring(0, 150)}${validatedItem.description.length > 150 ? '...' : ''}`
        );
      }

      // URL (for AI navigation)
      if (opts.includeUrl && validatedItem.url) {
        sections.push(`  🔗 ${validatedItem.url}`);
      }

      // Tags (for AI categorization)
      if (opts.includeTags && validatedItem.tags && validatedItem.tags.length > 0) {
        sections.push(`  🏷️ Tags: ${validatedItem.tags.slice(0, 5).join(', ')}`);
      }

      // Author (for AI attribution)
      if (validatedItem.author) {
        sections.push(`  👤 Author: ${validatedItem.author}`);
      }

      sections.push(''); // Empty line between items
    }

    // Popular Tags Section (AI categorization helper)
    const allTags = items.flatMap((item) => item.tags || []);
    const tagCounts = allTags.reduce(
      (acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag);

    if (topTags.length > 0) {
      sections.push('');
      sections.push('## Popular Tags');
      sections.push('');
      sections.push(topTags.join(', '));
      sections.push('');
    }

    // Footer
    const categoryUrl = `${APP_CONFIG.url}/${categoryName.toLowerCase().replace(/\s+/g, '-')}`;
    sections.push(generateFooter(opts.includeUrl ? categoryUrl : undefined));

    return sections.join('\n');
  } catch (error) {
    logger.error(
      'Failed to generate category llms.txt',
      error instanceof Error ? error : new Error(String(error)),
      {
        categoryName,
        itemCount: items?.length || 0,
      }
    );
    throw new Error(`Failed to generate llms.txt for category: ${categoryName}`);
  }
}

/**
 * Generate site-wide llms.txt index
 *
 * @param categoryStats - Statistics for each category
 * @returns Plain text site index optimized for LLM consumption
 *
 * @example
 * ```ts
 * const llmsTxt = await generateSiteLLMsTxt([
 *   { name: "MCP Servers", count: 40, url: "/mcp" },
 *   { name: "Commands", count: 12, url: "/commands" },
 * ]);
 * ```
 */
export async function generateSiteLLMsTxt(
  categoryStats: Array<{
    name: string;
    count: number;
    url: string;
    description: string;
  }>
): Promise<string> {
  try {
    const sections: string[] = [];

    // Header
    sections.push(generateHeader(APP_CONFIG.name, SEO_CONFIG.defaultDescription));

    // Categories section (H2 per llmstxt.org spec) - Enhanced for AI
    sections.push('## Categories');
    sections.push('');

    for (const category of categoryStats) {
      sections.push(`### ${category.name} (${category.count} items)`);
      sections.push('');
      sections.push(category.description);
      sections.push('');
      sections.push(`- **Browse:** ${APP_CONFIG.url}${category.url}`);
      sections.push(`- **LLMs.txt:** ${APP_CONFIG.url}${category.url}/llms.txt`);
      sections.push('');
    }

    // Navigation section (H2 per llmstxt.org spec) - Enhanced with descriptions
    sections.push('## Navigation');
    sections.push('');
    sections.push(`- **[Homepage](${APP_CONFIG.url})** - Explore all configurations`);
    sections.push(
      `- **[Trending](${APP_CONFIG.url}/trending)** - Popular configurations this week`
    );
    sections.push(`- **[Submit](${APP_CONFIG.url}/submit)** - Contribute your own configuration`);
    sections.push(`- **[Guides](${APP_CONFIG.url}/guides)** - Tutorials and best practices`);
    sections.push(`- **[Changelog](${APP_CONFIG.url}/changelog)** - Latest updates`);
    sections.push(`- **[Jobs](${APP_CONFIG.url}/jobs)** - Claude-related job opportunities`);

    // Footer
    sections.push(generateFooter(APP_CONFIG.url));

    return sections.join('\n');
  } catch (error) {
    logger.error(
      'Failed to generate site llms.txt',
      error instanceof Error ? error : new Error(String(error))
    );
    throw new Error('Failed to generate site llms.txt');
  }
}
