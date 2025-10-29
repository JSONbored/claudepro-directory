/**
 * Markdown Export Actions - Database-First Architecture
 * Generates markdown from database content for copy/download. Rate limited.
 */

'use server';

import { z } from 'zod';
import { APP_CONFIG } from '@/src/lib/constants';
import { getContentBySlug } from '@/src/lib/content/supabase-content-loader';
import { logger } from '@/src/lib/logger';
import { rateLimitedAction } from './safe-action';

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

const markdownExportResponseSchema = z.object({
  success: z.boolean(),
  markdown: z.string().optional(),
  filename: z.string().optional(),
  error: z.string().optional(),
  length: z.number().optional(),
});

export type MarkdownExportInput = z.infer<typeof markdownExportSchema>;
export type MarkdownExportResponse = z.infer<typeof markdownExportResponseSchema>;

function generateMarkdownContent(
  item: {
    slug: string;
    title?: string | undefined;
    seoTitle?: string | undefined;
    description?: string | undefined;
    category: string;
    author?: string | undefined;
    date_added?: string | undefined;
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
    if (item.seo_title) {
      sections.push(`seoTitle: "${item.seo_title}"`);
    }
    if (item.description) {
      // Security: Escape backslashes FIRST, then quotes (order matters for YAML injection prevention)
      const escapedDesc = item.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      sections.push(`description: "${escapedDesc}"`);
    }
    sections.push(`category: ${item.category}`);
    sections.push(`slug: ${item.slug}`);
    if (item.author) {
      sections.push(`author: ${item.author}`);
    }
    if (item.date_added) {
      sections.push(`date_added: ${item.date_added}`);
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
  if (item.date_added) {
    sections.push(`- **Date Added**: ${item.date_added}`);
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
  if (item.use_cases && Array.isArray(item.use_cases) && item.use_cases.length > 0) {
    sections.push('## Use Cases\n');
    for (const useCase of item.use_cases) {
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

export const copyMarkdownAction = rateLimitedAction
  .metadata({
    actionName: 'copyMarkdown',
    category: 'content',
  })
  .schema(markdownExportSchema)
  .action(
    async ({
      parsedInput: { category, slug, includeMetadata, includeFooter },
    }): Promise<MarkdownExportResponse> => {
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
    }
  );

export const downloadMarkdownAction = rateLimitedAction
  .metadata({
    actionName: 'downloadMarkdown',
    category: 'content',
  })
  .schema(markdownExportSchema.omit({ includeMetadata: true, includeFooter: true }))
  .action(async ({ parsedInput: { category, slug } }): Promise<MarkdownExportResponse> => {
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
