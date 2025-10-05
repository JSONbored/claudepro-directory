/**
 * Markdown Export Server Actions
 *
 * Type-safe server actions for markdown content export functionality.
 * Provides copy and download capabilities for content items.
 *
 * October 2025 Production Standards:
 * - next-safe-action for type safety and validation
 * - Rate limiting: 50 requests per 60 seconds per IP
 * - Redis caching for performance
 * - Comprehensive logging and error handling
 * - Analytics-ready action tracking
 *
 * @module lib/actions/markdown-actions
 */

'use server';

import { z } from 'zod';
import { APP_CONFIG } from '@/src/lib/constants';
import { getContentBySlug } from '@/src/lib/content/content-loaders';
import { logger } from '@/src/lib/logger';
import { contentCache } from '@/src/lib/redis';
import { rateLimitedAction } from './safe-action';

/**
 * Schema for markdown export request
 */
const markdownExportSchema = z.object({
  category: z
    .string()
    .min(1)
    .max(50)
    .describe('Content category (agents, mcp, commands, rules, hooks, statuslines, collections)'),
  slug: z.string().min(1).max(200).describe('Content slug identifier'),
  includeMetadata: z.boolean().default(true).describe('Include YAML frontmatter'),
  includeFooter: z.boolean().default(true).describe('Include attribution footer'),
});

/**
 * Schema for markdown export response
 */
const markdownExportResponseSchema = z.object({
  success: z.boolean(),
  markdown: z.string().optional(),
  filename: z.string().optional(),
  error: z.string().optional(),
  length: z.number().optional(),
});

export type MarkdownExportInput = z.infer<typeof markdownExportSchema>;
export type MarkdownExportResponse = z.infer<typeof markdownExportResponseSchema>;

/**
 * Generate markdown content from content item
 * Internal utility function used by both copy and download actions
 */
function generateMarkdownContent(
  item: {
    slug: string;
    title?: string | undefined;
    seoTitle?: string | undefined;
    description?: string | undefined;
    category: string;
    author?: string | undefined;
    dateAdded?: string | undefined;
    tags?: string[] | undefined;
    content?: string | undefined;
    features?: string[] | undefined;
    useCases?: string[] | undefined;
    configuration?: Record<string, unknown> | undefined;
    [key: string]: unknown;
  },
  options: {
    includeMetadata: boolean;
    includeFooter: boolean;
  }
): string {
  const sections: string[] = [];

  // YAML Frontmatter
  if (options.includeMetadata) {
    sections.push('---');
    sections.push(`title: "${item.title || item.slug}"`);
    if (item.seoTitle) {
      sections.push(`seoTitle: "${item.seoTitle}"`);
    }
    if (item.description) {
      sections.push(`description: "${item.description.replace(/"/g, '\\"')}"`);
    }
    sections.push(`category: ${item.category}`);
    sections.push(`slug: ${item.slug}`);
    if (item.author) {
      sections.push(`author: ${item.author}`);
    }
    if (item.dateAdded) {
      sections.push(`dateAdded: ${item.dateAdded}`);
    }
    if (item.tags && item.tags.length > 0) {
      sections.push('tags:');
      for (const tag of item.tags) {
        sections.push(`  - ${tag}`);
      }
    }
    sections.push(`url: ${APP_CONFIG.url}/${item.category}/${item.slug}`);
    sections.push('---\n');
  }

  // Title
  sections.push(`# ${item.title || item.slug}\n`);

  // Description
  if (item.description) {
    sections.push(`${item.description}\n`);
  }

  // Metadata section
  sections.push('## Metadata\n');
  sections.push(`- **Category**: ${item.category}`);
  sections.push(`- **Author**: ${item.author || 'Community'}`);
  if (item.dateAdded) {
    sections.push(`- **Date Added**: ${item.dateAdded}`);
  }
  sections.push(`- **URL**: ${APP_CONFIG.url}/${item.category}/${item.slug}\n`);

  // Tags
  if (item.tags && item.tags.length > 0) {
    sections.push('## Tags\n');
    sections.push(`${item.tags.map((tag) => `\`${tag}\``).join(' ')}\n`);
  }

  // Features
  if (item.features && Array.isArray(item.features) && item.features.length > 0) {
    sections.push('## Features\n');
    for (const feature of item.features) {
      sections.push(`- ${feature}`);
    }
    sections.push('');
  }

  // Use Cases
  if (item.useCases && Array.isArray(item.useCases) && item.useCases.length > 0) {
    sections.push('## Use Cases\n');
    for (const useCase of item.useCases) {
      sections.push(`- ${useCase}`);
    }
    sections.push('');
  }

  // Main Content
  if (item.content) {
    sections.push('## Content\n');
    sections.push(item.content);
    sections.push('');
  }

  // Configuration
  if (item.configuration) {
    sections.push('## Configuration\n');
    sections.push('```json');
    sections.push(JSON.stringify(item.configuration, null, 2));
    sections.push('```\n');
  }

  // Footer with attribution
  if (options.includeFooter) {
    sections.push('---\n');
    sections.push('## About This Content\n');
    sections.push(
      `This content was sourced from [Claude Pro Directory](${APP_CONFIG.url}), a community-driven repository of Claude configurations, prompts, and tools.\n`
    );
    sections.push(`**Original URL**: ${APP_CONFIG.url}/${item.category}/${item.slug}\n`);
    sections.push(`**Author**: ${item.author || 'Community Contribution'}\n`);
    sections.push(`*Generated on ${new Date().toISOString().split('T')[0]}*`);
  }

  return sections.join('\n');
}

