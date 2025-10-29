/**
 * Markdown Export Actions - Database-First Architecture
 * Generates markdown from database content for copy/download. Rate limited.
 */

'use server';

import { z } from 'zod';
import { APP_CONFIG } from '@/src/lib/constants';
import { type ContentItem, getContentBySlug } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { publicContentCategorySchema } from '@/src/lib/schemas/generated/db-schemas';
import { rateLimitedAction } from './safe-action';

const markdownExportSchema = z.object({
  category: publicContentCategorySchema,
  slug: z.string().min(1).max(200),
  includeMetadata: z.boolean().default(true),
  includeFooter: z.boolean().default(true),
});

export type MarkdownExportInput = z.infer<typeof markdownExportSchema>;

function generateMarkdownContent(
  item: ContentItem,
  options: {
    includeMetadata: boolean;
    includeFooter: boolean;
  }
): string {
  const sections: string[] = [];

  if (options.includeMetadata) {
    sections.push('---');
    sections.push(`title: "${item.title || item.slug}"`);
    if (item.description) {
      const escapedDesc = item.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      sections.push(`description: "${escapedDesc}"`);
    }
    sections.push(`category: ${item.category}`);
    sections.push(`slug: ${item.slug}`);
    if ('author' in item && item.author) {
      sections.push(`author: ${item.author}`);
    }
    if ('date_added' in item && item.date_added) {
      sections.push(`date_added: ${item.date_added}`);
    }
    if ('tags' in item && Array.isArray(item.tags) && item.tags.length > 0) {
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
  sections.push(`- **Author**: ${('author' in item && item.author) || 'Community'}`);
  if ('date_added' in item && item.date_added) {
    sections.push(`- **Date Added**: ${item.date_added}`);
  }
  sections.push(`- **URL**: ${APP_CONFIG.url}/${item.category}/${item.slug}\n`);

  // Tags
  if ('tags' in item && Array.isArray(item.tags) && item.tags.length > 0) {
    sections.push('## Tags\n');
    sections.push(`${(item.tags as string[]).map((tag: string) => `\`${tag}\``).join(' ')}\n`);
  }

  if ('features' in item && Array.isArray(item.features) && item.features.length > 0) {
    sections.push('## Features\n');
    for (const feature of item.features) {
      sections.push(`- ${feature}`);
    }
    sections.push('');
  }

  if ('use_cases' in item && Array.isArray(item.use_cases) && item.use_cases.length > 0) {
    sections.push('## Use Cases\n');
    for (const useCase of item.use_cases) {
      sections.push(`- ${useCase}`);
    }
    sections.push('');
  }

  // Footer with attribution
  if (options.includeFooter) {
    sections.push('---\n');
    sections.push('## About This Content\n');
    sections.push(
      `This content was sourced from [Claude Pro Directory](${APP_CONFIG.url}), a community-driven repository of Claude configurations, prompts, and tools.\n`
    );
    sections.push(`**Original URL**: ${APP_CONFIG.url}/${item.category}/${item.slug}\n`);
    sections.push(`**Author**: ${('author' in item && item.author) || 'Community Contribution'}\n`);
    sections.push(`*Generated on ${new Date().toISOString().split('T')[0]}*`);
  }

  return sections.join('\n');
}

export const copyMarkdownAction = rateLimitedAction
  .metadata({
    actionName: 'copyMarkdown',
    category: 'content',
  })
  .schema(markdownExportSchema)
  .action(async ({ parsedInput: { category, slug, includeMetadata, includeFooter } }) => {
    try {
      const item = await getContentBySlug(category, slug);

      if (!item) {
        return {
          success: false,
          error: `Content not found: ${category}/${slug}`,
        };
      }

      const markdown = generateMarkdownContent(item, {
        includeMetadata,
        includeFooter,
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

export const downloadMarkdownAction = rateLimitedAction
  .metadata({
    actionName: 'downloadMarkdown',
    category: 'content',
  })
  .schema(markdownExportSchema.omit({ includeMetadata: true, includeFooter: true }))
  .action(async ({ parsedInput: { category, slug } }) => {
    try {
      const item = await getContentBySlug(category, slug);

      if (!item) {
        return {
          success: false,
          error: `Content not found: ${category}/${slug}`,
        };
      }

      const markdown = generateMarkdownContent(item, {
        includeMetadata: true,
        includeFooter: true,
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