/**
 * Copy Markdown Action
 *
 * Returns markdown content for clipboard copy functionality.
 * Rate limited to 50 requests per 60 seconds per IP.
 *
 * @example
 * ```tsx
 * const { execute, status } = useAction(copyMarkdownAction);
 *
 * const handleCopy = async () => {
 *   const result = await execute({ category: 'agents', slug: 'api-builder' });
 *   if (result?.data?.success) {
 *     await navigator.clipboard.writeText(result.data.markdown);
 *   }
 * };
 * ```
 */
export const copyMarkdownAction = rateLimitedAction
  .metadata({
    actionName: 'copyMarkdown',
    category: 'content',
    rateLimit: {
      maxRequests: 50, // 50 copies per minute
      windowSeconds: 60,
    },
  })
  .schema(markdownExportSchema)
  .action(async ({ parsedInput: { category, slug, includeMetadata, includeFooter }, ctx }) => {
    try {
      logger.info('Copy markdown action started', {
        category,
        slug,
        clientIP: ctx.clientIP,
      });

      // Check cache first
      const cacheKey = `markdown:copy:${category}:${slug}:${includeMetadata}:${includeFooter}`;
      if (contentCache.isEnabled()) {
        const cached = await contentCache.getAPIResponse<string>(cacheKey);
        if (cached) {
          logger.info('Serving cached markdown for copy', {
            category,
            slug,
            source: 'redis-cache',
          });
          return {
            success: true,
            markdown: cached,
            filename: `${slug}.md`,
            length: cached.length,
          };
        }
      }

      // Load content
      const item = await getContentBySlug(category, slug);

      if (!item) {
        logger.warn('Content not found for markdown copy', { category, slug });
        return {
          success: false,
          error: `Content not found: ${category}/${slug}`,
        };
      }

      // Generate markdown
      const markdown = generateMarkdownContent(item, {
        includeMetadata,
        includeFooter,
      });

      // Cache the result for 1 hour
      if (contentCache.isEnabled()) {
        await contentCache
          .cacheAPIResponse(cacheKey, markdown, 3600)
          .catch((err) => logger.warn('Failed to cache markdown', { category, slug, error: err }));
      }

      logger.info('Markdown copy action completed', {
        category,
        slug,
        length: markdown.length,
      });

      return {
        success: true,
        markdown,
        filename: `${slug}.md`,
        length: markdown.length,
      };
    } catch (error) {
      logger.error(
        'Copy markdown action failed',
        error instanceof Error ? error : new Error(String(error)),
        { category, slug }
      );
      return {
        success: false,
        error: 'Failed to generate markdown content',
      };
    }
  });

/**
 * Download Markdown Action
 *
 * Returns markdown content optimized for file download.
 * Includes full metadata and attribution.
 * Rate limited to 30 requests per 60 seconds per IP.
 *
 * @example
 * ```tsx
 * const { execute, status } = useAction(downloadMarkdownAction);
 *
 * const handleDownload = async () => {
 *   const result = await execute({ category: 'agents', slug: 'api-builder' });
 *   if (result?.data?.success) {
 *     const blob = new Blob([result.data.markdown], { type: 'text/markdown' });
 *     const url = URL.createObjectURL(blob);
 *     const a = document.createElement('a');
 *     a.href = url;
 *     a.download = result.data.filename;
 *     a.click();
 *   }
 * };
 * ```
 */
export const downloadMarkdownAction = rateLimitedAction
  .metadata({
    actionName: 'downloadMarkdown',
    category: 'content',
    rateLimit: {
      maxRequests: 30, // 30 downloads per minute (stricter than copy)
      windowSeconds: 60,
    },
  })
  .schema(markdownExportSchema.omit({ includeMetadata: true, includeFooter: true }))
  .action(async ({ parsedInput: { category, slug }, ctx }) => {
    try {
      logger.info('Download markdown action started', {
        category,
        slug,
        clientIP: ctx.clientIP,
      });

      // Always include metadata and footer for downloads
      const cacheKey = `markdown:download:${category}:${slug}`;
      if (contentCache.isEnabled()) {
        const cached = await contentCache.getAPIResponse<string>(cacheKey);
        if (cached) {
          logger.info('Serving cached markdown for download', {
            category,
            slug,
            source: 'redis-cache',
          });
          return {
            success: true,
            markdown: cached,
            filename: `${slug}.md`,
            length: cached.length,
          };
        }
      }

      // Load content
      const item = await getContentBySlug(category, slug);

      if (!item) {
        logger.warn('Content not found for markdown download', { category, slug });
        return {
          success: false,
          error: `Content not found: ${category}/${slug}`,
        };
      }

      // Generate markdown with full metadata and footer
      const markdown = generateMarkdownContent(item, {
        includeMetadata: true,
        includeFooter: true,
      });

      // Cache the result for 1 hour
      if (contentCache.isEnabled()) {
        await contentCache
          .cacheAPIResponse(cacheKey, markdown, 3600)
          .catch((err) => logger.warn('Failed to cache markdown', { category, slug, error: err }));
      }

      logger.info('Markdown download action completed', {
        category,
        slug,
        length: markdown.length,
      });

      return {
        success: true,
        markdown,
        filename: `${slug}.md`,
        length: markdown.length,
      };
    } catch (error) {
      logger.error(
        'Download markdown action failed',
        error instanceof Error ? error : new Error(String(error)),
        { category, slug }
      );
      return {
        success: false,
        error: 'Failed to generate markdown content',
      };
    }
  });
